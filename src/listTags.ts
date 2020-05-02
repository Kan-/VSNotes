import * as vscode from 'vscode';
import { resolveHome } from './utils';
import Note from './lib/note';
import Notes from './lib/notes';
import NoteStore from './lib/noteStore';

interface NoteQuickPickItem extends vscode.QuickPickItem {
  note: Note;
}

function toQuickPickItems(note: Note): NoteQuickPickItem {
  return {
    label: note.fileRelativePath,
    note,
  };
}

// eslint-disable-next-line
export default function (...any: any[]): any {
  const config = vscode.workspace.getConfiguration('vsnotes');
  const ignorePatterns: RegExp[] = (config.get<string[]>('ignorePatterns') ?? [])
    .map((pattern: string) => new RegExp(pattern));
  const noteStore = new NoteStore(resolveHome(config.get('defaultNotePath')), ignorePatterns);

  noteStore.all().then((notes) => new Notes(notes)).then((notes) => {
    vscode.window.showQuickPick(notes.allTags()).then((tag) => {
      if (tag == null) {
        return;
      }

      vscode.window.showQuickPick(notes.withTag(tag).get().map(toQuickPickItems)).then((item) => {
        if (item == null) {
          return;
        }

        vscode.window.showTextDocument(vscode.Uri.file(item.note.filePath)).then(() => {
          console.log(`Opening file ${item.note.filePath}`);
        });
      });
    });
  });
}
