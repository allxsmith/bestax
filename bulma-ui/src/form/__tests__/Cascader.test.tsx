import type { MockInstance } from 'vitest';
import React, { createRef } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { Cascader, type CascaderProps } from '../Cascader';
import { TreeSelect, type TreeItemData } from '../TreeSelect';
import { Field } from '../Field';
import { Fieldset } from '../Fieldset';
import { ConfigProvider } from '../../helpers/Config';
import { LocaleProvider } from '../../helpers/LocaleProvider';
import { resetDevWarnings } from '../../helpers/devWarnings';
import { announceDelay } from '../../helpers/statusRegion';

const PLACES: TreeItemData[] = [
  {
    value: 'europe',
    label: 'Europe',
    children: [
      {
        value: 'germany',
        label: 'Germany',
        children: [
          { value: 'berlin', label: 'Berlin' },
          { value: 'munich', label: 'Munich' },
          { value: 'hamburg', label: 'Hamburg', disabled: true },
        ],
      },
      { value: 'france', label: 'France' },
      {
        value: 'spain',
        label: 'Spain',
        disabled: true,
        children: [{ value: 'madrid', label: 'Madrid' }],
      },
    ],
  },
  {
    value: 'asia',
    label: 'Asia',
    children: [{ value: 'japan', label: 'Japan' }],
  },
  { value: 'oceania', label: 'Oceania' },
];

let warnSpy: MockInstance;

