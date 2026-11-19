// The Carousel partial holds an image in a slide to the slide's width, and
// that rule once outranked Bulma's ratio frames, so a ratio `Image` in a
// slide kept its photo's own height and overflowed the frame (#1166). jsdom
// lays nothing out, so these compile the partials an image in a slide meets,
// with no prefix and under one, read their rules, and resolve which one wins
// on the markup bestax renders, the way a browser would. The rule is meant to
// be a default that anything sizing an image itself overrides, so the image
// comes out the same in a slide as outside one.
import React from 'react';
import * as sass from 'sass';
import path from 'path';
import { render } from '@testing-library/react';
import { Carousel, CarouselItem } from '../Carousel';
import { Avatar } from '../Avatar';
import { Image, type ImageProps } from '../../elements/Image';
import { ConfigProvider } from '../../helpers/Config';

const SCSS = path.resolve(__dirname, '../../scss');

// The Bulma bulma-ui depends on, found through its package.json.
const BULMA = path.dirname(require.resolve('bulma/package.json'));

const BULMA_PARTIALS = ['bulma/sass/base/generic', 'bulma/sass/elements/image'];
const EXTRAS_PARTIALS = ['components/avatar', 'components/carousel'];

/**
 * The partials in the order a page loads them: Bulma first, as `bestax.css`
 * has it, or bestax's extras first, as a page that loads `extras.css` ahead
 * of its own Bulma has it.
 */
const compile = (prefix: string, order: 'bulma first' | 'extras first') => {
  const partials =
    order === 'bulma first'
      ? [...BULMA_PARTIALS, ...EXTRAS_PARTIALS]
      : [...EXTRAS_PARTIALS, ...BULMA_PARTIALS];
  return sass.compileString(
    `@use 'bulma/sass/utilities/initial-variables' with ($class-prefix: '${prefix}');
     ${partials.map(partial => `@use '${partial}';`).join('\n')}`,
    {
      loadPaths: [SCSS, path.dirname(BULMA)],
      quietDeps: true,
      logger: sass.Logger.silent,
    }
  ).css;
};

type Rule = { selector: string; style: CSSStyleDeclaration };

/** Every style rule outside a media query, in source order. */
function rulesOf(source: string): Rule[] {
  const sheet = document.createElement('style');
  sheet.textContent = source.replace(/@charset "UTF-8";/g, '');
  document.head.appendChild(sheet);
  const out: Rule[] = [];
  try {
    for (const rule of Array.from((sheet.sheet as CSSStyleSheet).cssRules)) {
      if (!(rule instanceof CSSStyleRule)) continue;
      for (const selector of rule.selectorText.split(/,(?![^(]*\))/)) {
        out.push({ selector: selector.trim(), style: rule.style });
      }
    }
  } finally {
    sheet.remove();
  }
  return out;
}

/**
 * Specificity as [ids, classes, types], enough for the rules these partials
 * write for an image. `:where()` and what it holds count nothing, as in a
 * browser.
 */
const specificity = (selector: string): number[] => {
  const ranked = selector.replace(/:where\((?:[^()]|\([^()]*\))*\)/g, ' ');
  return [
    (ranked.match(/#[\w-]+/g) ?? []).length,
    (ranked.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) ?? []).length,
    (ranked.match(/(?:^|[\s>+~])[a-z][\w-]*/gi) ?? []).length,
  ];
};

const outranks = (a: number[], b: number[]) => {
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return true; // equal: the later declaration wins
};

/**
 * The value `property` gets on `el` from the rules: the most specific
 * matching rule, the later one on a tie.
 */
function resolveIn(rules: Rule[], el: Element, property: string) {
  let won: { value: string; rank: number[] } | undefined;
  for (const { selector, style } of rules) {
    if (!el.matches(selector)) continue;
    const value = style.getPropertyValue(property);
    if (!value) continue;
    const rank = specificity(selector);
    if (!won || outranks(rank, won.rank)) won = { value, rank };
  }
  return won?.value;
}

// Every ratio Bulma draws a frame for, and its fixed sizes.
const RATIOS: NonNullable<ImageProps['size']>[] = [
  'square',
  '1by1',
  '5by4',
  '4by3',
  '3by2',
  '5by3',
  '16by9',
  '2by1',
  '3by1',
  '4by5',
  '3by4',
  '2by3',
  '3by5',
  '9by16',
  '1by2',
  '1by3',
];
const FIXED_SIZES: NonNullable<ImageProps['size']>[] = [
  '16x16',
  '24x24',
  '32x32',
  '48x48',
  '64x64',
  '96x96',
  '128x128',
];

// How an image is laid out in its box.
const BOX = ['height', 'width', 'position', 'top', 'right', 'bottom', 'left'];

const PHOTO = 'https://example.com/photo.jpg';

describe.each([
  ['no prefix', ''],
  ['a class prefix', 'bestax-'],
])('an image in a Carousel item, with %s', (_label, prefix) => {
  /** The `<img>` `content` renders, in a slide or on its own. */
  const imgOf = (content: React.ReactNode, inSlide: boolean) =>
    render(
      <ConfigProvider classPrefix={prefix}>
        {inSlide ? (
          <Carousel>
            <CarouselItem>{content}</CarouselItem>
          </Carousel>
        ) : (
          content
        )}
      </ConfigProvider>
    ).container.querySelector('img') as HTMLImageElement;

  describe.each(['bulma first', 'extras first'] as const)('with %s', order => {
    const RULES = rulesOf(compile(prefix, order));
    const resolve = (el: Element, property: string) =>
      resolveIn(RULES, el, property);
    const boxOf = (img: Element) =>
      Object.fromEntries(
        BOX.map(property => [property, resolve(img, property)])
      );

    it.each(RATIOS)('fills a %s frame', size => {
      const img = imgOf(<Image size={size} src={PHOTO} alt="" />, true);
      expect(img.closest(`.${prefix}carousel-item`)).not.toBeNull();
      // jsdom serializes a zero length as `0px`, as browsers do.
      expect(boxOf(img)).toEqual({
        height: '100%',
        width: '100%',
        position: 'absolute',
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px',
      });
    });

    it.each([...RATIOS, ...FIXED_SIZES])(
      'lays out a %s Image as it does outside a slide',
      size => {
        const image = <Image size={size} src={PHOTO} alt="" />;
        expect(boxOf(imgOf(image, true))).toEqual(boxOf(imgOf(image, false)));
      }
    );

    it("fills an Avatar's circle as it does outside a slide", () => {
      const avatar = <Avatar src={PHOTO} alt="" />;
      const inSlide = imgOf(avatar, true);
      expect(resolve(inSlide, 'height')).toBe('100%');
      expect(boxOf(inSlide)).toEqual(boxOf(imgOf(avatar, false)));
    });

    it.each([
      ['an Image with no size', <Image key="image" src={PHOTO} alt="" />],
      ['a bare img', <img key="img" src={PHOTO} alt="" />],
    ])("holds %s to the slide's width", (_kind, content) => {
      const img = imgOf(content, true);
      expect(resolve(img, 'max-width')).toBe('100%');
      expect(resolve(img, 'height')).toBe('auto');
      expect(resolve(img, 'display')).toBe('block');
    });
  });
});
