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
    expect(container).toHaveClass('image is-16by9 has-ratio');
  });

  test('renders rounded image when isRounded is true', () => {
    render(<Image {...defaultProps} isRounded />);
    const img = screen.getByAltText('Test image');
    expect(img).toHaveClass('is-rounded');
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
    expect(iframeElement.closest('figure')).toHaveClass(
      'image is-16by9 has-ratio'
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
});
