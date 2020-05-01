import FrontMatterParser from './frontMatterParser';
import Note from './note';

import fs = require('fs-extra');
import klaw = require('klaw');
import path = require('path');

export default class NoteStore {
  #storePath: string;

  #ignorePatterns: RegExp[];

  constructor(storePath: string, ignorePatterns: RegExp[] = []) {
    this.#storePath = storePath;
    this.#ignorePatterns = ignorePatterns;
  }

  all(): Promise<Note[]> { // TODO this should return Promise<Notes>
    return new Promise((resolve) => {
      const promises: Promise<Note>[] = [];

      klaw(this.#storePath)
        .on('data', (item) => {
          const fileName = path.basename(item.path);
          const fileRelativePath = path.relative(this.#storePath, item.path);
          if (item.stats.isDirectory()
              || item.stats.isSymbolicLink()
              || this.matchesIgnorePattern(fileRelativePath)) {
            return;
          }

          promises.push(new Promise((resolveNote) => {
            fs.readFile(item.path).then((content: Buffer) => {
              resolveNote({
                filePath: item.path,
                fileRelativePath,
                fileName,
                fileLastModifiedAt: item.stats.mtime,
                tags: new FrontMatterParser(content.toString()).tags,
              });
            }).catch((reason) => {
              console.error(`Unable to read note ${item.path}`, reason);
            });
          }));
        })
        .on('error', (error: Error, item: klaw.Item) => {
          console.error(`Unable to walk ${item.path}`, error.message);
        })
        .on('end', () => { Promise.all(promises).then((notes) => resolve(notes)); });
    });
  }

  private matchesIgnorePattern(string: string): boolean {
    return this.#ignorePatterns
      .reduce((matches: boolean, pattern: RegExp) => (matches || pattern.test(string)), false);
  }
}
