import { render } from '@testing-library/react';
import { Columns } from '../Columns';
import { ConfigProvider } from '../../helpers/Config';

describe('Columns', () => {
  it('renders children', () => {
    const { getByText } = render(
      <Columns>
        <div>Child 1</div>
        <div>Child 2</div>
      </Columns>
    );
    expect(getByText('Child 1')).toBeInTheDocument();
    expect(getByText('Child 2')).toBeInTheDocument();
  });

  it('applies the columns class', () => {
    const { container } = render(<Columns />);
    expect(container.firstChild).toHaveClass('columns');
  });

  it('applies classPrefix when provided', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bulma-">
        <Columns />
      </ConfigProvider>
    );
    expect(container.firstChild).toHaveClass('bulma-columns');
    expect(container.firstChild).not.toHaveClass('columns');
  });

  it('applies is-centered, is-gapless, is-multiline, is-vcentered, is-mobile, is-desktop classes', () => {
    const { container } = render(
      <Columns
        isCentered
        isGapless
        isMultiline
        isVCentered
        isMobile
        isDesktop
      />
    );
    expect(container.firstChild).toHaveClass(
      'is-centered',
      'is-gapless',
      'is-multiline',
      'is-vcentered',
      'is-mobile',
      'is-desktop'
    );
  });

  it('applies custom gap classes', () => {
    const { container } = render(
      <Columns
        gapSize={2}
        gapSizeMobile={1}
        gapSizeTablet={0}
        gapSizeDesktop={3}
        gapSizeWidescreen={8}
        gapSizeFullhd={2}
      />
    );
    expect(container.firstChild).toHaveClass(
      'is-2',
      'is-1-mobile',
      'is-0-tablet',
      'is-3-desktop',
      'is-8-widescreen',
      'is-2-fullhd'
    );
  });

  it('applies custom className', () => {
    const { container } = render(<Columns className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('forwards other props', () => {
    const { container } = render(<Columns id="test-id" data-test="foo" />);
    expect(container.firstChild).toHaveAttribute('id', 'test-id');
    expect(container.firstChild).toHaveAttribute('data-test', 'foo');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Columns>Test</Columns>
        </ConfigProvider>
      );
      const columns = container.querySelector('.bulma-columns');
      expect(columns).toBeInTheDocument();
      expect(columns).toHaveClass('bulma-columns');
    });

    it('uses default classes when no prefix is provided', () => {
      const { container } = render(<Columns>Test</Columns>);
      const columns = container.querySelector('.columns');
      expect(columns).toBeInTheDocument();
      expect(columns).toHaveClass('columns');
    });

    it('uses default classes when classPrefix is undefined', () => {
      const { container } = render(
        <ConfigProvider classPrefix={undefined}>
          <Columns>Test</Columns>
        </ConfigProvider>
      );
      const columns = container.querySelector('.columns');
      expect(columns).toBeInTheDocument();
      expect(columns).toHaveClass('columns');
    });

    it('applies prefix to both main class and columns modifiers', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Columns isCentered isMultiline gapSize={2} m="3">
            Test
          </Columns>
        </ConfigProvider>
      );
      const columns = container.querySelector('.bulma-columns');
      expect(columns).toBeInTheDocument();
      expect(columns).toHaveClass('bulma-columns');
      expect(columns).toHaveClass('bulma-is-centered');
      expect(columns).toHaveClass('bulma-is-multiline');
      expect(columns).toHaveClass('bulma-is-2');
      expect(columns).toHaveClass('bulma-m-3');
    });

    it('works without prefix', () => {
      const { container } = render(
        <Columns isGapless isVCentered gapSizeMobile={1} p="4">
          Test
        </Columns>
      );
      const columns = container.querySelector('.columns');
      expect(columns).toBeInTheDocument();
      expect(columns).toHaveClass('columns');
      expect(columns).toHaveClass('is-gapless');
      expect(columns).toHaveClass('is-vcentered');
      expect(columns).toHaveClass('is-1-mobile');
      expect(columns).toHaveClass('p-4');
    });
  });
});
