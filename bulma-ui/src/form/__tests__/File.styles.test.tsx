// The keyboard focus ring of a File comes from _file.scss, which jsdom never
// loads on its own, so className assertions cannot see it. These compile the
// real partial and assert computed style instead. jsdom leaves `var()`
// unresolved, so values that read a variable are compared as written.
import * as sass from 'sass';
import path from 'path';
import { act, render } from '@testing-library/react';
import File, { type FileProps } from '../File';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (prefix = '') =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'form/file';`,
    {
      loadPaths: [SCSS, NODE_MODULES],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

let styleEl: HTMLStyleElement;

const withStylesheet = (prefix?: string) => {
  beforeAll(() => {
    styleEl = document.createElement('style');
    styleEl.textContent = compile(prefix);
    document.head.appendChild(styleEl);
  });
  afterAll(() => {
    styleEl.remove();
  });
};

const FOCUS_COLOR =
  'hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l))';

// Elements are found by selector, not by role: a role query reads each
// element's computed style, and jsdom keeps that until the DOM next changes,
// which focusing an element does not do. A stale entry would hide the
// :focus-visible rules.
const parts = (container: HTMLElement, prefix = '') => ({
  input: container.querySelector(`.${prefix}file-input`) as HTMLInputElement,
  cta: container.querySelector(`.${prefix}file-cta`) as HTMLElement,
  name: container.querySelector(`.${prefix}file-name`) as HTMLElement | null,
});

const COLORS: NonNullable<FileProps['color']>[] = [
  'primary',
  'link',
  'info',
  'success',
  'warning',
  'danger',
  'black',
  'dark',
  'light',
  'white',
];

describe('File focus ring', () => {
  withStylesheet();

  it('draws the ring inside the CTA when the input has focus', () => {
    const { container } = render(<File />);
    const { input, cta } = parts(container);
    act(() => input.focus());
    const style = getComputedStyle(cta);
    expect(style.outlineColor).toBe(FOCUS_COLOR);
    expect(style.outlineStyle).toBe('var(--bulma-focus-style)');
    expect(style.outlineWidth).toBe('var(--bulma-focus-width)');
    expect(style.outlineOffset).toBe('calc(-1 * var(--bulma-focus-width))');
  });

  it('draws no ring without focus', () => {
    const { container } = render(<File />);
    expect(getComputedStyle(parts(container).cta).outlineColor).toBe('');
  });

  it('rings the CTA, not the name, when hasName shows one', () => {
    const { container } = render(<File hasName fileName="resume.pdf" />);
    const { input, cta, name } = parts(container);
    act(() => input.focus());
    expect(getComputedStyle(cta).outlineColor).toBe(FOCUS_COLOR);
    expect(getComputedStyle(name as HTMLElement).outlineColor).toBe('');
  });

  it.each(COLORS)(
    'sets the ring off the fill of an is-%s CTA in its text colour',
    color => {
      const { container } = render(<File color={color} />);
      const { input, cta } = parts(container);
      act(() => input.focus());
      const style = getComputedStyle(cta);
      // currentColor: the CTA's text colour, which Bulma sets to read on the
      // fill. jsdom resolves it to the computed `color`.
      expect(style.outlineColor).not.toBe(FOCUS_COLOR);
      expect(style.outlineColor).toBe(style.color);
      expect(style.outlineOffset).toBe('calc(-2 * var(--bulma-focus-width))');
    }
  );
});

describe('File focus ring in a prefixed build', () => {
  withStylesheet('bestax-');

  it('draws the ring with the prefixed classes', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bestax-">
        <File color="link" />
      </ConfigProvider>
    );
    const { input, cta } = parts(container, 'bestax-');
    act(() => input.focus());
    const style = getComputedStyle(cta);
    expect(style.outlineColor).toBe(style.color);
    expect(style.outlineOffset).toBe('calc(-2 * var(--bulma-focus-width))');
  });
});
