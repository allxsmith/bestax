import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, __test_exports__ } from '../Card';

describe('Card Component', () => {
  test('renders children content', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
    // Should be inside card-content
    expect(
      screen.getByText('Card Content').closest('.card-content')
    ).toBeInTheDocument();
  });

  test('does not render card-content if children is undefined', () => {
    const { container } = render(<Card />);
    expect(container.querySelector('.card-content')).toBeNull();
  });

  test('does not render card-content if children is empty string', () => {
    const { container } = render(<Card>{''}</Card>);
    expect(container.querySelector('.card-content')).toBeNull();
  });

  test('applies base card class', () => {
    render(<Card>Test</Card>);
    expect(screen.getByText('Test').closest('.card')).toBeInTheDocument();
  });

  test('applies custom className', () => {
    render(<Card className="custom-class">Test</Card>);
    const card = screen.getByText('Test').closest('.card');
    expect(card).toHaveClass('custom-class', { exact: false });
  });

  test('applies textColor class', () => {
    render(<Card textColor="primary">Test</Card>);
    const card = screen.getByText('Test').closest('.card');
    expect(card).toHaveClass('has-text-primary', { exact: false });
  });

  test('applies bgColor class', () => {
    render(<Card bgColor="light">Test</Card>);
    const card = screen.getByText('Test').closest('.card');
    expect(card).toHaveClass('has-background-light', { exact: false });
  });

  test('has shadow by default', () => {
    render(<Card>Test</Card>);
    const card = screen.getByText('Test').closest('.card');
    expect(card).not.toHaveClass('is-shadowless', { exact: false });
  });

  test('applies is-shadowless when hasShadow is false', () => {
    render(<Card hasShadow={false}>Test</Card>);
    const card = screen.getByText('Test').closest('.card');
    expect(card).toHaveClass('is-shadowless', { exact: false });
  });

  test('applies Bulma helper classes', () => {
    render(
      <Card m="3" p="4" textAlign="centered" textWeight="bold">
        Test
      </Card>
    );
    const card = screen.getByText('Test').closest('.card');
    expect(card).toHaveClass('m-3', { exact: false });
    expect(card).toHaveClass('p-4', { exact: false });
    expect(card).toHaveClass('has-text-centered', { exact: false });
    expect(card).toHaveClass('has-text-weight-bold', { exact: false });
  });

  test('renders card header when header prop is provided', () => {
    render(<Card header="Header Content">Test</Card>);
    expect(screen.getByText('Header Content')).toBeInTheDocument();
    // Should be inside card-header-title, which is inside card-header
    const headerTitle = screen
      .getByText('Header Content')
      .closest('.card-header-title');
    expect(headerTitle).toBeInTheDocument();
    expect(headerTitle?.closest('.card-header')).toBeInTheDocument();
  });

  test('renders card footer when footer prop is provided', () => {
    render(
      <Card footer={<span className="card-footer-item">Footer Item</span>}>
        Test
      </Card>
    );
    expect(
      screen.getByText('Footer Item').closest('.card-footer')
    ).toBeInTheDocument();
  });

  test('renders card image when image prop is provided (string)', () => {
    render(
      <Card image="https://bulma.io/images/placeholders/1280x960.png">
        Test
      </Card>
    );
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  test('renders card image when image prop is provided (node)', () => {
    render(
      <Card
        image={
          <figure className="image">
            <img src="img.png" alt="alt" />
          </figure>
        }
      >
        Test
      </Card>
    );
    expect(screen.getByAltText('alt')).toBeInTheDocument();
  });

  test('passes HTML attributes to div', () => {
    render(
      <Card id="card-id" data-testid="card" aria-label="Card">
        Test
      </Card>
    );
    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('id', 'card-id');
    expect(card).toHaveAttribute('aria-label', 'Card');
  });

  test('does not pass non-HTML props to div', () => {
    render(
      <Card
        textColor="primary"
        bgColor="light"
        m="3"
        hasShadow={false}
        data-testid="card"
      >
        Test
      </Card>
    );
    const card = screen.getByTestId('card');
    expect(card).not.toHaveAttribute('textColor');
    expect(card).not.toHaveAttribute('bgColor');
    expect(card).not.toHaveAttribute('m');
    expect(card).not.toHaveAttribute('hasShadow');
  });

  test('applies viewport-specific classes', () => {
    render(
      <Card textColor="primary" viewport="tablet">
        Test
      </Card>
    );
    const card = screen.getByText('Test').closest('.card');
    expect(card).toHaveClass('has-text-primary-tablet', { exact: false });
  });

  test('ignores invalid Bulma props', () => {
    render(
      <Card
        textColor={
          'invalid-color' as unknown as React.ComponentProps<
            typeof Card
          >['textColor']
        }
        m={'invalid-size' as unknown as React.ComponentProps<typeof Card>['m']}
      >
        Test
      </Card>
    );
    const card = screen.getByText('Test').closest('.card');
    expect(card).toHaveClass('card', { exact: false });
    expect(card).not.toHaveClass('has-text-invalid-color');
    expect(card).not.toHaveClass('m-invalid-size');
  });

  test('renders headerIcon if provided', () => {
    render(
      <Card
        header="Header"
        headerIcon={
          <button className="card-header-icon" aria-label="icon-btn">
            <span>icon</span>
          </button>
        }
      >
        Test
      </Card>
    );
    expect(screen.getByLabelText('icon-btn')).toBeInTheDocument();
  });

  test('renders header title with is-centered if headerCentered is true', () => {
    render(
      <Card header="Centered" headerCentered>
        Test
      </Card>
    );
    const headerTitle = screen
      .getByText('Centered')
      .closest('.card-header-title');
    expect(headerTitle).toHaveClass('is-centered');
  });

  // Coverage for: if (!header && !headerIcon) return null;
  test('does not render header if both header and headerIcon are missing', () => {
    render(<Card>Just content</Card>);
    expect(document.querySelector('.card-header')).toBeNull();
  });

  // Coverage for: only headerIcon present, header falsy
  test('renders header with only headerIcon (no header)', () => {
    render(<Card headerIcon={<span data-testid="icon" />} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(document.querySelector('.card-header-title')).toBeNull();
    expect(document.querySelector('.card-header')).not.toBeNull();
  });

  // Coverage for: footer not rendered if falsy
  test('does not render footer if footer is not provided', () => {
    render(<Card>Just content</Card>);
    expect(document.querySelector('.card-footer')).toBeNull();
  });

  test('renders footer when footer is a string', () => {
    render(<Card footer="Footer String">Test</Card>);
    expect(screen.getByText('Footer String')).toBeInTheDocument();
  });

  test('renders footer when footer is an array', () => {
    render(<Card footer={['Footer1', 'Footer2']}>Test</Card>);
    expect(screen.getByText('Footer1')).toBeInTheDocument();
    expect(screen.getByText('Footer2')).toBeInTheDocument();
  });

  test('renders <img> with default alt if imageAlt is not provided', () => {
    render(<Card image="img.png">Test</Card>);
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'img.png');
    expect(img).toHaveAttribute('alt', 'Card image');
  });

  test('renders <img> with provided alt if imageAlt is given', () => {
    render(
      <Card image="img.png" imageAlt="Custom Alt">
        Test
      </Card>
    );
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'img.png');
    expect(img).toHaveAttribute('alt', 'Custom Alt');
  });

  test('renderFooter returns null if footer is falsy', () => {
    expect(__test_exports__.renderFooter(undefined)).toBeNull();
    expect(__test_exports__.renderFooter(null)).toBeNull();
    expect(__test_exports__.renderFooter(false)).toBeNull();
    expect(__test_exports__.renderFooter('')).toBeNull();
    expect(__test_exports__.renderFooter(0)).toBeNull();
  });
});
