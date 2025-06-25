import { render } from '@testing-library/react';
import { Column } from '../Column';

describe('Column', () => {
  it('renders children', () => {
    const { getByText } = render(<Column>Test Column</Column>);
    expect(getByText('Test Column')).toBeInTheDocument();
  });

  it('applies the column class', () => {
    const { container } = render(<Column />);
    expect(container.firstChild).toHaveClass('column');
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

  it('applies offset classes', () => {
    const { container } = render(
      <Column offset="one-quarter" offsetDesktop={2} />
    );
    expect(container.firstChild).toHaveClass('is-offset-one-quarter');
    expect(container.firstChild).toHaveClass('is-offset-2-desktop');
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
});
