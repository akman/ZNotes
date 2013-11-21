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
if ( !ru.akman.znotes.core ) ru.akman.znotes.core = {};

Components.utils.import( "resource://znotes/utils.js", ru.akman.znotes );
Components.utils.import( "resource://znotes/event.js", ru.akman.znotes.core );

var EXPORTED_SYMBOLS = ["PrefsManager"];

var PrefsManager = function() {

  var Utils = ru.akman.znotes.Utils;

  var prefsMozilla =
    Components.classes["@mozilla.org/preferences-service;1"]
              .getService( Components.interfaces.nsIPrefBranch );
  
  var prefs = null;
  var observers = [];

  var getEntry = function() {
    var entry = ru.akman.znotes.Utils.getPlacesPath();
    var placeId = ru.akman.znotes.Utils.getPlaceId();
    entry.append( placeId );
    if ( !entry.exists() || !entry.isDirectory() ) {
      entry.create( Components.interfaces.nsIFile.DIRECTORY_TYPE,
        parseInt( "0755", 8 ) );
    }
    entry.append( "prefs.json" );
    return entry.clone();
  };

  var init = function() {
    var entry = getEntry();
    if ( !entry.exists() ) {
      prefs = {};
      savePrefs();
      return;
    }
    try {
      var data = ru.akman.znotes.Utils.readFileContent( entry, "UTF-8" );
      prefs = JSON.parse( data );
    } catch ( e ) {
      Utils.log( e );
      prefs = {};
      savePrefs();
    }
  };

  var savePrefs = function() {
    var entry = getEntry();
    var data = JSON.stringify( prefs );
    ru.akman.znotes.Utils.writeFileContent( entry, "UTF-8", data );
  };
  
  var notifyObservers = function( event ) {
    for ( var i = 0; i < observers.length; i++ ) {
      if ( observers[i][ "on" + event.type ] ) {
        observers[i][ "on" + event.type ]( event );
      }
    }
  };

  var pub = {};

  pub.hasPref = function( name ) {
    return ( name in prefs );
  };

  pub.removePref = function( name ) {
    if ( !pub.hasPref( name ) ) {
      return;
    }
    var value = prefs[name];
    delete prefs[name];
    savePrefs();
    notifyObservers(
      new ru.akman.znotes.core.Event(
        "PrefRemoved",
        {
          name: name,
          value: value
        }
      )
    );
  };
  
  pub.getBoolPref = function( name ) {
    if ( !pub.hasPref( name ) ) {
      return null;
    }
    return prefs[name];
  };

  pub.setBoolPref = function( name, value ) {
    if ( name in prefs && prefs[name] === value ) {
      return;
    }
    var oldValue = prefs[name];
    prefs[name] = value;
    savePrefs();
    notifyObservers(
      new ru.akman.znotes.core.Event(
        "PrefChanged",
        {
          name: name,
          oldValue: oldValue,
          newValue: value
        }
      )
    );
  };

  pub.getCharPref = function( name ) {
    if ( !pub.hasPref( name ) ) {
      return null;
    }
    return prefs[name];
  };

  pub.setCharPref = function( name, value ) {
    if ( name in prefs && prefs[name] === value ) {
      return;
    }
    var oldValue = prefs[name];
    prefs[name] = value;
    savePrefs();
    notifyObservers(
      new ru.akman.znotes.core.Event(
        "PrefChanged",
        {
          name: name,
          oldValue: oldValue,
          newValue: value
        }
      )
    );
  };

  pub.getIntPref = function( name ) {
    if ( !pub.hasPref( name ) ) {
      return null;
    }
    return prefs[name];
  };

  pub.setIntPref = function( name, value ) {
    if ( name in prefs && prefs[name] === value ) {
      return;
    }
    var oldValue = prefs[name];
    prefs[name] = value;
    savePrefs();
    notifyObservers(
      new ru.akman.znotes.core.Event(
        "PrefChanged",
        {
          name: name,
          oldValue: oldValue,
          newValue: value
        }
      )
    );
  };

  pub.loadPrefs = function() {
    if ( prefsMozilla.prefHasUserValue( "extensions.znotes.debug" ) ) {
      Utils.IS_DEBUG_ENABLED =
        prefsMozilla.getBoolPref( "extensions.znotes.debug" );
    }
    if ( prefsMozilla.prefHasUserValue( "extensions.znotes.debug.active" ) ) {
      Utils.IS_DEBUG_ACTIVE =
        prefsMozilla.getBoolPref( "extensions.znotes.debug.active" );
    }
    if ( prefsMozilla.prefHasUserValue( "extensions.znotes.debug.raised" ) ) {
      Utils.IS_DEBUG_RAISED =
        prefsMozilla.getBoolPref( "extensions.znotes.debug.raised" );
    }
    if ( prefsMozilla.prefHasUserValue( "extensions.znotes.sanitize" ) ) {
      Utils.IS_SANITIZE_ENABLED =
        prefsMozilla.getBoolPref( "extensions.znotes.sanitize" );
    }
    if ( prefsMozilla.prefHasUserValue( "extensions.znotes.ad" ) ) {
      Utils.IS_AD_ENABLED =
        prefsMozilla.getBoolPref( "extensions.znotes.ad" );
    }
    try {
      if ( !pub.hasPref( "isFirstRun" ) ) {
        pub.setBoolPref( "isFirstRun",
          Utils.IS_FIRST_RUN );
      }
      Utils.IS_FIRST_RUN =
        pub.getBoolPref( "isFirstRun" );
      //
      if ( !pub.hasPref( "version" ) ) {
        pub.setCharPref( "version",
          Utils.VERSION );
      }
      //
      if ( !pub.hasPref( "isSavePosition" ) ) {
        pub.setBoolPref( "isSavePosition",
          Utils.IS_SAVE_POSITION );
      }
      Utils.IS_SAVE_POSITION =
        pub.getBoolPref( "isSavePosition" );
      //
      if ( !pub.hasPref( "isEditSourceEnabled" ) ) {
        pub.setBoolPref( "isEditSourceEnabled",
          Utils.IS_EDIT_SOURCE_ENABLED );
      }
      Utils.IS_EDIT_SOURCE_ENABLED =
        pub.getBoolPref( "isEditSourceEnabled" );
      //
      if ( !pub.hasPref( "isPlaySound" ) ) {
        pub.setBoolPref( "isPlaySound",
          Utils.IS_PLAY_SOUND );
      }
      Utils.IS_PLAY_SOUND =
        pub.getBoolPref( "isPlaySound" );
      //
      if ( !pub.hasPref( "isHighlightRow" ) ) {
        pub.setBoolPref( "isHighlightRow",
          Utils.IS_HIGHLIGHT_ROW );
      }
      Utils.IS_HIGHLIGHT_ROW =
        pub.getBoolPref( "isHighlightRow" );
      //
      if ( !pub.hasPref( "isReplaceBackground" ) ) {
        pub.setBoolPref( "isReplaceBackground",
          Utils.IS_REPLACE_BACKGROUND );
      }
      Utils.IS_REPLACE_BACKGROUND =
        pub.getBoolPref( "isReplaceBackground" );
      //
      if ( !pub.hasPref( "isConfirmExit" ) ) {
        pub.setBoolPref( "isConfirmExit",
          Utils.IS_CONFIRM_EXIT );
      }
      Utils.IS_CONFIRM_EXIT =
        pub.getBoolPref( "isConfirmExit" );
      //
      if ( !pub.hasPref( "isMainMenubarVisible" ) ) {
        pub.setBoolPref( "isMainMenubarVisible",
          Utils.IS_MAINMENUBAR_VISIBLE );
      }
      Utils.IS_MAINMENUBAR_VISIBLE =
        pub.getBoolPref( "isMainMenubarVisible" );
      //
      if ( !pub.hasPref( "isMainToolbarVisible" ) ) {
        pub.setBoolPref( "isMainToolbarVisible",
          Utils.IS_MAINTOOLBAR_VISIBLE );
      }
      Utils.IS_MAINTOOLBAR_VISIBLE =
        pub.getBoolPref( "isMainToolbarVisible" );
      //
      if ( !pub.hasPref( "defaultDocumentType" ) ) {
        pub.setCharPref( "defaultDocumentType",
          Utils.DEFAULT_DOCUMENT_TYPE );
      }
      Utils.DEFAULT_DOCUMENT_TYPE =
        pub.getCharPref( "defaultDocumentType" );
      //
      if ( !pub.hasPref( "placeName" ) ) {
        pub.setCharPref( "placeName",
          Utils.PLACE_NAME );
      }
      Utils.PLACE_NAME =
        pub.getCharPref( "placeName" );
      //
      if ( !pub.hasPref( "main_shortcuts" ) ) {
        pub.setCharPref( "main_shortcuts",
          Utils.MAIN_SHORTCUTS );
      }
      Utils.MAIN_SHORTCUTS =
        pub.getCharPref( "main_shortcuts" );
      //
      if ( !pub.hasPref( "platform_shortcuts" ) ) {
        pub.setCharPref( "platform_shortcuts",
          Utils.PLATFORM_SHORTCUTS );
      }
      Utils.PLATFORM_SHORTCUTS =
        pub.getCharPref( "platform_shortcuts" );
      //
    } catch ( e ) {
      Utils.log( e );
    }
  };
  
  pub.getInstance = function() {
    return this;
  };

  pub.addObserver = function( aObserver ) {
    if ( observers.indexOf( aObserver ) < 0 ) {
      observers.push( aObserver );
    }
  };

  pub.removeObserver = function( aObserver ) {
    var index = observers.indexOf( aObserver );
    if ( index < 0 ) {
      return;
    }
    observers.splice( index, 1 );
  };

  // CONSTRUCTOR

  init();

  return pub;

}();
