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
    "wmsy/wmsy",
    "./ui-page-pushes",
    "./ui-pushes",
    "./ui-peeps",
    "exports"
  ],
  function(
    $wmsy,
    $ui_page_pushes,
    $ui_pushes,
    $ui_peeps,
    exports
  ) {

var wy = new $wmsy.WmsyDomain({id: "ui-main", domain: "arbpl"});

wy.defineWidget({
  name: "app-root",
  doc: "App Root Container; immediate child varies on high-level app state.",
  constraint: {
    type: "app-root",
  },
  provideContext: {
    tinderTree: "tinderTree",
  },
  focus: wy.focus.domain.vertical("state"),
  structure: {
    state: wy.widget({type: "app-state"}, wy.SELF),
  },
  impl: {
    postInit: function() {
      this.obj.binding = this;
    }
  },
});

wy.defineWidget({
  name: "state-picktree",
  doc: "Lists the trees you can look at, lets you pick one.",
  constraint: {
    type: "app-state",
    obj: {
      state: "picktree",
    },
  },
  focus: wy.focus.container.vertical("possibleTrees"),
  structure: {
    heading: "Pick a tree:",
    possibleTrees: wy.vertList({type: "pickable-tree"},
                               wy.dictAsList("possibleTrees")),
  },
  events: {
    possibleTrees: {
      command: function(pickedBinding) {
        this.obj.selectTree(pickedBinding.obj);
      },
    },
  },
  style: {
    heading: [
      "display: block;",
      "font-size: 400%;",
      "text-align: center;",
      "color: black;",
      "margin-bottom: 40px;",
    ],
    possibleTrees: [
      "text-align: center;",
    ],
  },
});

wy.defineWidget({
  name: "pickable-tree",
  doc: "Represent a tree for pickin' purposes",
  constraint: {
    type: "pickable-tree",
  },
  focus: wy.focus.item,
  structure: {
    name: wy.bind("name"),
    url: wy.bind(["repos", 0, "url"]),
  },
  style: {
    root: [
      "display: inline-block;",
      "border-radius: 10px;",
      "width: 40em;",
      "margin: 8px;",
      "cursor: pointer;",
    ],
    name: [
      "display: block;",
      "color: black;",
      "border-top-left-radius: 10px;",
      "border-top-right-radius: 10px;",
      "padding: 8px;",
      "background-color: #F8ECC9;",
      "font-size: 200%;",
    ],
    url: [
      "display: block;",
      "color: white;",
      "border-bottom-left-radius: 10px;",
      "border-bottom-right-radius: 10px;",
      "padding: 8px;",
      "background-color: #A79C8E;",
      "font-size: 150%;",
    ]
  },
});


wy.defineWidget({
  name: "state-connecting",
  doc: "The connecting splash screen.",
  constraint: {
    type: "app-state",
    obj: {
      state: "connecting",
    },
  },
  structure: {
    heading: "Connecting..."
  },
  style: {
    heading: [
      "display: block;",
      "font-size: 300%;",
      "text-align: center;",
      "color: black;",
    ],
  },
});

wy.defineWidget({
  name: "state-error",
  doc: "Error page for when things go massively wrong; like a dead server.",
  constraint: {
    type: "app-state",
    obj: {
      state: "error",
    },
  },
  structure: {
    heading: "Something is rotten in the state of this state machine.",
  },
  style: {
    heading: [
      "display: block;",
      "font-size: 300%;",
      "text-align: center;",
      "color: red;",
    ],
  },
});

wy.defineWidget({
  name: "state-good",
  doc: "Nominal operation state.",
  constraint: {
    type: "app-state",
    obj: {
      state: "good",
    },
  },
  structure: {
    page: wy.widget({type: "page"}, "page"),
  },
  style: {
  },
});



exports.bindApp = function bindApp(appObj) {
  var emitter = wy.wrapElement(document.getElementById("body"));
  emitter.emit({type: "app-root", obj: appObj});
};

}); // end define
