import { createRef, StrictMode, useState, type ReactElement } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Checkbox from '../Checkbox';
import Checkboxes from '../Checkboxes';
import { ConfigProvider } from '../../helpers/Config';

describe('Checkbox', () => {
  it('renders with children as label', () => {
    render(<Checkbox>Accept terms</Checkbox>);
    expect(screen.getByLabelText(/accept terms/i)).toBeInTheDocument();
  });

  it('applies className and Bulma class', () => {
    render(<Checkbox className="custom-class">Label</Checkbox>);
    const label = screen.getByLabelText('Label').closest('label');
    expect(label).toHaveClass('styled-checkbox');
    expect(label).toHaveClass('checkbox');
    expect(label).toHaveClass('custom-class');
  });

  it('puts className on the label and style on the input', () => {
    // The label declares the --bulma-checkbox-* variables, so a class is
    // what reaches them, as the className TSDoc says.
    render(
      <Checkbox className="ink-checkbox" style={{ color: 'red' }}>
        Label
      </Checkbox>
    );
    const input = screen.getByLabelText('Label');
    const label = input.closest('label');
    expect(label).toHaveClass('ink-checkbox');
    expect(label).not.toHaveAttribute('style');
    expect(input).toHaveAttribute('style', 'color: red;');
  });

  it('applies classPrefix when provided', () => {
    render(
      <ConfigProvider classPrefix="bulma-">
        <Checkbox>Test</Checkbox>
      </ConfigProvider>
    );
    const label = screen.getByLabelText('Test').closest('label');
    expect(label).toHaveClass('bulma-styled-checkbox');
    expect(label).toHaveClass('bulma-checkbox');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Checkbox data-testid="checkbox">Test</Checkbox>
        </ConfigProvider>
      );
      const label = screen.getByLabelText('Test').closest('label');
      expect(label).toHaveClass('bulma-styled-checkbox');
      expect(label).toHaveClass('bulma-checkbox');
    });

    it('uses default classes when no prefix is provided', () => {
      render(<Checkbox data-testid="checkbox">Test</Checkbox>);
      const label = screen.getByLabelText('Test').closest('label');
      expect(label).toHaveClass('styled-checkbox');
      expect(label).toHaveClass('checkbox');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Checkbox data-testid="checkbox">Test</Checkbox>
        </ConfigProvider>
      );
      const label = screen.getByLabelText('Test').closest('label');
      expect(label).toHaveClass('styled-checkbox');
      expect(label).toHaveClass('checkbox');
    });

    it('applies prefix to both main class and helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Checkbox m="2" data-testid="checkbox">
            Test
          </Checkbox>
        </ConfigProvider>
      );
      const label = screen.getByLabelText('Test').closest('label');
      expect(label).toHaveClass('bulma-styled-checkbox');
      expect(label).toHaveClass('bulma-checkbox');
      expect(label).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      render(
        <Checkbox p="3" data-testid="checkbox">
          Test
        </Checkbox>
      );
      const label = screen.getByLabelText('Test').closest('label');
      expect(label).toHaveClass('styled-checkbox');
      expect(label).toHaveClass('checkbox');
      expect(label).toHaveClass('p-3');
    });
  });

  it('renders as unchecked by default', () => {
    render(<Checkbox>Opt in</Checkbox>);
    const input = screen.getByLabelText(/opt in/i) as HTMLInputElement;
    expect(input.checked).toBe(false);
  });

  it('can be checked by user interaction', () => {
    render(<Checkbox>Subscribe</Checkbox>);
    const input = screen.getByLabelText(/subscribe/i) as HTMLInputElement;
    fireEvent.click(input);
    expect(input.checked).toBe(true);
  });

  it('respects the checked prop', () => {
    render(
      <Checkbox checked onChange={() => {}}>
        Controlled
      </Checkbox>
    );
    const input = screen.getByLabelText(/controlled/i) as HTMLInputElement;
    expect(input.checked).toBe(true);
  });

  it('respects the disabled prop', () => {
    render(<Checkbox disabled>Disabled</Checkbox>);
    const input = screen.getByLabelText(/disabled/i) as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('forwards ref to input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Checkbox ref={ref}>Ref Checkbox</Checkbox>);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('passes other props to input', () => {
    render(<Checkbox data-testid="my-checkbox">Other</Checkbox>);
    expect(screen.getByTestId('my-checkbox')).toBeInTheDocument();
  });

  describe('group integration branches', () => {
    it('uses local name even when inside a Checkboxes group (local wins)', () => {
      render(
        <Checkboxes name="group-name">
          <Checkbox name="local-name" value="x">
            One
          </Checkbox>
        </Checkboxes>
      );
      const input = screen.getByLabelText('One') as HTMLInputElement;
      expect(input.name).toBe('local-name');
    });

    it('inherits name from group when no local name is provided', () => {
      render(
        <Checkboxes name="group-name">
          <Checkbox value="x">One</Checkbox>
        </Checkboxes>
      );
      const input = screen.getByLabelText('One') as HTMLInputElement;
      expect(input.name).toBe('group-name');
    });

    it('toggles a value out of the group array when unchecking inside group-managed mode', () => {
      const handleChange = vi.fn();
      render(
        <Checkboxes
          name="tags"
          value={['react', 'vue']}
          onChange={handleChange}
        >
          <Checkbox value="react">React</Checkbox>
          <Checkbox value="vue">Vue</Checkbox>
        </Checkboxes>
      );
      const react = screen.getByLabelText('React') as HTMLInputElement;
      // Currently react is in the array (checked). Click to uncheck.
      fireEvent.click(react);
      // Should fire onChange with vue removed-from-... wait no, react removed.
      expect(handleChange).toHaveBeenCalledWith(['vue']);
    });

    it('adds a value to the group array when checking from unchecked', () => {
      // Hits the e.target.checked=true && !includes branch (append path).
      const handleChange = vi.fn();
      render(
        <Checkboxes name="tags" value={['vue']} onChange={handleChange}>
          <Checkbox value="react">React</Checkbox>
          <Checkbox value="vue">Vue</Checkbox>
        </Checkboxes>
      );
      const react = screen.getByLabelText('React') as HTMLInputElement;
      // React is currently unchecked; clicking sets target.checked=true.
      fireEvent.click(react);
      expect(handleChange).toHaveBeenCalledWith(['vue', 'react']);
    });

    it('does not duplicate when current array already includes the value', () => {
      // Synthesize the includes-true branch by overriding `checked` locally so
      // the input is rendered as unchecked (allowing fireEvent.click to fire a
      // change with target.checked=true) while the group's array still contains
      // the value (so includes(valStr) is true → no-op append).
      const handleChange = vi.fn();
      render(
        <Checkboxes name="tags" value={['react']} onChange={handleChange}>
          <Checkbox value="react" checked={false} onChange={() => {}}>
            React
          </Checkbox>
        </Checkboxes>
      );
      const react = screen.getByLabelText('React') as HTMLInputElement;
      fireEvent.click(react);
      // The onChange handler short-circuits because 'react' is already in the
      // array, so we get the same array back.
      expect(handleChange).toHaveBeenCalledWith(['react']);
    });

    it('local onChange still fires when no group is present', () => {
      const handleChange = vi.fn();
      render(
        <Checkbox onChange={handleChange} value="solo">
          Solo
        </Checkbox>
      );
      const input = screen.getByLabelText('Solo') as HTMLInputElement;
      fireEvent.click(input);
      expect(handleChange).toHaveBeenCalled();
    });

    it('does not dispatch to the group when the Checkbox has no value', () => {
      const handleChange = vi.fn();
      render(
        <Checkboxes name="tags" value={[]} onChange={handleChange}>
          <Checkbox>No Value</Checkbox>
        </Checkboxes>
      );
      const input = screen.getByLabelText('No Value') as HTMLInputElement;
      fireEvent.click(input);
      // Group onChange should NOT be invoked because Checkbox lacks `value`.
      expect(handleChange).not.toHaveBeenCalled();
    });

    it('falls back to defaultChecked locally when not group-managed', () => {
      // Not group-managed (no value/onChange in Checkboxes), uses local
      // defaultChecked path.
      render(
        <Checkboxes name="tags">
          <Checkbox value="x" defaultChecked>
            X
          </Checkbox>
        </Checkboxes>
      );
      const input = screen.getByLabelText('X') as HTMLInputElement;
      expect(input.checked).toBe(true);
    });

    it('handles a Checkboxes group with only onChange, starting from nothing checked', () => {
      // onChange alone makes the group manage the selection, though it holds
      // no value until this first change.
      const handleChange = vi.fn();
      render(
        <Checkboxes name="tags" onChange={handleChange}>
          <Checkbox value="x">X</Checkbox>
        </Checkboxes>
      );
      const input = screen.getByLabelText('X') as HTMLInputElement;
      expect(input.checked).toBe(false);
      fireEvent.click(input);
      expect(handleChange).toHaveBeenCalledWith(['x']);
      expect(input.checked).toBe(true);
    });
  });

  describe('in a Checkboxes group with only onChange', () => {
    const box = (name: string) =>
      screen.getByLabelText(name) as HTMLInputElement;

    it('keeps a defaultChecked box checked when another box is clicked', () => {
      const handleChange = vi.fn();
      render(
        <Checkboxes name="tags" onChange={handleChange}>
          <Checkbox value="react" defaultChecked>
            React
          </Checkbox>
          <Checkbox value="vue">Vue</Checkbox>
          <Checkbox value="svelte" defaultChecked>
            Svelte
          </Checkbox>
        </Checkboxes>
      );
      expect(box('React').checked).toBe(true);
      expect(box('Svelte').checked).toBe(true);
      fireEvent.click(box('Vue'));
      // The first change starts from what was checked, in document order.
      expect(handleChange).toHaveBeenLastCalledWith(['react', 'svelte', 'vue']);
      expect(box('React').checked).toBe(true);
      expect(box('Vue').checked).toBe(true);
      expect(box('Svelte').checked).toBe(true);
      fireEvent.click(box('React'));
      expect(handleChange).toHaveBeenLastCalledWith(['svelte', 'vue']);
      expect(box('React').checked).toBe(false);
    });

    it('unchecks a defaultChecked box as the first change', () => {
      const handleChange = vi.fn();
      render(
        <Checkboxes onChange={handleChange}>
          <Checkbox value="react" defaultChecked>
            React
          </Checkbox>
          <Checkbox value="vue" defaultChecked>
            Vue
          </Checkbox>
        </Checkboxes>
      );
      fireEvent.click(box('React'));
      expect(handleChange).toHaveBeenLastCalledWith(['vue']);
      expect(box('React').checked).toBe(false);
      expect(box('Vue').checked).toBe(true);
    });

    it('starts from a box shown checked by its own checked prop', () => {
      const handleChange = vi.fn();
      render(
        <Checkboxes onChange={handleChange}>
          <Checkbox value="terms" checked onChange={() => {}}>
            Terms
          </Checkbox>
          <Checkbox value="news">News</Checkbox>
        </Checkboxes>
      );
      fireEvent.click(box('News'));
      expect(handleChange).toHaveBeenLastCalledWith(['terms', 'news']);
    });

    it('leaves out a box that unmounted or stopped being checked before the first change', () => {
      const handleChange = vi.fn();
      const ui = (showReact: boolean, vueChecked: boolean) => (
        <Checkboxes onChange={handleChange}>
          {showReact && (
            <Checkbox value="react" defaultChecked>
              React
            </Checkbox>
          )}
          <Checkbox value="vue" defaultChecked={vueChecked}>
            Vue
          </Checkbox>
          <Checkbox value="svelte">Svelte</Checkbox>
        </Checkboxes>
      );
      const { rerender } = render(ui(true, true));
      rerender(ui(false, false));
      expect(box('Vue').checked).toBe(false);
      fireEvent.click(box('Svelte'));
      expect(handleChange).toHaveBeenLastCalledWith(['svelte']);
    });

    it('lists a value two checked boxes share once', () => {
      const handleChange = vi.fn();
      render(
        <Checkboxes onChange={handleChange}>
          <Checkbox value="react" defaultChecked>
            React
          </Checkbox>
          <Checkbox value="react" defaultChecked>
            React again
          </Checkbox>
          <Checkbox value="vue">Vue</Checkbox>
        </Checkboxes>
      );
      fireEvent.click(box('Vue'));
      expect(handleChange).toHaveBeenLastCalledWith(['react', 'vue']);
    });

    it('leaves a box without a value to itself', () => {
      const handleChange = vi.fn();
      render(
        <Checkboxes onChange={handleChange}>
          <Checkbox defaultChecked>Loose</Checkbox>
          <Checkbox value="vue">Vue</Checkbox>
        </Checkboxes>
      );
      fireEvent.click(box('Vue'));
      expect(handleChange).toHaveBeenLastCalledWith(['vue']);
      expect(box('Loose').checked).toBe(true);
    });

    it('lets a box without a value toggle on its own, before and after the first change', () => {
      // Unlike radios, checkboxes sharing a name don't uncheck each other, so
      // there's nothing for React to put back.
      const handleChange = vi.fn();
      render(
        <Checkboxes name="tags" onChange={handleChange}>
          <Checkbox value="react" defaultChecked>
            React
          </Checkbox>
          <Checkbox>Loose</Checkbox>
        </Checkboxes>
      );
      fireEvent.click(box('Loose'));
      expect(box('Loose').checked).toBe(true);
      expect(box('React').checked).toBe(true);
      expect(handleChange).not.toHaveBeenCalled();

      fireEvent.click(box('React'));
      expect(handleChange).toHaveBeenLastCalledWith([]);
      fireEvent.click(box('Loose'));
      expect(box('Loose').checked).toBe(false);
      expect(box('React').checked).toBe(false);
    });

    it('works under a class prefix', () => {
      const handleChange = vi.fn();
      render(
        <ConfigProvider classPrefix="bestax-">
          <Checkboxes onChange={handleChange}>
            <Checkbox value="react" defaultChecked>
              React
            </Checkbox>
            <Checkbox value="vue">Vue</Checkbox>
          </Checkboxes>
        </ConfigProvider>
      );
      expect(box('React').closest('label')).toHaveClass('bestax-checkbox');
      fireEvent.click(box('Vue'));
      expect(handleChange).toHaveBeenLastCalledWith(['react', 'vue']);
    });

    it('keeps each starting value once, in order, under StrictMode', () => {
      // StrictMode runs every effect, cleanup and all, a second time.
      const handleChange = vi.fn();
      render(
        <StrictMode>
          <Checkboxes onChange={handleChange}>
            <Checkbox value="react" defaultChecked>
              React
            </Checkbox>
            <Checkbox value="vue">Vue</Checkbox>
            <Checkbox value="svelte" defaultChecked>
              Svelte
            </Checkbox>
          </Checkboxes>
        </StrictMode>
      );
      fireEvent.click(box('Vue'));
      expect(handleChange).toHaveBeenLastCalledWith(['react', 'svelte', 'vue']);
    });
  });

  describe('indeterminate', () => {
    const inputOf = (label: string) =>
      screen.getByLabelText(label) as HTMLInputElement;

    it('sets the mixed state on the input, not as an attribute', () => {
      render(<Checkbox indeterminate>Select all</Checkbox>);
      const input = inputOf('Select all');
      expect(input.indeterminate).toBe(true);
      expect(input).toBePartiallyChecked();
      expect(input.hasAttribute('indeterminate')).toBe(false);
      // The value is still `checked`, untouched by the look.
      expect(input.checked).toBe(false);
    });

    // Whether it logs a React warning is in Checkbox.warnings.test.tsx.

    it('follows the prop across re-renders', () => {
      const { rerender } = render(<Checkbox indeterminate>Mixed</Checkbox>);
      const input = inputOf('Mixed');
      expect(input.indeterminate).toBe(true);
      rerender(<Checkbox indeterminate={false}>Mixed</Checkbox>);
      expect(input.indeterminate).toBe(false);
      rerender(<Checkbox indeterminate>Mixed</Checkbox>);
      expect(input.indeterminate).toBe(true);
    });

    it('sets it again on a render whose prop did not change', () => {
      const { rerender } = render(<Checkbox indeterminate>Mixed</Checkbox>);
      const input = inputOf('Mixed');
      // What a click does to the property, with no change event to answer.
      input.indeterminate = false;
      rerender(<Checkbox indeterminate>Mixed</Checkbox>);
      expect(input.indeterminate).toBe(true);
    });

    it('keeps the mixed state after a click that renders nothing', () => {
      const onChange = vi.fn();
      render(
        <Checkbox indeterminate onChange={onChange}>
          Mixed
        </Checkbox>
      );
      const input = inputOf('Mixed');
      fireEvent.click(input);
      // The click still toggles the value.
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(input.checked).toBe(true);
      expect(input.indeterminate).toBe(true);
    });

    it('keeps the mixed state after a click that renders with the same prop', () => {
      function Harness() {
        const [checked, setChecked] = useState(false);
        return (
          <Checkbox
            checked={checked}
            indeterminate
            onChange={e => setChecked(e.target.checked)}
          >
            Mixed
          </Checkbox>
        );
      }
      render(<Harness />);
      const input = inputOf('Mixed');
      fireEvent.click(input);
      expect(input.checked).toBe(true);
      expect(input.indeterminate).toBe(true);
    });

    it('drives a "Select all" box over a Checkboxes group', () => {
      const items = ['apples', 'pears', 'plums'];
      function SelectAll() {
        const [picked, setPicked] = useState<string[]>(['pears']);
        const all = picked.length === items.length;
        return (
          <>
            <Checkbox
              checked={all}
              indeterminate={picked.length > 0 && !all}
              onChange={() => setPicked(all ? [] : items)}
            >
              Select all
            </Checkbox>
            <Checkboxes value={picked} onChange={setPicked}>
              {items.map(item => (
                <Checkbox key={item} value={item}>
                  {item}
                </Checkbox>
              ))}
            </Checkboxes>
          </>
        );
      }
      render(<SelectAll />);
      const all = inputOf('Select all');
      expect(all.indeterminate).toBe(true);
      expect(all.checked).toBe(false);

      fireEvent.click(all);
      expect(all.indeterminate).toBe(false);
      expect(all.checked).toBe(true);
      expect(items.every(item => inputOf(item).checked)).toBe(true);

      fireEvent.click(inputOf('plums'));
      expect(all.indeterminate).toBe(true);
      expect(all.checked).toBe(false);
    });

    it('leaves the property alone when the prop is unset', () => {
      const { rerender } = render(
        <Checkbox
          ref={el => {
            if (el) el.indeterminate = true;
          }}
        >
          By ref
        </Checkbox>
      );
      const input = inputOf('By ref');
      expect(input.indeterminate).toBe(true);
      rerender(<Checkbox>By ref</Checkbox>);
      expect(input.indeterminate).toBe(true);
      fireEvent.click(input);
      expect(input.indeterminate).toBe(false);
    });

    it('clears the mixed state once when the prop goes back to unset', () => {
      const { rerender } = render(<Checkbox indeterminate>Mixed</Checkbox>);
      const input = inputOf('Mixed');
      expect(input.indeterminate).toBe(true);
      rerender(<Checkbox indeterminate={undefined}>Mixed</Checkbox>);
      expect(input.indeterminate).toBe(false);
      // Handed back: a ref setting it now keeps what it set.
      input.indeterminate = true;
      rerender(<Checkbox>Mixed</Checkbox>);
      expect(input.indeterminate).toBe(true);
    });

    it('still forwards an object ref to the input', () => {
      const ref = createRef<HTMLInputElement>();
      const { unmount } = render(
        <Checkbox ref={ref} indeterminate>
          Ref
        </Checkbox>
      );
      expect(ref.current).toBe(inputOf('Ref'));
      expect(ref.current?.indeterminate).toBe(true);
      unmount();
      expect(ref.current).toBeNull();
    });

    it('still forwards a callback ref to the input', () => {
      const ref = vi.fn();
      const { unmount } = render(
        <Checkbox ref={ref} indeterminate>
          Ref
        </Checkbox>
      );
      expect(ref).toHaveBeenLastCalledWith(inputOf('Ref'));
      unmount();
      expect(ref).toHaveBeenLastCalledWith(null);
    });

    it('detaches a callback ref that returns a cleanup as a plain input does', () => {
      // React 19 runs a returned cleanup in place of calling the ref with
      // null, and React 18 ignores it. Either way, the Checkbox should match.
      type CleanupRef = (node: HTMLInputElement | null) => () => void;
      const detachOf = (el: (ref: CleanupRef) => ReactElement) => {
        const calls: string[] = [];
        const ref: CleanupRef = node => {
          calls.push(node ? 'attach' : 'null');
          return () => {
            calls.push('cleanup');
          };
        };
        render(el(ref)).unmount();
        return calls;
      };
      expect(detachOf(ref => <Checkbox ref={ref}>Ref</Checkbox>)).toEqual(
        detachOf(ref => <input type="checkbox" ref={ref} />)
      );
    });

    it('sets the mixed state under ConfigProvider classPrefix', () => {
      render(
        <ConfigProvider classPrefix="bestax-">
          <Checkbox indeterminate>Prefixed</Checkbox>
        </ConfigProvider>
      );
      const input = inputOf('Prefixed');
      expect(input.indeterminate).toBe(true);
      expect(input.closest('label')).toHaveClass('bestax-styled-checkbox');
      expect(input.nextElementSibling).toHaveClass('bestax-check');
    });
  });

  describe('invalid color/size guards', () => {
    it('does not apply is-${color} when color is not in checkboxColors', () => {
      render(
        // @ts-expect-error intentionally invalid color
        <Checkbox color="not-a-color">Bad Color</Checkbox>
      );
      const label = screen.getByLabelText('Bad Color').closest('label');
      expect(label).not.toHaveClass('is-not-a-color');
    });

    it('does not apply is-${size} when size is not in checkboxSizes', () => {
      render(
        // @ts-expect-error intentionally invalid size
        <Checkbox size="huge">Bad Size</Checkbox>
      );
      const label = screen.getByLabelText('Bad Size').closest('label');
      expect(label).not.toHaveClass('is-huge');
    });
  });
});
