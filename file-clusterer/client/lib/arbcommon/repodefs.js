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
 * Repo/tree/product schema definitions and current hard-coded sets.
 **/

define(
  [
    "exports"
  ],
  function(
    exports
  ) {


var CC_MAPPING = {
  // - Thunderbird Stuff
  "mail": {
    _: "Mail",
    branding: "Branding",
    components: {
      "about-support": "about:support",
      activity: "Activity Manager",
      addrbook: "Address Book",
      build: "Mail Build",
      compose: "Compose",
      migration: "Migration Wizard",
      phishing: "Phishing",
      preferences: "Prefs",
      search: "Search"
    },
    extensions: {
      smime: "SMIME"
    },
    installer: "Installer",
    jquery: "jQuery",
    locales: "l10n",
    steel: "STEEL",
    themes: {
      gnomestripe: "Linux Theme",
      pinstripe: "Mac Theme",
      qute: "Windows Theme",
    },
  },
  "mailnews": {
    _: "MailNews",
    addrbook: "Address Book",
    base: "MailNews Core",
    build: "MailNews Build",
    compose: "Compose",
    db: {
      gloda: "Gloda",
      msgdb: "Message DB",
    },
    extensions: {
      "bayesian-spam-filter": "Spam",
      fts3: "Gloda",
      mdn: "Message Receipts",
      newsblog: "Feeds",
      smime: "SMIME",
    },
    imap: "IMAP",
    "import": "Mail Import",
    local: "Local Folders",
    mapi: "Windows MAPI",
    mime: "libmime",
    news: "NNTP",
  },
  // - Other Product Top-levels
  suite: "SeaMonkey",
  calendar: "Calendar",
  // - Other stuff,
  ldap: "LDAP",
  editor: "CC Editor",
};


var MC_MAPPING = {
  accessible: "Accessibility",
  browser: "Firefox",
  content: "Content",
  config: "Build System",
  db: {
    mdb: "Mork",
    mork: "Mork",
    morkreader: "Mork",
    sqlite3: "SQLite",
  },
  docshell: "Layout",
  dom: {
    _: "Layout",
    indexedDB: "IndexedDB",
  },
  editor: "Editor",
  embedding: "Embedding",
  extensions: {
    _: "Extensions",
    inspector: "DOM Inspector",
    spellcheck: "Spelling",
  },
  gfx: "Graphics",
  intl: "l10n",
  ipc: "electrolysis",
  jpeg: "Graphics",
  js: {
    _: "Spidermonkey",
    ipc: "electrolysis",
    jetpack: "Jetpack",
    jsd: "JS Debugging",
    src: {
      ctypes: "JS CTypes",
      methodjit: "Spidermonkey Method JIT",
      nanjoit: "Spidermonkey NanoJIT",
      xpconnect: "XPConnect"
    }
  },
  layout: {
    _: "Layout",
    xul: "XUL",
  },
  media: "Video",
  memory: {
    jemalloc: "jemalloc",
    mozalloc: "mozalloc",
  },
  modules: {
    _: "Generic Modules",
    freetype2: "FreeType",
    lib7z: "Compression Libs",
    libbz2: "Compression Libs",
    libimg: "Graphics",
    libjar: "Compression Libs",
    libmar: "Compression Libs",
    libpr0n: "Graphics",
    libpref: "Preferences",
    // libreg ??
    plugin: "Plugins",
    zlib: "Compression Libs",
  },
  netwerk: {
    _: "Necko",
    mime: "libmime outpost",
  },
  nsprpub: "NSPR",
  "other-licenses": {
    _: "Generic Modules",
    "7zstub": "Installer",
    android: "Mobile",
    "atk-1.0": "Accessibility",
    branding: "Branding",
    bsdiff: "Installer",
    nsis: "Installer",
  },
  parser: {
    expat: "XML",
    html: "HTML Parser",
    htmlparser: "HTML Parser",
    xml: "XML",
  },
  probes: "DTrace",
  profile: "Profile",
  rdf: "RDF",
  security: {
    _: "Security",
    nss: "NSS",
  },
  services: {
    crypto: "Security",
    sync: "Weave",
  },
  startupcache: "Startup Cache",
  storage: "mozStorage",
  testing: "Test Infrastructure",
  toolkit: {
    _: "Toolkit",
    components: {
      places: "Places",
      printing: "Printing",
    },
    crashreporter: "Crash Reporter",
    mozapps: {
      downloads: "Downloads",
    },
    system: {
      dbus: "DBUS",
    },
    themes: {
      _: "Other Theme",
      gnomestripe: "Linux Theme",
      pinstripe: "Mac Theme",
      winstripe: "Windows Theme",
    },
  },
  tools: "Generic Tools",
  widget: "Widget",
  xpcom: "XPCOM",
  xpfe: "XPFE",
  xpisntall: "xpinstall",
  xulrunner: "XULRunner",
};


/**
 * @typedef[CodeRepoKind @oneof[
 *   @case["trunk"]{
 *     Active development branch; may be fed into by feature or team branches
 *     depending on usage.
 *   }
 *   @case["team"]{
 *     A branch which serves as a working area for a development team and is
 *     periodically merged into a trunk/release branch.  For example, the
 *     places or tracemonkey branches.
 *   }
 *   @case["feature"]{
 *     Development branch for a targeted feature (as opposed to a team) and
 *     tracks a trunk/release branch.
 *   }
 *   @case["try"]{
 *     A try-server branch with no meaningful chronology that generally
 *     tracks/forks off of a specific underlying branch, but could also
 *     periodically receive pushes relating to other branches that forked
 *     off of the nominal underlying branch at some point.
 *   }
 *   @case["release"]{
 *     A stabilized product release branch.
 *   }
 * ]]
 **/

/**
 * Specific mercurial code repository information.
 */
function CodeRepoDef(def) {
  this.name = def.name;
  this.url = def.url;
  this.kind = def.kind;
  this.relto = ("relto" in def) ? def.relto : null;
  this.path_mapping = def.path_mapping;
  this.family = def.family;
}
CodeRepoDef.prototype = {
  toString: function() {
    return ["repo: " + this.name];
  },
};

var REPOS = exports.REPOS = {
  "comm-central": new CodeRepoDef({
    name: "comm-central",
    url: "http://hg.mozilla.org/comm-central/",
    kind: "trunk",
    path_mapping: CC_MAPPING,
    family: "comm",
  }),
  "try-comm-central": new CodeRepoDef({
    name: "try-comm-central",
    url: "http://hg.mozilla.org/try-comm-central/",
    kind: "try",
    relto: "comm-central",
    path_mapping: CC_MAPPING,
    family: "comm",
  }),

  "mozilla-central": new CodeRepoDef({
    name: "mozilla-central",
    url: "http://hg.mozilla.org/mozilla-central/",
    kind: "trunk",
    path_mapping: MC_MAPPING,
    family: "mozilla",
  }),
  "tracemonkey": new CodeRepoDef({
    name: "tracemonkey",
    url: "http://hg.mozilla.org/tracemonkey/",
    kind: "team",
    relto: "mozilla-central",
    path_mapping: MC_MAPPING,
    family: "mozilla",
  }),

  "comm-1.9.2": new CodeRepoDef({
    name: "comm-1.9.2",
    url: "http://hg.mozilla.org/releases/comm-1.9.2/",
    kind: "release",
    path_mapping: CC_MAPPING,
    family: "comm",
  }),
};

/**
 * Tinderbox tree definition; consists of one or more code repositories
 *  associated with a specific product.
 */
function TinderTreeDef(def) {
  this.id = def.id;
  this.name = def.name;
  this.product = def.product;
  this.repos = def.repos;
  this.mount = def.mount;
}
TinderTreeDef.prototype = {
  toString: function() {
    return "[tinderbox: " + this.id + "]";
  },
};


var TINDER_TREES = exports.TINDER_TREES = {
  tb_trunk: new TinderTreeDef({
    id: "cc",
    name: "Thunderbird",
    product: "Thunderbird",
    repos: [REPOS["comm-central"], REPOS["mozilla-central"]],
    mount: {
      mozilla: REPOS["mozilla-central"],
    },
  }),
  tb_try: new TinderTreeDef({
    id: "ctry",
    name: "ThunderbirdTry",
    product: "Thunderbird",
    repos: [REPOS["try-comm-central"], REPOS["mozilla-central"]],
    mount: {
      mozilla: REPOS["mozilla-central"],
    },
  }),

  // releases/comm-1.9.2 => c192
  // releases/comm-1.9.1 => c191

  // mozilla-central => mc
  mc_trunk: new TinderTreeDef({
    id: "mc",
    name: "Firefox",
    product: "Firefox",
    repos: [REPOS["mozilla-central"]],
    mount: {
    },
  }),
  // try => mtry

  // tracemonkey => tm
  // projects/places => places

  // releases/mozilla-2.0 => m20
  // releases/mozilla-1.9.2 => m192
  // releases/mozilla-1.9.1 => m191

};

exports.safeGetTreeByName = function safeGetTreeByName(treeName) {
  for (var key in TINDER_TREES) {
    var tree = TINDER_TREES[key];
    if (tree.name == treeName)
      return tree;
  }
  return null;
};

}); // end define
