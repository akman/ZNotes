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

Components.utils.import( "resource://znotes/utils.js"    , ru.akman.znotes );
Components.utils.import( "resource://znotes/category.js" , ru.akman.znotes.core );
Components.utils.import( "resource://znotes/note.js"     , ru.akman.znotes.core );

var EXPORTED_SYMBOLS = ["ContentTree"];

var ContentTree = function( book, rootCategoryEntry ) {

  this.getBook = function() {
    return this.book;
  };

  this.getRoot = function() {
    return this.root;
  };

  this.load = function() {
    var read = function( aCategory ) {
      var aBook = aCategory.getBook();
      var entries = aCategory.entry.getEntries();
      var anEntry = null;
      for ( var i = 0; i < entries.length; i++ ) {
        anEntry = entries[i];
        if ( anEntry.isCategory() ) {
          read( new ru.akman.znotes.core.Category( aBook, anEntry, aCategory ) );
        } else {
          new ru.akman.znotes.core.Note( aBook, anEntry, aCategory );
        }
      }
    };
    this.root = new ru.akman.znotes.core.Category( this.getBook(), this.rootEntry, null );
    read( this.root );
  };

  /*
   * aProcessor
   *
  var data1 = {};
  var data2 = {};
  ...
  var dataN = {};
  var aProcessor = {
    param1: data1,
    param2: data2,
    ...
    paramN: dataN,
    processCategory: function( aCategory ) {
      ...
      this.param1 ... this.paramN
      ...
    },
    processNote: function( aNote ) {
      ...
      this.param1 ... this.paramN
      ...
    }
  };
  */
  this.process = function( aProcessor ) {
    var aRoot = this.getRoot();
    if ( aRoot ) {
      aRoot.process( aProcessor );
    }
  };

  this.getNoteByName = function( aName ) {
    var result = [];
    var getNoteByNameProcessor = {
      name: aName,
      notes: result,
      processCategory: function( aCategory ) {
      },
      processNote: function( aNote ) {
        if ( aNote.getName() == this.name )
          this.notes.push( aNote );
      }
    };
    this.process( getNoteByNameProcessor );
    if ( result.length > 0 ) {
      return result[0];
    } else {
      return null;
    }
  };

  this.getNoteById = function( noteID ) {
    var result = [];
    var getNoteByIdProcessor = {
      id: noteID,
      notes: result,
      processCategory: function( aCategory ) {
      },
      processNote: function( aNote ) {
        if ( aNote.getId() == this.id ) {
          this.notes.push( aNote );
        }
      }
    };
    this.process( getNoteByIdProcessor );
    return result;
  };

  this.getNotesByTag = function( tagID ) {
    var result = [];
    var getNotesByTagProcessor = {
      tagID: tagID,
      notes: result,
      processCategory: function( aCategory ) {
      },
      processNote: function( aNote ) {
        var noteIDs = aNote.getTags();
        if ( noteIDs.length == 0 && this.tagID == "00000000000000000000000000000000" ) {
          this.notes.push( aNote );
        } else {
          var indexID = noteIDs.indexOf( this.tagID );
          if ( indexID != -1 ) {
            this.notes.push( aNote );
          }
        }
      }
    };
    this.process( getNotesByTagProcessor );
    return result;
  };

  this.addStateListener = function( stateListener ) {
    this.root.addStateListener( stateListener );
  };

  this.removeStateListener = function( stateListener ) {
    this.root.removeStateListener( stateListener );
  };

  this.book = book;
  this.rootEntry = rootCategoryEntry;
  this.root = null;

};
