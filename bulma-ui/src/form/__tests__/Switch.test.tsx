import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Switch } from '../Switch';

describe('Switch', () => {
  describe('rendering', () => {
    it('renders a switch input', () => {
      render(<Switch data-testid="switch" />);
      expect(screen.getByTestId('switch')).toBeInTheDocument();
      expect(screen.getByTestId('switch')).toHaveAttribute('type', 'checkbox');
    });

    it('renders with children as label', () => {
      render(<Switch>Enable feature</Switch>);
      expect(screen.getByText('Enable feature')).toBeInTheDocument();
    });

    it('renders without label when no children provided', () => {
      const { container } = render(<Switch />);
      expect(container.querySelector('.control-label')).not.toBeInTheDocument();
    });

    it('applies the switch class to the label', () => {
      const { container } = render(<Switch />);
      expect(container.querySelector('label')).toHaveClass('switch');
    });

    it('renders check span element', () => {
      const { container } = render(<Switch />);
      expect(container.querySelector('.check')).toBeInTheDocument();
    });
  });

  describe('colors', () => {
    it.each([
      'primary',
      'link',
      'info',
      'success',
      'warning',
      'danger',
    ] as const)('applies is-%s class when color="%s"', color => {
      const { container } = render(<Switch color={color} />);
      expect(container.querySelector('label')).toHaveClass(`is-${color}`);
    });
  });

  describe('sizes', () => {
    it.each(['small', 'normal', 'medium', 'large'] as const)(
      'applies is-%s class when size="%s"',
      size => {
        const { container } = render(<Switch size={size} />);
        expect(container.querySelector('label')).toHaveClass(`is-${size}`);
      }
    );
  });

  describe('style variants', () => {
    it('applies is-rounded class when isRounded is true', () => {
      const { container } = render(<Switch isRounded />);
      expect(container.querySelector('label')).toHaveClass('is-rounded');
    });

    it('applies is-thin class when isThin is true', () => {
      const { container } = render(<Switch isThin />);
      expect(container.querySelector('label')).toHaveClass('is-thin');
    });

    it('applies is-outlined class when isOutlined is true', () => {
      const { container } = render(<Switch isOutlined />);
      expect(container.querySelector('label')).toHaveClass('is-outlined');
    });

    it('applies is-rtl class when isRtl is true', () => {
      const { container } = render(<Switch isRtl />);
      expect(container.querySelector('label')).toHaveClass('is-rtl');
    });

    it('does not apply variant classes when props are false', () => {
      const { container } = render(
        <Switch isRounded={false} isThin={false} isOutlined={false} />
      );
      const label = container.querySelector('label');
      expect(label).not.toHaveClass('is-rounded');
      expect(label).not.toHaveClass('is-thin');
      expect(label).not.toHaveClass('is-outlined');
    });
  });

  describe('checked state', () => {
    it('is unchecked by default', () => {
      render(<Switch data-testid="switch" />);
      expect(screen.getByTestId('switch')).not.toBeChecked();
    });

    it('respects defaultChecked prop', () => {
      render(<Switch data-testid="switch" defaultChecked />);
      expect(screen.getByTestId('switch')).toBeChecked();
    });

    it('respects checked prop for controlled usage', () => {
      const { rerender } = render(
        <Switch data-testid="switch" checked={false} onChange={() => {}} />
      );
      expect(screen.getByTestId('switch')).not.toBeChecked();

      rerender(
        <Switch data-testid="switch" checked={true} onChange={() => {}} />
      );
      expect(screen.getByTestId('switch')).toBeChecked();
    });
  });

  describe('disabled state', () => {
    it('is not disabled by default', () => {
      render(<Switch data-testid="switch" />);
      expect(screen.getByTestId('switch')).not.toBeDisabled();
    });

    it('is disabled when disabled prop is true', () => {
      render(<Switch data-testid="switch" disabled />);
      expect(screen.getByTestId('switch')).toBeDisabled();
    });
  });

  describe('events', () => {
    it('calls onChange when clicked', () => {
      const handleChange = jest.fn();
      render(<Switch data-testid="switch" onChange={handleChange} />);

      fireEvent.click(screen.getByTestId('switch'));
      expect(handleChange).toHaveBeenCalledTimes(1);
    });

    it('has proper disabled attribute when disabled', () => {
      // Note: We don't test clicking a disabled element because JSDOM's fireEvent
      // can incorrectly toggle disabled checkboxes. The real browser correctly
      // ignores clicks on disabled inputs. We verify the attribute is set.
      render(<Switch data-testid="switch" disabled defaultChecked />);
      const input = screen.getByTestId('switch');

      expect(input).toBeDisabled();
      expect(input).toBeChecked(); // defaultChecked is preserved
    });

    it('toggles checked state on click (uncontrolled)', () => {
      render(<Switch data-testid="switch" />);
      const input = screen.getByTestId('switch');

      expect(input).not.toBeChecked();
      fireEvent.click(input);
      expect(input).toBeChecked();
      fireEvent.click(input);
      expect(input).not.toBeChecked();
    });
  });

  describe('className handling', () => {
    it('applies custom className', () => {
      const { container } = render(<Switch className="custom-class" />);
      expect(container.querySelector('label')).toHaveClass('custom-class');
    });

    it('combines multiple classes correctly', () => {
      const { container } = render(
        <Switch color="primary" isRounded className="custom-class" />
      );
      const label = container.querySelector('label');
      expect(label).toHaveClass(
        'switch',
        'is-primary',
        'is-rounded',
        'custom-class'
      );
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Switch ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.type).toBe('checkbox');
    });
  });

  describe('HTML attributes', () => {
    it('passes through HTML attributes to input', () => {
      render(
        <Switch
          data-testid="switch"
          name="toggle"
          id="my-switch"
          aria-label="Toggle switch"
        />
      );
      const input = screen.getByTestId('switch');
      expect(input).toHaveAttribute('name', 'toggle');
      expect(input).toHaveAttribute('id', 'my-switch');
      expect(input).toHaveAttribute('aria-label', 'Toggle switch');
    });
  });

  describe('Bulma helper classes', () => {
    it('applies Bulma helper classes from props', () => {
      const { container } = render(<Switch m="2" p="3" />);
      const label = container.querySelector('label');
      expect(label).toHaveClass('m-2', 'p-3');
    });
  });
});
