import { render, screen } from '@testing-library/react';
import { Image, ImageProps } from '../Image';
import { ConfigProvider } from '../../helpers/Config';

describe('Image Component', () => {
  const defaultProps: ImageProps = {
    src: 'https://via.placeholder.com/300',
    alt: 'Test image',
  };

  test('renders an img element with default props', () => {
    render(<Image {...defaultProps} />);
    const img = screen.getByAltText('Test image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', defaultProps.src);
    expect(img).not.toHaveClass('is-rounded', { exact: false });
    expect(img.closest('div')).toHaveClass('image');
  });

  test('applies fixed size class correctly', () => {
    render(<Image {...defaultProps} size="64x64" />);
    const container = screen.getByAltText('Test image').closest('div');
    expect(container).toHaveClass('image is-64x64');
  });

  test('applies aspect ratio class with figure element', () => {
    render(<Image {...defaultProps} size="16by9" />);
    const container = screen.getByAltText('Test image').closest('figure');
    expect(container).toHaveAttribute('class', 'image is-16by9');
  });

  test('renders a ratio container exactly as Bulma marks it up, with no has-ratio', () => {
    // Bulma reads `.has-ratio` only on a child (`.image.is-16by9 .has-ratio`).
    const ratios = [
      '1by1',
      '5by4',
      '4by3',
      '3by2',
      '5by3',
      '16by9',
      '2by1',
      '3by1',
      '4by5',
      '3by4',
      '2by3',
      '3by5',
      '9by16',
      '1by2',
      '1by3',
    ] as const;
    for (const ratio of ratios) {
      const { container, unmount } = render(
        <Image {...defaultProps} size={ratio} />
      );
      const figure = container.firstElementChild!;
      expect(figure.tagName.toLowerCase()).toBe('figure');
      expect(figure).toHaveAttribute('class', `image is-${ratio}`);
      expect(figure.querySelector('img')).not.toHaveAttribute('class');
      unmount();
    }
  });

  test('keeps the tag `as` names for a ratio', () => {
    render(<Image {...defaultProps} as="div" size="4by3" data-testid="r" />);
    const container = screen.getByTestId('r');
    expect(container.tagName.toLowerCase()).toBe('div');
    expect(container).toHaveAttribute('class', 'image is-4by3');
  });

  test('renders is-square on a <div>, as a fixed size', () => {
    render(<Image {...defaultProps} size="square" data-testid="sq" />);
    const container = screen.getByTestId('sq');
    expect(container.tagName.toLowerCase()).toBe('div');
    expect(container).toHaveAttribute('class', 'image is-square');
  });

  test('renders rounded image when isRounded is true', () => {
    render(<Image {...defaultProps} isRounded />);
    const img = screen.getByAltText('Test image');
    expect(img).toHaveClass('is-rounded');
  });

  test('does not render an empty class attribute on the img when isRounded is unset', () => {
    render(<Image {...defaultProps} />);
    const img = screen.getByAltText('Test image');
    expect(img).not.toHaveAttribute('class');
  });

  test('adds srcSet for retina images when isRetina is true', () => {
    render(<Image {...defaultProps} isRetina />);
    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('srcSet', `${defaultProps.src} 2x`);
  });

  test('renders arbitrary children (e.g., iframe) correctly', () => {
    const iframe = (
      <iframe
        className="has-ratio"
        width="640"
        height="360"
        src="https://www.youtube.com/embed/YE7VzlLtp-4"
        frameBorder="0"
        allowFullScreen
        title="Test YouTube Video"
      />
    );
    render(<Image size="16by9">{iframe}</Image>);
    const iframeElement = screen.getByTitle('Test YouTube Video');
    expect(iframeElement).toBeInTheDocument();
    expect(iframeElement).toHaveClass('has-ratio');
    expect(iframeElement.closest('figure')).toHaveAttribute(
      'class',
      'image is-16by9'
    );
  });

  test('applies Bulma helper classes (e.g., margin)', () => {
    render(<Image {...defaultProps} m="4" />);
    const container = screen.getByAltText('Test image').closest('div');
    expect(container).toHaveClass('image m-4');
  });

  test('applies text color and background color classes', () => {
    render(<Image {...defaultProps} textColor="primary" bgColor="dark" />);
    const container = screen.getByAltText('Test image').closest('div');
    expect(container).toHaveClass('image has-text-primary has-background-dark');
  });

  test('forwards additional HTML attributes', () => {
    render(<Image {...defaultProps} data-testid="custom-image" />);
    const container = screen.getByTestId('custom-image');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('image');
  });

  test('applies custom className', () => {
    render(<Image {...defaultProps} className="custom-class" />);
    const container = screen.getByAltText('Test image').closest('div');
    expect(container).toHaveClass('image custom-class');
  });

  test('renders with "as" prop as <p> and correct classes', () => {
    render(<Image {...defaultProps} as="p" size="64x64" data-testid="as-p" />);
    const container = screen.getByTestId('as-p');
    expect(container.tagName.toLowerCase()).toBe('p');
    expect(container).toHaveClass('image is-64x64');
    expect(screen.getByAltText('Test image')).toBeInTheDocument();
  });

  test('renders with "as" prop as <div> and correct classes', () => {
    render(
      <Image {...defaultProps} as="div" size="64x64" data-testid="as-div" />
    );
    const container = screen.getByTestId('as-div');
    expect(container.tagName.toLowerCase()).toBe('div');
    expect(container).toHaveClass('image is-64x64');
  });

  test('renders with "as" prop as <figure> and correct classes', () => {
    render(
      <Image
        {...defaultProps}
        as="figure"
        size="64x64"
        data-testid="as-figure"
      />
    );
    const container = screen.getByTestId('as-figure');
    expect(container.tagName.toLowerCase()).toBe('figure');
    expect(container).toHaveClass('image is-64x64');
  });

  test('applies classPrefix when provided via ConfigProvider', () => {
    render(
      <ConfigProvider classPrefix="bulma-">
        <Image {...defaultProps} />
      </ConfigProvider>
    );
    const img = screen.getByAltText('Test image');
    const container = img.closest('div');
    expect(container).toHaveClass('bulma-image');
    expect(container).not.toHaveClass('image');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Image {...defaultProps} data-testid="image" />
        </ConfigProvider>
      );
      const container = screen.getByTestId('image');
      expect(container).toHaveClass('bulma-image');
    });

    it('uses default classes when no prefix is provided', () => {
      render(<Image {...defaultProps} data-testid="image" />);
      const container = screen.getByTestId('image');
      expect(container).toHaveClass('image');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Image {...defaultProps} data-testid="image" />
        </ConfigProvider>
      );
      const container = screen.getByTestId('image');
      expect(container).toHaveClass('image');
    });

    it('applies prefix to both main class and helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Image
            {...defaultProps}
            size="64x64"
            textColor="primary"
            m="2"
            data-testid="image"
          />
        </ConfigProvider>
      );
      const container = screen.getByTestId('image');
      expect(container).toHaveClass('bulma-image');
      expect(container).toHaveClass('bulma-is-64x64');
      expect(container).toHaveClass('bulma-has-text-primary');
      expect(container).toHaveClass('bulma-m-2');
    });

    it('prefixes a ratio container class', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Image {...defaultProps} size="16by9" data-testid="image" />
        </ConfigProvider>
      );
      expect(screen.getByTestId('image')).toHaveAttribute(
        'class',
        'bulma-image bulma-is-16by9'
      );
    });

    it('works without prefix', () => {
      render(
        <Image
          {...defaultProps}
          size="128x128"
          textColor="danger"
          data-testid="image"
        />
      );
      const container = screen.getByTestId('image');
      expect(container).toHaveClass('image');
      expect(container).toHaveClass('is-128x128');
      expect(container).toHaveClass('has-text-danger');
    });
  });
});

describe('Image color text alias', () => {
  it('renders has-text-primary when only color is set', () => {
    const { container } = render(<Image color="primary" />);
    expect(container.querySelector('.image')).toHaveClass('has-text-primary');
  });

  it('gives textColor precedence when both are set', () => {
    const { container } = render(<Image textColor="danger" color="primary" />);
    const figure = container.querySelector('.image');
    expect(figure).toHaveClass('has-text-danger');
    expect(figure).not.toHaveClass('has-text-primary');
  });
});
