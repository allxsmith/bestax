import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card, __test_exports__ } from '../Card';
import { ConfigProvider } from '../../helpers/Config';

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

  test('color classes do not support viewport-specific classes', () => {
    render(
      <Card color="primary" viewport="tablet">
        <Card.Content>Test</Card.Content>
      </Card>
    );
    const card = screen.getByText('Test').closest('.card');
    expect(card).toHaveClass('has-text-primary', { exact: false });
    expect(card).not.toHaveClass('has-text-primary-tablet', { exact: false });
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

  test('applies classPrefix when provided via ConfigProvider', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bulma-">
        <Card>Test content</Card>
      </ConfigProvider>
    );
    // Find the card element by its class
    const card = container.querySelector('.bulma-card');
    expect(card).toBeInTheDocument();
    expect(card).not.toHaveClass('card');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Card data-testid="card">Test content</Card>
        </ConfigProvider>
      );
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bulma-card');
    });

    it('uses default classes when no prefix is provided', () => {
      render(<Card data-testid="card">Test content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('card');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Card data-testid="card">Test content</Card>
        </ConfigProvider>
      );
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('card');
    });

    it('applies prefix to both main class and helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Card hasShadow={false} textColor="primary" m="2" data-testid="card">
            Test content
          </Card>
        </ConfigProvider>
      );
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('bulma-card');
      expect(card).toHaveClass('bulma-is-shadowless');
      expect(card).toHaveClass('bulma-has-text-primary');
      expect(card).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      render(
        <Card hasShadow={false} textColor="danger" data-testid="card">
          Test content
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('card');
      expect(card).toHaveClass('is-shadowless');
      expect(card).toHaveClass('has-text-danger');
    });
  });

  describe('Compound Components', () => {
    test('Card.Header renders with correct classes', () => {
      render(
        <Card.Header data-testid="header">
          <p>Header content</p>
        </Card.Header>
      );
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('card-header');
      expect(header.querySelector('.card-header-title')).toBeInTheDocument();
      expect(screen.getByText('Header content')).toBeInTheDocument();
    });

    test('Card.Header with Card.Header.Title does not double-wrap', () => {
      render(
        <Card.Header data-testid="header">
          <Card.Header.Title>Title content</Card.Header.Title>
        </Card.Header>
      );
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('card-header');

      // Should only have one .card-header-title element (not nested)
      const headerTitles = header.querySelectorAll('.card-header-title');
      expect(headerTitles).toHaveLength(1);
      expect(screen.getByText('Title content')).toBeInTheDocument();
    });

    test('Card.Header centered prop is ignored when Card.Header.Title is used', () => {
      render(
        <Card.Header centered data-testid="header">
          <Card.Header.Title centered>Centered Title</Card.Header.Title>
        </Card.Header>
      );
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('card-header');

      // Should only have one .card-header-title element with centering
      const headerTitles = header.querySelectorAll('.card-header-title');
      expect(headerTitles).toHaveLength(1);
      expect(headerTitles[0]).toHaveClass('is-centered');
      expect(screen.getByText('Centered Title')).toBeInTheDocument();
    });

    test('Card.Header applies centered class when centered prop is true', () => {
      render(
        <Card.Header centered data-testid="header">
          Centered header
        </Card.Header>
      );
      const headerTitle = screen
        .getByTestId('header')
        .querySelector('.card-header-title');
      expect(headerTitle).toHaveClass('is-centered');
    });

    test('Card.Header accepts custom className', () => {
      render(
        <Card.Header className="custom-header" data-testid="header">
          Header
        </Card.Header>
      );
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('card-header', 'custom-header');
    });

    test('Card.Image renders with correct classes', () => {
      render(
        <Card.Image data-testid="image">
          <figure className="image">
            <img src="test.jpg" alt="Test" />
          </figure>
        </Card.Image>
      );
      const image = screen.getByTestId('image');
      expect(image).toHaveClass('card-image');
      expect(screen.getByAltText('Test')).toBeInTheDocument();
    });

    test('Card.Content renders with correct classes', () => {
      render(
        <Card.Content data-testid="content">
          <p>Card content</p>
        </Card.Content>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('card-content');
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    test('Card.Footer renders with correct classes', () => {
      render(
        <Card.Footer data-testid="footer">
          <Card.FooterItem>Item 1</Card.FooterItem>
          <Card.FooterItem>Item 2</Card.FooterItem>
        </Card.Footer>
      );
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('card-footer');
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    test('Card.FooterItem renders with correct classes', () => {
      render(
        <Card.FooterItem data-testid="footer-item">Footer item</Card.FooterItem>
      );
      const footerItem = screen.getByTestId('footer-item');
      expect(footerItem).toHaveClass('card-footer-item');
      expect(screen.getByText('Footer item')).toBeInTheDocument();
    });

    test('Card.Header.Title renders with correct classes', () => {
      render(
        <Card.Header.Title
          data-testid="header-title"
          className="custom-header-title"
        >
          Header title content
        </Card.Header.Title>
      );
      const headerTitle = screen.getByTestId('header-title');
      expect(headerTitle).toHaveClass(
        'card-header-title',
        'custom-header-title'
      );
      expect(screen.getByText('Header title content')).toBeInTheDocument();
    });

    test('Card.Header.Title applies centered class when centered prop is true', () => {
      render(
        <Card.Header.Title data-testid="header-title" centered>
          Centered title
        </Card.Header.Title>
      );
      const headerTitle = screen.getByTestId('header-title');
      expect(headerTitle).toHaveClass('card-header-title', 'is-centered');
    });

    test('Card.Header.Icon renders with correct classes', () => {
      render(
        <Card.Header.Icon data-testid="header-icon" aria-label="menu">
          <span className="icon">
            <i className="fas fa-angle-down" aria-hidden="true"></i>
          </span>
        </Card.Header.Icon>
      );
      const headerIcon = screen.getByTestId('header-icon');
      expect(headerIcon).toHaveClass('card-header-icon');
      expect(headerIcon).toHaveAttribute('aria-label', 'menu');
      expect(headerIcon.tagName).toBe('BUTTON');
    });

    test('Card.Header.Icon uses default aria-label if not provided', () => {
      render(
        <Card.Header.Icon data-testid="header-icon">
          <span>Icon</span>
        </Card.Header.Icon>
      );
      const headerIcon = screen.getByTestId('header-icon');
      expect(headerIcon).toHaveAttribute('aria-label', 'more options');
    });

    test('Card.Header with both Title and Icon renders correctly', () => {
      render(
        <Card.Header data-testid="header">
          <Card.Header.Title>Card Title</Card.Header.Title>
          <Card.Header.Icon>
            <span className="icon">⋮</span>
          </Card.Header.Icon>
        </Card.Header>
      );
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('card-header');
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByText('⋮')).toBeInTheDocument();

      // Should not have nested card-header-title when using compound components
      const headerTitles = header.querySelectorAll('.card-header-title');
      expect(headerTitles).toHaveLength(1);
    });

    test('compound components can be composed together', () => {
      render(
        <Card data-testid="card">
          <Card.Header centered>Card Title</Card.Header>
          <Card.Image>
            <figure className="image">
              <img src="test.jpg" alt="Test image" />
            </figure>
          </Card.Image>
          <Card.Content>
            This is the card content using compound components.
          </Card.Content>
          <Card.Footer>
            <Card.FooterItem>
              <button>Save</button>
            </Card.FooterItem>
            <Card.FooterItem>
              <button>Cancel</button>
            </Card.FooterItem>
          </Card.Footer>
        </Card>
      );

      const card = screen.getByTestId('card');
      expect(card).toHaveClass('card');
      expect(screen.getByText('Card Title')).toBeInTheDocument();
      expect(screen.getByAltText('Test image')).toBeInTheDocument();
      expect(
        screen.getByText('This is the card content using compound components.')
      ).toBeInTheDocument();
      expect(screen.getByText('Save')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    test('compound components accept additional HTML attributes', () => {
      render(
        <Card.Header id="header-id" aria-label="Header">
          Header
        </Card.Header>
      );
      const header = screen.getByLabelText('Header');
      expect(header).toHaveAttribute('id', 'header-id');
    });

    test('does not wrap compound components in card-content', () => {
      const { container } = render(
        <Card>
          <Card.Header>
            <Card.Header.Title>Header Title</Card.Header.Title>
          </Card.Header>
          <Card.Content>Content text</Card.Content>
        </Card>
      );

      // Check that Card.Header is directly under .card, not inside .card-content
      const cardElement = container.querySelector('.card');
      const headerElement = container.querySelector('.card-header');
      const contentElement = container.querySelector('.card-content');

      expect(cardElement).toBeInTheDocument();
      expect(headerElement).toBeInTheDocument();
      expect(contentElement).toBeInTheDocument();

      // Header should be direct child of card
      expect(cardElement?.children[0]).toBe(headerElement);
      // Content should be direct child of card (not wrapped)
      expect(cardElement?.children[1]).toBe(contentElement);

      // Should not have nested card-content divs
      expect(container.querySelectorAll('.card-content')).toHaveLength(1);
    });
  });
});

// Additional test coverage improvements
describe('Card - Advanced Integration Tests', () => {
  // Test 52: Complex nested compound components structure
  test('handles deeply nested compound component structures', () => {
    render(
      <Card data-testid="card">
        <Card.Header>
          <Card.Header.Title>Complex Card</Card.Header.Title>
          <Card.Header.Icon aria-label="toggle">
            <i className="fas fa-chevron-down"></i>
          </Card.Header.Icon>
        </Card.Header>
        <Card.Image>
          <figure className="image">
            <img src="/test.jpg" alt="Test image" />
          </figure>
        </Card.Image>
        <Card.Content>
          <div>
            <h4>Nested content</h4>
            <p>Some description text</p>
            <div>
              <span>Additional nested elements</span>
            </div>
          </div>
        </Card.Content>
        <Card.Footer>
          <Card.FooterItem>
            <button>Action 1</button>
          </Card.FooterItem>
          <Card.FooterItem>
            <button>Action 2</button>
          </Card.FooterItem>
        </Card.Footer>
      </Card>
    );

    const card = screen.getByTestId('card');
    expect(card).toBeInTheDocument();

    // Verify all sections are rendered
    expect(card.querySelector('.card-header')).toBeInTheDocument();
    expect(card.querySelector('.card-image')).toBeInTheDocument();
    expect(card.querySelector('.card-content')).toBeInTheDocument();
    expect(card.querySelector('.card-footer')).toBeInTheDocument();

    // Verify no double wrapping
    expect(card.querySelectorAll('.card-content')).toHaveLength(1);
    expect(card.querySelectorAll('.card-header-title')).toHaveLength(1);
    expect(card.querySelectorAll('.card-footer')).toHaveLength(1);
  });

  // Test 53: Mixed compound and prop-based approaches
  test('handles mix of compound components and props', () => {
    render(
      <Card
        data-testid="card"
        header="Prop Header"
        headerIcon={<i className="fas fa-gear"></i>}
        footer={['Footer Item 1', 'Footer Item 2']}
      >
        <Card.Content>
          <p>Compound content</p>
        </Card.Content>
      </Card>
    );

    const card = screen.getByTestId('card');

    // Should have both prop-based header and compound content
    expect(card.querySelector('.card-header')).toBeInTheDocument();
    expect(card.querySelector('.card-content')).toBeInTheDocument();
    expect(card.querySelector('.card-footer')).toBeInTheDocument();

    // Header should come from props
    expect(screen.getByText('Prop Header')).toBeInTheDocument();

    // Content should come from compound component
    expect(screen.getByText('Compound content')).toBeInTheDocument();

    // Footer should come from props
    expect(screen.getByText('Footer Item 1')).toBeInTheDocument();
    expect(screen.getByText('Footer Item 2')).toBeInTheDocument();
  });

  // Test 54: Performance with many compound components
  test('renders efficiently with multiple compound components', () => {
    const startTime = performance.now();

    render(
      <Card data-testid="card">
        {Array.from({ length: 10 }, (_, i) => (
          <Card.Content key={i}>Content {i + 1}</Card.Content>
        ))}
      </Card>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Should render in reasonable time (under 100ms for this simple case)
    expect(renderTime).toBeLessThan(100);

    const card = screen.getByTestId('card');
    expect(card.querySelectorAll('.card-content')).toHaveLength(10);
  });

  // Test 55: Edge case - compound components detection with fragments
  test('compound components in React fragments still get wrapped', () => {
    render(
      <Card data-testid="card">
        <>
          <Card.Header>Header in Fragment</Card.Header>
          <Card.Content>Content in Fragment</Card.Content>
        </>
      </Card>
    );

    const card = screen.getByTestId('card');

    // Current behavior: React fragments prevent proper compound detection
    // so Card still adds a wrapper, resulting in 2 .card-content elements:
    // 1. The wrapper added by Card component
    // 2. The Card.Content compound component itself
    expect(card.querySelectorAll('.card-content')).toHaveLength(2);
    expect(screen.getByText('Header in Fragment')).toBeInTheDocument();
    expect(screen.getByText('Content in Fragment')).toBeInTheDocument();

    // This demonstrates a limitation with fragment detection
    // The compound components are rendered but wrapped by an extra card-content
  });

  // Test 56: Error boundary compatibility
  test('handles errors gracefully in compound components', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    const ThrowError = () => {
      throw new Error('Test error');
    };

    expect(() => {
      render(
        <Card data-testid="card">
          <Card.Content>
            <ThrowError />
          </Card.Content>
        </Card>
      );
    }).toThrow('Test error');

    consoleSpy.mockRestore();
  });

  // Test 57: Accessibility with screen reader navigation
  test('provides proper semantic structure for screen readers', () => {
    render(
      <Card data-testid="card" role="article" aria-labelledby="card-title">
        <Card.Header>
          <Card.Header.Title id="card-title">Accessible Card</Card.Header.Title>
          <Card.Header.Icon aria-label="expand card" aria-expanded="false">
            <i className="fas fa-chevron-down" aria-hidden="true"></i>
          </Card.Header.Icon>
        </Card.Header>
        <Card.Content>
          <p>Card content for screen readers</p>
        </Card.Content>
        <Card.Footer>
          <Card.FooterItem>
            <button type="button" aria-label="Save card">
              Save
            </button>
          </Card.FooterItem>
        </Card.Footer>
      </Card>
    );

    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('role', 'article');
    expect(card).toHaveAttribute('aria-labelledby', 'card-title');

    const headerIcon = screen.getByLabelText('expand card');
    expect(headerIcon).toHaveAttribute('aria-expanded', 'false');

    const saveButton = screen.getByLabelText('Save card');
    expect(saveButton).toBeInTheDocument();
  });

  // Test 58: Dynamic prop updates and re-rendering
  test('updates correctly when props change dynamically', () => {
    const { rerender } = render(
      <Card data-testid="card" hasShadow={true} textColor="primary">
        Initial content
      </Card>
    );

    let card = screen.getByTestId('card');
    expect(card).toHaveClass('card');
    expect(card).not.toHaveClass('is-shadowless');
    expect(card).toHaveClass('has-text-primary');

    // Update props
    rerender(
      <Card
        data-testid="card"
        hasShadow={false}
        textColor="danger"
        bgColor="light"
      >
        Updated content
      </Card>
    );

    card = screen.getByTestId('card');
    expect(card).toHaveClass('is-shadowless');
    expect(card).toHaveClass('has-text-danger');
    expect(card).toHaveClass('has-background-light');
    expect(screen.getByText('Updated content')).toBeInTheDocument();
  });

  // Test 59: Memory usage with compound component cleanup
  test('cleans up compound components properly on unmount', () => {
    const { unmount } = render(
      <Card data-testid="card">
        <Card.Header>Header</Card.Header>
        <Card.Content>Content</Card.Content>
        <Card.Footer>Footer</Card.Footer>
      </Card>
    );

    expect(screen.getByTestId('card')).toBeInTheDocument();

    unmount();

    expect(screen.queryByTestId('card')).not.toBeInTheDocument();
  });

  // Test 60: Complex image handling scenarios
  test('handles various image formats and edge cases', () => {
    const { rerender } = render(
      <Card data-testid="card" image="/test.jpg" imageAlt="Test image">
        Content
      </Card>
    );

    let card = screen.getByTestId('card');
    let image = card.querySelector('img');
    expect(image).toHaveAttribute('src', '/test.jpg');
    expect(image).toHaveAttribute('alt', 'Test image');

    // Test with no alt text
    rerender(
      <Card data-testid="card" image="/test2.jpg">
        Content
      </Card>
    );

    card = screen.getByTestId('card');
    image = card.querySelector('img');
    expect(image).toHaveAttribute('alt', 'Card image');

    // Test with React node image
    rerender(
      <Card
        data-testid="card"
        image={<div data-testid="custom-image">Custom Image</div>}
      >
        Content
      </Card>
    );

    card = screen.getByTestId('card');
    expect(screen.getByTestId('custom-image')).toBeInTheDocument();
  });

  // Test 61: Footer array handling edge cases
  test('handles footer arrays with various data types', () => {
    render(
      <Card
        data-testid="card"
        footer={[
          'String item',
          <button key="btn">Button</button>,
          42,
          null,
          undefined,
          <span key="span">Span element</span>,
        ]}
      >
        Content
      </Card>
    );

    const card = screen.getByTestId('card');
    const footerItems = card.querySelectorAll('.card-footer-item');

    // Should render 6 footer items (including null/undefined)
    expect(footerItems).toHaveLength(6);

    expect(screen.getByText('String item')).toBeInTheDocument();
    expect(screen.getByText('Button')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Span element')).toBeInTheDocument();
  });

  // Test 62: Class prefix integration with compound components
  test('applies class prefix to main card and all compound components', () => {
    render(
      <ConfigProvider classPrefix="bulma-">
        <Card data-testid="card">
          <Card.Header data-testid="header">
            <Card.Header.Title data-testid="title">Title</Card.Header.Title>
            <Card.Header.Icon data-testid="icon">Icon</Card.Header.Icon>
          </Card.Header>
          <Card.Image data-testid="image">Image</Card.Image>
          <Card.Content data-testid="content">Content</Card.Content>
          <Card.Footer data-testid="footer">
            <Card.FooterItem data-testid="footer-item">Item</Card.FooterItem>
          </Card.Footer>
        </Card>
      </ConfigProvider>
    );

    // Main card should have prefix
    expect(screen.getByTestId('card')).toHaveClass('bulma-card');

    // Compound components should also use prefixed Bulma classes
    expect(screen.getByTestId('header')).toHaveClass('bulma-card-header');
    expect(screen.getByTestId('title')).toHaveClass('bulma-card-header-title');
    expect(screen.getByTestId('icon')).toHaveClass('bulma-card-header-icon');
    expect(screen.getByTestId('image')).toHaveClass('bulma-card-image');
    expect(screen.getByTestId('content')).toHaveClass('bulma-card-content');
    expect(screen.getByTestId('footer')).toHaveClass('bulma-card-footer');
    expect(screen.getByTestId('footer-item')).toHaveClass(
      'bulma-card-footer-item'
    );
  });

  // Test 63: Event handling propagation
  test('handles click events properly in compound structure', () => {
    const cardClick = jest.fn();
    const headerClick = jest.fn();
    const iconClick = jest.fn();
    const footerClick = jest.fn();

    render(
      <Card data-testid="card" onClick={cardClick}>
        <Card.Header data-testid="header" onClick={headerClick}>
          <Card.Header.Title>Title</Card.Header.Title>
          <Card.Header.Icon data-testid="icon" onClick={iconClick}>
            Icon
          </Card.Header.Icon>
        </Card.Header>
        <Card.Content>Content</Card.Content>
        <Card.Footer data-testid="footer" onClick={footerClick}>
          <Card.FooterItem>Footer</Card.FooterItem>
        </Card.Footer>
      </Card>
    );

    // Click on icon should trigger icon and bubble up
    fireEvent.click(screen.getByTestId('icon'));
    expect(iconClick).toHaveBeenCalledTimes(1);
    expect(headerClick).toHaveBeenCalledTimes(1);
    expect(cardClick).toHaveBeenCalledTimes(1);

    // Reset mocks
    jest.clearAllMocks();

    // Click on footer should trigger footer and bubble up
    fireEvent.click(screen.getByTestId('footer'));
    expect(footerClick).toHaveBeenCalledTimes(1);
    expect(cardClick).toHaveBeenCalledTimes(1);
    expect(headerClick).not.toHaveBeenCalled();
  });

  // Test 64: Compound component type checking
  test('hasCompoundComponents correctly identifies all compound types', () => {
    // Test with each compound component type individually except Card.Content
    // Card.Content would still create a .card-content element
    const compoundTests = [
      {
        component: <Card.Header key="header">Header</Card.Header>,
        shouldHaveContent: false,
      },
      {
        component: <Card.Image key="image">Image</Card.Image>,
        shouldHaveContent: false,
      },
      {
        component: <Card.Footer key="footer">Footer</Card.Footer>,
        shouldHaveContent: false,
      },
      {
        component: (
          <Card.FooterItem key="footer-item">Footer Item</Card.FooterItem>
        ),
        shouldHaveContent: false,
      },
      {
        component: <Card.Header.Icon key="header-icon">Icon</Card.Header.Icon>,
        shouldHaveContent: false,
      },
    ];

    compoundTests.forEach((test, index) => {
      render(<Card data-testid={`card-${index}`}>{test.component}</Card>);

      const card = screen.getByTestId(`card-${index}`);
      if (test.shouldHaveContent) {
        expect(card.querySelector('.card-content')).toBeInTheDocument();
      } else {
        // Should not have card-content wrapper when compound components are present
        expect(card.querySelector('.card-content')).toBeNull();
      }
    });

    // Test Card.Content separately as it creates its own .card-content
    render(
      <Card data-testid="card-content-test">
        <Card.Content>Content</Card.Content>
      </Card>
    );
    const cardWithContent = screen.getByTestId('card-content-test');
    expect(cardWithContent.querySelector('.card-content')).toBeInTheDocument();
  });

  // Test 65: Header centering with compound components
  test('properly centers header with compound components', () => {
    render(
      <Card data-testid="card">
        <Card.Header centered data-testid="header">
          Header Content
        </Card.Header>
      </Card>
    );

    const headerTitle = screen
      .getByTestId('card')
      .querySelector('.card-header-title');
    expect(headerTitle).toHaveClass('is-centered');
  });

  // Test 66: Multiple Card.Header.Icon components
  test('handles multiple header icons properly', () => {
    render(
      <Card data-testid="card">
        <Card.Header>
          <Card.Header.Title>Title</Card.Header.Title>
          <Card.Header.Icon data-testid="icon1" aria-label="first icon">
            <i className="fas fa-heart"></i>
          </Card.Header.Icon>
          <Card.Header.Icon data-testid="icon2" aria-label="second icon">
            <i className="fas fa-star"></i>
          </Card.Header.Icon>
        </Card.Header>
      </Card>
    );

    expect(screen.getByTestId('icon1')).toBeInTheDocument();
    expect(screen.getByTestId('icon2')).toBeInTheDocument();
    expect(screen.getByLabelText('first icon')).toBeInTheDocument();
    expect(screen.getByLabelText('second icon')).toBeInTheDocument();
  });

  // Test 67: Empty compound components
  test('handles empty compound components gracefully', () => {
    render(
      <Card data-testid="card">
        <Card.Header></Card.Header>
        <Card.Content></Card.Content>
        <Card.Footer></Card.Footer>
      </Card>
    );

    const card = screen.getByTestId('card');
    expect(card.querySelector('.card-header')).toBeInTheDocument();
    expect(card.querySelector('.card-content')).toBeInTheDocument();
    expect(card.querySelector('.card-footer')).toBeInTheDocument();
  });

  // Test 68: Bulma modifier classes with compound components
  test('applies Bulma modifier classes correctly with compound components', () => {
    render(
      <Card data-testid="card" m="4" p="2" textAlign="centered">
        <Card.Content>Content with modifiers</Card.Content>
      </Card>
    );

    const card = screen.getByTestId('card');
    expect(card).toHaveClass('m-4');
    expect(card).toHaveClass('p-2');
    expect(card).toHaveClass('has-text-centered');
  });
});
