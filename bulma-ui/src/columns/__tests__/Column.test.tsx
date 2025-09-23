import { render } from '@testing-library/react';
import { Column } from '../Column';
import { ConfigProvider } from '../../helpers/Config';

describe('Column', () => {
  it('renders children', () => {
    const { getByText } = render(<Column>Test Column</Column>);
    expect(getByText('Test Column')).toBeInTheDocument();
  });

  it('applies the column class', () => {
    const { container } = render(<Column />);
    expect(container.firstChild).toHaveClass('column');
  });

  it('applies classPrefix when provided', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bulma-">
        <Column />
      </ConfigProvider>
    );
    expect(container.firstChild).toHaveClass('bulma-column');
    expect(container.firstChild).not.toHaveClass('column');
  });

  it('applies size class', () => {
    const { container } = render(<Column size="half" />);
    expect(container.firstChild).toHaveClass('is-half');
  });

  it('applies responsive size classes', () => {
    const { container } = render(
      <Column sizeMobile="one-third" sizeTablet="two-thirds" sizeDesktop={8} />
    );
    expect(container.firstChild).toHaveClass('is-one-third-mobile');
    expect(container.firstChild).toHaveClass('is-two-thirds-tablet');
    expect(container.firstChild).toHaveClass('is-8-desktop');
  });

  it('applies all responsive size classes including widescreen and fullhd', () => {
    const { container } = render(
      <Column
        sizeMobile="one-third"
        sizeTablet="two-thirds"
        sizeDesktop={8}
        sizeWidescreen="half"
        sizeFullhd="full"
      />
    );
    expect(container.firstChild).toHaveClass('is-one-third-mobile');
    expect(container.firstChild).toHaveClass('is-two-thirds-tablet');
    expect(container.firstChild).toHaveClass('is-8-desktop');
    expect(container.firstChild).toHaveClass('is-half-widescreen');
    expect(container.firstChild).toHaveClass('is-full-fullhd');
  });

  it('applies offset classes', () => {
    const { container } = render(
      <Column offset="one-quarter" offsetDesktop={2} />
    );
    expect(container.firstChild).toHaveClass('is-offset-one-quarter');
    expect(container.firstChild).toHaveClass('is-offset-2-desktop');
  });

  it('applies all responsive offset classes', () => {
    const { container } = render(
      <Column
        offset="one-quarter"
        offsetMobile={1}
        offsetTablet={2}
        offsetDesktop={3}
        offsetWidescreen={4}
        offsetFullhd={5}
      />
    );
    expect(container.firstChild).toHaveClass('is-offset-one-quarter');
    expect(container.firstChild).toHaveClass('is-offset-1-mobile');
    expect(container.firstChild).toHaveClass('is-offset-2-tablet');
    expect(container.firstChild).toHaveClass('is-offset-3-desktop');
    expect(container.firstChild).toHaveClass('is-offset-4-widescreen');
    expect(container.firstChild).toHaveClass('is-offset-5-fullhd');
  });

  it('applies isNarrow and responsive isNarrow classes', () => {
    const { container } = render(
      <Column
        isNarrow
        isNarrowMobile
        isNarrowTablet
        isNarrowTouch
        isNarrowDesktop
        isNarrowWidescreen
        isNarrowFullhd
      />
    );
    expect(container.firstChild).toHaveClass(
      'is-narrow',
      'is-narrow-mobile',
      'is-narrow-tablet',
      'is-narrow-touch',
      'is-narrow-desktop',
      'is-narrow-widescreen',
      'is-narrow-fullhd'
    );
  });

  it('applies custom className', () => {
    const { container } = render(<Column className="my-col" />);
    expect(container.firstChild).toHaveClass('my-col');
  });

  it('forwards other props', () => {
    const { container } = render(<Column id="col-id" data-test="bar" />);
    expect(container.firstChild).toHaveAttribute('id', 'col-id');
    expect(container.firstChild).toHaveAttribute('data-test', 'bar');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Column>Test</Column>
        </ConfigProvider>
      );
      const column = container.querySelector('.bulma-column');
      expect(column).toBeInTheDocument();
      expect(column).toHaveClass('bulma-column');
    });

    it('uses default classes when no prefix is provided', () => {
      const { container } = render(<Column>Test</Column>);
      const column = container.querySelector('.column');
      expect(column).toBeInTheDocument();
      expect(column).toHaveClass('column');
    });

    it('uses default classes when classPrefix is undefined', () => {
      const { container } = render(
        <ConfigProvider classPrefix={undefined}>
          <Column>Test</Column>
        </ConfigProvider>
      );
      const column = container.querySelector('.column');
      expect(column).toBeInTheDocument();
      expect(column).toHaveClass('column');
    });

    it('applies prefix to both main class and column modifiers', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Column size="half" isNarrow m="2">
            Test
          </Column>
        </ConfigProvider>
      );
      const column = container.querySelector('.bulma-column');
      expect(column).toBeInTheDocument();
      expect(column).toHaveClass('bulma-column');
      expect(column).toHaveClass('bulma-is-half');
      expect(column).toHaveClass('bulma-is-narrow');
      expect(column).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      const { container } = render(
        <Column size="one-third" offset="one-quarter" p="3">
          Test
        </Column>
      );
      const column = container.querySelector('.column');
      expect(column).toBeInTheDocument();
      expect(column).toHaveClass('column');
      expect(column).toHaveClass('is-one-third');
      expect(column).toHaveClass('is-offset-one-quarter');
      expect(column).toHaveClass('p-3');
    });
  });
});
