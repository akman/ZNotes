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

Components.utils.import( "resource://znotes/utils.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/documentmanager.js",
  ru.akman.znotes
);
Components.utils.import( "resource://znotes/bookmanager.js",
  ru.akman.znotes.core
);

ru.akman.znotes.OpenSaveDialog = function() {

  var Utils = ru.akman.znotes.Utils;

  var documentManager = ru.akman.znotes.DocumentManager.getInstance();
  var bookManager = ru.akman.znotes.core.BookManager.getInstance();

  var vbLeft = null;
  var vbBooks = null;
  var bookTree = null;
  var bookTreeChildren = null;
  var bookTreeBoxObject = null;
  var booksSplitter = null;
  var vbFolders = null;
  var categoryTree = null;
  var categoryTreeChildren = null;
  var categoryTreeBoxObject = null;
  var tagsSplitter = null;
  var vbTags = null;
  var tagTree = null;
  var tagTreeChildren = null;
  var tagTreeBoxObject = null;
  var vbRight = null;
  var vbNotes = null;
  var noteTree = null;
  var noteTreeChildren = null;
  var noteTreeBoxObject = null;
  
  var vbInfo = null;
  var tbBook = null;
  var tbCategory = null;
  var lblName = null;
  var hbName = null;
  var tbName = null;
  var lblType = null;
  var mlType = null;
  var mpType = null;
  var lblTags = null;
  var hbTags = null;
  var btnTags = null;
  var mpTags = null;
  var btnAccept = null;
  
  var books = null;
  var categories = null;
  var tags = null;
  var notes = null;
  
  var canOverwrite = false;
  var onlyCategories = false;
  var currentMode = "open";
  var currentBook = null;
  var currentCategory = null;
  var currentTag = null;
  var currentNote = null;
  var currentName = null;
  
  var booksStateListener = null;
  var contentTreeStateListener = null;
  var tagListStateListener = null;

  var oldValue = null;
  var newValue = null;
  
  // BOOKS
  
  function openBook( book ) {
    var OK = 0;
    var ALREADY_OPENED = 2;
    var DRIVER_ERROR = 4;
    var CONNECTION_ERROR = 8;
    var NOT_EXISTS = 16;
    var NOT_PERMITS = 32;
    var params = null;
    var message = null;
    var result = CONNECTION_ERROR;
    try {
      result = book.open();
    } catch ( e ) {
      message = e.message;
    }
    switch ( result ) {
      case OK:
        return;
      case ALREADY_OPENED:
        message = getString( "main.book.openerror.already_opened" );
        break;
      case DRIVER_ERROR:
        message = getString( "main.book.openerror.driver_error" );
        break;
      case NOT_EXISTS:
        message = getString( "main.book.openerror.not_exists" );
        break;
      case NOT_PERMITS:
        message = getString( "main.book.openerror.not_permits" );
        break;
      case CONNECTION_ERROR:
        if ( !message ) {
          message = getString( "main.book.openerror.connection_error" );
        }
        break;
    }
    params = {
      input: {
        title: getString( "main.book.openerror.title" ),
        message1: getFormattedString(
          "main.book.openerror.message",
          [ book.getName() ]
        ),
        message2: message,
        kind: 1
      },
      output: null
    };
    if ( result != NOT_EXISTS ) {
      window.openDialog(
        "chrome://znotes/content/messagedialog.xul",
        "",
        "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
        params
      ).focus();
      return;
    }
    // BOOK DATA DOES NOT EXIST
    params.input.message1 = getFormattedString(
      "main.book.confirmCreate.message1",
      [ book.getName() ]
    );
    params.input.message2 = getString( "main.book.confirmCreate.message2" );
    params.input.kind = 1;
    window.openDialog(
      "chrome://znotes/content/confirmdialog.xul",
      "",
      "chrome,dialog=yes,modal=yes,centerscreen,resizable=no",
      params
    ).focus();
    result = 0;
    if ( params.output && params.output.result ) {
      try {
        if ( book.createData() ) {
          openBook( book );
        }
      } catch ( e ) {
        result = CONNECTION_ERROR;
        params.input.title = getString( "main.book.createerror.title" );
        params.input.message1 = getFormattedString(
          "main.book.createerror.message",
          [ book.getName() ]
        );
        params.input.message2 = e.message;
        params.input.kind = 1;
        window.openDialog(
          "chrome://znotes/content/messagedialog.xul",
          "",
          "chrome,dialog=yes,modal=yes,centerscreen,resizable=yes",
          params
        ).focus();
      }
    }
  };
  
  function onBookDblClick( event ) {
    var aRow = bookTreeBoxObject.getRowAt( event.clientX, event.clientY );
    if ( event.button != "0" || !currentBook || currentBook.isOpen() ||
         bookTree.currentIndex < 0 ||
         aRow < 0 || aRow > bookTree.view.rowCount - 1 ) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    openBook( currentBook );
  };
  
  function onBookOpened( e ) {
    var aBook = e.data.openedBook;
    updateBookTreeItem( aBook );
    if ( currentBook && currentBook == aBook ) {
      onBookSelect();
    }
  };

  function onBookClosed( e ) {
    var aBook = e.data.closedBook;
    updateBookTreeItem( aBook );
    if ( currentBook && currentBook == aBook ) {
      onBookSelect();
    }
  };

  function onBookChanged( e ) {
    var aBook = e.data.changedBook;
    updateBookTreeItem( aBook );
    if ( currentBook && currentBook == aBook ) {
      onBookSelect();
    }
  };

  function onBookInserted( e ) {
    e.data.appendedBook = e.data.insertedBook;
    onBookAppended( e );
  };

  function onBookAppended( e ) {
    var aBook = e.data.appendedBook;
    var aRow = aBook.getIndex();
    var id = aBook.getId();
    var aTreeItem = getItemOfBook( aBook );
    if ( !aTreeItem ) {
      aTreeItem = createBookTreeItem( aBook );
      aTreeItem.setAttribute( "id", "book_" + id );
      books[id] = {
        book: aBook,
        item: aTreeItem
      }
    }
    books[id].row = aRow;
    if ( aRow == bookTree.view.rowCount ) {
      bookTreeChildren.appendChild( aTreeItem );
    } else {
      bookTreeChildren.insertBefore( aTreeItem,
        bookTree.view.getItemAtIndex( aRow ) );
    }
    if ( currentBook && currentBook == aBook ) {
      bookTree.view.selection.currentIndex = aRow;
      bookTree.view.selection.select( aRow );
    }
  };

  function onBookRemoved( e ) {
    var aBook = e.data.removedBook;
    var aTreeItem = getItemOfBook( aBook );
    bookTree.removeEventListener( "select", onBookSelect, false );
    aTreeItem.parentNode.removeChild( aTreeItem );
    bookTree.addEventListener( "select", onBookSelect, false );
  };

  function onBookDeleted( e ) {
    var aBook = e.data.deletedBook;
    var id = aBook.getId();
    var aRow = books[id].row;
    delete books[id];
    if ( currentBook && currentBook == aBook ) {
      if ( aRow == bookTree.view.rowCount ) {
        aRow--;
      }
      bookTree.view.selection.currentIndex = aRow;
      bookTree.view.selection.select( aRow );
    }
  };

  function updateBookTreeItem( book ) {
    var treeCell, treeRow, treeItem = getItemOfBook( book );
    treeRow = treeItem.firstChild;
    // Name
    treeCell = treeRow.childNodes[
      bookTree.columns.getNamedColumn( "bookTreeName" ).index ];
    treeCell.setAttribute( "label", book.getName() );
    // State
    if ( book.isOpen() ) {
      treeCell.setAttribute( "properties", "book opened" );
    } else {
      treeCell.setAttribute( "properties", "book" );
    }
  };

  function createBookTreeItem( book ) {
    var treeItem, treeRow, treeCell;
    treeRow = document.createElement( "treerow" );
    // Name
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", book.getName() );
    // State
    if ( book.isOpen() ) {
      treeCell.setAttribute( "properties", "book opened" );
    } else {
      treeCell.setAttribute( "properties", "book" );
    }
    treeRow.appendChild( treeCell );
    treeItem = document.createElement( "treeitem" );
    treeItem.appendChild( treeRow );
    return treeItem;
  };
  
  function updateBookTree() {
    var treeItem, id, row;
    var book, bookArray = bookManager.getBooksAsArray();
    bookTree.removeEventListener( "select", onBookSelect, false );
    while ( bookTreeChildren.firstChild ) {
      bookTreeChildren.removeChild( bookTreeChildren.firstChild );
    }
    books = {};
    for ( var i = 0; i < bookArray.length; i++ ) {
      book = bookArray[i];
      id = book.getId();
      row = book.getIndex();
      treeItem = createBookTreeItem( book );
      treeItem.setAttribute( "id", "book_" + id );
      bookTreeChildren.appendChild( treeItem );
      books[id] = {
        book: book,
        item: treeItem,
        row: row
      };
    }
    bookTree.addEventListener( "select", onBookSelect, false );
  };
  
  function onBookSelect( event ) {
    var index = bookTree.view.selection.currentIndex;
    var item = ( index != -1 ? bookTree.view.getItemAtIndex( index ) : null );
    onBookSelectionChange( item );
  };

  function onBookSelectionChange( item ) {
    if ( currentBook && currentBook.isOpen() ) {
      currentBook.getContentTree().removeStateListener(
        contentTreeStateListener );
      currentBook.getTagList().removeStateListener(
        tagListStateListener );
    }
    currentBook = ( item ?
      books[item.getAttribute( "id" ).substr( 5 )].book : null );
    updateCategoryTree();
    updateTagTree();
    updateTagMenu();
    if ( currentTag && currentMode === "open" ) {
      initTagSelection();
    } else {
      initCategorySelection();
    }
  };
  
  function initBookSelection() {
    var index, item = getItemOfBook( currentBook );
    if ( !item ) {
      currentBook = null;
      if ( Object.keys( books ).length ) {
        item = books[Object.keys( books )[0]].item;
        currentBook = books[Object.keys( books )[0]].book;
      }
    }
    index = ( item ? bookTree.view.getIndexOfItem( item ) : -1 );
    bookTree.view.selection.select( index );
    if ( index == -1 ) {
      onBookSelectionChange( item );
    }
    bookTree.focus();
  };

  // CATEGORIES  
  
  function onCategoryChanged( e ) {
    if ( !currentBook ) {
      return;
    }
    var aCategory = e.data.changedCategory;
    updateCategoryTreeItem( aCategory );
    updateNoteTree();
    initNoteSelection();
  };

  function onCategoryInserted( e ) {
    e.data.appendedCategory = e.data.insertedCategory;
    onCategoryAppended( e );
  };

  function onCategoryRemoved( e ) {
    if ( !currentBook ) {
      return;
    }
    var aCategory = e.data.removedCategory;
    var aParentCategory = e.data.parentCategory;
    var aTreeItem = getItemOfCategory( aCategory );
    categoryTree.removeEventListener( "select", onCategorySelect, false );
    aTreeItem.parentNode.removeChild( aTreeItem );
    categoryTree.addEventListener( "select", onCategorySelect, false );
    updateCategoryTreeItem( aParentCategory );
  };

  function onCategoryAppended( e ) {
    if ( !currentBook ) {
      return;
    }
    var aCategory = e.data.appendedCategory;
    var aParentCategory = e.data.parentCategory;
    var aRow, anIndex = aCategory.getIndex();
    var aTreeItem = getItemOfCategory( aCategory );
    var aParentTreeItem = getItemOfCategory( aParentCategory );
    var aParentTreeChildren = aParentTreeItem.lastChild;
    var id = aCategory.getId();
    if ( !aTreeItem ) {
      aTreeItem = createCategoryTreeItem( aCategory );
      aTreeItem.setAttribute( "id", "category_" + id );
      categories[id] = {
        category: aCategory,
        item: aTreeItem
      }
    }
    categories[id].index = anIndex;
    aParentTreeChildren.insertBefore(
      aTreeItem,
      anIndex < aParentTreeChildren.childNodes.length ?
        aParentTreeChildren.childNodes[anIndex] : null
    );
    while ( aParentTreeItem && aParentTreeItem.nodeName == "treeitem" ) {
      aParentTreeItem.setAttribute( "container", "true" );
      aParentTreeItem.setAttribute( "open", "true" );
      aParentTreeItem = aParentTreeItem.parentNode.parentNode;
    }
    if ( currentCategory && currentCategory == aCategory ) {
      aRow = categoryTree.view.getIndexOfItem( aTreeItem );
      categoryTree.view.selection.currentIndex = aRow;
      categoryTree.view.selection.select( aRow );
    }
  };
  
  function onCategoryDeleted( e ) {
    if ( !currentBook ) {
      return;
    }
    var aCategory = e.data.deletedCategory;
    var aTreeItem = getItemOfCategory( aCategory );
    var aParentCategory = e.data.parentCategory;
    var aParentTreeItem = getItemOfCategory( aParentCategory );
    var aParentTreeChildren = aParentTreeItem.lastChild;
    var id = aCategory.getId();
    var aRow, anIndex = categories[id].index;
    delete categories[id];
    if ( currentCategory && currentCategory == aCategory ) {
      if ( aParentTreeChildren.childNodes.length ) {
        if ( anIndex < aParentTreeChildren.childNodes.length ) {
          aRow = categoryTree.view.getIndexOfItem(
            aParentTreeChildren.childNodes[anIndex] );
        } else {
          aRow = categoryTree.view.getIndexOfItem(
            aParentTreeChildren.lastChild );
        }
      } else {
        aRow = categoryTree.view.getIndexOfItem( aParentTreeItem );
      }
      categoryTree.view.selection.currentIndex = aRow;
      categoryTree.view.selection.select( aRow );
    }
  };
  
  function updateCategoryTreeItem( category ) {
    var treeRow, treeCell, treeItem = getItemOfCategory( category );
    treeRow = treeItem.firstChild;
    treeCell = treeRow.childNodes[
      categoryTree.columns.getNamedColumn( "folderTreeName" ).index ];
    treeCell.setAttribute( "label", "" + category.getName() );
    treeCell = treeRow.childNodes[
      categoryTree.columns.getNamedColumn( "folderTreeCount" ).index ];
    treeCell.setAttribute( "label", "" + category.getNotesCount() );
    categoryTree.removeEventListener( "select", onCategorySelect, false );
    if ( !category.hasCategories() ) {
      treeItem.removeAttribute( "container" );
      treeItem.removeAttribute( "open" );
    }
    categoryTree.addEventListener( "select", onCategorySelect, false );
  };
  
  function createCategoryTreeItem( category ) {
    var treeItem, treeRow, treeCell, treeChildren;
    treeItem = document.createElement( "treeitem" );
    treeRow = document.createElement( "treerow" );
    treeRow.setAttribute( "properties", "folderrow" );
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", "" + category.getName() );
    treeCell.setAttribute( "properties", "folder" );
    treeRow.appendChild( treeCell );
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", "" + category.getNotesCount() );
    treeRow.appendChild( treeCell );
    treeItem.appendChild( treeRow );
    if ( category.hasCategories() ) {
      treeItem.setAttribute( "container", "true" );
      treeItem.setAttribute( "open", category.isOpen() ? "true" : "false" );
    }
    treeChildren = document.createElement( "treechildren" );
    treeItem.appendChild( treeChildren );
    return treeItem;
  };
  
  function createCategoryTreeChildren( category, treeChildren ) {
    var id = category.getId();
    var treeItem = createCategoryTreeItem( category );
    treeItem.setAttribute( "id", "category_" + id );
    categories[id] = {
      category: category,
      item: treeItem,
      index: category.getIndex()
    };
    treeChildren.appendChild( treeItem );
    var subcategories = category.getCategories();
    for ( var i = 0; i < subcategories.length; i++ ) {
      createCategoryTreeChildren( subcategories[i], treeItem.lastChild );
    }
  };
  
  function updateCategoryTree() {
    categoryTree.removeEventListener( "select", onCategorySelect, false );
    while ( categoryTreeChildren.firstChild ) {
      categoryTreeChildren.removeChild( categoryTreeChildren.firstChild );
    }
    categories = {};
    if ( currentBook && currentBook.isOpen() ) {
      var contentTree = currentBook.getContentTree();
      createCategoryTreeChildren( contentTree.getRoot(),
        categoryTreeChildren );
      contentTree.addStateListener( contentTreeStateListener );
    }
    categoryTree.addEventListener( "select", onCategorySelect, false );
  };

  function onCategorySelect( event ) {
    var index = categoryTree.view.selection.currentIndex;
    var item = ( index != -1 ?
    categoryTree.view.getItemAtIndex( index ) : null );
    tagTree.removeEventListener( "select", onTagSelect, false );
    if ( currentMode !== "save" ) {
      currentTag = null;
    }
    tagTree.view.selection.currentIndex = -1;
    tagTree.view.selection.select( -1 );
    tagTree.addEventListener( "select", onTagSelect, false );
    onCategorySelectionChange( item );
  };

  function onCategorySelectionChange( item ) {
    currentCategory = ( item ?
      categories[item.getAttribute( "id" ).substr( 9 )].category : null );
    updateNoteTree();
    initNoteSelection();
  };

  function initCategorySelection() {
    var index, item = getItemOfCategory( currentCategory );
    if ( !item ) {
      currentCategory = null;
      if ( Object.keys( categories ).length ) {
        item = categories[Object.keys( categories )[0]].item;
        currentCategory = categories[Object.keys( categories )[0]].category;
      }
    }
    index = ( item ? categoryTree.view.getIndexOfItem( item ) : -1 );
    categoryTree.view.selection.select( index );
    if ( index == -1 ) {
      onCategorySelectionChange( item );
    }
    categoryTree.focus();
  };
  
  // TAGS

  function onTagChanged( e ) {
    if ( !currentBook ) {
      return;
    }
    var aTag = e.data.changedTag;
    updateTagCSSRules( aTag );
    updateTagTreeItem( aTag );
    updateTagMenu();
    updateNoteTree();
    initNoteSelection();
  };

  function onTagInserted( e ) {
    e.data.appendedTag = e.data.insertedTag;
    onTagAppended( e );
  };

  function onTagAppended( e ) {
    if ( !currentBook ) {
      return;
    }
    updateTagMenu();
    var aTag = e.data.appendedTag;
    var aRow = aTag.getIndex();
    var id = aTag.getId();
    var aTreeItem = getItemOfTag( aTag );
    if ( !aTreeItem ) {
      aTreeItem = createTagTreeItem( aTag );
      aTreeItem.setAttribute( "id", "tag_" + id );
      tags[id] = {
        tag: aTag,
        item: aTreeItem
      }
    }
    tags[id].row = aRow;
    if ( aRow == tagTree.view.rowCount ) {
      tagTreeChildren.appendChild( aTreeItem );
    } else {
      tagTreeChildren.insertBefore( aTreeItem,
        tagTree.view.getItemAtIndex( aRow ) );
    }
    if ( currentTag && currentTag == aTag && currentMode === "open" ) {
      tagTree.view.selection.currentIndex = aRow;
      tagTree.view.selection.select( aRow );
    }
  };

  function onTagRemoved( e ) {
    if ( !currentBook ) {
      return;
    }
    var aTag = e.data.removedTag;
    var aTreeItem = getItemOfTag( aTag );
    tagTree.removeEventListener( "select", onTagSelect, false );
    aTreeItem.parentNode.removeChild( aTreeItem );
    tagTree.addEventListener( "select", onTagSelect, false );
  };
  
  function onTagDeleted( e ) {
    if ( !currentBook ) {
      return;
    }
    var aTag = e.data.deletedTag;
    updateTagMenu();
    var id = aTag.getId();
    var aRow = tags[id].row;
    delete tags[id];
    if ( currentTag && currentTag == aTag && currentMode === "open" ) {
      if ( aRow == tagTree.view.rowCount ) {
        aRow--;
      }
      tagTree.view.selection.currentIndex = aRow;
      tagTree.view.selection.select( aRow );
    }
  };

  function updateTagCSSRules( tag ) {
    var id = tag.getId();
    var colors = Utils.getHighlightColors( tag.getColor(), "#FFFFFF" );
    var rules = [];
    rules.push( {
      selector: "treechildren::-moz-tree-cell-text(NOTE_TAG_ROW_" + id + ")",
      declaration: "color: " + colors.fgColor + ";"
    } );
    rules.push( {
      selector:
        "treechildren::-moz-tree-cell-text(selected,focus,NOTE_TAG_ROW_" +
        id + ")",
      declaration: "color: " + colors.fgColorSelected + " !important;"
    } );
    rules.push( {
      selector: "treechildren::-moz-tree-row(NOTE_TAG_ROW_" + id + ")",
      declaration: "background-color: " + colors.bgColor + " !important;"
    } );
    rules.push( {
      selector: "treechildren::-moz-tree-row(selected,focus,NOTE_TAG_ROW_" +
                id + ")",
      declaration: "background-color: " + colors.bgColorSelected +
                   " !important;"
    } );
    for ( var i = 0; i < rules.length; i++ ) {
      Utils.deleteCSSRule( document, rules[i].selector );
    }
    if ( Utils.IS_HIGHLIGHT_ROW ) {
      for ( var i = 0; i < rules.length; i++ ) {
        Utils.addCSSRule( document, rules[i].selector, rules[i].declaration );
      }
    }
    noteTreeBoxObject.clearStyleAndImageCaches();
  };
  
  function updateTagTreeItem( tag ) {
    var id = tag.getId();
    var name = tag.getName();
    var color = tag.getColor();
    var index = tag.getIndex();
    var treeItem = getItemOfTag( tag );
    var treeRow = treeItem.firstChild;
    // Name
    var treeCell = treeRow.childNodes[
      tagTree.columns.getNamedColumn( "tagTreeName" ).index ];
    treeCell.setAttribute( "label", name );
    // Color
    Utils.changeCSSRule(
      document,
      "treechildren::-moz-tree-cell(TAG_" + id + ")",
      "background-color: " + color + ";border: 1px solid;"
    );
    Utils.changeCSSRule(
      document,
      "treechildren::-moz-tree-image(NOTE_TAG_" + id + ")",
      "list-style-image: url('" +
        Utils.makeTagImage( color, true, 16 ) + "');"
    );
    Utils.changeCSSRule(
      document,
      "treechildren::-moz-tree-cell-text(NOTE_TAG_" + id + ")",
      "padding-left: 3px;"
    );
    tagTreeBoxObject.clearStyleAndImageCaches();
  };

  function createTagTreeItem( tag ) {
    var treeItem = null;
    var treeRow = null;
    var treeCell = null;
    var id = tag.getId();
    var color = tag.getColor();
    Utils.addCSSRule(
      document,
      "treechildren::-moz-tree-cell(TAG_" + id + ")",
      "background-color: " + color + ";border: 1px solid;"
    );
    Utils.addCSSRule(
      document,
      "treechildren::-moz-tree-image(NOTE_TAG_" + id + ")",
      "list-style-image: url('" +
        Utils.makeTagImage( color, true, 16 ) + "');"
    );
    Utils.addCSSRule(
      document,
      "treechildren::-moz-tree-cell-text(NOTE_TAG_" + id + ")",
      "padding-left: 3px;"
    );
    treeRow = document.createElement( "treerow" );
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", tag.getName() );
    treeCell.setAttribute( "properties", "tag" );
    treeRow.appendChild( treeCell );
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", "" );
    treeCell.setAttribute( "properties", "tag_color TAG_" + id );
    treeRow.appendChild( treeCell );
    treeItem = document.createElement( "treeitem" );
    treeItem.appendChild( treeRow );
    return treeItem;
  };
  
  function updateTagTree() {
    tagTree.removeEventListener( "select", onTagSelect, false );
    while ( tagTreeChildren.firstChild ) {
      tagTreeChildren.removeChild( tagTreeChildren.firstChild );
    }
    tags = {};
    if ( currentBook && currentBook.isOpen() ) {
      var tagList = currentBook.getTagList();
      tagList.getNoTag().setName( getString( "main.notag.name" ) );
      var tagArray = tagList.getTagsAsArray();
      var tag, id, row, treeItem;      
      for ( var i = 0; i < tagArray.length; i++ ) {
        tag = tagArray[i];
        id = tag.getId();
        row = tag.getIndex();
        treeItem = createTagTreeItem( tag );
        treeItem.setAttribute( "id", "tag_" + id );
        tags[id] = {
          tag: tag,
          item: treeItem,
          row: row
        };
        tagTreeChildren.appendChild( treeItem );
      }
      tagTreeBoxObject.clearStyleAndImageCaches();      
      tagList.addStateListener( tagListStateListener );
    }
    tagTree.addEventListener( "select", onTagSelect, false );
  };

  function onTagSelect( event ) {
    var index = tagTree.view.selection.currentIndex;
    var item = ( index != -1 ? tagTree.view.getItemAtIndex( index ) : null );
    categoryTree.removeEventListener( "select", onCategorySelect, false );
    currentCategory = null;
    categoryTree.view.selection.currentIndex = -1;
    categoryTree.view.selection.select( -1 );
    categoryTree.addEventListener( "select", onCategorySelect, false );
    onTagSelectionChange( item );
  };

  function onTagSelectionChange( item ) {
    currentTag = ( item ?
      tags[item.getAttribute( "id" ).substr( 4 )].tag : null );
    updateNoteTree();
    initNoteSelection();
  };
  
  function initTagSelection() {
    var index, item = getItemOfTag( currentTag );
    if ( !item ) {
      currentTag = null;
      if ( Object.keys( tags ).length ) {
        item = tags[Object.keys( tags )[0]].item;
        currentTag = tags[Object.keys( tags )[0]].tag;
      }
    }
    index = ( item ? tagTree.view.getIndexOfItem( item ) : -1 );
    tagTree.view.selection.select( index );
    if ( index == -1 ) {
      onTagSelectionChange( item );
    }
    tagTree.focus();
  };
  
  // NOTES
  
  function onNoteDblClick( event ) {
    var aRow = noteTreeBoxObject.getRowAt( event.clientX, event.clientY );
    if ( event.button != "0" || !currentNote ||
         aRow < 0 || aRow > noteTree.view.rowCount - 1 ) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if ( currentMode === "open" ) {
      btnAccept.click();
    }
  };

  function isNoteInTree( aNote, aParent ) {
    if ( currentTag ) {
      var ids = aNote.getTags();
      if ( currentTag.isNoTag() ) {
        if ( ids.length > 0 ) {
          return false;
        }
      } else {
        if ( ids.indexOf( currentTag.getId() ) < 0 ) {
          return false;
        }
      }
    } else if ( currentCategory ) {
      if ( currentCategory != aParent ) {
        return false;
      }
    }
    return true;
  };
  
  function onNoteInserted( e ) {
    e.data.appendedNote = e.data.insertedNote;
    onNoteAppended( e );
  };

  function onNoteAppended( e ) {
    if ( !currentBook ) {
      return;
    }
    var aNote = e.data.appendedNote;
    var aCategory = e.data.parentCategory;
    updateCategoryTreeItem( aCategory );
    var id = aNote.getId();
    if ( !isNoteInTree( aNote, aCategory ) ) {
      if ( currentNote && currentNote == aNote ) {
        aRow = notes[id].row;
        if ( aRow == noteTree.view.rowCount ) {
          aRow--;
        }
        noteTree.view.selection.currentIndex = aRow;
        noteTree.view.selection.select( aRow );
      }
      return;
    }
    var aTreeItem = getItemOfNote( aNote );
    if ( !aTreeItem ) {
      aTreeItem = createNoteTreeItem( aNote );
      aTreeItem.setAttribute( "id", "note_" + id );
      notes[id] = {
        note: aNote,
        item: aTreeItem
      }
    } else {
      updateNoteTreeItem( aNote );
    }
    var aRow = currentCategory ? aNote.getIndex() : noteTree.view.rowCount;
    notes[id].row = aRow;
    if ( aRow == noteTree.view.rowCount ) {
      noteTreeChildren.appendChild( aTreeItem );
    } else {
      noteTreeChildren.insertBefore( aTreeItem,
        noteTree.view.getItemAtIndex( aRow ) );
    }
    if ( currentNote && currentNote == aNote ) {
      noteTree.view.selection.currentIndex = aRow;
      noteTree.view.selection.select( aRow );
    }
  };

  function onNoteRemoved( e ) {
    if ( !currentBook ) {
      return;
    }
    var aNote = e.data.removedNote;
    var aCategory = e.data.parentCategory;
    updateCategoryTreeItem( aCategory );
    if ( !isNoteInTree( aNote, aCategory ) ) {
      return;
    }
    var aTreeItem = getItemOfNote( aNote );
    noteTree.removeEventListener( "select", onNoteSelect, false );
    aTreeItem.parentNode.removeChild( aTreeItem );
    noteTree.addEventListener( "select", onNoteSelect, false );
  };

  function onNoteDeleted( e ) {
    if ( !currentBook ) {
      return;
    }
    var aNote = e.data.deletedNote;
    var aCategory = e.data.parentCategory;
    if ( !isNoteInTree( aNote, aCategory ) ) {
      return;
    }
    var id = aNote.getId();
    var aRow = notes[id].row;
    delete notes[id];
    if ( currentNote && currentNote == aNote ) {
      if ( aRow == noteTree.view.rowCount ) {
        aRow--;
      }
      noteTree.view.selection.currentIndex = aRow;
      noteTree.view.selection.select( aRow );
    }
  };
  
  function onNoteChanged( e ) {
    if ( !currentBook ) {
      return;
    }
    var aNote = e.data.changedNote;
    var aCategory = e.data.parentCategory;
    if ( !isNoteInTree( aNote, aCategory ) ) {
      return;
    }
    updateNoteTreeItem( aNote );
    if ( currentNote && currentNote == aNote ) {
      onNoteSelect();
    }
  };

  function onNoteTagsChanged( e ) {
    if ( !currentBook ) {
      return;
    }
    var aNote = e.data.changedNote;
    var aCategory = e.data.parentCategory;
    if ( currentCategory ) {
      if ( !isNoteInTree( aNote, aCategory ) ) {
        return;
      }
      onNoteChanged( e );
    } else if ( currentTag ) {
      var id = aNote.getId();
      var aTreeItem = getItemOfNote( aNote );
      if ( isNoteInTree( aNote, aCategory ) ) {
        if ( !aTreeItem ) {
          aTreeItem = createNoteTreeItem( aNote );
          aTreeItem.setAttribute( "id", "note_" + id );
          notes[id] = {
            note: aNote,
            item: aTreeItem,
            row: noteTree.view.rowCount
          }
          noteTreeChildren.appendChild( aTreeItem );
          if ( !currentNote ) {
            noteTree.view.selection.currentIndex = 0;
            noteTree.view.selection.select( 0 );
          }          
        }
      } else {
        if ( aTreeItem ) {
          noteTree.removeEventListener( "select", onNoteSelect, false );
          aTreeItem.parentNode.removeChild( aTreeItem );
          noteTree.addEventListener( "select", onNoteSelect, false );
          var aRow = notes[id].row;
          delete notes[id];
          if ( currentNote && currentNote == aNote ) {
            if ( aRow == noteTree.view.rowCount ) {
              aRow--;
            }
            noteTree.view.selection.currentIndex = aRow;
            noteTree.view.selection.select( aRow );
          }
        }
      }
    }
  };

  function onNoteMainTagChanged( e ) {
    onNoteChanged( e );
  };
  
  function onNoteTypeChanged( e ) {
    onNoteChanged( e );
  };

  function onNoteAttachmentAppended( e ) {
    onNoteChanged( e );
  };

  function onNoteAttachmentRemoved( e ) {
    onNoteChanged( e );
  };
  
  function createNoteTreeItem( note ) {
    var aName = note.getName();
    var isLoading = note.isLoading();
    var aCategoryName = note.getParent().getName();
    var hasAttachments = note.hasAttachments();
    var aCreateDateTime = note.getCreateDateTime().toLocaleString();
    var anUpdateDateTime = note.getUpdateDateTime().toLocaleString();
    var aTypeName = note.getType();
    //
    var tagList = note.getBook().getTagList();
    var aNoTag = tagList.getNoTag();
    var aTagName = aNoTag.getName();
    var aTagColor = aNoTag.getColor();
    var aTagID = note.getMainTag();
    if ( aTagID != null ) {
      var aTag = tagList.getTagById( aTagID );
      aTagName = aTag.getName();
      aTagColor = aTag.getColor();
    } else {
      aTagID = "00000000000000000000000000000000";
    }
    //
    var treeItem, treeRow, treeCell;
    treeRow = document.createElement( "treerow" );
    Utils.addProperty( treeRow, "NOTE_TAG_ROW_" + aTagID );
    treeCell = document.createElement( "treecell" );
    if ( hasAttachments ) {
      Utils.addProperty( treeCell, "attachment" );
    }
    Utils.addProperty( treeCell, "NOTE_TAG_ROW_" + aTagID );
    treeRow.appendChild( treeCell );
    treeCell = document.createElement( "treecell" );
    if ( isLoading ) {
      Utils.removeProperty( treeCell, "note" );
      Utils.addProperty( treeCell, "loading" );
      treeCell.setAttribute( "label", " " +
        getString( "main.note.loading" ) );
    } else {
      Utils.removeProperty( treeCell, "loading" );
      Utils.addProperty( treeCell, "note" );
      treeCell.setAttribute( "label", aName );
    }
    Utils.addProperty( treeCell, "NOTE_TAG_ROW_" + aTagID );
    treeRow.appendChild( treeCell );
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", aCategoryName );
    Utils.addProperty( treeCell, "NOTE_TAG_ROW_" + aTagID );
    treeRow.appendChild( treeCell );
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", aTagName );
    Utils.addProperty( treeCell, "NOTE_TAG_" + aTagID );
    Utils.addProperty( treeCell, "NOTE_TAG_ROW_" + aTagID );
    treeRow.appendChild( treeCell );
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", aTypeName );
    Utils.addProperty( treeCell, "NOTE_TAG_ROW_" + aTagID );
    treeRow.appendChild( treeCell );
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", aCreateDateTime );
    Utils.addProperty( treeCell, "NOTE_TAG_ROW_" + aTagID );
    treeRow.appendChild( treeCell );
    treeCell = document.createElement( "treecell" );
    treeCell.setAttribute( "label", anUpdateDateTime );
    Utils.addProperty( treeCell, "NOTE_TAG_ROW_" + aTagID );
    treeRow.appendChild( treeCell );
    treeItem = document.createElement( "treeitem" );
    treeItem.appendChild( treeRow );
    return treeItem;
  };
  
  function updateNoteTreeItem( note ) {
    var aName = note.getName();
    var isLoading = note.isLoading();
    var aCategoryName = note.getParent().getName();
    var hasAttachments = note.hasAttachments();
    var aCreateDateTime = note.getCreateDateTime().toLocaleString();
    var anUpdateDateTime = note.getUpdateDateTime().toLocaleString();
    var aTypeName = note.getType();
    var treeCell, treeRow;
    var treeItem = getItemOfNote( note );
    //
    var tagList = note.getBook().getTagList();
    var aTag, aNoTag = tagList.getNoTag();
    var aTagName = aNoTag.getName();
    var aTagColor = aNoTag.getColor();
    var aTagID = note.getMainTag();
    if ( aTagID != null ) {
      var aTag = tagList.getTagById( aTagID );
      aTagName = aTag.getName();
      aTagColor = aTag.getColor();
    } else {
      aTagID = "00000000000000000000000000000000";
    }
    //
    treeRow = treeItem.firstChild;
    Utils.setProperty( treeRow, "NOTE_TAG_ROW_" + aTagID );
    // Attachments
    treeCell = treeRow.childNodes[ noteTree.columns.getNamedColumn( "noteTreeAttachments" ).index ];
    if ( note.hasAttachments() ) {
      Utils.setProperty( treeCell, "attachment" );
    } else {
      Utils.removeProperty( treeCell, "attachment" );
    }
    Utils.addProperty( treeCell, "NOTE_TAG_ROW_" + aTagID );
    // Name
    treeCell = treeRow.childNodes[ noteTree.columns.getNamedColumn( "noteTreeName" ).index ];
    if ( isLoading ) {
      treeCell.setAttribute( "label", " " + getString( "main.note.loading" ) );
      Utils.setProperty( treeCell, "loading" );
    } else {
      treeCell.setAttribute( "label", note.getName() );
      Utils.setProperty( treeCell, "note" );
    }
    Utils.addProperty( treeCell, "NOTE_TAG_ROW_" + aTagID );
    // Category
    treeCell = treeRow.childNodes[ noteTree.columns.getNamedColumn( "noteTreeCategory" ).index ];
    treeCell.setAttribute( "label", note.getParent().getName() );
    Utils.setProperty( treeCell, "NOTE_TAG_ROW_" + aTagID );
    // Tag
    treeCell = treeRow.childNodes[ noteTree.columns.getNamedColumn( "noteTreeTag" ).index ];
    treeCell.setAttribute( "label", aTagName );
    Utils.setProperty( treeCell, "NOTE_TAG_" + aTagID );
    Utils.addProperty( treeCell, "NOTE_TAG_ROW_" + aTagID );
    // Type
    treeCell = treeRow.childNodes[ noteTree.columns.getNamedColumn( "noteTreeType" ).index ];
    treeCell.setAttribute( "label", aTypeName );
    Utils.setProperty( treeCell, "NOTE_TAG_ROW_" + aTagID );
    // Create DateTime
    treeCell = treeRow.childNodes[ noteTree.columns.getNamedColumn( "noteTreeCreateDateTime" ).index ];
    treeCell.setAttribute( "label", aCreateDateTime );
    Utils.setProperty( treeCell, "NOTE_TAG_ROW_" + aTagID );
    // Update DateTime
    treeCell = treeRow.childNodes[ noteTree.columns.getNamedColumn( "noteTreeUpdateDateTime" ).index ];
    treeCell.setAttribute( "label", anUpdateDateTime );
    Utils.setProperty( treeCell, "NOTE_TAG_ROW_" + aTagID );
    //
    noteTreeBoxObject.clearStyleAndImageCaches();
  };
  
  function updateNoteTree() {
    noteTree.removeEventListener( "select", onNoteSelect, false );
    while ( noteTreeChildren.firstChild ) {
      noteTreeChildren.removeChild( noteTreeChildren.firstChild );
    }
    notes = {};
    if ( currentBook && currentBook.isOpen() ) {
      var notesArray = [];
      if ( currentCategory ) {
        notesArray = currentCategory.getNotes();
      } else if ( currentTag ) {
        notesArray = currentBook.getContentTree()
                                .getNotesByTag( currentTag.getId() );
      }
      var note, id, treeItem; 
      for ( var i = 0; i < notesArray.length; i++ ) {
        note = notesArray[i];
        id = note.getId();
        treeItem = createNoteTreeItem( note );
        treeItem.setAttribute( "id", "note_" + id );
        notes[id] = {
          note: note,
          item: treeItem,
          row: noteTree.view.rowCount
        };
        noteTreeChildren.appendChild( treeItem );
      }
    }
    noteTree.addEventListener( "select", onNoteSelect, false );
  };

  function onNoteSelect( event ) {
    var index = noteTree.view.selection.currentIndex;
    var item = ( index != -1 ? noteTree.view.getItemAtIndex( index ) : null );
    onNoteSelectionChange( item );
  };

  function onNoteSelectionChange( item ) {
    currentNote = ( item ?
      notes[item.getAttribute( "id" ).substr( 5 )].note : null );
    updateNoteInfo();
  };
  
  function initNoteSelection() {
    var index, item = getItemOfNote( currentNote );
    if ( !item ) {
      currentNote = null;
      if ( Object.keys( notes ).length ) {
        item = notes[Object.keys( notes )[0]].item;
        currentNote = notes[Object.keys( notes )[0]].note;
      }
    }
    index = ( item ? noteTree.view.getIndexOfItem( item ) : -1 );
    noteTree.view.selection.select( index );
    if ( index == -1 ) {
      onNoteSelectionChange( item );
    }
    noteTree.focus();
  };
  
  function updateNoteInfo() {
    if ( !currentBook || !currentBook.isOpen() ) {
      tbBook.value = "";
      tbCategory.value = "";
      tbName.value = "";
      setSelectedType( null );
      updateTags( [] );
      btnTags.setAttribute( "disabled", "true" );
      tbName.setAttribute( "readonly", "true" );
      btnAccept.setAttribute( "disabled", "true" );
      return;
    }
    tbBook.value = ( currentNote ? currentNote.getBook().getName() :
                                   currentBook.getName() );
    tbCategory.value = ( currentNote ? currentNote.getParent().getName() :
                                       currentCategory.getName() );
    setSelectedType( currentNote ? currentNote.getType() :
                                   Utils.DEFAULT_DOCUMENT_TYPE );
    if ( currentMode === "save" ) {
      if ( currentName ) {
        tbName.value = currentName;
        currentName = null;
      } else {
        tbName.value = ( currentNote ? currentNote.getName() : "" );
      }
      updateTags( currentTag ? [ currentTag.getId() ] :
                               ( currentNote ? currentNote.getTags() : [] ) );
    } else {
      tbName.value = ( currentNote ? currentNote.getName() : "" );
      updateTags( currentNote ? currentNote.getTags() : [] );
    }
    if ( currentMode === "save" ) {
      btnTags.removeAttribute( "disabled" );
      tbName.removeAttribute( "readonly" );
      checkName();
    } else {
      btnTags.setAttribute( "disabled", "true" );
      tbName.setAttribute( "readonly", "true" );
      if ( currentNote ) {
        btnAccept.removeAttribute( "disabled" );
      } else {
        btnAccept.setAttribute( "disabled", "true" );
      }
    }
    if ( onlyCategories ) {
      btnAccept.removeAttribute( "disabled" );
    }
    if ( currentMode === "save" ) {
      window.setTimeout( focusName, 0 );
    }
  };
  
  function focusName() {
    tbName.focus();
  };
  
  function checkName() {
    if ( currentMode === "open" ) {
      btnAccept.removeAttribute( "disabled" );
      return;
    }
    var aName = tbName.value.trim();
    if ( !aName.length ) {
      btnAccept.setAttribute( "disabled", "true" );
      return;
    }
    if ( canOverwrite ) {
      btnAccept.removeAttribute( "disabled" );
    } else {
      if ( !currentCategory ||
           !currentCategory.canCreateNote( aName, getSelectedType() ) ) {
        btnAccept.setAttribute( "disabled", "true" );
      } else {
        btnAccept.removeAttribute( "disabled" );
      }
    }
  };
  
  // HELPERS

  function getString( name ) {
    return Utils.STRINGS_BUNDLE.getString( name );
  };

  function getFormattedString( name, values ) {
    return Utils.STRINGS_BUNDLE.getFormattedString( name, values );
  };
  
  function getItemOfBook( book ) {
    if ( book ) {
      for ( var id in books ) {
        if ( books[id].book == book ) {
          return books[id].item;
        }
      }
    }
    return null;
  };
  
  function getItemOfCategory( category ) {
    if ( category ) {
      for ( var id in categories ) {
        if ( categories[id].category == category ) {
          return categories[id].item;
        }
      }
    }
    return null;
  };

  function getItemOfTag( tag ) {
    if ( tag ) {
      for ( var id in tags ) {
        if ( tags[id].tag == tag ) {
          return tags[id].item;
        }
      }
    }
    return null;
  };

  function getItemOfNote( note ) {
    if ( note ) {
      for ( var id in notes ) {
        if ( notes[id].note == note ) {
          return notes[id].item;
        }
      }
    }
    return null;
  };
  
  function onTypeChange( event ) {
    if ( currentMode === "open" ) {
      setSelectedType( currentNote ? currentNote.getType() : null );
    }
  };
  
  function getSelectedType() {
    var selectedItem = mlType.selectedItem;
    return selectedItem ? selectedItem.getAttribute( "value" ) : null;
  };
  
  function setSelectedType( aType ) {
    if ( !aType ) {
      mlType.selectedItem = null;
      return;
    }
    var menuItem;
    for ( var i = 0; i < mpType.childNodes.length; i++ ) {
      menuItem = mpType.childNodes[i];
      if ( menuItem.getAttribute( "value" ) === aType ) {
        mlType.selectedItem = menuItem;
        return;
      }
    }
  };

  function updateTypeMenu() {
    var doc, docs = documentManager.getDocuments();
    var docType, docName, menuItem;
    mlType.selectedItem = null;
    while ( mpType.firstChild ) {
      mpType.removeChild( mpType.firstChild );
    }
    for ( var name in docs ) {
      doc = docs[ name ];
      docName = doc.getName();
      docType = doc.getType();
      menuItem = document.createElement( "menuitem" );
      menuItem.setAttribute( "id", "menuitem_" + docName );
      menuItem.setAttribute( "label", docType );
      menuItem.setAttribute( "value", docType );
      menuItem.className = "menuitem-iconic";
      mpType.appendChild( menuItem );
      if ( docType == Utils.DEFAULT_DOCUMENT_TYPE ) {
        mlType.selectedItem = menuItem;
      }
    }
  };
  
  function showTagMenu( event ) {
    mpTags.openPopup(
      btnTags,
      "before_start",
      0,
      0,
      false,
      false,
      null
    );
  };
  
  function updateTagMenu() {
    while ( mpTags.firstChild ) {
      mpTags.removeChild( mpTags.firstChild );
    }
    if ( currentBook && currentBook.isOpen() ) {
      var tag, tags = currentBook.getTagList().getTagsAsArray();
      var menuItem, id, name, color, image, flag = false;
      for ( var i = 0; i < tags.length; i++ ) {
        tag = tags[i];
        if ( !tag.isNoTag() ) {
          if ( !flag ) {
            flag = true;
            menuItem = document.createElement( "menuitem" );
            menuItem.className = "menuitem-iconic";
            menuItem.setAttribute( "label",
              Utils.STRINGS_BUNDLE.getString( "body.tagmenu.clearalltags" ) );
            if ( currentMode === "save" ) {
              menuItem.addEventListener( "command", onTagMenuClear, false );
            }
            mpTags.appendChild( menuItem );
            mpTags.appendChild( document.createElement( "menuseparator" ) );
          }
          id = tag.getId();
          name = tag.getName();
          color = tag.getColor();
          image = Utils.makeTagImage( color, false, 16 );
          menuItem = document.createElement( "menuitem" );
          menuItem.setAttribute( "class", "menuitem-iconic" );
          menuItem.setAttribute( "image", image );
          menuItem.setAttribute( "label", name );
          menuItem.setAttribute( "value", "0;" + id + ";" + color );
          menuItem.setAttribute( "id", "tagmenuitem_" + id );
          if ( currentMode === "save" ) {
            menuItem.addEventListener( "command", onTagMenuClick, false );
          }
          mpTags.appendChild( menuItem );
        }
      }
    }
  };

  function updateTags( tagIDs ) {
    while ( hbTags.firstChild && hbTags.firstChild != btnTags ) {
      hbTags.removeChild( hbTags.firstChild );
    }
    var menuItem, button, next, arr, id, color;
    for ( var i = 2; i < mpTags.children.length; i++ ) {
      menuItem = mpTags.children[i];
      arr = menuItem.getAttribute( "value" ).split( ";" );
      id = arr[1];
      color = arr[2];
      arr[0] = ( tagIDs && tagIDs.indexOf( id ) >= 0 ? "1" : "0" );
      menuItem.setAttribute( "value", arr.join( ";" ) );
      menuItem.setAttribute( "image",
        Utils.makeTagImage( color, arr[0] === "1", 16 ) );
    }
    if ( currentBook && currentBook.isOpen() ) {
      var tagList = currentBook.getTagList();
      var tag, tags = [];
      var button, menuItem;
      if ( tagIDs && tagIDs.length > 0 ) {
        for ( var i = 0; i < tagIDs.length; i++ ) {
          tags.push( tagList.getTagById( tagIDs[i] ) );
        }
      } else {
        if ( tagIDs ) {
          tags.push( tagList.getNoTag() );
        }
      }
      for ( var i = 0; i < tags.length; i++ ) {
        tag = tags[i];
        button = document.createElement( "button" );
        button.setAttribute( "id", "tagbutton_" + tag.getId() );
        button.setAttribute( "class", "tagbutton" );
        button.setAttribute( "label", " " + tag.getName() );
        button.setAttribute( "image",
          Utils.makeTagImage( tag.getColor(), true, 16 ) );
        if ( currentMode === "save" ) {
          button.addEventListener( "command", onTagButtonClick, false );
        }
        hbTags.insertBefore( button, btnTags );
      }
    }
  };
  
  function onTagButtonClick( event ) {
    var button = event.target;
    hbTags.removeChild( button );
    hbTags.insertBefore( button, hbTags.firstChild );
  };
  
  function onTagMenuClear() {
    var menuItem, button, arr, color, tag;
    for ( var i = 2; i < mpTags.children.length; i++ ) {
      menuItem = mpTags.children[i];
      arr = menuItem.getAttribute( "value" ).split( ";" );
      arr[0] = "0";
      color = arr[2];
      menuItem.setAttribute( "value", arr.join( ";" ) );
      menuItem.setAttribute( "image",
        Utils.makeTagImage( color, false, 16 ) );
    }
    while ( hbTags.firstChild && hbTags.firstChild != btnTags ) {
      hbTags.removeChild( hbTags.firstChild );
    }
    if ( currentBook && currentBook.isOpen() ) {
      tag = currentBook.getTagList().getNoTag();
      button = document.createElement( "button" );
      button.setAttribute( "id", "tagbutton_" + tag.getId() );
      button.setAttribute( "class", "tagbutton" );
      button.setAttribute( "label", " " + tag.getName() );
      button.setAttribute( "image",
        Utils.makeTagImage( tag.getColor(), true, 16 ) );
      if ( currentMode === "save" ) {
        button.addEventListener( "command", onTagButtonClick, false );
      }
      hbTags.insertBefore( button, btnTags );
    }
  };
  
  function onTagMenuClick( event ) {
    var menuItem = event.target;
    var arr = menuItem.getAttribute( "value" ).split( ";" );
    var id = arr[1];
    arr[0] = ( arr[0] === "0" ) ? "1" : "0";
    var checked = ( arr[0] === "1" );
    menuItem.setAttribute( "value", arr.join( ";" ) );
    menuItem.setAttribute( "image",
      Utils.makeTagImage( arr[2], checked, 16 ) );
    if ( currentBook && currentBook.isOpen() ) {
      var button, tag, tagList = currentBook.getTagList();
      if ( checked ) {
        button = hbTags.firstChild;
        if ( button.id.substr( 10 ) === tagList.getNoTag().getId() ) {
          hbTags.removeChild( button );
        }
        tag = tagList.getTagById( id );
        button = document.createElement( "button" );
        button.setAttribute( "id", "tagbutton_" + id );
        button.setAttribute( "class", "tagbutton" );
        button.setAttribute( "label", " " + tag.getName() );
        button.setAttribute( "image",
          Utils.makeTagImage( tag.getColor(), true, 16 ) );
        if ( currentMode === "save" ) {
          button.addEventListener( "command", onTagButtonClick, false );
        }
        hbTags.insertBefore( button, btnTags );
      } else {
        button = document.getElementById( "tagbutton_" + id );
        hbTags.removeChild( button );
        if ( hbTags.firstChild == btnTags ) {
          tag = tagList.getNoTag();
          button = document.createElement( "button" );
          button.setAttribute( "id", "tagbutton_" + tag.getId() );
          button.setAttribute( "class", "tagbutton" );
          button.setAttribute( "label", " " + tag.getName() );
          button.setAttribute( "image",
            Utils.makeTagImage( tag.getColor(), true, 16 ) );
          if ( currentMode === "save" ) {
            button.addEventListener( "command", onTagButtonClick, false );
          }
          hbTags.insertBefore( button, btnTags );
        }
      }
    }
  };
  
  function getSelectedTags() {
    var tagIDs = [];
    var noTagId = currentBook.getTagList().getNoTag().getId();
    var id, button = hbTags.firstChild;
    while ( button && button != btnTags ) {
      id = button.id.substr( 10 );
      if ( id !== noTagId ) {
        tagIDs.push( id );
      }
      button = button.nextSibling;
    }
    return tagIDs;
  };
  
  function onNameFocus( event ) {
    tbName.select();
  };
  
  function onNameKeyPress( event ) {
    window.setTimeout( checkName, 0 );
  };
  
  function updateModeView() {
    if ( currentMode === "save" ) {
      tagsSplitter.setAttribute( "collapsed", "true" );
      vbTags.setAttribute( "collapsed", "true" );
      btnTags.removeAttribute( "collapsed" );
      if ( onlyCategories ) {
        vbFolders.classList.remove( "vbFoldersSave" );
        vbFolders.classList.add( "vbFoldersOpen" );
      } else {
        vbFolders.classList.remove( "vbFoldersOpen" );
        vbFolders.classList.add( "vbFoldersSave" );
      }
    } else {
      btnTags.setAttribute( "collapsed", "true" );
      tagsSplitter.removeAttribute( "collapsed" );
      vbTags.removeAttribute( "collapsed" );
      vbFolders.classList.remove( "vbFoldersSave" );
      vbFolders.classList.add( "vbFoldersOpen" );
    }
    if ( onlyCategories ) {
      booksSplitter.setAttribute( "collapsed", "true" );
      tagsSplitter.setAttribute( "collapsed", "true" );
      vbTags.setAttribute( "collapsed", "true" );
      vbNotes.setAttribute( "collapsed", "true" );
      vbRight.insertBefore( vbLeft.removeChild( vbFolders ), vbNotes );
      vbBooks.classList.remove( "vbBooksNotes" );
      vbBooks.classList.add( "vbBooksCategories" );
      lblName.setAttribute( "collapsed", "true" );
      hbName.setAttribute( "collapsed", "true" );
      lblTags.setAttribute( "collapsed", "true" );
      hbTags.setAttribute( "collapsed", "true" );
      lblType.setAttribute( "collapsed", "true" );
      mlType.setAttribute( "collapsed", "true" );
    }
  };
  
  function addEventListeners() {
    bookTree.addEventListener( "select", onBookSelect, false );
    bookTree.addEventListener( "dblclick", onBookDblClick, false );
    categoryTree.addEventListener( "select", onCategorySelect, false );
    tagTree.addEventListener( "select", onTagSelect, false );
    noteTree.addEventListener( "select", onNoteSelect, false );
    noteTree.addEventListener( "dblclick", onNoteDblClick, false );
    tbName.addEventListener( "focus", onNameFocus, false );
    tbName.addEventListener( "keypress", onNameKeyPress, true );
    btnTags.addEventListener( "command", showTagMenu, false );
    mlType.addEventListener( "command", onTypeChange, false );
    bookManager.addStateListener( booksStateListener );
  };

  function removeEventListeners() {
    bookTree.removeEventListener( "select", onBookSelect, false );
    bookTree.removeEventListener( "dblclick", onBookDblClick, false );
    categoryTree.removeEventListener( "select", onCategorySelect, false );
    tagTree.removeEventListener( "select", onTagSelect, false );
    noteTree.removeEventListener( "select", onNoteSelect, false );
    noteTree.removeEventListener( "dblclick", onNoteDblClick, false );
    tbName.removeEventListener( "focus", onNameFocus, false );
    tbName.removeEventListener( "keypress", onNameKeyPress, true );
    btnTags.removeEventListener( "command", showTagMenu, false );
    mlType.removeEventListener( "command", onTypeChange, false );
    bookManager.removeStateListener( booksStateListener );
  };
  
  // PUBLIC
  
  var pub = {};

  pub.onLoad = function() {
    // query
    var query = Utils.parseQueryString(
      window.location.search.substring( 1 ) );
    if ( "mode" in query ) {
      currentMode = query["mode"];
    }
    currentMode = ( currentMode === "save" ? currentMode : "open" );
    onlyCategories = false;
    if ( "type" in query ) {
      onlyCategories = ( query["type"] === "category" );
    }
    // arguments
    if ( window.arguments[0].input.title ) {
      document.title = window.arguments[0].input.title;
    }
    canOverwrite = false;
    if ( window.arguments[0].input.canOverwrite !== undefined ) {
      canOverwrite = !!window.arguments[0].input.canOverwrite;
    }
    if ( window.arguments[0].input.aBook ) {
      currentBook = window.arguments[0].input.aBook;
    }
    if ( window.arguments[0].input.aCategory ) {
      currentCategory = window.arguments[0].input.aCategory;
    }
    if ( window.arguments[0].input.aTag ) {
      currentTag = window.arguments[0].input.aTag;
    }
    if ( window.arguments[0].input.aNote ) {
      currentNote = window.arguments[0].input.aNote;
    }
    if ( window.arguments[0].input.aName ) {
      currentName = window.arguments[0].input.aName;
    }
    //
    vbLeft = document.getElementById( "vbLeft" );
    vbBooks = document.getElementById( "vbBooks" );
    bookTree = document.getElementById( "bookTree" );
    bookTreeChildren = document.getElementById( "bookTreeChildren" );
    bookTreeBoxObject = bookTree.boxObject;
    bookTreeBoxObject.QueryInterface(
      Components.interfaces.nsITreeBoxObject );
    booksSplitter = document.getElementById( "booksSplitter" );
    vbFolders = document.getElementById( "vbFolders" );
    categoryTree = document.getElementById( "folderTree" );
    categoryTreeChildren = document.getElementById( "folderTreeChildren" );
    categoryTreeBoxObject = categoryTree.boxObject;
    categoryTreeBoxObject.QueryInterface(
      Components.interfaces.nsITreeBoxObject );
    tagsSplitter = document.getElementById( "tagsSplitter" );
    vbTags = document.getElementById( "vbTags" );
    tagTree = document.getElementById( "tagTree" );
    tagTreeChildren = document.getElementById( "tagTreeChildren" );
    tagTreeBoxObject = tagTree.boxObject;
    tagTreeBoxObject.QueryInterface(
      Components.interfaces.nsITreeBoxObject );
    vbRight = document.getElementById( "vbRight" );
    vbNotes = document.getElementById( "vbNotes" );
    noteTree = document.getElementById( "noteTree" );
    noteTreeChildren = document.getElementById( "noteTreeChildren" );
    noteTreeBoxObject = noteTree.boxObject;
    noteTreeBoxObject.QueryInterface(
      Components.interfaces.nsITreeBoxObject );
    vbInfo = document.getElementById( "vbInfo" );
    tbBook = document.getElementById( "tbBook" );
    tbCategory = document.getElementById( "tbCategory" );
    lblName = document.getElementById( "lblName" );
    hbName =  document.getElementById( "hbName" );
    tbName = document.getElementById( "tbName" );
    lblType =  document.getElementById( "lblType" );
    mlType = document.getElementById( "mlType" );
    mpType = document.getElementById( "mpType" );
    lblTags =  document.getElementById( "lblTags" );
    hbTags = document.getElementById( "hbTags" );
    btnTags = document.getElementById( "btnTags" );
    mpTags = document.getElementById( "mpTags" );
    btnAccept = document.getElementById( "btnAccept" );
    //
    booksStateListener = {
      onBookChanged: onBookChanged,
      onBookOpened: onBookOpened,
      onBookClosed: onBookClosed,
      onBookAppended: onBookAppended,
      onBookInserted: onBookInserted,
      onBookRemoved: onBookRemoved,
      onBookDeleted: onBookDeleted
    };
    contentTreeStateListener = {
      // category
      onCategoryChanged: onCategoryChanged,
      onCategoryAppended: onCategoryAppended,
      onCategoryInserted: onCategoryInserted,
      onCategoryRemoved: onCategoryRemoved,
      onCategoryDeleted: onCategoryDeleted,
      // note
      onNoteAppended: onNoteAppended,
      onNoteInserted: onNoteInserted,
      onNoteRemoved: onNoteRemoved,
      onNoteDeleted: onNoteDeleted,
      onNoteChanged: onNoteChanged,
      onNoteTypeChanged: onNoteTypeChanged,
      onNoteTagsChanged: onNoteTagsChanged,
      onNoteMainTagChanged: onNoteMainTagChanged,
      onNoteAttachmentAppended: onNoteAttachmentAppended,
      onNoteAttachmentRemoved: onNoteAttachmentRemoved
    };
    tagListStateListener = {
      onTagChanged: onTagChanged,
      onTagAppended: onTagAppended,
      onTagRemoved: onTagRemoved,
      onTagInserted: onTagInserted,
      onTagDeleted: onTagDeleted
    };
    updateModeView();
    updateTypeMenu();
    addEventListeners();
    updateBookTree();
    initBookSelection();
  };

  pub.onUnload = function() {
    removeEventListeners();
    if ( currentBook && currentBook.isOpen() ) {
      currentBook.getContentTree().removeStateListener(
        contentTreeStateListener );
      currentBook.getTagList().removeStateListener(
        tagListStateListener );
    }
  };
  
  pub.onDialogAccept = function() {
    if ( currentMode === "open" ) {
      window.arguments[0].output = {
        aBook: currentBook,
        aCategory: currentCategory,
        aNote: currentNote
      };
    } else {
      window.arguments[0].output = {
        aBook: currentBook,
        aCategory: currentCategory,
        aTags: getSelectedTags(),
        aType: getSelectedType(),
        aName: tbName.value.trim(),
        aNote: currentNote
      };
    }
    return true;
  };

  return pub;

}();

window.addEventListener( "load",
  ru.akman.znotes.OpenSaveDialog.onLoad, false );
window.addEventListener( "unload",
  ru.akman.znotes.OpenSaveDialog.onUnload, false );
window.addEventListener( "dialogaccept",
  ru.akman.znotes.OpenSaveDialog.onDialogAccept, false );