import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Tooltip } from '../Tooltip';

describe('Tooltip', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('rendering', () => {
    it('renders the tooltip wrapper', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toBeInTheDocument();
    });

    it('renders children', () => {
      render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(screen.getByText('Hover me')).toBeInTheDocument();
    });

    it('renders tooltip content with label', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip-content')).toHaveTextContent(
        'Test tooltip'
      );
    });

    it('has data-tooltip attribute with label', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveAttribute(
        'data-tooltip',
        'Test tooltip'
      );
    });
  });

  describe('visibility', () => {
    it('is hidden by default', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).not.toHaveClass('is-active');
    });

    it('becomes visible on mouse enter', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      fireEvent.mouseEnter(container.querySelector('.tooltip')!);
      act(() => {
        jest.runAllTimers();
      });

      expect(container.querySelector('.tooltip')).toHaveClass('is-active');
    });

    it('hides on mouse leave', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      const tooltip = container.querySelector('.tooltip')!;
      fireEvent.mouseEnter(tooltip);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).toHaveClass('is-active');

      fireEvent.mouseLeave(tooltip);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).not.toHaveClass('is-active');
    });

    it('becomes visible on focus', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      fireEvent.focus(container.querySelector('.tooltip')!);
      act(() => {
        jest.runAllTimers();
      });

      expect(container.querySelector('.tooltip')).toHaveClass('is-active');
    });

    it('hides on blur', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      const tooltip = container.querySelector('.tooltip')!;
      fireEvent.focus(tooltip);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).toHaveClass('is-active');

      fireEvent.blur(tooltip);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).not.toHaveClass('is-active');
    });
  });

  describe('always active', () => {
    it('is always visible when active prop is true', () => {
      const { container } = render(
        <Tooltip label="Test tooltip" active>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveClass('is-active');
    });

    it('stays visible on mouse leave when active', () => {
      const { container } = render(
        <Tooltip label="Test tooltip" active>
          <button>Hover me</button>
        </Tooltip>
      );

      const tooltip = container.querySelector('.tooltip')!;
      fireEvent.mouseEnter(tooltip);
      fireEvent.mouseLeave(tooltip);
      act(() => {
        jest.runAllTimers();
      });

      expect(tooltip).toHaveClass('is-active');
    });
  });

  describe('positions', () => {
    it.each(['top', 'bottom', 'left', 'right'] as const)(
      'applies is-%s class when position="%s"',
      position => {
        const { container } = render(
          <Tooltip label="Test" position={position}>
            <button>Hover me</button>
          </Tooltip>
        );
        expect(container.querySelector('.tooltip')).toHaveClass(
          `is-${position}`
        );
      }
    );

    it('defaults to top position', () => {
      const { container } = render(
        <Tooltip label="Test">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveClass('is-top');
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
      'dark',
      'light',
    ] as const)('applies is-%s class when color="%s"', color => {
      const { container } = render(
        <Tooltip label="Test" color={color}>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveClass(`is-${color}`);
    });
  });

  describe('sizes', () => {
    it.each(['small', 'medium', 'large'] as const)(
      'applies is-%s class when size="%s"',
      size => {
        const { container } = render(
          <Tooltip label="Test" size={size}>
            <button>Hover me</button>
          </Tooltip>
        );
        expect(container.querySelector('.tooltip')).toHaveClass(`is-${size}`);
      }
    );

    it('does not apply size class by default', () => {
      const { container } = render(
        <Tooltip label="Test">
          <button>Hover me</button>
        </Tooltip>
      );
      const tooltip = container.querySelector('.tooltip');
      expect(tooltip).not.toHaveClass('is-small');
      expect(tooltip).not.toHaveClass('is-medium');
      expect(tooltip).not.toHaveClass('is-large');
    });
  });

  describe('multiline', () => {
    it('applies is-multiline class when multiline is true', () => {
      const { container } = render(
        <Tooltip label="Long tooltip text" multiline>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveClass('is-multiline');
    });

    it('does not apply is-multiline class when multiline is false', () => {
      const { container } = render(
        <Tooltip label="Test" multiline={false}>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).not.toHaveClass(
        'is-multiline'
      );
    });
  });

  describe('animated', () => {
    it('applies is-animated class by default', () => {
      const { container } = render(
        <Tooltip label="Test">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveClass('is-animated');
    });

    it('does not apply is-animated class when animated is false', () => {
      const { container } = render(
        <Tooltip label="Test" animated={false}>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).not.toHaveClass(
        'is-animated'
      );
    });
  });

  describe('square', () => {
    it('applies is-square class when square is true', () => {
      const { container } = render(
        <Tooltip label="Test" square>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveClass('is-square');
    });

    it('does not apply is-square class by default', () => {
      const { container } = render(
        <Tooltip label="Test">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).not.toHaveClass('is-square');
    });
  });

  describe('dashed', () => {
    it('applies is-dashed class when dashed is true', () => {
      const { container } = render(
        <Tooltip label="Test" dashed>
          <span>Hover me</span>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveClass('is-dashed');
    });

    it('does not apply is-dashed class by default', () => {
      const { container } = render(
        <Tooltip label="Test">
          <span>Hover me</span>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).not.toHaveClass('is-dashed');
    });
  });

  describe('delay', () => {
    it('shows tooltip immediately when delay is 0', () => {
      const { container } = render(
        <Tooltip label="Test" delay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      fireEvent.mouseEnter(container.querySelector('.tooltip')!);
      act(() => {
        jest.runAllTimers();
      });

      expect(container.querySelector('.tooltip')).toHaveClass('is-active');
    });

    it('delays showing tooltip when delay is set', () => {
      const { container } = render(
        <Tooltip label="Test" delay={500}>
          <button>Hover me</button>
        </Tooltip>
      );

      fireEvent.mouseEnter(container.querySelector('.tooltip')!);

      // Not visible yet
      expect(container.querySelector('.tooltip')).not.toHaveClass('is-active');

      // After delay
      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(container.querySelector('.tooltip')).toHaveClass('is-active');
    });

    it('cancels delay when mouse leaves before timeout', () => {
      const { container } = render(
        <Tooltip label="Test" delay={500}>
          <button>Hover me</button>
        </Tooltip>
      );

      const tooltip = container.querySelector('.tooltip')!;
      fireEvent.mouseEnter(tooltip);

      // Not visible yet
      expect(tooltip).not.toHaveClass('is-active');

      // Leave before delay completes
      act(() => {
        jest.advanceTimersByTime(250);
      });
      fireEvent.mouseLeave(tooltip);

      act(() => {
        jest.advanceTimersByTime(250);
      });

      // Should still not be visible
      expect(tooltip).not.toHaveClass('is-active');
    });
  });

  describe('closeDelay', () => {
    it('hides tooltip immediately when closeDelay is 0', () => {
      const { container } = render(
        <Tooltip label="Test" closeDelay={0}>
          <button>Hover me</button>
        </Tooltip>
      );

      const tooltip = container.querySelector('.tooltip')!;
      fireEvent.mouseEnter(tooltip);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).toHaveClass('is-active');

      fireEvent.mouseLeave(tooltip);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).not.toHaveClass('is-active');
    });

    it('delays hiding tooltip when closeDelay is set', () => {
      const { container } = render(
        <Tooltip label="Test" closeDelay={500}>
          <button>Hover me</button>
        </Tooltip>
      );

      const tooltip = container.querySelector('.tooltip')!;
      fireEvent.mouseEnter(tooltip);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).toHaveClass('is-active');

      fireEvent.mouseLeave(tooltip);

      // Still visible immediately after leave
      expect(tooltip).toHaveClass('is-active');

      // Still visible before closeDelay elapses
      act(() => {
        jest.advanceTimersByTime(250);
      });
      expect(tooltip).toHaveClass('is-active');

      // Hidden after closeDelay elapses
      act(() => {
        jest.advanceTimersByTime(250);
      });
      expect(tooltip).not.toHaveClass('is-active');
    });

    it('cancels close delay when mouse re-enters before timeout', () => {
      const { container } = render(
        <Tooltip label="Test" closeDelay={500}>
          <button>Hover me</button>
        </Tooltip>
      );

      const tooltip = container.querySelector('.tooltip')!;
      fireEvent.mouseEnter(tooltip);
      act(() => {
        jest.runAllTimers();
      });
      expect(tooltip).toHaveClass('is-active');

      // Leave, then re-enter before closeDelay elapses
      fireEvent.mouseLeave(tooltip);
      act(() => {
        jest.advanceTimersByTime(250);
      });
      fireEvent.mouseEnter(tooltip);
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should still be visible
      expect(tooltip).toHaveClass('is-active');
    });
  });

  describe('accessibility', () => {
    it('tooltip content has role="tooltip"', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip-content')).toHaveAttribute(
        'role',
        'tooltip'
      );
    });

    it('tooltip content has aria-hidden="true" when not visible', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip-content')).toHaveAttribute(
        'aria-hidden',
        'true'
      );
    });

    it('tooltip content has aria-hidden="false" when visible', () => {
      const { container } = render(
        <Tooltip label="Test tooltip">
          <button>Hover me</button>
        </Tooltip>
      );

      fireEvent.mouseEnter(container.querySelector('.tooltip')!);
      act(() => {
        jest.runAllTimers();
      });

      expect(screen.getByRole('tooltip')).toHaveAttribute(
        'aria-hidden',
        'false'
      );
    });

    it('tooltip content has aria-hidden="false" when always active', () => {
      render(
        <Tooltip label="Test tooltip" active>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(screen.getByRole('tooltip')).toHaveAttribute(
        'aria-hidden',
        'false'
      );
    });
  });

  describe('className handling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <Tooltip label="Test" className="custom-class">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveClass('custom-class');
    });

    it('applies tooltipClassName to content', () => {
      const { container } = render(
        <Tooltip label="Test" tooltipClassName="custom-tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip-content')).toHaveClass(
        'custom-tooltip'
      );
    });

    it('combines multiple classes correctly', () => {
      const { container } = render(
        <Tooltip
          label="Test"
          position="bottom"
          color="primary"
          multiline
          className="custom-class"
        >
          <button>Hover me</button>
        </Tooltip>
      );
      const tooltip = container.querySelector('.tooltip');
      expect(tooltip).toHaveClass(
        'tooltip',
        'is-bottom',
        'is-primary',
        'is-multiline',
        'custom-class'
      );
    });
  });

  describe('Bulma helper classes', () => {
    it('applies Bulma helper classes from props', () => {
      const { container } = render(
        <Tooltip label="Test" m="2" p="3">
          <button>Hover me</button>
        </Tooltip>
      );
      const tooltip = container.querySelector('.tooltip');
      expect(tooltip).toHaveClass('m-2', 'p-3');
    });
  });

  describe('HTML attributes', () => {
    it('passes through HTML attributes', () => {
      const { container } = render(
        <Tooltip label="Test" data-testid="tooltip" id="my-tooltip">
          <button>Hover me</button>
        </Tooltip>
      );
      const tooltip = container.querySelector('.tooltip');
      expect(tooltip).toHaveAttribute('data-testid', 'tooltip');
      expect(tooltip).toHaveAttribute('id', 'my-tooltip');
    });
  });

  describe('custom content', () => {
    it('renders ReactNode content when content prop is provided', () => {
      const { container } = render(
        <Tooltip content={<span data-testid="rich"><strong>Bold</strong> text</span>}>
          <button>Hover me</button>
        </Tooltip>
      );
      const tooltipContent = container.querySelector('.tooltip-content');
      expect(tooltipContent).toContainHTML('<strong>Bold</strong>');
      expect(tooltipContent).toHaveTextContent('Bold text');
    });

    it('content takes precedence over label when both provided', () => {
      const { container } = render(
        <Tooltip label="Label text" content={<em>Content text</em>}>
          <button>Hover me</button>
        </Tooltip>
      );
      const tooltipContent = container.querySelector('.tooltip-content');
      expect(tooltipContent).toHaveTextContent('Content text');
      expect(tooltipContent).not.toHaveTextContent('Label text');
    });

    it('omits data-tooltip attribute when only content is provided', () => {
      const { container } = render(
        <Tooltip content={<span>Rich content</span>}>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).not.toHaveAttribute('data-tooltip');
    });

    it('sets data-tooltip attribute when label is provided alongside content', () => {
      const { container } = render(
        <Tooltip label="Label text" content={<span>Rich content</span>}>
          <button>Hover me</button>
        </Tooltip>
      );
      expect(container.querySelector('.tooltip')).toHaveAttribute('data-tooltip', 'Label text');
    });
  });
});
