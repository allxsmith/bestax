/**
 * `aTag`: the article a tag takes in a TODO message, by how it reads aloud.
 */

import { aTag } from '../articles.js';

describe('aTag', () => {
  it('says "an" before a tag read with a vowel sound', () => {
    for (const tag of [
      'a',
      'abbr',
      'address',
      'area',
      'article',
      'aside',
      'audio',
      'em',
      'embed',
      'i',
      'img',
      'input',
      'object',
      'ol',
      'option',
      'output',
      'h1',
      'h6',
    ]) {
      expect(aTag(tag)).toBe(`an <${tag}>`);
    }
  });

  it('says "a" before any other', () => {
    for (const tag of [
      'button',
      'div',
      'nav',
      'span',
      'p',
      'li',
      'u',
      'ul',
      'header',
      'select',
    ]) {
      expect(aTag(tag)).toBe(`a <${tag}>`);
    }
  });
});
