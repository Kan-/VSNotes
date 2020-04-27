const fs = require('fs-extra');
const klaw = require('klaw');
const path = require('path');

const FrontMatterParser = require('./FrontMatterParser')

class NoteStore {

  constructor(storePath, ignorePatterns = []) {
    this.storePath = storePath;
    this.ignorePatterns = ignorePatterns;
  }

  _matchesIgnorePattern(string) {
    return this.ignorePatterns.reduce((matches, pattern) => (matches || pattern.test(string)), false)
  }

  all() { // TODO this should return/resolve Notes
    return new Promise((resolve) => {
      const promises = [];
      const that = this;

      klaw(this.storePath)
        .on('data', item => {
          const fileName = path.basename(item.path);
          const fileRelativePath = path.relative(that.storePath, item.path);
          if (item.stats.isDirectory() || item.stats.isSymbolicLink() || that._matchesIgnorePattern(fileRelativePath)) {
            return;
          }

          promises.push(new Promise((resolveNote) => {
            fs.readFile(item.path).then(content => {
              resolveNote({
                filePath: item.path,
                fileRelativePath: fileRelativePath,
                fileName: fileName,
                fileLastModifiedAt: item.stats.mtime,
                tags: new FrontMatterParser(content).tags
              });
            }).catch((reason) => {
              console.error('Unable to read note ' + item.path, reason);
            })
          }))
        })
        .on('error', (error, item) => {
          console.error('Unable to walk ' + item.path, error.message);
        })
        .on('end', () => Promise.all(promises).then(notes => resolve(notes)));
    })
  }
}

module.exports = NoteStore;
