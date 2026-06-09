import React, { useCallback, useRef, useState } from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import { useSegmentedEntry } from '../_pickerInternals/useSegmentedEntry';
import {
  formatTime,
  parseTime,
  DateFormatOption,
} from '../_pickerInternals/formatters';

const at = (h: number, m: number) => {
  const d = new Date(2026, 0, 1);
  d.setHours(h, m, 0, 0);
  return d;
};

interface HarnessProps {
  format?: DateFormatOption;
  editable?: boolean;
  popover?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  initial?: Date | null;
  onChange?: (d: Date | null) => void;
  // Left undefined by default so the hook's own defaults (openOnFocus=true,
  // closeOnSelect=false) engage — exercising the default-parameter branches.
  openOnFocus?: boolean;
  closeOnSelect?: boolean;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onClick?: React.MouseEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  withSibling?: boolean;
}

// Minimal picker that exercises the hook against a real <input>. State is
// reflected onto data-* attributes so tests can assert the hook's contract.
const Harness: React.FC<HarnessProps> = ({
  format = 'HH:mm',
  editable,
  popover,
  disabled,
  readOnly,
  initial = null,
  onChange,
  openOnFocus,
  closeOnSelect,
  onFocus,
  onClick,
  onKeyDown,
  onBlur,
  withSibling,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState<Date | null>(initial);
  const [text, setText] = useState<string>(
    value ? formatTime(value, format) : ''
  );
  const [open, setOpen] = useState(false);

  const makeBaseDate = useCallback((): Date => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  }, []);
  const commitValue = useCallback(
    (d: Date | null) => {
      setValue(d);
      onChange?.(d);
    },
    [onChange]
  );
  const tryParse = useCallback(
    (s: string) => parseTime(s, typeof format === 'string' ? format : 'HH:mm'),
    [format]
  );

  const {
    inputHandlers,
    segmentEditable,
    activeSegmentIdx,
    inSegmentMode,
    segmentMap,
  } = useSegmentedEntry({
    format,
    value,
    commitValue,
    formatFn: formatTime,
    tryParse,
    text,
    setText,
    makeBaseDate,
    disabled,
    readOnly,
    editable,
    popover,
    openOnFocus,
    closeOnSelect,
    isOpen: open,
    setOpen,
    inputRef,
    containerRef,
    onFocus,
    onClick,
    onKeyDown,
    onBlur,
  });

  return (
    <div ref={containerRef}>
      <input
        ref={inputRef}
        data-testid="seg"
        data-active={
          activeSegmentIdx === null ? 'none' : String(activeSegmentIdx)
        }
        data-editable={String(segmentEditable)}
        data-inseg={String(inSegmentMode)}
        data-hasmap={String(segmentMap !== null)}
        data-open={String(open)}
        value={text}
        readOnly={!!readOnly || !(editable ?? true)}
        {...inputHandlers}
      />
      {withSibling && <button data-testid="sibling">sibling</button>}
    </div>
  );
};

const focusSeg = (input: HTMLInputElement) => {
  act(() => {
    input.focus();
  });
};

