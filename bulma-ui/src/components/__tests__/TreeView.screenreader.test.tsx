// What a screen reader says for TreeView (#1171), simulated with Guidepup's
// Virtual Screen Reader. It's a simulator built on the specs, not NVDA, JAWS
// or VoiceOver: it builds the accessibility tree the way the ARIA and HTML
// specs say and reads it out. So these logs pin what the tree's markup tells
// a screen reader, and a change that alters what's said fails here. What each
// real reader says still needs checking with that reader.
//
// The scenarios are #1171's steps to reproduce, one test each, driven by keys
// pressed through the reader, on the stories the issue names. The docs page's
// Accessibility section quotes these logs, so a change here changes it too.
import React from 'react';
import { render } from '@testing-library/react';
import { Virtual } from '@guidepup/virtual-screen-reader';
import { TreeView, type TreeViewProps } from '../TreeView';
import meta, { DeepTree, FileBrowser, Permissions } from '../TreeView.stories';

// Each key press rebuilds the reader's accessibility tree, which is quick on
// its own but can pass the default 5 seconds a test when the machine is busy
// with other suites and builds, as `pnpm all` keeps it.
jest.setTimeout(30_000);

type Story = () => React.ReactElement;
// The default story is a tree with no selectionMode, rendered from the meta.
const DefaultStory = meta.render as unknown as (
  props: TreeViewProps
) => React.ReactElement;
const FileBrowserStory = FileBrowser.render as unknown as Story;
const PermissionsStory = Permissions.render as unknown as Story;
const DeepTreeStory = DeepTree.render as unknown as Story;

// A reader of each test's own, so one that fails part way can't carry on
// pressing keys into the next.
let reader: Virtual;

/** Renders `ui` between two buttons, and starts a reader on the first. */
async function start(ui: React.ReactElement) {
  const { container } = render(
    <>
      <button type="button">Before</button>
      {ui}
      <button type="button">After</button>
    </>
  );
  reader = new Virtual();
  await reader.start({ container });
}

/** Presses each key in turn, through the reader. */
async function press(...keys: string[]) {
  for (const key of keys) await reader.press(key);
}

/** Tabs until focus is on an item, past any buttons before the tree. */
async function tabIntoTree() {
  do {
    await reader.press('Tab');
  } while (!(await reader.lastSpokenPhrase()).startsWith('treeitem'));
}

/** What the reader has said since the last call, after which it's emptied. */
async function said() {
  const log = await reader.spokenPhraseLog();
  await reader.clearSpokenPhraseLog();
  return log;
}

afterEach(async () => {
  await reader.stop();
});

