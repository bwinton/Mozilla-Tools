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
 * Storage for things the user can change or annotate (as opposed to things that
 *  come from the server and if mutated should be told to the server.)
 */

define(
  [
    "narscribblus/utils/pwomise",
    "./datamodel",
    "exports",
  ],
  function(
    $pwomise,
    $datamodel,
    exports
  ) {
var when = $pwomise.when;

var RE_EMAIL_PAIR = /^([^<]+) <([^>]+)>$/;

/**
 * In theory this should actually store stuff locally; right now it's ephemeral.
 *  LocalStorage will likely suffice for our needs for a long time when we do
 *  take that step.
 */
function LocalStore() {
  /**
   * @dictof[
   *   @key[String]{
   *     An e-mail address.
   *   }
   *   @value[MozPerson]{
   *     The associated `MozPerson` record.  May be associated with more than
   *     one e-mail address.
   *   }
   * ]
   */
  this._peepsByEmail = {};
}
LocalStore.prototype = {
  _getPersonByEmail: function(email, displayName) {
    var peep;
    if (this._peepsByEmail.hasOwnProperty(email)) {
      peep = this._peepsByEmail[email];
      if (displayName &&
          peep.displayName == email &&
          displayName != email)
        peep.displayName = displayName;
      return peep;
    }

    this._peepsByEmail[email] = peep = new $datamodel.MozPerson();
    peep.displayName = displayName || email;
    peep.emails.push(email);
    return peep;
  },

  /**
   * Lookup/create a `MozPerson` entry given a pusher e-mail address.  This
   *  should be the e-mail address associated with a user's mozilla LDAP
   *  account.
   *
   * @args[
   *   @param[emailAddress String]{
   *     A straight up e-mail address. ex: "bob@example.com".
   *   }
   * ]
   * @return[MozPerson]
   */
  getPersonForPusher: function(emailAddress) {
    return this._getPersonByEmail(emailAddress, null);
  },

  /**
   * Lookup/create a `MozPerson` entry for a given committer e-mail address.  In
   *  theory this should be the e-mail address associated with a user's mozilla
   *  LDAP account or their bugzilla e-mail address, but there is absolutely
   *  no constraint on what we get here as far as I know.
   *
   * @args[
   *   @param[pairString String]{
   *     This should ideally look like an rfc2822 e-mail address, ex:
   *     "John Smith <john.smith@example.com>".
   *   }
   * ]
   * @return[MozPerson]
   */
  getPersonForCommitter: function(pairString) {
    var match = RE_EMAIL_PAIR.exec(pairString);
    if (match) {
      return this._getPersonByEmail(match[2], match[1]);
    }
    else {
      return this._getPersonByEmail(pairString);
    }
  },
};

/**
 * Exported local store type for unit testing purposes.
 */
exports._LocalStore = LocalStore;

/**
 * Singleton local store.
 */
exports.LocalDB = new LocalStore();

}); // end define
