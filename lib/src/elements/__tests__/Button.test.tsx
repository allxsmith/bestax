import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '../Button';

describe('Button Component', () => {
  it('renders children correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('applies button-specific classes', () => {
    render(<Button color="primary" size="large" isRounded />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass(
      'button',
      'is-primary',
      'is-large',
      'is-rounded'
    );
  });

  it('applies helper classes via rest props', () => {
    render(
      <Button
        textColor="success"
        m="2"
        textAlign="centered"
        viewport="mobile"
      />
    );
    const button = screen.getByRole('button');
    expect(button).toHaveClass(
      'button',
      'has-text-success-mobile',
      'm-2-mobile',
      'has-text-centered-mobile'
    );
  });

  it('prioritizes button color over textColor and bgColor', () => {
    render(<Button color="primary" textColor="success" bgColor="info" />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass(
      'button',
      'is-primary',
      'has-text-success',
      'has-background-info'
    );
    expect(button).not.toHaveClass(
      'has-text-primary',
      'has-background-primary'
    );
  });

  it('forwards HTML attributes from bulmaProps', () => {
    render(
      <Button data-testid="test" onClick={() => {}}>
        Test
      </Button>
    );
    const button = screen.getByTestId('test');
    expect(button).toHaveClass('button');
  });
});
