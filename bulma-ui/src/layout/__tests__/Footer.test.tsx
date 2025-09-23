import { render, screen } from '@testing-library/react';
import Footer from '../Footer';
import { ConfigProvider } from '../../helpers/Config';

describe('Footer', () => {
  it('renders as <footer> by default', () => {
    render(<Footer data-testid="footer-default">Default Footer</Footer>);
    const footer = screen.getByTestId('footer-default');
    expect(footer.tagName.toLowerCase()).toBe('footer');
    expect(footer).toHaveClass('footer');
    expect(footer).toHaveTextContent('Default Footer');
  });

  it('renders as a custom element with "as" prop', () => {
    render(
      <Footer as="div" data-testid="footer-div">
        Div Footer
      </Footer>
    );
    const footer = screen.getByTestId('footer-div');
    expect(footer.tagName.toLowerCase()).toBe('div');
    expect(footer).toHaveClass('footer');
    expect(footer).toHaveTextContent('Div Footer');
  });

  it('applies Bulma helper classes', () => {
    render(
      <Footer m="4" data-testid="footer-helper">
        Helper Footer
      </Footer>
    );
    const footer = screen.getByTestId('footer-helper');
    expect(footer).toHaveClass('footer', 'm-4');
  });

  it('applies custom className', () => {
    render(
      <Footer className="custom-footer" data-testid="footer-custom">
        Custom Footer
      </Footer>
    );
    const footer = screen.getByTestId('footer-custom');
    expect(footer).toHaveClass('footer', 'custom-footer');
  });

  it('forwards HTML attributes', () => {
    render(
      <Footer
        id="my-footer"
        aria-label="footer-aria"
        data-testid="footer-attrs"
      >
        Footer Attrs
      </Footer>
    );
    const footer = screen.getByTestId('footer-attrs');
    expect(footer).toHaveAttribute('id', 'my-footer');
    expect(footer).toHaveAttribute('aria-label', 'footer-aria');
  });

  it('renders children', () => {
    render(
      <Footer data-testid="footer-children">
        <div>
          <span>Footer Child</span>
        </div>
      </Footer>
    );
    expect(screen.getByTestId('footer-children')).toContainHTML(
      '<span>Footer Child</span>'
    );
  });

  it('applies classPrefix when provided', () => {
    render(
      <ConfigProvider classPrefix="custom-">
        <Footer data-testid="footer-test">Test Footer</Footer>
      </ConfigProvider>
    );
    const footer = screen.getByTestId('footer-test');
    expect(footer).toHaveClass('custom-footer');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Footer data-testid="footer">Footer content</Footer>
        </ConfigProvider>
      );
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('bulma-footer');
    });

    it('uses default classes when no prefix is provided', () => {
      render(<Footer data-testid="footer">Footer content</Footer>);
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('footer');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Footer data-testid="footer">Footer content</Footer>
        </ConfigProvider>
      );
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('footer');
    });

    it('applies prefix to both main class and helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Footer data-testid="footer" textColor="primary" bgColor="dark" p="4">
            Footer content
          </Footer>
        </ConfigProvider>
      );
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('bulma-footer');
      expect(footer).toHaveClass('bulma-has-text-primary');
      expect(footer).toHaveClass('bulma-has-background-dark');
      expect(footer).toHaveClass('bulma-p-4');
    });

    it('works without prefix', () => {
      render(
        <Footer data-testid="footer" as="div" color="info" m="2">
          Footer content
        </Footer>
      );
      const footer = screen.getByTestId('footer');
      expect(footer).toBeInTheDocument();
      expect(footer).toHaveClass('footer');
      expect(footer).toHaveClass('has-text-info');
      expect(footer).toHaveClass('m-2');
      expect(footer.tagName.toLowerCase()).toBe('div');
    });
  });
});
