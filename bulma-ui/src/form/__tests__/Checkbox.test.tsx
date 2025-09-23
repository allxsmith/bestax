import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Checkbox from '../Checkbox';
import { ConfigProvider } from '../../helpers/Config';

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

  it('applies classPrefix when provided', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bulma-">
        <Checkbox>Test</Checkbox>
      </ConfigProvider>
    );
    const label = container.querySelector('label');
    expect(label).toHaveClass('bulma-checkbox');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Checkbox data-testid="checkbox">Test</Checkbox>
        </ConfigProvider>
      );
      const label = container.querySelector('label');
      expect(label).toHaveClass('bulma-checkbox');
    });

    it('uses default classes when no prefix is provided', () => {
      const { container } = render(
        <Checkbox data-testid="checkbox">Test</Checkbox>
      );
      const label = container.querySelector('label');
      expect(label).toHaveClass('checkbox');
    });

    it('uses default classes when classPrefix is undefined', () => {
      const { container } = render(
        <ConfigProvider classPrefix={undefined}>
          <Checkbox data-testid="checkbox">Test</Checkbox>
        </ConfigProvider>
      );
      const label = container.querySelector('label');
      expect(label).toHaveClass('checkbox');
    });

    it('applies prefix to both main class and helper classes', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Checkbox m="2" data-testid="checkbox">
            Test
          </Checkbox>
        </ConfigProvider>
      );
      const label = container.querySelector('label');
      expect(label).toHaveClass('bulma-checkbox');
      expect(label).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      const { container } = render(
        <Checkbox p="3" data-testid="checkbox">
          Test
        </Checkbox>
      );
      const label = container.querySelector('label');
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
});
