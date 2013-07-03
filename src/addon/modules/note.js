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

Components.utils.import( "resource://znotes/utils.js"  , ru.akman.znotes );
Components.utils.import( "resource://znotes/event.js"  , ru.akman.znotes.core );
Components.utils.import( "resource://znotes/documentmanager.js" , ru.akman.znotes );

var EXPORTED_SYMBOLS = ["Note"];

var Note = function( aBook, anEntry, aCategory, aType, aTagID ) {

  this.getBook = function() {
    return this.book;
  };

  this.getEncoding = function() {
    return this.entry.getEncoding();
  };

  this.getParent = function() {
    return this.parent;
  };

  this.isLocked = function() {
    return this.locked;
  };

  this.isExists = function() {
    return this.exists;
  };

  this.getId = function() {
    return this.id;
  };

  this.getCreateDateTime = function() {
    return this.entry.getCreateDateTime();
  };

  this.getUpdateDateTime = function() {
    return this.entry.getUpdateDateTime();
  };
  
  this.getKeyWords = function() {
    var result = [];
    // name
    result.push( this.getName() );
    // categories
    var category = this.getParent();
    while ( category ) {
      result.push( category.getName() );
      category = category.getParent();
    }
    // book
    result.push( this.getBook().getName() );
    // tags
    var tagList = this.getBook().getTagList();
    var tagIDs = this.getTags();
    for ( var i = 0; i < tagIDs.length; i++ ) {
      result.push( tagList.getTagById( tagIDs[i] ).getName() );
    }
    // content
    // ...
    return result;
  };  
  
  this.getIndex = function() {
    return this.index;
  };

  this.setIndex = function( index ) {
    if ( this.index == index ) {
      return;
    }
    this.index = index;
    this.entry.setIndex( index );
  };

  this.getType = function() {
    return this.type;
  };

  this.setType = function( type ) {
    if ( this.type == type ) {
      return;
    }
    this.type = type;
    this.entry.setType( type );
  };

  this.getUserData = function() {
    return this.userData;
  };

  this.setUserData = function() {
    this.entry.setUserData( JSON.stringify( this.userData ) );
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "NoteUserDataChanged",
        { parentCategory: this.getParent(), changedNote: this } )
    );
  };
  
  this.loadPreference = function( name, value ) {
    if ( "prefs" in this.userData ) {
      if ( this.userData.prefs == null || 
           Array.isArray( this.userData.prefs ) ||
           typeof( this.userData.prefs ) !== "object" ) {
        this.userData.prefs = {};
      }
    } else {
      this.userData.prefs = {};
    }
    if ( name in this.userData.prefs ) {
      return this.userData.prefs[name];
    }
    return value;
  };
  
  this.savePreference = function( name, value ) {
    if ( "prefs" in this.userData ) {
      if ( this.userData.prefs == null || 
           Array.isArray( this.userData.prefs ) ||
           typeof( this.userData.prefs ) !== "object" ) {
        this.userData.prefs = {};
      }
    } else {
      this.userData.prefs = {};
    }
    if ( name in this.userData.prefs && this.userData.prefs[name] == value ) {
      return;
    }
    var oldValue = ( name in this.userData.prefs ) ? this.userData.prefs[name] : undefined;
    this.userData.prefs[name] = value;
    this.entry.setUserData( JSON.stringify( this.userData ) );
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "NotePrefChanged",
        {
          parentCategory: this.getParent(),
          changedNote: this,
          prefName: name,
          oldValue: oldValue,
          newValue: value
        }
      )
    );
  };
  
  this.getDocument = function() {
    var doc = ru.akman.znotes.DocumentManager.getDocument( this.getType() );
    if ( !doc ) {
      return null;
    }
    return doc.parseFromString( this.getMainContent(), this.getURI(), this.getBaseURI(), this.getName() );
  };
  
  this.setDocument = function( dom ) {
    var doc = ru.akman.znotes.DocumentManager.getDocument( this.getType() );
    if ( !doc ) {
      return false;
    }
    this.setMainContent( doc.serializeToString( dom ) );
    return true;
  };

  this.updateDocument = function() {
    var status = this.getDocument();
    if ( !status || !status.result ) {
      return;
    }
    if ( status.changed ) {
      this.setDocument( status.dom );
    }
  };

  this.importDocument = function( dom ) {
    var doc = ru.akman.znotes.DocumentManager.getDocument( this.getType() );
    if ( !doc ) {
      return;
    }
    this.setDocument(
      doc.importDocument( dom, this.getBaseURI(), this.getName() )
    );
    this.updateDocument();
  };
  
  this.getMainContent = function() {
    return this.entry.getMainContent();
  };

  this.setMainContent = function( data ) {
    var oldContent = this.getMainContent();
    this.entry.setMainContent( data );
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "NoteMainContentChanged",
        { parentCategory: this.getParent(), changedNote: this, oldValue: oldContent, newValue: data } )
    );
  };
  
  this.loadContentDirectory = function( fromDirectoryEntry, flagMove ) {
    this.entry.loadContentDirectory( fromDirectoryEntry, flagMove );
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "NoteContentLoaded",
        { parentCategory: this.getParent(), changedNote: this }
      )
    );
  };

  this.getContentEntry = function( id ) {
    return this.entry.getContentEntry( id );
  };

  this.hasContents = function() {
    return this.entry.hasContents();
  };

  this.getContents = function() {
    return this.entry.getContents();
  };

  this.getContent = function( id ) {
    return this.entry.getContent( id );
  };

  this.addContent = function( data ) {
    var info = this.entry.addContent( data );
    if ( info ) {
      this.notifyStateListener(
        new ru.akman.znotes.core.Event(
          "NoteContentAppended",
          { parentCategory: this.getParent(), changedNote: this, contentInfo: info }
        )
      );
    }
    return info;
  };

  this.removeContent = function( id ) {
    var info = this.entry.removeContent( id );
    if ( info ) {
      this.notifyStateListener(
        new ru.akman.znotes.core.Event(
          "NoteContentRemoved",
          { parentCategory: this.getParent(), changedNote: this, contentInfo: info }
        )
      );
    }
    return info;
  };

  this.getAttachmentEntry = function( id ) {
    return this.entry.getAttachmentEntry( id );
  };

  this.hasAttachments = function() {
    return this.entry.hasAttachments();
  };

  this.getAttachments = function() {
    return this.entry.getAttachments();
  };

  this.getAttachment = function( id ) {
    return this.entry.getAttachment( id );
  };

  this.addAttachment = function( data ) {
    var info = this.entry.addAttachment( data );
    if ( info ) {
      this.notifyStateListener(
        new ru.akman.znotes.core.Event(
          "NoteAttachmentAppended",
          { parentCategory: this.getParent(), changedNote: this, attachmentInfo: info }
        )
      );
    }
    return info;
  };

  this.removeAttachment = function( id ) {
    var info = this.entry.removeAttachment( id );
    if ( info ) {
      this.notifyStateListener(
        new ru.akman.znotes.core.Event(
          "NoteAttachmentRemoved",
          { parentCategory: this.getParent(), changedNote: this, attachmentInfo: info }
        )
      );
    }
    return info;
  };

  this.getURI = function() {
    return this.entry.getURI();
  };

  this.getBaseURI = function() {
    return this.entry.getBaseURI();
  };

  this.getName = function() {
    return this.name;
  };

  this.rename = function( aName ) {
    if ( this.name != aName ) {
      this.entry.setName( aName );
      this.name = aName;
      // @@@@ 1 What if document in editing mode ?
      this.updateDocument();
      this.notifyStateListener(
        new ru.akman.znotes.core.Event(
          "NoteChanged",
          { parentCategory: this.getParent(), changedNote: this }
        )
      );
    }
  };

  this.remove = function() {
    this.entry.remove();
    this.exists = false;
    this.getParent().removeNote( this );
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "NoteDeleted",
        { parentCategory: this.getParent(), deletedNote: this }
      )
    );
  };

  this.moveInto = function( aCategory ) {
    this.entry.moveTo( aCategory.entry );
    // @@@@ 1 What if document in editing mode ?
    this.updateDocument();
    this.getParent().removeNote( this );
    aCategory.appendNote( this );
  };

  this.moveTo = function( anIndex ) {
    var aParent = this.getParent();
    if ( aParent.removeNote( this ) ) {
      return aParent.insertNote( this, anIndex );
    }
    return null;
  };

  this.refresh = function() {
    this.entry.refresh( this.parent.entry );
  };

  this.hasTags = function() {
    return this.tags.length > 0;
  }

  this.getTags = function() {
    return this.tags.slice( 0 );
  };

  this.setTags = function( ids ) {
    var tagIDs = this.getTags();
    if ( tagIDs.length == 0 && ids.length == 0 ) {
      return;
    }
    var mainTagFlag = true;
    if ( tagIDs.length > 0 && ids.length > 0 ) {
      mainTagFlag = ( tagIDs[0] != ids[0] ) ;
    }
    var tagsFlag = false;
    if ( tagIDs.length != ids.length ) {
      tagsFlag = true;
    } else {
      for ( var i = 0; i < tagIDs.length; i++ ) {
        if ( ids.indexOf( tagIDs[i] ) < 0 ) {
          tagsFlag = true;
          break;
        }
      }
    }
    if ( tagsFlag ) {
      this.entry.setTags( ids );
      this.tags = ids.slice(0);
      if ( !this.isLocked() ) {

        this.notifyStateListener(
          new ru.akman.znotes.core.Event(
            "NoteTagsChanged",
            { parentCategory: this.getParent(), changedNote: this, oldValue: tagIDs, newValue: ids }
          )
        );

      }
    }
    if ( mainTagFlag ) {
      this.entry.setTags( ids );
      this.tags = ids.slice(0);
      if ( this.isLocked() ) {
        return;
      }
      var oldTag = null;
      if ( tagIDs.length > 0 ) {
        oldTag = tagIDs[0];
      }

      this.notifyStateListener(
        new ru.akman.znotes.core.Event(
          "NoteMainTagChanged",
          { parentCategory: this.getParent(), changedNote: this, oldValue: oldTag, newValue: ids[0] }
        )
      );

    }
  };

  this.getMainTag = function() {
    var ids = this.getTags();
    if ( ids.length > 0 ) {
      return ids[0];
    }
    return null;
  };

  this.setMainTag = function( id ) {
    var ids = this.getTags();
    var index = ids.indexOf( id );
    if ( index < 0 ) {
      return;
    }
    ids.splice( index, 1 );
    ids.splice( 0, 0, id );
    this.setTags( ids );
  };

  this.getMainTagColor = function() {
    var tagList = this.getBook().getTagList();
    var color = tagList.getNoTag().getColor();
    var tagID = this.getMainTag();
    if ( tagID ) {
      color = tagList.getTagById( tagID ).getColor();
    }
    return color;
  };
  
  this.getOrigin = function() {
    return this.origin;
  };

  this.setOrigin = function( url ) {
    if ( this.origin == url ) {
      return;
    }
    this.origin = url;
  };

  this.isLoading = function() {
    return this.loading;
  };
  
  this.setLoading = function( loading ) {
    var oldValue = this.loading;
    this.loading = loading;
    if ( loading ) {
      this.loadingFrame = null;
      this.loadingProgressListener = null;
      this.loadingProgress = [];
    } else {
      delete this.loadingFrame;
      delete this.loadingProgressListener;
      delete this.loadingProgress;
    }
    this.notifyStateListener(
      new ru.akman.znotes.core.Event(
        "NoteLoadingChanged",
        { parentCategory: this.getParent(), changedNote: this, oldValue: oldValue, newValue: loading }
      )
    );
  };
  
  this.getStatus = function() {
    return this.status;
  };

  this.setStatus = function( status ) {
    if ( !this.isLoading() ) {
      return;
    }
    var oldStatus = {};
    ru.akman.znotes.Utils.copyObject( this.status, oldStatus );
    ru.akman.znotes.Utils.copyObject( status, this.status );
    this.loadingProgress.push( status );
    if ( !this.isLocked() ) {
      this.notifyStateListener(
        new ru.akman.znotes.core.Event(
          "NoteStatusChanged",
          { parentCategory: this.getParent(), changedNote: this, oldValue: oldStatus, newValue: status }
        )
      );
    }
  };

  this.loadAbort = function() {
    if ( this.isLoading() && this.loadingFrame && this.loadingProgressListener ) {
      try {
        this.loadingFrame.webNavigation.stop( 3 /* STOP_ALL */ );
        this.loadingFrame.docShell.removeProgressListener(
          this.loadingProgressListener
        );
      } catch ( e ) {
      }
    }
    this.setStatus( {
      timestamp: new Date(),
      type: "abort"
    } );
    if ( this.loadingFrame ) {
      this.loadingFrame.parentNode.removeChild( this.loadingFrame );
    }
    this.setLoading( false );
  };
  
  this.load = function( aURL ) {
    this.setOrigin( aURL );
    this.setLoading( true );
    var aNote = this;
    var aDocument = ru.akman.znotes.Utils.MAIN_WINDOW.document;
    var aParent = aDocument.getElementById( "znotes_maintabpanel" );
    var frame = aDocument.createElement( "iframe" );
    frame.setAttribute( "id", "import_" + ru.akman.znotes.Utils.createUUID() );
    frame.setAttribute( "type", "content-primary" );
    frame.setAttribute( "disablehistory", "true" );
    frame.setAttribute( "collapsed", "true" );
    frame.setAttribute( "src", "about:blank" );
    aParent.appendChild( frame );
    //
    var onErrorCallback = function( errorMessage ) {
      if ( errorMessage == "NS_BINDING_ABORTED" ) {
        // We may get NS_BINDING_ABORTED when a load is interrupted
        // by something else, typically a page navigation.
        // We may return FALSE to continue download.
        return false;
      }
      if ( errorMessage == "2153578529" ) {
        // We may get NS_ERROR_PARSED_DATA_CACHED
        // We may return FALSE to continue download.
        return false;
      }
      frame.parentNode.removeChild( frame );
      aNote.setStatus( {
        timestamp: new Date(),
        type: "error",
        message: errorMessage
      } );
      aNote.setLoading( false );
      return true;
    };
    //
    var onLoadCallback = function() {
      frame.removeEventListener( "load", onLoadCallback, true );
      if ( !aNote.isLoading() ) {
        return;
      }
      // prepare to save document localy
      var tmpName = ru.akman.znotes.Utils.createUUID();
      var directoryService = Components.classes["@mozilla.org/file/directory_service;1"]
                                       .getService( Components.interfaces.nsIProperties );
      var contentDirectory = directoryService.get( "TmpD", Components.interfaces.nsIFile );
      var contentFile = contentDirectory.clone();
      contentDirectory.append( tmpName + "_files" );
      contentFile.append( tmpName + ".xhtml" );
      if ( !contentDirectory.exists() || !contentDirectory.isDirectory() ) {
        contentDirectory.create( Components.interfaces.nsIFile.DIRECTORY_TYPE, parseInt( "0774", 8 ) );
      }
      var contentType = aNote.getType();
      //
      var onSaveCallback = function() {
        ru.akman.znotes.Utils.fixupContent( frame.contentDocument, contentDirectory );
        aNote.loadContentDirectory( contentDirectory, true );
        if ( contentFile.exists() ) {
          contentFile.remove( false );
        }
        aNote.importDocument( frame.contentDocument );
        frame.parentNode.removeChild( frame );
        aNote.setStatus( {
          timestamp: new Date(),
          type: "success"
        } );
        aNote.setLoading( false );
      };
      //
      var onStylesSaveCallback = function() {
        ru.akman.znotes.Utils.saveContent(
          frame.contentDocument,
          contentFile,
          contentDirectory,
          contentType,
          onSaveCallback,
          onErrorCallback
        );
      };
      // https://bugzilla.mozilla.org/show_bug.cgi?id=115107
      // Bug 115107 - CSS not fixed up by webbrowserpersist.
      ru.akman.znotes.Utils.inlineStyles(
        frame.contentDocument,
        contentDirectory,
        onStylesSaveCallback
      );
    };
    /*
     * The xul:iframe automatically loads about:blank when it is added into the tree.
     * We need to wait for the document to be loaded before doing things.
     * Why do we do that ?
     * Basically because we want the iframe to have a docShell and a webNavigation !
     * If we don't do that, and we set directly src="about:blank", sometimes we are
     * too fast and the docShell isn't ready by the time we get there.
     */
    var process = function( event ) {
      frame.removeEventListener( "load", process, true );
      var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                                .getService( Components.interfaces.nsIIOService );
      try {
        var uri = ioService.newURI( aURL, null, null );
      } catch ( e ) {
        onErrorCallback( e.name );
        return;
      }
      var ciWN = Components.interfaces.nsIWebNavigation;
      var ciWPL = Components.interfaces.nsIWebProgressListener;
      var ciSWR = Components.interfaces.nsISupportsWeakReference;
      var ciS = Components.interfaces.nsISupports;
      var ciHC = Components.interfaces.nsIHttpChannel;
      frame.addEventListener( "load", onLoadCallback, true );
      frame.webNavigation.allowAuth = true;
      frame.webNavigation.allowImages = true;
      frame.webNavigation.allowJavascript = true;
      frame.webNavigation.allowMetaRedirects = true;
      frame.webNavigation.allowPlugins = true;
      frame.webNavigation.allowSubframes = true;
      var progressListener = {
        QueryInterface: function( aIID ) {
          if ( aIID.equals( ciWPL ) || aIID.equals( ciSWR ) || aIID.equals( ciS ) ) {
            return this;
          }
          throw Components.results.NS_NOINTERFACE;
        },
        onLocationChange: function( aWebProgress, aRequest, aLocation, aFlags ) {
          aNote.setStatus( {
            timestamp: new Date(),
            type: "location",
            location: aLocation,
            flags: aFlags
          } );
          return 0;
        },
        onProgressChange: function( aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress ) {
          aNote.setStatus( {
            timestamp: new Date(),
            type: "progress",
            currentSelfProgress: aCurSelfProgress,
            maximumSelfProgress: aMaxSelfProgress,
            currentTotalProgress: aCurTotalProgress,
            maximumTotalProgress: aMaxTotalProgress
          } );
          return 0;
        },
        onSecurityChange: function( aWebProgress, aRequest, aState ) {
          aNote.setStatus( {
            timestamp: new Date(),
            type: "security",
            state: aState
          } );
          return 0;
        },
        onStatusChange: function( aWebProgress, aRequest, aStatus, aMessage ) {
          aNote.setStatus( {
            timestamp: new Date(),
            type: "status",
            status: aStatus,
            message: aMessage
          } );
          return 0;
        },
        onStateChange: function( aWebProgress, aRequest, aStateFlags, aStatus ) {
          if ( aStateFlags & ciWPL.STATE_STOP && aStateFlags & ciWPL.STATE_IS_NETWORK ||
               aStateFlags & ciWPL.STATE_STOP && aStateFlags & ciWPL.STATE_IS_DOCUMENT ) {
            if ( !Components.isSuccessCode( aStatus ) ) {
              onErrorCallback( ru.akman.znotes.Utils.getErrorName( aStatus ) );
              return 0;
            }
          }
          aNote.setStatus( {
            timestamp: new Date(),
            type: "state",
            state: aStateFlags,
            status: aStatus
          } );
          return 0;
        }
      };
      //
      var ciWP = Components.interfaces.nsIWebProgress;
      frame.docShell.QueryInterface( ciWP );
      aNote.loadingFrame = frame;
      aNote.loadingProgressListener = progressListener;
      frame.docShell.addProgressListener( progressListener, ciWP.NOTIFY_ALL );
      try {
        frame.webNavigation.loadURI(
          aURL,
          ciWN.LOAD_FLAGS_BYPASS_CACHE | ciWN.LOAD_FLAGS_BYPASS_PROXY,
          null,
          null,
          null
        );
      } catch ( e ) {
        onErrorCallback( e.name );
      }
    };
    frame.addEventListener( "load", process, true );
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
    var parent = this.getParent();
    if ( parent ) {
      parent.notifyStateListener( event );
    }
  };

  this.toString = function() {
    var parent = this.getParent();
    var parentName = "*NULL*";
    if ( parent ) {
      parentName = parent.getName();
    }
    var listenersNames = "{\n";
    for ( var i = 0; i < this.listeners.length; i++ ) {
      var listener = this.listeners[i];
      if ( "name" in listener ) {
        listenersNames += "'" + listener.name + "'\n";
      } else {
        listenersNames += "'[" + i + "]'\n";
      }
    }
    listenersNames += "}\n";
    return "{ " + this.instanceId + " }\n{ " +
      "'" + this.id + "', " +
      "'" + this.name + "', " +
      this.index + ", " +
      "'" + parentName + "'" +
      " }\n{ " +
      this.getTags() +
      " }\n{ " +
      "loading = " + this.loading + ", " +
      "locked = " + this.locked + ", " +
      "exists = " + this.exists + ", " +
      "listeners = " + listenersNames +
      " }\n" +
      this.entry
  };

  // C O N S T R U C T O R
  
  // for debug purpose
  this.instanceId = ru.akman.znotes.Utils.createUUID();

  this.loading = false;
  this.status = {};
  this.origin = "";
  this.locked = true;
  this.exists = true;
  this.listeners = [];
  this.book = aBook;
  this.parent = aCategory;
  this.entry = anEntry;
  this.name = this.entry.getName();
  this.id = this.entry.getId();
  this.index = this.entry.getIndex();
  this.userData = JSON.parse( this.entry.getUserData() );
  this.type = this.entry.getType();
  if ( aType && aType != this.type ) {
    this.setType( aType );
  }
  this.tags = this.entry.getTags();
  var arrIDs = this.getTags();
  if ( aTagID && arrIDs.indexOf( aTagID ) < 0 ) {
    arrIDs.push( aTagID );
    this.setTags( arrIDs );
  }
  if ( this.entry.getSize() == 0 ) {
    var doc = ru.akman.znotes.DocumentManager.getDocument( this.getType() );
    if ( !doc ) {
      doc = ru.akman.znotes.DocumentManager.getDefaultDocument();
      this.setType( doc.getType() );
    }
    if ( doc ) {
      var dom = doc.getBlankDocument( this.getBaseURI(), this.getName(), true );
      if ( dom ) {
        this.setDocument( dom );
      }
    }
  }
  aCategory.appendNote( this );
  this.locked = false;

};