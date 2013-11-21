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

Components.utils.import( "resource://znotes/utils.js", ru.akman.znotes );

ru.akman.znotes.ContentTabType = function() {

  var Utils = ru.akman.znotes.Utils;

  var pub = {

    __proto__: contentTabBaseType,
    
    name: "znotesContentTab",
    perTabPanel: "vbox",
    lastBrowserId: 0,

    get loadingTabString() {
      delete this.loadingTabString;
      return this.loadingTabString =
        document.getElementById( "bundle_messenger" ).getString( "loadingTab" );
    },

    modes: {
      znotesContentTab: {
        type: "znotesContentTab",
        maxTabs: 20
      }
    }

  };

  pub.openTab = function( aTab, aArgs ) {
    if ( !( "contentPage" in aArgs ) ) {
      return;
    }
    aTab.contentPage = aArgs.contentPage;
    if ( !( "note" in aArgs ) ) {
      return;
    }
    aTab.note = aArgs.note;
    aTab.background = ( "background" in aArgs ) && aArgs.background;
    if ( "style" in aArgs ) {
      aTab.style = aArgs.style;
    }
    if ( aTab.note ) {
      aTab.bookId = aTab.note.getBook().getId();
      aTab.noteId = aTab.note.getId();
    }
    aTab.browserId = this.lastBrowserId;
    var clone = document.getElementById( "znotes_contenttabpanel" )
                        .firstChild.cloneNode( true );
    clone.setAttribute( "collapsed", "false" );
    aTab.panel.setAttribute( "id",
      "znotes_contenttabpanel" + this.lastBrowserId );
    aTab.panel.appendChild( clone );
    aTab.root = clone;
    aTab.browser = aTab.panel.querySelector( "browser" );
    aTab.browser.setAttribute( "id",
      "znotes_contenttabbrowser" + this.lastBrowserId );
    aTab.browser.setAttribute( "type",
      aTab.background ? "content-targetable" : "content-primary" );
    aTab.browser.addEventListener( "DOMLinkAdded", DOMLinkHandler, false );
    gPluginHandler.addEventListeners( aTab.browser );
    aTab.reloadEnabled = false;
    this._setUpLoadListener( aTab );
    this._setUpTitleListener( aTab );
    this._setUpCloseWindowListener( aTab );
    if ( "onLoad" in aArgs ) {
      aTab.browser.addEventListener(
        "load",
        function _znotesContentTab_onLoad( event ) {
          aArgs.onLoad( event, aTab.browser );
          aTab.browser.removeEventListener( "load",
            _znotesContentTab_onLoad, true );
        },
        true
      );
    }
    var filter =
      Components.classes["@mozilla.org/appshell/component/browser-status-filter;1"]
                .createInstance( Components.interfaces.nsIWebProgress );
    aTab.filter = filter;
    aTab.browser.webProgress.addProgressListener( filter,
      Components.interfaces.nsIWebProgress.NOTIFY_ALL );
    aTab.progressListener = new tabProgressListener( aTab, false );
    filter.addProgressListener( aTab.progressListener,
      Components.interfaces.nsIWebProgress.NOTIFY_ALL );
    if ( "onListener" in aArgs && aArgs.onListener ) {
      aArgs.onListener( aTab.browser, aTab.progressListener );
    }
    aTab.title = this.loadingTabString;
    aTab.browser.loadURI( aArgs.contentPage );
    this.lastBrowserId++;
  };

  pub.tryCloseTab = function( aTab ) {
    var docShell = aTab.browser.docShell;
    var canClose = !(
      docShell && docShell.contentViewer &&
      !docShell.contentViewer.permitUnload()
    );
    if ( canClose ) {
      canClose = aTab.browser.contentWindow.ru.akman.znotes.Viewer.onClose();
    }
    return canClose;
  };

  pub.onTitleChanged = function( aTab ) {
    if ( aTab.note ) {
      aTab.title = aTab.note.getName();
    }
  };
    
  return pub;

}();
