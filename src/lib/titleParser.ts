import { EOL } from 'os';

export default class TitleParser {
  readonly title: string | undefined;

  constructor(content: string) {
    const line = content.split(EOL).find((l) => l.startsWith('# '));
    if (line) {
      this.title = line.slice(2);
    }
  }
}
