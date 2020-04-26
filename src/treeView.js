const vscode = require('vscode');
const fs = require('fs-extra');
const path = require('path');
const klaw = require('klaw');
const {resolveHome} = require('./utils');
const FrontMatterParser = require('./lib/FrontMatterParser')
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
          this.tags = Promise.resolve(this._getTags(this.baseDir))
          return this.tags;
        case 'tag':
          return node.files;
        case 'rootFile':
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
          type: 'rootFile'
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
      case 'rootFile':
        let rootFileTreeItem = new vscode.TreeItem('Files', vscode.TreeItemCollapsibleState.Expanded);
        rootFileTreeItem.iconPath = {
          light: path.join(__filename, '..', '..', 'media', 'light', 'file-directory.svg'),
          dark: path.join(__filename, '..', '..', 'media', 'dark', 'file-directory.svg')
        };
        return rootFileTreeItem;
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

        notes.inDirectory(parentDirectory).get().forEach(note => {
          items.push({
            label: note.fileName,
            type: 'note',
            note: note
          })
        })
        resolve(items);
      })
    })
  }

  _getTags () {
    return new Promise((resolve, reject) => {
      let files = [];

      klaw(this.baseDir)
        .on('data', item => {
          files.push(new Promise((res) => {
            const fileName = path.basename(item.path);
              if (!item.stats.isDirectory()) {
              fs.readFile(item.path).then(contents => {
                res({
                  path: item.path,
                  contents: contents,
                  payload: {
                    type: 'file',
                    file: fileName,
                    path: item.path,
                    stats: item.stats
                  }
                });
              }).catch(err => {
                console.error(err);
                res();
              })
            } else {
              res();
            }
          }))
        })
        .on('error', (err, item) => {
          reject(err)
          console.error('Error while walking notes folder for tags: ', item, err);
        })
        .on('end', () => {
          Promise.all(files).then(files => {

            // Build a tag index first
            let tagIndex = {};
            for (let i = 0; i < files.length; i++) {
              if (files[i] != null && files[i]) {
                for (let tag of new FrontMatterParser(files[i]).tags) {
                  if (tag in tagIndex) {
                    tagIndex[tag].push(files[i].payload);
                  } else {
                    tagIndex[tag] = [files[i].payload];
                  }
                }
              }
            }
            // Then build an array of tags
            let tags = []
            for (let tag of Object.keys(tagIndex)) {
              tags.push({
                type: 'tag',
                tag: tag,
                files: tagIndex[tag]
              })
            }
            // Sort tags alphabetically
            tags.sort(function(a,b) {return (a.tag > b.tag) ? 1 : ((b.tag > a.tag) ? -1 : 0);} );
            resolve(tags);
          }).catch(err => {
            console.error(err)
          })
        })
    });
  }
}

module.exports = VSNotesTreeView;
