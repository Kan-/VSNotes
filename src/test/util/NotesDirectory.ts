import * as fs from 'fs-extra';
import * as path from 'path';

interface CreationOptions {
  symlink: boolean;
}

export default class NotesDirectory {
  #path: string;
  #notes: string[];
  #options: CreationOptions;

  constructor(path: string, options?: CreationOptions) {
    this.#path = path;
    this.#notes = [];
    this.#options = options || { symlink: false };

    this.create();
  }

  createNote(fileName: string, content?: string) {
    const notePath = path.join(this.path(), fileName);

    const handle = fs.openSync(notePath, 'w');
    if (content) {
      fs.writeFileSync(handle, content);
    }
    fs.closeSync(handle);

    this.#notes.push(notePath);
  }

  createNoteInDirectory(directory: string, fileName: string) {
    const directoryPath = path.join(this.path(), directory);
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath);
    }

    const notePath = path.join(directoryPath, fileName);
    fs.closeSync(fs.openSync(notePath, 'w'));
    this.#notes.push(notePath);
  }

  createNotes(fileNames: string[]) {
    for (const fileName of fileNames) {
      this.createNote(fileName);
    }
  }

  createDirectory(dirName: string) {
    fs.mkdirSync(path.join(this.path(), dirName));
  }

  path(): string {
    return path.resolve(this.#options.symlink ? this.symlinkToStorePath() : this.#path);
  }

  pathOf(fileName: string): string {
    if (this.#options.symlink) {
      // We should expect the non-resolved symlink path.
      return path.join(path.resolve(path.join(this.path(), '..')), path.basename(this.path()), fileName);
    } else {
      return path.resolve(path.join(this.path(), fileName));
    }
  }

  lastModifiedOf(fileName: string): Date {
    return fs.statSync(this.pathOf(fileName)).mtime;
  }

  empty() {
    this.remove();
    this.create();
  }

  remove() {
    if (fs.existsSync(this.#path)) {
      fs.removeSync(this.#path);
    }

    if (this.#options.symlink) {
      fs.removeSync(this.symlinkToStorePath());
    }

    this.#notes = [];
  }

  private create() {
    if (!fs.existsSync(this.#path)) {
      fs.mkdirSync(this.#path);
    }

    if (this.#options?.symlink && !fs.existsSync(this.symlinkToStorePath())) {
      fs.symlinkSync(this.#path, this.#path + '-symlink');
    }
  }

  private symlinkToStorePath() {
    return this.#path + '-symlink';
  }
}
