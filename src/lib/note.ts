export default interface Note {
  filePath: string;
  fileRelativePath: string;
  fileName: string;
  fileLastModifiedAt: Date;
  tags: string[];
}
