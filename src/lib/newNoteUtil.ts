import * as fs from 'fs-extra';
import * as moment from 'moment';
import * as path from 'path';
import * as vscode from 'vscode';
import Template from './template';

interface Token {
  type: string;
  format: string;
  token: string;
}

function replaceTokens(stringWithTokens: string, title: string, tokens: Token[]): string {
  let result = stringWithTokens;

  tokens.forEach((token) => {
    let replacement = '';
    switch (token.type) {
      case 'datetime': replacement = moment().format(token.format); break;
      case 'title': replacement = title; break;
      case 'extension': replacement = token.format; break;
      default: throw new Error(`Unexpected token type ${token.type}`);
    }
    result = result.replace(new RegExp(`${token.token}`, 'g'), replacement);
  });

  return result;
}

async function createTemplate(template: Template, title: string, tokens: Token[]): Promise<void> {
  const templateBody = replaceTokens(template.body, title, tokens);

  if (!vscode.window.activeTextEditor) {
    return;
  }

  const inserted: boolean = await vscode.window.activeTextEditor
    .insertSnippet(new vscode.SnippetString(templateBody));
  if (inserted) {
    vscode.window.showInformationMessage(`Added a new ${template.name} note.`);
  }
}

function split(noteNameWithOptionalPathPrefix: string): [string, string] {
  const splitTitle = noteNameWithOptionalPathPrefix.split(path.sep);

  return splitTitle.length > 1
    ? [splitTitle.slice(0, splitTitle.length - 1).join(path.sep), splitTitle[splitTitle.length - 1]]
    : ['', noteNameWithOptionalPathPrefix];
}

// Create the given file if it doesn't exist
function createFile(folderPath: string, fileName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (folderPath == null || fileName == null) {
      reject();
    }

    const fullPath = path.join(folderPath, fileName);
    fs.ensureFile(fullPath).then(() => {
      resolve(fullPath);
    }).catch((err) => {
      reject(err);
    });
  });
}

export default async function createNote(noteFolder: string, template?: Template): Promise<void> {
  const config = vscode.workspace.getConfiguration('vsnotes');
  const defaultNoteName: string = config.get('defaultNoteName') ?? 'My note';
  const tokens: Token[] = config.get('tokens') ?? [];
  const stringToReplaceSpacesWith: string | undefined = config.get('noteTitleConvertSpaces');
  const noteTitleConvertToLowerCase: boolean = config.get('noteTitleConvertToLowerCase') ?? false;
  const noteTitles: string[] = config.get('additionalNoteTitles') ?? [];
  let fileNameTemplate: string = config.get('defaultNoteTitle') ?? '{title}';

  if (noteTitles.length > 0) {
    fileNameTemplate = await vscode.window.showQuickPick([fileNameTemplate, ...noteTitles], {
      placeHolder: 'Please select a note title format.',
    }) ?? fileNameTemplate;
  }

  if (noteFolder == null || !noteFolder) {
    vscode.window.showErrorMessage('Default note folder not found. Please run setup.');
    return;
  }

  // Get the name for the note
  const noteName = await vscode.window.showInputBox({
    prompt: `Note title? Current Format ${fileNameTemplate}. Hit enter for instant note.`,
    value: '',
  });

  // Check for aborting the new note dialog
  if (noteName === undefined) {
    return;
  }

  const [directory, title] = split(noteName === '' ? defaultNoteName : noteName);
  let fileName: string = replaceTokens(fileNameTemplate, title, tokens);

  fileName = noteTitleConvertToLowerCase
    ? fileName.toLocaleLowerCase()
    : fileName;

  if (stringToReplaceSpacesWith) {
    fileName = fileName.replace(/\s/g, stringToReplaceSpacesWith);
  }

  // Create the file
  try {
    const filePath = await createFile(path.join(noteFolder, directory), fileName);

    if (typeof filePath !== 'string') {
      console.error('Invalid file path');
      return;
    }

    vscode.window.showTextDocument(vscode.Uri.file(filePath), {
      preserveFocus: false,
      preview: false,
    }).then(() => {
      console.log('Note created successfully: ', filePath);

      if (template) {
        createTemplate(template, title, tokens);
      }
    });
  } catch (e) {
    vscode.window.showErrorMessage('Error occurred while creating note.');
    console.error(e);
  }
}
