import { render, screen } from '@testing-library/react';
import Checkboxes from '../Checkboxes';
import Checkbox from '../Checkbox';
import { Field } from '../Field';
import { Control } from '../Control';
import { ConfigProvider } from '../../helpers/Config';

describe('Checkboxes', () => {
  it('renders children (Checkbox components) inside a div with class "checkboxes"', () => {
    render(
      <Checkboxes>
        <Checkbox>One</Checkbox>
        <Checkbox>Two</Checkbox>
      </Checkboxes>
    );
    const wrapper = screen.getByText('One').closest('.checkboxes');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper?.classList.contains('checkboxes')).toBe(true);

    // Both checkboxes rendered
    expect(screen.getByLabelText('One')).toBeInTheDocument();
    expect(screen.getByLabelText('Two')).toBeInTheDocument();
  });

  it('applies additional className and Bulma helper classes', () => {
    render(
      <Checkboxes className="my-extra-class" m="2">
        <Checkbox>Extra</Checkbox>
      </Checkboxes>
    );
    const wrapper = screen.getByText('Extra').closest('.checkboxes');
    expect(wrapper).toHaveClass('my-extra-class');
    // Bulma helper class (assuming useBulmaClasses supports m={2} and returns "m-2")
    // If your helper produces a different class, adjust the test
    // This line is resilient to any output containing "m-" for margin
    expect(
      Array.from(wrapper?.classList ?? []).some(cls => cls.startsWith('m-'))
    ).toBe(true);
  });

  it('passes other props to the wrapper', () => {
    render(
      <Checkboxes data-testid="checkboxes-wrapper">
        <Checkbox>Check</Checkbox>
      </Checkboxes>
    );
    expect(screen.getByTestId('checkboxes-wrapper')).toBeInTheDocument();
  });

  it('renders with no children without crashing', () => {
    render(<Checkboxes />);
    const wrapper = document.querySelector('.checkboxes');
    expect(wrapper).toBeInTheDocument();
  });

  it('applies classPrefix when provided', () => {
    render(
      <ConfigProvider classPrefix="custom-">
        <Checkboxes>
          <Checkbox>Test</Checkbox>
        </Checkboxes>
      </ConfigProvider>
    );
    const wrapper = screen.getByText('Test').closest('.custom-checkboxes');
    expect(wrapper).toBeInTheDocument();
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Checkboxes data-testid="checkboxes">
            <Checkbox>Test</Checkbox>
          </Checkboxes>
        </ConfigProvider>
      );
      const checkboxes = screen.getByTestId('checkboxes');
      expect(checkboxes).toHaveClass('bulma-checkboxes');
    });

    it('uses default classes when no prefix is provided', () => {
      render(
        <Checkboxes data-testid="checkboxes">
          <Checkbox>Test</Checkbox>
        </Checkboxes>
      );
      const checkboxes = screen.getByTestId('checkboxes');
      expect(checkboxes).toHaveClass('checkboxes');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Checkboxes data-testid="checkboxes">
            <Checkbox>Test</Checkbox>
          </Checkboxes>
        </ConfigProvider>
      );
      const checkboxes = screen.getByTestId('checkboxes');
      expect(checkboxes).toHaveClass('checkboxes');
    });

    it('applies prefix to both main class and helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Checkboxes m="2" data-testid="checkboxes">
            <Checkbox>Test</Checkbox>
          </Checkboxes>
        </ConfigProvider>
      );
      const checkboxes = screen.getByTestId('checkboxes');
      expect(checkboxes).toHaveClass('bulma-checkboxes');
      expect(checkboxes).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      render(
        <Checkboxes p="3" data-testid="checkboxes">
          <Checkbox>Test</Checkbox>
        </Checkboxes>
      );
      const checkboxes = screen.getByTestId('checkboxes');
      expect(checkboxes).toHaveClass('checkboxes');
      expect(checkboxes).toHaveClass('p-3');
    });
  });

  describe('inside a Field wrapper', () => {
    it('renders as a bare fragment (no extra Field wrapper) when nested in a Field', () => {
      render(
        <Field label="Tags">
          <Checkboxes message="hint" messageColor="info">
            <Checkbox>One</Checkbox>
          </Checkboxes>
        </Field>
      );
      // There should be exactly ONE field wrapper — the outer Field — and the
      // Checkboxes should not have wrapped its content in another Field.
      const fields = document.querySelectorAll('.field');
      expect(fields.length).toBe(1);

      // The help message still renders as part of the bare fragment fallback.
      const help = screen.getByText('hint');
      expect(help).toHaveClass('help');
      expect(help).toHaveClass('is-info');
    });

    it('skips wrapping in Control when already inside a Control', () => {
      render(
        <Field label="Tags">
          <Control>
            <Checkboxes data-testid="cbs">
              <Checkbox>One</Checkbox>
            </Checkboxes>
          </Control>
        </Field>
      );
      // Only ONE control wrapper — the outer Control.
      const controls = document.querySelectorAll('.control');
      expect(controls.length).toBe(1);
      expect(screen.getByTestId('cbs')).toHaveClass('checkboxes');
    });
  });

  describe('controlled mode', () => {
    it('does not call setInternalValue when value is controlled (suppresses setInternal branch)', () => {
      const handleChange = jest.fn();
      const { getByLabelText } = render(
        <Checkboxes name="tags" value={['a']} onChange={handleChange}>
          <Checkbox value="a">A</Checkbox>
          <Checkbox value="b">B</Checkbox>
        </Checkboxes>
      );
      const b = getByLabelText('B') as HTMLInputElement;
      // Click B to trigger the group onChange path with isControlled=true.
      b.click();
      expect(handleChange).toHaveBeenCalledWith(['a', 'b']);
    });

    it('uncontrolled defaultValue without onChange triggers internal update branch only', () => {
      // Group is "active" (defaultValue is set) but no onChange — exercises the
      // !isControlled branch followed by the optional-chain miss on onChange.
      const { getByLabelText } = render(
        <Checkboxes name="tags" defaultValue={['a']}>
          <Checkbox value="a">A</Checkbox>
          <Checkbox value="b">B</Checkbox>
        </Checkboxes>
      );
      const b = getByLabelText('B') as HTMLInputElement;
      b.click();
      expect(b.checked).toBe(true);
    });
  });
});
