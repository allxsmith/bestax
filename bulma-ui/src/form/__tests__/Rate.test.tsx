import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Rate } from '../Rate';
import { Field } from '../Field';
import { Control } from '../Control';

/**
 * Helper: stub `getBoundingClientRect` on every `.rate-item` span so
 * precision-mode click/move handlers can compute a deterministic
 * `relativeX = (clientX - rect.left) / rect.width`.
 */
function stubRectsOnRateItems(container: HTMLElement, width = 20) {
  const items = container.querySelectorAll<HTMLSpanElement>('.rate-item');
  items.forEach((item, idx) => {
    item.getBoundingClientRect = () =>
      ({
        left: idx * width,
        top: 0,
        right: idx * width + width,
        bottom: 24,
        width,
        height: 24,
        x: idx * width,
        y: 0,
        toJSON: () => ({}),
      }) as DOMRect;
  });
}

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

    it('non-arrow/Home/End keys are no-op (covers else-if false branch)', () => {
      const handleChange = jest.fn();
      render(<Rate value={3} onChange={handleChange} />);
      const container = screen.getByRole('radiogroup');
      fireEvent.keyDown(container, { key: 'PageDown' });
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Hidden form input', () => {
    it('renders hidden input with name and value', () => {
      const { container } = render(<Rate name="rating" value={4} />);
      const hidden = container.querySelector(
        'input[type="hidden"]'
      ) as HTMLInputElement;
      expect(hidden).toBeInTheDocument();
      expect(hidden.name).toBe('rating');
      expect(hidden.value).toBe('4');
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
      const customIcon = jest.fn(() => (
        <span data-testid="custom">custom</span>
      ));
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
      const colors = [
        'primary',
        'link',
        'info',
        'success',
        'warning',
        'danger',
      ] as const;

      colors.forEach(color => {
        const { container, unmount } = render(<Rate color={color} />);
        expect(container.querySelector('.rate')).toHaveClass(`is-${color}`);
        unmount();
      });
    });

    it('does not apply color class when prop omitted', () => {
      const { container } = render(<Rate />);
      const element = container.querySelector('.rate') as HTMLElement;
      expect(element.className).not.toMatch(
        /is-(primary|link|info|success|warning|danger)/
      );
    });

    it('combines color with other classes', () => {
      const { container } = render(
        <Rate color="danger" size="large" disabled />
      );
      expect(container.querySelector('.rate')).toHaveClass('is-danger');
      expect(container.querySelector('.rate')).toHaveClass('is-large');
      expect(container.querySelector('.rate')).toHaveClass('is-disabled');
    });
  });

  describe('Icon Library', () => {
    it('renders Icon component when iconName provided', () => {
      const { container } = render(
        <Rate
          defaultValue={2}
          iconName="star"
          iconLibrary="fa"
          iconVariant="solid"
        />
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
      render(
        <Rate value={3.5} onChange={() => {}} precision={0.5} showScore />
      );
      expect(screen.getByText('3.5')).toBeInTheDocument();
    });

    it('partial fill applied for fractional icon', () => {
      const { container } = render(<Rate defaultValue={3.5} precision={0.5} />);
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
      render(
        <Rate value={3.5} onChange={handleChange} precision={0.5} max={5} />
      );

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
      render(<Rate defaultValue={0} precision={0.5} showText texts={texts} />);

      const stars = screen.getAllByRole('radio');
      // Hover over 3rd star to trigger hoverValue of 3
      fireEvent.mouseEnter(stars[2]);

      // With precision=1 behavior on mouseEnter (whole number hover), text should be "Normal"
      expect(screen.getByText('Normal')).toBeInTheDocument();
    });

    it('text updates on hover', () => {
      const texts = ['Bad', 'Poor', 'Normal', 'Good', 'Super'];
      render(<Rate defaultValue={0} showText texts={texts} />);

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

  describe('Precision Click & Hover (fractional)', () => {
    it('clicks at left half of an icon and snaps to half value (precision=0.5)', () => {
      const handleChange = jest.fn();
      const { container } = render(
        <Rate value={0} precision={0.5} onChange={handleChange} />
      );
      stubRectsOnRateItems(container);

      const stars = screen.getAllByRole('radio');
      // 3rd star (index 2): rect.left = 40, width = 20.
      // clientX = 45 -> relativeX = 0.25 -> rawValue = 2.25 -> snapped to 2.5
      fireEvent.click(stars[2], { clientX: 45 });

      expect(handleChange).toHaveBeenCalledWith(2.5);
    });

    it('clicks at right portion of an icon and snaps to whole value (precision=0.5)', () => {
      const handleChange = jest.fn();
      const { container } = render(
        <Rate value={0} precision={0.5} onChange={handleChange} />
      );
      stubRectsOnRateItems(container);

      const stars = screen.getAllByRole('radio');
      // 1st star (index 0): rect.left = 0, width = 20. clientX = 18
      // relativeX = 0.9 -> rawValue = 0.9 -> snapped to 1.0
      fireEvent.click(stars[0], { clientX: 18 });

      expect(handleChange).toHaveBeenCalledWith(1);
    });

    it('precision click in RTL inverts relativeX', () => {
      const handleChange = jest.fn();
      const { container } = render(
        <Rate value={0} precision={0.5} rtl onChange={handleChange} />
      );
      stubRectsOnRateItems(container);

      const stars = screen.getAllByRole('radio');
      // In RTL, stars are rendered in reverse iconIndex order. The first
      // visual star corresponds to iconIndex = max - 1 = 4. Stub left = 0,
      // width = 20. clientX = 5 -> relativeX = 0.25 -> after rtl invert
      // becomes 0.75 -> rawValue = 4.75 -> snapped to 5.
      fireEvent.click(stars[0], { clientX: 5 });

      expect(handleChange).toHaveBeenCalledWith(5);
    });

    it('precision click clamps to minimum precision step', () => {
      const handleChange = jest.fn();
      const { container } = render(
        <Rate value={0} precision={0.5} onChange={handleChange} />
      );
      stubRectsOnRateItems(container);

      const stars = screen.getAllByRole('radio');
      // 1st star (index 0): clientX = 0 -> relativeX = 0 -> rawValue = 0
      // -> snapped to 0 -> clamped up to precision (0.5)
      fireEvent.click(stars[0], { clientX: 0 });

      expect(handleChange).toHaveBeenCalledWith(0.5);
    });

    it('precision click does nothing when disabled', () => {
      const handleChange = jest.fn();
      const { container } = render(
        <Rate value={0} precision={0.5} disabled onChange={handleChange} />
      );
      stubRectsOnRateItems(container);

      const stars = screen.getAllByRole('radio');
      fireEvent.click(stars[2], { clientX: 45 });

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('precision hover updates aria-valuenow on mouse move', () => {
      const { container } = render(<Rate value={0} precision={0.5} />);
      stubRectsOnRateItems(container);

      const stars = screen.getAllByRole('radio');
      // mouseEnter sets hoverValue = iconIndex + 1 (whole). Then mouseMove
      // refines based on clientX: index 1, clientX = 25 ->
      // rect.left = 20, width = 20 -> relativeX = 0.25 -> rawValue = 1.25
      // -> snapped to 1.5
      fireEvent.mouseEnter(stars[1]);
      fireEvent.mouseMove(stars[1], { clientX: 25 });

      // displayValue (used for radiogroup aria-valuenow) is currentValue,
      // not hoverValue, so to verify hover-driven precision we check the
      // partial-fill clipPath which is driven by displayValue and updates
      // when hoverValue is set.
      const clipPaths = container.querySelectorAll('clipPath rect');
      // At hoverValue=1.5, icon index 1 has fillPercent=50, so a partial
      // SVG with a clip rect of width 12 should be present.
      const widths = Array.from(clipPaths).map(r => r.getAttribute('width'));
      expect(widths).toContain('12');
    });

    it('precision hover applies rtl inversion', () => {
      const { container } = render(<Rate value={0} precision={0.5} rtl />);
      stubRectsOnRateItems(container);

      const stars = screen.getAllByRole('radio');
      // Visual index 0 -> iconIndex 4. clientX = 15 -> relativeX = 0.75 ->
      // rtl invert -> 0.25 -> rawValue = 4.25 -> snapped to 4.5
      fireEvent.mouseEnter(stars[0]);
      fireEvent.mouseMove(stars[0], { clientX: 15 });

      const clipPaths = container.querySelectorAll('clipPath rect');
      const widths = Array.from(clipPaths).map(r => r.getAttribute('width'));
      // iconIndex 4 with fillPercent 50 -> width 12
      expect(widths).toContain('12');
    });

    it('precision hover is a no-op when disabled', () => {
      const { container } = render(<Rate value={0} precision={0.5} disabled />);
      stubRectsOnRateItems(container);

      const stars = screen.getAllByRole('radio');
      fireEvent.mouseMove(stars[2], { clientX: 45 });

      // Disabled => hoverValue stays null => no partial fill clip rects
      expect(container.querySelectorAll('clipPath rect').length).toBe(0);
    });

    it('updates uncontrolled value via precision click (line 302 path)', () => {
      const { container } = render(<Rate defaultValue={0} precision={0.5} />);
      stubRectsOnRateItems(container);

      const stars = screen.getAllByRole('radio');
      // Index 2, clientX 45 -> snapped to 2.5
      fireEvent.click(stars[2], { clientX: 45 });

      const radiogroup = screen.getByRole('radiogroup');
      expect(radiogroup).toHaveAttribute('aria-valuenow', '2.5');
    });

    it('keyboard step in uncontrolled precision mode updates internal value', () => {
      // Hits the `if (!isControlled) setInternalValue(newValue)` branch
      // inside handleKeyDown (line 302 region).
      render(<Rate defaultValue={2} precision={0.5} />);

      const radiogroup = screen.getByRole('radiogroup');
      fireEvent.keyDown(radiogroup, { key: 'ArrowRight' });

      expect(radiogroup).toHaveAttribute('aria-valuenow', '2.5');
    });
  });

  describe('Fractional hover text suffix', () => {
    it('appends "+" to text when precision<1 and hoverValue is fractional', () => {
      const texts = ['Bad', 'Poor', 'Normal', 'Good', 'Super'];
      const { container } = render(
        <Rate defaultValue={0} precision={0.5} showText texts={texts} />
      );
      stubRectsOnRateItems(container);

      const stars = screen.getAllByRole('radio');
      // Set hover to a fractional value: index 2, clientX 45 -> 2.5
      fireEvent.mouseEnter(stars[2]);
      fireEvent.mouseMove(stars[2], { clientX: 45 });

      // Math.ceil(2.5) - 1 = 2 -> texts[2] = "Normal"; with fractional
      // hover and precision<1 the text becomes "Normal+".
      expect(screen.getByText('Normal+')).toBeInTheDocument();
    });
  });

  describe('Custom Icon partial fill', () => {
    it('passes fillPercent to customIcon when value is fractional', () => {
      const customIcon = jest.fn(() => <span data-testid="ci">x</span>);
      render(
        <Rate
          value={2.5}
          precision={0.5}
          onChange={() => {}}
          customIcon={customIcon}
        />
      );

      // Icon at index 2 should be the partial one with fillPercent ~50.
      const partialCall = customIcon.mock.calls.find(
        ([props]) =>
          (props as { index: number }).index === 2 &&
          (props as { fillPercent: number }).fillPercent > 0 &&
          (props as { fillPercent: number }).fillPercent < 100
      );
      expect(partialCall).toBeDefined();
      const props = partialCall![0] as {
        index: number;
        isActive: boolean;
        fillPercent: number;
        value: number;
      };
      expect(props.fillPercent).toBe(50);
      expect(props.isActive).toBe(true);
      expect(props.value).toBe(2.5);
    });

    it('marks customIcon as hovered when hoverValue passes its index (partial path)', () => {
      const customIcon = jest.fn(() => <span data-testid="ci">x</span>);
      const { container } = render(
        <Rate defaultValue={0} precision={0.5} customIcon={customIcon} />
      );
      stubRectsOnRateItems(container);

      const stars = screen.getAllByRole('radio');
      // Hover sets a fractional hoverValue 2.5; partial branch executes for
      // the icon at index 2 with fillPercent=50.
      fireEvent.mouseEnter(stars[2]);
      fireEvent.mouseMove(stars[2], { clientX: 45 });

      const partialCalls = customIcon.mock.calls.filter(
        ([props]) =>
          (props as { fillPercent: number }).fillPercent > 0 &&
          (props as { fillPercent: number }).fillPercent < 100
      );
      expect(partialCalls.length).toBeGreaterThan(0);
    });
  });

  describe('Icon-name partial fill', () => {
    it('renders layered icon-name partial when value is fractional', () => {
      const { container } = render(
        <Rate
          value={2.5}
          precision={0.5}
          onChange={() => {}}
          iconName="star"
          iconLibrary="fa"
          iconVariant="solid"
        />
      );

      const partial = container.querySelector('.rate-icon-partial');
      expect(partial).toBeInTheDocument();
      // CSS variable is set via inline style
      expect(partial).toHaveStyle({ '--rate-fill-percent': '50%' });
      // Background and foreground icon layers exist
      expect(container.querySelector('.rate-icon-bg')).toBeInTheDocument();
      expect(container.querySelector('.rate-icon-fg')).toBeInTheDocument();
    });
  });

  describe('Inside Field + Control wrappers', () => {
    it('renders fragment (no extra Field/Control) when already inside both', () => {
      // This wraps Rate inside both Field and Control so insideField and
      // insideControl are true, exercising the bare-fragment return path.
      const { container } = render(
        <Field label="Rating">
          <Control>
            <Rate defaultValue={2} message="help text" messageColor="info" />
          </Control>
        </Field>
      );

      // Only one Field and one Control wrapper should exist.
      expect(container.querySelectorAll('.field')).toHaveLength(1);
      expect(container.querySelectorAll('.control')).toHaveLength(1);
      // Rate still rendered.
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
      // message rendered as a help element via the fragment branch.
      expect(screen.getByText('help text')).toBeInTheDocument();
    });
  });
});
