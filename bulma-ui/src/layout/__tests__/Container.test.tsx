import { render } from '@testing-library/react';
import { Container } from '../Container';
import { ConfigProvider } from '../../helpers/Config';

describe('Container', () => {
  it('renders children', () => {
    const { getByText } = render(<Container>Test Content</Container>);
    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('applies the container class', () => {
    const { container } = render(<Container>Content</Container>);
    expect(container.firstChild).toHaveClass('container');
  });

  it('applies classPrefix when provided', () => {
    const { container } = render(
      <ConfigProvider classPrefix="custom-">
        <Container>Test Content</Container>
      </ConfigProvider>
    );
    expect(container.firstChild).toHaveClass('custom-container');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Container>Container content</Container>
        </ConfigProvider>
      );
      const containerEl = container.firstChild;
      expect(containerEl).toBeInTheDocument();
      expect(containerEl).toHaveClass('bulma-container');
    });

    it('uses default classes when no prefix is provided', () => {
      const { container } = render(<Container>Container content</Container>);
      const containerEl = container.firstChild;
      expect(containerEl).toBeInTheDocument();
      expect(containerEl).toHaveClass('container');
    });

    it('uses default classes when classPrefix is undefined', () => {
      const { container } = render(
        <ConfigProvider classPrefix={undefined}>
          <Container>Container content</Container>
        </ConfigProvider>
      );
      const containerEl = container.firstChild;
      expect(containerEl).toBeInTheDocument();
      expect(containerEl).toHaveClass('container');
    });

    it('applies prefix to both main class and container modifiers', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Container fluid breakpoint="desktop" isMax textColor="primary">
            Container content
          </Container>
        </ConfigProvider>
      );
      const containerEl = container.firstChild;
      expect(containerEl).toBeInTheDocument();
      expect(containerEl).toHaveClass('bulma-container');
      expect(containerEl).toHaveClass('bulma-is-fluid');
      expect(containerEl).toHaveClass('bulma-is-max-desktop');
      expect(containerEl).toHaveClass('bulma-has-text-primary');
    });

    it('works without prefix', () => {
      const { container } = render(
        <Container widescreen fullhd bgColor="danger">
          Container content
        </Container>
      );
      const containerEl = container.firstChild;
      expect(containerEl).toBeInTheDocument();
      expect(containerEl).toHaveClass('container');
      expect(containerEl).toHaveClass('is-widescreen');
      expect(containerEl).toHaveClass('is-fullhd');
      expect(containerEl).toHaveClass('has-background-danger');
    });
  });

  it('applies custom className', () => {
    const { container } = render(
      <Container className="custom-class">Content</Container>
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('applies is-fluid, is-widescreen, and is-fullhd classes', () => {
    const { container } = render(
      <Container fluid widescreen fullhd>
        Content
      </Container>
    );
    expect(container.firstChild).toHaveClass('is-fluid');
    expect(container.firstChild).toHaveClass('is-widescreen');
    expect(container.firstChild).toHaveClass('is-fullhd');
  });

  it('applies is-{breakpoint} class when isMax is false or unset', () => {
    const { container } = render(
      <Container breakpoint="tablet">Content</Container>
    );
    expect(container.firstChild).toHaveClass('is-tablet');
  });

  it('applies is-max-{breakpoint} class when isMax is true and valid', () => {
    const { container } = render(
      <Container breakpoint="desktop" isMax>
        Content
      </Container>
    );
    expect(container.firstChild).toHaveClass('is-max-desktop');
    expect(container.firstChild).not.toHaveClass('is-desktop');
  });

  it('does not apply is-max-* for invalid breakpoints', () => {
    // This test is defensive; since breakpoint is typed,
    // isMax is only checked for allowed breakpoints.
    // Let's simulate a wrong combination and expect it to fallback to is-{breakpoint}
    const { container } = render(
      <Container breakpoint="tablet" isMax={false}>
        Content
      </Container>
    );
    expect(container.firstChild).toHaveClass('is-tablet');
    expect(container.firstChild).not.toHaveClass('is-max-tablet');
  });

  it('applies bulmaHelperClasses from props', () => {
    const { container } = render(
      <Container textColor="primary" bgColor="info">
        Content
      </Container>
    );
    // These classes depend on your useBulmaClasses implementation, but we expect something like:
    expect(container.firstChild).toHaveClass('has-text-primary');
    expect(container.firstChild).toHaveClass('has-background-info');
  });
});
