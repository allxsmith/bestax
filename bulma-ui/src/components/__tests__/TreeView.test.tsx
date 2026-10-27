import React, { createRef, useState } from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  TreeView,
  TreeViewItem,
  type TreeViewItemProps,
  type TreeViewProps,
  type TreeViewSelectionMode,
} from '../TreeView';
import { ConfigProvider } from '../../helpers/Config';
import { resetDevWarnings } from '../../helpers/devWarnings';
import { TYPEAHEAD_TIMEOUT } from '../../helpers/typeahead';
import {
  announceDelay,
  announcementLifetime,
} from '../../helpers/statusRegion';

/** A file tree: two levels under `src`, a disabled file, and two top items. */
function Files(props: Partial<TreeViewProps>) {
  return (
    <TreeView aria-label="Files" {...props}>
      <TreeView.Item value="src" label="src">
        <TreeView.Item value="components" label="components">
          <TreeView.Item value="button" label="Button.tsx" />
          <TreeView.Item value="card" label="Card.tsx" />
        </TreeView.Item>
        <TreeView.Item value="index" label="index.ts" />
        <TreeView.Item value="legacy" label="legacy.ts" disabled />
      </TreeView.Item>
      <TreeView.Item value="docs" label="docs">
        <TreeView.Item value="intro" label="intro.md" />
      </TreeView.Item>
      <TreeView.Item value="package" label="package.json" />
    </TreeView>
  );
}

/** The proposal's permissions tree: Projects open with a disabled Delete, Billing closed. */
function Permissions(props: Partial<TreeViewProps>) {
  return (
    <TreeView
      aria-label="Permissions"
      selectionMode="checkbox"
      defaultExpanded={['projects']}
      {...props}
    >
      <TreeView.Item value="projects" label="Projects">
        <TreeView.Item value="projects/read" label="Read" />
        <TreeView.Item value="projects/write" label="Write" />
        <TreeView.Item value="projects/delete" label="Delete" disabled />
      </TreeView.Item>
      <TreeView.Item value="billing" label="Billing">
        <TreeView.Item value="billing/view" label="View invoices" />
        <TreeView.Item value="billing/pay" label="Pay invoices" />
      </TreeView.Item>
    </TreeView>
  );
}

type Load = Pick<
  TreeViewItemProps,
  'isLoading' | 'loadError' | 'onRetry' | 'children'
>;

/** A folder, src, whose children load, above one that's loaded already. */
function Folders({
  src = {},
  ...props
}: Partial<TreeViewProps> & { src?: Load }) {
  return (
    <TreeView aria-label="Folders" {...props}>
      <TreeView.Item
        value="src"
        label="src"
        icon="folder"
        hasChildren
        {...src}
      />
      <TreeView.Item value="docs" label="docs">
        <TreeView.Item value="intro" label="intro.md" />
      </TreeView.Item>
    </TreeView>
  );
}

const FAILED = 'Couldn’t load src';

const item = (name: string) => screen.getByRole('treeitem', { name });
const row = (name: string) => item(name).firstElementChild as HTMLElement;
const box = (name: string) =>
  item(name).querySelector<HTMLInputElement>(':scope > div input')!;
/** The labels of the items on the page, in order. */
const shown = () =>
  screen
    .getAllByRole('treeitem')
    .map(el => el.querySelector(':scope > div > [id]')!.textContent);
/** The label of the focused item. */
const focused = () =>
  document.activeElement?.querySelector(':scope > div > [id]')?.textContent ??
  document.activeElement?.tagName;
/** The label of the item holding the tab stop, and how many hold one. */
const stops = () =>
  screen
    .getAllByRole('treeitem')
    .filter(el => el.tabIndex === 0)
    .map(el => el.querySelector(':scope > div > [id]')!.textContent);
