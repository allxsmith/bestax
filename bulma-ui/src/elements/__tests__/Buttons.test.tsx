import { render, screen } from '@testing-library/react';
import { Buttons } from '../Buttons';
import { Button } from '../Button';
import { ConfigProvider } from '../../helpers/Config';

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

  describe('ClassPrefix', () => {
    it('applies classPrefix to main class', () => {
      render(
        <ConfigProvider classPrefix="my-prefix-">
          <Buttons data-testid="test-buttons">
            <Button>Test</Button>
          </Buttons>
        </ConfigProvider>
      );
      const buttons = screen.getByTestId('test-buttons');
      expect(buttons).toHaveClass('my-prefix-buttons');
    });

    it('uses default class when no classPrefix provided', () => {
      render(
        <ConfigProvider>
          <Buttons data-testid="test-buttons">
            <Button>Test</Button>
          </Buttons>
        </ConfigProvider>
      );
      const buttons = screen.getByTestId('test-buttons');
      expect(buttons).toHaveClass('buttons');
    });

    it('uses default class when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Buttons data-testid="test-buttons">
            <Button>Test</Button>
          </Buttons>
        </ConfigProvider>
      );
      const buttons = screen.getByTestId('test-buttons');
      expect(buttons).toHaveClass('buttons');
    });

    it('applies prefix to both main class and helper classes', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Buttons isCentered hasAddons m="2">
            <Button>Button 1</Button>
            <Button>Button 2</Button>
          </Buttons>
        </ConfigProvider>
      );

      const buttons = container.querySelector('div');
      expect(buttons).toHaveClass('bulma-buttons');
      expect(buttons).toHaveClass('bulma-is-centered');
      expect(buttons).toHaveClass('bulma-has-addons');
      expect(buttons).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      const { container } = render(
        <Buttons isRight hasAddons p="3">
          <Button>Button 1</Button>
          <Button>Button 2</Button>
        </Buttons>
      );

      const buttons = container.querySelector('div');
      expect(buttons).toHaveClass('buttons');
      expect(buttons).toHaveClass('is-right');
      expect(buttons).toHaveClass('has-addons');
      expect(buttons).toHaveClass('p-3');
    });
  });
});
