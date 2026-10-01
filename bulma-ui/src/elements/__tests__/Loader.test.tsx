import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { Loader } from '../Loader';
import { ConfigProvider } from '../../helpers/Config';

describe('Loader', () => {
  it('renders Bulma’s loader element as a progressbar named "Loading"', () => {
    render(<Loader />);
    const loader = screen.getByRole('progressbar', { name: 'Loading' });
    expect(loader.tagName).toBe('SPAN');
    expect(loader).toHaveClass('loader');
    expect(loader).toBeEmptyDOMElement();
  });

  it('stays indeterminate: no aria-valuenow', () => {
    render(<Loader />);
    expect(screen.getByRole('progressbar')).not.toHaveAttribute(
      'aria-valuenow'
    );
  });

  it('takes its accessible name from ariaLabel', () => {
    render(<Loader ariaLabel="Saving row" />);
    expect(
      screen.getByRole('progressbar', { name: 'Saving row' })
    ).toBeInTheDocument();
  });

  it('can be named by visible text through aria-labelledby', () => {
    render(
      <>
        <Loader aria-labelledby="save-status" />
        <span id="save-status">Saving changes</span>
      </>
    );
    expect(
      screen.getByRole('progressbar', { name: 'Saving changes' })
    ).toBeInTheDocument();
  });

  it('applies classPrefix when provided via ConfigProvider', () => {
    render(
      <ConfigProvider classPrefix="bestax-">
        <Loader textSize="3" />
      </ConfigProvider>
    );
    const loader = screen.getByRole('progressbar');
    expect(loader).toHaveClass('bestax-loader', 'bestax-is-size-3');
    expect(loader).not.toHaveClass('loader');
  });

  it('applies helper props, with className merged last', () => {
    render(
      <Loader textSize="3" display="inline-block" mr="2" className="custom" />
    );
    const loader = screen.getByRole('progressbar');
    expect(loader).toHaveClass(
      'loader',
      'is-size-3',
      'is-inline-block',
      'mr-2',
      'custom'
    );
    expect(loader.className.split(' ').pop()).toBe('custom');
  });

  it('passes other attributes through to the element', () => {
    render(<Loader id="row-loader" data-testid="loader" title="Busy" />);
    const loader = screen.getByTestId('loader');
    expect(loader).toHaveAttribute('id', 'row-loader');
    expect(loader).toHaveAttribute('title', 'Busy');
  });

  it('forwards its ref to the span', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Loader ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
    expect(ref.current).toHaveClass('loader');
  });

  it('declares no color props, since the ring ignores text color', () => {
    render(
      <>
        {/* @ts-expect-error: the ring is drawn in --bulma-border, so Loader takes no color */}
        <Loader color="primary" />
        {/* @ts-expect-error: nor a background color */}
        <Loader backgroundColor="primary" />
      </>
    );
    expect(screen.getAllByRole('progressbar')).toHaveLength(2);
  });

  it('has a displayName for dev tools', () => {
    expect(Loader.displayName).toBe('Loader');
  });
});
