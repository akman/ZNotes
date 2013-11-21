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
if ( !ru.akman.znotes.doc ) ru.akman.znotes.doc = {};

Components.utils.import( "resource://znotes/utils.js", ru.akman.znotes );
Components.utils.import( "resource://znotes/event.js", ru.akman.znotes.core );

var EXPORTED_SYMBOLS = ["DocumentManager"];

var DocumentManager = function() {

  var Utils = ru.akman.znotes.Utils;

  var pub = {};

  var docs = null;

  var registry = null;
  
  function getRegistryEntry() {
    var entry = Utils.getPlacesPath();
    var placeId = Utils.getPlaceId();
    entry.append( placeId );
    try {
      if ( !entry.exists() || !entry.isDirectory() ) {
        entry.create( Components.interfaces.nsIFile.DIRECTORY_TYPE,
          parseInt( "0755", 8 ) );
      }
      entry.append( "documents.json" );
      return entry.clone();
    } catch ( e ) {
      Components.utils.reportError(
        "An error occurred accessing the registry of documents:\n" + e
      );
    }
    return null;
  };
  
  function readRegistry() {
    var entry = getRegistryEntry();
    if ( !entry || !entry.exists() ) {
      registry = {};
    } else {
      try {
        registry = JSON.parse( Utils.readFileContent( entry, "UTF-8" ) );
      } catch ( e ) {
        Components.utils.reportError(
          "An error occurred parsing the registry of documents:\n" + e
        );
        registry = {};
      }
    }
  };

  function writeRegistry() {
    var entry = getRegistryEntry();
    if ( !entry ) {
      Components.utils.reportError(
        "An error occurred writing the registry of documents:\n" + e
      );
      return;
    }
    try {
      var data = JSON.stringify( registry );
      Utils.writeFileContent( entry, "UTF-8", data );
    } catch ( e ) {
      Components.utils.reportError(
        "An error occurred writing the registry of documents:\n" + e
      );
    }
  };
  
  function getDocumentPreferences( doc ) {
    if ( !registry ) {
      readRegistry();
    }
    var id = doc.getId();
    var result = {};
    if ( !( id in registry ) ||
         !( typeof( registry[id] ) == "object" ) ) {
      registry[id] = {};
    }
    if ( !( "document" in registry[id] ) ||
         !( typeof( registry[id].document ) == "object" ) ) {
      registry[id].document = {};
    }
    Utils.cloneObject( registry[id].document, result );
    return result;
  };
  
  function setDocumentPreferences( doc, preferences ) {
    if ( !preferences || ( typeof( preferences ) != "object" ) ) {
      Components.utils.reportError(
        "An error occurred setting the preferences of document:\n invalid argument!"
      );
    }
    var id = doc.getId();
    if ( !( id in registry ) || ( typeof( registry[id] ) != "object" ) ) {
      registry[id] = {};
    }
    if ( !( "document" in registry[id] ) ) {
      registry[id].document = {};
    }
    if ( Utils.cloneObject( preferences, registry[id].document ) ) {
      writeRegistry();
      var prefsObject = {};
      Utils.cloneObject( preferences, prefsObject );
      doc.notifyObservers(
        new ru.akman.znotes.core.Event(
          "DocumentPreferencesChanged",
          {
            preferences: prefsObject
          }
        )
      );  
    }
  };  

  function getEditorPreferences( doc ) {
    if ( !registry ) {
      readRegistry();
    }
    var id = doc.getId();
    var result = {};
    if ( !( id in registry ) ||
         !( typeof( registry[id] ) == "object" ) ) {
      registry[id] = {};
    }
    if ( !( "editor" in registry[id] ) ||
         !( typeof( registry[id].editor ) == "object" ) ) {
      registry[id].editor = {};
    }
    Utils.cloneObject( registry[id].editor, result );
    return result;
  };
  
  function setEditorPreferences( doc, preferences ) {
    if ( !preferences || ( typeof( preferences ) != "object" ) ) {
      Components.utils.reportError(
        "An error occurred setting the preferences of editor:\n invalid argument!"
      );
    }
    var id = doc.getId();
    if ( !( id in registry ) || ( typeof( registry[id] ) != "object" ) ) {
      registry[id] = {};
    }
    if ( !( "editor" in registry[id] ) ) {
      registry[id].editor = {};
    }
    if ( Utils.cloneObject( preferences, registry[id].editor ) ) {
      writeRegistry();
      var prefsObject = {};
      Utils.cloneObject( preferences, prefsObject );
      doc.notifyObservers(
        new ru.akman.znotes.core.Event(
          "EditorPreferencesChanged",
          {
            preferences: prefsObject
          }
        )
      );  
    }
  };  
  
  function registerDocument( name ) {
    unregisterDocument( name );
    var url = "chrome://znotes_documents/content/" + name + "/";
    try {
      ru.akman.znotes.doc[ name ] = {};
      Components.utils.import( url + "editor.js", ru.akman.znotes.doc[ name ] );
      Components.utils.import( url + "document.js", ru.akman.znotes.doc[ name ] );
      Components.utils.import( url + "options.js", ru.akman.znotes.doc[ name ] );
      var doc = ru.akman.znotes.doc[ name ].Document;
      var opt = ru.akman.znotes.doc[ name ].Options;
      // inject into Document
      ru.akman.znotes.doc[ name ].Document.getOptions = function() {
        return opt;
      };
      doc.getEditor = function() {
        return new ru.akman.znotes.doc[ name ].Editor();
      };
      doc.getPreferences = function() {
        return getDocumentPreferences( doc );
      };
      doc.setPreferences = function( preferences ) {
        setDocumentPreferences( doc, preferences );
      };
      // inject into Options
      ru.akman.znotes.doc[ name ].Options.getDocument = function() {
        return doc;
      };
      ru.akman.znotes.doc[ name ].Options.getDocumentDefaultPreferences = function() {
        return doc.getDefaultPreferences();
      };
      ru.akman.znotes.doc[ name ].Options.getDocumentPreferences = function() {
        return getDocumentPreferences( doc );
      };
      ru.akman.znotes.doc[ name ].Options.setDocumentPreferences = function( preferences ) {
        setDocumentPreferences( doc, preferences );
      };
      ru.akman.znotes.doc[ name ].Options.getEditorDefaultPreferences = function() {
        return ru.akman.znotes.doc[ name ].Editor.prototype.getDefaultPreferences();
      };
      ru.akman.znotes.doc[ name ].Options.getEditorPreferences = function() {
        return getEditorPreferences( doc );
      };
      ru.akman.znotes.doc[ name ].Options.setEditorPreferences = function( preferences ) {
        setEditorPreferences( doc, preferences );
      };
      // inject into Editor
      ru.akman.znotes.doc[ name ].Editor.prototype.getDocument = function() {
        return doc;
      };
      ru.akman.znotes.doc[ name ].Editor.prototype.getPreferences = function() {
        return getEditorPreferences( doc );
      };
      ru.akman.znotes.doc[ name ].Editor.prototype.setPreferences = function( preferences ) {
        setEditorPreferences( doc, preferences );
      };
      // register
      docs[ name ] = doc;
    } catch ( e ) {
      delete ru.akman.znotes.doc[ name ];
      throw e;
    }
    return doc;
  };

  function unregisterDocument( name ) {
    if ( ru.akman.znotes.doc[ name ] ) {
      delete ru.akman.znotes.doc[ name ];
    }
    if ( docs[ name ] ) {
      delete docs[ name ];
    }
  };

  // CONSTRUCTOR
  
  function init() {
    if ( docs ) {
      return;
    }
    docs = {};
    var documentDirectory = Utils.getDocumentDirectory();
    var entries = documentDirectory.directoryEntries;
    var doc = null;
    var name = null;
    var entry = null;
    while( entries.hasMoreElements() ) {
      entry = entries.getNext();
      entry.QueryInterface( Components.interfaces.nsIFile );
      if ( !entry.isDirectory() ) {
        continue;
      }
      name = entry.leafName;
      try {
        doc = registerDocument( name );
      } catch ( e ) {
        doc = null;
        Utils.log( e );
      }
      if ( doc == null ) {
        Utils.log( "Error registering document: " + entry.path );
      }
    }
  };
  
  // PUBLIC
  
  pub.getDocuments = function() {
    var value, result = {};
    for ( var name in docs ) {
      value = docs[ name ];
      result[ value.getName() ] = value;
    }
    return result;
    //return docs;
  };

  pub.getDocumentByName = function( aName ) {
    var value;
    for ( var name in docs ) {
      value = docs[ name ];
      if ( value.getName() == aName ) {
        return value;
      }
    }
    /*
    if ( name in docs ) {
      return docs[ name ];
    }
    */
    return null;
  };

  pub.getDefaultDocument = function() {
    var value;
    for ( var name in docs ) {
      value = docs[ name ];
      if ( ( "default" in value ) && value["default"] ) {
        return value;
      }
    }
    /*
    if ( "default" in docs ) {
      return docs[ "default" ];
    }
    */
    return null;
  };

  pub.getDocument = function( aType ) {
    var value;
    for ( var name in docs ) {
      value = docs[ name ];
      if ( value.getType() == aType ) {
        return value;
      }
    }
    return null;
  };
  
  pub.getInstance = function() {
    return this;
  };
  
  init();

  return pub;

}();