beforeEach(() => {
  resetDevWarnings();
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

const field = () => screen.getByRole('combobox', { name: /City|Place/ });
const dialog = () => screen.queryByRole('dialog');
const option = (name: string) => screen.getByRole('option', { name });
const lists = () =>
  screen
    .getAllByRole('listbox')
    .map(
      list =>
        list.getAttribute('aria-label') ??
        document.getElementById(list.getAttribute('aria-labelledby')!)
          ?.textContent
    );
const selected = () =>
  screen.queryAllByRole('option', { selected: true }).map(el => el.textContent);
/** The items on the open path, which is drawn, not announced. */
const current = () =>
  Array.from(document.querySelectorAll('.cascader-item.is-active'), el =>
    el.textContent?.trim()
  );
const key = (el: Element, k: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(el, { key: k, ...init });
const press = (k: string, init: KeyboardEventInit = {}) =>
  key(document.activeElement!, k, init);
const open = () => fireEvent.click(field());

function City(props: Partial<CascaderProps>) {
  return <Cascader label="City" data={PLACES} {...props} />;
}

describe('Cascader', () => {
  describe('the field', () => {
    it("is a read-only combobox opening a dialog, showing the picked node's path", () => {
      const { container } = render(<City defaultValue="berlin" />);
      expect(field()).toHaveAttribute('readonly');
      expect(field()).toHaveAttribute('aria-haspopup', 'dialog');
      expect(field()).toHaveAttribute('aria-expanded', 'false');
      expect(field()).toHaveValue('Europe / Germany / Berlin');
      expect(container.querySelector('.field > .cascader')).not.toBeNull();
      expect(container.querySelector('.cascader-chevron .icon')).not.toBeNull();
    });

    it('joins the path with labels.separator, an empty one included', () => {
      const { rerender } = render(
        <City defaultValue="berlin" labels={{ separator: ' › ' }} />
      );
      expect(field()).toHaveValue('Europe › Germany › Berlin');
      rerender(<City value="berlin" labels={{ separator: '' }} />);
      expect(field()).toHaveValue('EuropeGermanyBerlin');
    });

    it('shows a parent as the value, and nothing without one', () => {
      const { rerender } = render(<City value="germany" />);
      expect(field()).toHaveValue('Europe / Germany');
      rerender(<City value={null} placeholder="Pick a city" />);
      expect(field()).toHaveValue('');
      expect(field()).toHaveAttribute('placeholder', 'Pick a city');
    });

    it('keeps a value no node has, shows it as it is, and warns once', () => {
      const { rerender } = render(<City value="mars" />);
      expect(field()).toHaveValue('mars');
      rerender(<City value="venus" />);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('"mars"');
    });

    it('puts helper props on the root and the ref on the field, by object or callback', () => {
      const ref = createRef<HTMLInputElement>();
      const { rerender } = render(
        <Cascader
          label="City"
          data={PLACES}
          ref={ref}
          data-testid="root"
          mt="2"
          color="info"
          size="small"
        />
      );
      expect(screen.getByTestId('root')).toHaveClass('cascader', 'mt-2');
      expect(ref.current).toBe(field());
      expect(field()).toHaveClass('is-info', 'is-small');
      let node: HTMLInputElement | null = null;
      rerender(
        <Cascader
          label="City"
          data={PLACES}
          ref={el => {
            node = el;
          }}
        />
      );
      expect(node).toBe(field());
    });

    it("runs a callback ref's cleanup on detach in place of a call with null, and calls one without a cleanup with null", () => {
      const cleanup = vi.fn();
      const withCleanup = vi.fn(() => cleanup);
      const { unmount } = render(
        <Cascader label="City" data={PLACES} ref={withCleanup} />
      );
      expect(withCleanup).toHaveBeenCalledWith(field());
      unmount();
      expect(cleanup).toHaveBeenCalledTimes(1);
      expect(withCleanup).not.toHaveBeenCalledWith(null);
      const plain = vi.fn();
      const { unmount: unmountPlain } = render(
        <Cascader label="City" data={PLACES} ref={plain} />
      );
      unmountPlain();
      expect(plain).toHaveBeenLastCalledWith(null);
    });

    it('names the panel after aria-label or labels.choose, and inside an outer Field after its label', () => {
      const { unmount } = render(<Cascader aria-label="Place" data={PLACES} />);
      fireEvent.click(screen.getByRole('combobox', { name: 'Place' }));
      expect(screen.getByRole('dialog', { name: 'Place' })).toBeTruthy();
      expect(lists()).toEqual(['Place']);
      expect(screen.getByRole('listbox', { name: 'Place' })).toBeTruthy();
      unmount();
      render(
        <Field label="Outer">
          <Cascader data={PLACES} labels={{ choose: 'Choose a place' }} />
        </Field>
      );
      fireEvent.click(screen.getByRole('combobox', { name: 'Outer' }));
      expect(
        screen.getByRole('dialog', { name: 'Choose a place' })
      ).toBeTruthy();
      expect(
        screen.getByRole('listbox', { name: 'Choose a place' })
      ).toBeTruthy();
    });
  });

  describe('opening', () => {
    it.each([
      ['Enter', {}],
      [' ', {}],
      ['ArrowDown', {}],
      ['ArrowDown', { altKey: true }],
    ])('opens on %s', (k, init) => {
      render(<City />);
      key(field(), k, init);
      expect(dialog()).not.toBeNull();
    });

    it("opens the picked node's path, reports it, and focuses the node", () => {
      const onExpandedChange = vi.fn();
      render(
        <City defaultValue="berlin" onExpandedChange={onExpandedChange} />
      );
      open();
      expect(onExpandedChange).toHaveBeenCalledWith(['europe', 'germany']);
      expect(lists()).toEqual(['City', 'Europe', 'Germany']);
      expect(selected()).toEqual(['Europe', 'Germany', 'Berlin']);
      expect(current()).toEqual(['Europe', 'Germany', 'Berlin']);
      expect(option('Berlin')).toHaveFocus();
      expect(option('Berlin')).toHaveClass(
        'dropdown-item',
        'cascader-item',
        'is-active',
        'is-checked'
      );
      expect(screen.getByRole('dialog')).toHaveClass(
        'picker-popover',
        'cascader-panel'
      );
    });

    it("doesn't report a path that's open already, and with nothing picked focuses the first column's tab stop", () => {
      const onExpandedChange = vi.fn();
      const { rerender } = render(
        <City
          defaultValue="france"
          defaultExpanded={['europe']}
          onExpandedChange={onExpandedChange}
        />
      );
      open();
      expect(onExpandedChange).not.toHaveBeenCalled();
      expect(option('France')).toHaveFocus();
      press('Escape');
      rerender(<City value={null} onExpandedChange={onExpandedChange} />);
      open();
      expect(option('Europe')).toHaveFocus();
      expect(lists()).toEqual(['City', 'Europe']);
      expect(onExpandedChange).not.toHaveBeenCalled();
    });

    it('with nothing picked, keeps a defaultExpanded path open, focusing where it starts', () => {
      const onExpandedChange = vi.fn();
      render(
        <City defaultExpanded={['asia']} onExpandedChange={onExpandedChange} />
      );
      open();
      expect(option('Asia')).toHaveFocus();
      expect(lists()).toEqual(['City', 'Asia']);
      expect(current()).toEqual(['Asia']);
      expect(selected()).toEqual([]);
      expect(onExpandedChange).not.toHaveBeenCalled();
    });

    it('with nothing picked and no open path, focuses the first enabled item, or the first', () => {
      const { unmount } = render(
        <Cascader
          label="City"
          data={[
            { value: 'a', label: 'Alpha', disabled: true },
            { value: 'b', label: 'Beta' },
          ]}
        />
      );
      open();
      expect(option('Beta')).toHaveFocus();
      unmount();
      render(
        <Cascader
          label="City"
          data={[{ value: 'a', label: 'Alpha', disabled: true }]}
        />
      );
      open();
      expect(option('Alpha')).toHaveFocus();
    });

    it("focuses the first item when held columns don't show the picked node", () => {
      render(<City defaultValue="berlin" expanded={[]} />);
      open();
      expect(lists()).toEqual(['City']);
      expect(option('Europe')).toHaveFocus();
    });

    it('opens the picked path when it starts open, and reports it once', () => {
      const onExpandedChange = vi.fn();
      render(
        <City
          defaultValue="munich"
          defaultOpen
          onExpandedChange={onExpandedChange}
        />
      );
      expect(lists()).toEqual(['City', 'Europe', 'Germany']);
      expect(option('Munich')).toHaveFocus();
      expect(onExpandedChange).toHaveBeenCalledTimes(1);
      expect(onExpandedChange).toHaveBeenCalledWith(['europe', 'germany']);
    });

    it('opens the picked path when a held open turns true, each time', () => {
      const onExpandedChange = vi.fn();
      const props = { value: 'japan', onExpandedChange };
      const { rerender } = render(<City {...props} open={false} />);
      rerender(<City {...props} open />);
      expect(lists()).toEqual(['City', 'Asia']);
      expect(option('Japan')).toHaveFocus();
      expect(onExpandedChange).toHaveBeenLastCalledWith(['asia']);
      press('ArrowLeft');
      press('ArrowDown');
      expect(lists()).toEqual(['City']);
      rerender(<City {...props} open={false} />);
      rerender(<City {...props} open />);
      expect(lists()).toEqual(['City', 'Asia']);
      expect(onExpandedChange).toHaveBeenLastCalledWith(['asia']);
    });

    it('reports the path to a held expanded as it opens, which follows it', () => {
      function Held() {
        const [expanded, setExpanded] = React.useState<string[]>([]);
        return (
          <City
            value="berlin"
            defaultOpen
            expanded={expanded}
            onExpandedChange={setExpanded}
          />
        );
      }
      render(<Held />);
      expect(lists()).toEqual(['City', 'Europe', 'Germany']);
    });

    it('opens nothing for a picked value no node has, or with none', () => {
      render(<City value="mars" defaultOpen />);
      expect(lists()).toEqual(['City']);
      expect(option('Europe')).toHaveFocus();
    });

    it('keeps a disabled node on the picked path selected but unfilled, so it stays readable', () => {
      render(<City value="madrid" defaultOpen />);
      expect(lists()).toEqual(['City', 'Europe']);
      expect(option('Spain')).toHaveAttribute('aria-selected', 'true');
      expect(option('Spain')).toHaveClass('is-disabled', 'is-active');
      expect(option('Spain')).not.toHaveClass('is-checked');
      expect(option('Europe')).toHaveClass('is-checked');
    });

    it('opens no path and reports nothing while disabled, and opens it once enabled', () => {
      const onExpandedChange = vi.fn();
      const props = {
        defaultValue: 'berlin',
        defaultOpen: true,
        onExpandedChange,
      };
      const { rerender } = render(<City {...props} disabled />);
      expect(dialog()).toBeNull();
      expect(onExpandedChange).not.toHaveBeenCalled();
      rerender(<City {...props} />);
      expect(lists()).toEqual(['City', 'Europe', 'Germany']);
      expect(onExpandedChange).toHaveBeenCalledTimes(1);
      expect(onExpandedChange).toHaveBeenCalledWith(['europe', 'germany']);
    });

    it('stops the path at a node that opens no column', () => {
      render(<City expanded={['oceania', 'nowhere']} defaultOpen />);
      expect(lists()).toEqual(['City']);
    });

    it('closes on Escape onto the field, and holds Tab inside, column to column', async () => {
      const user = userEvent.setup();
      render(<City defaultValue="berlin" />);
      open();
      await user.tab();
      expect(option('Europe')).toHaveFocus();
      await user.tab();
      expect(option('Germany')).toHaveFocus();
      await user.tab();
      expect(option('Berlin')).toHaveFocus();
      expect(dialog()).not.toBeNull();
      press('Escape');
      expect(dialog()).toBeNull();
      expect(field()).toHaveFocus();
    });

    it('reports and holds a controlled open state', () => {
      const onOpenChange = vi.fn();
      render(<City open={false} onOpenChange={onOpenChange} />);
      open();
      expect(onOpenChange).toHaveBeenCalledWith(true);
      expect(dialog()).toBeNull();
    });

    it('portals the panel with appendToBody, sized by the field', () => {
      const { container } = render(<City appendToBody />);
      open();
      expect(container.contains(screen.getByRole('dialog'))).toBe(false);
      expect(screen.getByRole('dialog')).toHaveClass(
        'is-portal',
        'has-anchor-width'
      );
    });
  });

  describe('a column', () => {
    it('moves focus with Up, Down, Home, End and type-ahead, the open path following and the picked one staying selected', () => {
      render(<City defaultValue="berlin" />);
      open();
      press('ArrowDown');
      expect(option('Munich')).toHaveFocus();
      expect(current()).toEqual(['Europe', 'Germany', 'Munich']);
      expect(selected()).toEqual(['Europe', 'Germany', 'Berlin']);
      expect(option('Munich')).not.toHaveClass('is-checked');
      press('ArrowDown');
      expect(option('Hamburg')).toHaveFocus();
      expect(option('Hamburg')).toHaveAttribute('aria-disabled', 'true');
      expect(option('Hamburg')).toHaveAttribute('aria-selected', 'false');
      expect(option('Hamburg')).toHaveClass('is-active');
      expect(option('Berlin')).toHaveAttribute('aria-selected', 'true');
      expect(option('Berlin')).toHaveClass('is-checked');
      expect(option('Berlin')).not.toHaveClass('is-active');
      press('Home');
      expect(option('Berlin')).toHaveFocus();
      press('End');
      expect(option('Hamburg')).toHaveFocus();
      press('m');
      expect(option('Munich')).toHaveFocus();
    });

    it('starts type-ahead over in each column it comes into', () => {
      render(<City defaultValue="berlin" />);
      open();
      press('m');
      expect(option('Munich')).toHaveFocus();
      press('ArrowLeft');
      press('s');
      expect(option('Spain')).toHaveFocus();
      press('Escape');
      open();
      press('h');
      expect(option('Hamburg')).toHaveFocus();
    });

    it('closes the columns after one whose selection moves', () => {
      const onExpandedChange = vi.fn();
      render(
        <City defaultValue="berlin" onExpandedChange={onExpandedChange} />
      );
      open();
      press('ArrowLeft');
      expect(option('Germany')).toHaveFocus();
      expect(lists()).toEqual(['City', 'Europe', 'Germany']);
      press('ArrowDown');
      expect(option('France')).toHaveFocus();
      expect(lists()).toEqual(['City', 'Europe']);
      expect(onExpandedChange).toHaveBeenLastCalledWith(['europe']);
    });

    it('gives a parent a hint that it opens a column, in labels.opens', () => {
      render(<City labels={{ opens: 'Has more' }} />);
      open();
      expect(option('Europe')).toHaveAccessibleDescription('Has more');
      expect(option('Oceania')).not.toHaveAttribute('aria-describedby');
      expect(
        option('Europe').querySelector('.cascader-item-chevron')
      ).toHaveAttribute('aria-hidden', 'true');
    });

    it('draws an icon and an itemTemplate row', () => {
      render(
        <Cascader
          label="City"
          data={[
            { value: 'a', label: 'Alpha', icon: 'folder' },
            { value: 'b', label: 'Beta', icon: <svg data-testid="svg" /> },
          ]}
          itemTemplate={node => <b>{node.label}!</b>}
        />
      );
      open();
      expect(
        option('Alpha!').querySelector('.cascader-icon .icon')
      ).not.toBeNull();
      expect(screen.getByTestId('svg')).toBeInTheDocument();
    });
  });

  describe('between columns', () => {
    it('opens a parent with Right, reports it, and moves to its first enabled item', () => {
      const onExpandedChange = vi.fn();
      render(<City onExpandedChange={onExpandedChange} />);
      open();
      press('ArrowRight');
      expect(onExpandedChange).toHaveBeenLastCalledWith(['europe']);
      expect(lists()).toEqual(['City', 'Europe']);
      expect(option('Germany')).toHaveFocus();
      press('ArrowRight');
      expect(option('Berlin')).toHaveFocus();
    });

    it('moves into a column open already with Right at its current item, a disabled one too', () => {
      render(<City defaultValue="berlin" />);
      open();
      press('End');
      expect(option('Hamburg')).toHaveFocus();
      press('ArrowLeft');
      press('ArrowRight');
      expect(option('Hamburg')).toHaveFocus();
    });

    it('moves into a column that just opened at its first item when all are disabled', () => {
      render(
        <Cascader
          label="City"
          data={[
            {
              value: 'a',
              label: 'Alpha',
              children: [{ value: 'b', label: 'Beta', disabled: true }],
            },
          ]}
        />
      );
      open();
      press('ArrowRight');
      expect(option('Beta')).toHaveFocus();
    });

    it('moves into a column open already with Right, at its selected item', () => {
      render(<City defaultValue="munich" />);
      open();
      press('ArrowLeft');
      press('ArrowRight');
      expect(option('Munich')).toHaveFocus();
    });

    it('does nothing with Right on a leaf or a disabled parent, or with Left in the first column', () => {
      render(<City defaultValue="france" />);
      open();
      press('ArrowRight');
      expect(option('France')).toHaveFocus();
      press('ArrowDown');
      press('ArrowRight');
      expect(option('Spain')).toHaveFocus();
      expect(lists()).toEqual(['City', 'Europe']);
      press('ArrowLeft');
      press('ArrowLeft');
      expect(option('Europe')).toHaveFocus();
      expect(dialog()).not.toBeNull();
    });

    it("opens only the focused item with Right, where a held path hasn't followed focus", () => {
      render(<City expanded={['europe', 'germany']} />);
      open();
      expect(option('Europe')).toHaveFocus();
      press('ArrowRight');
      expect(option('Germany')).toHaveFocus();
      press('ArrowDown');
      expect(option('France')).toHaveFocus();
      // The held path still opens Germany, but France has focus, and it's a leaf.
      expect(current()).toEqual(['Europe', 'Germany']);
      press('ArrowRight');
      expect(option('France')).toHaveFocus();
      expect(lists()).toEqual(['City', 'Europe', 'Germany']);
    });

    it('opens nothing with Right on a load row, whatever item is current', () => {
      render(
        <Cascader
          label="City"
          data={[
            {
              value: 'photos',
              label: 'Photos',
              isLoading: true,
              children: [
                {
                  value: 'summer',
                  label: 'Summer',
                  children: [{ value: 'beach', label: 'Beach' }],
                },
              ],
            },
          ]}
        />
      );
      open();
      press('ArrowRight');
      expect(option('Summer')).toHaveFocus();
      press('End');
      expect(option('Loading…')).toHaveFocus();
      press('ArrowRight');
      expect(option('Loading…')).toHaveFocus();
      expect(lists()).toEqual(['City', 'Photos']);
      press('ArrowLeft');
      expect(option('Photos')).toHaveFocus();
    });

    it('leaves Right and Left with a modifier to the page', () => {
      render(<City />);
      open();
      press('ArrowRight', { altKey: true });
      press('ArrowRight', { ctrlKey: true });
      press('ArrowRight', { metaKey: true });
      expect(lists()).toEqual(['City']);
    });

    it('swaps Right and Left on a right-to-left page', () => {
      const style = document.createElement('style');
      style.textContent = '[role="listbox"] { direction: rtl; }';
      document.head.appendChild(style);
      try {
        render(<City />);
        open();
        press('ArrowLeft');
        expect(option('Germany')).toHaveFocus();
        press('ArrowRight');
        expect(option('Europe')).toHaveFocus();
      } finally {
        style.remove();
      }
    });

    it('leaves focus on a parent whose column has nothing to pick yet', () => {
      render(
        <Cascader
          label="City"
          data={[
            {
              value: 'lazy',
              label: 'Lazy',
              hasChildren: true,
              isLoading: true,
            },
          ]}
        />
      );
      open();
      press('ArrowRight');
      expect(option('Lazy')).toHaveFocus();
      expect(option('Loading…')).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('picking', () => {
    it('picks a leaf with Enter, closes and puts focus back on the field', () => {
      const onChange = vi.fn();
      render(<City defaultValue="berlin" onChange={onChange} />);
      open();
      press('ArrowDown');
      press('Enter');
      expect(onChange).toHaveBeenCalledWith('munich');
      expect(dialog()).toBeNull();
      expect(field()).toHaveFocus();
      expect(field()).toHaveValue('Europe / Germany / Munich');
    });

    it('opens a parent with Enter, Space or a click, which picks nothing', () => {
      const onChange = vi.fn();
      render(<City onChange={onChange} />);
      open();
      press('Enter');
      expect(lists()).toEqual(['City', 'Europe']);
      press(' ');
      expect(lists()).toEqual(['City', 'Europe', 'Germany']);
      fireEvent.click(option('Asia'));
      expect(lists()).toEqual(['City', 'Asia']);
      expect(option('Japan')).toHaveFocus();
      expect(onChange).not.toHaveBeenCalled();
    });

    it('picks a leaf with a click, never a disabled one, and closes nothing with closeOnSelect={false}', () => {
      const onChange = vi.fn();
      render(
        <City defaultValue="berlin" closeOnSelect={false} onChange={onChange} />
      );
      open();
      fireEvent.click(option('Hamburg'));
      expect(onChange).not.toHaveBeenCalled();
      fireEvent.click(option('Munich'));
      expect(onChange).toHaveBeenCalledWith('munich');
      expect(dialog()).not.toBeNull();
      fireEvent.click(option('Munich'));
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('picks a parent with parentsSelectable, and its chevron opens its column', () => {
      const onChange = vi.fn();
      render(<City parentsSelectable onChange={onChange} />);
      open();
      fireEvent.click(
        option('Europe').querySelector('.cascader-item-chevron')!
      );
      expect(lists()).toEqual(['City', 'Europe']);
      expect(onChange).not.toHaveBeenCalled();
      press('Enter');
      expect(onChange).toHaveBeenCalledWith('germany');
      expect(field()).toHaveValue('Europe / Germany');
    });

    it('holds a controlled value', () => {
      const onChange = vi.fn();
      render(<City value="berlin" onChange={onChange} />);
      open();
      fireEvent.click(option('Munich'));
      expect(onChange).toHaveBeenCalledWith('munich');
      expect(field()).toHaveValue('Europe / Germany / Berlin');
    });

    it('takes the same data and value as a TreeSelect', () => {
      render(
        <>
          <Cascader label="City" data={PLACES} value="berlin" />
          <TreeSelect label="Place" data={PLACES} value="berlin" />
        </>
      );
      expect(screen.getByRole('combobox', { name: 'City' })).toHaveValue(
        'Europe / Germany / Berlin'
      );
      expect(screen.getByRole('combobox', { name: 'Place' })).toHaveValue(
        'Berlin'
      );
    });
  });

  describe('search', () => {
    it('opens on a printable key with it in the box, and swaps the columns for matching leaf paths', async () => {
      const user = userEvent.setup();
      const onQueryChange = vi.fn();
      render(<City searchable onQueryChange={onQueryChange} />);
      key(field(), 'r');
      const box = screen.getByRole('combobox', { name: 'Search' });
      expect(box).toHaveFocus();
      expect(box).toHaveValue('r');
      expect((box as HTMLInputElement).selectionStart).toBe(1);
      expect(box).toHaveAttribute('type', 'search');
      await user.keyboard('a');
      expect(screen.queryAllByRole('listbox', { name: 'Search' })).toHaveLength(
        1
      );
      expect(screen.getAllByRole('option').map(o => o.textContent)).toEqual([
        'Europe / France',
      ]);
      await user.clear(box);
      expect(lists()).toEqual(['City']);
      press('Escape');
      expect(onQueryChange).toHaveBeenLastCalledWith('');
    });

    it('offers parents with parentsSelectable, disables paths under a disabled node, and picks with Enter', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<City searchable parentsSelectable onChange={onChange} />);
      key(field(), 's');
      await user.keyboard('pa');
      expect(screen.getAllByRole('option').map(o => o.textContent)).toEqual([
        'Europe / Spain',
        'Europe / Spain / Madrid',
      ]);
      expect(screen.getAllByRole('option')[0]).toHaveAttribute(
        'aria-disabled',
        'true'
      );
      await user.clear(screen.getByRole('combobox', { name: 'Search' }));
      await user.keyboard('germ');
      await user.keyboard('{Enter}');
      expect(onChange).toHaveBeenCalledWith('germany');
      expect(dialog()).toBeNull();
    });

    it('matches labels in the LocaleProvider locale', async () => {
      const user = userEvent.setup();
      render(
        <LocaleProvider locale="fr">
          <Cascader
            label="City"
            searchable
            data={[
              { value: 'x', label: 'Café' },
              { value: 'y', label: 'Tea' },
            ]}
          />
        </LocaleProvider>
      );
      key(field(), 'c');
      await user.keyboard('afe');
      expect(screen.getAllByRole('option').map(o => o.textContent)).toEqual([
        'Café',
      ]);
    });

    it('takes a filter of the whole path, written inline without searching every render', () => {
      const calls: string[] = [];
      const props = {
        label: 'City',
        data: PLACES,
        searchable: true,
        defaultOpen: true,
      };
      const { rerender } = render(
        <Cascader
          {...props}
          query=" ber "
          filter={(query, item, path) => {
            calls.push(query);
            expect(path[path.length - 1]).toBe(item);
            return item.value.startsWith(query);
          }}
        />
      );
      expect(screen.getAllByRole('option').map(o => o.textContent)).toEqual([
        'Europe / Germany / Berlin',
      ]);
      const count = calls.length;
      rerender(<Cascader {...props} query=" ber " filter={() => false} />);
      expect(calls).toHaveLength(count);
      expect(calls[0]).toBe('ber');
    });

    it('opens the path of a pick from the search, behind it', async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const onExpandedChange = vi.fn();
      render(
        <City
          searchable
          closeOnSelect={false}
          onChange={onChange}
          onExpandedChange={onExpandedChange}
        />
      );
      key(field(), 'm');
      await user.keyboard('un');
      await user.click(option('Europe / Germany / Munich'));
      expect(onChange).toHaveBeenCalledWith('munich');
      expect(onExpandedChange).toHaveBeenLastCalledWith(['europe', 'germany']);
      await user.clear(screen.getByRole('combobox', { name: 'Search' }));
      expect(lists()).toEqual(['City', 'Europe', 'Germany']);
      expect(current()).toEqual(['Europe', 'Germany', 'Munich']);
      expect(selected()).toEqual(['Europe', 'Germany', 'Munich']);
    });

    it('keeps Enter from submitting when the only match is under a disabled node', () => {
      const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <City searchable />
        </form>
      );
      key(field(), 'm');
      const box = screen.getByRole('combobox', { name: 'Search' });
      fireEvent.change(box, { target: { value: 'madrid' } });
      expect(option('Europe / Spain / Madrid')).toHaveAttribute(
        'aria-disabled',
        'true'
      );
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      box.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    });

    it('shows empty when nothing matches, keeps Enter from submitting, and announces it once', () => {
      vi.useFakeTimers();
      try {
        const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
        render(
          <form onSubmit={onSubmit}>
            <City searchable empty="No cities match" />
          </form>
        );
        key(field(), 'z');
        const box = screen.getByRole('combobox', { name: 'Search' });
        fireEvent.change(box, { target: { value: 'zz' } });
        expect(screen.getByText('No cities match')).toBeInTheDocument();
        const event = new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        });
        box.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
        act(() => {
          vi.advanceTimersByTime(announceDelay);
        });
        expect(
          screen
            .getAllByRole('status')
            .map(el => el.textContent)
            .filter(Boolean)
        ).toEqual(['No cities match']);
      } finally {
        vi.useRealTimers();
      }
    });

    it('shows nothing when nothing matches without empty, and starts from defaultQuery', () => {
      render(<City searchable defaultQuery="zz" defaultOpen />);
      expect(screen.queryAllByRole('listbox')).toEqual([]);
      expect(screen.queryAllByRole('option')).toEqual([]);
    });

    it("doesn't open on a printable key without a search box", () => {
      render(<City />);
      key(field(), 'b');
      expect(dialog()).toBeNull();
    });
  });

  describe('lazy columns', () => {
    const lazy = (extra: Partial<TreeItemData>): TreeItemData[] => [
      { value: 'photos', label: 'Photos', hasChildren: true, ...extra },
    ];

    it('loads a column through onExpandedChange, with a loading row and the announcements', () => {
      vi.useFakeTimers();
      try {
        const onExpandedChange = vi.fn();
        const props = {
          label: 'City',
          onExpandedChange,
          labels: {
            loading: 'Fetching…',
            loadingAnnouncement: (name: string) => `Fetching ${name}`,
            loadedAnnouncement: (name: string) => `${name} fetched`,
          },
        };
        const { rerender } = render(<Cascader {...props} data={lazy({})} />);
        open();
        press('ArrowRight');
        expect(onExpandedChange).toHaveBeenLastCalledWith(['photos']);
        rerender(<Cascader {...props} data={lazy({ isLoading: true })} />);
        expect(option('Fetching…')).toHaveAttribute('aria-disabled', 'true');
        act(() => {
          vi.advanceTimersByTime(announceDelay);
        });
        const said = () =>
          screen
            .getAllByRole('status')
            .flatMap(el => Array.from(el.children, c => c.textContent));
        expect(said()).toContain('Fetching Photos');
        rerender(
          <Cascader
            {...props}
            data={lazy({ children: [{ value: 'summer', label: 'Summer' }] })}
          />
        );
        act(() => {
          vi.advanceTimersByTime(announceDelay);
        });
        expect(said()).toContain('Photos fetched');
        expect(option('Summer')).toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });

    it('shows a failed load with Retry, which Enter and a click run, and reads the message out', () => {
      vi.useFakeTimers();
      try {
        const onRetry = vi.fn();
        render(
          <Cascader
            label="City"
            labels={{ retry: 'Again' }}
            data={lazy({ loadError: "Couldn't load Photos", onRetry })}
            defaultExpanded={['photos']}
            defaultOpen
          />
        );
        const row = option("Couldn't load Photos Again");
        fireEvent.click(row);
        row.focus();
        press('Enter');
        expect(onRetry).toHaveBeenCalledTimes(2);
        act(() => {
          vi.advanceTimersByTime(announceDelay);
        });
        expect(
          screen
            .getAllByRole('status')
            .map(el => el.textContent)
            .join('')
        ).toContain("Couldn't load Photos");
      } finally {
        vi.useRealTimers();
      }
    });

    it('ends a column that has items with a loading row, for the rest', () => {
      render(
        <Cascader
          label="City"
          data={lazy({
            isLoading: true,
            children: [{ value: 'summer', label: 'Summer' }],
          })}
          defaultExpanded={['photos']}
          defaultOpen
        />
      );
      expect(option('Summer')).toHaveAttribute('tabindex', '0');
      expect(option('Loading…')).toHaveAttribute('tabindex', '-1');
    });

    it('a failed load with no onRetry is disabled, and Right on it goes nowhere', () => {
      render(
        <Cascader
          label="City"
          data={lazy({ loadError: 'Failed' })}
          defaultExpanded={['photos']}
          defaultOpen
        />
      );
      expect(option('Failed')).toHaveAttribute('aria-disabled', 'true');
      fireEvent.click(option('Failed'));
      option('Failed').focus();
      press('ArrowRight');
      expect(option('Failed')).toHaveFocus();
      expect(lists()).toEqual(['City', 'Photos']);
    });

    it("hands focus on to the column's tab stop when a focused load row leaves", () => {
      const props = {
        label: 'City',
        defaultExpanded: ['photos'],
        defaultOpen: true,
      };
      const { rerender } = render(
        <Cascader
          {...props}
          data={lazy({ loadError: 'Failed', onRetry: () => {} })}
        />
      );
      option('Failed Retry').focus();
      rerender(
        <Cascader
          {...props}
          data={lazy({ children: [{ value: 'summer', label: 'Summer' }] })}
        />
      );
      expect(option('Summer')).toHaveFocus();
    });

    it('hands focus on from a focused load row inside a shadow root too', () => {
      const host = document.createElement('div');
      document.body.append(host);
      const container = document.createElement('div');
      host.attachShadow({ mode: 'open' }).append(container);
      const props = {
        label: 'City',
        defaultExpanded: ['photos'],
        defaultOpen: true,
      };
      const { rerender, unmount } = render(
        <Cascader
          {...props}
          data={lazy({ loadError: 'Failed', onRetry: () => {} })}
        />,
        { container }
      );
      const inShadow = within(container);
      inShadow.getByRole('option', { name: 'Failed Retry' }).focus();
      rerender(
        <Cascader
          {...props}
          data={lazy({ children: [{ value: 'summer', label: 'Summer' }] })}
        />
      );
      expect(host.shadowRoot!.activeElement).toBe(
        inShadow.getByRole('option', { name: 'Summer' })
      );
      unmount();
      host.remove();
    });
  });

  describe('forms', () => {
    it('posts one hidden input, empty while nothing is picked', () => {
      const { container, rerender } = render(<City name="city" form="f" />);
      const hidden = () =>
        Array.from(
          container.querySelectorAll<HTMLInputElement>('input[type="hidden"]'),
          el => [el.name, el.value, el.getAttribute('form')]
        );
      expect(hidden()).toEqual([['city', '', 'f']]);
      rerender(<City name="city" form="f" value="berlin" />);
      expect(hidden()).toEqual([['city', 'berlin', 'f']]);
    });

    it('is aria-required, with a hidden required field', () => {
      const { container } = render(<City required />);
      expect(field()).toHaveAttribute('aria-required', 'true');
      expect(
        container.querySelector<HTMLInputElement>('input[required]')!.validity
          .valueMissing
      ).toBe(true);
    });

    it('is disabled by disabled or a disabled Fieldset', () => {
      const { container, unmount } = render(
        <City disabled name="city" defaultValue="berlin" />
      );
      expect(field()).toBeDisabled();
      expect(container.querySelector('input[type="hidden"]')).toBeDisabled();
      unmount();
      render(
        <Fieldset legend="Where" disabled>
          <City />
        </Fieldset>
      );
      expect(field()).toBeDisabled();
    });

    it('goes back to defaultValue on a reset of its form, and reports a held value empty', () => {
      vi.useFakeTimers();
      try {
        const onChange = vi.fn();
        const { rerender } = render(
          <form data-testid="form">
            <City defaultValue="berlin" onChange={onChange} />
          </form>
        );
        const reset = () =>
          act(() => {
            (screen.getByTestId('form') as HTMLFormElement).reset();
            vi.runAllTimers();
          });
        reset();
        expect(onChange).not.toHaveBeenCalled();
        open();
        fireEvent.click(option('Munich'));
        reset();
        expect(onChange).toHaveBeenLastCalledWith('berlin');
        expect(field()).toHaveValue('Europe / Germany / Berlin');
        rerender(
          <form data-testid="form">
            <City value="munich" onChange={onChange} />
          </form>
        );
        reset();
        expect(onChange).toHaveBeenLastCalledWith(null);
      } finally {
        vi.useRealTimers();
      }
    });

    it('goes back to nothing on a reset without defaultValue', () => {
      vi.useFakeTimers();
      try {
        const onChange = vi.fn();
        render(
          <form data-testid="form">
            <City onChange={onChange} />
          </form>
        );
        open();
        fireEvent.click(option('Oceania'));
        act(() => {
          (screen.getByTestId('form') as HTMLFormElement).reset();
          vi.runAllTimers();
        });
        expect(onChange).toHaveBeenLastCalledWith(null);
        expect(field()).toHaveValue('');
      } finally {
        vi.useRealTimers();
      }
    });

    it('clears with clearable, onto the field', () => {
      const onChange = vi.fn();
      render(
        <City
          defaultValue="berlin"
          clearable
          onChange={onChange}
          labels={{ clear: 'Empty' }}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Empty' }));
      expect(onChange).toHaveBeenCalledWith(null);
      expect(field()).toHaveFocus();
      expect(field()).toHaveValue('');
    });
  });

  it('applies classPrefix from ConfigProvider everywhere', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bestax-">
        <City defaultValue="berlin" clearable size="small" searchable />
      </ConfigProvider>
    );
    expect(container.querySelector('.bestax-cascader')).toHaveClass(
      'bestax-has-clear'
    );
    expect(container.querySelector('.cascader')).toBeNull();
    expect(container.querySelector('.bestax-cascader-chevron')).not.toBeNull();
    open();
    const panel = screen.getByRole('dialog');
    expect(panel).toHaveClass(
      'bestax-picker-popover',
      'bestax-cascader-panel',
      'bestax-is-small'
    );
    expect(panel.querySelector('.bestax-cascader-columns')).not.toBeNull();
    expect(panel.querySelector('.bestax-cascader-column')).not.toBeNull();
    expect(option('Berlin')).toHaveClass(
      'bestax-dropdown-item',
      'bestax-cascader-item',
      'bestax-is-active',
      'bestax-is-checked'
    );
    expect(option('Hamburg')).toHaveClass('bestax-is-disabled');
    expect(panel.querySelector('.bestax-cascader-item-chevron')).not.toBeNull();
    expect(panel.querySelector('.bestax-cascader-search')).not.toBeNull();
    fireEvent.click(
      option('Germany').querySelector('.bestax-cascader-item-chevron')!
    );
    expect(lists()).toEqual(['City', 'Europe', 'Germany']);
  });

  it('draws the load rows under classPrefix', () => {
    render(
      <ConfigProvider classPrefix="bestax-">
        <Cascader
          label="City"
          data={[
            { value: 'p', label: 'P', hasChildren: true, isLoading: true },
          ]}
          defaultExpanded={['p']}
          defaultOpen
        />
      </ConfigProvider>
    );
    const row = option('Loading…');
    expect(row).toHaveClass('bestax-cascader-status', 'bestax-is-disabled');
    expect(within(row).getByText('Loading…')).toHaveClass(
      'bestax-cascader-label'
    );
    expect(row.querySelector('.bestax-loader')).not.toBeNull();
  });

  it('renders its field and path on the server, without the panel', () => {
    const html = renderToString(<City defaultValue="berlin" name="city" />);
    expect(html).toContain('value="Europe / Germany / Berlin"');
    expect(html).toContain('value="berlin"');
    expect(html).not.toContain('role="dialog"');
  });
});
