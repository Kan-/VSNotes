
import * as vscode from 'vscode';
import { resolveHome } from './utils';
import NoteStore from './lib/noteStore';
import Notes from './lib/notes';
import Note from './lib/note';

interface NoteQuickPickItem extends vscode.QuickPickItem {
  note: Note;
}

function toQuickPickItems(note: Note): NoteQuickPickItem {
  return {
    label: note.fileRelativePath,
    note,
  };
}

export default function (...args: any[]): any {
  const config = vscode.workspace.getConfiguration('vsnotes');
  const noteFolder: string = resolveHome(config.get('defaultNotePath'));
  const listRecentLimit: number = config.get('listRecentLimit') ?? 10;
  const ignorePatterns: RegExp[] = (config.get<string[]>('ignorePatterns') ?? [])
    .map((pattern: string) => new RegExp(pattern));

  new NoteStore(noteFolder, ignorePatterns).all().then((notes) => {
    const quickPickItems: NoteQuickPickItem[] = new Notes(notes)
      .sortByFileLastModifiedAt()
      .limit(listRecentLimit)
      .get()
      .map(toQuickPickItems);

    vscode.window.showQuickPick(quickPickItems).then((chosenItem) => {
      if (chosenItem != null && chosenItem) {
        vscode.window.showTextDocument(vscode.Uri.file(chosenItem.note.filePath)).then(() => {
          console.log('Opening note ', chosenItem.note);
        });
      }
    });
  });
}
