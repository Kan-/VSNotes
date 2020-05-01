import * as assert from 'assert';

import FrontMatterParser from '../../../src/lib/frontMatterParser';

function stripIndent(strings: TemplateStringsArray): string {
  const string = strings[0];
  const match = string.match(/^[^\S\n]*(?=\S)/gm);
  const indent = match && Math.min(...match.map((el) => el.length));
  if (indent) {
    const regexp = new RegExp(`^.{${indent}}`, 'gm');
    return string.replace(regexp, '').trim();
  }
  return string[0].trim();
}

suite('FrontMatterParser', () => {
  test('Does not fail when content is empty', () => {
    const content = '';
    const { tags } = new FrontMatterParser(content);
    assert.deepEqual(tags, []);
  });

  test('Does not fail when content does not start with a valid front matter', () => {
    const content = '--';
    const { tags } = new FrontMatterParser(content);
    assert.deepEqual(tags, []);
  });

  test('Parses single tag', () => {
    const content = stripIndent`
    ---
    tags:
      - tag
    ---
    `;
    const { tags } = new FrontMatterParser(content);
    assert.deepEqual(tags, ['tag']);
  });

  test('Parses multiple tags', () => {
    const content = stripIndent`
    ---
    tags:
      - tag1
      - tag2
    ---
    `;
    const { tags } = new FrontMatterParser(content);
    assert.deepEqual(tags, ['tag1', 'tag2']);
  });

  test('Ignores empty tags', () => {
    const content = stripIndent`
    ---
    tags:
      -
    ---
    `;
    const { tags } = new FrontMatterParser(content);
    assert.deepEqual(tags, []);
  });

  test('Trims tags', () => {
    const content = stripIndent`
    ---
    tags:
      - ' tag '
    ---
    `;
    const { tags } = new FrontMatterParser(content);
    assert.deepEqual(tags, ['tag']);
  });

  test('Considers non-array tags to be an empty tag array', () => {
    const content = stripIndent`
    ---
    tags: string
    ---
    `;
    const { tags } = new FrontMatterParser(content);
    assert.deepEqual(tags, []);
  });
});