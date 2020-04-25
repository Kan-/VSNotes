
const vscode = require('vscode');
const {resolveHome} = require('./utils');
const NoteStore = require('./lib/NoteStore');
const Notes = require('./lib/Notes');

function toQuickPickItems(note) {
  return {
    label: note.fileRelativePath,
    note: note
  }
}

module.exports = function () {
  const config = vscode.workspace.getConfiguration('vsnotes');
  const noteFolder = resolveHome(config.get('defaultNotePath'));
  const listRecentLimit = config.get('listRecentLimit');
  const ignorePatterns = config.get('ignorePatterns').map(pattern => new RegExp(pattern));

  new NoteStore(noteFolder, ignorePatterns).all().then((notes) => {
    const quickPickItems = new Notes(notes)
      .sortByFileLastModifiedAt()
      .limit(listRecentLimit)
      .get()
      .map(toQuickPickItems);

    vscode.window.showQuickPick(quickPickItems).then(chosenItem => {
      if (chosenItem != null && chosenItem) {
        vscode.window.showTextDocument(vscode.Uri.file(chosenItem.note.path)).then(() => {
          console.log('Opening note ', chosenItem.note);
        }, err => {
          console.error(err);
        })
      }
    }, err => {
      console.error(err);
    })
  });
}
