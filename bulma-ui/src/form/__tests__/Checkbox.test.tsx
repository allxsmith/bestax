import { createRef } from 'react';
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
      const handleChange = jest.fn();
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
      const handleChange = jest.fn();
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
      const handleChange = jest.fn();
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
      const handleChange = jest.fn();
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
      const handleChange = jest.fn();
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

    it('handles a Checkboxes group with only onChange (group.value undefined → [] fallback)', () => {
      // groupActive=true via onChange alone. group.value remains undefined, so
      // the `group.value ?? []` fallback kicks in when handleChange dispatches.
      const handleChange = jest.fn();
      render(
        <Checkboxes name="tags" onChange={handleChange}>
          <Checkbox value="x">X</Checkbox>
        </Checkboxes>
      );
      const input = screen.getByLabelText('X') as HTMLInputElement;
      fireEvent.click(input);
      expect(handleChange).toHaveBeenCalledWith(['x']);
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
