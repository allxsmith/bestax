import { useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Collapses } from '../Collapses';
import { Collapse } from '../Collapse';
import { ConfigProvider } from '../../helpers/Config';

/** The trigger of the item whose trigger text is `name`. */
const trigger = (name: string) => screen.getByRole('button', { name });

/** Whether the item whose trigger text is `name` is open. */
const isOpen = (name: string) =>
  trigger(name).getAttribute('aria-expanded') === 'true';

/** Names of the items currently open, in document order. */
const openNames = () =>
  screen
    .getAllByRole('button')
    .filter(el => el.getAttribute('aria-expanded') === 'true')
    .map(el => el.textContent);

const threeItems = [
  <Collapse key="a" trigger="A">
    Panel A
  </Collapse>,
  <Collapse key="b" trigger="B">
    Panel B
  </Collapse>,
  <Collapse key="c" trigger="C">
    Panel C
  </Collapse>,
];

describe('Collapses', () => {
  describe('rendering', () => {
    it('renders a .collapses root around its items', () => {
      const { container } = render(<Collapses>{threeItems}</Collapses>);
      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass('collapses');
      expect(root).not.toHaveClass('is-seamless');
      expect(root.querySelectorAll(':scope > .collapse')).toHaveLength(3);
    });

    it('adds is-seamless from seamless', () => {
      const { container } = render(
        <Collapses seamless>{threeItems}</Collapses>
      );
      expect(container.firstChild).toHaveClass('collapses', 'is-seamless');
    });

    it('applies className, helper props and other attributes to the root', () => {
      const { container } = render(
        <Collapses className="faq" mt="4" data-testid="group" id="faq">
          {threeItems}
        </Collapses>
      );
      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass('collapses', 'faq', 'mt-4');
      expect(root).toHaveAttribute('data-testid', 'group');
      expect(root).toHaveAttribute('id', 'faq');
    });

    it('applies the classPrefix from ConfigProvider', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bestax-">
          <Collapses seamless>{threeItems}</Collapses>
        </ConfigProvider>
      );
      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass('bestax-collapses', 'bestax-is-seamless');
      expect(root).not.toHaveClass('collapses');
      expect(root.firstChild).toHaveClass('bestax-collapse');
    });

    it('renders text children in place without making them items', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const { container } = render(
        <Collapses defaultValue={1}>
          {'Intro'}
          <Collapse trigger="A">Panel A</Collapse>
          <Collapse trigger="B">Panel B</Collapse>
        </Collapses>
      );
      expect(container.firstChild?.firstChild?.textContent).toBe('Intro');
      // Index 1 is the second Collapse, not the second child node.
      expect(openNames()).toEqual(['B']);
      // Text beside keyed items raises no key warning.
      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('single mode (uncontrolled)', () => {
    it('starts with every item closed', () => {
      render(<Collapses>{threeItems}</Collapses>);
      expect(openNames()).toEqual([]);
    });

    it('opens the defaultValue item', () => {
      render(<Collapses defaultValue={1}>{threeItems}</Collapses>);
      expect(openNames()).toEqual(['B']);
    });

    it('keeps one item open at a time, and closes it from its own trigger', () => {
      const onChange = jest.fn();
      render(<Collapses onChange={onChange}>{threeItems}</Collapses>);

      fireEvent.click(trigger('A'));
      expect(openNames()).toEqual(['A']);
      fireEvent.click(trigger('C'));
      expect(openNames()).toEqual(['C']);
      fireEvent.click(trigger('C'));
      expect(openNames()).toEqual([]);

      expect(onChange.mock.calls).toEqual([[0], [2], [null]]);
    });

    it('toggles items from the keyboard through the group', () => {
      render(<Collapses defaultValue={0}>{threeItems}</Collapses>);

      fireEvent.keyDown(trigger('B'), { key: 'Enter' });
      expect(openNames()).toEqual(['B']);
      fireEvent.keyDown(trigger('B'), { key: ' ' });
      expect(openNames()).toEqual([]);
    });

    it('keeps each item wired to its own panel', () => {
      const { container } = render(
        <Collapses defaultValue={0}>{threeItems}</Collapses>
      );
      const panels = container.querySelectorAll('.collapse-content');
      expect(trigger('A')).toHaveAttribute('aria-controls', panels[0].id);
      expect(trigger('B')).toHaveAttribute('aria-controls', panels[1].id);
      expect(panels[0]).toHaveAttribute('aria-hidden', 'false');
      expect(panels[1]).toHaveAttribute('aria-hidden', 'true');
      expect(trigger('A')).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('multiple mode (uncontrolled)', () => {
    it('opens the defaultValue items', () => {
      render(
        <Collapses multiple defaultValue={[0, 2]}>
          {threeItems}
        </Collapses>
      );
      expect(openNames()).toEqual(['A', 'C']);
    });

    it('opens and closes items independently', () => {
      const onChange = jest.fn();
      render(
        <Collapses multiple onChange={onChange}>
          {threeItems}
        </Collapses>
      );

      fireEvent.click(trigger('A'));
      fireEvent.click(trigger('C'));
      expect(openNames()).toEqual(['A', 'C']);
      fireEvent.click(trigger('A'));
      expect(openNames()).toEqual(['C']);

      expect(onChange.mock.calls).toEqual([[[0]], [[0, 2]], [[2]]]);
    });
  });

  describe('controlled', () => {
    it('follows value in single mode, and reports without changing', () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <Collapses value={0} onChange={onChange}>
          {threeItems}
        </Collapses>
      );
      expect(openNames()).toEqual(['A']);

      fireEvent.click(trigger('B'));
      expect(onChange).toHaveBeenLastCalledWith(1);
      expect(openNames()).toEqual(['A']);

      rerender(
        <Collapses value={1} onChange={onChange}>
          {threeItems}
        </Collapses>
      );
      expect(openNames()).toEqual(['B']);

      fireEvent.click(trigger('B'));
      expect(onChange).toHaveBeenLastCalledWith(null);
    });

    it('treats a null value as controlled with nothing open', () => {
      render(
        <Collapses value={null} defaultValue={2}>
          {threeItems}
        </Collapses>
      );
      expect(openNames()).toEqual([]);
      fireEvent.click(trigger('A'));
      expect(openNames()).toEqual([]);
    });

    it('follows value in multiple mode', () => {
      function Harness() {
        const [open, setOpen] = useState<number[]>([1]);
        return (
          <Collapses multiple value={open} onChange={setOpen}>
            {threeItems}
          </Collapses>
        );
      }
      render(<Harness />);
      expect(openNames()).toEqual(['B']);

      fireEvent.click(trigger('C'));
      expect(openNames()).toEqual(['B', 'C']);
      fireEvent.click(trigger('B'));
      expect(openNames()).toEqual(['C']);
    });

    it('closes an item in single mode even when value lists several', () => {
      const onChange = jest.fn();
      // Not a typed use: plain JavaScript can hand single mode an array.
      const props = { value: [0, 2], onChange } as unknown as {
        value: number;
        onChange: (value: number | null) => void;
      };
      render(<Collapses {...props}>{threeItems}</Collapses>);
      expect(openNames()).toEqual(['A', 'C']);

      fireEvent.click(trigger('A'));
      expect(onChange).toHaveBeenLastCalledWith(2);
    });
  });

  describe('items', () => {
    it('leaves a child that sets its own open alone', () => {
      const onChange = jest.fn();
      const ownToggle = jest.fn();
      render(
        <Collapses defaultValue={1} onChange={onChange}>
          <Collapse trigger="A">Panel A</Collapse>
          <Collapse trigger="Own" open onOpenChange={ownToggle}>
            Own panel
          </Collapse>
          <Collapse trigger="C">Panel C</Collapse>
        </Collapses>
      );
      // The group's value names the item's index, but its own `open` wins.
      expect(isOpen('Own')).toBe(true);

      // Opening another item in single mode does not close it.
      fireEvent.click(trigger('A'));
      expect(openNames()).toEqual(['A', 'Own']);
      expect(onChange).toHaveBeenLastCalledWith(0);

      // Its trigger reports to its own handler only.
      onChange.mockClear();
      fireEvent.click(trigger('Own'));
      expect(ownToggle).toHaveBeenCalledWith(false);
      expect(onChange).not.toHaveBeenCalled();
      expect(isOpen('Own')).toBe(true);
    });

    it("fires an item's onOpenChange, but not its onOpen or onClose", () => {
      const onOpenChange = jest.fn();
      const onOpen = jest.fn();
      const onClose = jest.fn();
      render(
        <Collapses>
          <Collapse
            trigger="A"
            onOpenChange={onOpenChange}
            onOpen={onOpen}
            onClose={onClose}
          >
            Panel A
          </Collapse>
        </Collapses>
      );

      fireEvent.click(trigger('A'));
      fireEvent.click(trigger('A'));

      expect(onOpenChange.mock.calls).toEqual([[true], [false]]);
      expect(onOpen).not.toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
    });

    it("ignores an item's defaultOpen in favour of the group's defaultValue", () => {
      render(
        <Collapses defaultValue={1}>
          <Collapse trigger="A" defaultOpen>
            Panel A
          </Collapse>
          <Collapse trigger="B">Panel B</Collapse>
        </Collapses>
      );
      expect(openNames()).toEqual(['B']);
    });

    it('indexes the children of a fragment one by one', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      render(
        <Collapses defaultValue={2}>
          <Collapse trigger="A">Panel A</Collapse>
          <>
            <Collapse trigger="B">Panel B</Collapse>
            <Collapse trigger="C">Panel C</Collapse>
          </>
        </Collapses>
      );
      expect(openNames()).toEqual(['C']);
      fireEvent.click(trigger('B'));
      expect(openNames()).toEqual(['B']);
      // Re-keyed children render without duplicate-key warnings.
      expect(errorSpy).not.toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    it('drives a Collapse rendered by a wrapper component', () => {
      function FaqItem({ question }: { question: string }) {
        return <Collapse trigger={question}>Answer</Collapse>;
      }
      render(
        <Collapses defaultValue={0}>
          <FaqItem question="Q1" />
          <FaqItem question="Q2" />
        </Collapses>
      );
      expect(openNames()).toEqual(['Q1']);
      fireEvent.click(trigger('Q2'));
      expect(openNames()).toEqual(['Q2']);
    });

    it('lets a Collapse nested in an item keep its own state', () => {
      render(
        <Collapses defaultValue={0}>
          <Collapse trigger="Outer">
            <Collapse trigger="Inner">Inner panel</Collapse>
          </Collapse>
          <Collapse trigger="B">Panel B</Collapse>
        </Collapses>
      );
      // Not opened along with its ancestor's slot in the group.
      expect(isOpen('Outer')).toBe(true);
      expect(isOpen('Inner')).toBe(false);

      fireEvent.click(trigger('Inner'));
      expect(isOpen('Inner')).toBe(true);
      expect(isOpen('Outer')).toBe(true);
    });
  });

  describe('server rendering', () => {
    it('renders the defaultValue item open in the server markup', () => {
      const html = renderToStaticMarkup(
        <Collapses defaultValue={1}>{threeItems}</Collapses>
      );
      const expanded = [...html.matchAll(/aria-expanded="(true|false)"/g)].map(
        m => m[1]
      );
      expect(expanded).toEqual(['false', 'true', 'false']);
    });
  });

  describe('types', () => {
    it('ties the shape of value and onChange to multiple', () => {
      const single = (value: number | null) => value;
      const many = (value: number[]) => value;
      render(
        <>
          <Collapses value={0} onChange={single} />
          <Collapses multiple value={[0]} onChange={many} />
          {/* @ts-expect-error an array of indexes needs `multiple` */}
          <Collapses value={[0]} />
          {/* @ts-expect-error `multiple` takes an array, not an index */}
          <Collapses multiple value={0} />
          {/* @ts-expect-error single mode reports an index, not an array */}
          <Collapses onChange={many} />
        </>
      );
      expect(document.querySelectorAll('.collapses')).toHaveLength(5);
    });
  });

  describe('Compound components', () => {
    it('exposes Collapse as a compound static', () => {
      expect(Collapses.Collapse).toBe(Collapse);
    });

    it('renders items through the dot path', () => {
      render(
        <Collapses defaultValue={0}>
          <Collapses.Collapse trigger="A">Panel A</Collapses.Collapse>
          <Collapses.Collapse trigger="B">Panel B</Collapses.Collapse>
        </Collapses>
      );
      expect(openNames()).toEqual(['A']);
      fireEvent.click(trigger('B'));
      expect(openNames()).toEqual(['B']);
    });

    it('sets its displayName', () => {
      expect(Collapses.displayName).toBe('Collapses');
    });
  });
});
