import React, { createRef, useState } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { createPortal } from 'react-dom';
import { hydrateRoot } from 'react-dom/client';
import {
  SegmentedControl,
  type SegmentedControlColor,
  type SegmentedControlProps,
} from '../SegmentedControl';
import type { ToggleButtonColor } from '../../elements/ToggleButton';
import { ConfigProvider } from '../../helpers/Config';
import { resetDevWarnings } from '../../helpers/devWarnings';

/** Whether two types are the same, both ways round. */
type Same<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

const radio = (name: string) => screen.getByRole('radio', { name });
const group = () => screen.getByRole('radiogroup');

/** The segments' tabIndex values, in order. */
const tabIndexes = () =>
  screen.getAllByRole('radio').map(segment => segment.tabIndex);

/** Which segments are checked, in order. */
const checkedStates = () =>
  screen
    .getAllByRole('radio')
    .map(segment => segment.getAttribute('aria-checked'));

type AlignmentProps = Partial<SegmentedControlProps> & {
  disabled?: string[];
};

/** A group of four segments, any of which can be disabled by value. */
function Alignment({ disabled = [], ...props }: AlignmentProps) {
  return (
    <SegmentedControl aria-label="Text alignment" {...props}>
      {['left', 'center', 'right', 'justify'].map(value => (
        <SegmentedControl.Segment
          key={value}
          value={value}
          isDisabled={disabled.includes(value)}
        >
          {value[0].toUpperCase() + value.slice(1)}
        </SegmentedControl.Segment>
      ))}
    </SegmentedControl>
  );
}

let warnSpy: jest.SpyInstance;

