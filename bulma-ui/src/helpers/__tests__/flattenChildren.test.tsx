import React from 'react';
import { flattenChildren } from '../flattenChildren';

/** What each item is, for comparing lists: its key, or the text itself. */
const shape = (items: React.ReactNode[]) =>
  items.map(item =>
    React.isValidElement(item) ? `<${String(item.key)}>` : String(item)
  );

describe('flattenChildren', () => {
  it('drops null, undefined and booleans, as Children.toArray does', () => {
    const items = flattenChildren([null, <b key="a" />, undefined, false]);
    expect(shape(items)).toEqual(['<.$a>']);
  });

  it('opens a Fragment, so the items in it count one by one', () => {
    const items = flattenChildren(
      <>
        <b />
        <i />
      </>
    );
    expect(items).toHaveLength(2);
    expect(items.every(item => React.isValidElement(item))).toBe(true);
  });

  it('opens Fragments inside Fragments, and an empty one leaves nothing', () => {
    const items = flattenChildren([
      <b key="a" />,
      <React.Fragment key="empty" />,
      <React.Fragment key="outer">
        <React.Fragment key="inner">
          <i key="b" />
        </React.Fragment>
      </React.Fragment>,
    ]);
    expect(shape(items)).toEqual(['<.$a>', '<.$outer.$inner.$b>']);
  });

  it('keys the items in a Fragment apart from their siblings outside it', () => {
    const items = flattenChildren([
      <b key="x" />,
      <React.Fragment key="group">
        <b key="x" />
      </React.Fragment>,
    ]);
    const keys = items.map(item => (item as React.ReactElement).key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('passes text and numbers through', () => {
    const items = flattenChildren(['a', 1, <b key="c" />]);
    expect(shape(items)).toEqual(['a', '1', '<.$c>']);
  });
});
