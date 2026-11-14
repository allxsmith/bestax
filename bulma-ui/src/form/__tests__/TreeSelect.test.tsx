import type { MockInstance } from 'vitest';
import React, { createRef, useState } from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import {
  TreeSelect,
  type TreeItemData,
  type TreeSelectProps,
} from '../TreeSelect';
import { Field } from '../Field';
import { Control } from '../Control';
import { Fieldset } from '../Fieldset';
import { ConfigProvider } from '../../helpers/Config';
import { LocaleProvider } from '../../helpers/LocaleProvider';
import { resetDevWarnings } from '../../helpers/devWarnings';
import { announceDelay } from '../../helpers/statusRegion';

const PLACES: TreeItemData[] = [
  {
    value: 'asia',
    label: 'Asia',
    children: [
      {
        value: 'japan',
        label: 'Japan',
        children: [
          { value: 'tokyo', label: 'Tokyo' },
          { value: 'osaka', label: 'Osaka' },
        ],
      },
      { value: 'china', label: 'China', disabled: true },
    ],
  },
  {
    value: 'europe',
    label: 'Europe',
    children: [
      { value: 'france', label: 'France' },
      { value: 'germany', label: 'Germany' },
    ],
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

const field = () => screen.getByRole('combobox');
const dialog = () => screen.queryByRole('dialog');
const item = (name: string) => screen.getByRole('treeitem', { name });
const shownItems = () =>
  screen
    .queryAllByRole('treeitem')
    .map(el => el.querySelector(':scope > div > [id]')!.textContent);
const open = () => fireEvent.click(field());
const key = (el: Element, k: string, init: KeyboardEventInit = {}) =>
  fireEvent.keyDown(el, { key: k, ...init });

/** A TreeSelect whose value is held by the test, as an app holds it. */
function Held({
  start,
  ...rest
}: TreeSelectProps & { start?: string[] | string | null }) {
  const [value, setValue] = useState<unknown>(start ?? null);
  const props = {
    ...rest,
    value,
    onChange: (next: unknown) => {
      setValue(next);
      (rest.onChange as ((v: unknown) => void) | undefined)?.(next);
    },
  } as TreeSelectProps;
  return (
    <>
      <TreeSelect {...props} />
      <output>{JSON.stringify(value)}</output>
    </>
  );
}

describe('TreeSelect', () => {
  describe('the field', () => {
    it('is a read-only combobox that opens a dialog, named by its label', () => {
      const { container } = render(<TreeSelect label="Place" data={PLACES} />);
      const input = screen.getByRole('combobox', { name: 'Place' });
      expect(input).toHaveAttribute('readonly');
      expect(input).toHaveAttribute('aria-haspopup', 'dialog');
      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(input).not.toHaveAttribute('aria-controls');
      expect(input).toHaveClass('input');
      expect(input).toHaveValue('');
      expect(
        container.querySelector('.field > div.tree-select')
      ).not.toBeNull();
      expect(input.closest('.control')?.parentElement).toHaveClass(
        'tree-select'
      );
      expect(
        container.querySelector('.tree-select-chevron .icon')
      ).toBeInTheDocument();
      expect(dialog()).toBeNull();
    });

    it("shows the picked item's label, never its path", () => {
      render(<TreeSelect label="Place" data={PLACES} defaultValue="tokyo" />);
      expect(field()).toHaveValue('Tokyo');
    });

    it('takes a placeholder, the colour, size and rounding modifiers', () => {
      const { container } = render(
        <TreeSelect
          aria-label="Place"
          data={PLACES}
          placeholder="Pick a place"
          color="primary"
          size="small"
          isRounded
        />
      );
      expect(field()).toHaveAttribute('placeholder', 'Pick a place');
      expect(field()).toHaveClass('is-primary', 'is-small', 'is-rounded');
      expect(container.querySelector('.control')).toHaveClass('is-small');
    });

    it('puts the helper props and other attributes on the root, and the ref on the field', () => {
      const ref = createRef<HTMLInputElement>();
      const { container } = render(
        <TreeSelect
          ref={ref}
          aria-label="Place"
          data={PLACES}
          className="mine"
          data-testid="root"
          mt="3"
        />
      );
      const root = screen.getByTestId('root');
      expect(root).toHaveClass('tree-select', 'mine', 'mt-3');
      expect(ref.current).toBe(field());
      expect(container.querySelector('.field')).not.toBeNull();
    });

    it('takes a ref callback', () => {
      let node: HTMLInputElement | null = null;
      render(
        <TreeSelect
          ref={el => {
            node = el;
          }}
          aria-label="Place"
          data={PLACES}
        />
      );
      expect(node).toBe(field());
    });

    it("runs a callback ref's cleanup on detach in place of a call with null, and calls one without a cleanup with null", () => {
      const cleanup = vi.fn();
      const withCleanup = vi.fn(() => cleanup);
      const { unmount } = render(
        <TreeSelect label="Place" data={PLACES} ref={withCleanup} />
      );
      expect(withCleanup).toHaveBeenCalledWith(field());
      unmount();
      expect(cleanup).toHaveBeenCalledTimes(1);
      expect(withCleanup).not.toHaveBeenCalledWith(null);
      const plain = vi.fn();
      const { unmount: unmountPlain } = render(
        <TreeSelect label="Place" data={PLACES} ref={plain} />
      );
      unmountPlain();
      expect(plain).toHaveBeenLastCalledWith(null);
    });

    it('puts id, aria-label, aria-labelledby and aria-describedby on the field', () => {
      render(
        <>
          <span id="named">Named</span>
          <span id="hint">Hint</span>
          <TreeSelect
            id="place"
            aria-labelledby="named"
            aria-describedby="hint"
            data={PLACES}
          />
        </>
      );
      expect(field()).toHaveAttribute('id', 'place');
      expect(field()).toHaveAccessibleName('Named');
      expect(field()).toHaveAttribute('aria-describedby', 'hint');
      open();
      expect(field()).toHaveAttribute('aria-controls', 'place-panel');
      expect(screen.getByRole('dialog', { name: 'Named' })).toHaveAttribute(
        'id',
        'place-panel'
      );
      expect(screen.getByRole('tree', { name: 'Named' })).toBeInTheDocument();
    });

    it('names the panel and the tree after an aria-label, or labels.choose', () => {
      const { unmount } = render(
        <TreeSelect aria-label="Place" data={PLACES} />
      );
      open();
      expect(screen.getByRole('dialog', { name: 'Place' })).toBeInTheDocument();
      expect(screen.getByRole('tree', { name: 'Place' })).toBeInTheDocument();
      unmount();
      render(
        <TreeSelect
          label="Place"
          labels={{ choose: 'Choose a place' }}
          data={PLACES}
        />
      );
      open();
      expect(
        screen.getByRole('dialog', { name: 'Choose a place' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('tree', { name: 'Choose a place' })
      ).toBeInTheDocument();
    });

    it("leaves the panel unnamed with nothing to name it, and TreeView's warning says so", () => {
      render(<TreeSelect data={PLACES} />);
      open();
      expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-label');
      expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-labelledby');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('<TreeView> has no accessible name')
      );
    });

    it('renders no Field of its own inside one, whose label names it and the panel', () => {
      const { container } = render(
        <Field label="Outer">
          <TreeSelect data={PLACES} />
        </Field>
      );
      expect(container.querySelectorAll('.field')).toHaveLength(1);
      expect(screen.getByRole('combobox', { name: 'Outer' })).toBeTruthy();
      open();
      expect(screen.getByRole('dialog', { name: 'Outer' })).toBeTruthy();
    });

    it("renders no Control of its own inside one, and keeps the caller's", () => {
      const { container } = render(
        <Control>
          <TreeSelect aria-label="Place" data={PLACES} />
        </Control>
      );
      expect(container.querySelectorAll('.control')).toHaveLength(1);
      expect(container.querySelector('.control > .tree-select')).not.toBeNull();
      expect(
        container.querySelector('.tree-select > input.input')
      ).not.toBeNull();
    });

    it('renders a message, coloured, and its own Field for horizontal and fieldClassName', () => {
      const { container } = render(
        <TreeSelect
          label="Place"
          data={PLACES}
          message="Where it goes"
          messageColor="danger"
          horizontal
          fieldClassName="my-field"
          labelSize="small"
        />
      );
      expect(container.querySelector('.field')).toHaveClass(
        'is-horizontal',
        'my-field'
      );
      expect(screen.getByText('Where it goes')).toHaveClass(
        'help',
        'is-danger'
      );
    });

    it('renders the message without a Field of its own inside an outer one', () => {
      render(
        <Field>
          <TreeSelect aria-label="Place" data={PLACES} message="Help" />
        </Field>
      );
      expect(screen.getByText('Help')).toHaveClass('help');
    });
  });

  describe('opening and closing', () => {
    it('opens on a click, and a second click closes it', () => {
      render(<TreeSelect label="Place" data={PLACES} />);
      open();
      expect(field()).toHaveAttribute('aria-expanded', 'true');
      const panel = screen.getByRole('dialog', { name: 'Place' });
      expect(panel).toHaveClass('picker-popover', 'tree-select-panel');
      expect(panel).toHaveAttribute('aria-modal', 'false');
      expect(field()).toHaveAttribute('aria-controls', panel.id);
      open();
      expect(dialog()).toBeNull();
    });

    it.each([
      ['Enter', {}],
      [' ', {}],
      ['ArrowDown', {}],
      ['ArrowDown', { altKey: true }],
    ])('opens on %j with %o', (k, init) => {
      render(<TreeSelect label="Place" data={PLACES} />);
      key(field(), k, init);
      expect(dialog()).not.toBeNull();
    });

    it('leaves other keys alone, and Alt+Up on a shut field', () => {
      const onOpenChange = vi.fn();
      render(
        <TreeSelect label="Place" data={PLACES} onOpenChange={onOpenChange} />
      );
      key(field(), 'ArrowUp', { altKey: true });
      key(field(), 'Enter', { ctrlKey: true });
      key(field(), 'a');
      key(field(), 'Tab');
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(dialog()).toBeNull();
    });

    it('focuses the picked item, its branch opened, and reports the branch', () => {
      const onExpandedChange = vi.fn();
      render(
        <TreeSelect
          label="Place"
          data={PLACES}
          defaultValue="tokyo"
          defaultExpanded={['europe']}
          onExpandedChange={onExpandedChange}
        />
      );
      open();
      expect(onExpandedChange).toHaveBeenCalledWith([
        'europe',
        'asia',
        'japan',
      ]);
      expect(item('Tokyo')).toHaveFocus();
      expect(item('Tokyo')).toHaveAttribute('aria-selected', 'true');
    });

    it("doesn't report the branch when it's open already", () => {
      const onExpandedChange = vi.fn();
      render(
        <TreeSelect
          label="Place"
          data={PLACES}
          defaultValue="tokyo"
          defaultExpanded={['asia', 'japan']}
          onExpandedChange={onExpandedChange}
        />
      );
      open();
      expect(onExpandedChange).not.toHaveBeenCalled();
      expect(item('Tokyo')).toHaveFocus();
    });

    it('focuses the first item with nothing picked', () => {
      render(<TreeSelect label="Place" data={PLACES} />);
      open();
      expect(item('Asia')).toHaveFocus();
    });

    it("focuses the first item when held branches don't show the picked one", () => {
      render(
        <TreeSelect
          label="Place"
          data={PLACES}
          defaultValue="tokyo"
          expanded={[]}
        />
      );
      open();
      expect(item('Asia')).toHaveFocus();
      expect(screen.queryByRole('treeitem', { name: 'Tokyo' })).toBeNull();
    });

    it('closes on Escape and Alt+Up, and puts focus back on the field', () => {
      render(<TreeSelect label="Place" data={PLACES} />);
      open();
      key(item('Asia'), 'Escape');
      expect(dialog()).toBeNull();
      expect(field()).toHaveFocus();
      open();
      key(item('Asia'), 'ArrowUp', { altKey: true });
      expect(dialog()).toBeNull();
      expect(field()).toHaveFocus();
    });

    it('closes on a press outside', () => {
      render(
        <>
          <button>Outside</button>
          <TreeSelect label="Place" data={PLACES} />
        </>
      );
      open();
      fireEvent.pointerDown(screen.getByRole('button', { name: 'Outside' }));
      expect(dialog()).toBeNull();
    });

    it('holds Tab inside the panel, wrapping between the search box and the tree, as the pickers do', async () => {
      const user = userEvent.setup();
      render(
        <>
          <button>Before</button>
          <TreeSelect label="Place" data={PLACES} searchable />
          <button>Next</button>
        </>
      );
      open();
      expect(screen.getByRole('searchbox')).toHaveFocus();
      await user.tab();
      expect(item('Asia')).toHaveFocus();
      await user.tab();
      expect(screen.getByRole('searchbox')).toHaveFocus();
      await user.tab({ shift: true });
      expect(item('Asia')).toHaveFocus();
      expect(dialog()).not.toBeNull();
    });

    it('keeps Tab on the tree when it is the only stop', async () => {
      const user = userEvent.setup();
      render(
        <>
          <TreeSelect label="Place" data={PLACES} />
          <button>Next</button>
        </>
      );
      open();
      await user.tab();
      expect(item('Asia')).toHaveFocus();
      expect(dialog()).not.toBeNull();
    });

    it('reports opening and closing, and holds them when controlled', () => {
      const onOpenChange = vi.fn();
      const { rerender } = render(
        <TreeSelect
          label="Place"
          data={PLACES}
          open={false}
          onOpenChange={onOpenChange}
        />
      );
      open();
      expect(onOpenChange).toHaveBeenLastCalledWith(true);
      expect(dialog()).toBeNull();
      rerender(
        <TreeSelect
          label="Place"
          data={PLACES}
          open
          onOpenChange={onOpenChange}
        />
      );
      expect(dialog()).not.toBeNull();
      open();
      expect(onOpenChange).toHaveBeenLastCalledWith(false);
      expect(dialog()).not.toBeNull();
    });

    it('opens to begin with under defaultOpen', () => {
      render(<TreeSelect label="Place" data={PLACES} defaultOpen />);
      expect(dialog()).not.toBeNull();
    });

    it('portals the panel with appendToBody, at least as wide as the field', () => {
      const { container } = render(
        <TreeSelect label="Place" data={PLACES} appendToBody />
      );
      open();
      const panel = screen.getByRole('dialog');
      expect(container.contains(panel)).toBe(false);
      expect(panel).toHaveClass('is-portal');
      expect(panel.style.position).toBe('fixed');
      expect(panel.style.minWidth).not.toBe('');
    });

    it('passes the size to the panel and the tree', () => {
      render(<TreeSelect label="Place" data={PLACES} size="large" />);
      open();
      expect(screen.getByRole('dialog')).toHaveClass('is-large');
      expect(screen.getByRole('tree')).toHaveClass('is-large');
    });
  });

  describe("'single'", () => {
    it.each(['Enter', ' '])(
      'picks with %j, closes and puts focus on the field',
      k => {
        const onChange = vi.fn();
        render(<Held label="Place" data={PLACES} onChange={onChange} />);
        open();
        key(item('Asia'), 'ArrowDown');
        key(screen.getAllByRole('treeitem')[0], k);
        expect(onChange).toHaveBeenCalledWith('asia');
        expect(dialog()).toBeNull();
        expect(field()).toHaveFocus();
        expect(field()).toHaveValue('Asia');
      }
    );

    it('picks with a click on a row, a parent included', () => {
      const onChange = vi.fn();
      render(<TreeSelect label="Place" data={PLACES} onChange={onChange} />);
      open();
      fireEvent.click(item('Europe'));
      expect(onChange).toHaveBeenCalledWith('europe');
      expect(field()).toHaveValue('Europe');
      expect(dialog()).toBeNull();
    });

    it("only opens a parent from its chevron, and doesn't pick from an item inside", () => {
      const onChange = vi.fn();
      const { container } = render(
        <TreeSelect label="Place" data={PLACES} onChange={onChange} />
      );
      open();
      const chevron = item('Asia').querySelector('.tree-view-toggle')!;
      fireEvent.click(chevron);
      expect(onChange).not.toHaveBeenCalled();
      expect(item('Asia')).toHaveAttribute('aria-expanded', 'true');
      fireEvent.click(within(item('Asia')).getByText('China'));
      expect(onChange).not.toHaveBeenCalled();
      expect(container.querySelector('.tree-view-toggle')).not.toBeNull();
      fireEvent.click(within(item('Asia')).getByText('Japan'));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('japan');
    });

    it("never picks a disabled item, and a leaf's chevron box picks it", () => {
      const onChange = vi.fn();
      render(
        <TreeSelect
          label="Place"
          data={PLACES}
          defaultExpanded={['asia']}
          onChange={onChange}
        />
      );
      open();
      key(item('China'), 'Enter');
      fireEvent.click(item('China'));
      expect(onChange).not.toHaveBeenCalled();
      fireEvent.click(item('Oceania').querySelector('.tree-view-toggle')!);
      expect(onChange).toHaveBeenCalledWith('oceania');
    });

    it('closes on a pick of the picked item, with no change', () => {
      const onChange = vi.fn();
      render(
        <TreeSelect
          label="Place"
          data={PLACES}
          defaultValue="oceania"
          onChange={onChange}
        />
      );
      open();
      expect(item('Oceania')).toHaveFocus();
      key(item('Oceania'), 'Enter');
      expect(onChange).not.toHaveBeenCalled();
      expect(dialog()).toBeNull();
    });

    it('stays open with closeOnSelect={false}', () => {
      const onChange = vi.fn();
      render(
        <TreeSelect
          label="Place"
          data={PLACES}
          closeOnSelect={false}
          onChange={onChange}
        />
      );
      open();
      key(item('Oceania'), 'Enter');
      expect(onChange).toHaveBeenCalledWith('oceania');
      expect(dialog()).not.toBeNull();
      expect(item('Oceania')).toHaveAttribute('aria-selected', 'true');
    });

    it('leaves held keys, modifiers, other keys and keys from inside to the tree', () => {
      const onChange = vi.fn();
      render(
        <TreeSelect
          label="Place"
          data={PLACES}
          defaultExpanded={['europe']}
          onChange={onChange}
        />
      );
      open();
      key(item('Oceania'), 'Enter', { repeat: true });
      key(item('Oceania'), 'Enter', { altKey: true });
      key(item('Oceania'), 'Enter', { ctrlKey: true });
      key(item('Oceania'), 'Enter', { metaKey: true });
      key(item('Oceania'), 'Home');
      // From France, a key on Europe's own handler is France's.
      key(item('France'), 'x');
      expect(onChange).not.toHaveBeenCalled();
      expect(dialog()).not.toBeNull();
    });

    it('opens and closes a parent instead with parentsSelectable={false}', () => {
      const onChange = vi.fn();
      render(
        <TreeSelect
          label="Place"
          data={PLACES}
          parentsSelectable={false}
          onChange={onChange}
        />
      );
      open();
      key(item('Asia'), 'Enter');
      expect(item('Asia')).toHaveAttribute('aria-expanded', 'true');
      key(item('Asia'), ' ');
      expect(item('Asia')).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(item('Europe'));
      expect(item('Europe')).toHaveAttribute('aria-expanded', 'true');
      expect(onChange).not.toHaveBeenCalled();
      expect(dialog()).not.toBeNull();
      fireEvent.click(item('France'));
      expect(onChange).toHaveBeenCalledWith('france');
    });

    it('leaves a disabled parent alone with parentsSelectable={false}', () => {
      const data: TreeItemData[] = [
        {
          value: 'a',
          label: 'A',
          disabled: true,
          children: [{ value: 'b', label: 'B' }],
        },
      ];
      render(<TreeSelect label="L" data={data} parentsSelectable={false} />);
      open();
      key(item('A'), 'Enter');
      expect(item('A')).toHaveAttribute('aria-expanded', 'false');
    });

    it('posts one hidden input, empty while nothing is picked', () => {
      const { container, rerender } = render(
        <TreeSelect label="Place" data={PLACES} name="place" form="f" />
      );
      const hidden = () =>
        Array.from(
          container.querySelectorAll<HTMLInputElement>('input[type="hidden"]')
        ).map(el => [el.name, el.value, el.getAttribute('form')]);
      expect(hidden()).toEqual([['place', '', 'f']]);
      rerender(
        <TreeSelect
          label="Place"
          data={PLACES}
          name="place"
          form="f"
          value="tokyo"
        />
      );
      expect(hidden()).toEqual([['place', 'tokyo', 'f']]);
    });

    it('holds a controlled value', () => {
      const onChange = vi.fn();
      render(
        <TreeSelect
          label="Place"
          data={PLACES}
          value="tokyo"
          onChange={onChange}
        />
      );
      open();
      fireEvent.click(item('Osaka'));
      expect(onChange).toHaveBeenCalledWith('osaka');
      expect(field()).toHaveValue('Tokyo');
    });
  });

  describe('the checkbox modes', () => {
    it("'checkbox' cascades, stays open, and reports the leaves by default", () => {
      const onChange = vi.fn();
      render(
        <TreeSelect
          label="Places"
          data={PLACES}
          selectionMode="checkbox"
          onChange={onChange}
        />
      );
      open();
      expect(screen.getByRole('tree')).toHaveAttribute(
        'aria-multiselectable',
        'true'
      );
      key(item('Asia'), ' ');
      expect(onChange).toHaveBeenLastCalledWith(['tokyo', 'osaka']);
      expect(item('Asia')).toHaveAttribute('aria-checked', 'true');
      expect(dialog()).not.toBeNull();
      expect(field()).toHaveValue('');
    });

    it.each([
      ['parent', ['asia']],
      ['all', ['asia', 'japan', 'tokyo', 'osaka']],
      ['child', ['tokyo', 'osaka']],
    ] as const)(
      "checkedStrategy '%s' gives %j, and checks the same boxes passed back",
      (strategy, expected) => {
        const onChange = vi.fn();
        const { unmount } = render(
          <TreeSelect
            label="Places"
            data={PLACES}
            selectionMode="checkbox"
            checkedStrategy={strategy}
            onChange={onChange}
          />
        );
        open();
        fireEvent.click(item('Asia'));
        expect(onChange).toHaveBeenLastCalledWith(expected);
        unmount();
        render(
          <TreeSelect
            label="Places"
            data={PLACES}
            selectionMode="checkbox"
            checkedStrategy={strategy}
            value={[...expected]}
            defaultExpanded={['asia', 'japan']}
          />
        );
        open();
        expect(item('Asia')).toHaveAttribute('aria-checked', 'true');
        expect(item('Japan')).toHaveAttribute('aria-checked', 'true');
        expect(item('Tokyo')).toHaveAttribute('aria-checked', 'true');
        expect(item('China')).toHaveAttribute('aria-checked', 'false');
      }
    );

    it('shows the value as it is held as tags under the field, which describe it', () => {
      const { container } = render(
        <TreeSelect
          label="Places"
          data={PLACES}
          selectionMode="checkbox"
          defaultValue={['japan', 'france']}
        />
      );
      const tags = Array.from(container.querySelectorAll('.tags .tag'));
      expect(tags.map(tag => tag.textContent)).toEqual(['Japan', 'France']);
      const described = field()
        .getAttribute('aria-describedby')!
        .split(' ')
        .map(id => document.getElementById(id)!.textContent);
      expect(described).toEqual(['Japan', 'France']);
      expect(container.querySelector('.tree-select')!.nextElementSibling).toBe(
        container.querySelector('.tags')
      );
    });

    it("a tag's button unchecks its item as its box does, and focuses the field", () => {
      render(
        <Held
          label="Places"
          data={PLACES}
          selectionMode="checkbox"
          checkedStrategy="parent"
          start={['asia']}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Remove Asia' }));
      expect(screen.getByRole('status', { hidden: true })).toBeTruthy();
      expect(screen.getByText('[]')).toBeInTheDocument();
      expect(field()).toHaveFocus();
    });

    it("a tag's button in 'child' leaves its siblings checked", () => {
      render(
        <Held
          label="Places"
          data={PLACES}
          selectionMode="checkbox"
          start={['tokyo', 'osaka']}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Remove Tokyo' }));
      expect(screen.getByText('["osaka"]')).toBeInTheDocument();
    });

    it('names the buttons with ariaCloseLabel, described by their tags', () => {
      render(
        <TreeSelect
          label="Places"
          data={PLACES}
          selectionMode="checkbox"
          defaultValue={['tokyo']}
          ariaCloseLabel="Take off"
        />
      );
      const button = screen.getByRole('button', { name: 'Take off' });
      expect(button).toHaveAccessibleDescription('Tokyo');
    });

    it('keeps a checked disabled item in every list, with a tag but no button', () => {
      const onChange = vi.fn();
      render(
        <TreeSelect
          label="Places"
          data={PLACES}
          selectionMode="checkbox"
          checkedStrategy="parent"
          defaultValue={['china', 'tokyo']}
          onChange={onChange}
        />
      );
      expect(screen.queryByRole('button', { name: 'Remove China' })).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'Remove Tokyo' }));
      expect(onChange).toHaveBeenLastCalledWith(['china']);
    });

    it("'checkbox-independent' checks an item alone and reports exactly the checked items", () => {
      const onChange = vi.fn();
      const { container } = render(
        <TreeSelect
          label="Categories"
          data={PLACES}
          selectionMode="checkbox-independent"
          defaultValue={['europe', 'europe']}
          defaultExpanded={['asia']}
          onChange={onChange}
          name="categories"
        />
      );
      expect(
        Array.from(container.querySelectorAll('.tag'), t => t.textContent)
      ).toEqual(['Europe']);
      open();
      fireEvent.click(item('Asia'));
      expect(onChange).toHaveBeenLastCalledWith(['europe', 'europe', 'asia']);
      expect(item('Asia')).toHaveAttribute('aria-checked', 'true');
      expect(item('Japan')).toHaveAttribute('aria-checked', 'false');
      fireEvent.click(screen.getByRole('button', { name: 'Remove Asia' }));
      expect(onChange).toHaveBeenLastCalledWith(['europe', 'europe']);
      expect(
        Array.from(
          container.querySelectorAll<HTMLInputElement>('input[type="hidden"]'),
          el => el.value
        )
      ).toEqual(['europe']);
    });

    it('posts a hidden input per value in the list', () => {
      const { container } = render(
        <TreeSelect
          label="Places"
          data={PLACES}
          selectionMode="checkbox"
          defaultValue={['asia']}
          name="places"
        />
      );
      expect(
        Array.from(
          container.querySelectorAll<HTMLInputElement>('input[type="hidden"]'),
          el => `${el.name}=${el.value}`
        )
      ).toEqual(['places=asia']);
    });

    it('focuses the first checked item in the tree, its branch open', () => {
      render(
        <TreeSelect
          label="Places"
          data={PLACES}
          selectionMode="checkbox"
          defaultValue={['france', 'osaka']}
        />
      );
      open();
      expect(item('Osaka')).toHaveFocus();
      expect(item('Europe')).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('values no node has', () => {
    it('keeps one, shows it as it is, and warns once', () => {
      const { rerender } = render(
        <TreeSelect label="Place" data={PLACES} value="mars" />
      );
      expect(field()).toHaveValue('mars');
      rerender(<TreeSelect label="Place" data={PLACES} value="venus" />);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain('"mars"');
    });

    it('keeps them in a checked list, with tags that take them off', () => {
      const onChange = vi.fn();
      render(
        <TreeSelect
          label="Places"
          data={PLACES}
          selectionMode="checkbox"
          defaultValue={['mars', 'tokyo']}
          onChange={onChange}
        />
      );
      open();
      fireEvent.click(item('Oceania'));
      expect(onChange).toHaveBeenLastCalledWith(['tokyo', 'oceania', 'mars']);
      fireEvent.click(screen.getByRole('button', { name: 'Remove mars' }));
      expect(onChange).toHaveBeenLastCalledWith(['tokyo', 'oceania']);
    });
  });

  describe('search', () => {
    it('focuses the search box on opening, named Search, and the picked item still shows', () => {
      render(
        <TreeSelect
          label="Place"
          data={PLACES}
          searchable
          defaultValue="tokyo"
        />
      );
      open();
      const box = screen.getByRole('searchbox', { name: 'Search' });
      expect(box).toHaveFocus();
      expect(box).toHaveClass('input', 'tree-select-search');
      expect(item('Tokyo')).toBeInTheDocument();
    });

    it('keeps the ancestors of a match and what is under it, and opens the branches', async () => {
      const user = userEvent.setup();
      render(<TreeSelect label="Place" data={PLACES} searchable />);
      open();
      await user.keyboard('japan');
      expect(shownItems()).toEqual(['Asia', 'Japan']);
      expect(item('Japan')).toHaveAttribute('aria-expanded', 'false');
      key(item('Japan'), 'ArrowRight');
      expect(shownItems()).toEqual(['Asia', 'Japan', 'Tokyo', 'Osaka']);
      await user.clear(screen.getByRole('searchbox'));
      await user.keyboard('o');
      expect(shownItems()).toEqual([
        'Asia',
        'Japan',
        'Tokyo',
        'Osaka',
        'Europe',
        'Oceania',
      ]);
    });

    it("puts the branches back as they were once it's cleared, keeping ones opened during it", async () => {
      const onExpandedChange = vi.fn();
      const user = userEvent.setup();
      render(
        <TreeSelect
          label="Place"
          data={PLACES}
          searchable
          onExpandedChange={onExpandedChange}
        />
      );
      open();
      await user.keyboard('fra');
      expect(shownItems()).toEqual(['Europe', 'France']);
      expect(onExpandedChange).not.toHaveBeenCalled();
      await user.clear(screen.getByRole('searchbox'));
      expect(shownItems()).toEqual(['Asia', 'Europe', 'Oceania']);
      await user.keyboard('tokyo');
      key(item('Japan'), 'ArrowLeft');
      expect(shownItems()).toEqual(['Asia', 'Japan']);
      key(item('Asia'), 'ArrowLeft');
      expect(shownItems()).toEqual(['Asia']);
      key(item('Asia'), 'ArrowRight');
      expect(onExpandedChange).toHaveBeenLastCalledWith(['asia']);
      await user.clear(screen.getByRole('searchbox'));
      expect(shownItems()).toEqual([
        'Asia',
        'Japan',
        'China',
        'Europe',
        'Oceania',
      ]);
    });

    it('closes a branch opened before the search', async () => {
      const onExpandedChange = vi.fn();
      const user = userEvent.setup();
      render(
        <TreeSelect
          label="Place"
          data={PLACES}
          searchable
          defaultExpanded={['europe']}
          onExpandedChange={onExpandedChange}
        />
      );
      open();
      await user.keyboard('ger');
      key(item('Europe'), 'ArrowLeft');
      expect(onExpandedChange).toHaveBeenLastCalledWith([]);
      expect(shownItems()).toEqual(['Europe']);
    });

    it('matches labels in the LocaleProvider locale, and never values', async () => {
      const user = userEvent.setup();
      const data: TreeItemData[] = [
        { value: 'x1', label: 'Café' },
        { value: 'cafe-value', label: 'Tea' },
      ];
      render(
        <LocaleProvider locale="fr">
          <TreeSelect label="Drink" data={data} searchable />
        </LocaleProvider>
      );
      open();
      await user.keyboard('cafe');
      expect(shownItems()).toEqual(['Café']);
    });

    it('matches labels ignoring case outside a LocaleProvider, and by value with no label', async () => {
      const user = userEvent.setup();
      render(
        <TreeSelect
          label="Thing"
          data={[{ value: 'Alpha' }, { value: 'b', label: 'Beta' }]}
          searchable
        />
      );
      open();
      await user.keyboard('  ALP ');
      expect(shownItems()).toEqual(['Alpha']);
    });

    it('takes a filter of its own, with the text trimmed', async () => {
      const filter = vi.fn(
        (query: string, node: TreeItemData, path: TreeItemData[]) =>
          node.value === query && path[path.length - 1] === node
      );
      const user = userEvent.setup();
      render(
        <TreeSelect label="Place" data={PLACES} searchable filter={filter} />
      );
      open();
      await user.keyboard(' osaka ');
      expect(filter).toHaveBeenCalledWith('osaka', PLACES[2], [PLACES[2]]);
      const [asia] = PLACES;
      const japan = asia.children![0];
      const osaka = japan.children![1];
      expect(filter).toHaveBeenCalledWith('osaka', osaka, [asia, japan, osaka]);
      expect(shownItems()).toEqual(['Asia', 'Japan', 'Osaka']);
    });

    it('shows empty in place of the tree when nothing matches, or nothing without it', async () => {
      const user = userEvent.setup();
      const { container, unmount } = render(
        <TreeSelect
          label="Place"
          data={PLACES}
          searchable
          empty="No places match"
        />
      );
      open();
      await user.keyboard('zz');
      expect(screen.queryByRole('tree')).toBeNull();
      expect(
        container.ownerDocument.querySelector('.tree-select-empty')
      ).toHaveTextContent('No places match');
      unmount();
      render(<TreeSelect label="Place" data={PLACES} searchable />);
      open();
      await user.keyboard('zz');
      expect(screen.queryByRole('tree')).toBeNull();
      expect(document.querySelector('.tree-select-empty')).toBeNull();
    });

    it('moves into the tree with Down, onto its tab stop or its first item', async () => {
      const user = userEvent.setup();
      render(<TreeSelect label="Place" data={PLACES} searchable />);
      open();
      const box = screen.getByRole('searchbox');
      key(box, 'ArrowDown');
      expect(item('Asia')).toHaveFocus();
      key(item('Asia'), 'ArrowDown');
      box.focus();
      key(box, 'ArrowDown');
      expect(item('Europe')).toHaveFocus();
      box.focus();
      key(box, 'ArrowDown', { altKey: true });
      expect(box).toHaveFocus();
      await user.keyboard('zz');
      key(box, 'ArrowDown');
      expect(box).toHaveFocus();
    });

    it('keeps Enter in the search box from submitting a form', () => {
      const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
      render(
        <form onSubmit={onSubmit}>
          <TreeSelect label="Place" data={PLACES} searchable />
        </form>
      );
      open();
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      screen.getByRole('searchbox').dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
      key(screen.getByRole('searchbox'), 'a');
    });

    it('opens on a printable key with it in the box, its caret after it, and empties on closing', () => {
      const onQueryChange = vi.fn();
      render(
        <TreeSelect
          label="Place"
          data={PLACES}
          searchable
          onQueryChange={onQueryChange}
        />
      );
      key(field(), 'g');
      const box = screen.getByRole('searchbox') as HTMLInputElement;
      expect(box).toHaveValue('g');
      expect(box).toHaveFocus();
      expect(box.selectionStart).toBe(1);
      expect(shownItems()).toEqual(['Europe', 'Germany']);
      key(box, 'Escape');
      expect(onQueryChange.mock.calls).toEqual([['g'], ['']]);
      open();
      expect(screen.getByRole('searchbox')).toHaveValue('');
    });

    it("doesn't open on a printable key while composing, or without a search box", () => {
      const { unmount } = render(
        <TreeSelect label="Place" data={PLACES} searchable />
      );
      key(field(), 'g', { isComposing: true });
      expect(dialog()).toBeNull();
      unmount();
      render(<TreeSelect label="Place" data={PLACES} />);
      key(field(), 'g');
      expect(dialog()).toBeNull();
    });

    it('holds a controlled query', () => {
      const onQueryChange = vi.fn();
      render(
        <TreeSelect
          label="Place"
          data={PLACES}
          searchable
          query="ja"
          onQueryChange={onQueryChange}
          defaultOpen
        />
      );
      expect(shownItems()).toEqual(['Asia', 'Japan']);
      fireEvent.change(screen.getByRole('searchbox'), {
        target: { value: 'jap' },
      });
      expect(onQueryChange).toHaveBeenCalledWith('jap');
      expect(screen.getByRole('searchbox')).toHaveValue('ja');
    });

    it('starts from defaultQuery, and reads no query without searchable', () => {
      const { unmount } = render(
        <TreeSelect
          label="Place"
          data={PLACES}
          searchable
          defaultQuery="fr"
          defaultOpen
        />
      );
      expect(shownItems()).toEqual(['Europe', 'France']);
      unmount();
      render(<TreeSelect label="Place" data={PLACES} query="fr" defaultOpen />);
      expect(shownItems()).toEqual(['Asia', 'Europe', 'Oceania']);
    });

    it("in 'checkbox', a check during a search reaches the items it hides", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(
        <TreeSelect
          label="Places"
          data={PLACES}
          selectionMode="checkbox"
          searchable
          onChange={onChange}
        />
      );
      open();
      await user.keyboard('japan');
      expect(shownItems()).toEqual(['Asia', 'Japan']);
      fireEvent.click(item('Asia'));
      expect(onChange).toHaveBeenLastCalledWith(['tokyo', 'osaka']);
      await user.clear(screen.getByRole('searchbox'));
      await user.keyboard('tokyo');
      fireEvent.click(item('Tokyo'));
      expect(onChange).toHaveBeenLastCalledWith(['osaka']);
      expect(item('Asia')).toHaveAttribute('aria-checked', 'mixed');
    });
  });

  describe('announcing no matches', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('says empty once through the status region, not on every key', () => {
      render(
        <TreeSelect
          label="Place"
          data={PLACES}
          searchable
          empty="No places match"
        />
      );
      open();
      const box = screen.getByRole('searchbox');
      const region = () =>
        screen
          .getAllByRole('status')
          .find(el => el.textContent !== '' || el.childElementCount > 0);
      fireEvent.change(box, { target: { value: 'z' } });
      act(() => {
        vi.advanceTimersByTime(announceDelay);
      });
      expect(region()?.textContent).toBe('No places match');
      fireEvent.change(box, { target: { value: 'zz' } });
      act(() => {
        vi.advanceTimersByTime(announceDelay);
      });
      expect(region()?.children).toHaveLength(1);
    });
  });

  describe('clearing', () => {
    it('shows a clear button while something is picked, which empties it, closes and focuses the field', () => {
      const onChange = vi.fn();
      const { container } = render(
        <Held
          label="Place"
          data={PLACES}
          start="tokyo"
          clearable
          onChange={onChange}
        />
      );
      expect(container.querySelector('.tree-select')).toHaveClass('has-clear');
      open();
      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
      expect(onChange).toHaveBeenCalledWith(null);
      expect(dialog()).toBeNull();
      expect(field()).toHaveFocus();
      expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
      expect(container.querySelector('.tree-select')).not.toHaveClass(
        'has-clear'
      );
    });

    it('clears a checked list to [] and takes labels.clear', () => {
      const onChange = vi.fn();
      render(
        <TreeSelect
          label="Places"
          data={PLACES}
          selectionMode="checkbox"
          defaultValue={['asia']}
          clearable
          labels={{ clear: 'Empty' }}
          onChange={onChange}
          size="small"
        />
      );
      const button = screen.getByRole('button', { name: 'Empty' });
      expect(button).toHaveClass('delete', 'is-small', 'tree-select-clear');
      fireEvent.click(button);
      expect(onChange).toHaveBeenCalledWith([]);
    });

    it('shows none without clearable, or while disabled', () => {
      const { rerender } = render(
        <TreeSelect label="Place" data={PLACES} defaultValue="tokyo" />
      );
      expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
      rerender(
        <TreeSelect
          label="Place"
          data={PLACES}
          defaultValue="tokyo"
          clearable
          disabled
        />
      );
      expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    });
  });

  describe('forms', () => {
    it('is aria-required, with a hidden required field over it the browser reads, which keeps focus until the next key', () => {
      // `inset` isn't in jsdom's CSS model, so it's read as written.
      const { container, rerender } = render(
        <>
          <TreeSelect
            label="Place"
            data={PLACES}
            required
            form="f"
            aria-describedby="kept"
          />
          <p id="kept">Where it's kept</p>
        </>
      );
      // Focused, the stand-in reads as a combobox of the same name, so the
      // field is held from here.
      const input = field();
      expect(input).toHaveAttribute('aria-required', 'true');
      expect(input).not.toHaveAttribute('required');
      const proxy =
        container.querySelector<HTMLInputElement>('input[required]')!;
      expect(proxy).toHaveAttribute('aria-hidden', 'true');
      expect(proxy).toHaveAttribute('tabindex', '-1');
      expect(proxy).toHaveAttribute('form', 'f');
      expect(proxy.name).toBe('');
      expect(proxy.validity.valueMissing).toBe(true);
      expect(proxy.getAttribute('style')).toContain('inset: 0');
      // No on-screen keyboard, and no zoom on iOS.
      expect(proxy).toHaveAttribute('inputmode', 'none');
      expect(proxy).toHaveStyle({ fontSize: '16px' });
      expect(proxy).not.toHaveAttribute('aria-labelledby');
      expect(proxy).not.toHaveAttribute('role');
      // The browser focuses it to show its message. Focus stays, so the
      // message does, and the field looks focused. Focused, it's in the
      // accessibility tree, and reads as the field does, shut.
      act(() => proxy.focus());
      expect(proxy).toHaveFocus();
      expect(input).toHaveClass('is-focused');
      expect(proxy).not.toHaveAttribute('aria-hidden');
      expect(proxy).toHaveRole('combobox');
      expect(proxy).toHaveAccessibleName('Place');
      expect(proxy).toHaveAccessibleDescription("Where it's kept");
      expect(proxy).toHaveAttribute('aria-haspopup', 'dialog');
      expect(proxy).toHaveAttribute('aria-expanded', 'false');
      // A modifier on its own leaves focus, and the message, where they are.
      for (const key of ['Shift', 'Control', 'Alt', 'Meta', 'CapsLock']) {
        fireEvent.keyDown(proxy, { key });
        expect(proxy).toHaveFocus();
      }
      // The next key goes to the field and does what it does there.
      fireEvent.keyDown(proxy, { key: 'x' });
      expect(input).toHaveFocus();
      expect(input).not.toHaveClass('is-focused');
      expect(proxy).toHaveAttribute('aria-hidden', 'true');
      expect(screen.queryByRole('dialog')).toBeNull();
      act(() => proxy.focus());
      fireEvent.keyDown(proxy, { key: 'Enter' });
      expect(screen.getByRole('dialog')).toContainElement(
        document.activeElement as HTMLElement
      );
      fireEvent.change(proxy, { target: { value: 'typed' } });
      rerender(
        <>
          <TreeSelect
            label="Place"
            data={PLACES}
            required
            form="f"
            aria-describedby="kept"
            value="tokyo"
          />
          <p id="kept">Where it's kept</p>
        </>
      );
      expect(proxy.validity.valueMissing).toBe(false);
    });

    it.each([
      ['taken away', { required: false }],
      ['disabled', { disabled: true }],
    ])(
      'stops looking focused when the required field is %s while it has focus, which fires no blur',
      (_, change) => {
        const { container, rerender } = render(
          <TreeSelect label="Place" data={PLACES} required />
        );
        const proxy =
          container.querySelector<HTMLInputElement>('input[required]')!;
        const input = field();
        act(() => proxy.focus());
        expect(input).toHaveClass('is-focused');
        rerender(
          <TreeSelect label="Place" data={PLACES} required {...change} />
        );
        expect(input).not.toHaveClass('is-focused');
        rerender(<TreeSelect label="Place" data={PLACES} required />);
        expect(input).not.toHaveClass('is-focused');
        expect(container.querySelector('input[required]')).toHaveAttribute(
          'aria-hidden',
          'true'
        );
      }
    );

    it('can be disabled: no opening, no buttons, and nothing posts', () => {
      const { container } = render(
        <TreeSelect
          label="Places"
          data={PLACES}
          selectionMode="checkbox"
          defaultValue={['tokyo']}
          name="places"
          required
          disabled
        />
      );
      expect(field()).toBeDisabled();
      expect(container.querySelector('.tree-select')).toHaveClass(
        'is-disabled'
      );
      open();
      key(field(), 'Enter');
      expect(dialog()).toBeNull();
      expect(screen.queryByRole('button')).toBeNull();
      container
        .querySelectorAll('input[type="hidden"], input[required]')
        .forEach(el => expect(el).toBeDisabled());
    });

    it('is disabled by a disabled Fieldset', () => {
      render(
        <Fieldset legend="Where" disabled>
          <TreeSelect label="Place" data={PLACES} />
        </Fieldset>
      );
      expect(field()).toBeDisabled();
    });

    it("isn't shown open while disabled", () => {
      const { rerender } = render(
        <TreeSelect label="Place" data={PLACES} defaultOpen />
      );
      expect(dialog()).not.toBeNull();
      rerender(<TreeSelect label="Place" data={PLACES} defaultOpen disabled />);
      expect(dialog()).toBeNull();
      expect(field()).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('the nodes', () => {
    it("draws icons and itemTemplate's rows, and the field still shows the label", () => {
      render(
        <TreeSelect
          label="Place"
          data={[
            { value: 'a', label: 'Alpha', icon: 'folder' },
            { value: 'b', label: 'Beta', icon: <svg data-testid="svg" /> },
          ]}
          defaultValue="a"
          itemTemplate={node => <b>{node.label}!</b>}
        />
      );
      expect(field()).toHaveValue('Alpha');
      open();
      expect(item('Alpha!')).toBeInTheDocument();
      expect(
        item('Alpha!').querySelector('.tree-view-icon .icon')
      ).not.toBeNull();
      expect(screen.getByTestId('svg')).toBeInTheDocument();
    });

    it('loads a branch lazily through hasChildren, isLoading, loadError and onRetry', () => {
      const onRetry = vi.fn();
      const onExpandedChange = vi.fn();
      const data = (extra: Partial<TreeItemData>): TreeItemData[] => [
        { value: 'photos', label: 'Photos', hasChildren: true, ...extra },
      ];
      const { rerender } = render(
        <TreeSelect
          label="Folder"
          data={data({})}
          onExpandedChange={onExpandedChange}
          labels={{
            loading: 'Fetching…',
            retry: 'Again',
            loadingAnnouncement: name => `Fetching ${name}`,
            loadedAnnouncement: name => `${name} fetched`,
          }}
        />
      );
      open();
      key(item('Photos'), 'ArrowRight');
      expect(onExpandedChange).toHaveBeenLastCalledWith(['photos']);
      rerender(
        <TreeSelect
          label="Folder"
          data={data({ isLoading: true })}
          onExpandedChange={onExpandedChange}
          labels={{ loading: 'Fetching…', retry: 'Again' }}
        />
      );
      expect(item('Fetching…')).toBeInTheDocument();
      rerender(
        <TreeSelect
          label="Folder"
          data={data({ loadError: "Couldn't load Photos", onRetry })}
          onExpandedChange={onExpandedChange}
          labels={{ retry: 'Again' }}
        />
      );
      const failed = screen.getByRole('treeitem', {
        name: "Couldn't load Photos Again",
      });
      fireEvent.click(failed);
      expect(onRetry).toHaveBeenCalled();
    });

    it('takes the label from the value when it has none', () => {
      render(<TreeSelect label="L" data={[{ value: 'x' }]} defaultValue="x" />);
      expect(field()).toHaveValue('x');
    });

    it('reads empty children as none', () => {
      render(
        <TreeSelect
          label="L"
          data={[{ value: 'x', label: 'X', children: [] }]}
          parentsSelectable={false}
        />
      );
      open();
      expect(item('X')).not.toHaveAttribute('aria-expanded');
      fireEvent.click(item('X'));
      expect(field()).toHaveValue('X');
    });
  });

  describe('a reset of its form', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    /** Resets the form, and runs the task the value goes back in. */
    const reset = (form: HTMLFormElement) =>
      act(() => {
        form.reset();
        vi.runAllTimers();
      });

    const hidden = (container: HTMLElement) =>
      Array.from(
        container.querySelectorAll<HTMLInputElement>('input[type="hidden"]'),
        el => el.value
      );

    it('puts the value back to defaultValue, with the tags, the hidden inputs and the required stand-in', () => {
      const onChange = vi.fn();
      const { container } = render(
        <form data-testid="form">
          <TreeSelect
            label="Places"
            data={PLACES}
            selectionMode="checkbox"
            defaultValue={['france']}
            name="places"
            required
            onChange={onChange}
          />
        </form>
      );
      open();
      fireEvent.click(item('Asia'));
      expect(hidden(container)).toEqual(['tokyo', 'osaka', 'france']);
      reset(screen.getByTestId('form') as HTMLFormElement);
      expect(onChange).toHaveBeenLastCalledWith(['france']);
      expect(hidden(container)).toEqual(['france']);
      expect(
        Array.from(container.querySelectorAll('.tag'), tag => tag.textContent)
      ).toEqual(['France']);
      expect(
        container.querySelector<HTMLInputElement>('input[required]')!.value
      ).toBe('picked');
    });

    it("empties a value with no defaultValue, and the field's text", () => {
      const onChange = vi.fn();
      const { container } = render(
        <form data-testid="form">
          <TreeSelect
            label="Place"
            data={PLACES}
            name="place"
            required
            onChange={onChange}
          />
        </form>
      );
      open();
      fireEvent.click(item('Oceania'));
      expect(field()).toHaveValue('Oceania');
      reset(screen.getByTestId('form') as HTMLFormElement);
      expect(onChange).toHaveBeenLastCalledWith(null);
      expect(field()).toHaveValue('');
      expect(hidden(container)).toEqual(['']);
      expect(
        container.querySelector<HTMLInputElement>('input[required]')!.validity
          .valueMissing
      ).toBe(true);
    });

    it('reports nothing when the value is the default already', () => {
      const onChange = vi.fn();
      render(
        <form data-testid="form">
          <TreeSelect
            label="Place"
            data={PLACES}
            defaultValue="tokyo"
            onChange={onChange}
          />
        </form>
      );
      reset(screen.getByTestId('form') as HTMLFormElement);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('leaves a reset that was cancelled alone', () => {
      const onChange = vi.fn();
      render(
        <form data-testid="form">
          <TreeSelect
            label="Place"
            data={PLACES}
            defaultValue="tokyo"
            onChange={onChange}
          />
        </form>
      );
      const form = screen.getByTestId('form') as HTMLFormElement;
      open();
      fireEvent.click(item('Oceania'));
      form.addEventListener('reset', event => event.preventDefault());
      reset(form);
      expect(field()).toHaveValue('Oceania');
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('leaves a held value to its owner, reporting the empty value', () => {
      const onChange = vi.fn();
      render(
        <form data-testid="form">
          <TreeSelect
            label="Place"
            data={PLACES}
            value="tokyo"
            onChange={onChange}
          />
        </form>
      );
      reset(screen.getByTestId('form') as HTMLFormElement);
      expect(onChange).toHaveBeenCalledWith(null);
      expect(field()).toHaveValue('Tokyo');
    });

    it('hears the form its `form` names, and stops listening once gone', () => {
      const onChange = vi.fn();
      const { unmount } = render(
        <>
          <form id="elsewhere" data-testid="form" />
          <TreeSelect
            label="Place"
            data={PLACES}
            defaultValue="tokyo"
            form="elsewhere"
            onChange={onChange}
          />
        </>
      );
      open();
      fireEvent.click(item('Oceania'));
      reset(screen.getByTestId('form') as HTMLFormElement);
      expect(field()).toHaveValue('Tokyo');
      // A reset whose task is still to run when it unmounts does nothing.
      open();
      fireEvent.click(item('Oceania'));
      const before = onChange.mock.calls.length;
      act(() => {
        (screen.getByTestId('form') as HTMLFormElement).reset();
      });
      unmount();
      vi.runAllTimers();
      expect(onChange).toHaveBeenCalledTimes(before);
    });

    it('hears a form its `form` names that mounts after the field', () => {
      const onChange = vi.fn();
      const field = (
        <TreeSelect
          label="Place"
          data={PLACES}
          defaultValue="tokyo"
          form="later"
          onChange={onChange}
        />
      );
      const { rerender } = render(field);
      rerender(
        <>
          {field}
          <form id="later" data-testid="form" />
        </>
      );
      open();
      fireEvent.click(item('Oceania'));
      reset(screen.getByTestId('form') as HTMLFormElement);
      expect(onChange).toHaveBeenLastCalledWith('tokyo');
      expect(screen.getByRole('combobox')).toHaveValue('Tokyo');
    });

    it('lands a reset under way when its `form` changes before the reset task', () => {
      const onChange = vi.fn();
      const props = {
        label: 'Place',
        data: PLACES,
        defaultValue: 'tokyo',
        onChange,
      };
      const forms = (
        <>
          <form id="one" data-testid="one" />
          <form id="two" />
        </>
      );
      const { rerender } = render(
        <>
          {forms}
          <TreeSelect {...props} form="one" />
        </>
      );
      open();
      fireEvent.click(item('Oceania'));
      act(() => {
        (screen.getByTestId('one') as HTMLFormElement).reset();
      });
      rerender(
        <>
          {forms}
          <TreeSelect {...props} form="two" />
        </>
      );
      act(() => {
        vi.runAllTimers();
      });
      expect(onChange).toHaveBeenLastCalledWith('tokyo');
    });

    it('leaves a reset of another form alone', () => {
      const onChange = vi.fn();
      render(
        <>
          <form data-testid="other" />
          <form>
            <TreeSelect
              label="Place"
              data={PLACES}
              defaultValue="tokyo"
              onChange={onChange}
            />
          </form>
        </>
      );
      open();
      fireEvent.click(item('Oceania'));
      reset(screen.getByTestId('other') as HTMLFormElement);
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('listens to no form outside one', () => {
      render(<TreeSelect label="Place" data={PLACES} defaultValue="tokyo" />);
      expect(field()).toHaveValue('Tokyo');
    });
  });

  describe('clearing, tags, loads and search, at their edges', () => {
    it('clears to the checked disabled items, and shows no clear button with only those', () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <TreeSelect
          label="Places"
          data={PLACES}
          selectionMode="checkbox"
          defaultValue={['china', 'tokyo']}
          clearable
          onChange={onChange}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
      expect(onChange).toHaveBeenCalledWith(['china']);
      expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
      rerender(
        <TreeSelect
          label="Places"
          data={PLACES}
          selectionMode="checkbox-independent"
          value={['china']}
          clearable
        />
      );
      expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    });

    it('gives a tag a button only where taking it off changes the value', () => {
      const data: TreeItemData[] = [
        {
          value: 'team',
          label: 'Team',
          disabled: true,
          children: [
            { value: 'ann', label: 'Ann' },
            { value: 'bob', label: 'Bob' },
          ],
        },
        { value: 'eve', label: 'Eve' },
      ];
      render(
        <TreeSelect
          label="People"
          data={data}
          selectionMode="checkbox"
          checkedStrategy="all"
          defaultValue={['team', 'ann', 'bob', 'eve']}
        />
      );
      expect(
        screen.getAllByRole('button').map(b => b.getAttribute('aria-label'))
      ).toEqual(['Remove Eve']);
    });

    describe.each([
      ['child', ['locked', 'kid', 'free'], ['locked', 'kid']],
      ['parent', ['locked', 'free'], ['locked']],
      ['all', ['locked', 'kid', 'free'], ['locked', 'kid']],
    ] as const)(
      "with a checked disabled parent, in '%s'",
      (strategy, value, cleared) => {
        // `locked` is disabled and checked, so it keeps `kid` checked.
        const data: TreeItemData[] = [
          {
            value: 'locked',
            label: 'Locked',
            disabled: true,
            children: [{ value: 'kid', label: 'Kid' }],
          },
          { value: 'free', label: 'Free' },
        ];
        const setup = (held: readonly string[]) => {
          const onChange = vi.fn();
          render(
            <TreeSelect
              label="People"
              data={data}
              selectionMode="checkbox"
              checkedStrategy={strategy}
              value={[...held]}
              onChange={onChange}
              clearable
            />
          );
          return onChange;
        };

        it('gives a button only to the tag whose box can be unchecked', () => {
          setup(value);
          expect(
            screen.getAllByRole('button').map(b => b.getAttribute('aria-label'))
          ).toEqual(['Clear', 'Remove Free']);
        });

        it('clears what a control can uncheck, shaped by the strategy', () => {
          const onChange = setup(value);
          fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
          expect(onChange).toHaveBeenCalledWith([...cleared]);
        });

        it('shows no clear button once nothing it can take off is left', () => {
          setup(cleared);
          expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
        });
      }
    );

    it('keeps an item another checked disabled item above it keeps, and the parent it fills', () => {
      // `outer` is enabled, but all it holds is what `locked` keeps checked.
      const data: TreeItemData[] = [
        {
          value: 'outer',
          label: 'Outer',
          children: [
            {
              value: 'locked',
              label: 'Locked',
              disabled: true,
              children: [{ value: 'kid', label: 'Kid' }],
            },
          ],
        },
      ];
      render(
        <TreeSelect
          label="People"
          data={data}
          selectionMode="checkbox"
          checkedStrategy="all"
          defaultValue={['outer', 'locked', 'kid']}
          clearable
        />
      );
      expect(screen.queryAllByRole('button')).toEqual([]);
    });

    it('clears a value no node has, which it can always take off', () => {
      const onChange = vi.fn();
      render(
        <TreeSelect
          label="Places"
          data={PLACES}
          selectionMode="checkbox"
          defaultValue={['mars']}
          clearable
          onChange={onChange}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
      expect(onChange).toHaveBeenCalledWith([]);
    });

    it("keeps the value as it's held when a branch loads, and shapes only what a check makes", () => {
      const onChange = vi.fn();
      const lazy = (loaded: boolean): TreeItemData[] => [
        {
          value: 'photos',
          label: 'Photos',
          hasChildren: true,
          children: loaded
            ? [
                { value: 'summer', label: 'Summer' },
                { value: 'winter', label: 'Winter' },
              ]
            : undefined,
        },
        { value: 'docs', label: 'Documents' },
      ];
      const { container, rerender } = render(
        <TreeSelect
          label="Folders"
          data={lazy(false)}
          selectionMode="checkbox"
          defaultValue={['photos']}
          name="folders"
          onChange={onChange}
        />
      );
      const posted = () =>
        Array.from(
          container.querySelectorAll<HTMLInputElement>('input[type="hidden"]'),
          el => el.value
        );
      expect(posted()).toEqual(['photos']);
      rerender(
        <TreeSelect
          label="Folders"
          data={lazy(true)}
          selectionMode="checkbox"
          defaultValue={['photos']}
          name="folders"
          onChange={onChange}
        />
      );
      expect(posted()).toEqual(['photos']);
      expect(onChange).not.toHaveBeenCalled();
      open();
      fireEvent.click(item('Documents'));
      expect(onChange).toHaveBeenLastCalledWith(['summer', 'winter', 'docs']);
      expect(posted()).toEqual(['summer', 'winter', 'docs']);
    });

    it("in 'single', a click on a parent's row picks it and opens nothing, as Enter does", () => {
      const onChange = vi.fn();
      const onExpandedChange = vi.fn();
      render(
        <TreeSelect
          label="Place"
          closeOnSelect={false}
          data={[
            ...PLACES,
            { value: 'lazy', label: 'Lazy', hasChildren: true },
          ]}
          onChange={onChange}
          onExpandedChange={onExpandedChange}
        />
      );
      open();
      fireEvent.click(item('Europe'));
      expect(onChange).toHaveBeenLastCalledWith('europe');
      expect(item('Europe')).toHaveAttribute('aria-expanded', 'false');
      fireEvent.click(item('Lazy'));
      expect(onChange).toHaveBeenLastCalledWith('lazy');
      expect(item('Lazy')).toHaveAttribute('aria-expanded', 'false');
      expect(onExpandedChange).not.toHaveBeenCalled();
      // The chevron still opens it, and a click on its open group picks nothing.
      fireEvent.click(item('Europe').querySelector('.tree-view-toggle')!);
      expect(onExpandedChange).toHaveBeenLastCalledWith(['europe']);
      fireEvent.click(item('Europe').querySelector('[role="group"]')!);
      expect(onChange).toHaveBeenCalledTimes(2);
      key(item('Europe'), 'ArrowRight');
      expect(item('France')).toHaveFocus();
    });

    it('opens no branch a search hides with *', async () => {
      const onExpandedChange = vi.fn();
      const user = userEvent.setup();
      render(
        <TreeSelect
          label="Place"
          data={PLACES}
          searchable
          onExpandedChange={onExpandedChange}
        />
      );
      open();
      await user.keyboard('tokyo');
      key(item('Asia'), '*');
      expect(onExpandedChange).not.toHaveBeenCalled();
      expect(shownItems()).toEqual(['Asia', 'Japan', 'Tokyo']);
    });

    it('starts the closed branches over whenever a held query changes', () => {
      const props = {
        label: 'Place',
        data: PLACES,
        searchable: true,
        defaultOpen: true,
      };
      const { rerender } = render(<TreeSelect {...props} query="tokyo" />);
      key(item('Japan'), 'ArrowLeft');
      expect(item('Japan')).toHaveAttribute('aria-expanded', 'false');
      rerender(<TreeSelect {...props} query="toky" />);
      expect(item('Japan')).toHaveAttribute('aria-expanded', 'true');
      key(item('Japan'), 'ArrowLeft');
      rerender(<TreeSelect {...props} query="tokyo" />);
      expect(item('Japan')).toHaveAttribute('aria-expanded', 'true');
    });

    it("doesn't search again on a render that changes nothing the search reads", () => {
      const filter = vi.fn((query: string, node: TreeItemData) =>
        node.value.includes(query)
      );
      const props = {
        label: 'Place',
        data: PLACES,
        searchable: true,
        defaultOpen: true,
        query: 'tok',
        filter,
      };
      const { rerender } = render(<TreeSelect {...props} />);
      const calls = filter.mock.calls.length;
      rerender(<TreeSelect {...props} placeholder="Somewhere" />);
      expect(filter).toHaveBeenCalledTimes(calls);
      rerender(<TreeSelect {...props} query="osa" />);
      expect(filter.mock.calls.length).toBeGreaterThan(calls);
    });

    it('takes a filter written inline without searching on every render, and reads the newest when it does', () => {
      const first = vi.fn<(q: string, n: TreeItemData) => boolean>(() => true);
      const second = vi.fn<(q: string, n: TreeItemData) => boolean>(
        () => false
      );
      const props = {
        label: 'Place',
        data: PLACES,
        searchable: true,
        defaultOpen: true,
      };
      const { rerender } = render(
        <TreeSelect {...props} query="a" filter={(q, n) => first(q, n)} />
      );
      const calls = first.mock.calls.length;
      rerender(
        <TreeSelect {...props} query="a" filter={(q, n) => first(q, n)} />
      );
      expect(first).toHaveBeenCalledTimes(calls);
      rerender(
        <TreeSelect {...props} query="a" filter={(q, n) => second(q, n)} />
      );
      rerender(
        <TreeSelect {...props} query="ab" filter={(q, n) => second(q, n)} />
      );
      expect(second).toHaveBeenCalled();
      expect(screen.queryByRole('tree')).toBeNull();
    });

    it('drops the open a picking click asks for once that click is over', async () => {
      const onExpandedChange = vi.fn();
      render(
        <TreeSelect
          label="Place"
          data={PLACES}
          closeOnSelect={false}
          onExpandedChange={onExpandedChange}
        />
      );
      open();
      fireEvent.click(item('Europe'));
      await Promise.resolve();
      key(item('Europe'), 'ArrowRight');
      expect(onExpandedChange).toHaveBeenCalledWith(['europe']);
    });

    it("marks the panel in place to take at least the field's width", () => {
      render(<TreeSelect label="Place" data={PLACES} />);
      open();
      expect(screen.getByRole('dialog')).toHaveClass('has-anchor-width');
    });
  });

  it('applies classPrefix from ConfigProvider everywhere', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bestax-">
        <TreeSelect
          label="Places"
          data={PLACES}
          selectionMode="checkbox"
          defaultValue={['tokyo']}
          searchable
          clearable
          size="small"
          message="Help"
        />
      </ConfigProvider>
    );
    expect(container.querySelector('.bestax-tree-select')).toHaveClass(
      'bestax-has-clear'
    );
    expect(container.querySelector('.tree-select')).toBeNull();
    expect(field()).toHaveClass('bestax-input', 'bestax-is-small');
    expect(container.querySelector('.bestax-control')).not.toBeNull();
    expect(
      container.querySelector('.bestax-tree-select-chevron')
    ).not.toBeNull();
    expect(container.querySelector('.bestax-tree-select-clear')).toHaveClass(
      'bestax-delete'
    );
    expect(container.querySelector('.bestax-tags .bestax-tag')).not.toBeNull();
    open();
    const panel = screen.getByRole('dialog');
    expect(panel).toHaveClass(
      'bestax-picker-popover',
      'bestax-tree-select-panel',
      'bestax-is-small'
    );
    expect(screen.getByRole('searchbox')).toHaveClass(
      'bestax-input',
      'bestax-tree-select-search'
    );
    expect(screen.getByRole('tree')).toHaveClass('bestax-tree-view');
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'zz' },
    });
    expect(panel.querySelector('[class*="tree-select-empty"]')).toBeNull();
  });

  it('shows the empty message under classPrefix', () => {
    render(
      <ConfigProvider classPrefix="bestax-">
        <TreeSelect label="P" data={PLACES} searchable empty="None" />
      </ConfigProvider>
    );
    open();
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'zz' },
    });
    expect(screen.getByText('None')).toHaveClass('bestax-tree-select-empty');
  });

  it('picks from a classPrefix tree, its chevron included', () => {
    const onChange = vi.fn();
    render(
      <ConfigProvider classPrefix="bestax-">
        <TreeSelect label="P" data={PLACES} onChange={onChange} />
      </ConfigProvider>
    );
    open();
    fireEvent.click(item('Asia').querySelector('.bestax-tree-view-toggle')!);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(item('Japan'));
    expect(onChange).toHaveBeenCalledWith('japan');
  });

  it('renders its field, text and tags on the server, without the panel', () => {
    const html = renderToString(
      <>
        <TreeSelect label="Place" data={PLACES} defaultValue="tokyo" />
        <TreeSelect
          label="Places"
          data={PLACES}
          selectionMode="checkbox"
          defaultValue={['japan']}
        />
      </>
    );
    expect(html).toContain('value="Tokyo"');
    expect(html).toContain('>Japan</span>');
    expect(html).not.toContain('role="dialog"');
  });
});
