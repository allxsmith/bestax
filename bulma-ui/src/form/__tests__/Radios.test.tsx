import { render, screen } from '@testing-library/react';
import Radios from '../Radios';
import Radio from '../Radio';
import { Field } from '../Field';
import { Control } from '../Control';
import { ConfigProvider } from '../../helpers/Config';

describe('Radios', () => {
  it('renders children (Radio components) inside a div with class "radios"', () => {
    render(
      <Radios>
        <Radio name="group">Option 1</Radio>
        <Radio name="group">Option 2</Radio>
      </Radios>
    );
    const wrapper = screen.getByText('Option 1').closest('.radios');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper?.classList.contains('radios')).toBe(true);

    // Both radios rendered
    expect(screen.getByLabelText('Option 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Option 2')).toBeInTheDocument();
  });

  it('applies additional className and Bulma helper classes', () => {
    render(
      <Radios className="my-extra-class" m="2">
        <Radio name="test">Radio Extra</Radio>
      </Radios>
    );
    const wrapper = screen.getByText('Radio Extra').closest('.radios');
    expect(wrapper).toHaveClass('my-extra-class');
    // Bulma helper class (assuming useBulmaClasses supports m={2} and returns "m-2")
    expect(
      Array.from(wrapper?.classList ?? []).some(cls => cls.startsWith('m-'))
    ).toBe(true);
  });

  it('passes other props to the wrapper', () => {
    render(
      <Radios data-testid="radios-wrapper">
        <Radio name="check">Radio</Radio>
      </Radios>
    );
    expect(screen.getByTestId('radios-wrapper')).toBeInTheDocument();
  });

  it('renders with empty content without crashing', () => {
    render(<Radios>{null}</Radios>);
    // Should not throw; no assertion needed, but can check existence
    const wrapper = document.querySelector('.radios');
    expect(wrapper).toBeInTheDocument();
  });

  it('applies classPrefix when provided', () => {
    render(
      <ConfigProvider classPrefix="custom-">
        <Radios>
          <Radio name="test">Test Radio</Radio>
        </Radios>
      </ConfigProvider>
    );
    const wrapper = screen.getByText('Test Radio').closest('.custom-radios');
    expect(wrapper).toBeInTheDocument();
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Radios data-testid="radios">
            <Radio name="test">Test</Radio>
          </Radios>
        </ConfigProvider>
      );
      const radios = screen.getByTestId('radios');
      expect(radios).toHaveClass('bulma-radios');
    });

    it('uses default classes when no prefix is provided', () => {
      render(
        <Radios data-testid="radios">
          <Radio name="test">Test</Radio>
        </Radios>
      );
      const radios = screen.getByTestId('radios');
      expect(radios).toHaveClass('radios');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Radios data-testid="radios">
            <Radio name="test">Test</Radio>
          </Radios>
        </ConfigProvider>
      );
      const radios = screen.getByTestId('radios');
      expect(radios).toHaveClass('radios');
    });

    it('applies prefix to both main class and helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Radios m="2" data-testid="radios">
            <Radio name="test">Test</Radio>
          </Radios>
        </ConfigProvider>
      );
      const radios = screen.getByTestId('radios');
      expect(radios).toHaveClass('bulma-radios');
      expect(radios).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      render(
        <Radios p="3" data-testid="radios">
          <Radio name="test">Test</Radio>
        </Radios>
      );
      const radios = screen.getByTestId('radios');
      expect(radios).toHaveClass('radios');
      expect(radios).toHaveClass('p-3');
    });
  });

  describe('inside a Field wrapper', () => {
    it('renders as a bare fragment (no extra Field wrapper) when nested in a Field', () => {
      render(
        <Field label="Color">
          <Radios message="hint" messageColor="info">
            <Radio name="c" value="red">
              Red
            </Radio>
          </Radios>
        </Field>
      );
      // Exactly one Field wrapper (the outer one).
      const fields = document.querySelectorAll('.field');
      expect(fields.length).toBe(1);

      const help = screen.getByText('hint');
      expect(help).toHaveClass('help');
      expect(help).toHaveClass('is-info');
    });

    it('skips wrapping in Control when already inside a Control', () => {
      render(
        <Field label="Color">
          <Control>
            <Radios data-testid="rgrp">
              <Radio name="c" value="red">
                Red
              </Radio>
            </Radios>
          </Control>
        </Field>
      );
      const controls = document.querySelectorAll('.control');
      expect(controls.length).toBe(1);
      expect(screen.getByTestId('rgrp')).toHaveClass('radios');
    });
  });

  describe('controlled / uncontrolled internal state branches', () => {
    it('uncontrolled defaultValue without onChange still updates internal state on click', () => {
      // Hits the !isControlled branch followed by the optional-chain miss for onChange.
      const { getByLabelText } = render(
        <Radios name="c" defaultValue="red">
          <Radio value="red">Red</Radio>
          <Radio value="green">Green</Radio>
        </Radios>
      );
      const green = getByLabelText('Green') as HTMLInputElement;
      green.click();
      expect(green.checked).toBe(true);
    });

    it('controlled value with onChange dispatches without mutating internal state', () => {
      const handleChange = jest.fn();
      const { getByLabelText } = render(
        <Radios name="c" value="red" onChange={handleChange}>
          <Radio value="red">Red</Radio>
          <Radio value="green">Green</Radio>
        </Radios>
      );
      const green = getByLabelText('Green') as HTMLInputElement;
      green.click();
      expect(handleChange).toHaveBeenCalledWith('green');
    });
  });
});

describe('Compound components', () => {
  test('Radios.Radio is the Radio component', () => {
    expect(Radios.Radio).toBe(Radio);
  });

  test('renders radios through the dot path', () => {
    render(
      <Radios name="color">
        <Radios.Radio value="red">Red</Radios.Radio>
        <Radios.Radio value="green">Green</Radios.Radio>
      </Radios>
    );
    expect(screen.getAllByRole('radio')).toHaveLength(2);
  });
});
