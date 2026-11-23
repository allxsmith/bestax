import type { MockInstance } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Carousel, CarouselItem } from '../Carousel';
import { ConfigProvider } from '../../helpers/Config';
import { compileSheet } from '../../__tests__/compile-scss';

// Mock timers for auto-play testing
vi.useFakeTimers();

// forwardRef so `ref` is forwarded to Carousel on React 18 too — a plain
// function component only forwards ref via props on React 19 (ref-as-prop).
const TestCarousel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Carousel>
>((props, ref) => (
  <Carousel ref={ref} {...props}>
    <CarouselItem>Slide 1</CarouselItem>
    <CarouselItem>Slide 2</CarouselItem>
    <CarouselItem>Slide 3</CarouselItem>
  </Carousel>
));

describe('Carousel', () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Rendering', () => {
    it('renders carousel', () => {
      render(<TestCarousel />);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });

    it('renders all slides', () => {
      render(<TestCarousel />);
      // Note: With repeat enabled, cloned slides are added for seamless looping
      // so Slide 1 and Slide 3 appear twice (original + clone)
      expect(screen.getAllByText('Slide 1').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Slide 2').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Slide 3').length).toBeGreaterThanOrEqual(1);
    });

    it('renders with carousel class', () => {
      render(<TestCarousel />);
      expect(screen.getByRole('region')).toHaveClass('carousel');
    });

    it('has aria-roledescription', () => {
      render(<TestCarousel />);
      expect(screen.getByRole('region')).toHaveAttribute(
        'aria-roledescription',
        'carousel'
      );
    });

    it('defaults the region aria-label to "Image carousel"', () => {
      render(<TestCarousel />);
      expect(screen.getByRole('region')).toHaveAttribute(
        'aria-label',
        'Image carousel'
      );
    });

    it('accepts a custom ariaLabel', () => {
      render(<TestCarousel ariaLabel="Featured products" />);
      expect(screen.getByRole('region')).toHaveAttribute(
        'aria-label',
        'Featured products'
      );
    });
  });

  describe('CarouselItem', () => {
    it('renders carousel item', () => {
      render(<CarouselItem data-testid="item">Content</CarouselItem>);
      expect(screen.getByTestId('item')).toBeInTheDocument();
    });

    it('applies is-active class when active', () => {
      render(
        <CarouselItem active data-testid="item">
          Content
        </CarouselItem>
      );
      expect(screen.getByTestId('item')).toHaveClass('is-active');
    });

    it('applies custom className', () => {
      render(
        <CarouselItem className="custom" data-testid="item">
          Content
        </CarouselItem>
      );
      expect(screen.getByTestId('item')).toHaveClass('custom');
    });
  });

  describe('Navigation Arrows', () => {
    it('renders navigation arrows by default', () => {
      render(<TestCarousel />);
      expect(screen.getByLabelText('Previous slide')).toBeInTheDocument();
      expect(screen.getByLabelText('Next slide')).toBeInTheDocument();
    });

    it('renders the arrows with type="button", so they do not submit a form around it', () => {
      render(<TestCarousel />);
      expect(screen.getByLabelText('Previous slide')).toHaveAttribute(
        'type',
        'button'
      );
      expect(screen.getByLabelText('Next slide')).toHaveAttribute(
        'type',
        'button'
      );
    });

    it('does not render arrows when arrow is false', () => {
      render(<TestCarousel arrow={false} />);
      expect(screen.queryByLabelText('Previous slide')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Next slide')).not.toBeInTheDocument();
    });

    it('does not render arrows for single slide', () => {
      render(
        <Carousel>
          <CarouselItem>Only Slide</CarouselItem>
        </Carousel>
      );
      expect(screen.queryByLabelText('Previous slide')).not.toBeInTheDocument();
    });

    it('goes to next slide on next arrow click', () => {
      const onChange = vi.fn();
      render(<TestCarousel onChange={onChange} />);

      fireEvent.click(screen.getByLabelText('Next slide'));

      expect(onChange).toHaveBeenCalledWith(1);
    });

    it('goes to previous slide on prev arrow click', () => {
      const onChange = vi.fn();
      render(<TestCarousel value={1} onChange={onChange} />);

      fireEvent.click(screen.getByLabelText('Previous slide'));

      expect(onChange).toHaveBeenCalledWith(0);
    });

    it('loops to last slide when on first and clicking prev', () => {
      const onChange = vi.fn();
      render(<TestCarousel value={0} onChange={onChange} />);

      fireEvent.click(screen.getByLabelText('Previous slide'));

      // With seamless wrap-around, onChange is called after transition ends
      const slidesContainer = document.querySelector('.carousel-slides');
      fireEvent.transitionEnd(slidesContainer!);

      expect(onChange).toHaveBeenCalledWith(2);
    });

    it('loops to first slide when on last and clicking next', () => {
      const onChange = vi.fn();
      render(<TestCarousel value={2} onChange={onChange} />);

      fireEvent.click(screen.getByLabelText('Next slide'));

      // With seamless wrap-around, onChange is called after transition ends
      const slidesContainer = document.querySelector('.carousel-slides');
      fireEvent.transitionEnd(slidesContainer!);

      expect(onChange).toHaveBeenCalledWith(0);
    });

    it('disables prev button at first slide when repeat is false', () => {
      render(<TestCarousel value={0} repeat={false} />);
      expect(screen.getByLabelText('Previous slide')).toBeDisabled();
    });

    it('disables next button at last slide when repeat is false', () => {
      render(<TestCarousel value={2} repeat={false} />);
      expect(screen.getByLabelText('Next slide')).toBeDisabled();
    });
  });

  describe('Indicators', () => {
    it('renders indicators by default', () => {
      render(<TestCarousel />);
      expect(screen.getAllByRole('tab')).toHaveLength(3);
    });

    it('renders indicator buttons using Button component', () => {
      render(<TestCarousel />);
      const indicators = screen.getAllByRole('tab');
      indicators.forEach(indicator => {
        expect(indicator.tagName).toBe('BUTTON');
        expect(indicator).toHaveClass('button');
      });
    });

    it('does not render indicators when indicator is false', () => {
      render(<TestCarousel indicator={false} />);
      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    });

    it('does not render indicators for single slide', () => {
      render(
        <Carousel>
          <CarouselItem>Only Slide</CarouselItem>
        </Carousel>
      );
      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    });

    it('marks active indicator with is-active', () => {
      render(<TestCarousel value={1} />);
      const indicators = screen.getAllByRole('tab');
      expect(indicators[1]).toHaveClass('is-active');
    });

    it('goes to slide on indicator click', () => {
      const onChange = vi.fn();
      render(<TestCarousel onChange={onChange} />);

      const indicators = screen.getAllByRole('tab');
      fireEvent.click(indicators[2]);

      expect(onChange).toHaveBeenCalledWith(2);
    });

    it('has aria-selected on active indicator', () => {
      render(<TestCarousel value={1} />);
      const indicators = screen.getAllByRole('tab');
      expect(indicators[1]).toHaveAttribute('aria-selected', 'true');
    });

    it('has aria-label on indicators', () => {
      render(<TestCarousel />);
      const indicators = screen.getAllByRole('tab');
      expect(indicators[0]).toHaveAttribute('aria-label', 'Go to slide 1');
    });

    it('renders the indicators with type="button", so they do not submit a form around it', () => {
      render(<TestCarousel />);
      screen.getAllByRole('tab').forEach(indicator => {
        expect(indicator).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('Inside a form', () => {
    it('moves between slides without submitting the form', () => {
      // An image or plan picker inside a form is ordinary, and nothing on
      // Carousel's props reaches these buttons, so the caller can't type them.
      const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
      const onChange = vi.fn();
      render(
        <form onSubmit={onSubmit}>
          <TestCarousel onChange={onChange} />
        </form>
      );
      fireEvent.click(screen.getByLabelText('Next slide'));
      fireEvent.click(screen.getByLabelText('Previous slide'));
      fireEvent.click(screen.getAllByRole('tab')[2]);
      expect(onChange).toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Indicator Styles', () => {
    it('applies circles indicator style', () => {
      const { container } = render(<TestCarousel indicatorStyle="circles" />);
      expect(container.firstChild).toHaveClass('is-indicator-circles');
    });

    it('applies lines indicator style', () => {
      const { container } = render(<TestCarousel indicatorStyle="lines" />);
      expect(container.firstChild).toHaveClass('is-indicator-lines');
    });

    it('applies bars indicator style', () => {
      const { container } = render(<TestCarousel indicatorStyle="bars" />);
      expect(container.firstChild).toHaveClass('is-indicator-bars');
    });

    it('does not apply class for dots (default)', () => {
      const { container } = render(<TestCarousel indicatorStyle="dots" />);
      expect(container.firstChild).not.toHaveClass('is-indicator-dots');
    });
  });

  describe('Indicator Position', () => {
    it('applies is-inside class when indicatorInside is true', () => {
      const { container } = render(<TestCarousel indicatorInside />);
      expect(container.querySelector('.carousel-indicator')).toHaveClass(
        'is-inside'
      );
    });

    it('applies is-top class when indicatorPosition is top', () => {
      const { container } = render(
        <TestCarousel indicatorPosition="top" indicatorInside />
      );
      expect(container.querySelector('.carousel-indicator')).toHaveClass(
        'is-top'
      );
    });
  });

  describe('Overlay controls', () => {
    it('leaves the overlay look off by default', () => {
      render(<TestCarousel />);
      expect(screen.getByRole('region')).not.toHaveClass('is-overlay');
    });

    it('turns the overlay look on with indicatorInside, as before', () => {
      const { container } = render(<TestCarousel indicatorInside />);
      expect(screen.getByRole('region')).toHaveClass('is-overlay');
      expect(container.querySelector('.carousel-indicator')).toHaveClass(
        'is-inside'
      );
    });

    it('keeps the indicators inside with the plain look when overlayControls is false', () => {
      const { container } = render(
        <TestCarousel indicatorInside overlayControls={false} />
      );
      expect(screen.getByRole('region')).not.toHaveClass('is-overlay');
      expect(container.querySelector('.carousel-indicator')).toHaveClass(
        'is-inside'
      );
    });

    it('gives the overlay look with the indicators below when overlayControls is set alone', () => {
      const { container } = render(<TestCarousel overlayControls />);
      expect(screen.getByRole('region')).toHaveClass('is-overlay');
      expect(container.querySelector('.carousel-indicator')).not.toHaveClass(
        'is-inside'
      );
    });

    it('prefixes the overlay class', () => {
      render(
        <ConfigProvider classPrefix="bestax-">
          <TestCarousel overlayControls />
        </ConfigProvider>
      );
      expect(screen.getByRole('region')).toHaveClass('bestax-is-overlay');
    });
  });

  describe('Auto-play', () => {
    it('advances to next slide automatically', () => {
      const onChange = vi.fn();
      render(<TestCarousel autoplay interval={5000} onChange={onChange} />);

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(onChange).toHaveBeenCalledWith(1);
    });

    it('continues advancing slides', () => {
      const onChange = vi.fn();
      render(<TestCarousel autoplay interval={1000} onChange={onChange} />);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(onChange).toHaveBeenCalledTimes(3);
    });

    it('does not auto-play with single slide', () => {
      const onChange = vi.fn();
      render(
        <Carousel autoplay interval={1000} onChange={onChange}>
          <CarouselItem>Only Slide</CarouselItem>
        </Carousel>
      );

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Pause on Hover', () => {
    it('pauses auto-play on mouse enter', () => {
      const onChange = vi.fn();
      render(<TestCarousel autoplay interval={1000} onChange={onChange} />);

      fireEvent.mouseEnter(screen.getByRole('region'));

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('resumes auto-play on mouse leave', () => {
      const onChange = vi.fn();
      render(<TestCarousel autoplay interval={1000} onChange={onChange} />);

      fireEvent.mouseEnter(screen.getByRole('region'));

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      fireEvent.mouseLeave(screen.getByRole('region'));

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(onChange).toHaveBeenCalled();
    });

    it('follows pauseOnHover changed while the pointer is over it', () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <TestCarousel autoplay interval={1000} onChange={onChange} />
      );
      fireEvent.mouseEnter(screen.getByRole('region'));
      rerender(
        <TestCarousel
          autoplay
          interval={1000}
          pauseOnHover={false}
          onChange={onChange}
        />
      );
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(onChange).toHaveBeenCalledWith(1);

      rerender(<TestCarousel autoplay interval={1000} onChange={onChange} />);
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(onChange).toHaveBeenCalledTimes(1);

      // Leaving lets go, whatever the prop said when the pointer came in.
      fireEvent.mouseLeave(screen.getByRole('region'));
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(onChange).toHaveBeenLastCalledWith(2);
    });

    it('does not pause when pauseOnHover is false', () => {
      const onChange = vi.fn();
      render(
        <TestCarousel
          autoplay
          interval={1000}
          pauseOnHover={false}
          onChange={onChange}
        />
      );

      fireEvent.mouseEnter(screen.getByRole('region'));

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(onChange).toHaveBeenCalled();
    });
  });

  // An autoplaying carousel had no control that stopped it, only a pause
  // while the pointer or focus was on it (#1925, WCAG 2.2.2).
  describe('The rotation button', () => {
    const stop = () =>
      screen.getByRole('button', { name: 'Stop slide rotation' });
    const start = () =>
      screen.getByRole('button', { name: 'Start slide rotation' });
    const tick = (ms: number) =>
      act(() => {
        vi.advanceTimersByTime(ms);
      });

    it('comes first in the tab order, before the slides and the arrows', () => {
      render(
        <Carousel autoplay rotationControl>
          <CarouselItem>
            <a href="#one">One</a>
          </CarouselItem>
          <CarouselItem>Two</CarouselItem>
        </Carousel>
      );
      const focusable = Array.from(
        screen
          .getByRole('region')
          .querySelectorAll<HTMLElement>('button, a[href]')
      );
      expect(focusable[0]).toBe(stop());
      expect(stop()).toHaveAttribute('type', 'button');
      expect(stop()).toHaveClass('carousel-arrow', 'is-rotation');
    });

    it('stops autoplay until pressed again, whatever the pointer and focus do', () => {
      const onChange = vi.fn();
      render(
        <TestCarousel
          autoplay
          rotationControl
          interval={1000}
          onChange={onChange}
        />
      );
      const region = screen.getByRole('region');

      fireEvent.click(stop());
      // The click left the pointer over it and focus on the button. Neither
      // leaving starts it again.
      fireEvent.mouseLeave(region);
      fireEvent.blur(start());
      tick(5000);
      expect(onChange).not.toHaveBeenCalled();
      fireEvent.mouseEnter(region);
      fireEvent.mouseLeave(region);
      tick(5000);
      expect(onChange).not.toHaveBeenCalled();

      // Pressed again, it turns once the pointer and focus have left.
      fireEvent.click(start());
      tick(1000);
      expect(onChange).toHaveBeenCalledWith(1);
      expect(stop()).toBeInTheDocument();
    });

    it('lets the track announce what comes into view while stopped', () => {
      render(<TestCarousel autoplay rotationControl />);
      const track = screen
        .getByRole('region')
        .querySelector('.carousel-slides')!;
      expect(track).toHaveAttribute('aria-live', 'off');
      fireEvent.click(stop());
      fireEvent.blur(start());
      expect(track).toHaveAttribute('aria-live', 'polite');
    });

    it('draws two bars while autoplay turns and a triangle once stopped', () => {
      render(<TestCarousel autoplay rotationControl />);
      expect(stop().querySelectorAll('svg line')).toHaveLength(2);
      fireEvent.click(stop());
      expect(start().querySelector('svg polygon')).toBeInTheDocument();
    });

    it('takes its names from labels, and keeps the English for one left empty', () => {
      const { rerender } = render(
        <TestCarousel
          autoplay
          rotationControl
          labels={{
            stopRotation: 'Arrêter le défilement',
            startRotation: 'Lancer le défilement',
          }}
        />
      );
      fireEvent.click(
        screen.getByRole('button', { name: 'Arrêter le défilement' })
      );
      expect(
        screen.getByRole('button', { name: 'Lancer le défilement' })
      ).toBeInTheDocument();

      rerender(
        <TestCarousel
          autoplay
          rotationControl
          labels={{ startRotation: '', stopRotation: '' }}
        />
      );
      expect(start()).toBeInTheDocument();
    });

    it('is left out by default, without autoplay, with rotationControl off, or once all the items fit', () => {
      const { rerender } = render(<TestCarousel autoplay />);
      const rotation = () =>
        screen.queryByRole('button', { name: /slide rotation/ });
      // Off by default, so no autoplaying carousel's look changes.
      expect(rotation()).not.toBeInTheDocument();

      rerender(<TestCarousel rotationControl />);
      expect(rotation()).not.toBeInTheDocument();

      rerender(<TestCarousel autoplay rotationControl={false} />);
      expect(rotation()).not.toBeInTheDocument();

      rerender(
        <Carousel autoplay rotationControl>
          <CarouselItem>Only</CarouselItem>
        </Carousel>
      );
      expect(rotation()).not.toBeInTheDocument();
    });

    it('stays at the last position without repeat, where a stop keeps autoplay from going on once moved back', () => {
      const onChange = vi.fn();
      render(
        <TestCarousel
          autoplay
          rotationControl
          repeat={false}
          interval={1000}
          onChange={onChange}
        />
      );
      tick(1000);
      tick(1000);
      expect(onChange).toHaveBeenLastCalledWith(2);
      // Autoplay rests here, and the button still holds whether it goes on.
      fireEvent.click(stop());
      fireEvent.click(screen.getByRole('button', { name: 'Previous slide' }));
      tick(3000);
      expect(onChange).toHaveBeenLastCalledWith(1);
      fireEvent.click(start());
      tick(1000);
      expect(onChange).toHaveBeenLastCalledWith(2);
    });

    it('leaves autoplay turning while rotationControl takes the button away, and keeps the stop for its return', () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <TestCarousel
          autoplay
          rotationControl
          interval={1000}
          onChange={onChange}
        />
      );
      fireEvent.click(stop());
      tick(3000);
      expect(onChange).not.toHaveBeenCalled();
      rerender(
        <TestCarousel
          autoplay
          rotationControl={false}
          interval={1000}
          onChange={onChange}
        />
      );
      tick(1000);
      expect(onChange).toHaveBeenCalledWith(1);

      rerender(
        <TestCarousel
          autoplay
          rotationControl
          interval={1000}
          onChange={onChange}
        />
      );
      expect(start()).toBeInTheDocument();
      tick(3000);
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('keeps a stop while autoplay turns off and on, as a page that plays it only in view does', () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <TestCarousel
          autoplay
          rotationControl
          interval={1000}
          onChange={onChange}
        />
      );
      fireEvent.click(stop());
      rerender(<TestCarousel interval={1000} onChange={onChange} />);
      rerender(
        <TestCarousel
          autoplay
          rotationControl
          interval={1000}
          onChange={onChange}
        />
      );
      expect(start()).toBeInTheDocument();
      tick(3000);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('leaves the arrow keys alone while focus is on it', () => {
      const onChange = vi.fn();
      render(
        <TestCarousel
          autoplay
          rotationControl
          interval={1000}
          onChange={onChange}
        />
      );
      act(() => stop().focus());
      fireEvent.keyDown(stop(), { key: 'ArrowRight' });
      fireEvent.keyDown(stop(), { key: 'ArrowLeft' });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('lets autoplay turn while focus is on it, so a key press starts it at once', () => {
      const onChange = vi.fn();
      render(
        <TestCarousel
          autoplay
          rotationControl
          interval={1000}
          onChange={onChange}
        />
      );
      // Focus on the button itself doesn't hold autoplay, as focus on an
      // arrow does, so the track stays quiet while it turns.
      act(() => stop().focus());
      expect(
        screen.getByRole('region').querySelector('.carousel-slides')
      ).toHaveAttribute('aria-live', 'off');
      tick(1000);
      expect(onChange).toHaveBeenCalledTimes(1);
      fireEvent.click(stop());
      expect(start()).toHaveFocus();
      tick(3000);
      expect(onChange).toHaveBeenCalledTimes(1);
      fireEvent.click(start());
      tick(1000);
      expect(onChange).toHaveBeenCalledTimes(2);
      // Focus that moves on to an arrow holds it again.
      act(() => screen.getByRole('button', { name: 'Next slide' }).focus());
      tick(3000);
      expect(onChange).toHaveBeenCalledTimes(2);
    });

    it('shows with the arrows off, and with arrowBackground off takes the transparent look', () => {
      render(
        <TestCarousel
          autoplay
          rotationControl
          arrow={false}
          arrowBackground={false}
        />
      );
      expect(stop()).toHaveClass(
        'carousel-arrow',
        'is-rotation',
        'is-transparent'
      );
    });

    it('hands focus on when autoplay is turned off while it has focus', () => {
      const { rerender } = render(<TestCarousel autoplay rotationControl />);
      stop().focus();
      rerender(<TestCarousel />);
      expect(screen.getByRole('tab', { selected: true })).toHaveFocus();
    });

    it('prefixes its classes', () => {
      render(
        <ConfigProvider classPrefix="bestax-">
          <TestCarousel autoplay rotationControl />
        </ConfigProvider>
      );
      expect(stop()).toHaveClass(
        'bestax-carousel-arrow',
        'bestax-is-rotation',
        'bestax-button'
      );
    });
  });

  describe('Arrow Hover', () => {
    it('applies has-arrow-hover class', () => {
      const { container } = render(<TestCarousel arrowHover />);
      expect(container.firstChild).toHaveClass('has-arrow-hover');
    });
  });

  describe('Arrow Background', () => {
    it('renders arrows with background by default', () => {
      render(<TestCarousel />);
      const arrows = [
        screen.getByLabelText('Previous slide'),
        screen.getByLabelText('Next slide'),
      ];
      arrows.forEach(arrow => {
        expect(arrow).not.toHaveClass('is-transparent');
      });
    });

    it('renders arrows without background when arrowBackground is false', () => {
      render(<TestCarousel arrowBackground={false} />);
      const arrows = [
        screen.getByLabelText('Previous slide'),
        screen.getByLabelText('Next slide'),
      ];
      arrows.forEach(arrow => {
        expect(arrow).toHaveClass('is-transparent');
      });
    });
  });

  describe('Controlled Value', () => {
    it('uses controlled value', () => {
      render(<TestCarousel value={1} />);
      const indicators = screen.getAllByRole('tab');
      expect(indicators[1]).toHaveClass('is-active');
    });

    it('calls onChange when value changes', () => {
      const onChange = vi.fn();
      render(<TestCarousel value={0} onChange={onChange} />);

      fireEvent.click(screen.getByLabelText('Next slide'));

      expect(onChange).toHaveBeenCalledWith(1);
    });
  });

  describe('Keyboard Navigation', () => {
    it('goes to previous slide on ArrowLeft', () => {
      const onChange = vi.fn();
      render(<TestCarousel value={1} onChange={onChange} />);

      // Focus a button inside the carousel
      const prevButton = screen.getByLabelText('Previous slide');
      prevButton.focus();

      fireEvent.keyDown(document, { key: 'ArrowLeft' });

      expect(onChange).toHaveBeenCalledWith(0);
    });

    it('goes to next slide on ArrowRight', () => {
      const onChange = vi.fn();
      render(<TestCarousel value={0} onChange={onChange} />);

      // Focus a button inside the carousel
      const nextButton = screen.getByLabelText('Next slide');
      nextButton.focus();

      fireEvent.keyDown(document, { key: 'ArrowRight' });

      expect(onChange).toHaveBeenCalledWith(1);
    });

    describe('on a right-to-left page', () => {
      // jsdom maps no `dir` to `direction`, which the keys read.
      let rtl: HTMLStyleElement;
      beforeEach(() => {
        rtl = document.createElement('style');
        rtl.textContent = '[dir="rtl"] { direction: rtl; }';
        document.head.appendChild(rtl);
      });
      afterEach(() => rtl.remove());

      it('goes to the next slide, on the left, on ArrowLeft', () => {
        const onChange = vi.fn();
        render(
          <div dir="rtl">
            <TestCarousel value={0} onChange={onChange} />
          </div>
        );
        screen.getByLabelText('Next slide').focus();
        fireEvent.keyDown(document, { key: 'ArrowLeft' });
        expect(onChange).toHaveBeenCalledWith(1);
      });

      it('goes to the previous slide, on the right, on ArrowRight', () => {
        const onChange = vi.fn();
        render(
          <div dir="rtl">
            <TestCarousel value={1} onChange={onChange} />
          </div>
        );
        screen.getByLabelText('Previous slide').focus();
        fireEvent.keyDown(document, { key: 'ArrowRight' });
        expect(onChange).toHaveBeenCalledWith(0);
      });
    });
  });

  describe('Drag Navigation', () => {
    it('navigates on drag', () => {
      const onChange = vi.fn();
      const { container } = render(<TestCarousel onChange={onChange} />);
      const carouselContainer = container.querySelector('.carousel-container')!;

      // Simulate drag left (next)
      fireEvent.mouseDown(carouselContainer, { clientX: 200 });
      fireEvent.mouseMove(carouselContainer, { clientX: 100 });
      fireEvent.mouseUp(carouselContainer);

      expect(onChange).toHaveBeenCalledWith(1);
    });

    it('navigates back on drag right', () => {
      const onChange = vi.fn();
      const { container } = render(
        <TestCarousel value={1} onChange={onChange} />
      );
      const carouselContainer = container.querySelector('.carousel-container')!;

      // Simulate drag right (prev)
      fireEvent.mouseDown(carouselContainer, { clientX: 100 });
      fireEvent.mouseMove(carouselContainer, { clientX: 200 });
      fireEvent.mouseUp(carouselContainer);

      expect(onChange).toHaveBeenCalledWith(0);
    });

    it('does not navigate on small drag', () => {
      const onChange = vi.fn();
      const { container } = render(<TestCarousel onChange={onChange} />);
      const carouselContainer = container.querySelector('.carousel-container')!;

      // Small drag (below threshold)
      fireEvent.mouseDown(carouselContainer, { clientX: 200 });
      fireEvent.mouseMove(carouselContainer, { clientX: 180 });
      fireEvent.mouseUp(carouselContainer);

      expect(onChange).not.toHaveBeenCalled();
    });

    it('ignores mouseMove and mouseUp without prior mouseDown', () => {
      const onChange = vi.fn();
      const { container } = render(<TestCarousel onChange={onChange} />);
      const carouselContainer = container.querySelector('.carousel-container')!;

      // Without a prior mouseDown, isDragging is false, so handleDragMove and
      // handleDragEnd should both early-return (covers the !isDragging branches).
      fireEvent.mouseMove(carouselContainer, { clientX: 100 });
      fireEvent.mouseUp(carouselContainer);
      fireEvent.mouseLeave(carouselContainer);

      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not drag when hasDrag is false', () => {
      const onChange = vi.fn();
      const { container } = render(
        <TestCarousel hasDrag={false} onChange={onChange} />
      );
      const carouselContainer = container.querySelector('.carousel-container')!;

      fireEvent.mouseDown(carouselContainer, { clientX: 200 });
      fireEvent.mouseMove(carouselContainer, { clientX: 100 });
      fireEvent.mouseUp(carouselContainer);

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Touch Navigation', () => {
    it('navigates on touch swipe', () => {
      const onChange = vi.fn();
      const { container } = render(<TestCarousel onChange={onChange} />);
      const carouselContainer = container.querySelector('.carousel-container')!;

      fireEvent.touchStart(carouselContainer, {
        touches: [{ clientX: 200 }],
      });
      fireEvent.touchMove(carouselContainer, {
        touches: [{ clientX: 100 }],
      });
      fireEvent.touchEnd(carouselContainer);

      expect(onChange).toHaveBeenCalledWith(1);
    });

    describe('on a right-to-left page', () => {
      // jsdom maps no `dir` to `direction`, which the swipe reads.
      let rtl: HTMLStyleElement;
      beforeEach(() => {
        rtl = document.createElement('style');
        rtl.textContent = '[dir="rtl"] { direction: rtl; }';
        document.head.appendChild(rtl);
      });
      afterEach(() => rtl.remove());

      const swipe = (container: HTMLElement, from: number, to: number) => {
        const track = container.querySelector('.carousel-container')!;
        fireEvent.touchStart(track, { touches: [{ clientX: from }] });
        fireEvent.touchMove(track, { touches: [{ clientX: to }] });
        fireEvent.touchEnd(track);
      };

      it('brings the next slide in from the left on a swipe right', () => {
        const onChange = vi.fn();
        const { container } = render(
          <div dir="rtl">
            <TestCarousel value={0} onChange={onChange} />
          </div>
        );
        swipe(container, 100, 200);
        expect(onChange).toHaveBeenCalledWith(1);
      });

      it('goes back on a swipe left', () => {
        const onChange = vi.fn();
        const { container } = render(
          <div dir="rtl">
            <TestCarousel value={1} onChange={onChange} />
          </div>
        );
        swipe(container, 200, 100);
        expect(onChange).toHaveBeenCalledWith(0);
      });
    });

    it('ignores touchMove without prior touchStart', () => {
      // Unlike onMouseMove, the onTouchMove handler is always wired when
      // hasDrag=true (no isDragging guard at the JSX level), so a stray
      // touchMove exercises the `if (!isDragging) return` early-return.
      const onChange = vi.fn();
      const { container } = render(<TestCarousel onChange={onChange} />);
      const carouselContainer = container.querySelector('.carousel-container')!;

      fireEvent.touchMove(carouselContainer, { touches: [{ clientX: 100 }] });
      fireEvent.touchEnd(carouselContainer);

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to carousel element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<TestCarousel ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('supports function refs', () => {
      const refFn = vi.fn();
      render(<TestCarousel ref={refFn} />);
      expect(refFn).toHaveBeenCalled();
      // The first call should be with an HTMLDivElement node
      const node = refFn.mock.calls[0][0];
      expect(node).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Wrap-around transition cleanup', () => {
    it('clears skipTransition after wrap-around forward (next from last)', () => {
      const onChange = vi.fn();
      render(<TestCarousel value={2} onChange={onChange} />);

      // Click next while at last slide - triggers isWrapping=true and animates
      // toward clone of first slide.
      fireEvent.click(screen.getByLabelText('Next slide'));

      const slidesContainer = document.querySelector('.carousel-slides')!;
      // First transitionEnd: snap to real first slide, schedule rAFs to clear
      // skipTransition.
      fireEvent.transitionEnd(slidesContainer);
      expect(onChange).toHaveBeenCalledWith(0);

      // Flush both nested requestAnimationFrame callbacks so setSkipTransition(false)
      // executes (covers the inner rAF body).
      act(() => {
        vi.runAllTimers();
      });
    });

    it('clears skipTransition after wrap-around backward (prev from first)', () => {
      const onChange = vi.fn();
      render(<TestCarousel value={0} onChange={onChange} />);

      fireEvent.click(screen.getByLabelText('Previous slide'));

      const slidesContainer = document.querySelector('.carousel-slides')!;
      fireEvent.transitionEnd(slidesContainer);
      expect(onChange).toHaveBeenCalledWith(2);

      act(() => {
        vi.runAllTimers();
      });
    });

    it('ignores transitionEnd when not wrapping', () => {
      const onChange = vi.fn();
      const { container } = render(
        <TestCarousel value={0} onChange={onChange} />
      );
      const slidesContainer = container.querySelector('.carousel-slides')!;

      // Plain transitionEnd without prior wrap-around trigger should be a no-op.
      fireEvent.transitionEnd(slidesContainer);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not snap when navigation moves off the clone before the wrap transition ends', () => {
      const onChange = vi.fn();
      render(<TestCarousel value={2} onChange={onChange} />);

      // Start a wrap-around: animating toward the clone of the first slide.
      fireEvent.click(screen.getByLabelText('Next slide'));
      // Before the wrap transition completes, navigate backward — the display
      // index moves to a real slide while the wrapping flag is still set.
      fireEvent.click(screen.getByLabelText('Previous slide'));
      expect(onChange).toHaveBeenCalledWith(1);

      const slidesContainer = document.querySelector('.carousel-slides')!;
      fireEvent.transitionEnd(slidesContainer);

      // Neither clone snap ran: no extra onChange beyond the explicit prev.
      expect(onChange).toHaveBeenCalledTimes(1);

      act(() => {
        vi.runAllTimers();
      });
    });
  });

  describe('Single-slide repeat edge cases', () => {
    // An arrow key from inside an item belongs to the item's content (a
    // field's caret, a range input), and a single slide has nowhere to go
    // anyway, so neither key calls onChange.
    it.each(['ArrowLeft', 'ArrowRight'])(
      'leaves %s to the content of a single slide with repeat',
      key => {
        const onChange = vi.fn();
        render(
          <Carousel onChange={onChange}>
            <CarouselItem>
              <button data-testid="inner">Only</button>
            </CarouselItem>
          </Carousel>
        );

        act(() => {
          screen.getByTestId('inner').focus();
        });

        fireEvent.keyDown(document, { key });
        expect(onChange).not.toHaveBeenCalled();
      }
    );

    it('stays put on an arrow key at either end when repeat is false', () => {
      // The previous arrow is enabled at the last slide, so it can hold
      // focus there while ArrowRight asks for a step past the end.
      const onChange = vi.fn();
      const { rerender } = render(
        <TestCarousel value={2} repeat={false} onChange={onChange} />
      );
      act(() => {
        screen.getByLabelText('Previous slide').focus();
      });
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      expect(onChange).not.toHaveBeenCalled();

      rerender(<TestCarousel value={0} repeat={false} onChange={onChange} />);
      act(() => {
        screen.getByLabelText('Next slide').focus();
      });
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('clamps to range when repeat is false (indicator click path)', () => {
      const onChange = vi.fn();
      render(<TestCarousel repeat={false} onChange={onChange} />);

      // Indicator click goes through goToSlide -> setActiveIndex with an
      // in-range index, exercising the non-repeat clamp branch
      // (Math.max(0, Math.min(index, itemCount - 1))).
      const indicators = screen.getAllByRole('tab');
      fireEvent.click(indicators[2]);
      expect(onChange).toHaveBeenCalledWith(2);
    });

    it('navigates without onChange callback', () => {
      // Covers the optional-chaining false branch on `onChange?.(newIndex)`.
      // Should not throw when onChange is undefined.
      render(<TestCarousel />);
      expect(() =>
        fireEvent.click(screen.getByLabelText('Next slide'))
      ).not.toThrow();
    });

    it('does not toggle pause state when pauseOnHover is false on leave', () => {
      // Covers the `if (pauseOnHover)` false branch in handleMouseLeave.
      const onChange = vi.fn();
      render(
        <TestCarousel
          autoplay
          interval={1000}
          pauseOnHover={false}
          onChange={onChange}
        />
      );

      // Trigger mouseLeave directly without a prior mouseEnter; with
      // pauseOnHover=false the handler should be a no-op (auto-play continues).
      fireEvent.mouseLeave(screen.getByRole('region'));

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(onChange).toHaveBeenCalled();
    });

    it('ignores keyboard events when carousel is not focused', () => {
      // Covers the early-return branch in the keydown handler.
      const onChange = vi.fn();
      render(
        <>
          <button data-testid="outside">Outside</button>
          <TestCarousel value={1} onChange={onChange} />
        </>
      );

      // Focus a button OUTSIDE the carousel.
      screen.getByTestId('outside').focus();

      fireEvent.keyDown(document, { key: 'ArrowRight' });
      fireEvent.keyDown(document, { key: 'ArrowLeft' });
      fireEvent.keyDown(document, { key: 'Enter' }); // unrelated key, also no-op

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Custom Icons', () => {
    it('renders Icon component when iconPrev is provided', () => {
      render(<TestCarousel iconPrev="chevron-left" iconLibrary="fa" />);
      const prevButton = screen.getByLabelText('Previous slide');
      expect(prevButton.querySelector('.icon')).toBeInTheDocument();
      expect(prevButton.querySelector('svg')).not.toBeInTheDocument();
    });

    it('renders Icon component when iconNext is provided', () => {
      render(<TestCarousel iconNext="chevron-right" iconLibrary="fa" />);
      const nextButton = screen.getByLabelText('Next slide');
      expect(nextButton.querySelector('.icon')).toBeInTheDocument();
    });

    it('renders default SVG icons when no icon props provided', () => {
      render(<TestCarousel />);
      expect(
        screen.getByLabelText('Previous slide').querySelector('svg')
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText('Next slide').querySelector('svg')
      ).toBeInTheDocument();
    });

    it('passes iconLibrary to Icon component', () => {
      render(<TestCarousel iconPrev="arrow-left" iconLibrary="mdi" />);
      // MDI icons use "mdi mdi-{name}" classes
      const icon = screen
        .getByLabelText('Previous slide')
        .querySelector('.icon i');
      expect(icon).toHaveClass('mdi');
    });

    it('passes iconVariant to Icon component', () => {
      render(
        <TestCarousel iconPrev="star" iconLibrary="fa" iconVariant="regular" />
      );
      const icon = screen
        .getByLabelText('Previous slide')
        .querySelector('.icon i');
      expect(icon).toHaveClass('far'); // Font Awesome regular
    });

    it('passes iconSize to Icon component', () => {
      render(
        <TestCarousel iconPrev="star" iconLibrary="fa" iconSize="large" />
      );
      const icon = screen
        .getByLabelText('Previous slide')
        .querySelector('.icon');
      expect(icon).toHaveClass('is-large');
    });

    it('allows only iconPrev without iconNext', () => {
      render(<TestCarousel iconPrev="chevron-left" iconLibrary="fa" />);
      const prevButton = screen.getByLabelText('Previous slide');
      const nextButton = screen.getByLabelText('Next slide');
      expect(prevButton.querySelector('.icon')).toBeInTheDocument();
      expect(nextButton.querySelector('svg')).toBeInTheDocument(); // default SVG
    });

    it('allows only iconNext without iconPrev', () => {
      render(<TestCarousel iconNext="chevron-right" iconLibrary="fa" />);
      const prevButton = screen.getByLabelText('Previous slide');
      const nextButton = screen.getByLabelText('Next slide');
      expect(prevButton.querySelector('svg')).toBeInTheDocument(); // default SVG
      expect(nextButton.querySelector('.icon')).toBeInTheDocument();
    });

    it('navigation works with custom icons', () => {
      const onChange = vi.fn();
      render(
        <TestCarousel
          iconPrev="chevron-left"
          iconNext="chevron-right"
          iconLibrary="fa"
          onChange={onChange}
        />
      );

      fireEvent.click(screen.getByLabelText('Next slide'));
      expect(onChange).toHaveBeenCalledWith(1);
    });

    it('disabled state works with custom icons', () => {
      render(
        <TestCarousel
          value={0}
          repeat={false}
          iconPrev="chevron-left"
          iconNext="chevron-right"
          iconLibrary="fa"
        />
      );
      const prevButton = screen.getByLabelText('Previous slide');
      expect(prevButton).toBeDisabled();
    });
  });

  // The cleanup contract is honored identically on React 18 and 19 (the CI
  // matrix), and identically across every component that merges a forwarded
  // ref, so neither this nor its siblings branch on React.version.
  it('runs a forwarded callback ref cleanup on unmount instead of calling it with null', () => {
    const calls: (HTMLDivElement | null)[] = [];
    const cleanup = vi.fn();
    const callbackRef = (node: HTMLDivElement | null) => {
      calls.push(node);
      if (!node) return undefined;
      return () => {
        cleanup();
      };
    };

    const { unmount } = render(<TestCarousel ref={callbackRef} />);
    expect(calls).toHaveLength(1);
    expect(calls[0]).not.toBeNull();
    expect(cleanup).not.toHaveBeenCalled();

    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(1);
  });

  // The key listener and the autoplay timer read the latest navigation, which
  // is built on `onChange`, when a key or a tick arrives. So a parent that
  // renders with an inline `onChange` neither takes the listener off and
  // puts it back, which can lose a key React renders in the middle of, nor
  // starts the timer over, which a parent rendering more often than the
  // interval would do forever (#1186).
  describe('while onChange changes', () => {
    const Page = ({
      onChange,
      autoplay,
    }: {
      onChange: (value: number) => void;
      autoplay?: boolean;
    }) => (
      <TestCarousel
        autoplay={autoplay}
        interval={1000}
        onChange={value => onChange(value)}
      />
    );

    const keydownCalls = (spy: MockInstance) =>
      spy.mock.calls.filter(([type]) => type === 'keydown');

    it('keeps its key listener when the parent renders again', () => {
      const onChange = vi.fn();
      const { rerender } = render(<Page onChange={onChange} />);
      const addSpy = vi.spyOn(document, 'addEventListener');
      const removeSpy = vi.spyOn(document, 'removeEventListener');
      try {
        rerender(<Page onChange={onChange} />);
        expect(keydownCalls(addSpy)).toHaveLength(0);
        expect(keydownCalls(removeSpy)).toHaveLength(0);
      } finally {
        addSpy.mockRestore();
        removeSpy.mockRestore();
      }
    });

    it('moves through the onChange of the latest render on an arrow key', () => {
      const first = vi.fn();
      const latest = vi.fn();
      const { rerender } = render(<Page onChange={first} />);
      rerender(<Page onChange={latest} />);
      screen.getByLabelText('Next slide').focus();

      fireEvent.keyDown(document, { key: 'ArrowRight' });

      expect(latest).toHaveBeenCalledWith(1);
      expect(first).not.toHaveBeenCalled();
    });

    it('keeps its autoplay timer running when the parent renders again', () => {
      const first = vi.fn();
      const latest = vi.fn();
      const { rerender } = render(<Page autoplay onChange={first} />);
      act(() => {
        vi.advanceTimersByTime(600);
      });
      rerender(<Page autoplay onChange={latest} />);
      act(() => {
        vi.advanceTimersByTime(400);
      });

      expect(latest).toHaveBeenCalledTimes(1);
      expect(latest).toHaveBeenCalledWith(1);
      expect(first).not.toHaveBeenCalled();
    });

    it('still gives a slide the whole interval after the user moves to it', () => {
      const onChange = vi.fn();
      render(<Page autoplay onChange={onChange} />);
      act(() => {
        vi.advanceTimersByTime(600);
      });
      fireEvent.click(screen.getByLabelText('Next slide'));
      expect(onChange).toHaveBeenLastCalledWith(1);

      act(() => {
        vi.advanceTimersByTime(400);
      });
      expect(onChange).toHaveBeenCalledTimes(1);

      act(() => {
        vi.advanceTimersByTime(600);
      });
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenLastCalledWith(2);
    });
  });
});

/** `count` items, each with a button, named "Item 1" and on. */
const itemsOf = (count: number) =>
  Array.from({ length: count }, (_, i) => (
    <CarouselItem key={i} data-testid={`item-${i}`}>
      <button type="button">Item {i + 1}</button>
    </CarouselItem>
  ));

const track = () => document.querySelector<HTMLElement>('.carousel-slides')!;

/** Moves focus to `el`. */
const focusOn = (el: HTMLElement) =>
  act(() => {
    el.focus();
  });

/** The items themselves, in order, without the clones a loop puts at each end. */
const realItems = (count: number) => {
  const slots = Array.from(track().children) as HTMLElement[];
  const clones = (slots.length - count) / 2;
  return slots.slice(clones, clones + count);
};

/**
 * What's in view, in order on screen, as the index of the item each copy
 * shows: a clone counts as the item it copies.
 */
const inViewItems = () =>
  Array.from(track().children)
    .filter(el => !el.hasAttribute('aria-hidden'))
    .map(el => Number(el.getAttribute('data-testid')!.replace('item-', '')));

/**
 * A window `width` pixels wide, as `matchMedia` answers the queries the
 * carousel asks: each comma-separated part is a min-width or a max-width,
 * and a part with neither (`print`) never matches.
 */
const mockViewport = (initialWidth: number) => {
  let width = initialWidth;
  // Each listener is held with the query it listens to, as each of a
  // browser's lists holds its own, and called with that query's answer, as a
  // `change` event carries it.
  type Listener = (event: { matches: boolean }) => void;
  const listeners: { query: string; fn: Listener }[] = [];
  const matches = (query: string) =>
    query.split(',').some(part => {
      const min = /min-width:\s*(\d+)px/.exec(part);
      const max = /max-width:\s*(\d+)px/.exec(part);
      return (
        (!!min || !!max) &&
        (!min || width >= Number(min[1])) &&
        (!max || width <= Number(max[1]))
      );
    });
  const matchMedia = vi.fn((query: string) => ({
    media: query,
    get matches() {
      return matches(query);
    },
    addEventListener: (_type: string, fn: Listener) =>
      listeners.push({ query, fn }),
    removeEventListener: (_type: string, fn: Listener) => {
      const at = listeners.findIndex(l => l.query === query && l.fn === fn);
      if (at >= 0) listeners.splice(at, 1);
    },
  }));
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: matchMedia,
  });
  return {
    matchMedia,
    listeners,
    // Each handler once, however many lists it listens to.
    resize(next: number) {
      width = next;
      const called = new Set<Listener>();
      act(() => {
        listeners.forEach(({ query, fn }) => {
          if (called.has(fn)) return;
          called.add(fn);
          fn({ matches: matches(query) });
        });
      });
    },
  };
};

describe('Carousel with several items in view', () => {
  afterEach(() => {
    vi.clearAllTimers();
    delete (window as { matchMedia?: unknown }).matchMedia;
  });

  describe('widths from the stylesheet', () => {
    it('writes each count prop it is given as its CSS variable on the root', () => {
      render(
        <Carousel itemsToShow={3} itemsToShowMobile={1} itemsToShowFullhd={4}>
          {itemsOf(6)}
        </Carousel>
      );
      const root = screen.getByRole('region');
      expect(
        root.style.getPropertyValue('--bulma-carousel-items-to-show')
      ).toBe('3');
      expect(
        root.style.getPropertyValue('--bulma-carousel-items-to-show-mobile')
      ).toBe('1');
      expect(
        root.style.getPropertyValue('--bulma-carousel-items-to-show-fullhd')
      ).toBe('4');
      // The others are left to the stylesheet's fallbacks.
      expect(
        root.style.getPropertyValue('--bulma-carousel-items-to-show-tablet')
      ).toBe('');
    });

    it('writes no count when none is given, so one slide looks as it always has', () => {
      render(<Carousel>{itemsOf(3)}</Carousel>);
      expect(screen.getByRole('region').getAttribute('style')).toBeNull();
    });

    it('keeps a style of its own beside the counts', () => {
      render(
        <Carousel itemsToShow={2} style={{ color: 'red' }}>
          {itemsOf(3)}
        </Carousel>
      );
      const root = screen.getByRole('region');
      expect(root.style.color).toBe('red');
      expect(
        root.style.getPropertyValue('--bulma-carousel-items-to-show')
      ).toBe('2');
    });

    it.each([
      [2.7, '2'],
      [0, '1'],
      [-3, '1'],
      [Number.NaN, '1'],
    ])('writes itemsToShow=%s as the whole number %s', (count, written) => {
      render(<Carousel itemsToShow={count}>{itemsOf(3)}</Carousel>);
      expect(
        screen
          .getByRole('region')
          .style.getPropertyValue('--bulma-carousel-items-to-show')
      ).toBe(written);
    });

    it('moves the track by whole items, in units the stylesheet sizes', () => {
      render(
        <Carousel itemsToShow={3} value={1} repeat={false}>
          {itemsOf(6)}
        </Carousel>
      );
      expect(track().style.transform).toBe(
        'translateX(calc(var(--carousel-shift-sign, -1) * 1 * (100% + var(--bulma-carousel-item-gap, 0px)) / var(--bulma-carousel-items-in-view, 1)))'
      );
    });

    it('counts the clones ahead of the first item when it loops', () => {
      render(
        <Carousel itemsToShow={2} value={0}>
          {itemsOf(5)}
        </Carousel>
      );
      expect(track().style.transform).toMatch(
        /^translateX\(calc\(var\(--carousel-shift-sign, -1\) \* 2 \* /
      );
    });
  });

  describe('positions', () => {
    it('hides the items out of view, and labels each one "n of m"', () => {
      render(
        <Carousel itemsToShow={3} repeat={false}>
          {itemsOf(6)}
        </Carousel>
      );
      expect(inViewItems()).toEqual([0, 1, 2]);
      realItems(6).forEach((item, i) => {
        expect(item).toHaveAttribute('aria-label', `${i + 1} of 6`);
        expect(item).toHaveAttribute('aria-roledescription', 'slide');
        if (i < 3) {
          expect(item).toHaveClass('is-active');
          expect(item).not.toHaveAttribute('inert');
        } else {
          expect(item).not.toHaveClass('is-active');
          expect(item).toHaveAttribute('inert');
          expect(item).toHaveAttribute('aria-hidden', 'true');
        }
      });
    });

    it('renders an indicator per position a step lands on, not per item', () => {
      const { rerender } = render(
        <Carousel itemsToShow={3} repeat={false}>
          {itemsOf(6)}
        </Carousel>
      );
      // One item a step: the view can start at 0, 1, 2 and 3.
      expect(screen.getAllByRole('tab')).toHaveLength(4);

      rerender(
        <Carousel itemsToShow={3} itemsToScroll={3} repeat={false}>
          {itemsOf(7)}
        </Carousel>
      );
      // Three a step, and the last full view: 0, 3 and 4.
      expect(
        screen.getAllByRole('tab').map(tab => tab.getAttribute('aria-label'))
      ).toEqual(['Go to slide 1', 'Go to slide 4', 'Go to slide 5']);
    });

    it('steps by itemsToScroll and stops at the last full view without repeat', () => {
      const onChange = vi.fn();
      render(
        <Carousel
          itemsToShow={3}
          itemsToScroll={3}
          repeat={false}
          onChange={onChange}
        >
          {itemsOf(7)}
        </Carousel>
      );
      const next = screen.getByLabelText('Next slide');
      const prev = screen.getByLabelText('Previous slide');
      expect(prev).toBeDisabled();

      fireEvent.click(next);
      expect(onChange).toHaveBeenLastCalledWith(3);
      expect(inViewItems()).toEqual([3, 4, 5]);

      // The last step is shorter, so the end of the track shows no gap.
      fireEvent.click(next);
      expect(onChange).toHaveBeenLastCalledWith(4);
      expect(inViewItems()).toEqual([4, 5, 6]);
      expect(next).toBeDisabled();

      // Back the way it came, through the same positions.
      fireEvent.click(prev);
      expect(onChange).toHaveBeenLastCalledWith(3);
      fireEvent.click(prev);
      expect(onChange).toHaveBeenLastCalledWith(0);
    });

    it('caps itemsToScroll at the count in view, so a step skips nothing', () => {
      const onChange = vi.fn();
      render(
        <Carousel itemsToShow={2} itemsToScroll={5} onChange={onChange}>
          {itemsOf(6)}
        </Carousel>
      );
      fireEvent.click(screen.getByLabelText('Next slide'));
      expect(onChange).toHaveBeenCalledWith(2);
    });

    it('swipes one step, however far the swipe travels', () => {
      const onChange = vi.fn();
      const { container } = render(
        <Carousel itemsToShow={3} itemsToScroll={2} onChange={onChange}>
          {itemsOf(9)}
        </Carousel>
      );
      const surface = container.querySelector('.carousel-container')!;
      fireEvent.mouseDown(surface, { clientX: 900 });
      fireEvent.mouseMove(surface, { clientX: 0 });
      fireEvent.mouseUp(surface);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(2);
    });

    it('with this many children or fewer, shows them all and moves nowhere', () => {
      const onChange = vi.fn();
      render(
        <Carousel itemsToShow={3} autoplay interval={1000} onChange={onChange}>
          {itemsOf(2)}
        </Carousel>
      );
      expect(screen.queryByLabelText('Next slide')).not.toBeInTheDocument();
      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
      expect(inViewItems()).toEqual([0, 1]);
      // Nothing to loop over, so no clones either.
      expect(track().children).toHaveLength(2);
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('a controlled value', () => {
    it('shows a value between two positions as given, and steps on from it', () => {
      const onChange = vi.fn();
      render(
        <Carousel
          itemsToShow={3}
          itemsToScroll={3}
          repeat={false}
          value={2}
          onChange={onChange}
        >
          {itemsOf(7)}
        </Carousel>
      );
      expect(inViewItems()).toEqual([2, 3, 4]);
      // The indicator for the last position at or before it.
      expect(screen.getAllByRole('tab')[0]).toHaveAttribute(
        'aria-selected',
        'true'
      );

      fireEvent.click(screen.getByLabelText('Next slide'));
      expect(onChange).toHaveBeenLastCalledWith(3);
      fireEvent.click(screen.getByLabelText('Previous slide'));
      expect(onChange).toHaveBeenLastCalledWith(0);
    });

    it('shows the last full view for a value past it without repeat, calling nothing', () => {
      const onChange = vi.fn();
      render(
        <Carousel itemsToShow={3} repeat={false} value={6} onChange={onChange}>
          {itemsOf(7)}
        </Carousel>
      );
      expect(inViewItems()).toEqual([4, 5, 6]);
      expect(screen.getByLabelText('Next slide')).toBeDisabled();
      expect(onChange).not.toHaveBeenCalled();
    });

    it.each([
      [8, [1, 2, 3]],
      [-1, [6, 0, 1]],
    ])('wraps value=%s around with repeat', (value, shown) => {
      render(
        <Carousel itemsToShow={3} value={value}>
          {itemsOf(7)}
        </Carousel>
      );
      expect(inViewItems()).toEqual(shown);
    });
  });

  describe('repeat', () => {
    it('clones a full view of items onto each end, hidden and inert while off screen', () => {
      render(<Carousel itemsToShow={2}>{itemsOf(5)}</Carousel>);
      const slides = Array.from(track().children);
      expect(slides).toHaveLength(2 + 5 + 2);
      const clones = [...slides.slice(0, 2), ...slides.slice(-2)];
      expect(clones.map(el => el.getAttribute('aria-label'))).toEqual([
        '4 of 5',
        '5 of 5',
        '1 of 5',
        '2 of 5',
      ]);
      clones.forEach(clone => {
        expect(clone).toHaveAttribute('aria-hidden', 'true');
        expect(clone).toHaveAttribute('inert');
        expect(clone).not.toHaveClass('is-active');
      });
    });

    it('exposes the copy on screen where the view runs past the last item', () => {
      render(
        <Carousel itemsToShow={2} value={4}>
          {itemsOf(5)}
        </Carousel>
      );
      const slides = Array.from(track().children);
      // Item 1's clone after the last item is on screen; item 1 itself is not.
      const [firstItem, firstClone] = [slides[2], slides[7]];
      expect(firstClone).toHaveAttribute('aria-label', '1 of 5');
      expect(firstClone).not.toHaveAttribute('aria-hidden');
      expect(firstClone).not.toHaveAttribute('inert');
      expect(firstClone).toHaveClass('is-active');
      expect(firstItem).toHaveAttribute('aria-hidden', 'true');
      expect(firstItem).toHaveAttribute('inert');
    });

    it('clones enough for the widest view any viewport sets', () => {
      render(
        <Carousel itemsToShow={1} itemsToShowDesktop={3}>
          {itemsOf(5)}
        </Carousel>
      );
      expect(track().children).toHaveLength(3 + 5 + 3);
    });

    it('shows the end and the start side by side', () => {
      render(
        <Carousel itemsToShow={2} value={4}>
          {itemsOf(5)}
        </Carousel>
      );
      expect(inViewItems()).toEqual([4, 0]);
    });

    it('goes on from the last position to the first through the clones', () => {
      const onChange = vi.fn();
      render(
        <Carousel
          itemsToShow={2}
          itemsToScroll={2}
          value={4}
          onChange={onChange}
        >
          {itemsOf(5)}
        </Carousel>
      );
      // Positions 0, 2 and 4; from 4 the next is 0, one item on.
      fireEvent.click(screen.getByLabelText('Next slide'));
      expect(onChange).not.toHaveBeenCalled();
      expect(track().style.transform).toMatch(
        /^translateX\(calc\(var\(--carousel-shift-sign, -1\) \* 7 \* /
      );

      // A transition ending inside an item is not the track's own.
      fireEvent.transitionEnd(realItems(5)[0]);
      expect(onChange).not.toHaveBeenCalled();

      fireEvent.transitionEnd(track());
      expect(onChange).toHaveBeenCalledWith(0);
      act(() => {
        vi.runAllTimers();
      });
    });

    it('goes back from the first position to the last through the clones', () => {
      const onChange = vi.fn();
      render(
        <Carousel
          itemsToShow={2}
          itemsToScroll={2}
          value={0}
          onChange={onChange}
        >
          {itemsOf(5)}
        </Carousel>
      );
      fireEvent.click(screen.getByLabelText('Previous slide'));
      // Position 4, read from the clones before the first item.
      expect(track().style.transform).toMatch(
        /^translateX\(calc\(var\(--carousel-shift-sign, -1\) \* 1 \* /
      );
      fireEvent.transitionEnd(track());
      expect(onChange).toHaveBeenCalledWith(4);
      act(() => {
        vi.runAllTimers();
      });
    });
  });

  describe('the count for the window', () => {
    const responsive = {
      itemsToShow: 1,
      itemsToShowTablet: 2,
      itemsToShowDesktop: 3,
    };

    it.each([
      [500, 1],
      [800, 2],
      [1100, 3],
      [1300, 3],
      [1500, 3],
    ])('at %ipx wide has %i in view', (width, count) => {
      mockViewport(width);
      render(
        <Carousel {...responsive} repeat={false}>
          {itemsOf(6)}
        </Carousel>
      );
      expect(inViewItems()).toHaveLength(count);
      expect(screen.getAllByRole('tab')).toHaveLength(6 - count + 1);
    });

    it('falls back from a viewport to the next narrower one set, and to itemsToShow', () => {
      mockViewport(1500);
      const { unmount } = render(
        <Carousel itemsToShow={2} itemsToShowWidescreen={4} repeat={false}>
          {itemsOf(6)}
        </Carousel>
      );
      expect(inViewItems()).toHaveLength(4);
      unmount();

      mockViewport(800);
      render(
        <Carousel itemsToShow={2} itemsToShowDesktop={4} repeat={false}>
          {itemsOf(6)}
        </Carousel>
      );
      expect(inViewItems()).toHaveLength(2);
    });

    it('uses itemsToShowMobile below the tablet breakpoint only', () => {
      mockViewport(400);
      render(
        <Carousel itemsToShow={3} itemsToShowMobile={1} repeat={false}>
          {itemsOf(6)}
        </Carousel>
      );
      expect(inViewItems()).toEqual([0]);
    });

    it('counts a fractional width between the mobile and tablet queries as mobile', () => {
      // Neither Bulma's `max-width: 768px` nor its `min-width: 769px`
      // matches here; the stylesheet reads it as mobile too
      // (Carousel.styles.test.ts).
      mockViewport(768.5);
      render(
        <Carousel itemsToShow={3} itemsToShowMobile={1} repeat={false}>
          {itemsOf(6)}
        </Carousel>
      );
      expect(inViewItems()).toEqual([0]);
    });

    it('keeps the first item in view in view when the count changes', () => {
      const viewport = mockViewport(500);
      render(
        <Carousel {...responsive} repeat={false}>
          {itemsOf(6)}
        </Carousel>
      );
      const next = screen.getByLabelText('Next slide');
      for (let i = 0; i < 4; i++) fireEvent.click(next);
      expect(inViewItems()).toEqual([4]);

      // Three in view can start no later than item 3, which keeps 4 in view.
      viewport.resize(1100);
      expect(inViewItems()).toEqual([3, 4, 5]);

      viewport.resize(500);
      expect(inViewItems()).toEqual([3]);
    });

    it('stops listening when it unmounts', () => {
      const viewport = mockViewport(1100);
      const { unmount } = render(
        <Carousel {...responsive}>{itemsOf(6)}</Carousel>
      );
      // The width queries', beside the one for reduced motion
      expect(
        viewport.listeners.filter(({ query }) => /width/.test(query)).length
      ).toBeGreaterThan(0);
      unmount();
      expect(viewport.listeners).toHaveLength(0);
    });

    it('asks matchMedia about no width with one count everywhere', () => {
      const viewport = mockViewport(1100);
      render(<Carousel itemsToShow={3}>{itemsOf(6)}</Carousel>);
      expect(
        viewport.matchMedia.mock.calls.filter(([query]) => /width/.test(query))
      ).toEqual([]);
    });

    it('uses itemsToShow where matchMedia is missing', () => {
      render(
        <Carousel itemsToShow={2} itemsToShowDesktop={3} repeat={false}>
          {itemsOf(6)}
        </Carousel>
      );
      expect(inViewItems()).toEqual([0, 1]);
    });
  });

  describe('focus inside an item that leaves the view', () => {
    // An item out of view is inert, and a browser drops focus from an inert
    // element to the page, so whatever takes the focused item out of view
    // has to hand focus on to an item still in view.
    const focusButtonIn = (count: number, index: number) => {
      const button = realItems(count)[index].querySelector('button')!;
      act(() => {
        button.focus();
      });
      return button;
    };

    const expectFocusOnItem = (count: number, index: number) => {
      const item = realItems(count)[index];
      expect(document.activeElement).toBe(item);
      expect(item).not.toHaveAttribute('inert');
      expect(item).toHaveAttribute('tabindex', '-1');
    };

    it('moves to the first item in view when the count in view drops', () => {
      const viewport = mockViewport(1100);
      render(
        <Carousel itemsToShow={1} itemsToShowDesktop={3} repeat={false}>
          {itemsOf(6)}
        </Carousel>
      );
      focusButtonIn(6, 2);

      viewport.resize(800);
      expect(inViewItems()).toEqual([0]);
      expectFocusOnItem(6, 0);
    });

    it('moves to the first item in view after a swipe', () => {
      // The press that starts a drag is held from taking focus, so focus
      // inside an item stays where the keyboard or a tap put it.
      const { container } = render(
        <Carousel repeat={false}>{itemsOf(3)}</Carousel>
      );
      focusButtonIn(3, 0);
      const surface = container.querySelector('.carousel-container')!;

      fireEvent.mouseDown(surface, { clientX: 300 });
      fireEvent.mouseMove(surface, { clientX: 100 });
      fireEvent.mouseUp(surface);
      expect(inViewItems()).toEqual([1]);
      expectFocusOnItem(3, 1);
    });

    it('moves to the first item in view when a controlled value moves the view', () => {
      const { rerender } = render(
        <Carousel value={0} repeat={false}>
          {itemsOf(3)}
        </Carousel>
      );
      focusButtonIn(3, 0);

      rerender(
        <Carousel value={2} repeat={false}>
          {itemsOf(3)}
        </Carousel>
      );
      expectFocusOnItem(3, 2);
    });

    it('stays on an item that is still in view', () => {
      const { rerender } = render(
        <Carousel value={0} itemsToShow={2} repeat={false}>
          {itemsOf(4)}
        </Carousel>
      );
      const button = focusButtonIn(4, 1);

      rerender(
        <Carousel value={1} itemsToShow={2} repeat={false}>
          {itemsOf(4)}
        </Carousel>
      );
      expect(document.activeElement).toBe(button);
    });

    it('leaves focus alone once it has left the items', () => {
      const { rerender } = render(
        <>
          <Carousel value={0} repeat={false}>
            {itemsOf(3)}
          </Carousel>
          <button type="button">Outside</button>
        </>
      );
      focusButtonIn(3, 0);
      const outside = screen.getByRole('button', { name: 'Outside' });
      act(() => {
        outside.focus();
      });

      rerender(
        <>
          <Carousel value={2} repeat={false}>
            {itemsOf(3)}
          </Carousel>
          <button type="button">Outside</button>
        </>
      );
      expect(document.activeElement).toBe(outside);
    });

    it('moves to the first item in view when the focused item is removed', () => {
      const { rerender } = render(
        <Carousel itemsToShow={2} value={2} repeat={false}>
          {itemsOf(4)}
        </Carousel>
      );
      focusButtonIn(4, 3);

      rerender(
        <Carousel itemsToShow={2} value={2} repeat={false}>
          {itemsOf(3)}
        </Carousel>
      );
      // Three items, two in view: the view starts at item 2.
      expectFocusOnItem(3, 1);
    });

    it('keeps a tabindex the item has of its own', () => {
      const items = (count: number) =>
        Array.from({ length: count }, (_, i) => (
          <CarouselItem key={i} tabIndex={0}>
            <button type="button">Item {i + 1}</button>
          </CarouselItem>
        ));
      const { rerender } = render(
        <Carousel value={0} repeat={false}>
          {items(3)}
        </Carousel>
      );
      focusButtonIn(3, 0);

      rerender(
        <Carousel value={1} repeat={false}>
          {items(3)}
        </Carousel>
      );
      expect(document.activeElement).toBe(realItems(3)[1]);
      expect(realItems(3)[1]).toHaveAttribute('tabindex', '0');
    });

    it('takes focus nowhere when no item is left to take it', () => {
      const { rerender } = render(
        <Carousel repeat={false}>{itemsOf(3)}</Carousel>
      );
      focusButtonIn(3, 0);

      rerender(<Carousel repeat={false}>{[]}</Carousel>);
      expect(track().children).toHaveLength(0);
      expect(document.activeElement).toBe(document.body);
    });

    it('leaves focus where it went when it left without the items hearing', () => {
      const { rerender } = render(
        <>
          <Carousel value={0} repeat={false}>
            {itemsOf(3)}
          </Carousel>
          <button type="button">Outside</button>
        </>
      );
      focusButtonIn(3, 0);
      const outside = screen.getByRole('button', { name: 'Outside' });
      Object.defineProperty(document, 'activeElement', {
        configurable: true,
        get: () => outside,
      });
      try {
        rerender(
          <>
            <Carousel value={2} repeat={false}>
              {itemsOf(3)}
            </Carousel>
            <button type="button">Outside</button>
          </>
        );
        // Nothing was handed focus, so the item in view stays unfocusable.
        expect(realItems(3)[2]).not.toHaveAttribute('tabindex');
      } finally {
        delete (document as { activeElement?: unknown }).activeElement;
      }
    });

    it('resumes autoplay when focus left an item without a blur event', () => {
      // A browser moving focus off an element that went inert need not fire
      // blur, so autoplay reads where focus is when its timer fires rather
      // than trusting the last focus event.
      const onChange = vi.fn();
      render(
        <Carousel itemsToShow={2} autoplay interval={1000} onChange={onChange}>
          {itemsOf(4)}
        </Carousel>
      );
      focusButtonIn(4, 1);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(onChange).not.toHaveBeenCalled();
      expect(track()).toHaveAttribute('aria-live', 'polite');

      Object.defineProperty(document, 'activeElement', {
        configurable: true,
        get: () => document.body,
      });
      try {
        act(() => {
          vi.advanceTimersByTime(1000);
        });
        expect(onChange).toHaveBeenCalledWith(1);
        // And the live region goes back to quiet while autoplay turns it.
        expect(track()).toHaveAttribute('aria-live', 'off');
      } finally {
        delete (document as { activeElement?: unknown }).activeElement;
      }
    });
  });

  describe('when the system asks for reduced motion', () => {
    const original = window.matchMedia;
    beforeEach(() => {
      window.matchMedia = vi.fn((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      })) as unknown as typeof window.matchMedia;
    });
    afterEach(() => {
      window.matchMedia = original;
    });

    it('moves the track with no transition', () => {
      render(<Carousel>{itemsOf(3)}</Carousel>);
      expect(track().style.transition).toBe('none');
    });

    it('steps past either end straight to the other, with no loop to wait out', () => {
      const onChange = vi.fn();
      render(<Carousel onChange={onChange}>{itemsOf(3)}</Carousel>);
      const tabs = () => screen.getAllByRole('tab');

      fireEvent.click(screen.getByLabelText('Previous slide'));
      expect(onChange).toHaveBeenLastCalledWith(2);
      expect(tabs()[2]).toHaveAttribute('aria-selected', 'true');

      fireEvent.click(screen.getByLabelText('Next slide'));
      expect(onChange).toHaveBeenLastCalledWith(0);
      expect(tabs()[0]).toHaveAttribute('aria-selected', 'true');
      expect(track().style.transition).toBe('none');
    });

    it('finishes a step past the end that was under way when it turned on', () => {
      // Off at first, so the step runs on to the copies of the first slides
      let reduce = false;
      const listeners: ((event: { matches: boolean }) => void)[] = [];
      window.matchMedia = vi.fn((query: string) => ({
        get matches() {
          return reduce && query.includes('prefers-reduced-motion');
        },
        media: query,
        addEventListener: (
          _type: string,
          fn: (event: { matches: boolean }) => void
        ) => listeners.push(fn),
        removeEventListener: () => {},
      })) as unknown as typeof window.matchMedia;
      const onChange = vi.fn();
      render(<Carousel onChange={onChange}>{itemsOf(3)}</Carousel>);

      fireEvent.click(screen.getByLabelText('Previous slide'));
      expect(onChange).not.toHaveBeenCalled();
      expect(track().style.transition).not.toBe('none');

      // Turning it on takes the transition away, and the transitionend with
      // it, so the step finishes without one
      reduce = true;
      act(() => listeners.forEach(fn => fn({ matches: true })));
      expect(onChange).toHaveBeenLastCalledWith(2);
      expect(screen.getAllByRole('tab')[2]).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(track().style.transition).toBe('none');
    });
  });

  describe('focus on an indicator', () => {
    const tabs = () => screen.getAllByRole('tab');

    it('moves with Left and Right to the indicator beside it, and shows its slide', () => {
      const onChange = vi.fn();
      render(<Carousel onChange={onChange}>{itemsOf(3)}</Carousel>);
      focusOn(tabs()[0]);
      fireEvent.keyDown(tabs()[0], { key: 'ArrowRight' });
      expect(onChange).toHaveBeenLastCalledWith(1);
      expect(tabs()[1]).toHaveAttribute('aria-selected', 'true');
      expect(document.activeElement).toBe(tabs()[1]);

      fireEvent.keyDown(tabs()[1], { key: 'ArrowLeft' });
      expect(onChange).toHaveBeenLastCalledWith(0);
      expect(document.activeElement).toBe(tabs()[0]);
    });

    it('goes from the indicator focus is on, not the selected one', () => {
      const onChange = vi.fn();
      render(<Carousel onChange={onChange}>{itemsOf(5)}</Carousel>);
      focusOn(tabs()[3]);
      fireEvent.keyDown(tabs()[3], { key: 'ArrowRight' });
      expect(onChange).toHaveBeenLastCalledWith(4);
      expect(tabs()[4]).toHaveAttribute('aria-selected', 'true');
      expect(document.activeElement).toBe(tabs()[4]);
    });

    it('goes round past either end when the carousel loops', () => {
      render(<Carousel>{itemsOf(3)}</Carousel>);
      focusOn(tabs()[0]);
      fireEvent.keyDown(tabs()[0], { key: 'ArrowLeft' });
      expect(tabs()[2]).toHaveAttribute('aria-selected', 'true');
      expect(document.activeElement).toBe(tabs()[2]);

      fireEvent.keyDown(tabs()[2], { key: 'ArrowRight' });
      expect(tabs()[0]).toHaveAttribute('aria-selected', 'true');
      expect(document.activeElement).toBe(tabs()[0]);
    });

    it('goes to the position beside it when the view sits between two', () => {
      // Positions 0, 2 and 4; a value of 3 sits after the second one.
      const onChange = vi.fn();
      render(
        <Carousel
          value={3}
          itemsToShow={2}
          itemsToScroll={2}
          onChange={onChange}
        >
          {itemsOf(5)}
        </Carousel>
      );
      expect(tabs()[1]).toHaveAttribute('aria-selected', 'true');
      focusOn(tabs()[1]);
      fireEvent.keyDown(tabs()[1], { key: 'ArrowLeft' });
      expect(onChange).toHaveBeenLastCalledWith(0);
      expect(document.activeElement).toBe(tabs()[0]);
    });

    it('leaves a modified arrow key to the browser, on an indicator or an arrow', () => {
      const onChange = vi.fn();
      render(<Carousel onChange={onChange}>{itemsOf(3)}</Carousel>);
      for (const control of [tabs()[0], screen.getByLabelText('Next slide')]) {
        focusOn(control);
        for (const modifier of ['altKey', 'ctrlKey', 'metaKey']) {
          const event = new KeyboardEvent('keydown', {
            key: 'ArrowRight',
            bubbles: true,
            cancelable: true,
            [modifier]: true,
          });
          control.dispatchEvent(event);
          expect(event.defaultPrevented).toBe(false);
        }
        expect(document.activeElement).toBe(control);
      }
      expect(onChange).not.toHaveBeenCalled();
    });

    it('leaves a key the page has handled alone', () => {
      const onChange = vi.fn();
      render(
        <Carousel
          onChange={onChange}
          onKeyDown={e => {
            if (e.key === 'ArrowRight') e.preventDefault();
          }}
        >
          {itemsOf(3)}
        </Carousel>
      );
      focusOn(tabs()[0]);
      fireEvent.keyDown(tabs()[0], { key: 'ArrowRight' });
      expect(onChange).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(tabs()[0]);
    });

    it('stays on the first indicator without a loop', () => {
      const onChange = vi.fn();
      render(
        <Carousel repeat={false} onChange={onChange}>
          {itemsOf(3)}
        </Carousel>
      );
      focusOn(tabs()[0]);
      fireEvent.keyDown(tabs()[0], { key: 'ArrowLeft' });
      expect(onChange).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(tabs()[0]);
    });

    it('stays on the last indicator without a loop', () => {
      const onChange = vi.fn();
      render(
        <Carousel repeat={false} onChange={onChange}>
          {itemsOf(3)}
        </Carousel>
      );
      focusOn(tabs()[2]);
      fireEvent.keyDown(tabs()[2], { key: 'ArrowRight' });
      expect(onChange).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(tabs()[2]);
    });

    describe('right to left', () => {
      // jsdom maps no `dir` to `direction`, which the keys read.
      let rtl: HTMLStyleElement;
      beforeEach(() => {
        rtl = document.createElement('style');
        rtl.textContent = '[dir="rtl"] { direction: rtl; }';
        document.head.appendChild(rtl);
      });
      afterEach(() => rtl.remove());

      it('goes to the next indicator with Left and back with Right', () => {
        render(
          <div dir="rtl">
            <Carousel>{itemsOf(3)}</Carousel>
          </div>
        );
        focusOn(tabs()[0]);
        fireEvent.keyDown(tabs()[0], { key: 'ArrowLeft' });
        expect(document.activeElement).toBe(tabs()[1]);
        fireEvent.keyDown(tabs()[1], { key: 'ArrowRight' });
        expect(document.activeElement).toBe(tabs()[0]);
      });
    });

    it('leaves focus on an arrow there', () => {
      render(<Carousel>{itemsOf(3)}</Carousel>);
      const next = screen.getByLabelText('Next slide');
      focusOn(next);
      fireEvent.keyDown(next, { key: 'ArrowRight' });
      expect(tabs()[1]).toHaveAttribute('aria-selected', 'true');
      expect(document.activeElement).toBe(next);
    });
  });

  describe('focus on an arrow or an indicator that is disabled or goes away', () => {
    // A browser drops focus from a button that's disabled or removed to the
    // page. jsdom moves it off a removed one but not off a disabled one, so
    // these read where focus went.
    const prev = () => screen.getByLabelText('Previous slide');
    const next = () => screen.getByLabelText('Next slide');

    it('moves to the current indicator when Next is disabled on the last position', () => {
      // Not to Previous, where an Enter still held down would go back
      render(<Carousel repeat={false}>{itemsOf(3)}</Carousel>);
      focusOn(next());
      fireEvent.click(next());
      fireEvent.click(next());
      expect(next()).toBeDisabled();
      const tabs = screen.getAllByRole('tab');
      expect(document.activeElement).toBe(tabs[2]);
      expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    });

    it('moves to Next, with no indicators, when a new value disables a focused Previous', () => {
      const { rerender } = render(
        <Carousel value={1} repeat={false} indicator={false}>
          {itemsOf(3)}
        </Carousel>
      );
      focusOn(prev());
      rerender(
        <Carousel value={0} repeat={false} indicator={false}>
          {itemsOf(3)}
        </Carousel>
      );
      expect(prev()).toBeDisabled();
      expect(document.activeElement).toBe(next());
    });

    it('moves to the current indicator when the focused one goes away', () => {
      const { rerender } = render(
        <Carousel repeat={false}>{itemsOf(4)}</Carousel>
      );
      focusOn(screen.getAllByRole('tab')[3]);
      rerender(<Carousel repeat={false}>{itemsOf(3)}</Carousel>);
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
      expect(document.activeElement).toBe(tabs[0]);
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('moves to an arrow that works when the indicators go away', () => {
      const { rerender } = render(<Carousel>{itemsOf(3)}</Carousel>);
      focusOn(screen.getAllByRole('tab')[1]);
      rerender(<Carousel indicator={false}>{itemsOf(3)}</Carousel>);
      expect(screen.queryByRole('tab')).not.toBeInTheDocument();
      expect(document.activeElement).toBe(prev());
    });

    it('moves to the first item in view when every control goes away', () => {
      const { rerender } = render(<Carousel>{itemsOf(3)}</Carousel>);
      focusOn(next());
      rerender(<Carousel>{itemsOf(1)}</Carousel>);
      expect(screen.queryByLabelText('Next slide')).not.toBeInTheDocument();
      const item = realItems(1)[0];
      expect(document.activeElement).toBe(item);
      expect(item).toHaveAttribute('tabindex', '-1');
    });

    it('leaves focus alone once it has moved on', () => {
      const { rerender } = render(
        <>
          <Carousel value={1} repeat={false}>
            {itemsOf(3)}
          </Carousel>
          <button type="button">Outside</button>
        </>
      );
      focusOn(prev());
      const outside = screen.getByRole('button', { name: 'Outside' });
      focusOn(outside);
      rerender(
        <>
          <Carousel value={0} repeat={false}>
            {itemsOf(3)}
          </Carousel>
          <button type="button">Outside</button>
        </>
      );
      expect(document.activeElement).toBe(outside);
    });

    it('still hands focus on after another window took focus and gave it back', () => {
      // Another window taking focus blurs the arrow, which stays the page's
      // active element, and gets focus back when the page does.
      const { rerender } = render(
        <Carousel value={1} repeat={false}>
          {itemsOf(3)}
        </Carousel>
      );
      focusOn(prev());
      fireEvent.blur(prev(), { relatedTarget: null });
      expect(document.activeElement).toBe(prev());
      rerender(
        <Carousel value={0} repeat={false}>
          {itemsOf(3)}
        </Carousel>
      );
      expect(prev()).toBeDisabled();
      expect(document.activeElement).toBe(screen.getAllByRole('tab')[0]);
    });

    it('leaves focus on the page once a click on the page took it there', () => {
      // The blur goes nowhere, as it does when another window takes focus,
      // but focus is on the page itself, so the user has left the arrow.
      const { rerender } = render(
        <Carousel value={1} repeat={false}>
          {itemsOf(3)}
        </Carousel>
      );
      focusOn(prev());
      act(() => {
        prev().blur();
      });
      expect(document.activeElement).toBe(document.body);
      rerender(
        <Carousel value={0} repeat={false}>
          {itemsOf(3)}
        </Carousel>
      );
      expect(prev()).toBeDisabled();
      expect(document.activeElement).toBe(document.body);
    });

    it('leaves focus where it went when it left without the carousel hearing', () => {
      const { rerender } = render(
        <>
          <Carousel value={1} repeat={false}>
            {itemsOf(3)}
          </Carousel>
          <button type="button">Outside</button>
        </>
      );
      focusOn(prev());
      const focus = vi.spyOn(next(), 'focus');
      const outside = screen.getByRole('button', { name: 'Outside' });
      Object.defineProperty(document, 'activeElement', {
        configurable: true,
        get: () => outside,
      });
      try {
        rerender(
          <>
            <Carousel value={0} repeat={false}>
              {itemsOf(3)}
            </Carousel>
            <button type="button">Outside</button>
          </>
        );
        expect(focus).not.toHaveBeenCalled();
      } finally {
        delete (document as { activeElement?: unknown }).activeElement;
        focus.mockRestore();
      }
    });
  });

  describe('accessibility', () => {
    it("keeps an item's own name and role", () => {
      render(
        <Carousel>
          <CarouselItem aria-label="Lobby">Lobby</CarouselItem>
          <CarouselItem aria-labelledby="pool-title">
            <span id="pool-title">Pool</span>
          </CarouselItem>
          <CarouselItem role="listitem" aria-roledescription="photo">
            Spa
          </CarouselItem>
        </Carousel>
      );
      const [lobby, pool, spa] = Array.from(track().children).slice(1, 4);
      expect(lobby).toHaveAttribute('aria-label', 'Lobby');
      expect(pool).not.toHaveAttribute('aria-label');
      expect(pool).toHaveAttribute('aria-labelledby', 'pool-title');
      expect(spa).toHaveAttribute('role', 'listitem');
      expect(spa).toHaveAttribute('aria-roledescription', 'photo');
      expect(spa).toHaveAttribute('aria-label', '3 of 3');
    });

    it('takes the items out of view out of the tab order', () => {
      // jsdom implements neither `inert` nor a tab order, so this applies the
      // browser's rule: nothing inside an inert subtree takes focus.
      render(
        <Carousel itemsToShow={2} repeat={false} indicator={false}>
          {itemsOf(4)}
        </Carousel>
      );
      const tabbable = Array.from(
        screen.getByRole('region').querySelectorAll<HTMLElement>('button')
      )
        .filter(el => !el.closest('[inert]'))
        .map(el => el.textContent || el.getAttribute('aria-label'));
      expect(tabbable).toEqual([
        'Item 1',
        'Item 2',
        'Previous slide',
        'Next slide',
      ]);
    });

    it('announces what comes into view, except while autoplay turns it', () => {
      const { rerender } = render(<Carousel>{itemsOf(3)}</Carousel>);
      expect(track()).toHaveAttribute('aria-live', 'polite');

      rerender(<Carousel autoplay>{itemsOf(3)}</Carousel>);
      expect(track()).toHaveAttribute('aria-live', 'off');

      fireEvent.mouseEnter(screen.getByRole('region'));
      expect(track()).toHaveAttribute('aria-live', 'polite');
    });

    it('stops autoplay at the last position without repeat', () => {
      const onChange = vi.fn();
      render(
        <Carousel
          autoplay
          repeat={false}
          interval={1000}
          value={2}
          onChange={onChange}
        >
          {itemsOf(3)}
        </Carousel>
      );
      expect(track()).toHaveAttribute('aria-live', 'polite');
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('holds autoplay while focus is inside an item, and resumes once it leaves', () => {
      const onChange = vi.fn();
      render(
        <>
          <Carousel
            itemsToShow={2}
            autoplay
            interval={1000}
            onChange={onChange}
          >
            {itemsOf(4)}
          </Carousel>
          <button type="button">Outside</button>
        </>
      );
      act(() => {
        realItems(4)[0].querySelector('button')!.focus();
      });
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(onChange).not.toHaveBeenCalled();

      // Focus moving on to the other item in view keeps it held.
      act(() => {
        realItems(4)[1].querySelector('button')!.focus();
      });
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(onChange).not.toHaveBeenCalled();

      act(() => {
        screen.getByRole('button', { name: 'Outside' }).focus();
      });
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(onChange).toHaveBeenCalledWith(1);
    });

    it('holds autoplay while focus is on an arrow or an indicator, and resumes once it leaves', () => {
      const onChange = vi.fn();
      render(
        <>
          <Carousel autoplay interval={1000} onChange={onChange}>
            {itemsOf(3)}
          </Carousel>
          <button type="button">Outside</button>
        </>
      );
      expect(track()).toHaveAttribute('aria-live', 'off');

      const next = screen.getByLabelText('Next slide');
      focusOn(next);
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(onChange).not.toHaveBeenCalled();

      // A step taken from the arrow is announced, and autoplay keeps waiting.
      fireEvent.keyDown(next, { key: 'ArrowRight' });
      expect(onChange).toHaveBeenCalledWith(1);
      expect(track()).toHaveAttribute('aria-live', 'polite');
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(onChange).toHaveBeenCalledTimes(1);

      focusOn(screen.getAllByRole('tab')[2]);
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(onChange).toHaveBeenCalledTimes(1);

      focusOn(screen.getByRole('button', { name: 'Outside' }));
      expect(track()).toHaveAttribute('aria-live', 'off');
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(onChange).toHaveBeenLastCalledWith(2);
    });

    it('holds autoplay after a click leaves focus on an arrow, until focus moves on', () => {
      // Most browsers leave focus on the arrow a click pressed, and the
      // WAI-ARIA Authoring Practices carousel counts that focus too.
      const onChange = vi.fn();
      render(
        <>
          <Carousel autoplay interval={1000} onChange={onChange}>
            {itemsOf(3)}
          </Carousel>
          <button type="button">Outside</button>
        </>
      );
      const region = screen.getByRole('region');
      const next = screen.getByLabelText('Next slide');
      fireEvent.mouseEnter(region);
      focusOn(next);
      fireEvent.click(next);
      expect(onChange).toHaveBeenLastCalledWith(1);
      fireEvent.mouseLeave(region);
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(track()).toHaveAttribute('aria-live', 'polite');

      focusOn(screen.getByRole('button', { name: 'Outside' }));
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(onChange).toHaveBeenLastCalledWith(2);
    });

    it('keeps holding while focus on an arrow waits out a switch to another window', () => {
      // As focus in an item already did: the window losing focus blurs the
      // arrow with no related target and leaves it the active element.
      const onChange = vi.fn();
      render(
        <Carousel autoplay interval={1000} onChange={onChange}>
          {itemsOf(3)}
        </Carousel>
      );
      const next = screen.getByLabelText('Next slide');
      focusOn(next);
      fireEvent.blur(next, { relatedTarget: null });
      expect(document.activeElement).toBe(next);
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(onChange).not.toHaveBeenCalled();

      // Coming back focuses it again, so the track is polite once more.
      fireEvent.focus(next);
      expect(track()).toHaveAttribute('aria-live', 'polite');
    });

    it("runs a caller's own focus and pointer handlers along with its own", () => {
      const onChange = vi.fn();
      const handlers = {
        onFocus: vi.fn(),
        onBlur: vi.fn(),
        onMouseEnter: vi.fn(),
        onMouseLeave: vi.fn(),
      };
      render(
        <>
          <Carousel autoplay interval={1000} onChange={onChange} {...handlers}>
            {itemsOf(3)}
          </Carousel>
          <button type="button">Outside</button>
        </>
      );
      const region = screen.getByRole('region');

      fireEvent.mouseEnter(region);
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(handlers.onMouseEnter).toHaveBeenCalledTimes(1);
      expect(onChange).not.toHaveBeenCalled();
      fireEvent.mouseLeave(region);
      expect(handlers.onMouseLeave).toHaveBeenCalledTimes(1);

      focusOn(screen.getByLabelText('Next slide'));
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(handlers.onFocus).toHaveBeenCalledTimes(1);
      expect(onChange).not.toHaveBeenCalled();

      focusOn(screen.getByRole('button', { name: 'Outside' }));
      expect(handlers.onBlur).toHaveBeenCalledTimes(1);
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(onChange).toHaveBeenCalledWith(1);
    });

    it("leaves arrow keys to an item's content, but not to the carousel's controls", () => {
      const onChange = vi.fn();
      render(
        <Carousel itemsToShow={2} onChange={onChange}>
          {itemsOf(4)}
        </Carousel>
      );
      act(() => {
        realItems(4)[0].querySelector('button')!.focus();
      });
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      expect(onChange).not.toHaveBeenCalled();

      act(() => {
        screen.getByLabelText('Next slide').focus();
      });
      fireEvent.keyDown(document, { key: 'ArrowRight' });
      expect(onChange).toHaveBeenCalledWith(1);
    });
  });

  describe('server rendering', () => {
    it('renders the counts and the items in view before any script runs', () => {
      const html = renderToStaticMarkup(
        <Carousel itemsToShow={3} itemsToShowMobile={1} repeat={false}>
          {itemsOf(5)}
        </Carousel>
      );
      expect(html).toContain('--bulma-carousel-items-to-show-mobile:1');
      expect(html).toContain('--bulma-carousel-items-to-show:3');
      // itemsToShow until the page hydrates, whatever the window's width.
      expect(html.match(/aria-hidden="true"/g)).toHaveLength(2);
      expect(html.match(/role="tab"/g)).toHaveLength(3);
    });
  });

  describe('with a class prefix', () => {
    it('prefixes its classes and keeps the CSS variable names', () => {
      render(
        <ConfigProvider classPrefix="bestax-">
          <Carousel itemsToShow={2}>{itemsOf(4)}</Carousel>
        </ConfigProvider>
      );
      const root = screen.getByRole('region');
      expect(root).toHaveClass('bestax-carousel');
      expect(
        root.style.getPropertyValue('--bulma-carousel-items-to-show')
      ).toBe('2');
      const slides = root.querySelector('.bestax-carousel-slides')!;
      expect(
        slides.querySelectorAll('.bestax-carousel-item.bestax-is-active')
      ).toHaveLength(2);
      expect(root.querySelectorAll('.bestax-indicator-item')).toHaveLength(4);
    });
  });
});

// The stylesheet's right-to-left rules, read through the cascade jsdom runs
// on the compiled partial.
describe('Carousel right-to-left styles', () => {
  let sheet: HTMLStyleElement;
  // A hook keeps Vitest's 10s default rather than `testTimeout`, and
  // sass-embedded's start can take longer than that on a loaded machine.
  beforeAll(() => {
    sheet = document.createElement('style');
    sheet.textContent = compileSheet('components/_carousel.scss');
    document.head.appendChild(sheet);
  }, 30_000);
  afterAll(() => sheet.remove());

  const sign = (track: Element) =>
    getComputedStyle(track).getPropertyValue('--carousel-shift-sign');

  it('gives a left-to-right carousel inside a right-to-left one its own sign', () => {
    const { container } = render(
      <div dir="rtl">
        <Carousel>
          <CarouselItem>
            <div dir="ltr">
              <TestCarousel />
            </div>
          </CarouselItem>
          <CarouselItem>Outer 2</CarouselItem>
        </Carousel>
      </div>
    );
    const [outer, inner] = Array.from(
      container.querySelectorAll('.carousel-slides')
    );
    expect(sign(outer)).toBe('1');
    expect(sign(inner)).toBe('-1');
  });

  const flip = (el: Element) => getComputedStyle(el).transform;

  it('flips the built-in chevrons right to left, and not left to right', () => {
    const { container } = render(
      <>
        <div dir="rtl">
          <TestCarousel />
        </div>
        <div dir="ltr">
          <TestCarousel />
        </div>
      </>
    );
    const [rtlPrev, rtlNext, ltrPrev] = Array.from(
      container.querySelectorAll('.carousel-arrow > svg')
    );
    expect(flip(rtlPrev)).toBe('scaleX(-1)');
    expect(flip(rtlNext)).toBe('scaleX(-1)');
    expect(flip(ltrPrev)).not.toBe('scaleX(-1)');
  });

  it('leaves the rotation button’s icons unmirrored right to left, as media controls are', () => {
    const { container } = render(
      <div dir="rtl">
        <TestCarousel autoplay rotationControl />
      </div>
    );
    const rotation = container.querySelector('.carousel-arrow.is-rotation')!;
    expect(flip(rotation.querySelector('svg')!)).toBe('none');
    fireEvent.click(rotation);
    expect(flip(rotation.querySelector('svg')!)).toBe('none');
  });

  it("leaves a caller's icon as given right to left, svg and all", () => {
    const { container } = render(
      <div dir="rtl">
        <TestCarousel iconPrev="arrow-right" iconNext="arrow-left" />
      </div>
    );
    const icon = container.querySelector('.carousel-arrow.is-prev .icon')!;
    // Font Awesome's SVG mode swaps the `<i>` for an `<svg>` in the span.
    icon.innerHTML = '<svg viewBox="0 0 10 10"></svg>';
    expect(flip(icon)).not.toBe('scaleX(-1)');
    expect(flip(icon.querySelector('svg')!)).not.toBe('scaleX(-1)');
  });
});

describe('Carousel labels', () => {
  const french = {
    previous: 'Diapositive précédente',
    next: 'Diapositive suivante',
    indicator: (slide: number) => `Aller à la diapositive ${slide}`,
    item: (current: number, total: number) => `${current} sur ${total}`,
  };
  const namesOf = (elements: HTMLElement[]) =>
    elements.map(el => el.getAttribute('aria-label'));

  it('names the arrows, indicators and items in English by default', () => {
    render(<Carousel>{itemsOf(3)}</Carousel>);
    expect(namesOf(screen.getAllByRole('button', { name: /slide/ }))).toEqual([
      'Previous slide',
      'Next slide',
    ]);
    expect(namesOf(screen.getAllByRole('tab'))).toEqual([
      'Go to slide 1',
      'Go to slide 2',
      'Go to slide 3',
    ]);
    expect(namesOf(realItems(3))).toEqual(['1 of 3', '2 of 3', '3 of 3']);
  });

  it('names them with the words it is given', () => {
    render(<Carousel labels={french}>{itemsOf(3)}</Carousel>);
    expect(
      namesOf(screen.getAllByRole('button', { name: /diapositive/i }))
    ).toEqual(['Diapositive précédente', 'Diapositive suivante']);
    expect(namesOf(screen.getAllByRole('tab'))).toEqual([
      'Aller à la diapositive 1',
      'Aller à la diapositive 2',
      'Aller à la diapositive 3',
    ]);
    expect(namesOf(realItems(3))).toEqual(['1 sur 3', '2 sur 3', '3 sur 3']);
  });

  it('gives an indicator the place of the first item it brings into view', () => {
    render(
      <Carousel labels={french} itemsToShow={2} itemsToScroll={2}>
        {itemsOf(5)}
      </Carousel>
    );
    expect(namesOf(screen.getAllByRole('tab'))).toEqual([
      'Aller à la diapositive 1',
      'Aller à la diapositive 3',
      'Aller à la diapositive 5',
    ]);
  });

  it('leaves an item its own name', () => {
    render(
      <Carousel labels={french}>
        <CarouselItem aria-label="Piscine">Un</CarouselItem>
        <CarouselItem>Deux</CarouselItem>
      </Carousel>
    );
    expect(namesOf(realItems(2))).toEqual(['Piscine', '2 sur 2']);
  });

  it('keeps the English for a word left empty or out', () => {
    render(
      <Carousel labels={{ previous: '', indicator: french.indicator }}>
        {itemsOf(2)}
      </Carousel>
    );
    expect(screen.getByLabelText('Previous slide')).toBeInTheDocument();
    expect(screen.getByLabelText('Next slide')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Aller à la diapositive 2')
    ).toBeInTheDocument();
    expect(realItems(2)[0]).toHaveAttribute('aria-label', '1 of 2');
  });

  it('keeps the English when a function returns an empty word', () => {
    render(
      <Carousel labels={{ indicator: () => '', item: () => '' }}>
        {itemsOf(2)}
      </Carousel>
    );
    expect(namesOf(screen.getAllByRole('tab'))).toEqual([
      'Go to slide 1',
      'Go to slide 2',
    ]);
    expect(namesOf(realItems(2))).toEqual(['1 of 2', '2 of 2']);
  });

  it('takes its role descriptions from aria-roledescription', () => {
    render(
      <Carousel aria-roledescription="carrousel" labels={french}>
        <CarouselItem aria-roledescription="diapositive">Un</CarouselItem>
        <CarouselItem aria-roledescription="diapositive">Deux</CarouselItem>
      </Carousel>
    );
    expect(screen.getByRole('region')).toHaveAttribute(
      'aria-roledescription',
      'carrousel'
    );
    for (const item of realItems(2)) {
      expect(item).toHaveAttribute('aria-roledescription', 'diapositive');
    }
  });
});
