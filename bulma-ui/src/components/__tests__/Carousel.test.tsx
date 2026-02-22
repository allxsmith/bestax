import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Carousel, CarouselItem } from '../Carousel';

// Mock timers for auto-play testing
jest.useFakeTimers();

const TestCarousel = (props: React.ComponentProps<typeof Carousel>) => (
  <Carousel {...props}>
    <CarouselItem>Slide 1</CarouselItem>
    <CarouselItem>Slide 2</CarouselItem>
    <CarouselItem>Slide 3</CarouselItem>
  </Carousel>
);

describe('Carousel', () => {
  afterEach(() => {
    jest.clearAllTimers();
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
      const onChange = jest.fn();
      render(<TestCarousel onChange={onChange} />);

      fireEvent.click(screen.getByLabelText('Next slide'));

      expect(onChange).toHaveBeenCalledWith(1);
    });

    it('goes to previous slide on prev arrow click', () => {
      const onChange = jest.fn();
      render(<TestCarousel value={1} onChange={onChange} />);

      fireEvent.click(screen.getByLabelText('Previous slide'));

      expect(onChange).toHaveBeenCalledWith(0);
    });

    it('loops to last slide when on first and clicking prev', () => {
      const onChange = jest.fn();
      render(<TestCarousel value={0} onChange={onChange} />);

      fireEvent.click(screen.getByLabelText('Previous slide'));

      // With seamless wrap-around, onChange is called after transition ends
      const slidesContainer = document.querySelector('.carousel-slides');
      fireEvent.transitionEnd(slidesContainer!);

      expect(onChange).toHaveBeenCalledWith(2);
    });

    it('loops to first slide when on last and clicking next', () => {
      const onChange = jest.fn();
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
      const { container } = render(<TestCarousel />);
      const indicators = container.querySelectorAll('.indicator-item');
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
      const onChange = jest.fn();
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

  describe('Auto-play', () => {
    it('advances to next slide automatically', () => {
      const onChange = jest.fn();
      render(<TestCarousel autoplay interval={5000} onChange={onChange} />);

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(onChange).toHaveBeenCalledWith(1);
    });

    it('continues advancing slides', () => {
      const onChange = jest.fn();
      render(<TestCarousel autoplay interval={1000} onChange={onChange} />);

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(onChange).toHaveBeenCalledTimes(3);
    });

    it('does not auto-play with single slide', () => {
      const onChange = jest.fn();
      render(
        <Carousel autoplay interval={1000} onChange={onChange}>
          <CarouselItem>Only Slide</CarouselItem>
        </Carousel>
      );

      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Pause on Hover', () => {
    it('pauses auto-play on mouse enter', () => {
      const onChange = jest.fn();
      render(<TestCarousel autoplay interval={1000} onChange={onChange} />);

      fireEvent.mouseEnter(screen.getByRole('region'));

      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('resumes auto-play on mouse leave', () => {
      const onChange = jest.fn();
      render(<TestCarousel autoplay interval={1000} onChange={onChange} />);

      fireEvent.mouseEnter(screen.getByRole('region'));

      act(() => {
        jest.advanceTimersByTime(2000);
      });

      fireEvent.mouseLeave(screen.getByRole('region'));

      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(onChange).toHaveBeenCalled();
    });

    it('does not pause when pauseOnHover is false', () => {
      const onChange = jest.fn();
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
        jest.advanceTimersByTime(1000);
      });

      expect(onChange).toHaveBeenCalled();
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
      const { container } = render(<TestCarousel />);
      const arrows = container.querySelectorAll('.carousel-arrow');
      arrows.forEach(arrow => {
        expect(arrow).not.toHaveClass('is-transparent');
      });
    });

    it('renders arrows without background when arrowBackground is false', () => {
      const { container } = render(<TestCarousel arrowBackground={false} />);
      const arrows = container.querySelectorAll('.carousel-arrow');
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
      const onChange = jest.fn();
      render(<TestCarousel value={0} onChange={onChange} />);

      fireEvent.click(screen.getByLabelText('Next slide'));

      expect(onChange).toHaveBeenCalledWith(1);
    });
  });

  describe('Keyboard Navigation', () => {
    it('goes to previous slide on ArrowLeft', () => {
      const onChange = jest.fn();
      render(<TestCarousel value={1} onChange={onChange} />);

      // Focus a button inside the carousel
      const prevButton = screen.getByLabelText('Previous slide');
      prevButton.focus();

      fireEvent.keyDown(document, { key: 'ArrowLeft' });

      expect(onChange).toHaveBeenCalledWith(0);
    });

    it('goes to next slide on ArrowRight', () => {
      const onChange = jest.fn();
      render(<TestCarousel value={0} onChange={onChange} />);

      // Focus a button inside the carousel
      const nextButton = screen.getByLabelText('Next slide');
      nextButton.focus();

      fireEvent.keyDown(document, { key: 'ArrowRight' });

      expect(onChange).toHaveBeenCalledWith(1);
    });
  });

  describe('Drag Navigation', () => {
    it('navigates on drag', () => {
      const onChange = jest.fn();
      const { container } = render(<TestCarousel onChange={onChange} />);
      const carouselContainer = container.querySelector('.carousel-container')!;

      // Simulate drag left (next)
      fireEvent.mouseDown(carouselContainer, { clientX: 200 });
      fireEvent.mouseMove(carouselContainer, { clientX: 100 });
      fireEvent.mouseUp(carouselContainer);

      expect(onChange).toHaveBeenCalledWith(1);
    });

    it('navigates back on drag right', () => {
      const onChange = jest.fn();
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
      const onChange = jest.fn();
      const { container } = render(<TestCarousel onChange={onChange} />);
      const carouselContainer = container.querySelector('.carousel-container')!;

      // Small drag (below threshold)
      fireEvent.mouseDown(carouselContainer, { clientX: 200 });
      fireEvent.mouseMove(carouselContainer, { clientX: 180 });
      fireEvent.mouseUp(carouselContainer);

      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not drag when hasDrag is false', () => {
      const onChange = jest.fn();
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
      const onChange = jest.fn();
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
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to carousel element', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<TestCarousel ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Custom Icons', () => {
    it('renders Icon component when iconPrev is provided', () => {
      const { container } = render(
        <TestCarousel iconPrev="chevron-left" iconLibrary="fa" />
      );
      const prevButton = container.querySelector('.carousel-arrow.is-prev');
      expect(prevButton?.querySelector('.icon')).toBeInTheDocument();
      expect(prevButton?.querySelector('svg')).not.toBeInTheDocument();
    });

    it('renders Icon component when iconNext is provided', () => {
      const { container } = render(
        <TestCarousel iconNext="chevron-right" iconLibrary="fa" />
      );
      const nextButton = container.querySelector('.carousel-arrow.is-next');
      expect(nextButton?.querySelector('.icon')).toBeInTheDocument();
    });

    it('renders default SVG icons when no icon props provided', () => {
      const { container } = render(<TestCarousel />);
      expect(container.querySelectorAll('.carousel-arrow svg')).toHaveLength(2);
    });

    it('passes iconLibrary to Icon component', () => {
      const { container } = render(
        <TestCarousel iconPrev="arrow-left" iconLibrary="mdi" />
      );
      // MDI icons use "mdi mdi-{name}" classes
      const icon = container.querySelector('.carousel-arrow.is-prev .icon i');
      expect(icon).toHaveClass('mdi');
    });

    it('passes iconVariant to Icon component', () => {
      const { container } = render(
        <TestCarousel iconPrev="star" iconLibrary="fa" iconVariant="regular" />
      );
      const icon = container.querySelector('.carousel-arrow.is-prev .icon i');
      expect(icon).toHaveClass('far'); // Font Awesome regular
    });

    it('passes iconSize to Icon component', () => {
      const { container } = render(
        <TestCarousel iconPrev="star" iconLibrary="fa" iconSize="large" />
      );
      const icon = container.querySelector('.carousel-arrow.is-prev .icon');
      expect(icon).toHaveClass('is-large');
    });

    it('allows only iconPrev without iconNext', () => {
      const { container } = render(
        <TestCarousel iconPrev="chevron-left" iconLibrary="fa" />
      );
      const prevButton = container.querySelector('.carousel-arrow.is-prev');
      const nextButton = container.querySelector('.carousel-arrow.is-next');
      expect(prevButton?.querySelector('.icon')).toBeInTheDocument();
      expect(nextButton?.querySelector('svg')).toBeInTheDocument(); // default SVG
    });

    it('allows only iconNext without iconPrev', () => {
      const { container } = render(
        <TestCarousel iconNext="chevron-right" iconLibrary="fa" />
      );
      const prevButton = container.querySelector('.carousel-arrow.is-prev');
      const nextButton = container.querySelector('.carousel-arrow.is-next');
      expect(prevButton?.querySelector('svg')).toBeInTheDocument(); // default SVG
      expect(nextButton?.querySelector('.icon')).toBeInTheDocument();
    });

    it('navigation works with custom icons', () => {
      const onChange = jest.fn();
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
      const { container } = render(
        <TestCarousel
          value={0}
          repeat={false}
          iconPrev="chevron-left"
          iconNext="chevron-right"
          iconLibrary="fa"
        />
      );
      const prevButton = container.querySelector('.carousel-arrow.is-prev');
      expect(prevButton).toBeDisabled();
    });
  });
});
