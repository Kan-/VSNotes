import { expect } from 'chai';
import * as path from 'path';

import Note from '../../util/Note';

const Notes = require('../../../lib/Notes');

suite('Notes', () => {

  suite('Sorting and filtering', () => {
    test('Returns a note', () => {
      const notes = new Notes([{ filePath: 'note1' }])

      expect(notes.get()).to.deep.equal([{ filePath: 'note1' }]);
    });

    test('Returns multiple notes', () => {
      const notes = new Notes([{ filePath: 'note1' }, { filePath: 'note2' }])

      expect(notes.get()).to.deep.equal([{ filePath: 'note1' }, { filePath: 'note2' }]);
    });

    test('Returns first x notes', () => {
      const notes = new Notes([{ filePath: 'note1' }, { filePath: 'note2' }])

      expect(notes.limit(0).get()).to.deep.equal([]);
      expect(notes.limit(1).get()).to.deep.equal([{ filePath: 'note1' }]);
      expect(notes.limit(2).get()).to.deep.equal([{ filePath: 'note1' }, { filePath: 'note2' }]);
      expect(notes.limit(3).get()).to.deep.equal([{ filePath: 'note1' }, { filePath: 'note2' }]);
    });

    test('Sorts by last modification time', () => {
      const notes = new Notes([{ fileLastModifiedAt: yesterday() }, { fileLastModifiedAt: today() }])

      expect(notes.sortByFileLastModifiedAt().get()).to.deep.equal([
        { fileLastModifiedAt: today() },
        { fileLastModifiedAt: yesterday() }]);
    });

    test('Sorting modifies the notes in place, which may be unexpected', () => {
      const notes = new Notes([{ fileLastModifiedAt: yesterday() }, { fileLastModifiedAt: today() }])

      notes.sortByFileLastModifiedAt();
      expect(notes.get()).to.deep.equal([
        { fileLastModifiedAt: today() },
        { fileLastModifiedAt: yesterday() }]);
    });
  });

  suite('Working with directories', () => {
    test('Returns directories in the root of the store, empty store', () => {
      const notes = new Notes([]);
      expect(notes.directories()).to.be.empty;
    })

    test('Returns directories in the root of the store, no directories', () => {
      const notes = new Notes([note('note.md')]);
      expect(notes.directories()).to.be.empty;
    })

    test('Returns directories in the root of the store, one directory', () => {
      const notes = new Notes([note('dir', 'note.md')]);
      expect(notes.directories()).to.deep.equal(['dir']);
    })

    test('Returns directories in the root of the store, one directory, when sending undefined', () => {
      const notes = new Notes([note('dir', 'note.md')]);
      expect(notes.directories(undefined)).to.deep.equal(['dir']);
    })

    test('Returns directories in the root of the store, one directory with multiple notes', () => {
      const notes = new Notes([note('dir', 'note1.md'), note('dir', 'note2.md')]);
      expect(notes.directories()).to.deep.equal(['dir']);
    })

    test('Returns directories in the root of the store, multiple directories', () => {
      const notes = new Notes([note('dir1', 'note.md'), note('dir2', 'note.md')]);
      expect(notes.directories()).to.deep.equal(['dir1', 'dir2']);
    })

    test('Returns directories in the root of the store, multiple directories with subdirectories', () => {
      const notes = new Notes([note('dir1', 'subdir1', 'note.md'), note('dir2', 'subdir2', 'note.md')]);
      expect(notes.directories()).to.deep.equal(['dir1', 'dir2']);
    })

    test('Returns empty array if the requested directory does not exist, no directories', () => {
      const notes = new Notes([]);
      expect(notes.directories('non-existent')).to.be.empty;
    })

    test('Returns empty array if the requested directory does not exist, some directories', () => {
      const notes = new Notes([note('dir1', 'note.md'), note('dir2', 'note.md')]);
      expect(notes.directories('non-existent')).to.be.empty;
    })

    test('Returns subdirectories of a directory, no subdirectories', () => {
      const notes = new Notes([note('dir', 'note.md')]);
      expect(notes.directories('dir')).to.deep.equal([]);
    })

    test('Returns subdirectories of a directory, one subdirectory', () => {
      const notes = new Notes([note('dir', 'note.md'), note('dir', 'subdir', 'note.md')]);
      expect(notes.directories('dir')).to.deep.equal(['subdir']);
    })

    test('Returns subdirectories of a directory, multiple subdirectories', () => {
      const notes = new Notes([
        note('dir', 'note.md'),
        note('dir', 'subdir1', 'note.md'),
        note('dir', 'subdir2', 'note.md')]);
      expect(notes.directories('dir')).to.deep.equal(['subdir1', 'subdir2']);
    })

    test('Returns subdirectories of a subdirectory, no subdirectories', () => {
      const notes = new Notes([note('parent', 'dir', 'note.md')]);
      expect(notes.directories('parent', 'dir')).to.deep.equal([]);
    })

    test('Returns subdirectories of a subdirectory, one subdirectory', () => {
      const notes = new Notes([note('parent1', 'dir1', 'note.md'), note('parent2', 'dir2', 'subdir', 'note.md')]);
      expect(notes.directories('parent2', 'dir2')).to.deep.equal(['subdir']);
    })

    test('Returns subdirectories of a subdirectory, non existent subdirectory', () => {
      const notes = new Notes([note('parent1', 'dir1', 'note.md'), note('parent2', 'dir2', 'subdir', 'note.md')]);
      expect(notes.directories('non-existent')).to.be.empty;
    })

    test('Returns subdirectories of a subdirectory, multiple subdirectories', () => {
      const notes = new Notes([
        note('parent', 'dir', 'note.md'),
        note('parent', 'dir', 'subdir1', 'note.md'),
        note('parent', 'dir', 'subdir2', 'note.md')]);
      expect(notes.directories('parent', 'dir')).to.deep.equal(['subdir1', 'subdir2']);
    })
  })

  suite('Getting notes in a directory', () => {
    test('Returns notes in the root of the store, no notes', () => {
      const notes = new Notes([]);
      expect(notes.inDirectory().get()).to.deep.equal([]);
    })

    test('Returns notes in the root of the store, one note', () => {
      const notes = new Notes([note('note.md')]);
      expect(notes.inDirectory().get()).to.deep.equal([note('note.md')]);
    })

    test('Returns notes in the root of the store, one note, when sending undefined', () => {
      const notes = new Notes([note('note.md')]);
      expect(notes.inDirectory(undefined).get()).to.deep.equal([note('note.md')]);
    })

    test('Returns notes in the root of the store, multiple notes', () => {
      const notes = new Notes([note('note1.md'), note('note2.md')]);
      expect(notes.inDirectory().get()).to.deep.equal([note('note1.md'), note('note2.md')]);
    })

    test('Returns empty array if asking for a note in a non-existent subdirectory', () => {
      const notes = new Notes([note('note.md')]);
      expect(notes.inDirectory('non-existent').get()).to.be.empty;
    })

    test('Returns notes in a subdirectory of the store, one note', () => {
      const notes = new Notes([note('subdir', 'note.md')]);
      expect(notes.inDirectory('subdir').get()).to.deep.equal([note('subdir', 'note.md')]);
    })

    test('Returns notes in a subdirectory of the store, multiple notes', () => {
      const notes = new Notes([note('subdir', 'note1.md'), note('subdir', 'note2.md')]);
      expect(notes.inDirectory('subdir').get()).to.deep.equal([note('subdir', 'note1.md'), note('subdir', 'note2.md')]);
    })

    test('Returns notes in a subdirectory of a subdirectory, one note', () => {
      const notes = new Notes([note('parent', 'subdir', 'note.md')]);
      expect(notes.inDirectory('parent', 'subdir').get()).to.deep.equal([note('parent', 'subdir', 'note.md')]);
    })

    test('Returns notes in a subdirectory of a subdirectory, multiple notes', () => {
      const notes = new Notes([
        note('parent', 'subdir', 'note1.md'),
        note('parent', 'subdir', 'note2.md')]);

        expect(notes.inDirectory('parent', 'subdir').get()).to.deep.equal([
        note('parent', 'subdir', 'note1.md'),
        note('parent', 'subdir', 'note2.md')]);
    })
  })
});

function today(): Date {
  return new Date();
}

function yesterday(): Date {
  const date = today();
  const dayInMillis = 24 * 60 * 60 * 1000;
  date.setTime(date.getTime() - dayInMillis);
  return date;
}

function note(...pathSegments: string[]): Note {
  const relativePath = path.join(...pathSegments);
  return {
    fileName: path.basename(relativePath),
    filePath: path.sep + relativePath,
    fileRelativePath: relativePath
  }
}
