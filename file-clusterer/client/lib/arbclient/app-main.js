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
    "narscribblus-plat/utils/env",
    "./rstore",
    "arbcommon/repodefs",
    "./ui-main",
    "exports"
  ],
  function(
    $pwomise,
    $env,
    $rstore,
    $repodefs,
    $ui_main,
    exports
  ) {
var when = $pwomise.when;

/**
 *
 */
function ArbApp(win) {
  this.tinderTree = null;
  this.rstore = null;

  this.win = win;
  this._popStateWrapped = this._popState.bind(this);
  this.win.addEventListener("popstate", this._popStateWrapped, false);
  this.history = win.history;

  /**
   * @oneof[
   *   @case["connecting"]{
   *     Our initial state when we are assuming the server is there but we have
   *     not yet gotten it to spill the required set of initial data.
   *   }
   *   @case["error"]{
   *     Something bad happened that effectively prevents us from doing
   *     anything.  This basically means we can't talk to the server or
   *     experienced an initialization failure.  (Keep in mind that many
   *     initialization failures will result in us breaking without getting
   *     far enough to throw up an error failure unless we refactor ourselves
   *     to defer all but the most essential require()s.)
   *   }
   *   @case["good"]{
   *     The steady state wherein we are usable and do stuff.
   *   }
   * ]
   */
  this.state = "picktree";

  this.possibleTrees = $repodefs.TINDER_TREES;

  /**
   * The wmsy binding associated with us.  A related rule is that only a
   *  single UI can be bound to a single app instance.  The binding clobbers
   *  this value directly.
   *
   * It is currently required that the wmsy binding for the application be
   *  created before the next event loop event is processed, which is to say
   *  all callbacks triggered by the app can safely assume that binding is
   *  valid.  In the case of unit testing where it is desired to not actually
   *  have a UI, a sufficient stub must be provided.
   */
  this.binding = null;

  this.error = null;

  /**
   *
   */
  this.page = null;
}
ArbApp.prototype = {
  selectTree: function(tinderTree, fromUrl) {
    this.tinderTree = tinderTree;
    this.rstore = new $rstore.RemoteStore(this.tinderTree);
    this.updateState("connecting");
    if (!fromUrl)
      this.history.pushState(null, "", "?tree=" + tinderTree.name);
    this._bootstrap();
  },

  updateState: function(newState) {
    this.state = newState;
    if (this.binding)
      this.binding.update();
  },

  _popState: function() {
    var env = $env.getEnv(this.win);
    if (!env.hasOwnProperty("tree")) {
      this.updateState("picktree");
    }
  },

  _bootstrap: function() {
    var self = this;
    when(this.rstore.getRecentPushes(),
      function gotPushes(pushes) {
        self.page = {
          page: "pushes",
          pushes: pushes,
        };
        self.updateState("good");
      },
      function fetchProblem(err) {
        console.error("No go on the data.");
        self.error = err;
        self.updateState("error");
      });
  },
};

exports.main = function main() {
  var env = $env.getEnv();

  var app = window.app = new ArbApp(window);

  if ("tree" in env) {
    var treeDef = $repodefs.safeGetTreeByName(env.tree);
    if (treeDef) {
      app.selectTree(treeDef, true);
    }
  }
  $ui_main.bindApp(app);
};

}); // end define
