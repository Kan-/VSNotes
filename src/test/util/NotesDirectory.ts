import * as fs from 'fs-extra';
import * as path from 'path';

export default class NotesDirectory {
  #path: string;

  #notes: string[];

  constructor(path: string) {
    this.#path = path;
    this.#notes = [];

    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
  }

  createNote(fileName: string, content?: string) {
    const notePath = path.join(this.#path, fileName);

    const handle = fs.openSync(notePath, 'w');
    if (content) {
      fs.writeFileSync(handle, content);
    }
    fs.closeSync(handle);

    this.#notes.push(notePath);
  }

  createNoteInDirectory(directory: string, fileName: string) {
    const directoryPath = path.join(this.#path, directory);
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath);
    }

    const notePath = path.join(directoryPath, fileName);
    fs.closeSync(fs.openSync(notePath, 'w'))
    this.#notes.push(notePath);
  }

  createNotes(fileNames: string[]) {
    for (const fileName of fileNames) {
      this.createNote(fileName);
    }
  }

  createDirectory(dirName: string) {
    fs.mkdirSync(path.join(this.#path, dirName));
  }

  clear() {
    if (fs.existsSync(this.#path)) {
      fs.removeSync(this.#path)
      fs.mkdirSync(this.#path);
    }
    this.#notes = [];
  }

  path(): string {
    return path.resolve(this.#path);
  }

  pathOf(fileName: string): string {
    return path.resolve(path.join(this.#path, fileName));
  }

  lastModifiedOf(fileName: string): Date {
    return fs.statSync(this.pathOf(fileName)).mtime;
  }
}