describe('TreeView, as a simulated screen reader says it', () => {
  it('1. moving onto a closed parent, opening it with Right, and closing it with Left', async () => {
    await start(<FileBrowserStory />);
    await tabIntoTree();
    await press('ArrowDown');
    await said();

    await press('ArrowDown', 'ArrowRight', 'ArrowLeft');
    expect(await said()).toEqual([
      'treeitem, helpers, not expanded, level 2, position 2, not selected, set size 3',
      'treeitem, helpers, expanded, level 2, position 2, not selected, set size 3',
      'treeitem, helpers, not expanded, level 2, position 2, not selected, set size 3',
    ]);
  });

  it('2. opening and closing a parent with Enter and with Space, in a tree with no selectionMode', async () => {
    await start(<DefaultStory {...(meta.args as TreeViewProps)} />);
    await tabIntoTree();
    expect(await said()).toEqual([
      'button, Before',
      'treeitem, src, expanded, level 1, position 1, set size 4',
    ]);

    await press('Enter', 'Enter', ' ', ' ');
    expect(await said()).toEqual([
      'treeitem, src, not expanded, level 1, position 1, set size 4',
      'treeitem, src, expanded, level 1, position 1, set size 4',
      'treeitem, src, not expanded, level 1, position 1, set size 4',
      'treeitem, src, expanded, level 1, position 1, set size 4',
    ]);
  });

  it('3. moving to an item a level deeper, and back up', async () => {
    await start(<FileBrowserStory />);
    await tabIntoTree();
    await said();

    // Left from Card.tsx goes up to its parent, Right to the parent's first
    // child, and Left up again.
    await press('ArrowLeft', 'ArrowRight', 'ArrowLeft');
    expect(await said()).toEqual([
      'treeitem, components, expanded, level 2, position 1, not selected, set size 3',
      'treeitem, Button.tsx, level 3, position 1, not selected, set size 3',
      'treeitem, components, expanded, level 2, position 1, not selected, set size 3',
    ]);
  });

  it('4. a selection with Enter, in a single tree', async () => {
    await start(<FileBrowserStory />);
    await tabIntoTree();
    await press('ArrowDown');
    await said();

    // The item is read again with its new state, and the one that lost the
    // selection says so when focus gets back to it. Nothing else is said:
    // the tree has no live region for a selection.
    await press('Enter', 'ArrowUp');
    expect(await said()).toEqual([
      'treeitem, TreeView.tsx, level 3, position 3, selected, set size 3',
      'treeitem, Card.tsx, level 3, position 2, not selected, set size 3',
    ]);
  });

  it('5. a check with Space, in a checkbox tree, and the parent above it turning mixed', async () => {
    await start(<PermissionsStory />);
    await tabIntoTree();
    // Tab lands on the first checked item.
    expect(await said()).toEqual([
      'button, Before',
      'button, Check all',
      'button, Clear',
      'treeitem, Read, checked, level 2, position 1, set size 3',
    ]);

    await press('End', 'ArrowRight', 'ArrowDown');
    expect(await said()).toEqual([
      'treeitem, Billing, not checked, not expanded, level 1, position 2, set size 2',
      'treeitem, Billing, not checked, expanded, level 1, position 2, set size 2',
      'treeitem, View invoices, not checked, level 2, position 1, set size 2',
    ]);

    // The check is read on the item. Billing turns mixed without a word, and
    // says so once focus moves to it.
    await press(' ', 'ArrowLeft');
    expect(await said()).toEqual([
      'treeitem, View invoices, checked, level 2, position 1, set size 2',
      'treeitem, Billing, partially checked, expanded, level 1, position 2, set size 2',
    ]);

    // A check on the parent reaches the items under it.
    await press(' ', 'ArrowDown', 'ArrowDown');
    expect(await said()).toEqual([
      'treeitem, Billing, checked, expanded, level 1, position 2, set size 2',
      'treeitem, View invoices, checked, level 2, position 1, set size 2',
      'treeitem, Pay invoices, checked, level 2, position 2, set size 2',
    ]);
  });

  describe('6. a disabled item', () => {
    it('in a single tree, with no selection state, and Enter and Space saying nothing', async () => {
      // The docs page's compound example, the single tree with a disabled item.
      await start(
        <TreeView
          aria-label="Files"
          selectionMode="single"
          defaultSelected="src/App.tsx"
          defaultExpanded={['src']}
        >
          <TreeView.Item value="src" label="src" icon="folder">
            <TreeView.Item value="src/index.ts" label="index.ts" icon="file" />
            <TreeView.Item value="src/App.tsx" label="App.tsx" icon="file" />
            <TreeView.Item value="src/legacy.ts" label="legacy.ts" disabled />
          </TreeView.Item>
          <TreeView.Item
            value="package.json"
            label="package.json"
            icon="file"
          />
        </TreeView>
      );
      await tabIntoTree();
      expect(await said()).toEqual([
        'button, Before',
        'treeitem, App.tsx, level 2, position 2, selected, set size 3',
      ]);

      await press('ArrowDown', 'Enter', ' ');
      expect(await said()).toEqual([
        'treeitem, legacy.ts, disabled, level 2, position 3, set size 3',
      ]);
    });

    it('in a checkbox tree, with the state its box shows, and Enter and Space saying nothing', async () => {
      await start(<DeepTreeStory />);
      await tabIntoTree();
      await press('ArrowDown');
      await said();

      await press('ArrowDown', 'Enter', ' ');
      expect(await said()).toEqual([
        'treeitem, Delete, not checked, disabled, level 4, position 3, set size 3',
      ]);
    });

    it('in a checkbox tree, checked by its own value', async () => {
      await start(
        <TreeView
          aria-label="Permissions"
          selectionMode="checkbox"
          defaultChecked={['projects/read', 'projects/delete']}
          defaultExpanded={['projects']}
        >
          <TreeView.Item value="projects" label="Projects">
            <TreeView.Item value="projects/read" label="Read" />
            <TreeView.Item value="projects/delete" label="Delete" disabled />
          </TreeView.Item>
        </TreeView>
      );
      await tabIntoTree();
      await said();

      await press('End', ' ');
      expect(await said()).toEqual([
        'treeitem, Delete, checked, disabled, level 2, position 2, set size 2',
      ]);
    });
  });

  it('7. an item’s position among the items beside it, at every level', async () => {
    await start(<FileBrowserStory />);
    await tabIntoTree();
    await press('Home');
    await said();

    await press(...Array<string>(9).fill('ArrowDown'));
    expect(await said()).toEqual([
      'treeitem, components, expanded, level 2, position 1, not selected, set size 3',
      'treeitem, Button.tsx, level 3, position 1, not selected, set size 3',
      'treeitem, Card.tsx, level 3, position 2, selected, set size 3',
      'treeitem, TreeView.tsx, level 3, position 3, not selected, set size 3',
      'treeitem, helpers, not expanded, level 2, position 2, not selected, set size 3',
      'treeitem, index.ts, level 2, position 3, not selected, set size 3',
      'treeitem, docs, not expanded, level 1, position 2, not selected, set size 4',
      'treeitem, package.json, level 1, position 3, not selected, set size 4',
      'treeitem, README.md, level 1, position 4, not selected, set size 4',
    ]);

    // A group that opens counts its own items.
    await press('Home', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown');
    await press('ArrowDown', 'ArrowRight', 'ArrowRight');
    expect((await said()).slice(-1)).toEqual([
      'treeitem, classNames.ts, level 3, position 1, not selected, set size 1',
    ]);
  });

  it('8. Tab into the tree and back out, with an item selected', async () => {
    await start(<FileBrowserStory />);

    // Tab lands on the selected item. Back in with Shift+Tab, it lands there
    // again, rather than where focus was.
    await press('Tab', 'ArrowDown', 'Tab', 'Shift+Tab');
    expect(await said()).toEqual([
      'button, Before',
      'treeitem, Card.tsx, level 3, position 2, selected, set size 3',
      'treeitem, TreeView.tsx, level 3, position 3, not selected, set size 3',
      'button, After',
      'treeitem, Card.tsx, level 3, position 2, selected, set size 3',
    ]);
  });
});
