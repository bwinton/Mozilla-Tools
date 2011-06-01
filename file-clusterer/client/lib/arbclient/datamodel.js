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
 * Provides local, rich representations of pushes, changesets, etc.  They are
 *  rich in the sense that they are not suitable for direct JSON serializationff
 *  because they have been integrated into a potentially cyclic object graph.
 **/

define(
  [
    "narscribblus/utils/pwomise",
    "exports",
  ],
  function(
    $pwomise,
    exports
  ) {
var when = $pwomise.when;

/**
 * Information about a mozilla contributor.  Specifically, the e-mails they use
 *  (in their commits, in their pushes, for bugzilla) as well as display name
 *  information and other related metadata.
 *
 * The intent is that this information is a locally built aggregate that can be
 *  annotated/edited by the user some day.  For now, screw it.
 *
 * This representation should strive for ease of JSON serialization and
 *  restoration.
 */
function MozPerson() {
  /**
   * How to display the person; this could be a nickname/alias/whatever or
   *  their actual name.
   */
  this.displayName = null;

  /**
   * What we believe to be the person's actual name.
   */
  this.name = null;

  /**
   * A list of known e-mail addresses for this person.
   */
  this.emails = [];
  /**
   * A list of known IRC nick-names used by this person.
   */
  this.ircNicks = [];
  /**
   * A list of aliases used for this person, primarily for "r=" correspondence
   *  purposes.  For many people this may be the same as the set of ircNicks,
   *  but may be a super-set.
   */
  this.aliases = [];
}
MozPerson.prototype = {
};
exports.MozPerson = MozPerson;

/**
 * Provides info about a push and the builds it engenders, potentially involving
 *  pushes from another repo.  The non-build related data is stored in a `Push`
 *  instance.
 */
function BuildPush() {
  /**
   * The actual `Push` we are talking about.
   */
  this.push = null;

  /**
   * If this push was to a repo that depends on other repos to build, this
   *  contains the pushes that were actually used to build the repo.  The code
   *  repo has an ordered list that prioritizes the code repositories and
   *  determines the nesting hierarchy used.
   */
  this.subPushes = [];

  /**
   * @listof[BuildInfo]{
   *   Information on the builds
   * }
   */
  this.builds = [];

  /**
   * The `BuildSummary` that encapsulates what is up with the builds.
   */
  this.buildSummary = null;
}
BuildPush.prototype = {
  visitLeafBuildPushes: function(func, funcThis) {
    if (this.subPushes.length) {
      for (var iPush = 0; iPush < this.subPushes.length; iPush++) {
        this.subPushes[iPush].visitLeafBuildPushes(func, funcThis);
      }
    }
    else {
      func.call(funcThis, this);
    }
  },
};
exports.BuildPush = BuildPush;

/**
 * Provides information about a push without any build information.  Usually
 *  owned by a `BuildPush` instance which provides the association with builds,
 *  other repo pushes used for builds, etc.
 */
function Push() {
  /**
   * The numeric id assigned to this push by the pushlog database.  This is an
   *  artifact of the pushlog system and not something inherent in hg AFAIK.
   */
  this.id = 0;

  /**
   * The `MozPerson` who pushed this set of changesets.
   */
  this.pusher = null; // retrieved from 'user'

  /**
   * The `Date` the push occurred, per the pushlog.
   */
  this.pushDate = null;

  /** @listof[Changeset] */
  this.changesets = [];
}
Push.prototype = {
};
exports.Push = Push;

/**
 * Information about a changeset, nothing about builds.
 */
function Changeset() {
  /**
   * The 12-character short revision name for this changeset.
   */
  this.shortRev = "";

  /**
   * The full revision name for this changeset.
   */
  this.fullRev = "";

  /**
   * The `MozPerson` who authored this changeset.
   */
  this.author = null;
  /**
   * The name of the branch this changeset lives on.  This is mainly interesting
   *  if the value is not "default", suggesting a specific release branch off of
   *  a release tag.
   */
  this.branch = "";
  /**
   * Tags referencing this changeset.  For now we'll just ignore these since
   *  things only get interesting once the tag effects a branch.
   */
  this.tags = [];

  /**
   * The raw commmit message for this changeset, contrast with the `descStream`
   *  which has been parsed for references to other changesets, bug numbers,
   *  etc.
   */
  this.rawDesc = "";
  /**
   * The commit message parsed up so that we have renderable objects for things
   *  that need hyperlinks / augmentation, etc.
   * XXX notyet
   */
  this.descStream = [];

  /**
   * @listof[String]{
   *   The list of files affected by this changeset.  Presumably this covers
   *   additions, modifications, and deletions.
   * }
   */
  this.files = [];

  /**
   * The `ChangeSummary` instance that summarizes how the `files` map to
   *  products / subsystems in the repository.
   */
  this.changeSummary = null;

  /**
   * The bugs mentioned in the commit message.
   * XXX notyet
   */
  this.referencedBugs = [];
  /**
   * The bugs mentioned in the commit message that have been found to contain a
   *  back-reference to this commit.  Lacking a back-reference may imply someone
   *  made a typo or that the bug in question was just being name-checked and was
   *  not the bug where the work was actually taking place.
   * XXX notyet
   */
  this.mutuallyReferencedBugs = [];

  /**
   * If this changeset was backed out, what changeset was it backed out by?
   * XXX notyet
   */
  this.backedOutBy = null;

  /**
   * Is this changeset a backout of another changeset?
   * XXX notyet
   */
  this.backoutOf = null;
}
Changeset.prototype = {
};
exports.Changeset = Changeset;

// we don't need a custom build rep right now.
/*
function BuildInfo() {
}
BuildInfo.prototype = {
};
exports.BuildInfo = BuildInfo;
*/

}); // end define
