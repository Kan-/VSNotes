const vscode = require('vscode');
const {resolveHome} = require('./utils');

const Notes = require('./lib/Notes');
const NoteStore = require('./lib/NoteStore');

module.exports = function () {
  const config = vscode.workspace.getConfiguration('vsnotes');
  const noteStore = new NoteStore(resolveHome(config.get('defaultNotePath')), this.ignorePatterns);
  const notes = noteStore.all().then((notes) => new Notes(notes));

  notes.then((notes) => {
    vscode.window.showQuickPick(notes.allTags()).then(tag => {
      if (tag == null) {
        return;
      }

      vscode.window.showQuickPick(notes.withTag(tag).get().map(_asQuickPickItem)).then(item => {
        if (item == null) {
          return;
        }

        vscode.window.showTextDocument(vscode.Uri.file(item.note.filePath)).then(() => {
          console.log('Opening file ' + item.note.filePath);
        }, err => {
          console.error(err);
        })
      }, err => {
        console.error(err)
      })
    }, err => {
      console.error(err)
    })
  });
}

function _asQuickPickItem(note) {
  return {
    label: note.fileRelativePath,
    note: note
  }
}
