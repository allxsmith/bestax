import { render } from '@testing-library/react';
import { Columns } from '../Columns';
import { Column } from '../Column';
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

  it('applies custom gap classes via the preferred gap* props', () => {
    const { container } = render(
      <Columns
        gap={2}
        gapMobile={1}
        gapTablet={0}
        gapDesktop={3}
        gapWidescreen={8}
        gapFullhd={2}
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

  it('accepts gap values as strings, matching BulmaGapValue', () => {
    const { container } = render(<Columns gap="4" gapMobile="1" />);
    expect(container.firstChild).toHaveClass('is-4', 'is-1-mobile');
  });

  it('prefers gap* props over the deprecated gapSize* props when both are set', () => {
    const { container } = render(
      <Columns
        gap={5}
        gapSize={1}
        gapMobile={6}
        gapSizeMobile={2}
        gapTablet={7}
        gapSizeTablet={3}
        gapDesktop={8}
        gapSizeDesktop={4}
        gapWidescreen={0}
        gapSizeWidescreen={5}
        gapFullhd={1}
        gapSizeFullhd={6}
      />
    );
    expect(container.firstChild).toHaveClass(
      'is-5',
      'is-6-mobile',
      'is-7-tablet',
      'is-8-desktop',
      'is-0-widescreen',
      'is-1-fullhd'
    );
    expect(container.firstChild).not.toHaveClass(
      'is-1',
      'is-2-mobile',
      'is-3-tablet',
      'is-4-desktop',
      'is-5-widescreen',
      'is-6-fullhd'
    );
  });

  it('falls back to the deprecated gapSize* props when gap* is not set', () => {
    const { container } = render(
      <Columns
        gapSize={4}
        gapSizeMobile={3}
        gapSizeTablet={2}
        gapSizeDesktop={1}
        gapSizeWidescreen={0}
        gapSizeFullhd={4}
      />
    );
    expect(container.firstChild).toHaveClass(
      'is-4',
      'is-3-mobile',
      'is-2-tablet',
      'is-1-desktop',
      'is-0-widescreen',
      'is-4-fullhd'
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

describe('Compound components', () => {
  test('Columns.Column is the Column component', () => {
    expect(Columns.Column).toBe(Column);
  });

  test('renders columns through the dot path', () => {
    const { container } = render(
      <Columns>
        <Columns.Column>First</Columns.Column>
        <Columns.Column>Second</Columns.Column>
      </Columns>
    );
    expect(container.querySelector('.columns')).toBeInTheDocument();
    expect(container.querySelectorAll('.column')).toHaveLength(2);
  });
});
