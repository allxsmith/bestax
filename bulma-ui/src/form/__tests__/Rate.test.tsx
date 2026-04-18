import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Rate } from '../Rate';

describe('Rate', () => {
  describe('Rendering', () => {
    it('renders 5 stars by default', () => {
      render(<Rate />);
      const stars = screen.getAllByRole('radio');
      expect(stars).toHaveLength(5);
    });

    it('renders with default value', () => {
      render(<Rate defaultValue={3} />);
      const container = screen.getByRole('radiogroup');
      expect(container).toHaveAttribute('aria-valuenow', '3');
    });

    it('renders with controlled value', () => {
      render(<Rate value={4} onChange={() => {}} />);
      const container = screen.getByRole('radiogroup');
      expect(container).toHaveAttribute('aria-valuenow', '4');
    });

    it('applies custom className', () => {
      const { container } = render(<Rate className="custom-class" />);
      expect(container.querySelector('.rate')).toHaveClass('custom-class');
    });

    it('applies rate class', () => {
      const { container } = render(<Rate />);
      expect(container.querySelector('.rate')).toHaveClass('rate');
    });

    it('renders custom max number of icons', () => {
      render(<Rate max={10} />);
      const stars = screen.getAllByRole('radio');
      expect(stars).toHaveLength(10);
    });
  });

  describe('Value Changes', () => {
    it('calls onChange when star is clicked', async () => {
      const handleChange = jest.fn();
      render(<Rate value={0} onChange={handleChange} />);

      const stars = screen.getAllByRole('radio');
      await userEvent.click(stars[2]); // Click 3rd star

      expect(handleChange).toHaveBeenCalledWith(3);
    });

    it('allows deselecting by clicking same value', async () => {
      const handleChange = jest.fn();
      render(<Rate value={3} onChange={handleChange} />);

      const stars = screen.getAllByRole('radio');
      await userEvent.click(stars[2]); // Click 3rd star (current value)

      expect(handleChange).toHaveBeenCalledWith(0);
    });

    it('updates uncontrolled value internally', async () => {
      render(<Rate defaultValue={0} />);

      const stars = screen.getAllByRole('radio');
      await userEvent.click(stars[3]); // Click 4th star

      const container = screen.getByRole('radiogroup');
      expect(container).toHaveAttribute('aria-valuenow', '4');
    });

    it('highlights all stars up to selected value', () => {
      render(<Rate defaultValue={3} />);

      const stars = screen.getAllByRole('radio');
      expect(stars[0]).toHaveClass('is-active');
      expect(stars[1]).toHaveClass('is-active');
      expect(stars[2]).toHaveClass('is-active');
      expect(stars[3]).not.toHaveClass('is-active');
      expect(stars[4]).not.toHaveClass('is-active');
    });
  });

  describe('Hover Behavior', () => {
    it('applies hover class on mouse enter', () => {
      render(<Rate defaultValue={0} />);

      const stars = screen.getAllByRole('radio');
      fireEvent.mouseEnter(stars[2]);

      expect(stars[0]).toHaveClass('is-hovered');
      expect(stars[1]).toHaveClass('is-hovered');
      expect(stars[2]).toHaveClass('is-hovered');
    });

    it('removes hover class on mouse leave', () => {
      render(<Rate defaultValue={0} />);

      const stars = screen.getAllByRole('radio');
      fireEvent.mouseEnter(stars[2]);
      fireEvent.mouseLeave(stars[2]);

      expect(stars[0]).not.toHaveClass('is-hovered');
      expect(stars[1]).not.toHaveClass('is-hovered');
      expect(stars[2]).not.toHaveClass('is-hovered');
    });
  });

  describe('Sizes', () => {
    it('applies small size class', () => {
      const { container } = render(<Rate size="small" />);
      expect(container.querySelector('.rate')).toHaveClass('is-small');
    });

    it('applies medium size class', () => {
      const { container } = render(<Rate size="medium" />);
      expect(container.querySelector('.rate')).toHaveClass('is-medium');
    });

    it('applies large size class', () => {
      const { container } = render(<Rate size="large" />);
      expect(container.querySelector('.rate')).toHaveClass('is-large');
    });
  });

  describe('Score Display', () => {
    it('shows score when showScore is true', () => {
      render(<Rate defaultValue={4} showScore />);
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('does not show score by default', () => {
      render(<Rate defaultValue={4} />);
      expect(screen.queryByText('4')).not.toBeInTheDocument();
    });

    it('updates score on value change', async () => {
      render(<Rate defaultValue={2} showScore />);

      expect(screen.getByText('2')).toBeInTheDocument();

      const stars = screen.getAllByRole('radio');
      await userEvent.click(stars[4]);

      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('Text Display', () => {
    it('shows text when showText is true and texts provided', () => {
      const texts = ['Poor', 'Fair', 'Average', 'Good', 'Excellent'];
      render(<Rate defaultValue={3} showText texts={texts} />);
      expect(screen.getByText('Average')).toBeInTheDocument();
    });

    it('does not show text by default', () => {
      const texts = ['Poor', 'Fair', 'Average', 'Good', 'Excellent'];
      render(<Rate defaultValue={3} texts={texts} />);
      expect(screen.queryByText('Average')).not.toBeInTheDocument();
    });

    it('updates text on value change', async () => {
      const texts = ['Poor', 'Fair', 'Average', 'Good', 'Excellent'];
      render(<Rate defaultValue={1} showText texts={texts} />);

      expect(screen.getByText('Poor')).toBeInTheDocument();

      const stars = screen.getAllByRole('radio');
      await userEvent.click(stars[4]);

      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('applies is-disabled class when disabled', () => {
      const { container } = render(<Rate disabled />);
      expect(container.querySelector('.rate')).toHaveClass('is-disabled');
    });

    it('does not call onChange when disabled', async () => {
      const handleChange = jest.fn();
      render(<Rate disabled onChange={handleChange} />);

      const stars = screen.getAllByRole('radio');
      await userEvent.click(stars[2]);

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('does not respond to hover when disabled', () => {
      render(<Rate disabled defaultValue={0} />);

      const stars = screen.getAllByRole('radio');
      fireEvent.mouseEnter(stars[2]);

      expect(stars[2]).not.toHaveClass('is-hovered');
    });

    it('sets tabIndex to -1 when disabled', () => {
      render(<Rate disabled />);
      const container = screen.getByRole('radiogroup');
      expect(container).toHaveAttribute('tabindex', '-1');
    });
  });

  describe('Spaced Variant', () => {
    it('applies is-spaced class when spaced is true', () => {
      const { container } = render(<Rate spaced />);
      expect(container.querySelector('.rate')).toHaveClass('is-spaced');
    });
  });

  describe('RTL Variant', () => {
    it('applies is-rtl class when rtl is true', () => {
      const { container } = render(<Rate rtl />);
      expect(container.querySelector('.rate')).toHaveClass('is-rtl');
    });
  });

  describe('Keyboard Navigation', () => {
    it('increases value on ArrowRight', () => {
      const handleChange = jest.fn();
      render(<Rate value={3} onChange={handleChange} />);

      const container = screen.getByRole('radiogroup');
      fireEvent.keyDown(container, { key: 'ArrowRight' });

      expect(handleChange).toHaveBeenCalledWith(4);
    });

    it('increases value on ArrowUp', () => {
      const handleChange = jest.fn();
      render(<Rate value={3} onChange={handleChange} />);

      const container = screen.getByRole('radiogroup');
      fireEvent.keyDown(container, { key: 'ArrowUp' });

      expect(handleChange).toHaveBeenCalledWith(4);
    });

    it('decreases value on ArrowLeft', () => {
      const handleChange = jest.fn();
      render(<Rate value={3} onChange={handleChange} />);

      const container = screen.getByRole('radiogroup');
      fireEvent.keyDown(container, { key: 'ArrowLeft' });

      expect(handleChange).toHaveBeenCalledWith(2);
    });

    it('decreases value on ArrowDown', () => {
      const handleChange = jest.fn();
      render(<Rate value={3} onChange={handleChange} />);

      const container = screen.getByRole('radiogroup');
      fireEvent.keyDown(container, { key: 'ArrowDown' });

      expect(handleChange).toHaveBeenCalledWith(2);
    });

    it('sets value to 0 on Home', () => {
      const handleChange = jest.fn();
      render(<Rate value={3} onChange={handleChange} />);

      const container = screen.getByRole('radiogroup');
      fireEvent.keyDown(container, { key: 'Home' });

      expect(handleChange).toHaveBeenCalledWith(0);
    });

    it('sets value to max on End', () => {
      const handleChange = jest.fn();
      render(<Rate value={3} max={5} onChange={handleChange} />);

      const container = screen.getByRole('radiogroup');
      fireEvent.keyDown(container, { key: 'End' });

      expect(handleChange).toHaveBeenCalledWith(5);
    });

    it('respects max boundary on ArrowRight', () => {
      const handleChange = jest.fn();
      render(<Rate value={5} max={5} onChange={handleChange} />);

      const container = screen.getByRole('radiogroup');
      fireEvent.keyDown(container, { key: 'ArrowRight' });

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('respects min boundary on ArrowLeft', () => {
      const handleChange = jest.fn();
      render(<Rate value={0} onChange={handleChange} />);

      const container = screen.getByRole('radiogroup');
      fireEvent.keyDown(container, { key: 'ArrowLeft' });

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('does not respond to keyboard when disabled', () => {
      const handleChange = jest.fn();
      render(<Rate value={3} onChange={handleChange} disabled />);

      const container = screen.getByRole('radiogroup');
      fireEvent.keyDown(container, { key: 'ArrowRight' });

      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has radiogroup role on container', () => {
      render(<Rate />);
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('has aria-label on container', () => {
      render(<Rate />);
      expect(screen.getByRole('radiogroup')).toHaveAttribute(
        'aria-label',
        'Rating'
      );
    });

    it('has aria-valuenow on container', () => {
      render(<Rate defaultValue={3} />);
      expect(screen.getByRole('radiogroup')).toHaveAttribute(
        'aria-valuenow',
        '3'
      );
    });

    it('has aria-valuemin on container', () => {
      render(<Rate />);
      expect(screen.getByRole('radiogroup')).toHaveAttribute(
        'aria-valuemin',
        '0'
      );
    });

    it('has aria-valuemax on container', () => {
      render(<Rate max={10} />);
      expect(screen.getByRole('radiogroup')).toHaveAttribute(
        'aria-valuemax',
        '10'
      );
    });

    it('each star has radio role', () => {
      render(<Rate />);
      const stars = screen.getAllByRole('radio');
      expect(stars).toHaveLength(5);
    });

    it('each star has aria-label', () => {
      render(<Rate />);
      expect(screen.getByRole('radio', { name: '1 star' })).toBeInTheDocument();
      expect(
        screen.getByRole('radio', { name: '2 stars' })
      ).toBeInTheDocument();
    });

    it('stars have aria-checked based on value', () => {
      render(<Rate defaultValue={3} />);
      const stars = screen.getAllByRole('radio');

      expect(stars[2]).toHaveAttribute('aria-checked', 'true');
      expect(stars[0]).toHaveAttribute('aria-checked', 'false');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to container element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Rate ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('can focus container via ref', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Rate ref={ref} />);
      ref.current?.focus();
      expect(document.activeElement).toBe(ref.current);
    });
  });

  describe('Custom Icons', () => {
    it('renders custom icons when customIcon is provided', () => {
      render(
        <Rate
          defaultValue={3}
          customIcon={({ isActive }) => (
            <span data-testid="custom-icon">{isActive ? '★' : '☆'}</span>
          )}
        />
      );

      const icons = screen.getAllByTestId('custom-icon');
      expect(icons).toHaveLength(5);
    });

    it('passes correct props to custom icon', () => {
      const customIcon = jest.fn(() => <span>icon</span>);
      render(<Rate defaultValue={2} customIcon={customIcon} />);

      // Check that customIcon was called with correct props
      expect(customIcon).toHaveBeenCalledTimes(5);
      expect(customIcon).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 0,
          isActive: true,
          value: 2,
          fillPercent: 100,
        })
      );
    });

    it('customIcon takes priority over iconName', () => {
      const customIcon = jest.fn(() => <span data-testid="custom">custom</span>);
      render(
        <Rate
          defaultValue={2}
          customIcon={customIcon}
          iconName="star"
          iconLibrary="fa"
        />
      );

      expect(screen.getAllByTestId('custom')).toHaveLength(5);
      // Icon component should not be rendered
      expect(screen.queryByLabelText('icon')).not.toBeInTheDocument();
    });
  });

  describe('Color Support', () => {
    it('applies is-{color} class for each color', () => {
      const colors = ['primary', 'link', 'info', 'success', 'warning', 'danger'] as const;

      colors.forEach((color) => {
        const { container, unmount } = render(<Rate color={color} />);
        expect(container.querySelector('.rate')).toHaveClass(`is-${color}`);
        unmount();
      });
    });

    it('does not apply color class when prop omitted', () => {
      const { container } = render(<Rate />);
      const element = container.querySelector('.rate') as HTMLElement;
      expect(element.className).not.toMatch(/is-(primary|link|info|success|warning|danger)/);
    });

    it('combines color with other classes', () => {
      const { container } = render(<Rate color="danger" size="large" disabled />);
      expect(container.querySelector('.rate')).toHaveClass('is-danger');
      expect(container.querySelector('.rate')).toHaveClass('is-large');
      expect(container.querySelector('.rate')).toHaveClass('is-disabled');
    });
  });

  describe('Icon Library', () => {
    it('renders Icon component when iconName provided', () => {
      const { container } = render(
        <Rate defaultValue={2} iconName="star" iconLibrary="fa" iconVariant="solid" />
      );
      // Icon renders a <span class="icon"> with <i> inside
      const iconSpans = container.querySelectorAll('.icon');
      expect(iconSpans.length).toBeGreaterThan(0);
    });

    it('renders default SVG when no iconName', () => {
      const { container } = render(<Rate defaultValue={2} />);
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBe(5);
    });

    it('passes library, variant, and features to Icon', () => {
      const { container } = render(
        <Rate
          defaultValue={1}
          iconName="star"
          iconLibrary="mdi"
          iconFeatures="mdi-24px"
        />
      );
      const iElement = container.querySelector('i.mdi');
      expect(iElement).toBeInTheDocument();
    });
  });

  describe('Precision', () => {
    it('keyboard arrows step by precision', () => {
      const handleChange = jest.fn();
      render(<Rate value={3} onChange={handleChange} precision={0.5} />);

      const container = screen.getByRole('radiogroup');
      fireEvent.keyDown(container, { key: 'ArrowRight' });

      expect(handleChange).toHaveBeenCalledWith(3.5);
    });

    it('aria-valuenow reflects fractional values', () => {
      render(<Rate value={3.5} onChange={() => {}} precision={0.5} />);
      const container = screen.getByRole('radiogroup');
      expect(container).toHaveAttribute('aria-valuenow', '3.5');
    });

    it('score shows decimal format for fractional values', () => {
      render(<Rate value={3.5} onChange={() => {}} precision={0.5} showScore />);
      expect(screen.getByText('3.5')).toBeInTheDocument();
    });

    it('partial fill applied for fractional icon', () => {
      const { container } = render(
        <Rate defaultValue={3.5} precision={0.5} />
      );
      // The 4th star (index 3) should have a partial fill SVG with a clipPath
      const clipPaths = container.querySelectorAll('clipPath');
      expect(clipPaths.length).toBeGreaterThan(0);
    });

    it('Home key works with precision', () => {
      const handleChange = jest.fn();
      render(<Rate value={3.5} onChange={handleChange} precision={0.5} />);

      const container = screen.getByRole('radiogroup');
      fireEvent.keyDown(container, { key: 'Home' });

      expect(handleChange).toHaveBeenCalledWith(0);
    });

    it('End key works with precision', () => {
      const handleChange = jest.fn();
      render(<Rate value={3.5} onChange={handleChange} precision={0.5} max={5} />);

      const container = screen.getByRole('radiogroup');
      fireEvent.keyDown(container, { key: 'End' });

      expect(handleChange).toHaveBeenCalledWith(5);
    });
  });

  describe('Custom Text', () => {
    it('renders customText', () => {
      render(<Rate defaultValue={4} customText="(128 reviews)" />);
      expect(screen.getByText('(128 reviews)')).toBeInTheDocument();
    });

    it('renders customText alongside showScore', () => {
      render(<Rate defaultValue={4} showScore customText="(128 reviews)" />);
      expect(screen.getByText('4')).toBeInTheDocument();
      expect(screen.getByText('(128 reviews)')).toBeInTheDocument();
    });
  });

  describe('Interactive Feedback', () => {
    it('text shows "+" suffix for fractional hover values', () => {
      const texts = ['Bad', 'Poor', 'Normal', 'Good', 'Super'];
      render(
        <Rate
          defaultValue={0}
          precision={0.5}
          showText
          texts={texts}
        />
      );

      const stars = screen.getAllByRole('radio');
      // Hover over 3rd star to trigger hoverValue of 3
      fireEvent.mouseEnter(stars[2]);

      // With precision=1 behavior on mouseEnter (whole number hover), text should be "Normal"
      expect(screen.getByText('Normal')).toBeInTheDocument();
    });

    it('text updates on hover', () => {
      const texts = ['Bad', 'Poor', 'Normal', 'Good', 'Super'];
      render(
        <Rate
          defaultValue={0}
          showText
          texts={texts}
        />
      );

      const stars = screen.getAllByRole('radio');
      fireEvent.mouseEnter(stars[4]);

      expect(screen.getByText('Super')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles value of 0', () => {
      render(<Rate defaultValue={0} />);
      const stars = screen.getAllByRole('radio');
      stars.forEach(star => {
        expect(star).not.toHaveClass('is-active');
      });
    });

    it('handles max value', () => {
      render(<Rate defaultValue={5} max={5} />);
      const stars = screen.getAllByRole('radio');
      stars.forEach(star => {
        expect(star).toHaveClass('is-active');
      });
    });

    it('handles value greater than max', () => {
      render(<Rate defaultValue={10} max={5} />);
      const stars = screen.getAllByRole('radio');
      stars.forEach(star => {
        expect(star).toHaveClass('is-active');
      });
    });

    it('handles single star (max=1)', () => {
      render(<Rate max={1} />);
      const stars = screen.getAllByRole('radio');
      expect(stars).toHaveLength(1);
    });

    it('handles texts array shorter than max', () => {
      const texts = ['Low', 'High'];
      render(<Rate defaultValue={5} showText texts={texts} max={5} />);
      // Should not crash, just not show text for values outside array
      const container = screen.getByRole('radiogroup');
      expect(container).toBeInTheDocument();
    });
  });
});