const press = (el: Element, key: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(el, { key, ...init });
const focus = (name: string) => act(() => item(name).focus());
const sorted = (list: string[]) => [...list].sort();
/** The values the last call reported, sorted, since the order means nothing. */
const lastList = (fn: jest.Mock) =>
  sorted(fn.mock.calls[fn.mock.calls.length - 1][0]);

beforeEach(() => resetDevWarnings());

describe('TreeView', () => {
  describe('Rendering', () => {
    it('renders a tree, its items, and an open parent’s children in a group', () => {
      const { container } = render(<Files defaultExpanded={['src']} />);
      const tree = screen.getByRole('tree', { name: 'Files' });
      expect(tree.tagName).toBe('UL');
      expect(tree).toHaveClass('tree-view');
      expect(item('src').tagName).toBe('LI');
      expect(item('src')).toHaveClass('tree-view-item');
      const group = item('src').querySelector(':scope > ul')!;
      expect(group).toHaveClass('tree-view-group');
      expect(group).toHaveAttribute('role', 'group');
      expect(group.parentElement).toBe(item('src'));
      expect(shown()).toEqual([
        'src',
        'components',
        'index.ts',
        'legacy.ts',
        'docs',
        'package.json',
      ]);
      expect(container.querySelectorAll('[role="group"]')).toHaveLength(1);
    });

    it.each<TreeViewSelectionMode>(['none', 'single', 'checkbox'])(
      'gives a closed item’s children no markup with %s',
      selectionMode => {
        render(
          <Files selectionMode={selectionMode} defaultExpanded={['src']} />
        );
        expect(item('components').querySelector('ul')).toBeNull();
        expect(screen.queryByText('Button.tsx')).toBeNull();
        expect(item('components').children).toHaveLength(1);
      }
    );

    it('names each item by its label and declares its level', () => {
      render(<Files defaultExpanded={['src', 'components']} />);
      const label = item('Button.tsx').querySelector(':scope > div > [id]')!;
      expect(label).toHaveClass('tree-view-label');
      expect(item('Button.tsx')).toHaveAttribute('aria-labelledby', label.id);
      expect(item('src')).toHaveAttribute('aria-level', '1');
      expect(item('components')).toHaveAttribute('aria-level', '2');
      expect(item('Button.tsx')).toHaveAttribute('aria-level', '3');
    });

    it('puts aria-expanded on parents only, hasChildren included', () => {
      render(
        <TreeView aria-label="Folders">
          <TreeView.Item value="a" label="Loaded">
            <TreeView.Item value="a1" label="Inside" />
          </TreeView.Item>
          <TreeView.Item value="b" label="Lazy" hasChildren />
          <TreeView.Item value="c" label="Leaf" />
          <TreeView.Item value="d" label="Empty">
            {false}
            {null}
          </TreeView.Item>
        </TreeView>
      );
      expect(item('Loaded')).toHaveAttribute('aria-expanded', 'false');
      expect(item('Lazy')).toHaveAttribute('aria-expanded', 'false');
      expect(item('Leaf')).not.toHaveAttribute('aria-expanded');
      expect(item('Empty')).not.toHaveAttribute('aria-expanded');
      // Open, a parent with nothing loaded has no group.
      fireEvent.click(item('Lazy'));
      expect(item('Lazy')).toHaveAttribute('aria-expanded', 'true');
      expect(item('Lazy').querySelector('ul')).toBeNull();
    });

    it('gives every row a chevron box hidden from assistive tech, parent or not', () => {
      render(<Files defaultExpanded={['src']} />);
      for (const name of ['src', 'index.ts']) {
        const toggle = row(name).firstElementChild!;
        expect(toggle).toHaveClass('tree-view-toggle');
        expect(toggle).toHaveAttribute('aria-hidden', 'true');
      }
      expect(row('src')).toHaveClass('tree-view-row');
    });

    it('draws an icon name as an Icon and a node as it is, hidden from assistive tech', () => {
      render(
        <TreeView aria-label="Icons">
          <TreeView.Item value="a" label="Named" icon="folder" />
          <TreeView.Item
            value="b"
            label="Node"
            icon={<svg data-testid="svg" />}
          />
          <TreeView.Item value="c" label="Empty string" icon="" />
          <TreeView.Item value="d" label="False" icon={false} />
          <TreeView.Item value="e" label="None" />
        </TreeView>
      );
      const named = row('Named').querySelector('.tree-view-icon')!;
      expect(named).toHaveAttribute('aria-hidden', 'true');
      expect(named.querySelector('.icon i')).toHaveClass('fa-folder');
      expect(
        row('Node').querySelector('.tree-view-icon')!.firstElementChild
      ).toBe(screen.getByTestId('svg'));
      for (const name of ['Empty string', 'False', 'None']) {
        expect(row(name).querySelector('.tree-view-icon')).toBeNull();
      }
    });

    it.each(['small', 'medium', 'large'] as const)(
      'sizes the tree with is-%s',
      size => {
        render(<Files size={size} />);
        expect(screen.getByRole('tree')).toHaveClass(`is-${size}`);
      }
    );

    it('adds no size class for a size it doesn’t know', () => {
      render(<Files size={'huge' as 'small'} />);
      expect(screen.getByRole('tree')).toHaveClass('tree-view', {
        exact: true,
      });
    });

    it('takes the helper props, a className and other attributes on the root', () => {
      render(<Files m="2" color="primary" className="mine" id="files" />);
      const tree = screen.getByRole('tree');
      expect(tree).toHaveClass('tree-view', 'm-2', 'has-text-primary', 'mine');
      expect(tree).toHaveAttribute('id', 'files');
    });

    it('passes other attributes and handlers to the item’s li', () => {
      const onClick = jest.fn();
      const onFocus = jest.fn();
      const onBlur = jest.fn();
      render(
        <TreeView aria-label="Attrs">
          <TreeView.Item
            value="a"
            label="A"
            data-testid="a"
            title="An item"
            className="mine"
            onClick={onClick}
            onFocus={onFocus}
            onBlur={onBlur}
          />
        </TreeView>
      );
      const a = screen.getByTestId('a');
      expect(a).toHaveAttribute('title', 'An item');
      expect(a).toHaveClass('tree-view-item', 'mine');
      fireEvent.click(a);
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(onFocus).toHaveBeenCalledTimes(1);
      act(() => a.blur());
      expect(onBlur).toHaveBeenCalledTimes(1);
    });

    it('keeps the role, the state and the tab stop the parts own', () => {
      const stray = {
        role: 'button',
        'aria-selected': true,
        'aria-checked': true,
        'aria-expanded': true,
        'aria-level': 9,
        tabIndex: 0,
      } as Record<string, unknown>;
      render(
        <TreeView
          aria-label="Owned"
          {...({ role: 'list', 'aria-multiselectable': true } as object)}
        >
          <TreeView.Item value="a" label="A" {...stray} />
          <TreeView.Item value="b" label="B" {...stray} />
        </TreeView>
      );
      const tree = screen.getByRole('tree');
      expect(tree).not.toHaveAttribute('aria-multiselectable');
      expect(item('A')).toHaveAttribute('role', 'treeitem');
      expect(item('A')).not.toHaveAttribute('aria-selected');
      expect(item('A')).not.toHaveAttribute('aria-checked');
      expect(item('A')).not.toHaveAttribute('aria-expanded');
      expect(item('A')).toHaveAttribute('aria-level', '1');
      expect(item('B')).toHaveAttribute('tabindex', '-1');
    });

    it('forwards the root’s ref to its ul and each item’s to its li', () => {
      const treeRef = createRef<HTMLUListElement>();
      const itemRef = createRef<HTMLLIElement>();
      let fromCallback: HTMLLIElement | null = null;
      let treeFromCallback: HTMLUListElement | null = null;
      const { rerender } = render(
        <TreeView aria-label="Refs" ref={treeRef}>
          <TreeView.Item value="a" label="A" ref={itemRef} />
          <TreeView.Item
            value="b"
            label="B"
            ref={node => {
              fromCallback = node;
            }}
          />
        </TreeView>
      );
      expect(treeRef.current).toBe(screen.getByRole('tree'));
      expect(itemRef.current).toBe(item('A'));
      expect(fromCallback).toBe(item('B'));
      rerender(
        <TreeView
          aria-label="Refs"
          ref={node => {
            treeFromCallback = node;
          }}
        >
          <TreeView.Item value="a" label="A" />
        </TreeView>
      );
      expect(treeFromCallback).toBe(screen.getByRole('tree'));
    });
  });

  describe('selectionMode="none"', () => {
    it('puts neither aria-selected nor aria-checked anywhere, and draws no box', () => {
      const { container } = render(
        <Files selected="index" checked={['index']} defaultExpanded={['src']} />
      );
      expect(container.querySelector('[aria-selected]')).toBeNull();
      expect(container.querySelector('[aria-checked]')).toBeNull();
      expect(container.querySelector('input')).toBeNull();
      expect(container.querySelector('.is-selected')).toBeNull();
      expect(screen.getByRole('tree')).not.toHaveAttribute(
        'aria-multiselectable'
      );
    });

    it.each(['Enter', ' '])(
      'opens and closes a parent with %p, and does nothing on a leaf',
      key => {
        const onExpandedChange = jest.fn();
        render(<Files onExpandedChange={onExpandedChange} />);
        expect(press(item('src'), key)).toBe(false);
        expect(onExpandedChange).toHaveBeenLastCalledWith(['src']);
        expect(item('src')).toHaveAttribute('aria-expanded', 'true');
        press(item('src'), key);
        expect(onExpandedChange).toHaveBeenLastCalledWith([]);
        onExpandedChange.mockClear();
        // Claimed, so Space doesn't scroll the page, though nothing happens.
        expect(press(item('package.json'), key)).toBe(false);
        expect(onExpandedChange).not.toHaveBeenCalled();
      }
    );

    it('opens and closes a parent with a click on its row, and moves focus there', () => {
      render(<Files />);
      fireEvent.click(item('src').querySelector('.tree-view-label')!);
      expect(item('src')).toHaveAttribute('aria-expanded', 'true');
      expect(focused()).toBe('src');
      fireEvent.click(row('src'));
      expect(item('src')).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(item('package.json'));
      expect(focused()).toBe('package.json');
    });

    it('leaves a click in an open item’s group to the item inside it', () => {
      render(<Files defaultExpanded={['src']} />);
      fireEvent.click(item('src').querySelector('ul')!);
      expect(item('src')).toHaveAttribute('aria-expanded', 'true');
    });

    it('acts once for a held key', () => {
      const onExpandedChange = jest.fn();
      render(<Files onExpandedChange={onExpandedChange} />);
      press(item('src'), 'Enter', { repeat: true });
      press(item('src'), ' ', { repeat: true });
      expect(onExpandedChange).not.toHaveBeenCalled();
    });

    it('treats a mode it doesn’t know as none', () => {
      const { container } = render(
        <Files
          selectionMode={'multiple' as TreeViewSelectionMode}
          defaultSelected="package"
        />
      );
      press(item('src'), 'Enter');
      expect(item('src')).toHaveAttribute('aria-expanded', 'true');
      expect(container.querySelector('[aria-selected]')).toBeNull();
    });

    it.each(['toString', 'constructor', 'hasOwnProperty'])(
      'treats %s, a name every object has, as a mode it doesn’t know',
      mode => {
        render(<Files selectionMode={mode as TreeViewSelectionMode} />);
        press(item('src'), 'Enter');
        expect(item('src')).toHaveAttribute('aria-expanded', 'true');
        fireEvent.click(row('src'));
        expect(item('src')).toHaveAttribute('aria-expanded', 'false');
      }
    );
  });

  describe('selectionMode="single"', () => {
    it('marks the selected item, every other enabled one false, and no disabled one', () => {
      render(
        <Files
          selectionMode="single"
          defaultSelected="index"
          defaultExpanded={['src']}
        />
      );
      expect(item('index.ts')).toHaveAttribute('aria-selected', 'true');
      expect(row('index.ts')).toHaveClass('is-selected');
      expect(item('src')).toHaveAttribute('aria-selected', 'false');
      expect(row('src')).not.toHaveClass('is-selected');
      expect(item('legacy.ts')).not.toHaveAttribute('aria-selected');
      expect(row('legacy.ts')).toHaveClass('is-disabled');
      expect(item('index.ts')).not.toHaveAttribute('aria-checked');
    });

    it.each(['Enter', ' '])('selects the focused item with %p', key => {
      const onSelectedChange = jest.fn();
      render(
        <Files
          selectionMode="single"
          onSelectedChange={onSelectedChange}
          defaultExpanded={['src']}
        />
      );
      press(item('src'), key);
      expect(onSelectedChange).toHaveBeenLastCalledWith('src');
      expect(item('src')).toHaveAttribute('aria-selected', 'true');
      // Enter and Space select a parent without opening or closing it.
      expect(item('src')).toHaveAttribute('aria-expanded', 'true');
    });

    it('selects with a click, and a click on a parent opens or closes it too', () => {
      const onSelectedChange = jest.fn();
      render(
        <Files selectionMode="single" onSelectedChange={onSelectedChange} />
      );
      fireEvent.click(row('src'));
      expect(onSelectedChange).toHaveBeenLastCalledWith('src');
      expect(item('src')).toHaveAttribute('aria-expanded', 'true');
      fireEvent.click(row('index.ts'));
      expect(item('index.ts')).toHaveAttribute('aria-selected', 'true');
      expect(item('src')).toHaveAttribute('aria-selected', 'false');
    });

    it('only opens or closes with a click on the chevron', () => {
      const onSelectedChange = jest.fn();
      render(
        <Files selectionMode="single" onSelectedChange={onSelectedChange} />
      );
      fireEvent.click(item('src').querySelector('.tree-view-toggle')!);
      expect(item('src')).toHaveAttribute('aria-expanded', 'true');
      expect(onSelectedChange).not.toHaveBeenCalled();
      expect(focused()).toBe('src');
    });

    it('selects a leaf with a click in the space a chevron would take', () => {
      const onSelectedChange = jest.fn();
      render(
        <Files selectionMode="single" onSelectedChange={onSelectedChange} />
      );
      fireEvent.click(item('package.json').querySelector('.tree-view-toggle')!);
      expect(onSelectedChange).toHaveBeenCalledWith('package');
      expect(item('package.json')).toHaveAttribute('aria-selected', 'true');
    });

    it('does nothing when the selected item is picked again', () => {
      const onSelectedChange = jest.fn();
      render(
        <Files
          selectionMode="single"
          defaultSelected="package"
          onSelectedChange={onSelectedChange}
        />
      );
      press(item('package.json'), 'Enter');
      fireEvent.click(row('package.json'));
      expect(onSelectedChange).not.toHaveBeenCalled();
    });

    it('never selects as focus moves', () => {
      const onSelectedChange = jest.fn();
      render(
        <Files selectionMode="single" onSelectedChange={onSelectedChange} />
      );
      focus('src');
      press(item('src'), 'ArrowDown');
      press(item('docs'), 'End');
      expect(focused()).toBe('package.json');
      expect(onSelectedChange).not.toHaveBeenCalled();
    });

    it('never selects a disabled item', () => {
      const onSelectedChange = jest.fn();
      render(
        <Files
          selectionMode="single"
          onSelectedChange={onSelectedChange}
          defaultExpanded={['src']}
        />
      );
      press(item('legacy.ts'), 'Enter');
      fireEvent.click(row('legacy.ts'));
      expect(onSelectedChange).not.toHaveBeenCalled();
      expect(focused()).toBe('legacy.ts');
    });

    it('only reports a pick while controlled, until the new value comes back', () => {
      const onSelectedChange = jest.fn();
      const { rerender } = render(
        <Files
          selectionMode="single"
          selected="docs"
          onSelectedChange={onSelectedChange}
        />
      );
      press(item('package.json'), 'Enter');
      expect(onSelectedChange).toHaveBeenCalledWith('package');
      expect(item('docs')).toHaveAttribute('aria-selected', 'true');
      rerender(
        <Files
          selectionMode="single"
          selected="package"
          onSelectedChange={onSelectedChange}
        />
      );
      expect(item('package.json')).toHaveAttribute('aria-selected', 'true');
      rerender(<Files selectionMode="single" selected={null} />);
      expect(screen.queryByRole('treeitem', { selected: true })).toBeNull();
    });
  });

  describe('selectionMode="checkbox"', () => {
    it('marks the tree multiselectable and every item checked, unchecked or mixed', () => {
      const { container } = render(
        <Permissions defaultChecked={['projects/read']} />
      );
      expect(screen.getByRole('tree')).toHaveAttribute(
        'aria-multiselectable',
        'true'
      );
      expect(item('Projects')).toHaveAttribute('aria-checked', 'mixed');
      expect(item('Read')).toHaveAttribute('aria-checked', 'true');
      expect(item('Write')).toHaveAttribute('aria-checked', 'false');
      expect(item('Delete')).toHaveAttribute('aria-checked', 'false');
      expect(item('Billing')).toHaveAttribute('aria-checked', 'false');
      expect(container.querySelector('[aria-selected]')).toBeNull();
      expect(container.querySelector('.is-selected')).toBeNull();
    });

    it('draws a Checkbox in a hidden box, out of the tab order, in the item’s state', () => {
      render(<Permissions defaultChecked={['projects/read']} />);
      const check = row('Read').querySelector('.tree-view-check')!;
      expect(check).toHaveAttribute('aria-hidden', 'true');
      expect(check.querySelector('.styled-checkbox')).not.toBeNull();
      expect(box('Read')).toHaveAttribute('tabindex', '-1');
      expect(box('Read').checked).toBe(true);
      expect(box('Projects').indeterminate).toBe(true);
      expect(box('Projects').checked).toBe(false);
      expect(box('Write').checked).toBe(false);
      expect(box('Delete')).toBeDisabled();
      expect(box('Write')).not.toBeDisabled();
    });

    it('toggles with Space and a click on the row, and opens and closes with Enter', () => {
      const onCheckedChange = jest.fn();
      const onExpandedChange = jest.fn();
      render(
        <Permissions
          onCheckedChange={onCheckedChange}
          onExpandedChange={onExpandedChange}
        />
      );
      press(item('Write'), ' ');
      expect(lastList(onCheckedChange)).toEqual(['projects/write']);
      fireEvent.click(row('Write'));
      expect(lastList(onCheckedChange)).toEqual([]);
      press(item('Projects'), 'Enter');
      expect(onExpandedChange).toHaveBeenLastCalledWith([]);
      expect(onCheckedChange).toHaveBeenCalledTimes(2);
      // Enter on a leaf does nothing in a checkbox tree.
      press(item('Billing'), 'Enter');
      onCheckedChange.mockClear();
      press(item('View invoices'), 'Enter');
      expect(onCheckedChange).not.toHaveBeenCalled();
    });

    it('checks a leaf with a click in the space a chevron would take', () => {
      const onCheckedChange = jest.fn();
      render(<Permissions onCheckedChange={onCheckedChange} />);
      fireEvent.click(item('Write').querySelector('.tree-view-toggle')!);
      expect(lastList(onCheckedChange)).toEqual(['projects/write']);
      expect(item('Write')).toHaveAttribute('aria-checked', 'true');
    });

    it('toggles once for a click on the box’s input or its label, and leaves focus on the item', () => {
      const onCheckedChange = jest.fn();
      render(<Permissions onCheckedChange={onCheckedChange} />);
      fireEvent.click(box('Write'));
      expect(onCheckedChange).toHaveBeenCalledTimes(1);
      expect(item('Write')).toHaveAttribute('aria-checked', 'true');
      expect(box('Write').checked).toBe(true);
      expect(focused()).toBe('Write');
      fireEvent.click(row('Write').querySelector('.check')!);
      expect(onCheckedChange).toHaveBeenCalledTimes(2);
      expect(item('Write')).toHaveAttribute('aria-checked', 'false');
      expect(box('Write').checked).toBe(false);
      fireEvent.click(row('Write').querySelector('.tree-view-check')!);
      expect(onCheckedChange).toHaveBeenCalledTimes(3);
      expect(focused()).toBe('Write');
    });

    it('checks every enabled item under a closed parent, and reports them all', () => {
      const onCheckedChange = jest.fn();
      render(<Permissions onCheckedChange={onCheckedChange} />);
      fireEvent.click(row('Billing'));
      expect(lastList(onCheckedChange)).toEqual(
        sorted(['billing', 'billing/view', 'billing/pay'])
      );
      expect(item('Billing')).toHaveAttribute('aria-checked', 'true');
      press(item('Billing'), 'ArrowRight');
      expect(item('View invoices')).toHaveAttribute('aria-checked', 'true');
      expect(item('Pay invoices')).toHaveAttribute('aria-checked', 'true');
    });

    it('shows a closed parent mixed when something inside it is checked', () => {
      render(<Permissions defaultChecked={['billing/view']} />);
      expect(item('Billing')).toHaveAttribute('aria-checked', 'mixed');
      expect(box('Billing').indeterminate).toBe(true);
    });

    it('checks a mixed parent’s whole branch, leaving a disabled item as it was', () => {
      const onCheckedChange = jest.fn();
      render(
        <Permissions
          defaultChecked={['projects/read']}
          onCheckedChange={onCheckedChange}
        />
      );
      fireEvent.click(row('Projects'));
      expect(lastList(onCheckedChange)).toEqual(
        sorted(['projects', 'projects/read', 'projects/write'])
      );
      // A disabled item doesn't count, so the parent is checked.
      expect(item('Projects')).toHaveAttribute('aria-checked', 'true');
      expect(item('Delete')).toHaveAttribute('aria-checked', 'false');
    });

    it('unchecks a checked parent’s branch, and a disabled item keeps its own value', () => {
      const onCheckedChange = jest.fn();
      render(
        <Permissions
          defaultChecked={['projects', 'projects/delete']}
          onCheckedChange={onCheckedChange}
        />
      );
      expect(item('Read')).toHaveAttribute('aria-checked', 'true');
      expect(item('Delete')).toHaveAttribute('aria-checked', 'true');
      fireEvent.click(row('Projects'));
      expect(lastList(onCheckedChange)).toEqual(['projects/delete']);
      expect(item('Read')).toHaveAttribute('aria-checked', 'false');
      expect(item('Delete')).toHaveAttribute('aria-checked', 'true');
    });

    it('checks a disabled item by its own value only, and never toggles it', () => {
      const onCheckedChange = jest.fn();
      render(
        <Permissions
          defaultChecked={['projects']}
          onCheckedChange={onCheckedChange}
        />
      );
      expect(item('Delete')).toHaveAttribute('aria-checked', 'false');
      press(item('Delete'), ' ');
      fireEvent.click(row('Delete'));
      fireEvent.click(box('Delete'));
      expect(onCheckedChange).not.toHaveBeenCalled();
    });

    it('reads a parent with only disabled items under it as an end of its own', () => {
      const onCheckedChange = jest.fn();
      render(
        <TreeView
          aria-label="Ends"
          selectionMode="checkbox"
          defaultExpanded={['top', 'folder']}
          onCheckedChange={onCheckedChange}
        >
          <TreeView.Item value="top" label="Top">
            <TreeView.Item value="folder" label="Folder">
              <TreeView.Item value="locked" label="Locked" disabled />
            </TreeView.Item>
            <TreeView.Item value="file" label="File" />
          </TreeView.Item>
        </TreeView>
      );
      fireEvent.click(row('Folder'));
      expect(lastList(onCheckedChange)).toEqual(['folder']);
      expect(item('Folder')).toHaveAttribute('aria-checked', 'true');
      expect(item('Locked')).toHaveAttribute('aria-checked', 'false');
      expect(item('Top')).toHaveAttribute('aria-checked', 'mixed');
    });

    it('checks the enabled items under a listed disabled one, since a value stands for its branch', () => {
      render(
        <TreeView
          aria-label="Branch"
          selectionMode="checkbox"
          defaultChecked={['locked']}
          defaultExpanded={['locked']}
        >
          <TreeView.Item value="locked" label="Locked" disabled>
            <TreeView.Item value="inside" label="Inside" />
          </TreeView.Item>
        </TreeView>
      );
      expect(item('Locked')).toHaveAttribute('aria-checked', 'true');
      expect(item('Inside')).toHaveAttribute('aria-checked', 'true');
    });

    it('keeps values the tree doesn’t know in what it reports', () => {
      const onCheckedChange = jest.fn();
      render(
        <Permissions
          defaultChecked={['archive/old', 'projects/read']}
          onCheckedChange={onCheckedChange}
        />
      );
      press(item('Read'), ' ');
      expect(lastList(onCheckedChange)).toEqual(['archive/old']);
    });

    it('round-trips: the list it reports shows the same boxes when passed back', () => {
      function Controlled() {
        const [checked, setChecked] = useState<string[]>(['projects/read']);
        return (
          <>
            <output data-testid="list">{sorted(checked).join(',')}</output>
            <Permissions checked={checked} onCheckedChange={setChecked} />
          </>
        );
      }
      render(<Controlled />);
      fireEvent.click(row('Billing'));
      expect(screen.getByTestId('list')).toHaveTextContent(
        'billing,billing/pay,billing/view,projects/read'
      );
      expect(item('Billing')).toHaveAttribute('aria-checked', 'true');
      expect(item('Projects')).toHaveAttribute('aria-checked', 'mixed');
      fireEvent.click(row('Write'));
      expect(screen.getByTestId('list')).toHaveTextContent(
        'billing,billing/pay,billing/view,projects,projects/read,projects/write'
      );
      expect(item('Projects')).toHaveAttribute('aria-checked', 'true');
    });

    it('only reports a check while controlled, until the new list comes back', () => {
      const onCheckedChange = jest.fn();
      render(<Permissions checked={[]} onCheckedChange={onCheckedChange} />);
      press(item('Read'), ' ');
      expect(onCheckedChange).toHaveBeenCalledWith(['projects/read']);
      expect(item('Read')).toHaveAttribute('aria-checked', 'false');
    });

    it('checks children that arrive later under a listed parent', () => {
      function Lazy({ loaded }: { loaded: boolean }) {
        return (
          <TreeView
            aria-label="Lazy"
            selectionMode="checkbox"
            defaultChecked={['folder']}
          >
            <TreeView.Item value="folder" label="Folder" hasChildren>
              {loaded && (
                <>
                  <TreeView.Item value="folder/a" label="A" />
                  <TreeView.Item value="folder/b" label="B" />
                </>
              )}
            </TreeView.Item>
          </TreeView>
        );
      }
      const { rerender } = render(<Lazy loaded={false} />);
      expect(item('Folder')).toHaveAttribute('aria-checked', 'true');
      rerender(<Lazy loaded />);
      expect(item('Folder')).toHaveAttribute('aria-checked', 'true');
      press(item('Folder'), 'ArrowRight');
      expect(item('A')).toHaveAttribute('aria-checked', 'true');
      expect(item('B')).toHaveAttribute('aria-checked', 'true');
    });

    it('renders a closed item’s children as nothing, but they still count', () => {
      const mounted = jest.fn();
      function Counted({ value }: { value: string }) {
        mounted(value);
        return <TreeView.Item value={value} label={value} />;
      }
      const { container } = render(
        <TreeView
          aria-label="Hidden"
          selectionMode="checkbox"
          defaultChecked={['hidden/a']}
        >
          <TreeView.Item value="hidden" label="Hidden">
            <Counted value="hidden/a" />
            <Counted value="hidden/b" />
          </TreeView.Item>
        </TreeView>
      );
      expect(mounted).toHaveBeenCalledWith('hidden/a');
      expect(container.querySelectorAll('li')).toHaveLength(1);
      expect(item('Hidden')).toHaveAttribute('aria-checked', 'mixed');
    });

    it('doesn’t render a closed item’s children at all outside a checkbox tree', () => {
      const mounted = jest.fn();
      function Counted() {
        mounted();
        return <TreeView.Item value="inside" label="Inside" />;
      }
      render(
        <TreeView aria-label="Closed" selectionMode="single">
          <TreeView.Item value="closed" label="Closed">
            <Counted />
          </TreeView.Item>
        </TreeView>
      );
      expect(mounted).not.toHaveBeenCalled();
    });

    it('reads checked in a checkbox tree only', () => {
      const { container } = render(
        <Files
          selectionMode="single"
          checked={['package']}
          defaultChecked={['docs']}
        />
      );
      expect(container.querySelector('[aria-checked]')).toBeNull();
    });
  });

  describe('Keys', () => {
    it('moves down and up through the items on the page, without wrapping', () => {
      render(<Files defaultExpanded={['src']} />);
      focus('src');
      press(item('src'), 'ArrowUp');
      expect(focused()).toBe('src');
      press(item('src'), 'ArrowDown');
      expect(focused()).toBe('components');
      press(item('components'), 'ArrowDown');
      press(item('index.ts'), 'ArrowDown');
      // A disabled item takes focus from the arrows.
      expect(focused()).toBe('legacy.ts');
      press(item('legacy.ts'), 'ArrowUp');
      expect(focused()).toBe('index.ts');
      focus('package.json');
      press(item('package.json'), 'ArrowDown');
      expect(focused()).toBe('package.json');
    });

    it('goes to the first item with Home and the last on the page with End', () => {
      render(<Files defaultExpanded={['docs']} />);
      focus('src');
      expect(press(item('src'), 'End')).toBe(false);
      expect(focused()).toBe('package.json');
      press(item('package.json'), 'Home');
      expect(focused()).toBe('src');
    });

    it('opens a closed parent with Right, then moves into it, and does nothing on a leaf', () => {
      const onExpandedChange = jest.fn();
      render(<Files onExpandedChange={onExpandedChange} />);
      focus('src');
      press(item('src'), 'ArrowRight');
      expect(onExpandedChange).toHaveBeenLastCalledWith(['src']);
      expect(focused()).toBe('src');
      press(item('src'), 'ArrowRight');
      expect(focused()).toBe('components');
      onExpandedChange.mockClear();
      focus('index.ts');
      expect(press(item('index.ts'), 'ArrowRight')).toBe(false);
      expect(focused()).toBe('index.ts');
      expect(onExpandedChange).not.toHaveBeenCalled();
    });

    it('stays put with Right on an open parent whose children haven’t loaded', () => {
      render(
        <TreeView aria-label="Lazy" defaultExpanded={['lazy']}>
          <TreeView.Item value="lazy" label="Lazy" hasChildren />
          <TreeView.Item value="next" label="Next" />
        </TreeView>
      );
      focus('Lazy');
      press(item('Lazy'), 'ArrowRight');
      expect(focused()).toBe('Lazy');
    });

    it('closes an open parent with Left, then moves to its parent, and stops at the top', () => {
      const onExpandedChange = jest.fn();
      render(
        <Files
          defaultExpanded={['src', 'components']}
          onExpandedChange={onExpandedChange}
        />
      );
      focus('Button.tsx');
      press(item('Button.tsx'), 'ArrowLeft');
      expect(focused()).toBe('components');
      press(item('components'), 'ArrowLeft');
      expect(onExpandedChange).toHaveBeenLastCalledWith(['src']);
      expect(focused()).toBe('components');
      press(item('components'), 'ArrowLeft');
      expect(focused()).toBe('src');
      press(item('src'), 'ArrowLeft');
      press(item('src'), 'ArrowLeft');
      expect(item('src')).toHaveAttribute('aria-expanded', 'false');
      expect(focused()).toBe('src');
    });

    it('never opens or closes a disabled parent, and Left moves past an open one', () => {
      const onExpandedChange = jest.fn();
      render(
        <TreeView
          aria-label="Disabled"
          defaultExpanded={['top', 'open']}
          onExpandedChange={onExpandedChange}
        >
          <TreeView.Item value="top" label="Top">
            <TreeView.Item value="open" label="Open" disabled>
              <TreeView.Item value="inside" label="Inside" />
            </TreeView.Item>
            <TreeView.Item value="shut" label="Shut" disabled>
              <TreeView.Item value="hidden" label="Hidden" />
            </TreeView.Item>
          </TreeView.Item>
        </TreeView>
      );
      focus('Shut');
      press(item('Shut'), 'ArrowRight');
      press(item('Shut'), 'Enter');
      fireEvent.click(item('Shut').querySelector('.tree-view-toggle')!);
      expect(item('Shut')).toHaveAttribute('aria-expanded', 'false');
      // An open disabled parent stays open, so what's in it is reachable.
      focus('Open');
      press(item('Open'), 'ArrowRight');
      expect(focused()).toBe('Inside');
      focus('Open');
      press(item('Open'), 'ArrowLeft');
      expect(focused()).toBe('Top');
      expect(item('Open')).toHaveAttribute('aria-expanded', 'true');
      expect(onExpandedChange).not.toHaveBeenCalled();
    });

    it('swaps Right and Left in a right-to-left page', () => {
      const style = document.createElement('style');
      style.textContent = '.tree-view-item { direction: rtl; }';
      document.head.appendChild(style);
      try {
        render(<Files />);
        focus('src');
        press(item('src'), 'ArrowLeft');
        expect(item('src')).toHaveAttribute('aria-expanded', 'true');
        press(item('src'), 'ArrowLeft');
        expect(focused()).toBe('components');
        press(item('components'), 'ArrowRight');
        expect(focused()).toBe('src');
        press(item('src'), 'ArrowRight');
        expect(item('src')).toHaveAttribute('aria-expanded', 'false');
      } finally {
        style.remove();
      }
    });

    it('opens every closed, enabled parent beside the item with *, itself included', () => {
      const onExpandedChange = jest.fn();
      render(
        <TreeView
          aria-label="Siblings"
          defaultExpanded={['b']}
          onExpandedChange={onExpandedChange}
        >
          <TreeView.Item value="a" label="A">
            <TreeView.Item value="a1" label="A1">
              <TreeView.Item value="a1x" label="A1x" />
            </TreeView.Item>
          </TreeView.Item>
          <TreeView.Item value="b" label="B">
            <TreeView.Item value="b1" label="B1" />
          </TreeView.Item>
          <TreeView.Item value="c" label="C" disabled>
            <TreeView.Item value="c1" label="C1" />
          </TreeView.Item>
          <TreeView.Item value="d" label="D" hasChildren />
          <TreeView.Item value="e" label="E" />
        </TreeView>
      );
      focus('A');
      expect(press(item('A'), '*')).toBe(false);
      expect(sorted(onExpandedChange.mock.calls[0][0])).toEqual([
        'a',
        'b',
        'd',
      ]);
      expect(focused()).toBe('A');
      // A1 isn't beside A, so it stays closed.
      expect(item('A1')).toHaveAttribute('aria-expanded', 'false');
      onExpandedChange.mockClear();
      press(item('A'), '*');
      expect(onExpandedChange).not.toHaveBeenCalled();
    });

    it('moves to the next item whose label starts with what was typed', () => {
      jest.useFakeTimers();
      try {
        render(
          <TreeView aria-label="Typing" defaultExpanded={['src']}>
            <TreeView.Item value="src" label="src" icon="folder">
              <TreeView.Item value="index" label="index.ts" icon="file" />
              <TreeView.Item value="input" label="input.ts" icon="file" />
              <TreeView.Item value="legacy" label="legacy.ts" disabled />
            </TreeView.Item>
            <TreeView.Item value="package" label="package.json" />
            <TreeView.Item value="pnpm" label="pnpm-lock.yaml" />
          </TreeView>
        );
        focus('src');
        expect(press(item('src'), 'p')).toBe(false);
        expect(focused()).toBe('package.json');
        // The same letter again moves on.
        press(item('package.json'), 'p');
        expect(focused()).toBe('pnpm-lock.yaml');
        act(() => jest.advanceTimersByTime(TYPEAHEAD_TIMEOUT));
        // Characters typed together add up to one search.
        press(item('pnpm-lock.yaml'), 'i');
        press(item('index.ts'), 'n');
        press(item('index.ts'), 'p');
        expect(focused()).toBe('input.ts');
        act(() => jest.advanceTimersByTime(TYPEAHEAD_TIMEOUT));
        // A disabled item takes focus from typing, and a miss stays put.
        press(item('input.ts'), 'L');
        expect(focused()).toBe('legacy.ts');
        act(() => jest.advanceTimersByTime(TYPEAHEAD_TIMEOUT));
        press(item('legacy.ts'), 'z');
        expect(focused()).toBe('legacy.ts');
      } finally {
        jest.useRealTimers();
      }
    });

    it('reads the label only, not the icon’s glyph name', () => {
      render(
        <TreeView aria-label="Glyphs">
          <TreeView.Item value="a" label="Alpha" />
          <TreeView.Item
            value="b"
            label="Beta"
            icon={<span className="material-icons">folder</span>}
          />
        </TreeView>
      );
      focus('Alpha');
      press(item('Alpha'), 'f');
      expect(focused()).toBe('Alpha');
    });

    it.each([
      ['Control', { ctrlKey: true }],
      ['Alt', { altKey: true }],
      ['Meta', { metaKey: true }],
      ['an IME', { isComposing: true }],
      ['Safari’s IME', { keyCode: 229 }],
    ])('leaves a key with %s alone', (_label, init) => {
      render(<Files defaultExpanded={['src']} />);
      focus('src');
      for (const key of ['ArrowDown', 'Enter', 'p']) {
        expect(press(item('src'), key, init)).toBe(true);
      }
      expect(focused()).toBe('src');
      expect(item('src')).toHaveAttribute('aria-expanded', 'true');
    });

    it('leaves Escape and Tab to whatever is around the tree', () => {
      render(<Files />);
      focus('src');
      expect(press(item('src'), 'Escape')).toBe(true);
      expect(press(item('src'), 'Tab')).toBe(true);
    });

    it('runs the item’s own onKeyDown first, and a preventDefault there claims the key', () => {
      const onKeyDown = jest.fn((event: React.KeyboardEvent) => {
        if (event.key === 'ArrowDown') event.preventDefault();
      });
      render(
        <TreeView aria-label="Claimed">
          <TreeView.Item value="a" label="A" onKeyDown={onKeyDown} />
          <TreeView.Item value="b" label="B" />
        </TreeView>
      );
      focus('A');
      press(item('A'), 'ArrowDown');
      expect(focused()).toBe('A');
      press(item('A'), 'End');
      expect(focused()).toBe('B');
      expect(onKeyDown).toHaveBeenCalledTimes(2);
    });
  });

  describe('Tab stop', () => {
    it('gives the first item the stop once mounted, with nothing selected', () => {
      render(<Files />);
      expect(stops()).toEqual(['src']);
    });

    it('gives it to the selected item, on the server too', () => {
      const html = renderToStaticMarkup(
        <Files selectionMode="single" defaultSelected="docs" />
      );
      expect(html.match(/tabindex="0"/g)).toHaveLength(1);
      expect(html).toMatch(/aria-selected="true" tabindex="0"/);
      render(<Files selectionMode="single" defaultSelected="docs" />);
      expect(stops()).toEqual(['docs']);
    });

    it('gives it to the first item when the selected one is inside a closed item', () => {
      render(<Files selectionMode="single" defaultSelected="index" />);
      expect(stops()).toEqual(['src']);
    });

    it('gives it to the first checked item on the page in a checkbox tree, and none on the server', () => {
      expect(
        renderToStaticMarkup(
          <Permissions defaultChecked={['projects/write']} />
        )
      ).not.toMatch(/tabindex="0"/);
      render(<Permissions defaultChecked={['projects/write', 'billing']} />);
      expect(stops()).toEqual(['Write']);
    });

    it('follows focus in the tree, and goes back to the selected item when focus leaves', () => {
      render(
        <>
          <Files selectionMode="single" defaultSelected="docs" />
          <button>After</button>
        </>
      );
      focus('src');
      expect(stops()).toEqual(['src']);
      press(item('src'), 'ArrowDown');
      expect(stops()).toEqual(['docs']);
      press(item('docs'), 'ArrowDown');
      expect(stops()).toEqual(['package.json']);
      act(() => screen.getByRole('button').focus());
      expect(stops()).toEqual(['docs']);
    });

    it('stays where focus last was when nothing is selected', () => {
      render(
        <>
          <Files />
          <button>After</button>
        </>
      );
      focus('docs');
      act(() => screen.getByRole('button').focus());
      expect(stops()).toEqual(['docs']);
    });

    it('moves with a click', () => {
      render(<Files />);
      fireEvent.click(row('package.json'));
      expect(stops()).toEqual(['package.json']);
      expect(focused()).toBe('package.json');
    });

    it('hands the stop to the nearest item above one that goes away', () => {
      const { rerender } = render(
        <>
          <Files expanded={['src', 'components']} />
          <button>After</button>
        </>
      );
      focus('Card.tsx');
      act(() => screen.getByRole('button').focus());
      expect(stops()).toEqual(['Card.tsx']);
      rerender(
        <>
          <Files expanded={['src']} />
          <button>After</button>
        </>
      );
      expect(stops()).toEqual(['components']);
      expect(focused()).toBe('BUTTON');
      rerender(
        <>
          <Files expanded={[]} />
          <button>After</button>
        </>
      );
      expect(stops()).toEqual(['src']);
    });

    it('moves focus along with it when the item had focus', () => {
      const { rerender } = render(<Files expanded={['src', 'components']} />);
      focus('Card.tsx');
      rerender(<Files expanded={['src']} />);
      expect(focused()).toBe('components');
      expect(stops()).toEqual(['components']);
    });

    it('hands focus to the first item when nothing above the lost one is left', () => {
      function Shrinking({ all }: { all: boolean }) {
        return (
          <TreeView aria-label="Shrinking">
            <TreeView.Item value="keep" label="Keep" />
            {all && <TreeView.Item value="drop" label="Drop" />}
          </TreeView>
        );
      }
      const { rerender } = render(<Shrinking all />);
      focus('Drop');
      rerender(<Shrinking all={false} />);
      expect(focused()).toBe('Keep');
    });

    it('copes with a tree that empties with focus in it', () => {
      function Emptying({ items }: { items: boolean }) {
        return (
          <TreeView aria-label="Emptying">
            {items && <TreeView.Item value="only" label="Only" />}
          </TreeView>
        );
      }
      const { rerender } = render(<Emptying items />);
      focus('Only');
      rerender(<Emptying items={false} />);
      expect(screen.queryAllByRole('treeitem')).toEqual([]);
      expect(focused()).toBe('BODY');
      rerender(<Emptying items />);
      expect(stops()).toEqual(['Only']);
    });

    it('keeps working when a focused item’s value changes', () => {
      function Renamed({ value }: { value: string }) {
        return (
          <TreeView aria-label="Renamed">
            <TreeView.Item value="first" label="First" />
            <TreeView.Item value={value} label="Second" />
          </TreeView>
        );
      }
      const { rerender } = render(<Renamed value="a" />);
      focus('Second');
      rerender(<Renamed value="b" />);
      expect(focused()).toBe('Second');
      press(item('Second'), 'Home');
      expect(focused()).toBe('First');
      expect(stops()).toEqual(['First']);
    });

    it('survives two items with the same value coming and going', () => {
      function Repeated({ count }: { count: number }) {
        return (
          <TreeView aria-label="Repeated">
            <TreeView.Item value="keep" label="Keep" />
            {count > 0 && <TreeView.Item value="twin" label="Twin one" />}
            {count > 1 && <TreeView.Item value="twin" label="Twin two" />}
          </TreeView>
        );
      }
      const { rerender } = render(<Repeated count={2} />);
      rerender(<Repeated count={1} />);
      rerender(<Repeated count={0} />);
      expect(shown()).toEqual(['Keep']);
    });

    describe('with two parents sharing a value, after the second goes', () => {
      // Both parents open with the shared value. The second one's element is
      // the one the tree heard about last, and it leaves while the first stays.
      function Twins({ two, inside }: { two: boolean; inside: boolean }) {
        return (
          <TreeView aria-label="Twins" expanded={['twin']}>
            <TreeView.Item value="twin" label="One">
              {inside && <TreeView.Item value="a" label="A" />}
            </TreeView.Item>
            {two && (
              <TreeView.Item value="twin" label="Two">
                <TreeView.Item value="b" label="B" />
              </TreeView.Item>
            )}
          </TreeView>
        );
      }
      const page = (two: boolean, inside: boolean) => (
        <>
          <Twins two={two} inside={inside} />
          <button>After</button>
        </>
      );

      it('hands the stop to the first one when an item inside it goes', () => {
        const { rerender } = render(page(true, true));
        focus('A');
        act(() => screen.getByRole('button').focus());
        rerender(page(false, true));
        rerender(page(false, false));
        expect(stops()).toEqual(['One']);
      });

      it('hands focus to the first one when the item inside it goes with focus', () => {
        const { rerender } = render(page(true, true));
        focus('A');
        rerender(page(false, true));
        rerender(page(false, false));
        expect(focused()).toBe('One');
        expect(stops()).toEqual(['One']);
      });
    });

    it('keeps exactly one stop as items open and close', () => {
      render(<Files selectionMode="single" defaultSelected="card" />);
      fireEvent.click(item('src').querySelector('.tree-view-toggle')!);
      fireEvent.click(item('components').querySelector('.tree-view-toggle')!);
      act(() => (document.activeElement as HTMLElement).blur());
      expect(stops()).toEqual(['Card.tsx']);
    });
  });

  describe('Open items', () => {
    it('starts with defaultExpanded and keeps its own state', () => {
      render(<Files defaultExpanded={['docs']} />);
      expect(item('docs')).toHaveAttribute('aria-expanded', 'true');
      fireEvent.click(row('docs'));
      expect(item('docs')).toHaveAttribute('aria-expanded', 'false');
    });

    it('only reports a change while controlled, until the new list comes back', () => {
      const onExpandedChange = jest.fn();
      const { rerender } = render(
        <Files expanded={[]} onExpandedChange={onExpandedChange} />
      );
      fireEvent.click(row('src'));
      expect(onExpandedChange).toHaveBeenCalledWith(['src']);
      expect(item('src')).toHaveAttribute('aria-expanded', 'false');
      rerender(
        <Files expanded={['src']} onExpandedChange={onExpandedChange} />
      );
      expect(item('src')).toHaveAttribute('aria-expanded', 'true');
    });

    it('reopens an item as it was after its parent closes and opens', () => {
      render(<Files defaultExpanded={['src', 'components']} />);
      fireEvent.click(row('src'));
      expect(screen.queryByText('Button.tsx')).toBeNull();
      fireEvent.click(row('src'));
      expect(item('components')).toHaveAttribute('aria-expanded', 'true');
      expect(item('Button.tsx')).toBeInTheDocument();
    });
  });

  describe('Positions', () => {
    /** Each item on the page, as its label and its `aria-posinset`/`aria-setsize`. */
    const positions = () =>
      screen
        .getAllByRole('treeitem')
        .map(
          el =>
            `${el.querySelector(':scope > div > [id]')!.textContent} ${el.getAttribute('aria-posinset')}/${el.getAttribute('aria-setsize')}`
        );

    it('declares each item’s place among the items beside it, at every level', () => {
      render(<Files defaultExpanded={['src', 'components']} />);
      expect(positions()).toEqual([
        'src 1/3',
        'components 1/3',
        'Button.tsx 1/2',
        'Card.tsx 2/2',
        'index.ts 2/3',
        'legacy.ts 3/3',
        'docs 2/3',
        'package.json 3/3',
      ]);
    });

    it('counts only the items on the page in a checkbox tree', () => {
      render(<Permissions />);
      expect(positions()).toEqual([
        'Projects 1/2',
        'Read 1/3',
        'Write 2/3',
        'Delete 3/3',
        'Billing 2/2',
      ]);
    });

    it('counts again as items come, go, move and close', () => {
      function Listed({ names }: { names: string[] }) {
        return (
          <TreeView aria-label="Listed" defaultExpanded={['top']}>
            <TreeView.Item value="top" label="top">
              {names.map(name => (
                <TreeView.Item key={name} value={name} label={name} />
              ))}
            </TreeView.Item>
            <TreeView.Item value="end" label="end" />
          </TreeView>
        );
      }
      const { rerender } = render(<Listed names={['a', 'b']} />);
      expect(positions()).toEqual(['top 1/2', 'a 1/2', 'b 2/2', 'end 2/2']);
      rerender(<Listed names={['a', 'x', 'b']} />);
      expect(positions()).toEqual([
        'top 1/2',
        'a 1/3',
        'x 2/3',
        'b 3/3',
        'end 2/2',
      ]);
      rerender(<Listed names={['b', 'a']} />);
      expect(positions()).toEqual(['top 1/2', 'b 1/2', 'a 2/2', 'end 2/2']);
      // As many items as before, one of them new.
      rerender(<Listed names={['c', 'a']} />);
      expect(positions()).toEqual(['top 1/2', 'c 1/2', 'a 2/2', 'end 2/2']);
      fireEvent.click(row('top'));
      expect(positions()).toEqual(['top 1/2', 'end 2/2']);
    });

    it('counts again when items move without the tree rendering', async () => {
      // The app sorts the children with state of its own, from a key of its
      // own on the parent, so the tree neither renders nor hears of it.
      function Letters() {
        const [reversed, setReversed] = useState(false);
        const names = reversed ? ['c', 'b', 'a'] : ['a', 'b', 'c'];
        return (
          <TreeView.Item
            value="letters"
            label="letters"
            onKeyDown={event => {
              if (event.key === 'r') {
                event.preventDefault();
                setReversed(true);
              }
            }}
          >
            {names.map(name => (
              <TreeView.Item key={name} value={name} label={name} />
            ))}
          </TreeView.Item>
        );
      }
      render(
        <TreeView aria-label="Letters" defaultExpanded={['letters']}>
          <Letters />
        </TreeView>
      );
      expect(positions()).toEqual(['letters 1/1', 'a 1/3', 'b 2/3', 'c 3/3']);
      press(item('letters'), 'r');
      await act(async () => {});
      expect(shown()).toEqual(['letters', 'c', 'b', 'a']);
      expect(positions()).toEqual(['letters 1/1', 'c 1/3', 'b 2/3', 'a 3/3']);
    });

    it('counts a loading row and a failed load’s row with the items beside them', () => {
      const { rerender } = render(
        <Folders defaultExpanded={['src']} src={{ isLoading: true }} />
      );
      expect(positions()).toEqual(['src 1/2', 'Loading… 1/1', 'docs 2/2']);
      rerender(
        <Folders
          defaultExpanded={['src']}
          src={{
            isLoading: true,
            children: <TreeView.Item value="a" label="a.ts" />,
          }}
        />
      );
      expect(positions()).toEqual([
        'src 1/2',
        'a.ts 1/2',
        'Loading… 2/2',
        'docs 2/2',
      ]);
      rerender(
        <Folders
          defaultExpanded={['src']}
          src={{
            loadError: FAILED,
            children: <TreeView.Item value="a" label="a.ts" />,
          }}
        />
      );
      expect(positions()).toEqual([
        'src 1/2',
        'a.ts 1/2',
        `${FAILED} 2/2`,
        'docs 2/2',
      ]);
      rerender(
        <Folders
          defaultExpanded={['src']}
          src={{
            children: [
              <TreeView.Item key="a" value="a" label="a.ts" />,
              <TreeView.Item key="b" value="b" label="b.ts" />,
            ],
          }}
        />
      );
      expect(positions()).toEqual([
        'src 1/2',
        'a.ts 1/2',
        'b.ts 2/2',
        'docs 2/2',
      ]);
    });

    it('lets an item’s own position win, for a set the page holds only part of', () => {
      render(
        <TreeView aria-label="Paged" defaultExpanded={['big']}>
          <TreeView.Item value="big" label="big">
            <TreeView.Item
              value="first"
              label="first"
              aria-posinset={1}
              aria-setsize={-1}
            />
            <TreeView.Item value="second" label="second" />
          </TreeView.Item>
        </TreeView>
      );
      expect(positions()).toEqual(['big 1/1', 'first 1/-1', 'second 2/2']);
    });
  });

  describe('Loading', () => {
    const LOADING = 'Loading…';

    it('ends an open loading item’s group in a row that says so, and shows none while it’s closed', () => {
      const { rerender } = render(<Folders src={{ isLoading: true }} />);
      expect(item('src').querySelector('ul')).toBeNull();
      expect(screen.queryByRole('treeitem', { name: LOADING })).toBeNull();
      fireEvent.click(row('src'));
      const loading = item(LOADING);
      expect(loading.parentElement).toBe(
        item('src').querySelector(':scope > ul')
      );
      expect(loading.parentElement).toHaveAttribute('role', 'group');
      expect(loading).toHaveClass('tree-view-item');
      expect(loading).toHaveAttribute('aria-level', '2');
      expect(loading).toHaveAttribute('aria-disabled', 'true');
      expect(loading).toHaveAttribute('tabindex', '-1');
      expect(loading).not.toHaveAttribute('aria-expanded');
      expect(row(LOADING)).toHaveClass('tree-view-row', 'is-disabled');
      // Bulma's loader turns in the chevron's box, hidden from assistive tech.
      const toggle = row(LOADING).querySelector('.tree-view-toggle')!;
      expect(toggle).toHaveAttribute('aria-hidden', 'true');
      expect(toggle.firstElementChild).toHaveClass('loader');
      // Children already there stay, and the row comes after them.
      rerender(
        <Folders
          src={{
            isLoading: true,
            children: <TreeView.Item value="a" label="a.ts" />,
          }}
        />
      );
      expect(shown()).toEqual(['src', 'a.ts', LOADING, 'docs']);
      rerender(<Folders src={{ isLoading: false }} />);
      expect(screen.queryByRole('treeitem', { name: LOADING })).toBeNull();
      expect(item('src').querySelector('ul')).toBeNull();
    });

    it('needs the item to be a parent', () => {
      render(
        <TreeView aria-label="Leaf" defaultExpanded={['leaf']}>
          <TreeView.Item value="leaf" label="Leaf" isLoading />
        </TreeView>
      );
      expect(screen.getAllByRole('treeitem')).toHaveLength(1);
    });

    it.each<TreeViewSelectionMode>(['none', 'single', 'checkbox'])(
      'never selects, checks or opens the row with %s',
      selectionMode => {
        const onSelectedChange = jest.fn();
        const onCheckedChange = jest.fn();
        const onExpandedChange = jest.fn();
        render(
          <Folders
            selectionMode={selectionMode}
            defaultExpanded={['src']}
            onSelectedChange={onSelectedChange}
            onCheckedChange={onCheckedChange}
            onExpandedChange={onExpandedChange}
            src={{ isLoading: true }}
          />
        );
        const loading = item(LOADING);
        expect(loading).not.toHaveAttribute('aria-selected');
        expect(loading).not.toHaveAttribute('aria-checked');
        expect(loading.querySelector('input')).toBeNull();
        expect(press(loading, 'Enter')).toBe(false);
        press(loading, ' ');
        press(loading, '*');
        fireEvent.click(row(LOADING));
        expect(focused()).toBe(LOADING);
        expect(onSelectedChange).not.toHaveBeenCalled();
        expect(onCheckedChange).not.toHaveBeenCalled();
        expect(onExpandedChange).not.toHaveBeenCalled();
      }
    );

    it('is reached by the arrow keys, Home and End, the way a disabled item is', () => {
      render(<Folders defaultExpanded={['src']} src={{ isLoading: true }} />);
      focus('src');
      press(item('src'), 'ArrowDown');
      expect(focused()).toBe(LOADING);
      press(item(LOADING), 'ArrowDown');
      expect(focused()).toBe('docs');
      press(item('docs'), 'ArrowUp');
      expect(focused()).toBe(LOADING);
      // Right stays put, since the row has nothing under it.
      press(item(LOADING), 'ArrowRight');
      expect(focused()).toBe(LOADING);
      press(item(LOADING), 'ArrowLeft');
      expect(focused()).toBe('src');
      expect(item('src')).toHaveAttribute('aria-expanded', 'true');
      // Right on the open item moves into its group, to the row.
      press(item('src'), 'ArrowRight');
      expect(focused()).toBe(LOADING);
      press(item(LOADING), 'Home');
      expect(focused()).toBe('src');
      press(item('src'), 'End');
      expect(focused()).toBe('docs');
      press(item('docs'), 'l');
      expect(focused()).toBe(LOADING);
    });

    it('holds the stop while focus rests on it, and hands it to its item when it goes', () => {
      const { rerender } = render(
        <>
          <Folders defaultExpanded={['src']} src={{ isLoading: true }} />
          <button>After</button>
        </>
      );
      focus(LOADING);
      expect(stops()).toEqual([LOADING]);
      act(() => screen.getByRole('button').focus());
      expect(stops()).toEqual([LOADING]);
      rerender(
        <>
          <Folders defaultExpanded={['src']} src={{ isLoading: false }} />
          <button>After</button>
        </>
      );
      expect(stops()).toEqual(['src']);
      expect(focused()).toBe('BUTTON');
    });

    it('hands focus to its item when the load ends with focus on it', () => {
      const { rerender } = render(
        <Folders defaultExpanded={['src']} src={{ isLoading: true }} />
      );
      focus(LOADING);
      rerender(
        <Folders
          defaultExpanded={['src']}
          src={{ children: <TreeView.Item value="a" label="a.ts" /> }}
        />
      );
      expect(focused()).toBe('src');
      expect(stops()).toEqual(['src']);
    });

    it('takes its words from the tree', () => {
      render(
        <Folders
          defaultExpanded={['src']}
          loadingLabel="Chargement…"
          src={{ isLoading: true }}
        />
      );
      expect(item('Chargement…')).toHaveAttribute('aria-disabled', 'true');
    });

    describe('a failed load', () => {
      const RETRY = `${FAILED} Retry`;

      it('ends the group in a row with the message and a Retry button, which retries', () => {
        const onRetry = jest.fn();
        render(
          <Folders
            defaultExpanded={['src']}
            src={{ loadError: FAILED, onRetry }}
          />
        );
        // Named by the message and the button, so a screen reader says
        // what pressing it does.
        const failed = item(RETRY);
        expect(failed.parentElement).toHaveAttribute('role', 'group');
        expect(failed).not.toHaveAttribute('aria-disabled');
        expect(failed).toHaveAttribute('aria-level', '2');
        expect(row(RETRY)).not.toHaveClass('is-disabled');
        expect(row(RETRY).querySelector('.loader')).toBeNull();
        const retry = row(RETRY).querySelector('.button')!;
        expect(retry).toHaveClass('button', 'is-small');
        expect(retry).toHaveTextContent('Retry');
        expect(retry).toHaveAttribute('aria-hidden', 'true');
        expect(retry.tagName).toBe('SPAN');
        fireEvent.click(retry);
        expect(onRetry).toHaveBeenCalledTimes(1);
        expect(focused()).toBe(FAILED);
        // The rest of the row does the row's one thing too.
        fireEvent.click(row(RETRY).querySelector('.tree-view-label')!);
        expect(onRetry).toHaveBeenCalledTimes(2);
      });

      it.each<TreeViewSelectionMode>(['none', 'single', 'checkbox'])(
        'retries with Enter and Space with %s, once for a held key, and does nothing else',
        selectionMode => {
          const onRetry = jest.fn();
          const onSelectedChange = jest.fn();
          const onCheckedChange = jest.fn();
          const onExpandedChange = jest.fn();
          render(
            <Folders
              selectionMode={selectionMode}
              defaultExpanded={['src']}
              onSelectedChange={onSelectedChange}
              onCheckedChange={onCheckedChange}
              onExpandedChange={onExpandedChange}
              src={{ loadError: FAILED, onRetry }}
            />
          );
          const failed = item(RETRY);
          expect(failed).not.toHaveAttribute('aria-selected');
          expect(failed).not.toHaveAttribute('aria-checked');
          expect(press(failed, 'Enter')).toBe(false);
          expect(press(failed, ' ')).toBe(false);
          expect(onRetry).toHaveBeenCalledTimes(2);
          press(failed, 'Enter', { repeat: true });
          press(failed, ' ', { repeat: true });
          press(failed, 'Enter', { ctrlKey: true });
          // Right is no retry.
          press(failed, 'ArrowRight');
          expect(onRetry).toHaveBeenCalledTimes(2);
          expect(onSelectedChange).not.toHaveBeenCalled();
          expect(onCheckedChange).not.toHaveBeenCalled();
          expect(onExpandedChange).not.toHaveBeenCalled();
        }
      );

      it('shows the message alone, disabled, with no onRetry', () => {
        render(
          <Folders defaultExpanded={['src']} src={{ loadError: FAILED }} />
        );
        const failed = item(FAILED);
        expect(failed).toHaveAttribute('aria-disabled', 'true');
        expect(row(FAILED)).toHaveClass('is-disabled');
        expect(row(FAILED).querySelector('.button')).toBeNull();
      });

      it('shows nothing for a message that renders nothing', () => {
        render(
          <Folders
            defaultExpanded={['src']}
            src={{ loadError: false, onRetry: jest.fn() }}
          />
        );
        expect(item('src').querySelector('ul')).toBeNull();
      });

      it('shows the loading row while isLoading is given too', () => {
        render(
          <Folders
            defaultExpanded={['src']}
            src={{ isLoading: true, loadError: FAILED, onRetry: jest.fn() }}
          />
        );
        expect(item(LOADING)).toHaveAttribute('aria-disabled', 'true');
        expect(screen.queryByText(FAILED)).toBeNull();
      });

      it('keeps focus on the row as a retry starts loading', () => {
        function Retrying() {
          const [state, setState] = useState<'error' | 'loading' | 'done'>(
            'error'
          );
          return (
            <>
              <Folders
                defaultExpanded={['src']}
                src={{
                  isLoading: state === 'loading',
                  loadError: state === 'error' ? FAILED : undefined,
                  onRetry: () => setState('loading'),
                  children: state === 'done' && (
                    <TreeView.Item value="a" label="a.ts" />
                  ),
                }}
              />
              <button onClick={() => setState('done')}>Finish</button>
            </>
          );
        }
        render(<Retrying />);
        focus(RETRY);
        const failed = document.activeElement;
        press(failed!, 'Enter');
        expect(document.activeElement).toBe(failed);
        expect(focused()).toBe(LOADING);
        expect(stops()).toEqual([LOADING]);
        fireEvent.click(screen.getByRole('button', { name: 'Finish' }));
        expect(focused()).toBe('src');
        expect(shown()).toEqual(['src', 'a.ts', 'docs']);
      });

      it('takes the button’s text from the tree', () => {
        render(
          <Folders
            defaultExpanded={['src']}
            retryLabel="Réessayer"
            src={{ loadError: FAILED, onRetry: jest.fn() }}
          />
        );
        expect(item(`${FAILED} Réessayer`)).toBeInTheDocument();
      });

      it('leaves the stop alone when something in the message takes focus', () => {
        render(
          <>
            <Folders
              defaultExpanded={['src']}
              src={{
                loadError: (
                  <>
                    {FAILED} <a href="#status">Status</a>
                  </>
                ),
                onRetry: jest.fn(),
              }}
            />
            <button>After</button>
          </>
        );
        const link = screen.getByRole('link', { name: 'Status' });
        act(() => link.focus());
        expect(stops()).toEqual(['src']);
        act(() => screen.getByRole('button', { name: 'After' }).focus());
        expect(stops()).toEqual(['src']);
        // The row's own focus still counts.
        focus(`${FAILED} Status Retry`);
        expect(stops()).toEqual([`${FAILED} Status`]);
      });
    });

    it('never counts the rows in a checkbox tree’s boxes or the lists it reports', () => {
      const onCheckedChange = jest.fn();
      const onRetry = jest.fn();
      render(
        <TreeView
          aria-label="Lazy"
          selectionMode="checkbox"
          defaultExpanded={['top', 'lazy', 'broken']}
          defaultChecked={['done']}
          onCheckedChange={onCheckedChange}
        >
          <TreeView.Item value="top" label="Top">
            <TreeView.Item value="done" label="Done" />
            <TreeView.Item value="lazy" label="Lazy" hasChildren isLoading />
            <TreeView.Item
              value="broken"
              label="Broken"
              hasChildren
              loadError="Couldn’t load Broken"
              onRetry={onRetry}
            />
          </TreeView.Item>
        </TreeView>
      );
      // Lazy and Broken have no children yet, so each counts as one.
      expect(item('Top')).toHaveAttribute('aria-checked', 'mixed');
      expect(item('Lazy')).toHaveAttribute('aria-checked', 'false');
      press(item(LOADING), ' ');
      press(item('Couldn’t load Broken Retry'), ' ');
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onCheckedChange).not.toHaveBeenCalled();
      fireEvent.click(row('Top'));
      expect(lastList(onCheckedChange)).toEqual(
        sorted(['top', 'done', 'lazy', 'broken'])
      );
      expect(item('Top')).toHaveAttribute('aria-checked', 'true');
      expect(item(LOADING)).not.toHaveAttribute('aria-checked');
    });

    describe('the live region', () => {
      beforeEach(() => {
        jest.useFakeTimers();
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      const advance = (ms: number) =>
        act(() => {
          jest.advanceTimersByTime(ms);
        });

      /** What the status region says, one entry per announcement. */
      const said = () =>
        Array.from(screen.getByRole('status').children, el => el.textContent);

      it('is one polite status region beside the tree, empty, from the start', () => {
        render(
          <Folders
            defaultExpanded={['src', 'docs']}
            src={{ isLoading: true }}
          />
        );
        const status = screen.getByRole('status');
        expect(status).toHaveAttribute('aria-live', 'polite');
        expect(status).toBeEmptyDOMElement();
        expect(status.previousElementSibling).toBe(screen.getByRole('tree'));
        expect(screen.getByRole('tree').contains(status)).toBe(false);
        advance(announceDelay);
        expect(screen.getAllByRole('status')).toEqual([status]);
      });

      it('says an item is loading when it opens loading, and that it’s loaded when the load ends', () => {
        const { rerender } = render(<Folders src={{ isLoading: true }} />);
        advance(announceDelay);
        expect(said()).toEqual([]);
        fireEvent.click(row('src'));
        advance(announceDelay);
        // The name is the label's, without the icon hidden beside it.
        expect(said()).toEqual(['Loading src']);
        advance(announcementLifetime);
        expect(said()).toEqual([]);
        rerender(
          <Folders
            src={{
              isLoading: false,
              children: <TreeView.Item value="a" label="a.ts" />,
            }}
          />
        );
        advance(announceDelay);
        expect(said()).toEqual(['src loaded']);
      });

      it('says it’s loading when the tree mounts with the item open, and nothing when it’s closed', () => {
        const { unmount } = render(
          <Folders defaultExpanded={['src']} src={{ isLoading: true }} />
        );
        advance(announceDelay);
        expect(said()).toEqual(['Loading src']);
        unmount();
        render(<Folders src={{ isLoading: true }} />);
        advance(announceDelay);
        expect(said()).toEqual([]);
      });

      it('says nothing of a load that ends while the item is closed, or when it opens again', () => {
        const { rerender } = render(
          <Folders defaultExpanded={['src']} src={{ isLoading: true }} />
        );
        advance(announceDelay + announcementLifetime);
        fireEvent.click(row('src'));
        rerender(<Folders src={{ isLoading: false }} />);
        advance(announceDelay);
        expect(said()).toEqual([]);
        fireEvent.click(row('src'));
        advance(announceDelay);
        expect(said()).toEqual([]);
      });

      it('says it once for each load, and not again when a loaded item closes and opens', () => {
        const { rerender } = render(
          <Folders defaultExpanded={['src']} src={{ isLoading: true }} />
        );
        rerender(<Folders src={{ isLoading: false }} />);
        advance(announceDelay);
        // The load ended before the first was written, so it isn't.
        expect(said()).toEqual(['src loaded']);
        advance(announcementLifetime);
        fireEvent.click(row('src'));
        fireEvent.click(row('src'));
        advance(announceDelay);
        expect(said()).toEqual([]);
        rerender(<Folders src={{ isLoading: true }} />);
        advance(announceDelay);
        expect(said()).toEqual(['Loading src']);
        rerender(<Folders src={{ isLoading: false }} />);
        advance(announceDelay);
        expect(said()).toEqual(['Loading src', 'src loaded']);
      });

      it('reads a failed load’s message out, then what a retry says', () => {
        const { rerender } = render(
          <Folders defaultExpanded={['src']} src={{ isLoading: true }} />
        );
        advance(announceDelay + announcementLifetime);
        rerender(
          <Folders
            src={{
              loadError: (
                <>
                  Couldn’t load <strong>src</strong>
                </>
              ),
            }}
          />
        );
        advance(announceDelay);
        expect(said()).toEqual([FAILED]);
        advance(announcementLifetime);
        rerender(<Folders src={{ isLoading: true }} />);
        advance(announceDelay);
        expect(said()).toEqual(['Loading src']);
        rerender(<Folders src={{}} />);
        advance(announceDelay);
        expect(said()).toEqual(['Loading src', 'src loaded']);
      });

      it('reads a second failure out again when the retry loads in between', () => {
        const { rerender } = render(
          <Folders defaultExpanded={['src']} src={{ loadError: FAILED }} />
        );
        advance(announceDelay + announcementLifetime);
        rerender(<Folders src={{ isLoading: true, loadError: FAILED }} />);
        advance(announceDelay);
        expect(said()).toEqual(['Loading src']);
        rerender(<Folders src={{ loadError: FAILED }} />);
        advance(announceDelay);
        expect(said()).toEqual(['Loading src', FAILED]);
      });

      it('says it’s loaded when a failed load’s row goes, with no loading in between', () => {
        const { rerender } = render(
          <Folders defaultExpanded={['src']} src={{ loadError: FAILED }} />
        );
        advance(announceDelay + announcementLifetime);
        // The same message again is no change the tree can see.
        rerender(<Folders src={{ loadError: FAILED }} />);
        advance(announceDelay);
        expect(said()).toEqual([]);
        rerender(
          <Folders
            src={{ children: <TreeView.Item value="a" label="a.ts" /> }}
          />
        );
        advance(announceDelay);
        expect(said()).toEqual(['src loaded']);
      });

      it('says nothing for an item in a closed branch until the branch opens', () => {
        render(
          <TreeView
            aria-label="Nested"
            selectionMode="checkbox"
            defaultExpanded={['lazy']}
          >
            <TreeView.Item value="top" label="Top">
              <TreeView.Item value="lazy" label="Lazy" hasChildren isLoading />
            </TreeView.Item>
          </TreeView>
        );
        advance(announceDelay);
        expect(said()).toEqual([]);
        expect(screen.queryByRole('treeitem', { name: LOADING })).toBeNull();
        fireEvent.click(item('Top').querySelector('.tree-view-toggle')!);
        advance(announceDelay);
        expect(said()).toEqual(['Loading Lazy']);
      });

      it('says it in the app’s language', () => {
        const { rerender } = render(
          <Folders
            defaultExpanded={['src']}
            loadingAnnouncement={name => `Chargement de ${name}`}
            loadedAnnouncement={name => `${name} chargé`}
            src={{ isLoading: true }}
          />
        );
        advance(announceDelay);
        expect(said()).toEqual(['Chargement de src']);
        rerender(
          <Folders
            loadingAnnouncement={name => `Chargement de ${name}`}
            loadedAnnouncement={name => `${name} chargé`}
            src={{}}
          />
        );
        advance(announceDelay);
        expect(said()).toEqual(['Chargement de src', 'src chargé']);
      });

      it('says nothing more once the item goes', () => {
        function Going({ there }: { there: boolean }) {
          return (
            <TreeView aria-label="Going" defaultExpanded={['lazy']}>
              {there && (
                <TreeView.Item
                  value="lazy"
                  label="Lazy"
                  hasChildren
                  isLoading
                />
              )}
            </TreeView>
          );
        }
        const { rerender } = render(<Going there />);
        rerender(<Going there={false} />);
        advance(announceDelay);
        expect(said()).toEqual([]);
      });
    });
  });

  describe('Development warnings', () => {
    let warn: jest.SpyInstance;
    beforeEach(() => {
      warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });
    afterEach(() => warn.mockRestore());

    it('warns once about a tree with no name', () => {
      const unnamed = (
        <TreeView>
          <TreeView.Item value="a" label="A" />
        </TreeView>
      );
      const { rerender } = render(unnamed);
      rerender(unnamed);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toMatch(
        /<TreeView> has no accessible name/
      );
    });

    it('says nothing about a tree named by a heading', () => {
      render(
        <>
          <h2 id="files">Files</h2>
          <TreeView aria-labelledby="files">
            <TreeView.Item value="a" label="A" />
          </TreeView>
        </>
      );
      expect(warn).not.toHaveBeenCalled();
      expect(screen.getByRole('tree', { name: 'Files' })).toBeInTheDocument();
    });

    it('renders nothing for an item outside a tree, and says so', () => {
      const { container } = render(<TreeView.Item value="a" label="A" />);
      expect(container).toBeEmptyDOMElement();
      expect(warn.mock.calls[0][0]).toMatch(
        /<TreeView.Item> is outside a <TreeView>/
      );
    });
  });

  describe('Under a class prefix', () => {
    it('prefixes every class it adds, the box’s and the modifiers included', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bestax-">
          <TreeView
            aria-label="Prefixed"
            selectionMode="checkbox"
            size="small"
            defaultExpanded={['a', 'a/3', 'a/4']}
            defaultChecked={['a/1']}
          >
            <TreeView.Item value="a" label="A" icon="folder">
              <TreeView.Item value="a/1" label="One" />
              <TreeView.Item value="a/2" label="Two" disabled />
              <TreeView.Item value="a/3" label="Three" hasChildren isLoading />
              <TreeView.Item
                value="a/4"
                label="Four"
                hasChildren
                loadError="Couldn’t load Four"
                onRetry={() => {}}
              />
            </TreeView.Item>
          </TreeView>
          <TreeView
            aria-label="Selected"
            selectionMode="single"
            defaultSelected="s"
          >
            <TreeView.Item value="s" label="S" />
          </TreeView>
        </ConfigProvider>
      );
      for (const name of [
        'tree-view',
        'is-small',
        'tree-view-item',
        'tree-view-row',
        'tree-view-toggle',
        'tree-view-check',
        'tree-view-icon',
        'tree-view-label',
        'tree-view-group',
        'is-disabled',
        'is-selected',
        'styled-checkbox',
        'check',
        'loader',
        'button',
      ]) {
        expect(container.querySelector(`.bestax-${name}`)).not.toBeNull();
        expect(container.querySelector(`.${name}`)).toBeNull();
      }
    });
  });

  describe('Compound components', () => {
    it('attaches TreeView.Item as the same component exported by name', () => {
      expect(TreeView.Item).toBe(TreeViewItem);
      expect(TreeView.displayName).toBe('TreeView');
      expect(TreeViewItem.displayName).toBe('TreeView.Item');
    });

    it('renders through the dot path', () => {
      render(
        <TreeView aria-label="Dots">
          <TreeView.Item value="a" label="A" />
        </TreeView>
      );
      expect(item('A')).toBeInTheDocument();
    });
  });

  describe('Server rendering', () => {
    it('reads a parent’s box from the list alone before the items register', () => {
      const html = renderToStaticMarkup(
        <Permissions defaultChecked={['projects/read', 'billing']} />
      );
      const doc = document.createElement('div');
      doc.innerHTML = html;
      const state = (label: string) =>
        Array.from(doc.querySelectorAll('[role="treeitem"]'))
          .find(li => li.querySelector('[id]')!.textContent === label)!
          .getAttribute('aria-checked');
      // A mixed parent renders unchecked until the tree mounts.
      expect(state('Projects')).toBe('false');
      expect(state('Read')).toBe('true');
      expect(state('Billing')).toBe('true');
      const listedParent = document.createElement('div');
      listedParent.innerHTML = renderToStaticMarkup(
        <Permissions defaultChecked={['projects']} />
      );
      const labels = Array.from(
        listedParent.querySelectorAll('[role="treeitem"]')
      ).map(
        li =>
          `${li.querySelector('[id]')!.textContent}=${li.getAttribute('aria-checked')}`
      );
      expect(labels).toEqual([
        'Projects=true',
        'Read=true',
        'Write=true',
        'Delete=false',
        'Billing=false',
      ]);
    });

    it.each([
      [
        'single',
        <Files
          key="single"
          selectionMode="single"
          defaultSelected="card"
          defaultExpanded={['src', 'components']}
        />,
      ],
      [
        'checkbox',
        <Permissions key="checkbox" defaultChecked={['projects/read']} />,
      ],
      [
        'loading',
        <Folders
          key="loading"
          selectionMode="single"
          defaultSelected="docs"
          defaultExpanded={['src']}
          src={{ isLoading: true }}
        />,
      ],
    ])('hydrates a %s tree without a mismatch', async (_mode, tree) => {
      const container = document.createElement('div');
      container.innerHTML = renderToString(tree);
      document.body.appendChild(container);
      // Only after the server render: under jsdom it runs the client's layout
      // effect, which React 18's server renderer warns about.
      const error = jest.spyOn(console, 'error').mockImplementation(() => {});
      let root: ReturnType<typeof hydrateRoot> | undefined;
      try {
        await act(async () => {
          root = hydrateRoot(container, tree);
        });
        expect(error).not.toHaveBeenCalled();
        expect(
          container.querySelectorAll('[role="treeitem"][tabindex="0"]')
        ).toHaveLength(1);
        // The positions arrive once the tree has mounted.
        for (const li of container.querySelectorAll('[role="treeitem"]')) {
          expect(li).toHaveAttribute('aria-posinset');
          expect(li).toHaveAttribute('aria-setsize');
        }
      } finally {
        error.mockRestore();
        await act(async () => root!.unmount());
        container.remove();
      }
    });

    it('renders an open item’s loading row and the empty live region', () => {
      const doc = document.createElement('div');
      doc.innerHTML = renderToStaticMarkup(
        <Folders defaultExpanded={['src']} src={{ isLoading: true }} />
      );
      const tree = doc.querySelector('[role="tree"]')!;
      const status = doc.querySelector('[role="status"]')!;
      expect(status.previousElementSibling).toBe(tree);
      expect(status).toHaveAttribute('aria-live', 'polite');
      expect(status).toBeEmptyDOMElement();
      const loading = tree.querySelector('[role="group"] > [role="treeitem"]')!;
      expect(loading).toHaveTextContent('Loading…');
      expect(loading).toHaveAttribute('aria-disabled', 'true');
      expect(loading).toHaveAttribute('tabindex', '-1');
    });

    it('leaves the positions to the browser until the tree mounts', () => {
      const html = renderToStaticMarkup(
        <Files defaultExpanded={['src']} selectionMode="single" />
      );
      expect(html).toContain('aria-level="2"');
      expect(html).not.toMatch(/aria-posinset|aria-setsize/);
    });

    it('shows a mixed parent once a hydrated checkbox tree has mounted', async () => {
      const tree = <Permissions defaultChecked={['projects/read']} />;
      const container = document.createElement('div');
      container.innerHTML = renderToString(tree);
      document.body.appendChild(container);
      let root: ReturnType<typeof hydrateRoot> | undefined;
      try {
        await act(async () => {
          root = hydrateRoot(container, tree);
        });
        expect(item('Projects')).toHaveAttribute('aria-checked', 'mixed');
        expect(box('Projects').indeterminate).toBe(true);
      } finally {
        await act(async () => root!.unmount());
        container.remove();
      }
    });
  });
});