describe('useSegmentedEntry', () => {
  it('builds a null segment map for Intl-options formats (no segment mode)', () => {
    const { getByTestId } = render(
      <Harness
        format={{ hour: '2-digit', minute: '2-digit' }}
        initial={at(13, 45)}
      />
    );
    const input = getByTestId('seg') as HTMLInputElement;
    expect(input.dataset.hasmap).toBe('false');
    expect(input.dataset.editable).toBe('false');
    focusSeg(input);
    expect(input.dataset.active).toBe('none');
  });

  it('disables segment mode when editable=false / disabled / readOnly', () => {
    const cases: HarnessProps[] = [
      { editable: false },
      { disabled: true },
      { readOnly: true },
    ];
    cases.forEach(props => {
      const { getByTestId, unmount } = render(
        <Harness initial={at(13, 45)} {...props} />
      );
      const input = getByTestId('seg') as HTMLInputElement;
      expect(input.dataset.editable).toBe('false');
      focusSeg(input);
      expect(input.dataset.active).toBe('none');
      unmount();
    });
  });

  it('selects the first editable segment on focus and applies the selection range', () => {
    const { getByTestId } = render(<Harness initial={at(13, 45)} />);
    const input = getByTestId('seg') as HTMLInputElement;
    focusSeg(input);
    expect(input.dataset.active).toBe('0');
    expect(input.dataset.inseg).toBe('true');
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, 2]);
  });

  it('clamps moveSegment at both ends (no wrap)', () => {
    const { getByTestId } = render(<Harness initial={at(13, 45)} />);
    const input = getByTestId('seg') as HTMLInputElement;
    focusSeg(input);
    // At the first segment, ArrowLeft stays put.
    fireEvent.keyDown(input, { key: 'ArrowLeft' });
    expect(input.dataset.active).toBe('0');
    // Move to the last editable segment, then ArrowRight stays put.
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect(input.dataset.active).toBe('2'); // minutes index in HH:mm
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect(input.dataset.active).toBe('2');
  });

  it('resets the typed-digit buffer on Backspace', () => {
    const { getByTestId } = render(<Harness initial={at(13, 45)} />);
    const input = getByTestId('seg') as HTMLInputElement;
    focusSeg(input);
    fireEvent.keyDown(input, { key: '1' }); // buffer "1" → 01:45 (no advance)
    fireEvent.keyDown(input, { key: 'Backspace' }); // clears buffer, stays on hours
    fireEvent.keyDown(input, { key: '2' }); // fresh buffer "2" → 02, not "12"
    expect(input.value.slice(0, 2)).toBe('02');
  });

  it('advances on a typed separator without inserting it', () => {
    const { getByTestId } = render(<Harness initial={at(13, 45)} />);
    const input = getByTestId('seg') as HTMLInputElement;
    focusSeg(input);
    fireEvent.keyDown(input, { key: ':' });
    expect(input.dataset.active).toBe('2'); // minutes
    expect(input.value).toBe('13:45');
  });

  it('clears the active segment on Tab', () => {
    const { getByTestId } = render(<Harness initial={at(13, 45)} />);
    const input = getByTestId('seg') as HTMLInputElement;
    focusSeg(input);
    expect(input.dataset.active).toBe('0');
    fireEvent.keyDown(input, { key: 'Tab' });
    expect(input.dataset.active).toBe('none');
    expect(input.dataset.inseg).toBe('false');
  });

  it('updates free-form text via onChange when no segment map exists', () => {
    const { getByTestId } = render(
      <Harness format={{ hour: '2-digit', minute: '2-digit' }} />
    );
    const input = getByTestId('seg') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '08:30' } });
    expect(input.value).toBe('08:30');
  });

  it('reverts unparseable free-form text to the current value on blur', () => {
    // 'H:mm' has a variable-width token → no segment map → free-form path.
    const { getByTestId } = render(
      <Harness format="H:mm" initial={at(13, 45)} />
    );
    const input = getByTestId('seg') as HTMLInputElement;
    expect(input.value).toBe('13:45');
    fireEvent.change(input, { target: { value: 'garbage' } });
    fireEvent.blur(input);
    expect(input.value).toBe('13:45');
  });

  it('commits parseable free-form text on Enter', () => {
    const handler = jest.fn();
    const { getByTestId } = render(
      <Harness format="H:mm" onChange={handler} />
    );
    const input = getByTestId('seg') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '8:30' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(handler).toHaveBeenCalled();
    expect((handler.mock.calls[0][0] as Date).getHours()).toBe(8);
  });

  it('Escape closes an open popover in segment mode', () => {
    const { getByTestId } = render(<Harness initial={at(13, 45)} />);
    const input = getByTestId('seg') as HTMLInputElement;
    focusSeg(input); // segment mode engaged (openOnFocus is false)
    fireEvent.click(input); // opens the popover
    expect(input.dataset.open).toBe('true');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.dataset.open).toBe('false');
  });

  it('Escape closes an open popover in free-form (picker-only) mode', () => {
    const { getByTestId } = render(
      <Harness initial={at(13, 45)} editable={false} />
    );
    const input = getByTestId('seg') as HTMLInputElement;
    fireEvent.click(input); // picker-only: click opens, no segment mode
    expect(input.dataset.open).toBe('true');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input.dataset.open).toBe('false');
  });

  it('seeds an empty picker from makeBaseDate on focus (noon)', () => {
    const { getByTestId } = render(<Harness />); // no initial value
    const input = getByTestId('seg') as HTMLInputElement;
    expect(input.value).toBe('');
    focusSeg(input);
    expect(input.dataset.active).toBe('0');
    expect(input.value).toBe('12:00'); // makeBaseDate noon, not yet committed
  });

  it('forwards focus / click / keydown / blur to host callbacks', () => {
    const onFocus = jest.fn();
    const onClick = jest.fn();
    const onKeyDown = jest.fn();
    const onBlur = jest.fn();
    const { getByTestId } = render(
      <Harness
        initial={at(13, 45)}
        onFocus={onFocus}
        onClick={onClick}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
      />
    );
    const input = getByTestId('seg') as HTMLInputElement;
    focusSeg(input);
    expect(onFocus).toHaveBeenCalled();
    fireEvent.click(input);
    expect(onClick).toHaveBeenCalled();
    // An unhandled key in segment mode falls through to the host onKeyDown.
    fireEvent.keyDown(input, { key: 'x' });
    expect(onKeyDown).toHaveBeenCalled();
    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalled();
  });

  it('closeOnSelect: Enter closes the popover in segment mode', () => {
    const { getByTestId } = render(
      <Harness initial={at(13, 45)} closeOnSelect />
    );
    const input = getByTestId('seg') as HTMLInputElement;
    focusSeg(input); // openOnFocus default → popover open + segment mode
    expect(input.dataset.open).toBe('true');
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input.dataset.open).toBe('false');
  });

  it('closeOnSelect: free-form Enter commits then closes', () => {
    const handler = jest.fn();
    const { getByTestId } = render(
      <Harness format="H:mm" closeOnSelect onChange={handler} />
    );
    const input = getByTestId('seg') as HTMLInputElement;
    fireEvent.click(input); // open
    fireEvent.change(input, { target: { value: '8:30' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(handler).toHaveBeenCalled();
    expect(input.dataset.open).toBe('false');
  });

  it('does not tear down segment mode when focus stays inside the picker', () => {
    const { getByTestId } = render(
      <Harness initial={at(13, 45)} withSibling />
    );
    const input = getByTestId('seg') as HTMLInputElement;
    const sibling = getByTestId('sibling');
    focusSeg(input);
    expect(input.dataset.active).toBe('0');
    // Blur into a sibling within the same container — segment state persists.
    fireEvent.blur(input, { relatedTarget: sibling });
    expect(input.dataset.active).toBe('0');
  });
});