beforeEach(() => {
  resetDevWarnings();
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe('SegmentedControl', () => {
  describe('what it renders', () => {
    it('renders a radiogroup that is Bulma’s .buttons.has-addons row', () => {
      render(<Alignment />);
      expect(group().tagName).toBe('DIV');
      expect(group()).toHaveClass('buttons', 'has-addons');
    });

    it('renders each segment as a <button type="button" role="radio">', () => {
      render(<Alignment defaultValue="left" />);
      const segments = screen.getAllByRole('radio');
      expect(segments).toHaveLength(4);
      for (const segment of segments) {
        expect(segment.tagName).toBe('BUTTON');
        expect(segment).toHaveAttribute('type', 'button');
        expect(segment).toHaveClass('button');
        expect(segment).not.toHaveAttribute('aria-pressed');
      }
    });

    it('marks the checked segment aria-checked="true" and the rest "false"', () => {
      render(<Alignment defaultValue="center" />);
      expect(checkedStates()).toEqual(['false', 'true', 'false', 'false']);
      expect(screen.getByRole('radio', { checked: true })).toBe(
        radio('Center')
      );
    });

    it('checks nothing without a value or defaultValue', () => {
      render(<Alignment />);
      expect(checkedStates()).toEqual(['false', 'false', 'false', 'false']);
    });

    it('stays a radiogroup whatever a spread passes along', () => {
      const untyped = { role: 'toolbar' } as Record<string, unknown>;
      render(<Alignment {...untyped} />);
      expect(group()).toBeInTheDocument();
      expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    });

    it('passes other attributes and the helper props through to the row', () => {
      render(
        <Alignment id="align" data-testid="align" mt="2" className="custom" />
      );
      const row = screen.getByTestId('align');
      expect(row).toBe(group());
      expect(row).toHaveAttribute('id', 'align');
      expect(row).toHaveClass('buttons', 'mt-2', 'custom');
    });

    it('passes attributes and helper props through to a segment', () => {
      render(
        <SegmentedControl aria-label="View">
          <SegmentedControl.Segment
            value="list"
            title="Show a list"
            data-testid="list"
            px="5"
            className="custom"
          >
            List
          </SegmentedControl.Segment>
        </SegmentedControl>
      );
      const segment = screen.getByTestId('list');
      expect(segment).toHaveAttribute('title', 'Show a list');
      expect(segment).toHaveClass('button', 'px-5', 'custom');
      expect(segment).not.toHaveAttribute('value');
    });

    it('has displayNames for dev tools', () => {
      expect(SegmentedControl.displayName).toBe('SegmentedControl');
      expect(SegmentedControl.Segment.displayName).toBe(
        'SegmentedControl.Segment'
      );
    });
  });

  describe('its accessible name', () => {
    it('passes aria-label through to the radiogroup', () => {
      render(<Alignment />);
      expect(
        screen.getByRole('radiogroup', { name: 'Text alignment' })
      ).toBeInTheDocument();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('passes aria-labelledby through to the radiogroup', () => {
      render(
        <>
          <span id="view-label">View</span>
          <SegmentedControl aria-labelledby="view-label">
            <SegmentedControl.Segment value="list">
              List
            </SegmentedControl.Segment>
          </SegmentedControl>
        </>
      );
      expect(
        screen.getByRole('radiogroup', { name: 'View' })
      ).toBeInTheDocument();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('warns once in development when it has neither', () => {
      render(
        <>
          <SegmentedControl>
            <SegmentedControl.Segment value="list">
              List
            </SegmentedControl.Segment>
          </SegmentedControl>
          <SegmentedControl>
            <SegmentedControl.Segment value="grid">
              Grid
            </SegmentedControl.Segment>
          </SegmentedControl>
        </>
      );
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(
        /<SegmentedControl> has no accessible name/
      );
    });

    it('takes the name of each segment from its label', () => {
      render(
        <SegmentedControl aria-label="Text alignment">
          <SegmentedControl.Segment value="left" aria-label="Align left">
            <span aria-hidden="true">L</span>
          </SegmentedControl.Segment>
        </SegmentedControl>
      );
      expect(radio('Align left')).toBeInTheDocument();
    });
  });

  describe('the checked look', () => {
    it('fills the checked segment with is-link and is-selected, and only it', () => {
      render(<Alignment defaultValue="left" />);
      expect(radio('Left')).toHaveClass('button', 'is-link', 'is-selected');
      for (const name of ['Center', 'Right', 'Justify']) {
        expect(radio(name)).not.toHaveClass('is-link');
        expect(radio(name)).not.toHaveClass('is-selected');
      }
    });

    it('fills with color', () => {
      render(<Alignment defaultValue="right" color="primary" />);
      expect(radio('Right')).toHaveClass('is-primary', 'is-selected');
      expect(radio('Right')).not.toHaveClass('is-link');
    });

    it('moves the fill with the check', async () => {
      const user = userEvent.setup();
      render(<Alignment defaultValue="left" />);
      await user.click(radio('Justify'));
      expect(radio('Justify')).toHaveClass('is-link', 'is-selected');
      expect(radio('Left')).not.toHaveClass('is-link');
      expect(radio('Left')).not.toHaveClass('is-selected');
    });

    it('never holds is-active, so hover and the press shade keep working', () => {
      render(<Alignment defaultValue="left" />);
      expect(radio('Left')).not.toHaveClass('is-active');
    });

    it('keeps a checked fill under the disabled look', () => {
      render(<Alignment defaultValue="left" disabled={['left']} />);
      expect(radio('Left')).toBeDisabled();
      expect(radio('Left')).toHaveClass('is-link', 'is-selected');
    });

    it.each(['small', 'medium', 'large'] as const)(
      'sizes every segment with are-%s on the row',
      size => {
        render(<Alignment size={size} />);
        expect(group()).toHaveClass(`are-${size}`);
      }
    );

    it('drops has-addons when hasAddons is false', () => {
      render(<Alignment hasAddons={false} />);
      expect(group()).toHaveClass('buttons');
      expect(group()).not.toHaveClass('has-addons');
    });

    it('takes isCentered and isRight', () => {
      const { rerender } = render(<Alignment isCentered />);
      expect(group()).toHaveClass('is-centered');
      rerender(<Alignment isRight />);
      expect(group()).toHaveClass('is-right');
      expect(group()).not.toHaveClass('is-centered');
    });
  });

  describe('one tab stop (roving tabindex)', () => {
    it('is the checked segment', () => {
      render(<Alignment defaultValue="right" />);
      expect(tabIndexes()).toEqual([-1, -1, 0, -1]);
    });

    it('is the first segment while none is checked', () => {
      render(<Alignment />);
      expect(tabIndexes()).toEqual([0, -1, -1, -1]);
    });

    it('is the first enabled segment while none is checked', () => {
      render(<Alignment disabled={['left', 'center']} />);
      expect(tabIndexes()).toEqual([-1, -1, 0, -1]);
    });

    it('is the first enabled segment when the checked one is disabled', () => {
      render(<Alignment defaultValue="center" disabled={['center']} />);
      expect(tabIndexes()).toEqual([0, -1, -1, -1]);
    });

    it('is the first enabled segment when no segment has the value', () => {
      render(<Alignment value="nowhere" />);
      expect(tabIndexes()).toEqual([0, -1, -1, -1]);
      expect(checkedStates()).toEqual(['false', 'false', 'false', 'false']);
    });

    it('is nothing when every segment is disabled', () => {
      render(<Alignment disabled={['left', 'center', 'right', 'justify']} />);
      expect(tabIndexes()).toEqual([-1, -1, -1, -1]);
    });

    it('takes Tab in at the checked segment and straight back out', async () => {
      const user = userEvent.setup();
      render(
        <>
          <button type="button">Before</button>
          <Alignment defaultValue="right" />
          <button type="button">After</button>
        </>
      );
      await user.tab();
      expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
      await user.tab();
      expect(radio('Right')).toHaveFocus();
      await user.tab();
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
      await user.tab({ shift: true });
      expect(radio('Right')).toHaveFocus();
      await user.tab({ shift: true });
      expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
    });

    it('takes Tab in at the first segment while none is checked, and checks nothing', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<Alignment onChange={onChange} />);
      await user.tab();
      expect(radio('Left')).toHaveFocus();
      expect(checkedStates()).toEqual(['false', 'false', 'false', 'false']);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('follows focus while it is in the row, then goes back to the checked segment', async () => {
      const user = userEvent.setup();
      render(
        <>
          <Alignment value="left" />
          <button type="button">After</button>
        </>
      );
      await user.tab();
      // Controlled and never updated, so the arrow moves focus but not the
      // check. The stop goes with focus, so Tab leaves the row from there.
      await user.keyboard('{ArrowRight}');
      expect(radio('Center')).toHaveFocus();
      expect(radio('Left')).toHaveAttribute('aria-checked', 'true');
      expect(tabIndexes()).toEqual([-1, 0, -1, -1]);
      await user.tab();
      expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
      expect(tabIndexes()).toEqual([0, -1, -1, -1]);
    });

    it('keeps the first segment in the page as the stop when one is added before it', () => {
      const { rerender } = render(
        <SegmentedControl aria-label="View">
          <SegmentedControl.Segment value="grid">Grid</SegmentedControl.Segment>
          <SegmentedControl.Segment value="board">
            Board
          </SegmentedControl.Segment>
        </SegmentedControl>
      );
      expect(radio('Grid')).toHaveAttribute('tabindex', '0');
      rerender(
        <SegmentedControl aria-label="View">
          <SegmentedControl.Segment value="list">List</SegmentedControl.Segment>
          <SegmentedControl.Segment value="grid">Grid</SegmentedControl.Segment>
          <SegmentedControl.Segment value="board">
            Board
          </SegmentedControl.Segment>
        </SegmentedControl>
      );
      expect(radio('List')).toHaveAttribute('tabindex', '0');
      expect(radio('Grid')).toHaveAttribute('tabindex', '-1');
    });

    it('moves the stop on when the segment holding it goes away', () => {
      const { rerender } = render(
        <SegmentedControl aria-label="View">
          <SegmentedControl.Segment value="list">List</SegmentedControl.Segment>
          <SegmentedControl.Segment value="grid">Grid</SegmentedControl.Segment>
        </SegmentedControl>
      );
      expect(radio('List')).toHaveAttribute('tabindex', '0');
      rerender(
        <SegmentedControl aria-label="View">
          <SegmentedControl.Segment value="grid">Grid</SegmentedControl.Segment>
        </SegmentedControl>
      );
      expect(radio('Grid')).toHaveAttribute('tabindex', '0');
    });

    it('moves the stop to the new first segment when keyed segments are reordered', () => {
      const Row = ({ order }: { order: string[] }) => (
        <SegmentedControl aria-label="View">
          {order.map(value => (
            <SegmentedControl.Segment key={value} value={value}>
              {value}
            </SegmentedControl.Segment>
          ))}
        </SegmentedControl>
      );
      const { rerender } = render(<Row order={['list', 'grid', 'board']} />);
      expect(tabIndexes()).toEqual([0, -1, -1]);
      expect(radio('list')).toHaveAttribute('tabindex', '0');

      // Same segments, same keys, new order: nothing mounts or unmounts.
      rerender(<Row order={['board', 'list', 'grid']} />);
      expect(screen.getAllByRole('radio').map(s => s.textContent)).toEqual([
        'board',
        'list',
        'grid',
      ]);
      expect(tabIndexes()).toEqual([0, -1, -1]);
      expect(radio('board')).toHaveAttribute('tabindex', '0');
    });
  });

  describe('the keyboard', () => {
    it.each([
      ['ArrowRight', '{ArrowRight}'],
      ['ArrowDown', '{ArrowDown}'],
    ])('%s moves to the next segment and checks it', async (_key, keys) => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<Alignment defaultValue="left" onChange={onChange} />);
      await user.tab();
      await user.keyboard(keys);
      expect(radio('Center')).toHaveFocus();
      expect(checkedStates()).toEqual(['false', 'true', 'false', 'false']);
      expect(tabIndexes()).toEqual([-1, 0, -1, -1]);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('center');
    });

    it.each([
      ['ArrowLeft', '{ArrowLeft}'],
      ['ArrowUp', '{ArrowUp}'],
    ])('%s moves to the previous segment and checks it', async (_key, keys) => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<Alignment defaultValue="right" onChange={onChange} />);
      await user.tab();
      await user.keyboard(keys);
      expect(radio('Center')).toHaveFocus();
      expect(checkedStates()).toEqual(['false', 'true', 'false', 'false']);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('center');
    });

    it('wraps from the last segment to the first', async () => {
      const user = userEvent.setup();
      render(<Alignment defaultValue="justify" />);
      await user.tab();
      await user.keyboard('{ArrowRight}');
      expect(radio('Left')).toHaveFocus();
      expect(radio('Left')).toHaveAttribute('aria-checked', 'true');
    });

    it('wraps from the first segment to the last', async () => {
      const user = userEvent.setup();
      render(<Alignment defaultValue="left" />);
      await user.tab();
      await user.keyboard('{ArrowLeft}');
      expect(radio('Justify')).toHaveFocus();
      expect(radio('Justify')).toHaveAttribute('aria-checked', 'true');
    });

    it('skips disabled segments, wrapping included', async () => {
      const user = userEvent.setup();
      render(
        <Alignment defaultValue="left" disabled={['center', 'justify']} />
      );
      await user.tab();
      await user.keyboard('{ArrowRight}');
      expect(radio('Right')).toHaveFocus();
      expect(radio('Right')).toHaveAttribute('aria-checked', 'true');
      await user.keyboard('{ArrowRight}');
      expect(radio('Left')).toHaveFocus();
      await user.keyboard('{ArrowLeft}');
      expect(radio('Right')).toHaveFocus();
      await user.keyboard('{ArrowUp}');
      expect(radio('Left')).toHaveFocus();
      expect(radio('Left')).toHaveAttribute('aria-checked', 'true');
    });

    it('Home and End go to the first and last enabled segment and check them', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <Alignment
          defaultValue="center"
          disabled={['left']}
          onChange={onChange}
        />
      );
      await user.tab();
      await user.keyboard('{End}');
      expect(radio('Justify')).toHaveFocus();
      expect(radio('Justify')).toHaveAttribute('aria-checked', 'true');
      await user.keyboard('{Home}');
      expect(radio('Center')).toHaveFocus();
      expect(radio('Center')).toHaveAttribute('aria-checked', 'true');
      expect(onChange.mock.calls).toEqual([['justify'], ['center']]);
    });

    it('stays put on an arrow when it is the only enabled segment', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <Alignment
          defaultValue="center"
          disabled={['left', 'right', 'justify']}
          onChange={onChange}
        />
      );
      await user.tab();
      await user.keyboard('{ArrowRight}{ArrowLeft}{Home}{End}');
      expect(radio('Center')).toHaveFocus();
      expect(radio('Center')).toHaveAttribute('aria-checked', 'true');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does nothing for a key on a segment when none is enabled', () => {
      render(<Alignment disabled={['left', 'center', 'right', 'justify']} />);
      for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) {
        const event = fireEvent.keyDown(radio('Left'), { key });
        expect(event).toBe(true);
      }
      expect(checkedStates()).toEqual(['false', 'false', 'false', 'false']);
    });

    it('leaves the keys alone on a segment portaled out of its row, and still lets a click check it', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <SegmentedControl
          aria-label="View"
          defaultValue="list"
          onChange={onChange}
        >
          <SegmentedControl.Segment value="list">List</SegmentedControl.Segment>
          {createPortal(
            <SegmentedControl.Segment value="grid">
              Grid
            </SegmentedControl.Segment>,
            document.body
          )}
        </SegmentedControl>
      );
      expect(group()).not.toContainElement(radio('Grid'));
      // A throw in a React handler is reported, not thrown back to the test.
      const errors: unknown[] = [];
      const onError = (event: ErrorEvent) => {
        event.preventDefault();
        errors.push(event.error);
      };
      window.addEventListener('error', onError);
      const errorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      try {
        act(() => radio('Grid').focus());
        for (const key of ['ArrowRight', 'ArrowLeft', 'Home', 'End']) {
          expect(fireEvent.keyDown(radio('Grid'), { key })).toBe(true);
        }
        expect(errors).toEqual([]);
        expect(errorSpy).not.toHaveBeenCalled();
      } finally {
        window.removeEventListener('error', onError);
        errorSpy.mockRestore();
      }
      expect(radio('Grid')).toHaveFocus();
      expect(onChange).not.toHaveBeenCalled();
      await user.click(radio('Grid'));
      expect(onChange).toHaveBeenCalledWith('grid');
      expect(radio('Grid')).toHaveAttribute('aria-checked', 'true');
    });

    it.each([
      ['Space', ' '],
      ['Enter', '{Enter}'],
    ])(
      '%s checks the focused segment when none is checked',
      async (_key, keys) => {
        const user = userEvent.setup();
        const onChange = jest.fn();
        render(<Alignment onChange={onChange} />);
        await user.tab();
        await user.keyboard(keys);
        expect(radio('Left')).toHaveAttribute('aria-checked', 'true');
        expect(radio('Left')).toHaveFocus();
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('left');
      }
    );

    it('leaves other keys and modified arrows alone', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<Alignment defaultValue="left" onChange={onChange} />);
      await user.tab();
      await user.keyboard('a');
      await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
      await user.keyboard('{Control>}{ArrowRight}{/Control}');
      await user.keyboard('{Meta>}{ArrowRight}{/Meta}');
      expect(radio('Left')).toHaveFocus();
      expect(onChange).not.toHaveBeenCalled();
      expect(fireEvent.keyDown(radio('Left'), { key: 'PageDown' })).toBe(true);
    });

    it('prevents the default of a key it handles, so the page does not scroll', () => {
      render(<Alignment defaultValue="left" />);
      expect(fireEvent.keyDown(radio('Left'), { key: 'ArrowDown' })).toBe(
        false
      );
    });

    describe('what reaches a listener above the row', () => {
      let seen: string[];
      const listener = (event: KeyboardEvent) => seen.push(event.key);

      beforeEach(() => {
        seen = [];
        document.addEventListener('keydown', listener);
      });

      afterEach(() => {
        document.removeEventListener('keydown', listener);
      });

      it.each([
        'ArrowRight',
        'ArrowLeft',
        'ArrowDown',
        'ArrowUp',
        'Home',
        'End',
      ])('stops %s, a key the row takes', async key => {
        const user = userEvent.setup();
        render(<Alignment defaultValue="center" />);
        await user.tab();
        seen = [];
        await user.keyboard(`{${key}}`);
        expect(radio('Center')).not.toHaveFocus();
        expect(seen).toEqual([]);
      });

      it('lets a key the row leaves alone bubble on', async () => {
        const user = userEvent.setup();
        render(<Alignment defaultValue="center" />);
        await user.tab();
        seen = [];
        await user.keyboard('a');
        await user.keyboard('{Escape}');
        await user.keyboard('{Alt>}{ArrowRight}{/Alt}');
        expect(radio('Center')).toHaveFocus();
        expect(seen).toEqual(['a', 'Escape', 'Alt', 'ArrowRight']);
      });

      it('lets an arrow bubble on when it finds no segment to move to', () => {
        render(<Alignment disabled={['left', 'center', 'right', 'justify']} />);
        fireEvent.keyDown(radio('Left'), { key: 'ArrowRight' });
        expect(seen).toEqual(['ArrowRight']);
      });
    });

    it('runs a segment’s onKeyDown first, and a preventDefault there claims the key', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const onKeyDown = jest.fn((event: React.KeyboardEvent) => {
        if (event.key === 'ArrowRight') event.preventDefault();
      });
      render(
        <SegmentedControl
          aria-label="View"
          defaultValue="list"
          onChange={onChange}
        >
          <SegmentedControl.Segment value="list" onKeyDown={onKeyDown}>
            List
          </SegmentedControl.Segment>
          <SegmentedControl.Segment value="grid">Grid</SegmentedControl.Segment>
        </SegmentedControl>
      );
      await user.tab();
      await user.keyboard('{ArrowRight}');
      expect(onKeyDown).toHaveBeenCalled();
      expect(radio('List')).toHaveFocus();
      expect(onChange).not.toHaveBeenCalled();
      await user.keyboard('{ArrowLeft}');
      expect(radio('Grid')).toHaveFocus();
      expect(onChange).toHaveBeenCalledWith('grid');
    });

    it('checks through a click on the segment, so its onClick sees the arrow keys', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      render(
        <SegmentedControl aria-label="View" defaultValue="list">
          <SegmentedControl.Segment value="list">List</SegmentedControl.Segment>
          <SegmentedControl.Segment value="grid" onClick={onClick}>
            Grid
          </SegmentedControl.Segment>
        </SegmentedControl>
      );
      await user.tab();
      await user.keyboard('{ArrowRight}');
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('works from the keyboard inside a row nested in other markup', async () => {
      const user = userEvent.setup();
      render(
        <SegmentedControl aria-label="View" defaultValue="list">
          <span>
            <SegmentedControl.Segment value="list">
              List
            </SegmentedControl.Segment>
          </span>
          <span>
            <SegmentedControl.Segment value="grid">
              Grid
            </SegmentedControl.Segment>
          </span>
        </SegmentedControl>
      );
      await user.tab();
      await user.keyboard('{ArrowRight}');
      expect(radio('Grid')).toHaveFocus();
      expect(radio('Grid')).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('holding its own state', () => {
    it('checks a clicked segment and reports it once', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<Alignment defaultValue="left" onChange={onChange} />);
      await user.click(radio('Right'));
      expect(checkedStates()).toEqual(['false', 'false', 'true', 'false']);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith('right');
    });

    it('can’t be cleared: pressing the checked segment keeps it checked and reports nothing', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<Alignment defaultValue="left" onChange={onChange} />);
      await user.click(radio('Left'));
      await user.keyboard(' ');
      await user.keyboard('{Enter}');
      expect(radio('Left')).toHaveAttribute('aria-checked', 'true');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('reports once per change across clicks and keys', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<Alignment onChange={onChange} />);
      await user.click(radio('Center'));
      await user.click(radio('Center'));
      await user.keyboard('{ArrowRight}');
      await user.keyboard(' ');
      await user.keyboard('{Home}');
      expect(onChange.mock.calls).toEqual([['center'], ['right'], ['left']]);
    });
  });

  describe('when you hold the state', () => {
    it('asks for the change and changes nothing until value does', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const { rerender } = render(
        <Alignment value="left" onChange={onChange} />
      );
      await user.click(radio('Right'));
      expect(onChange).toHaveBeenCalledWith('right');
      expect(radio('Left')).toHaveAttribute('aria-checked', 'true');
      expect(radio('Right')).toHaveAttribute('aria-checked', 'false');

      rerender(<Alignment value="right" onChange={onChange} />);
      expect(radio('Right')).toHaveAttribute('aria-checked', 'true');
      expect(radio('Left')).toHaveAttribute('aria-checked', 'false');
    });

    it('follows value when it is wired to the caller’s state', async () => {
      const user = userEvent.setup();
      function Calendar() {
        const [range, setRange] = useState('week');
        return (
          <>
            <SegmentedControl
              aria-label="Range"
              value={range}
              onChange={setRange}
            >
              <SegmentedControl.Segment value="day">
                Day
              </SegmentedControl.Segment>
              <SegmentedControl.Segment value="week">
                Week
              </SegmentedControl.Segment>
              <SegmentedControl.Segment value="month">
                Month
              </SegmentedControl.Segment>
            </SegmentedControl>
            <p>Showing a {range}</p>
          </>
        );
      }
      render(<Calendar />);
      await user.click(radio('Month'));
      expect(radio('Month')).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByText('Showing a month')).toBeInTheDocument();
      await user.keyboard('{ArrowLeft}');
      expect(radio('Week')).toHaveFocus();
      expect(radio('Week')).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByText('Showing a week')).toBeInTheDocument();
    });

    it('checks nothing while value is null, and still reports a pick', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(<Alignment value={null} onChange={onChange} />);
      expect(checkedStates()).toEqual(['false', 'false', 'false', 'false']);
      expect(tabIndexes()).toEqual([0, -1, -1, -1]);
      await user.click(radio('Center'));
      expect(onChange).toHaveBeenCalledWith('center');
      expect(radio('Center')).toHaveAttribute('aria-checked', 'false');
    });

    it('ignores defaultValue once value is set', () => {
      render(<Alignment value="right" defaultValue="left" />);
      expect(checkedStates()).toEqual(['false', 'false', 'true', 'false']);
    });
  });

  describe('onClick', () => {
    it('runs before the check', async () => {
      const user = userEvent.setup();
      const calls: string[] = [];
      render(
        <SegmentedControl
          aria-label="View"
          defaultValue="list"
          onChange={value => calls.push(`change to ${value}`)}
        >
          <SegmentedControl.Segment value="list">List</SegmentedControl.Segment>
          <SegmentedControl.Segment
            value="grid"
            onClick={event =>
              calls.push(
                `click while ${event.currentTarget.getAttribute('aria-checked')}`
              )
            }
          >
            Grid
          </SegmentedControl.Segment>
        </SegmentedControl>
      );
      await user.click(radio('Grid'));
      expect(calls).toEqual(['click while false', 'change to grid']);
    });

    it('stops the check when it calls preventDefault()', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <SegmentedControl
          aria-label="View"
          defaultValue="list"
          onChange={onChange}
        >
          <SegmentedControl.Segment value="list">List</SegmentedControl.Segment>
          <SegmentedControl.Segment
            value="grid"
            onClick={event => event.preventDefault()}
          >
            Grid
          </SegmentedControl.Segment>
        </SegmentedControl>
      );
      await user.click(radio('Grid'));
      expect(radio('List')).toHaveAttribute('aria-checked', 'true');
      await user.keyboard('{ArrowLeft}');
      expect(radio('List')).toHaveFocus();
      await user.keyboard('{ArrowRight}');
      expect(radio('Grid')).toHaveFocus();
      expect(radio('Grid')).toHaveAttribute('aria-checked', 'false');
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('disabled segments', () => {
    it.each([
      ['isDisabled', { isDisabled: true }],
      ['disabled', { disabled: true }],
    ])('with %s, a segment can’t be clicked or reached', async (_p, off) => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      render(
        <SegmentedControl
          aria-label="View"
          defaultValue="list"
          onChange={onChange}
        >
          <SegmentedControl.Segment value="list">List</SegmentedControl.Segment>
          <SegmentedControl.Segment value="grid" {...off}>
            Grid
          </SegmentedControl.Segment>
        </SegmentedControl>
      );
      expect(radio('Grid')).toBeDisabled();
      expect(radio('Grid')).toHaveClass('is-disabled');
      fireEvent.click(radio('Grid'));
      await user.click(radio('Grid'));
      await user.tab();
      await user.keyboard('{ArrowRight}');
      expect(radio('List')).toHaveFocus();
      expect(onChange).not.toHaveBeenCalled();
    });

    it('follows a segment that turns disabled and back', () => {
      const { rerender } = render(<Alignment />);
      expect(tabIndexes()).toEqual([0, -1, -1, -1]);
      rerender(<Alignment disabled={['left']} />);
      expect(tabIndexes()).toEqual([-1, 0, -1, -1]);
      rerender(<Alignment />);
      expect(tabIndexes()).toEqual([0, -1, -1, -1]);
    });
  });

  describe('refs', () => {
    it('forwards the group’s ref to the row <div>', () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <SegmentedControl ref={ref} aria-label="View">
          <SegmentedControl.Segment value="list">List</SegmentedControl.Segment>
        </SegmentedControl>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toBe(group());
    });

    it('forwards a segment’s object ref to its <button>', () => {
      const ref = createRef<HTMLButtonElement>();
      render(
        <SegmentedControl aria-label="View">
          <SegmentedControl.Segment ref={ref} value="list">
            List
          </SegmentedControl.Segment>
        </SegmentedControl>
      );
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toBe(radio('List'));
    });

    it('forwards a segment’s callback ref to its <button>', () => {
      const ref = jest.fn();
      const { unmount } = render(
        <SegmentedControl aria-label="View">
          <SegmentedControl.Segment ref={ref} value="list">
            List
          </SegmentedControl.Segment>
        </SegmentedControl>
      );
      expect(ref).toHaveBeenCalledWith(radio('List'));
      unmount();
      expect(ref).toHaveBeenLastCalledWith(null);
    });
  });

  describe('Compound components', () => {
    it('attaches Segment as a static', () => {
      expect(SegmentedControl.Segment).toBeDefined();
    });

    it('renders through the dot path', () => {
      render(
        <SegmentedControl aria-label="Billing" defaultValue="monthly">
          <SegmentedControl.Segment value="monthly">
            Monthly
          </SegmentedControl.Segment>
          <SegmentedControl.Segment value="yearly">
            Yearly
          </SegmentedControl.Segment>
        </SegmentedControl>
      );
      expect(
        screen.getByRole('radiogroup', { name: 'Billing' })
      ).toContainElement(radio('Monthly'));
      expect(radio('Monthly')).toHaveAttribute('aria-checked', 'true');
    });
  });

  describe('a segment outside a group', () => {
    it('renders an unchecked radio button that nothing can check, and warns', async () => {
      const user = userEvent.setup();
      const onClick = jest.fn();
      render(
        <SegmentedControl.Segment value="list" onClick={onClick}>
          List
        </SegmentedControl.Segment>
      );
      expect(radio('List')).toHaveAttribute('aria-checked', 'false');
      expect(radio('List')).not.toHaveAttribute('tabindex');
      await user.click(radio('List'));
      await user.keyboard('{ArrowRight}');
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(radio('List')).toHaveAttribute('aria-checked', 'false');
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringMatching(/is outside a <SegmentedControl>/)
      );
    });
  });

  describe('inside a form', () => {
    it('never submits it and carries no value', async () => {
      const user = userEvent.setup();
      const onSubmit = jest.fn((event: React.FormEvent) =>
        event.preventDefault()
      );
      render(
        <form onSubmit={onSubmit} aria-label="Settings">
          <Alignment defaultValue="left" />
        </form>
      );
      await user.click(radio('Right'));
      await user.keyboard('{Enter}');
      expect(onSubmit).not.toHaveBeenCalled();
      const form = screen.getByRole('form', { name: 'Settings' });
      expect([...new FormData(form as HTMLFormElement).keys()]).toEqual([]);
    });
  });

  describe('props it leaves out', () => {
    it('takes the same colors as ToggleButton', () => {
      // Checked by `typecheck:tests`.
      const same: Same<SegmentedControlColor, ToggleButtonColor> = true;
      expect(same).toBe(true);
    });

    it('rejects them at the type level', () => {
      render(
        <SegmentedControl aria-label="Rejected">
          {/* @ts-expect-error: always a button */}
          <SegmentedControl.Segment value="a" as="a">
            A
          </SegmentedControl.Segment>
          {/* @ts-expect-error: always type="button" */}
          <SegmentedControl.Segment value="b" type="submit">
            B
          </SegmentedControl.Segment>
          {/* @ts-expect-error: always role="radio" */}
          <SegmentedControl.Segment value="c" role="tab">
            C
          </SegmentedControl.Segment>
          {/* @ts-expect-error: the group decides the tab stop */}
          <SegmentedControl.Segment value="d" tabIndex={0}>
            D
          </SegmentedControl.Segment>
          {/* @ts-expect-error: aria-checked follows the group's value */}
          <SegmentedControl.Segment value="e" aria-checked="mixed">
            E
          </SegmentedControl.Segment>
          {/* @ts-expect-error: a radio says checked, not pressed */}
          <SegmentedControl.Segment value="f" aria-pressed>
            F
          </SegmentedControl.Segment>
          {/* @ts-expect-error: the group sets the fill */}
          <SegmentedControl.Segment value="g" color="primary">
            G
          </SegmentedControl.Segment>
          {/* @ts-expect-error: the row sets the size */}
          <SegmentedControl.Segment value="h" size="small">
            H
          </SegmentedControl.Segment>
          {/* @ts-expect-error: the check replaces isActive */}
          <SegmentedControl.Segment value="i" isActive>
            I
          </SegmentedControl.Segment>
          {/* @ts-expect-error: a segment you couldn't pick */}
          <SegmentedControl.Segment value="j" isLoading>
            J
          </SegmentedControl.Segment>
          {/* @ts-expect-error: an outline colors both states */}
          <SegmentedControl.Segment value="k" isOutlined>
            K
          </SegmentedControl.Segment>
          {/* @ts-expect-error: a segment needs a value */}
          <SegmentedControl.Segment>L</SegmentedControl.Segment>
        </SegmentedControl>
      );
      expect(screen.getAllByRole('radio')).toHaveLength(12);
    });

    it('rejects a group color outside the fills at the type level', () => {
      render(
        <>
          {/* @ts-expect-error: white fills like a plain button in a light theme */}
          <SegmentedControl aria-label="White" color="white" />
          {/* @ts-expect-error: the role is the group's */}
          <SegmentedControl aria-label="Role" role="toolbar" />
          {/* @ts-expect-error: onChange reports a value, not an event */}
          <SegmentedControl aria-label="Event" onChange={(e: Event) => e} />
        </>
      );
      expect(screen.getAllByRole('radiogroup')).toHaveLength(3);
    });

    it('stays a checked-or-not radio button whatever a spread passes along', () => {
      const untyped = {
        as: 'a',
        href: '#list',
        type: 'submit',
        role: 'tab',
        tabIndex: 5,
        'aria-checked': 'mixed',
        'aria-pressed': 'true',
      } as Record<string, unknown>;
      render(
        <SegmentedControl aria-label="View" defaultValue="list">
          <SegmentedControl.Segment value="list" {...untyped}>
            List
          </SegmentedControl.Segment>
        </SegmentedControl>
      );
      expect(radio('List').tagName).toBe('BUTTON');
      expect(radio('List')).toHaveAttribute('type', 'button');
      expect(radio('List')).toHaveAttribute('aria-checked', 'true');
      expect(radio('List')).toHaveAttribute('tabindex', '0');
    });
  });

  it('applies classPrefix when provided via ConfigProvider', () => {
    render(
      <ConfigProvider classPrefix="bestax-">
        <Alignment defaultValue="left" size="small" mt="2" />
      </ConfigProvider>
    );
    expect(group()).toHaveClass(
      'bestax-buttons',
      'bestax-has-addons',
      'bestax-are-small',
      'bestax-mt-2'
    );
    expect(group()).not.toHaveClass('buttons');
    expect(radio('Left')).toHaveClass(
      'bestax-button',
      'bestax-is-link',
      'bestax-is-selected'
    );
    expect(radio('Left')).not.toHaveClass('is-selected');
  });

  describe('server rendering', () => {
    it('renders the checked segment and its tab stop in the server markup', () => {
      const html = renderToString(<Alignment defaultValue="center" />);
      expect(html).toContain('role="radiogroup"');
      expect(html).toContain('aria-label="Text alignment"');
      expect(html.match(/role="radio"/g)).toHaveLength(4);
      expect(html.match(/aria-checked="true"/g)).toHaveLength(1);
      expect(html.match(/tabindex="0"/g)).toHaveLength(1);
      expect(html).toContain(
        '<button class="button is-link is-selected" type="button" role="radio" aria-checked="true" tabindex="0">Center</button>'
      );
    });

    it('hydrates without a mismatch, then moves the check with the keys', async () => {
      const ui = <Alignment defaultValue="left" />;
      const container = document.createElement('div');
      container.innerHTML = renderToString(ui);
      document.body.appendChild(container);
      const errorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      let root: ReturnType<typeof hydrateRoot> | undefined;
      try {
        await act(async () => {
          root = hydrateRoot(container, ui);
        });
        expect(errorSpy).not.toHaveBeenCalled();
        const [left, center] = Array.from(
          container.querySelectorAll<HTMLButtonElement>('[role="radio"]')
        );
        act(() => left.focus());
        await act(async () => {
          fireEvent.keyDown(left, { key: 'ArrowRight' });
        });
        expect(center).toHaveAttribute('aria-checked', 'true');
        expect(document.activeElement).toBe(center);
      } finally {
        errorSpy.mockRestore();
        await act(async () => root!.unmount());
        container.remove();
      }
    });
  });
});
