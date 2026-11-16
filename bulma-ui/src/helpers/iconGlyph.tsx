// INTERNAL: deliberately not exported from src/index.ts.
import React from 'react';
import { Icon } from '../elements/Icon';
import { isElementOf } from './elementType';
import { flattenChildren } from './flattenChildren';

/** Whether a string has something in it besides spaces. */
export const hasText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim() !== '';

/** Whether a string is only spaces, which JSX leaves between elements. */
const isBlank = (node: React.ReactNode) =>
  typeof node === 'string' && node.trim() === '';

/**
 * The glyph in one `.icon`, which is what Bulma keeps square: an `<Icon>` as
 * given, Fragments opened up and blank text left out, and anything else
 * inside an `Icon`. Null when there's nothing to draw, so an empty Fragment
 * or array counts as no glyph.
 */
export function iconOf(node: React.ReactNode) {
  const items = flattenChildren(node).filter(item => !isBlank(item));
  if (items.length === 0) return null;
  const [only] = items;
  if (items.length === 1 && isElementOf(only, Icon)) {
    return only;
  }
  return <Icon>{items}</Icon>;
}

/** The glyph an `icon` prop draws: a string is an `Icon` name, the rest as `iconOf`. */
export function iconFromProp(icon: React.ReactNode) {
  if (typeof icon !== 'string') return iconOf(icon);
  return hasText(icon) ? <Icon name={icon} /> : null;
}
