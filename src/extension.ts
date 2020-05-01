import * as vscode from 'vscode';
import { newNote, newNoteInWorkspace } from './newNote';
import listNotes from './listNotes';
import TreeDataProvider from './treeView';
import listTags from './listTags';

import setupNotes = require('./setupNotes');
import commitPush = require('./commitPush');
import pull = require('./pull');
import search = require('./search');
import utils = require('./utils');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context: vscode.ExtensionContext): void {
  // Tree view
  const treeDataProvider = new TreeDataProvider();
  vscode.window.registerTreeDataProvider('vsnotes', treeDataProvider);
  vscode.commands.registerCommand('vsnotes.refreshVSNotesView', () => treeDataProvider.refresh());

  // Create a new note
  const newNoteDisposable = vscode.commands.registerCommand('vsnotes.newNote', newNote);
  context.subscriptions.push(newNoteDisposable);

  // Create a new note in a current workspace
  const newNoteInWorkspaceDisposable = vscode.commands.registerCommand('vsnotes.newNoteInWorkspace', newNoteInWorkspace);
  context.subscriptions.push(newNoteInWorkspaceDisposable);

  // Open a note
  const listNotesDisposable = vscode.commands.registerCommand('vsnotes.listNotes', listNotes);
  context.subscriptions.push(listNotesDisposable);

  // List tags
  const listTagsDisposable = vscode.commands.registerCommand('vsnotes.listTags', listTags);
  context.subscriptions.push(listTagsDisposable);

  // Run setup
  const setupDisposable = vscode.commands.registerCommand('vsnotes.setupNotes', setupNotes);
  context.subscriptions.push(setupDisposable);

  // Commit and Push
  const commitPushDisposable = vscode.commands.registerCommand('vsnotes.commitPush', commitPush);
  context.subscriptions.push(commitPushDisposable);

  const pullDisposable = vscode.commands.registerCommand('vsnotes.pull', pull);
  context.subscriptions.push(pullDisposable);

  // Search
  const searchDisposable = vscode.commands.registerCommand('vsnotes.search', search, { context });
  context.subscriptions.push(searchDisposable);

  // Open note folder in new workspace
  const openNoteFolderDisposable = vscode.commands.registerCommand('vsnotes.openNoteFolder', () => {
    const noteFolder = vscode.workspace.getConfiguration('vsnotes').get('defaultNotePath');
    const folderPath = utils.resolveHome(noteFolder);
    const uri = vscode.Uri.file(folderPath);
    return vscode.commands.executeCommand('vscode.openFolder', uri, true);
  });
  context.subscriptions.push(openNoteFolderDisposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate(): void {}
exports.deactivate = deactivate;
