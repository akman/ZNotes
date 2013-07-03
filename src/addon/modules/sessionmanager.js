/* ***** BEGIN LICENSE BLOCK *****
 *
 * Version: GPL 3.0
 *
 * ZNotes
 * Copyright (C) 2012 Alexander Kapitman
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * The Original Code is ZNotes.
 *
 * Initial Developer(s):
 *   Alexander Kapitman <akman.ru@gmail.com>
 *
 * Portions created by the Initial Developer are Copyright (C) 2012
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * ***** END LICENSE BLOCK ***** */

if ( !ru ) var ru = {};
if ( !ru.akman ) ru.akman = {};
if ( !ru.akman.znotes ) ru.akman.znotes = {};

Components.utils.import( "resource://znotes/utils.js" , ru.akman.znotes );

var EXPORTED_SYMBOLS = ["SessionManager"];

var SessionManager = function() {

  var getEntry = function() {
    var entry = ru.akman.znotes.Utils.getPlacesPath();
    var placeId = ru.akman.znotes.Utils.getPlaceId();
    entry.append( placeId );
    if ( !entry.exists() || !entry.isDirectory() ) {
      entry.create( Components.interfaces.nsIFile.DIRECTORY_TYPE, parseInt( "0755", 8 ) );
    }
    entry.append( "session.json" );
    return entry.clone();
  };

  var loadSession = function() {
    var state = {
      tabs: []
    };
    var entry = getEntry();
    if ( !entry.exists() ) {
      return state;
    }
    try {
      var data = ru.akman.znotes.Utils.readFileContent( entry, "UTF-8" );
      state = JSON.parse( data );
    } catch ( e ) {
      log( e );
      state = {
        tabs: []
      };
    }
    return state;
  };

  var saveSession = function( state ) {
    var data = JSON.stringify( state );
    var entry = getEntry();
    ru.akman.znotes.Utils.writeFileContent( entry, "UTF-8", data );
  };

  var persistedState = loadSession();
  var currentState = { tabs: [] };
  saveSession( currentState );

  var pub = {};

  pub.getPersistedState = function() {
    return { tabs: persistedState.tabs.slice( 0 ) };
  };

  pub.getCurrentState = function() {
    return { tabs: currentState.tabs.slice( 0 ) };
  };

  pub.updateState = function( aTab, aState ) {
    if ( aState === undefined ) {
      var aState = {};
    }
    var isModified = false;
    var isFound = false;
    var mode = aTab.mode.name;
    var bookId = aTab.bookId;
    var noteId = aTab.noteId;
    for ( var i = 0; i < currentState.tabs.length; i++ ) {
      var tab = currentState.tabs[i];
      if ( tab.state.noteId == noteId ) {
        if ( "opened" in aState ) {
          if ( !aState.opened ) {
            currentState.tabs.splice( i, 1 );
            saveSession( currentState );
            return;
          }
        }
        isFound = true;
        if ( "background" in aState ) {
          if ( tab.state.background != aState.background ) {
            tab.state.background = aState.background;
            isModified = true;
          }
        }
      }
    }
    if ( "opened" in aState ) {
      if ( !isFound && aState.opened ) {
        currentState.tabs.push(
          {
            mode: mode,
            state: {
              bookId: bookId,
              noteId: noteId,
              background: true
            },
            ext: {}
          }
        );
        isModified = true;
      }
    }
    if ( isModified ) {
      saveSession( currentState );
    }
  };

  return pub;

}();