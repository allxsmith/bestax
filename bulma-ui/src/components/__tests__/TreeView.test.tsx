import React, { createRef, useState } from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  TreeView,
  TreeViewItem,
  type TreeViewProps,
  type TreeViewSelectionMode,
} from '../TreeView';
import { ConfigProvider } from '../../helpers/Config';
import { resetDevWarnings } from '../../helpers/devWarnings';
import { TYPEAHEAD_TIMEOUT } from '../../helpers/typeahead';

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
            defaultExpanded={['a']}
            defaultChecked={['a/1']}
          >
            <TreeView.Item value="a" label="A" icon="folder">
              <TreeView.Item value="a/1" label="One" />
              <TreeView.Item value="a/2" label="Two" disabled />
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
      } finally {
        error.mockRestore();
        await act(async () => root!.unmount());
        container.remove();
      }
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
