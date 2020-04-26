const vscode = require('vscode');
const path = require('path');
const {resolveHome} = require('./utils');
const Notes = require('./lib/Notes');
const NoteStore = require('./lib/NoteStore');

class VSNotesTreeView  {
  constructor () {
    const config = vscode.workspace.getConfiguration('vsnotes');
    this.baseDir = resolveHome(config.get('defaultNotePath'));
    this.ignorePatterns = config.get('ignorePatterns').map(pattern => new RegExp(pattern));
    this.hideTags = config.get('treeviewHideTags');
    this.hideFiles = config.get('treeviewHideFiles');

    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;

    this.noteStore = new NoteStore(this.baseDir, this.ignorePatterns);
    this.notes = this.noteStore.all().then((notes) => new Notes(notes));
  }

  refresh () {
    this.notes = this.noteStore.all().then((notes) => new Notes(notes));
    this._onDidChangeTreeData.fire();
  }

  getChildren (node) {
    if (node) {
      switch (node.type) {
        case 'rootTag':
          return Promise.resolve(this._getAllTags())
        case 'tag':
          return Promise.resolve(this._getAllNotesTaggedWith(node.tag));
        case 'rootDirectory':
          return Promise.resolve(this._getDirectoryContents());
        case 'note':
          return Promise.resolve([]);
        case 'directory':
          return Promise.resolve(this._getDirectoryContents(node.directory));
      }
    } else {
      const treeview = [];
      if (!this.hideFiles) {
        treeview.push({
          type: 'rootDirectory'
        });
      }
      if (!this.hideTags) {
        treeview.push({
          type: 'rootTag'
        });
      }
      return treeview;
    }
  }

  getTreeItem (node) {
    switch (node.type) {
      case 'rootTag':
        let rootTagTreeItem = new vscode.TreeItem('Tags', vscode.TreeItemCollapsibleState.Expanded);
        rootTagTreeItem.iconPath = {
          light: path.join(__filename, '..', '..', 'media', 'light', 'tag.svg'),
          dark: path.join(__filename, '..', '..', 'media', 'dark', 'tag.svg')
        };
        return rootTagTreeItem;
      case 'rootDirectory':
        let rootDirectoryTreeItem = new vscode.TreeItem('Files', vscode.TreeItemCollapsibleState.Expanded);
        rootDirectoryTreeItem.iconPath = {
          light: path.join(__filename, '..', '..', 'media', 'light', 'file-directory.svg'),
          dark: path.join(__filename, '..', '..', 'media', 'dark', 'file-directory.svg')
        };
        return rootDirectoryTreeItem;
      case 'tag':
        let tagTreeItem = new vscode.TreeItem(node.tag, vscode.TreeItemCollapsibleState.Collapsed);
        tagTreeItem.iconPath = {
          light: path.join(__filename, '..', '..', 'media', 'light', 'tag.svg'),
          dark: path.join(__filename, '..', '..', 'media', 'dark', 'tag.svg')
        };
        return tagTreeItem;
      case 'directory':
        const dirTreeItem = new vscode.TreeItem(node.label, vscode.TreeItemCollapsibleState.Collapsed)
        dirTreeItem.iconPath = {
          light: path.join(__filename, '..', '..', 'media', 'light', 'file-directory.svg'),
          dark: path.join(__filename, '..', '..', 'media', 'dark', 'file-directory.svg')
        };
        return dirTreeItem;
      case 'note':
        console.log(node);
        let fileTreeItem = new vscode.TreeItem(node.label, vscode.TreeItemCollapsibleState.None)

        fileTreeItem.command = {
          command: 'vscode.open',
          title: '',
          arguments: [vscode.Uri.file(node.note.filePath)]
        }
        fileTreeItem.iconPath = {
          light: path.join(__filename, '..', '..', 'media', 'light', 'file.svg'),
          dark: path.join(__filename, '..', '..', 'media', 'dark', 'file.svg')
        };
        return fileTreeItem;
    }
  }

  // Given a filepath, return an array of TreeItems
  _getDirectoryContents (parentDirectory) {
    return new Promise ((resolve) => {
      const items = [];
      this.notes.then((notes) => {
        notes.directories(parentDirectory).forEach(directory => {
          items.push({
            label: directory,
            type: 'directory',
            directory: path.join(parentDirectory || '', directory)
          })
        })

        notes.inDirectory(parentDirectory).get().forEach(note => items.push(this._asTreeItem(note)));
        resolve(items);
      })
    })
  }

  _getAllTags () {
    return new Promise ((resolve) => {
      const items = [];
      this.notes.then((notes) => {
        notes.allTags().forEach(tag => {
          items.push({
            label: tag,
            type: 'tag',
            tag: tag
          })
        })
        resolve(items);
      })
    })
  }

  _getAllNotesTaggedWith (tag) {
    return new Promise ((resolve) => {
      const items = [];
      this.notes.then((notes) => {
        notes.withTag(tag).get().forEach(note => items.push(this._asTreeItem(note)));
        resolve(items);
      });
    })
  }

  _asTreeItem (note) {
    return {
      label: note.fileName,
      type: 'note',
      note: note
    }
  }
}

module.exports = VSNotesTreeView;
