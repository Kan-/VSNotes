import * as vscode from 'vscode';
import * as path from 'path';
import Template from './lib/Template';
import TemplateStore from './lib/TemplateStore';
import { resolveHome } from './utils';
import createNote from './lib/newNoteUtil';

interface TemplateQuickPickItem extends vscode.QuickPickItem {
  template: Template;
}

// This function handles creation of a new note in default note folder
export async function newNote(workspaceFolder?: string): Promise<void> {
  const config: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration('vsnotes');
  const defaultNoteFolder: string = resolveHome(config.get('defaultNotePath'));
  const configuredTemplatesPath: string = resolveHome(config.get('templatesPath'));
  const templateStore = new TemplateStore(configuredTemplatesPath || path.join(defaultNoteFolder, '.templates.json'));
  const noteFolder: string = workspaceFolder ?? defaultNoteFolder;

  const templates: Template[] = await templateStore.all();
  if (!templates.length) {
    createNote(noteFolder);
    return;
  }

  const quickPickItems = templates.map((template) => ({
    label: template.name + (template.default ? '*' : ''),
    description: template.description,
    template,
  }));

  const item: TemplateQuickPickItem | undefined = await vscode.window.showQuickPick(
    quickPickItems, { placeHolder: 'Please select a template. Hit Esc to use default (*).' },
  );

  const template = item ? item.template : templates.find((t) => t.default);
  createNote(noteFolder, template);
}

interface WorkspaceFolderQuickPickItem extends vscode.QuickPickItem {
  folder: vscode.WorkspaceFolder;
}

export async function newNoteInWorkspace(): Promise<void> {
  const folders = vscode.workspace.workspaceFolders;

  if (folders == null || folders.length === 0) {
    vscode.window.showErrorMessage('No workspaces open.');
    return;
  }

  if (folders.length === 1) {
    newNote(folders[0].uri.fsPath);
    return;
  }

  // Show dialog and ask which workspace to use.
  const item: WorkspaceFolderQuickPickItem | undefined = await vscode.window
    .showQuickPick(folders.map((folder) => ({ label: folder.name, folder })));
  if (item) {
    newNote(item.folder.uri.fsPath);
  }
}
