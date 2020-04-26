const fs = require('fs');
const path = require('path');

// Set the notes path to the test workspace path.
const workspaceSettings = {
  "vsnotes.defaultNotePath": path.resolve(__dirname, './workspace')
}
fs.writeFileSync(path.resolve(__dirname, './workspace/.vscode/settings.json'), JSON.stringify(workspaceSettings));
