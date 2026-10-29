// `_dropzone.scss` makes Bulma's file widget a drop zone, draws its drag
// states and lays out the list, so these compile it, with no prefix and under
// one, and read its rules as text, the way RingProgress's are read. The lift
// that puts the input over the CTA is also checked on a rendered Dropzone,
// with Bulma's own stylesheet in the page.
import * as sass from 'sass';
import fs from 'fs';
import path from 'path';
import { render } from '@testing-library/react';
import { Dropzone } from '../Dropzone';

const SCSS = path.resolve(__dirname, '../../scss');
const NODE_MODULES = path.resolve(__dirname, '../../../../node_modules');

const compile = (prefix: string) =>
  sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     @use 'form/dropzone';`,
    {
      loadPaths: [SCSS, NODE_MODULES],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;

interface Rule {
  /** The at-rules around it, outermost first, as written. */
  context: string[];
  selector: string;
  declarations: Record<string, string>;
}

/** Every style rule in a sheet of sass's expanded output. */
function rulesOf(css: string): Rule[] {
  const rules: Rule[] = [];
  // What each open brace opened: an at-rule's head, or a style rule.
  const open: (string | Rule)[] = [];
  let buffer = '';
  for (const char of css.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (char === '{') {
      const head = buffer.replace(/\s+/g, ' ').trim();
      buffer = '';
      if (head.startsWith('@')) {
        open.push(head);
      } else {
        const rule: Rule = {
          context: open.filter((o): o is string => typeof o === 'string'),
          selector: head,
          declarations: {},
        };
        rules.push(rule);
        open.push(rule);
      }
    } else if (char === '}') {
      const closed = open.pop();
      if (closed && typeof closed !== 'string') {
        for (const declaration of buffer.split(';')) {
          const at = declaration.indexOf(':');
          if (at < 0) continue;
          closed.declarations[declaration.slice(0, at).trim()] = declaration
            .slice(at + 1)
            .replace(/\s+/g, ' ')
            .trim();
        }
      }
      buffer = '';
    } else {
      buffer += char;
    }
  }
  return rules;
}

const PLAIN = rulesOf(compile(''));
const PREFIXED = rulesOf(compile('bestax-'));
const FORCED = ['@media (forced-colors: active)'];

/** The declarations of the rule with exactly this selector, in this context. */
function find(rules: Rule[], selector: string, context: string[] = []) {
  const rule = rules.find(
    r =>
      r.selector === selector && r.context.join(' | ') === context.join(' | ')
  );
  if (!rule) throw new Error(`no rule for ${selector} in ${context}`);
  return rule.declarations;
}

describe('Dropzone styles', () => {
  it('registers its variables on the root', () => {
    expect(find(PLAIN, '.dropzone')).toEqual({
      '--bulma-dropzone-border-style': 'dashed',
      '--bulma-dropzone-border-width': '2px',
      '--bulma-dropzone-min-height': '8rem',
      '--bulma-dropzone-dragover-border-color': 'var(--bulma-primary)',
      '--bulma-dropzone-reject-border-color': 'var(--bulma-danger)',
      '--bulma-dropzone-disabled-opacity': '0.5',
      '--bulma-dropzone-spacing': '0.5rem',
      '--bulma-dropzone-item-background': 'var(--bulma-scheme-main)',
      '--bulma-dropzone-item-border-color': 'var(--bulma-border)',
      '--bulma-dropzone-item-border-width': 'var(--bulma-control-border-width)',
      '--bulma-dropzone-item-radius': 'var(--bulma-radius)',
      '--bulma-dropzone-item-padding': '0.5em 0.75em',
      '--bulma-dropzone-item-gap': '0.75em',
      '--bulma-dropzone-item-spacing': '0.25rem',
      '--bulma-dropzone-name-color': 'var(--bulma-text-strong)',
      '--bulma-dropzone-size-color': 'var(--bulma-text-weak)',
      '--bulma-dropzone-size-font-size': 'var(--bulma-size-small)',
    });
  });

  it('lifts the input over the CTA, inside the label, with the pointer cursor', () => {
    expect(find(PLAIN, '.dropzone .file-label')).toEqual({
      isolation: 'isolate',
    });
    expect(find(PLAIN, '.dropzone .file-input')).toEqual({
      cursor: 'pointer',
      'z-index': '1',
    });
    expect(find(PLAIN, '.dropzone .file-input::file-selector-button')).toEqual({
      cursor: 'pointer',
    });
    expect(
      find(
        PLAIN,
        '.dropzone .file-input:disabled, .dropzone .file-input:disabled::file-selector-button'
      )
    ).toEqual({ cursor: 'not-allowed' });
  });

  it('draws the zone as a tall dashed box with its text centred', () => {
    expect(find(PLAIN, '.dropzone .file.is-boxed')).toEqual({
      'margin-block-end': '0',
    });
    expect(find(PLAIN, '.dropzone .file-cta')).toEqual({
      'border-style': 'var(--bulma-dropzone-border-style)',
      'border-width': 'var(--bulma-dropzone-border-width)',
      'justify-content': 'center',
      'min-height': 'var(--bulma-dropzone-min-height)',
      'text-align': 'center',
      'white-space': 'normal',
    });
  });

  it('draws the drag states with a solid border and the hover look', () => {
    const both =
      '.dropzone.is-dragover .file-label, .dropzone.is-drag-reject .file-label';
    expect(find(PLAIN, both)).toEqual({
      '--bulma-file-background-l-delta':
        'var(--bulma-file-hover-background-l-delta)',
      '--bulma-file-border-l-delta': 'var(--bulma-file-hover-border-l-delta)',
      '--bulma-file-color-l-delta': 'var(--bulma-file-hover-color-l-delta)',
    });
    expect(
      find(
        PLAIN,
        '.dropzone.is-dragover .file-cta, .dropzone.is-drag-reject .file-cta'
      )
    ).toEqual({ 'border-style': 'solid' });
    expect(find(PLAIN, '.dropzone.is-dragover .file-cta')).toEqual({
      'border-color': 'var(--bulma-dropzone-dragover-border-color)',
    });
    expect(find(PLAIN, '.dropzone.is-drag-reject .file-cta')).toEqual({
      'border-color': 'var(--bulma-dropzone-reject-border-color)',
    });
  });

  it('dims a disabled zone and drops its hover look', () => {
    expect(find(PLAIN, '.dropzone.is-disabled .file')).toEqual({
      opacity: 'var(--bulma-dropzone-disabled-opacity)',
    });
    expect(find(PLAIN, '.dropzone.is-disabled .file-label')).toEqual({
      '--bulma-file-background-l-delta': '0%',
      '--bulma-file-border-l-delta': '0%',
      '--bulma-file-color-l-delta': '0%',
    });
  });

  it('lays out a row per file, cutting a long name short', () => {
    expect(find(PLAIN, '.dropzone-list, .dropzone-rejections')).toEqual({
      'margin-block-start': 'var(--bulma-dropzone-spacing)',
    });
    expect(find(PLAIN, '.dropzone-item')).toEqual({
      'align-items': 'center',
      'background-color': 'var(--bulma-dropzone-item-background)',
      border:
        'var(--bulma-dropzone-item-border-width) solid var(--bulma-dropzone-item-border-color)',
      'border-radius': 'var(--bulma-dropzone-item-radius)',
      display: 'flex',
      gap: 'var(--bulma-dropzone-item-gap)',
      padding: 'var(--bulma-dropzone-item-padding)',
    });
    expect(find(PLAIN, '.dropzone-item + .dropzone-item')).toEqual({
      'margin-block-start': 'var(--bulma-dropzone-item-spacing)',
    });
    expect(find(PLAIN, '.dropzone-name')).toMatchObject({
      flex: '1 1 auto',
      'min-width': '0',
      overflow: 'hidden',
      'text-overflow': 'ellipsis',
      'white-space': 'nowrap',
    });
    expect(find(PLAIN, '.dropzone-size')).toEqual({
      color: 'var(--bulma-dropzone-size-color)',
      flex: 'none',
      'font-size': 'var(--bulma-dropzone-size-font-size)',
    });
  });

  it('rings a remove button with keyboard focus in Bulma focus colour', () => {
    expect(find(PLAIN, '.dropzone-item .delete:focus-visible')).toEqual({
      'outline-color':
        'hsl(var(--bulma-focus-h), var(--bulma-focus-s), var(--bulma-focus-l))',
      'outline-offset': 'var(--bulma-focus-offset)',
      'outline-style': 'var(--bulma-focus-style)',
      'outline-width': 'var(--bulma-focus-width)',
    });
  });

  it('keeps the states and the remove buttons visible in forced colours', () => {
    expect(find(PLAIN, '.dropzone.is-dragover .file-cta', FORCED)).toEqual({
      'border-color': 'Highlight',
    });
    expect(find(PLAIN, '.dropzone.is-drag-reject .file-cta', FORCED)).toEqual({
      'border-color': 'CanvasText',
    });
    expect(find(PLAIN, '.dropzone-item .delete', FORCED)).toEqual({
      'background-color': 'ButtonFace',
      border: '1px solid ButtonText',
      'forced-color-adjust': 'none',
    });
    expect(
      find(
        PLAIN,
        '.dropzone-item .delete::before, .dropzone-item .delete::after',
        FORCED
      )
    ).toEqual({ 'background-color': 'ButtonText' });
    expect(find(PLAIN, '.dropzone-item .delete:focus-visible', FORCED)).toEqual(
      { 'outline-color': 'Highlight' }
    );
  });

  it('prefixes every class in a prefixed build', () => {
    expect(PREFIXED).toHaveLength(PLAIN.length);
    for (const { selector } of PREFIXED) {
      for (const name of selector.match(/\.[a-z][\w-]*/g) ?? []) {
        expect(name).toMatch(/^\.bestax-/);
      }
    }
    expect(find(PREFIXED, '.bestax-dropzone .bestax-file-input')).toEqual({
      cursor: 'pointer',
      'z-index': '1',
    });
  });
});

describe('a rendered Dropzone with Bulma', () => {
  let sheet: HTMLStyleElement;
  beforeAll(() => {
    const bulma = fs.readFileSync(
      path.join(
        path.dirname(require.resolve('bulma/package.json')),
        'css',
        'bulma.css'
      ),
      'utf8'
    );
    sheet = document.createElement('style');
    // An @charset is valid only at the very start, and two sheets joined put
    // one in the middle.
    sheet.textContent = (bulma + compile('')).replace(/@charset "UTF-8";/g, '');
    document.head.appendChild(sheet);
  });
  afterAll(() => {
    sheet.remove();
  });

  // A browser hands a dropped file only to a file input under the pointer,
  // which here means the input, positioned with a z-index, painting over the
  // CTA, positioned with none, inside a label that isolates them.
  it('has its input over the CTA, where a drop lands on it', () => {
    const { container } = render(<Dropzone />);
    const input = container.querySelector('.file-input') as HTMLElement;
    const cta = container.querySelector('.file-cta') as HTMLElement;
    const label = container.querySelector('label.file-label') as HTMLElement;
    expect(getComputedStyle(input).position).toBe('absolute');
    expect(getComputedStyle(input).zIndex).toBe('1');
    expect(getComputedStyle(input).opacity).toBe('0');
    expect(getComputedStyle(cta).position).toBe('relative');
    expect(getComputedStyle(cta).zIndex).toBe('');
    expect(getComputedStyle(label).isolation).toBe('isolate');
  });
});
