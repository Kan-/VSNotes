const vscode = require('vscode');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const {resolveHome} = require('./utils');
const TemplateStore = require('./lib/TemplateStore');

// This function handles creation of a new note in default note folder
function newNote(workspaceFolder) {
  const config = vscode.workspace.getConfiguration('vsnotes');
  const defaultNoteFolder = resolveHome(config.get('defaultNotePath'));
  const configuredTemplatesPath = resolveHome(config.get('templatesPath'));
  const templateStore = new TemplateStore(configuredTemplatesPath || path.join(defaultNoteFolder, '.templates.json'));
  const noteFolder = workspaceFolder || defaultNoteFolder;

  templateStore.all().then((templates) => {
    if (!templates.length) {
      createNote({ noteFolder });
      return;
    }

    const quickPickItems = templates.map(template => ({
      label: template.name + (template.default ? '*' : ''),
      description: template.description,
      template: template
    }));

    vscode.window.showQuickPick (quickPickItems, {
      placeHolder: 'Please select a template. Hit Esc to use default (*).',
    })
    .then(item => {
      const template = item ? item.template : templates.find(template => template.default);
      console.log(template);
      createNote({ noteFolder, template: template });
    }, err => {
      console.error(err);
    })
  });
}

function newNoteInWorkspace() {
  const workspaces = vscode.workspace.workspaceFolders;

  if (workspaces == null || workspaces.length === 0) {
    vscode.window.showErrorMessage('No workspaces open.');
    return;
  }

  if (workspaces.length === 1) {
    newNote(workspaces[0].uri.fsPath);
    return;
  }

  const quickPickItems = workspaces.map(workspace => ({ label: workspace.name, workspace: workspace }));

  // Show dialog and ask which workspace to use.
  vscode.window.showQuickPick(quickPickItems).then(item => { // TODO can a user not select anything?
    newNote(item.workspace.uri.fsPath);
  })
}

async function createNote({ noteFolder, template }) {
  const config = vscode.workspace.getConfiguration('vsnotes');
  const defaultNoteName = config.get('defaultNoteName');
  const tokens = config.get('tokens');
  const noteTitleConvertSpaces = config.get('noteTitleConvertSpaces');
  const noteTitleConvertToLowerCase = config.get('noteTitleConvertToLowerCase');

  const noteTitles = config.get('additionalNoteTitles');
  let fileNameTemplate = config.get('defaultNoteTitle');
  if (noteTitles.length > 0) {
    fileNameTemplate = await vscode.window.showQuickPick([fileNameTemplate, ...noteTitles], {
      placeHolder: 'Please select a note title format.'
    })
  }


  if (noteFolder == null || !noteFolder) {
    vscode.window.showErrorMessage('Default note folder not found. Please run setup.');
    return
  }

  // Get the name for the note
  const inputBoxPromise = vscode.window.showInputBox({
    prompt: `Note title? Current Format ${fileNameTemplate}. Hit enter for instant note.`,
    value: "",
  })

  inputBoxPromise.then(noteName => {
    // Check for aborting the new note dialog
    if (noteName == null) {
      return false
    }

    // Check for empty string but confirmation in the new note dialog
    if (noteName == "" || !noteName) {
      noteName = defaultNoteName
    }

    let [directory, title] = _split(noteName);
    let fileName = replaceTokens(fileNameTemplate, title, tokens);

    fileName = noteTitleConvertToLowerCase
      ? fileName.toLocaleLowerCase()
      : fileName;

    if (noteTitleConvertSpaces != null) {
      fileName = fileName.replace(/\s/g, noteTitleConvertSpaces);
    }

    // Create the file
    const createFilePromise = createFile(path.join(noteFolder, directory), fileName, '');
    createFilePromise.then(filePath => {
      if (typeof filePath !== 'string') {
        console.error('Invalid file path')
        return false
      }

      vscode.window.showTextDocument(vscode.Uri.file(filePath), {
        preserveFocus: false,
        preview: false,
      }).then(() => {
        console.log('Note created successfully: ', filePath);

        createTemplate({ template, title, tokens })
      })
    })

  }, err => {
    vscode.workspace.showErrorMessage('Error occurred while creating note.');
    console.error(err);
  })
}

function createTemplate({ template = null, title = null, tokens = []}) {
  if (template) {
    const templateBody = replaceTokens(template.body, title, tokens);

    vscode.window.activeTextEditor.insertSnippet(new vscode.SnippetString(templateBody)).then((inserted) => {
      if (inserted) {
        vscode.window.showInformationMessage(`Added a new ${template.name} note.`);
      }
    });
  }
}

function _split(noteNameWithOptionalPathPrefix) {
  const splitTitle = noteNameWithOptionalPathPrefix.split(path.sep);

  return splitTitle.length > 1
    ? [splitTitle.slice(0, splitTitle.length - 1).join(path.sep), splitTitle[splitTitle.length - 1]]
    : ['', noteNameWithOptionalPathPrefix];
}

// Create the given file if it doesn't exist
function createFile (folderPath, fileName) {
  return new Promise((resolve, reject) => {
    if (folderPath == null || fileName == null) {
      reject();
    }
    const fullPath = path.join(folderPath, fileName);
    // fs-extra
    fs.ensureFile(fullPath).then(() => {
      resolve(fullPath)
    }).catch(err => {
      reject(err)
    })
  });
}

function replaceTokens (stringWithTokens, title, tokens) {
  let result = stringWithTokens;
  for (let token of tokens) {
    let replacement = '';
    switch (token.type) {
      case 'datetime':  replacement = moment().format(token.format); break;
      case 'title':     replacement = title; break;
      case 'extension': replacement = token.format; break;
    }
    result = result.replace(new RegExp(`${token.token}`, 'g'), replacement);
  }
  return result;
}

module.exports = {
  newNote,
  newNoteInWorkspace
}
