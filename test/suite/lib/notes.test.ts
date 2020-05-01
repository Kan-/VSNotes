import { expect } from 'chai';
import * as path from 'path';

import Note from '../../../src/lib/note';
import Notes from '../../../src/lib/notes';
import { TODAY, YESTERDAY } from '../util';

interface NoteMetadata {
  fileLastModifiedAt?: Date;
  tags?: string[];
}

function note(
  relativePath: string = path.join('path', 'note'),
  { fileLastModifiedAt, tags }: NoteMetadata = {},
): Note {
  return {
    fileName: path.basename(relativePath),
    filePath: path.sep + relativePath,
    fileRelativePath: relativePath,
    fileLastModifiedAt: fileLastModifiedAt || YESTERDAY,
    tags: tags || [],
  };
}

suite('Notes', () => {
  suite('Sorting and limiting', () => {
    test('Returns a note', () => {
      const notes = new Notes([note('note1')]);

      expect(notes.get()).to.deep.equal([note('note1')]);
    });

    test('Returns multiple notes', () => {
      const notes = new Notes([note('note1'), note('note2')]);

      expect(notes.get()).to.deep.equal([note('note1'), note('note2')]);
    });

    test('Returns first x notes', () => {
      const notes = new Notes([note('note1'), note('note2')]);

      expect(notes.limit(0).get()).to.deep.equal([]);
      expect(notes.limit(1).get()).to.deep.equal([note('note1')]);
      expect(notes.limit(2).get()).to.deep.equal([note('note1'), note('note2')]);
      expect(notes.limit(3).get()).to.deep.equal([note('note1'), note('note2')]);
    });

    test('Sorts by last modification time', () => {
      const notes = new Notes([
        note('note1', { fileLastModifiedAt: YESTERDAY }),
        note('note2', { fileLastModifiedAt: TODAY })]);

      expect(notes.sortByFileLastModifiedAt().get()).to.deep.equal([
        note('note2', { fileLastModifiedAt: TODAY }),
        note('note1', { fileLastModifiedAt: YESTERDAY })]);
    });

    test('Sorting modifies the notes in place, which may be unexpected', () => {
      const notes = new Notes([
        note('note1', { fileLastModifiedAt: YESTERDAY }),
        note('note2', { fileLastModifiedAt: TODAY })]);

      notes.sortByFileLastModifiedAt();
      expect(notes.get()).to.deep.equal([
        note('note2', { fileLastModifiedAt: TODAY }),
        note('note1', { fileLastModifiedAt: YESTERDAY })]);
    });
  });

  suite('Working with directories', () => {
    test('Returns directories in the root of the store, empty store', () => {
      const notes = new Notes([]);
      expect(notes.directories()).to.be.empty; // eslint-disable-line
    });

    test('Returns directories in the root of the store, no directories', () => {
      const notes = new Notes([note('note.md')]);
      expect(notes.directories()).to.be.empty; // eslint-disable-line
    });

    test('Returns directories in the root of the store, one directory', () => {
      const notes = new Notes([note(path.join('dir', 'note.md'))]);
      expect(notes.directories()).to.deep.equal(['dir']);
    });

    test('Returns directories in the root of the store, one directory with multiple notes', () => {
      const notes = new Notes([
        note(path.join('dir', 'note1.md')),
        note(path.join('dir', 'note2.md'))]);

      expect(notes.directories()).to.deep.equal(['dir']);
    });

    test('Returns directories in the root of the store, multiple directories', () => {
      const notes = new Notes([
        note(path.join('dir1', 'note.md')),
        note(path.join('dir2', 'note.md'))]);

      expect(notes.directories()).to.deep.equal(['dir1', 'dir2']);
    });

    test('Returns directories in the root of the store, multiple directories with subdirectories', () => {
      const notes = new Notes([
        note(path.join('dir1', 'subdir1', 'note.md')),
        note(path.join('dir2', 'subdir2', 'note.md'))]);

      expect(notes.directories()).to.deep.equal(['dir1', 'dir2']);
    });

    test('Returns empty array if the requested directory does not exist, no directories', () => {
      const notes = new Notes([]);
      expect(notes.directories('non-existent')).to.be.empty; // eslint-disable-line
    });

    test('Returns empty array if the requested directory does not exist, some directories', () => {
      const notes = new Notes([
        note(path.join('dir1', 'note.md')),
        note(path.join('dir2', 'note.md'))]);

      expect(notes.directories('non-existent')).to.be.empty; // eslint-disable-line
    });

    test('Returns subdirectories of a directory, no subdirectories', () => {
      const notes = new Notes([note(path.join('dir', 'note.md'))]);
      expect(notes.directories('dir')).to.deep.equal([]);
    });

    test('Returns subdirectories of a directory, one subdirectory', () => {
      const notes = new Notes([
        note(path.join('dir', 'note.md')),
        note(path.join('dir', 'subdir', 'note.md'))]);

      expect(notes.directories('dir')).to.deep.equal(['subdir']);
    });

    test('Returns subdirectories of a directory, multiple subdirectories', () => {
      const notes = new Notes([
        note(path.join('dir', 'note.md')),
        note(path.join('dir', 'subdir1', 'note.md')),
        note(path.join('dir', 'subdir2', 'note.md'))]);
      expect(notes.directories('dir')).to.deep.equal(['subdir1', 'subdir2']);
    });

    test('Returns subdirectories of a subdirectory, no subdirectories', () => {
      const notes = new Notes([note(path.join('parent', 'dir', 'note.md'))]);
      expect(notes.directories('parent', 'dir')).to.deep.equal([]);
    });

    test('Returns subdirectories of a subdirectory, one subdirectory', () => {
      const notes = new Notes([
        note(path.join('parent1', 'dir1', 'note.md')),
        note(path.join('parent2', 'dir2', 'subdir', 'note.md'))]);
      expect(notes.directories('parent2', 'dir2')).to.deep.equal(['subdir']);
    });

    test('Returns subdirectories of a subdirectory, non existent subdirectory', () => {
      const notes = new Notes([
        note(path.join('parent1', 'dir1', 'note.md')),
        note(path.join('parent2', 'dir2', 'subdir', 'note.md'))]);

      expect(notes.directories('non-existent')).to.be.empty; // eslint-disable-line
    });

    test('Returns subdirectories of a subdirectory, multiple subdirectories', () => {
      const notes = new Notes([
        note(path.join('parent', 'dir', 'note.md')),
        note(path.join('parent', 'dir', 'subdir1', 'note.md')),
        note(path.join('parent', 'dir', 'subdir2', 'note.md'))]);
      expect(notes.directories('parent', 'dir')).to.deep.equal(['subdir1', 'subdir2']);
    });
  });

  suite('Getting notes in a directory', () => {
    test('Returns notes in the root of the store, no notes', () => {
      const notes = new Notes([]);
      expect(notes.inDirectory().get()).to.deep.equal([]);
    });

    test('Returns notes in the root of the store, one note', () => {
      const notes = new Notes([note('note.md')]);
      expect(notes.inDirectory().get()).to.deep.equal([note('note.md')]);
    });

    test('Returns notes in the root of the store, multiple notes', () => {
      const notes = new Notes([note('note1.md'), note('note2.md')]);
      expect(notes.inDirectory().get()).to.deep.equal([note('note1.md'), note('note2.md')]);
    });

    test('Returns empty array if asking for a note in a non-existent subdirectory', () => {
      const notes = new Notes([note('note.md')]);
      expect(notes.inDirectory('non-existent').get()).to.be.empty; // eslint-disable-line
    });

    test('Returns notes in a subdirectory of the store, one note', () => {
      const notes = new Notes([note(path.join('subdir', 'note.md'))]);
      expect(notes.inDirectory('subdir').get()).to.deep.equal([
        note(path.join('subdir', 'note.md'))]);
    });

    test('Returns notes in a subdirectory of the store, multiple notes', () => {
      const notes = new Notes([
        note(path.join('subdir', 'note1.md')),
        note(path.join('subdir', 'note2.md'))]);

      expect(notes.inDirectory('subdir').get()).to.deep.equal([
        note(path.join('subdir', 'note1.md')),
        note(path.join('subdir', 'note2.md'))]);
    });

    test('Returns notes in a subdirectory of a subdirectory, one note', () => {
      const notes = new Notes([note(path.join('parent', 'subdir', 'note.md'))]);
      expect(notes.inDirectory('parent', 'subdir').get()).to.deep.equal([
        note(path.join('parent', 'subdir', 'note.md'))]);
    });

    test('Returns notes in a subdirectory of a subdirectory, multiple notes', () => {
      const notes = new Notes([
        note(path.join('parent', 'subdir', 'note1.md')),
        note(path.join('parent', 'subdir', 'note2.md'))]);

      expect(notes.inDirectory('parent', 'subdir').get()).to.deep.equal([
        note(path.join('parent', 'subdir', 'note1.md')),
        note(path.join('parent', 'subdir', 'note2.md'))]);
    });
  });

  suite('Filtering by tags', () => {
    test('Returns notes tagged with a specific tag, no notes', () => {
      const notes = new Notes([]);
      expect(notes.withTag('tag').get()).to.deep.equal([]);
    });

    test('Returns notes tagged with a specific tag, one matching tag', () => {
      const notes = new Notes([note('note.md', { tags: ['tag'] })]);
      expect(notes.withTag('tag').get()).to.deep.equal([note('note.md', { tags: ['tag'] })]);
    });

    test('Returns notes tagged with a specific tag, one non-matching tag', () => {
      const notes = new Notes([note('note.md', { tags: ['tag'] })]);
      expect(notes.withTag('otherTag').get()).to.deep.equal([]);
    });

    test('Returns notes tagged with a specific tag, multiple tags, none matching', () => {
      const notes = new Notes([
        note('note1.md', { tags: ['tag1'] }),
        note('note2.md', { tags: ['tag2'] })]);

      expect(notes.withTag('tag').get()).to.deep.equal([]);
    });

    test('Returns notes tagged with a specific tag, multiple tags, one matching', () => {
      const notes = new Notes([
        note('note1.md', { tags: ['tag1'] }),
        note('note2.md', { tags: ['tag2'] })]);

      expect(notes.withTag('tag1').get()).to.deep.equal([
        note('note1.md', { tags: ['tag1'] })]);
    });

    test('Returns notes tagged with a specific tag, multiple tags, multiple matching', () => {
      const notes = new Notes([
        note('note1.md', { tags: ['tag'] }),
        note('note2.md', { tags: ['tag'] })]);

      expect(notes.withTag('tag').get()).to.deep.equal([
        note('note1.md', { tags: ['tag'] }),
        note('note2.md', { tags: ['tag'] })]);
    });
  });

  suite('Getting all tags', () => {
    test('Returns no tags if there are no notes', () => {
      const notes = new Notes([]);
      expect(notes.allTags()).to.be.empty; // eslint-disable-line
    });

    test('Returns no tags if there are notes with no tags', () => {
      const notes = new Notes([note('note1.md'), note('note2.md')]);
      expect(notes.allTags()).to.be.empty; // eslint-disable-line
    });

    test('Returns one tag from one note', () => {
      const notes = new Notes([note('note.md', { tags: ['tag'] })]);
      expect(notes.allTags()).to.deep.equal(['tag']);
    });

    test('Returns one tag from multiple notes with the same tag', () => {
      const notes = new Notes([
        note('note1.md', { tags: ['tag'] }),
        note('note2.md', { tags: ['tag'] })]);
      expect(notes.allTags()).to.deep.equal(['tag']);
    });

    test('Returns multiple tags from multiple notes', () => {
      const notes = new Notes([
        note('note1.md', { tags: ['tag1', 'tag2'] }),
        note('note2.md', { tags: ['tag1', 'tag2'] })]);
      expect(notes.allTags()).to.deep.equal(['tag1', 'tag2']);
    });

    test('Returns multiple tags from one note', () => {
      const notes = new Notes([note('note.md', { tags: ['tag1', 'tag2'] })]);
      expect(notes.allTags()).to.deep.equal(['tag1', 'tag2']);
    });

    test('Sorts tags alphabetically', () => {
      const notes = new Notes([note('note.md', { tags: ['b', 'a'] })]);
      expect(notes.allTags()).to.deep.equal(['a', 'b']);
    });
  });
});
