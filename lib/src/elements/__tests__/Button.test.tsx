import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Button } from '../Button';

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /Click me/i });
    expect(button).toHaveClass('button');
    expect(button).not.toHaveAttribute('disabled');
  });

  it('applies color prop', () => {
    render(<Button color="primary">Primary</Button>);
    const button = screen.getByRole('button', { name: /Primary/i });
    expect(button).toHaveClass('is-primary');
  });

  it('applies size prop', () => {
    render(<Button size="large">Large</Button>);
    const button = screen.getByRole('button', { name: /Large/i });
    expect(button).toHaveClass('is-large');
  });

  it('applies isLoading state', () => {
    render(<Button isLoading>Loading</Button>);
    const button = screen.getByRole('button', { name: /Loading/i });
    expect(button).toHaveClass('is-loading');
  });

  it('applies isDisabled state', () => {
    render(<Button isDisabled>Disabled</Button>);
    const button = screen.getByRole('button', { name: /Disabled/i });
    expect(button).toHaveAttribute('disabled');
    expect(button).toHaveClass('is-disabled');
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    const button = screen.getByRole('button', { name: /Custom/i });
    expect(button).toHaveClass('custom-class');
  });

  it('passes additional props', () => {
    render(
      <Button type="submit" data-testid="btn">
        Submit
      </Button>
    );
    const button = screen.getByTestId('btn');
    expect(button).toHaveAttribute('type', 'submit');
  });
});
