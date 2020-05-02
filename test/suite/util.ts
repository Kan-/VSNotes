function today(): Date {
  return new Date();
}

function yesterday(): Date {
  const date = today();
  const dayInMillis = 24 * 60 * 60 * 1000;
  date.setTime(date.getTime() - dayInMillis);
  return date;
}

export const TODAY = today();
export const YESTERDAY = yesterday();

export function stripIndent(strings: TemplateStringsArray): string {
  const string = strings[0];
  const match = string.match(/^[^\S\n]*(?=\S)/gm);
  const indent = match && Math.min(...match.map((el) => el.length));
  if (indent) {
    const regexp = new RegExp(`^.{${indent}}`, 'gm');
    return string.replace(regexp, '').trim();
  }
  return string[0].trim();
}
