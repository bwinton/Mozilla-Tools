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
 * Provides logic to summarize the changes made by a changeset.  The current
 *  bias is to perform all summarization on the client since it is very
 *  likely our mappings will be wrong and annoying.  Doing things on the client
 *  should make it possible for (phase 1) people to hack on the mapping
 *  without having to stand up their own server, and eventually (phase 2)
 *  perhaps use some client side UI to change the mappings without having to
 *  touch code.
 *
 * Ideally, this information could then be fed back to the server for the
 *  benefit of other users.  We still might not end up summarizing on the
 *  server but instead just serving mappings from the database.
 **/

define(
  [
    "./repodefs",
    "exports"
  ],
  function(
    $repodefs,
    exports
  ) {

/**
 * A distilled representation of the effects of a changeset in terms of the
 *  subsystems and types of files affected.  The goal is to allow us to easily
 *  distinguish changes to the "bingo" subsystem affecting actual logic from
 *  changes to the "bango" subsystem affecting only test cases.
 *
 * This is obviously a very deep hole one could go down.  While it would be
 *  desirable to enable someone to add semantic processing of the entirety of a
 *  changeset in order to know whether only comments were modified, what
 *  classes / methods / etc. were affected, that is (unlikely but cool) future
 *  work.
 */
function ChangeSummary(changeGroups) {
  this.changeGroups = changeGroups;
}
ChangeSummary.prototype = {
};

/**
 * Names a subsystem and holds the list of file types touched in that change
 *  group.
 */
function ChangeGroup(name) {
  this.name = name;
  this.fileTypes = [];
  this.files = [];
}
ChangeGroup.prototype = {
};

function FileCategory(fileNames, name) {
  this.fileNames = fileNames;
  this.name = name;
}
FileCategory.prototype = {
  test: function(pathName, fileName) {
    for (var i = 0; i < this.fileNames.length; i++) {
      if (this.fileNames[i] == fileName)
        return true;
    }
    return false;
  },
};

function PathCategory(pathbits, name) {
  this.pathbits = pathbits;
  this.name = name;
}
PathCategory.prototype = {
  test: function(pathParts, fileName) {
    for (var i = 0; i < this.pathbits.length; i++) {
      if (pathParts.indexOf(this.pathbits[i]) != -1) {
        return true;
      }
    }
    return false;
  },
};

// all of these get checked before FILE_CATEGORIZERS.
var PATH_CATEGORIZERS = [
  new PathCategory(["test", "tests"],
                   "Tests"),
  new FileCategory([".hgtags", ".hgignore"],
                   "VC Cruft"),
  new FileCategory(["jar.mn", "removed-files.in"],
                   "Packaging"),
  new FileCategory(["client.py",
                    "build.mk",
                    "Makefile", "Makefile.in",
                    "configure", "configure.in", "config.mk"],
                   "Build System"),
];
var FILE_EXT_CATEGORIZERS = [
  // Code
  new FileCategory([".idl", ".idl.in"],
                   "IDL"),
  new FileCategory([".h", ".c", ".cpp", ".cc"],
                   "C++ Code"),
  new FileCategory([".js", ".jsm"],
                   "JS Code"),
  new FileCategory([".xml"],
                   "XBL Bindings"),
  new FileCategory([".xul"],
                   "XUL"),

  // Themes
  new FileCategory([".css", ".png", ".jpg", ".jpeg"],
                   "Theming"),
  // Localization
  new FileCategory([".dtd", ".properties"],
                   "Strings"),
  // Packaging
  new FileCategory([".ini", ".rdf", ".manifest"],
                   "Packaging"),
  // Testing stuff
  new FileCategory([".list"],
                   "Tests"),
];

var FALLBACK_CATEGORY = new FileCategory([], "Other");

function populateFileExtMap(categorizers) {
  var map = {};
  for (var i = 0; i < categorizers.length; i++) {
    var category = categorizers[i];
    for (var iExt = 0; iExt < category.fileNames.length; iExt++) {
      map[category.fileNames[iExt]] = category;
    }
  }
  return map;
}
var FILE_EXT_MAP = populateFileExtMap(FILE_EXT_CATEGORIZERS);

var FALLBACK_SUBSYSTEM = "Uncategorized";

exports.summarizeChangeset = function summarizeChangeset(files,
                                                         path_mapping) {
  var groups = {}, groupsList = [];


  for (var iFile = 0; iFile < files.length; iFile++) {
    var fullPath = files[iFile];
    var idxLastSlash = fullPath.lastIndexOf("/");
    var pathBits = fullPath.substring(0, idxLastSlash).split("/");
    var fileName = fullPath.substring(idxLastSlash + 1);


    // -- Figure out the subsystem in play
    var bestSubsystem = FALLBACK_SUBSYSTEM;
    var curMap = path_mapping;
    for (var iPathBit = 0; iPathBit < pathBits.length; iPathBit++) {
      var curBit = pathBits[iPathBit];
      if (curMap.hasOwnProperty("_"))
        bestSubsystem = curMap["_"];
      if (!curMap.hasOwnProperty(curBit))
        break;
      var subThing = curMap[curBit];
      if (typeof(subThing) === "string") {
        bestSubsystem = subThing;
        break;
      }
      curMap = subThing;
    }

    // -- Categorize File Type
    var goodCategory = null;
    // - attempt to match path bits
    for (var iPath = 0; iPath < PATH_CATEGORIZERS.length; iPath++) {
      var pathCategory = PATH_CATEGORIZERS[iPath];
      if (pathCategory.test(pathBits, fileName)) {
        goodCategory = pathCategory;
        break;
      }
    }

    // - otherwise, use the file extension
    if (!goodCategory) {
      var idxPeriod = fileName.indexOf(".");
      if (idxPeriod != -1) {
        var extension = fileName.substring(idxPeriod);
        if (FILE_EXT_MAP.hasOwnProperty(extension))
          goodCategory = FILE_EXT_MAP[extension];
      }
    }

    // - fail over to
    if (!goodCategory)
      goodCategory = FALLBACK_CATEGORY;

    // -- aggregate it
    var curGroup;
    if (!groups.hasOwnProperty(bestSubsystem)) {
      curGroup = groups[bestSubsystem] = new ChangeGroup(bestSubsystem);
      groupsList.push(curGroup);
    }
    else {
      curGroup = groups[bestSubsystem];
    }
    if (curGroup.fileTypes.indexOf(goodCategory.name) == -1) {
      curGroup.fileTypes.push(goodCategory.name);
      curGroup.fileTypes.sort();
    }
    curGroup.files.push(fullPath);
  }

  groupsList.sort(function(a, b) { return a.name.localeCompare(b.name); });
  return new ChangeSummary(groupsList);
};

});
