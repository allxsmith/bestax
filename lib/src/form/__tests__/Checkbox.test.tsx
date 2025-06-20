import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Checkbox from '../Checkbox';

describe('Checkbox', () => {
  it('renders with children as label', () => {
    render(<Checkbox>Accept terms</Checkbox>);
    expect(screen.getByLabelText(/accept terms/i)).toBeInTheDocument();
  });

  it('applies className and Bulma class', () => {
    const { container } = render(
      <Checkbox className="custom-class">Label</Checkbox>
    );
    const label = container.querySelector('label');
    expect(label).toHaveClass('checkbox');
    expect(label).toHaveClass('custom-class');
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
});
