import { expect } from 'chai';

import NotesDirectory from '../../util/NotesDirectory';
import Note from '../../util/Note';
const NoteStore = require('../../../lib/NoteStore');

suite('NoteStore', () => {

  const notesDir = new NotesDirectory('test-notes');
  let store = new NoteStore(notesDir.path());

  teardown(function() {
    notesDir.clear();
  });

  test('Finds a note', () => {
    notesDir.createNote('note.md');

    return store.all().then((notes: Note[]) => {
      expect(notes).to.deep.equal([{
        filePath: notesDir.pathOf('note.md'),
        fileRelativePath: 'note.md',
        fileName: 'note.md',
        fileLastModifiedAt: notesDir.lastModifiedOf('note.md'),
        tags: []
      }]);
    })
  });

  test('Finds multiple notes', () => {
    notesDir.createNote('note1.md');
    notesDir.createNote('note2.md');

    return store.all().then((notes: Note[]) => {
      expect(notes).to.deep.equal([{
        filePath: notesDir.pathOf('note1.md'),
        fileRelativePath: 'note1.md',
        fileName: 'note1.md',
        fileLastModifiedAt: notesDir.lastModifiedOf('note1.md'),
        tags: []
      }, {
        filePath: notesDir.pathOf('note2.md'),
        fileRelativePath: 'note2.md',
        fileName: 'note2.md',
        fileLastModifiedAt: notesDir.lastModifiedOf('note2.md'),
        tags: []
      }]);
    })
  });

  test('Finds a note in a subdirectory', () => {
    notesDir.createNoteInDirectory('subdir', 'note.md');

    return store.all().then((notes: Note[]) => {
      expect(notes).to.deep.equal([{
        filePath: notesDir.pathOf('subdir/note.md'),
        fileRelativePath: 'subdir/note.md',
        fileName: 'note.md',
        fileLastModifiedAt: notesDir.lastModifiedOf('subdir/note.md'),
        tags: []
      }]);
    })
  });

  test('Returns an empty list if the store is empty', () => {
    return store.all().then((notes: Note[]) => {
      expect(notes).to.be.empty;
    })
  });

  test('Does not return directories', () => {
    notesDir.createDirectory('a-subdirectory');
    return store.all().then((notes: Note[]) => {
      expect(notes).to.be.empty;
    })
  });

  test('Ignores files matching ignore pattern', () => {
    store = new NoteStore(notesDir.path(), [/^ignored.*/]);

    notesDir.createNote('note.md');
    notesDir.createNote('ignored-note.md');

    return store.all().then((notes: Note[]) => {
      expect(notes).to.deep.equal([{
        filePath: notesDir.pathOf('note.md'),
        fileRelativePath: 'note.md',
        fileName: 'note.md',
        fileLastModifiedAt: notesDir.lastModifiedOf('note.md'),
        tags: []
      }]);
    })
  });

  test('Ignores multiple files matching multiple ignore patterns', () => {
    store = new NoteStore(notesDir.path(), [/^ignored1.*/, /^ignored2.*/]);

    notesDir.createNote('note.md');
    notesDir.createNote('ignored1.md');
    notesDir.createNote('ignored2.md');

    return store.all().then((notes: Note[]) => {
      expect(notes).to.deep.equal([{
        filePath: notesDir.pathOf('note.md'),
        fileRelativePath: 'note.md',
        fileName: 'note.md',
        fileLastModifiedAt: notesDir.lastModifiedOf('note.md'),
        tags: []
      }]);
    })
  });

  test('Applies ignore pattern to relative file paths', () => {
    store = new NoteStore(notesDir.path(), [/^subdir.*/]);

    notesDir.createNoteInDirectory('subdir', 'note.md');

    return store.all().then((notes: Note[]) => {
      expect(notes).to.deep.equal([]);
    })
  });

  test('Reads tags from a note', () => {
    notesDir.createNote('note.md', '---\ntags: [tag1, tag2]\n---');

    return store.all().then((notes: Note[]) => {
      expect(notes).to.deep.equal([{
        filePath: notesDir.pathOf('note.md'),
        fileRelativePath: 'note.md',
        fileName: 'note.md',
        fileLastModifiedAt: notesDir.lastModifiedOf('note.md'),
        tags: ['tag1', 'tag2']
      }]);
    })
  });
});
