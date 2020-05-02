import * as assert from 'assert';
import { EOL } from 'os';

import TitleParser from '../../../src/lib/titleParser';

suite('TitleParser', () => {
  test('Returns undefined when content is empty', () => {
    assert.strictEqual(new TitleParser('').title, undefined);
  });

  test('Returns title from the first heading 1 in the content', () => {
    assert.strictEqual(new TitleParser('# title').title, 'title');
    assert.strictEqual(new TitleParser(`# title1${EOL}# title2`).title, 'title1');
  });

  test('Ignores headings that are invalid according to the CommonMark spec', () => {
    assert.strictEqual(new TitleParser(' # title').title, undefined);
    assert.strictEqual(new TitleParser('#title').title, undefined);
  });

  test('Ignores headings 2-6', () => {
    assert.strictEqual(new TitleParser('## title').title, undefined);
    assert.strictEqual(new TitleParser('### title').title, undefined);
    assert.strictEqual(new TitleParser('#### title').title, undefined);
    assert.strictEqual(new TitleParser('##### title').title, undefined);
    assert.strictEqual(new TitleParser('###### title').title, undefined);
  });
});
