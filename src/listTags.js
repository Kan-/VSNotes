const vscode = require('vscode');
const path = require('path');
const fs = require('fs-extra');
const klaw = require('klaw');
const matter = require('gray-matter');
const {resolveHome} = require('./utils');

module.exports = function () {
  const config = vscode.workspace.getConfiguration('vsnotes');
  const noteFolder = resolveHome(config.get('defaultNotePath'));

  const noteFolderLen = noteFolder.length;


  createTagIndex(noteFolder).then(tags => {
    vscode.window.showQuickPick(Object.keys(tags)).then(tag => {
      if (tag != null) {

        const shortPaths = tags[tag].map(function (item) {
          return item.slice(noteFolderLen + 1, item.length);
        })

        vscode.window.showQuickPick(shortPaths).then(chosenShortPath => {
          if (chosenShortPath != null && chosenShortPath) {
            const fullpath = path.join(noteFolder, chosenShortPath)

            vscode.window.showTextDocument(vscode.Uri.file(fullpath)).then(() => {
              console.log('Opening file ' + fullpath);
            }, err => {
              console.error(err);
            })
          }
        }, err => {
          console.error(err)
        })
      }
    }, err => {
      console.error(err)
    })
  })
}


// Given a folder path, traverse and find all markdown files.
// Open and grab tags from front matter.
function createTagIndex(noteFolderPath) {
  const config = vscode.workspace.getConfiguration('vsnotes');
  const ignorePattern = new RegExp(config.get('ignorePatterns')
    .map(function (pattern) { return '(' + pattern + ')' })
    .join('|'));

  return new Promise((resolve, reject) => {
    let files = [];

    klaw(noteFolderPath)
      .on('data', item => {
        files.push(new Promise((res) => {
          const fileName = path.basename(item.path);
          if (!item.stats.isDirectory() && !ignorePattern.test(fileName)) {
            fs.readFile(item.path).then(contents => {
              res({ path: item.path, contents: contents});
            }).catch(err => {
              console.log(err);
              res(); // resolve undefined
            })
          } else {
            res(); // resolve undefined
          }
        }))
      })
      .on('error', (err, item) => {
        reject(err)
        console.error('Error while walking notes folder for tags: ', item, err);
      })
      .on('end', () => {
        Promise.all(files).then(files => {
          let tagIndex = {};
          for (let i = 0; i < files.length; i++) {
            if (files[i] != null && files[i]) {
              const parsedFrontMatter = parseFrontMatter(files[i]);
              if (parsedFrontMatter && 'tags' in parsedFrontMatter.data && parsedFrontMatter.data.tags) {
                for (let tag of parsedFrontMatter.data.tags) {
                  if (tag in tagIndex) {
                    tagIndex[tag].push(files[i].path);
                  } else {
                    tagIndex[tag] = [files[i].path];
                  }
                }
              }
            }
          }
          resolve(tagIndex);
        }).catch(err => {
          console.error(err)
        })
      })
  })
}

function parseFrontMatter(file) {
  try {
    const parsedFrontMatter = matter(file.contents)
    if (!(parsedFrontMatter.data instanceof Object)) {
      console.error('YAML front-matter is not an object: ', file.path);
      return null;
    }
    return parsedFrontMatter;
  } catch (e) {
    console.error(file.path, e);
    return null;
  }
}
