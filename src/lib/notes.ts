import * as path from 'path';
import Note from './note';

export default class Notes {
  #notes: Note[];

  constructor(notes: Note[]) {
    this.#notes = notes;
  }

  get(): Note[] {
    return this.#notes;
  }

  limit(number: number): Notes {
    return new Notes(this.#notes.slice(0, number));
  }

  sortByFileLastModifiedAt(): Notes {
    return new Notes(this.#notes.sort((a, b) => {
      if (a.fileLastModifiedAt > b.fileLastModifiedAt) {
        return -1;
      }
      if (a.fileLastModifiedAt < b.fileLastModifiedAt) {
        return 1;
      }
      return 0;
    }));
  }

  directories(parentDirectory?: string): string[] {
    const pathSegments: string[] = parentDirectory?.split(path.sep) || [];
    return [...new Set(this.#notes
      .map((note) => path.dirname(note.fileRelativePath))
      .map((dirname) => (dirname === '.' ? [] : dirname.split(path.sep)))
      .filter((notePathSegments) => notePathSegments.length > pathSegments.length)
      .filter((notePathSegments) => pathSegments
        .every((segment: string, index: number) => ((segment) === notePathSegments[index])))
      .map((notePathSegments) => notePathSegments
        .slice(pathSegments.length, pathSegments.length + 1))
      .map((pathSegmentOrEmpty) => (pathSegmentOrEmpty.length === 0 ? '' : pathSegmentOrEmpty[0])))];
  }

  inDirectory(subdirectory = '.'): Notes {
    return new Notes(this.#notes
      .filter((note) => path.dirname(note.fileRelativePath) === subdirectory));
  }

  allTags(): string[] {
    const tags = new Set<string>();
    this.#notes.forEach((note) => note.tags.forEach((tag) => tags.add(tag), tags));
    return Array.from(tags).sort();
  }

  withTag(tag: string): Notes {
    return new Notes([...new Set(this.#notes.filter((note) => note.tags.includes(tag)))]);
  }
}
