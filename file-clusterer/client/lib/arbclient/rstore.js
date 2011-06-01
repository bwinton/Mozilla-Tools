/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at:
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Mozilla Messaging Code.
 *
 * The Initial Developer of the Original Code is
 *   The Mozilla Foundation
 * Portions created by the Initial Developer are Copyright (C) 2011
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Andrew Sutherland <asutherland@asutherland.org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

define(
  [
    "narscribblus/utils/pwomise",
    "arbcommon/change-summarizer",
    "arbcommon/build-aggregator",
    "./datamodel",
    "./lstore",
    "exports",
  ],
  function(
    $pwomise,
    $changeSummarizer,
    $buildAggregator,
    $datamodel,
    $lstore,
    exports
  ) {
var when = $pwomise.when;

var LocalDB = $lstore.LocalDB;

function commonLoad(url, promiseName, promiseRef) {
  var deferred = $pwomise.defer(promiseName, promiseRef);
  var req = new XMLHttpRequest();
  req.open("GET", url, true);
  req.addEventListener("load", function() {
    if (req.status == 200)
      deferred.resolve(req.responseText);
    else
      deferred.reject(req.status);
  }, false);
  // We used to disable caching here with Cache-Control.  Instead, we are
  //  making this the problem of the development web-server to provide us
  //  with proper cache directives.  Or the client can nuke or otherwise
  //  disable its cache.
  req.send(null);
  return deferred.promise;
}

/**
 * Per-tinderbox tree server talking.
 */
function RemoteStore(tinderTree) {
  this.tinderTree = tinderTree;
  this.urlBase = "/";
}
RemoteStore.prototype = {
   _pushSorter: function(a, b) {
     return b.push.pushDate - a.push.pushDate;
   },

  /**
   * Normalize push data (in the form of raw HBase maps) for a single
   *  push into local object representations.
   */
  _normalizeOnePush: function(hbData) {
    var key, value, self = this;

    function chewChangeset(hbcs, repo) {
      var cset = new $datamodel.Changeset();
      cset.shortRev = hbcs.shortRev;
      cset.fullRev = hbcs.node;

      cset.author = LocalDB.getPersonForCommitter(hbcs.author);

      cset.branch = hbcs.branch;
      cset.tags = hbcs.tags;

      cset.rawDesc = hbcs.desc;

      cset.files = hbcs.files;
      cset.changeSummary =
        $changeSummarizer.summarizeChangeset(hbcs.files, repo.path_mapping);

      return cset;
    }

    var chewedBuildPushes = {};
    /**
     * Process and create or retrieve the already created BuildPush instance
     *  corresponding to the given push key.   We do this because hbData is
     *  an unordered map that has the hierarchical push information effectively
     *  randomly distributed throughout it.  Rather than perform an ordering
     *  pass, we leverage our ability to randomly access the map and the fact
     *  that our push "parents" are the lexical prefixes of their children.
     */
    function chewPush(pushKey) {
      if (chewedBuildPushes.hasOwnProperty(pushKey)) {
        return chewedBuildPushes[pushKey];
      }
      var buildPush = new $datamodel.BuildPush();
      var truePush = new $datamodel.Push();
      buildPush.push = truePush;

      var value = hbData[pushKey];
      var keyBits = pushKey.split(":");

      // - set push state...
      truePush.id = parseInt(value.id);
      truePush.pushDate = new Date(value.date * 1000);
      truePush.pusher = LocalDB.getPersonForPusher(value.user);

      for (var iCS = 0; iCS < value.changesets.length; iCS++) {
        truePush.changesets.push(
          chewChangeset(value.changesets[iCS],
                        self.tinderTree.repos[keyBits.length - 2]));
      }

      // - complex?  add us to our parent.
      if (keyBits.length > 2) {
        var parentBuildPush = chewPush(keyBits.slice(0, -1).join(":"));
        parentBuildPush.subPushes.push(buildPush);
        parentBuildPush.subPushes.sort(self._pushSorter);
      }

      chewedBuildPushes[pushKey] = buildPush;
      return buildPush;
    }

    for (key in hbData) {
      if (key[2] == "r") {
        chewPush(key);
      }
      // s:b:(pushid:)*BUILDID
      else if (key[2] == "b") {
        // - just use the build rep verbatim for now...
        // (which is redundantly JSON encoded for change detection reasons)
        var build = JSON.parse(hbData[key]);

        // - stash us in our owning push
        // derive our parent's push key from our build key.
        var idxLastColon = key.lastIndexOf(":");
        var pushKey = "s:r" + key.substring(3, idxLastColon);
        // get that push...
        var buildPush = chewPush(pushKey);
        // stash!
        buildPush.builds.push(build);

        // - if we have a processed log, stash that on us
        var logKey = "s:l" + key.substring(3);
        if (hbData.hasOwnProperty(logKey)) {
          // (note: _not_ redundantly JSON encoded, unlike the build)
          build.processedLog = hbData[logKey];
        }
        else {
          build.processedLog = null;
        }
      }
    }

    // -- perform any summarization that depends on us having seen everything
    var retBuildPush = chewedBuildPushes["s:r"];
    // - summarize builds
    retBuildPush.visitLeafBuildPushes(function(buildPush) {
      buildPush.buildSummary =
        $buildAggregator.aggregateBuilds(buildPush.builds);
    });
    return retBuildPush;
  },

  getRecentPushes: function() {
    var deferred = $pwomise.defer("recent-pushes", this.tinderTree.name);
    var self = this;
    when(commonLoad(this.urlBase + "tree/" + this.tinderTree.name +
                      "/pushes",
                    "push-fetch"),
      function(jsonStr) {
        var jsonObj = JSON.parse(jsonStr);
        var buildPushes = jsonObj.map(self._normalizeOnePush, self);
        // sort them...
        buildPushes.sort(self._pushSorter);
        deferred.resolve(buildPushes);
      },
      function(err) {
        deferred.reject(err);
      });

    return deferred.promise;
  },
};
exports.RemoteStore = RemoteStore;

}); // end define
