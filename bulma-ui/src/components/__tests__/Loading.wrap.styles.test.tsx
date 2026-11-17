// Loading's text was `white-space: nowrap`, so text wider than the overlay ran
// off both of its sides, and a full-page loading, fixed to the window, can't
// be scrolled to show it (#1910). These compile `_loading.scss`, with no
// prefix and under one, and resolve what it declares on the text and its
// wrapper Loading renders. jsdom lays nothing out, and doesn't inherit
// `white-space`, so they read the partial's own declarations; in a browser
// the text keeps its one line while it fits, since the wrapper takes its
// content's width and only shrinks when that's wider than the overlay.
import { render } from '@testing-library/react';
import { Loading } from '../Loading';
import { ConfigProvider } from '../../helpers/Config';
import { cascade, compilePartial } from '../../__tests__/css-cascade';

describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('Loading text wrapping, with %s', (_label, prefix) => {
  const css = compilePartial('components/loading', prefix);

  /** What the partial's rules set `property` to on `el`. */
  const declared = (el: Element, property: string) =>
    cascade(
      el,
      css,
      [property],
      (style, name) => style.getPropertyValue(name).trim() || undefined
    );

  const renderLoading = () =>
    render(
      <ConfigProvider classPrefix={prefix || undefined}>
        <Loading active canCancel onCancel={() => {}}>
          Loading your account details, please wait a moment
        </Loading>
      </ConfigProvider>
    );

  it('wraps text wider than the overlay inside it, a long word too', () => {
    const { container } = renderLoading();
    const text = container.querySelector(`.${prefix}loading-text`)!;
    // Declared rather than left to inherit, since Loading renders inside what
    // it covers, which may be `pre` or `nowrap`.
    expect(declared(text, 'white-space')).toBe('normal');
    expect(declared(text, 'max-width')).toBe('100%');
    expect(declared(text, 'overflow-wrap')).toBe('break-word');
  });

  it('lets the content shrink to the overlay past its longest word', () => {
    const { container } = renderLoading();
    const content = container.querySelector(`.${prefix}loading-content`)!;
    expect(declared(content, 'min-width')).toBe('0px');
  });
});
