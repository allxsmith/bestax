import React from 'react';
import { isGiven } from '../isGiven';

describe('isGiven', () => {
  it.each([
    ['undefined', undefined],
    ['null', null],
    ['false', false],
    ['true', true],
    ['an empty string', ''],
  ])('is false for %s, which React draws as nothing', (_, node) => {
    expect(isGiven(node)).toBe(false);
  });

  it.each([
    ['a string', 'Saved'],
    ['a string of spaces', ' '],
    ['zero', 0],
    ['a number', 3],
    ['an element', <span key="a" />],
    ['an empty array', []],
    ['an empty Fragment', <React.Fragment key="b" />],
  ])('is true for %s', (_, node) => {
    expect(isGiven(node)).toBe(true);
  });
});
