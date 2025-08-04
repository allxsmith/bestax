import { render, screen } from '@testing-library/react';
import Checkboxes from '../Checkboxes';
import Checkbox from '../Checkbox';
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
});
