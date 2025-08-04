import { render, screen } from '@testing-library/react';
import Radios from '../Radios';
import Radio from '../Radio';
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
});
