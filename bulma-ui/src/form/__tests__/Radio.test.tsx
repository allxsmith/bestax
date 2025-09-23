import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Radio from '../Radio';
import { ConfigProvider } from '../../helpers/Config';

describe('Radio', () => {
  it('renders with children as label', () => {
    render(<Radio>Option 1</Radio>);
    expect(screen.getByLabelText(/option 1/i)).toBeInTheDocument();
  });

  it('applies className and Bulma class', () => {
    const { container } = render(
      <Radio className="custom-class">Label Radio</Radio>
    );
    const label = container.querySelector('label');
    expect(label).toHaveClass('radio');
    expect(label).toHaveClass('custom-class');
  });

  it('applies classPrefix when provided', () => {
    const { container } = render(
      <ConfigProvider classPrefix="custom-">
        <Radio>Test Radio</Radio>
      </ConfigProvider>
    );
    const label = container.querySelector('label');
    expect(label).toHaveClass('custom-radio');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Radio data-testid="radio">Test</Radio>
        </ConfigProvider>
      );
      const label = container.querySelector('label');
      expect(label).toHaveClass('bulma-radio');
    });

    it('uses default classes when no prefix is provided', () => {
      const { container } = render(<Radio data-testid="radio">Test</Radio>);
      const label = container.querySelector('label');
      expect(label).toHaveClass('radio');
    });

    it('uses default classes when classPrefix is undefined', () => {
      const { container } = render(
        <ConfigProvider classPrefix={undefined}>
          <Radio data-testid="radio">Test</Radio>
        </ConfigProvider>
      );
      const label = container.querySelector('label');
      expect(label).toHaveClass('radio');
    });

    it('applies prefix to both main class and helper classes', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Radio m="2" data-testid="radio">
            Test
          </Radio>
        </ConfigProvider>
      );
      const label = container.querySelector('label');
      expect(label).toHaveClass('bulma-radio');
      expect(label).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      const { container } = render(
        <Radio p="3" data-testid="radio">
          Test
        </Radio>
      );
      const label = container.querySelector('label');
      expect(label).toHaveClass('radio');
      expect(label).toHaveClass('p-3');
    });
  });

  it('renders as unchecked by default', () => {
    render(<Radio>Radio Unchecked</Radio>);
    const input = screen.getByLabelText(/radio unchecked/i) as HTMLInputElement;
    expect(input.checked).toBe(false);
  });

  it('can be checked by user interaction', () => {
    render(
      <>
        <Radio name="group">First</Radio>
        <Radio name="group">Second</Radio>
      </>
    );
    const first = screen.getByLabelText(/first/i) as HTMLInputElement;
    const second = screen.getByLabelText(/second/i) as HTMLInputElement;
    fireEvent.click(second);
    expect(second.checked).toBe(true);
    expect(first.checked).toBe(false);
  });

  it('respects the checked prop', () => {
    render(
      <Radio checked onChange={() => {}}>
        Controlled Radio
      </Radio>
    );
    const input = screen.getByLabelText(
      /controlled radio/i
    ) as HTMLInputElement;
    expect(input.checked).toBe(true);
  });

  it('respects the disabled prop', () => {
    render(<Radio disabled>Disabled Radio</Radio>);
    const input = screen.getByLabelText(/disabled radio/i) as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('forwards ref to input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Radio ref={ref}>Ref Radio</Radio>);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('passes other props to input', () => {
    render(<Radio data-testid="my-radio">Other Radio</Radio>);
    expect(screen.getByTestId('my-radio')).toBeInTheDocument();
  });
});
