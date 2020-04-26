const path = require('path');

class Notes {

  constructor(notes) {
    this.notes = notes;
  }

  get() {
    return this.notes;
  }

  limit(number) {
    return new Notes(this.notes.slice(0, number));
  }

  sortByFileLastModifiedAt() {
    return new Notes(this.notes.sort(function (a, b) {
      if (a.fileLastModifiedAt > b.fileLastModifiedAt) {
        return -1;
      } else if (a.fileLastModifiedAt < b.fileLastModifiedAt) {
        return 1;
      } else {
        return 0;
      }
    }));
  }

  directories(...pathSegments) {
    pathSegments = this._removeFalsyValuesFrom(pathSegments);
    return [...new Set(this.notes
      .map(note => path.dirname(note.fileRelativePath))
      .map(dirname => dirname === '.' ? [] : dirname.split(path.sep))
      .filter(notePathSegments => notePathSegments.length > pathSegments.length)
      .filter(notePathSegments => pathSegments.every((segment, index) => segment === notePathSegments[index]))
      .map(notePathSegments => notePathSegments.slice(pathSegments.length, pathSegments.length + 1))
      .map(pathSegmentOrEmpty => pathSegmentOrEmpty.length === 0 ? '' : pathSegmentOrEmpty[0]))];
  }

  inDirectory(...pathSegments) {
    pathSegments = this._removeFalsyValuesFrom(pathSegments);
    const subdirectory = path.join(...pathSegments);
    return new Notes(this.notes.filter(note => path.dirname(note.fileRelativePath) === subdirectory));
  }

  allTags() {
    const tags = new Set();
    this.notes.forEach(note => note.tags.forEach(tags.add, tags));
    return Array.from(tags).sort();
  }

  withTag(tag) {
    return new Notes([...new Set(this.notes.filter(note => note.tags.includes(tag)))]);
  }

  _removeFalsyValuesFrom(array) {
    return array.filter(Boolean);
  }
}

module.exports = Notes;
