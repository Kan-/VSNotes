import * as vscode from 'vscode';
import * as path from 'path';
import { resolveHome } from './utils';
import Notes from './lib/Notes';
import NoteStore from './lib/NoteStore';
import Note from './lib/Note';

interface TreeItem extends vscode.TreeItem {
  type: string;
}

interface NoteTreeItem extends TreeItem {
  note: Note;
}

interface TagTreeItem extends TreeItem {
  tag: string;
}

interface DirectoryTreeItem extends TreeItem {
  directory: string;
}

function icon(fileName: string): object {
  return {
    light: path.join(__filename, '..', '..', '..', 'media', 'light', fileName),
    dark: path.join(__filename, '..', '..', '..', 'media', 'dark', fileName),
  };
}

function rootDirectoryTreeItem(): TreeItem {
  return {
    label: 'Files',
    type: 'rootDirectory',
    collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
    iconPath: icon('file-directory.svg'),
  };
}

function rootTagsTreeItem(): TreeItem {
  return {
    label: 'Tags',
    type: 'rootTag',
    collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
    iconPath: icon('tag.svg'),
  };
}

function asTagTreeItem(tag: string): TagTreeItem {
  return {
    label: tag,
    type: 'tag',
    tag,
    iconPath: icon('tag.svg'),
    collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
  };
}

function asDirectoryTreeItem(directory: string, parentDirectory: string): DirectoryTreeItem {
  return {
    label: directory,
    type: 'directory',
    directory: path.join(parentDirectory, directory),
    iconPath: icon('file-directory.svg'),
    collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
  };
}

function asNoteTreeItem(note: Note): NoteTreeItem {
  return {
    label: note.fileName,
    type: 'note',
    note,
    iconPath: icon('file.svg'),
    collapsibleState: vscode.TreeItemCollapsibleState.None,
    command: {
      command: 'vscode.open',
      title: '',
      arguments: [vscode.Uri.file(note.filePath)],
    },
  };
}

export default class TreeDataProvider
implements vscode.TreeDataProvider<TreeItem> {
  #hideTags: boolean;

  #hideFiles: boolean;

  #onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined>
  = new vscode.EventEmitter<TreeItem | undefined>();

  readonly onDidChangeTreeData: vscode.Event<TreeItem | undefined>
  = this.#onDidChangeTreeData.event;

  #noteStore: NoteStore;

  #notes: Promise<Notes>;

  constructor() {
    const config = vscode.workspace.getConfiguration('vsnotes');
    const baseDir = resolveHome(config.get('defaultNotePath'));
    const ignorePatterns = (config.get<string[]>('ignorePatterns') ?? [])
      .map((pattern) => new RegExp(pattern));
    this.#hideTags = config.get('treeviewHideTags') ?? false;
    this.#hideFiles = config.get('treeviewHideFiles') ?? false;

    this.#noteStore = new NoteStore(baseDir, ignorePatterns);
    this.#notes = this.#noteStore.all().then((notes) => new Notes(notes));
  }

  refresh(): void {
    this.#notes = this.#noteStore.all().then((notes) => new Notes(notes));
    this.#onDidChangeTreeData.fire();
  }

  getChildren(item?: TreeItem | undefined): vscode.ProviderResult<TreeItem[]> {
    if (!item) {
      const rootItems = [];
      if (!this.#hideFiles) {
        rootItems.push(rootDirectoryTreeItem());
      }
      if (!this.#hideTags) {
        rootItems.push(rootTagsTreeItem());
      }
      return rootItems;
    }

    switch (item.type) {
      case 'rootDirectory':
        return Promise.resolve(this.getDirectoryContents());
      case 'rootTag':
        return Promise.resolve(this.getAllTags());
      case 'directory':
        return Promise.resolve(this.getDirectoryContents((item as DirectoryTreeItem).directory));
      case 'note':
        return Promise.resolve([]);
      case 'tag':
        return Promise.resolve(this.getAllNotesTaggedWith((item as TagTreeItem).tag));
      default:
        throw Error(`Unexpected tree view type ${item.type}.`);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  getTreeItem(item: TreeItem): vscode.TreeItem {
    return item;
  }

  private getDirectoryContents(parentDirectory = ''): Promise<TreeItem[]> {
    return new Promise((resolve) => {
      const items: TreeItem[] = [];
      this.#notes.then((notes) => {
        notes.directories(parentDirectory).forEach((directory) => {
          items.push(asDirectoryTreeItem(directory, parentDirectory));
        });

        notes.inDirectory(parentDirectory).get()
          .forEach((note) => items.push(asNoteTreeItem(note)));

        resolve(items);
      });
    });
  }

  private getAllTags(): Promise<TagTreeItem[]> {
    return new Promise((resolve) => {
      const items: TagTreeItem[] = [];
      this.#notes.then((notes) => {
        notes.allTags().forEach((tag) => items.push(asTagTreeItem(tag)));
        resolve(items);
      });
    });
  }

  private getAllNotesTaggedWith(tag: string): Promise<NoteTreeItem[]> {
    return new Promise((resolve) => {
      const items: NoteTreeItem[] = [];
      this.#notes.then((notes) => {
        notes.withTag(tag).get().forEach((note) => items.push(asNoteTreeItem(note)));
        resolve(items);
      });
    });
  }
}
