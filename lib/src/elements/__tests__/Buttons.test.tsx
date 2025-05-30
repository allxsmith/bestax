import { render, screen } from '@testing-library/react';
import { Buttons } from '../Buttons';
import { Button } from '../Button';

describe('Buttons Component', () => {
  it('renders children within buttons container', () => {
    render(
      <Buttons>
        <Button>Click Me</Button>
      </Buttons>
    );
    const buttons = screen.getByText('Click Me').parentElement;
    expect(buttons).toHaveClass('buttons');
    expect(
      screen.getByRole('button', { name: /click me/i })
    ).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Buttons className="custom-buttons">
        <Button>Click Me</Button>
      </Buttons>
    );
    const buttons = screen.getByText('Click Me').parentElement;
    expect(buttons).toHaveClass('buttons custom-buttons');
  });

  it('applies isCentered modifier', () => {
    render(
      <Buttons isCentered>
        <Button>Click Me</Button>
      </Buttons>
    );
    const buttons = screen.getByText('Click Me').parentElement;
    expect(buttons).toHaveClass('buttons is-centered');
  });

  it('applies isRight modifier', () => {
    render(
      <Buttons isRight>
        <Button>Click Me</Button>
      </Buttons>
    );
    const buttons = screen.getByText('Click Me').parentElement;
    expect(buttons).toHaveClass('buttons is-right');
  });

  it('applies hasAddons modifier', () => {
    render(
      <Buttons hasAddons>
        <Button>Left</Button>
        <Button>Right</Button>
      </Buttons>
    );
    const buttons = screen.getByText('Left').parentElement;
    expect(buttons).toHaveClass('buttons has-addons');
  });

  it('applies textColor using useBulmaClasses', () => {
    render(
      <Buttons textColor="primary">
        <Button>Click Me</Button>
      </Buttons>
    );
    const buttons = screen.getByText('Click Me').parentElement;
    expect(buttons).toHaveClass('has-text-primary');
  });

  it('applies margin using useBulmaClasses', () => {
    render(
      <Buttons m="2">
        <Button>Click Me</Button>
      </Buttons>
    );
    const buttons = screen.getByText('Click Me').parentElement;
    expect(buttons).toHaveClass('m-2');
  });

  it('passes through non-Bulma props via rest', () => {
    render(
      <Buttons data-testid="test-buttons">
        <Button>Click Me</Button>
      </Buttons>
    );
    const buttons = screen.getByTestId('test-buttons');
    expect(buttons).toBeInTheDocument();
  });
});
