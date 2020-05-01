import * as fs from 'fs-extra';
import * as path from 'path';

interface CreationOptions {
  symlink: boolean;
}

export default class TestDirectory {
  #path: string;

  #options: CreationOptions;

  constructor(directory: string, options?: CreationOptions) {
    this.#path = directory;
    this.#options = options || { symlink: false };

    this.create();
  }

  createFile(fileName: string, content?: string): void {
    const filePath = path.join(this.path(), fileName);

    const handle = fs.openSync(filePath, 'w');
    if (content) {
      fs.writeFileSync(handle, content);
    }
    fs.closeSync(handle);
  }

  createFileInDirectory(directory: string, fileName: string, content?: string): void {
    const directoryPath = path.join(this.path(), directory);
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath);
    }

    const filePath = path.join(directoryPath, fileName);
    const handle = fs.openSync(filePath, 'w');
    if (content) {
      fs.writeFileSync(handle, content);
    }
    fs.closeSync(handle);
  }

  createFiles(fileNames: string[]): void {
    fileNames.forEach((fileName) => this.createFile(fileName));
  }

  createDirectory(dirName: string): void {
    fs.mkdirSync(path.join(this.path(), dirName));
  }

  path(): string {
    return path.resolve(this.#options.symlink ? this.symlinkToStorePath() : this.#path);
  }

  pathOf(fileName: string): string {
    if (this.#options.symlink) {
      // We should expect the non-resolved symlink path.
      return path.join(path.resolve(path.join(this.path(), '..')), path.basename(this.path()), fileName);
    }

    return path.resolve(path.join(this.path(), fileName));
  }

  lastModifiedOf(fileName: string): Date {
    return fs.statSync(this.pathOf(fileName)).mtime;
  }

  empty(): void {
    this.remove();
    this.create();
  }

  remove(): void {
    if (fs.existsSync(this.#path)) {
      fs.removeSync(this.#path);
    }

    if (this.#options.symlink) {
      fs.removeSync(this.symlinkToStorePath());
    }
  }

  private create(): void {
    if (!fs.existsSync(this.#path)) {
      fs.mkdirSync(this.#path);
    }

    if (this.#options?.symlink && !fs.existsSync(this.symlinkToStorePath())) {
      fs.symlinkSync(this.#path, `${this.#path}-symlink`);
    }
  }

  private symlinkToStorePath(): string {
    return `${this.#path}-symlink`;
  }
}
