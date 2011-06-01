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

/**
 * Given multiple builds, 1) group them by platform with a display bias, and 2)
 *  attempt to cluster the failures where possible.  Failure clustering is the
 *  important and interesting bit, as we want to know if a failure happened
 *  across all platforms, etc.
 **/

define(
  [
    "exports"
  ],
  function(
    exports
  ) {

/**
 * Per-platform grouping.
 */
function PlatformGroup(name) {
  this.name = name;
  this.types = [];
  this.typeMap = {};
}
PlatformGroup.prototype = {
};
exports.PlatformGroup = PlatformGroup;

var BUILD_STATE_PRIORITY_MAP = {
  success: 0,
  building: 1,
  testfailed: 2,
  busted: 3,
};

var BUILD_STATE_EXPAND_REQUIRED_MAP = {
  success: false,
  building: false,
  testfailed: true,
  busted: true,
};

function BuildTypeGroup(name) {
  this.name = name;
  this.builds = [];
  this.state = "success";
  this.expandNeeded = false;
}
BuildTypeGroup.prototype = {
};
exports.BuildTypeGroup = BuildTypeGroup;

function nameSorter(a, b) {
  return a.name.localeCompare(b.name);
}

function FailGroup(type, name, signature) {
  this.type = type;
  this.name = name;
  this.signature = signature;
  this.inBuilds = [];
}
FailGroup.prototype = {
};
exports.FailGroup = FailGroup;

function AggrBuildSummary(groups, failGroups) {
  this.groups = groups;
  this.failGroups = failGroups;
}
AggrBuildSummary.prototype = {
};
exports.AggrBuildSummary = AggrBuildSummary;

exports.aggregateBuilds = function aggregateBuilds(builds) {
  var groups = [], groupMap = {};
  var failGroups = [], failGroupMap = {};
  for (var i = 0; i < builds.length; i++) {
    var build = builds[i];
    var builder = build.builder;

    // -- platform/build type hierarchy grouping
    // - get the platform group
    var platGroup;
    if (groupMap.hasOwnProperty(builder.os.platform)) {
      platGroup = groupMap[builder.os.platform];
    }
    else {
      platGroup = groupMap[builder.os.platform] =
        new PlatformGroup(builder.os.platform);
      groups.push(platGroup);
    }

    // - categorize by build type within the group
    var typeGroup;
    if (platGroup.typeMap.hasOwnProperty(builder.type.type)) {
      typeGroup = platGroup.typeMap[builder.type.type];
    }
    else {
      typeGroup = platGroup.typeMap[builder.type.type] =
        new BuildTypeGroup(builder.type.type);
      platGroup.types.push(typeGroup);
      platGroup.types.sort(nameSorter);
    }
    typeGroup.builds.push(build);
    // set the state to the highest priority
    if (BUILD_STATE_PRIORITY_MAP[build.state] >
        BUILD_STATE_PRIORITY_MAP[typeGroup.state])
      typeGroup.state = build.state;
    // and mark expanding as required if required by the state
    if (BUILD_STATE_EXPAND_REQUIRED_MAP[build.state])
      typeGroup.expandNeeded = true;

    // -- failure clustering
    if (build.processedLog) {
      var buildFailures = build.processedLog;
      var testType = build.builder.type.subType;
      for (var iFail = 0; iFail < buildFailures.length; iFail++) {
        var bfail = buildFailures[iFail];
        var failGroupKey = testType + ":" + bfail.test + ":" + bfail.hash;

        var failGroup;
        if (failGroupMap.hasOwnProperty(failGroupKey)) {
          failGroup = failGroupMap[failGroupKey];
        }
        else {
          failGroup = failGroupMap[failGroupKey] =
            new FailGroup(testType, bfail.test, bfail.hash);
          failGroups.push(failGroup);
        }

        failGroup.inBuilds.push(build);
      }
    }
  }
  groups.sort(nameSorter);

  return new AggrBuildSummary(groups, failGroups);
};

});
