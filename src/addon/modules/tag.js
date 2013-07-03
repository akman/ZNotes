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

Components.utils.import( "resource://znotes/event.js"  , ru.akman.znotes.core );

var EXPORTED_SYMBOLS = ["Tag"];

var Tag = function( list, id, name, color, index, selectedIndex ) {

  this.getDescriptor = function() {
    return this.list.getDescriptor();
  };

  this.getDescriptorItemInfo = function() {
    return [
      this.getId(),
      this.getName(),
      this.getColor(),
      this.getIndex(),
      this.getSelectedIndex()
    ];
  };

  this.getBook = function() {
    return this.list.getBook();
  };

  this.getTagList = function() {
    return this.list;
  };

  this.isNoTag = function() {
    return this.getId() == "00000000000000000000000000000000";
  };

  this.getId = function() {
    return this.id;
  };

  this.getName = function() {
    return this.name;
  };

  this.setName = function( name ) {
    if ( this.getName() == name ) {
      return;
    }
    this.name = name;
    this.getDescriptor().setItem( this.getDescriptorItemInfo() );

    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "TagChanged",
        { changedTag: this }
      )
    );

  };

  this.getColor = function() {
    return this.color;
  };

  this.setColor = function( color ) {
    if ( this.getColor() == color ) {
      return;
    }
    this.color = color;
    this.getDescriptor().setItem( this.getDescriptorItemInfo() );

    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "TagChanged",
        { changedTag: this }
      )
    );

  };

  this.getIndex = function() {
    return this.index;
  };

  this.setIndex = function( index ) {
    if ( this.isNoTag() || this.getIndex() == index ) {
      return;
    }
    this.index = index;
    this.getDescriptor().setItem( this.getDescriptorItemInfo() );
  };

  this.getSelectedIndex = function() {
    return this.selectedIndex;
  };

  this.setSelectedIndex = function( selectedIndex ) {
    if ( this.getSelectedIndex() == selectedIndex ) {
      return;
    }
    this.selectedIndex = selectedIndex;
    this.getDescriptor().setItem( this.getDescriptorItemInfo() );
  };

  this.remove = function() {
    var contentTree = this.getBook().getContentTree();
    var id = this.getId();
    var removeTagProcessor = {
      tagID: id,
      processNote: function( aNote ) {
        var noteIDs = aNote.getTags();
        var indexID = noteIDs.indexOf( this.tagID );
        if ( indexID != -1 ) {
          noteIDs.splice( indexID, 1 );
          aNote.setTags( noteIDs );
        }
      }
    };
    contentTree.process( removeTagProcessor );
    //
    this.getDescriptor().removeItem( this.getId() );
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "TagDeleted",
        { deletedTag: this }
      )
    );
  };

  this.isLocked = function() {
    return this.locked;
  };

  this.addStateListener = function( stateListener ) {
    if ( this.listeners.indexOf( stateListener ) < 0 ) {
      this.listeners.push( stateListener );
    }
  };

  this.removeStateListener = function( stateListener ) {
    var index = this.listeners.indexOf( stateListener );
    if ( index < 0 ) {
      return;
    }
    this.listeners.splice( index, 1 );
  };

  this.notifyStateListener = function( event ) {
    if ( this.isLocked() ) {
      return;
    }
    for ( var i = 0; i < this.listeners.length; i++ ) {
      if ( this.listeners[i][ "on" + event.type ] ) {
        this.listeners[i][ "on" + event.type ]( event );
      }
    }
    this.list.notifyStateListener( event );
  };

  /*
  TagChanged( aChangedTag )
  TagDeleted( aDeletedTag )
  */

  this.toString = function() {
    return "{ '" +
      this.id + "', '" +
      this.name + "', '" +
      this.color + "', " +
      this.index + ", " +
      this.selectedIndex +
      " }\n" +
      "{ locked = " + this.locked + ", " +
      " listeners = " + this.listeners.length +
      " }";
  };

  this.locked = true;
  this.list = list;
  this.listeners = [];
  this.id = id;
  this.name = name;
  this.color = color;
  this.index = index;
  this.selectedIndex = selectedIndex;
  this.locked = false;

};