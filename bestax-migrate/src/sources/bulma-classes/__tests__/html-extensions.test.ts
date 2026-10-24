/**
 * bulma-carousel's own markup: the selectors a page's script attaches it to,
 * the elements a selector matches, and what the notes say. How `html.ts`
 * turns them into a page's TODOs is `html.test.ts`'s.
 */

import { parseHtml, type Element } from '../../_shared/html/parse.js';
import {
  carouselClassMessage,
  carouselSelectors,
  coveredMessage,
  drivenMessage,
  readSelector,
  selectAll,
} from '../html-extensions.js';

/** The lines of what a selector matches in a page. */
function linesOf(source: string, selector: string): number[] | null {
  const parsed = parseHtml(source);
  return (
    selectAll(parsed.root, selector, parsed.quirks)?.map(
      (element: Element) => element.sourceCodeLocation!.startLine
    ) ?? null
  );
}

describe('carouselSelectors', () => {
  it('reads each selector written as a string, once, in order', () => {
    expect(
      carouselSelectors(
        [
          "bulmaCarousel.attach('#carousel-demo', { slidesToShow: 1 });",
          'bulmaCarousel.attach( " .hero-carousel " );',
          'bulmaCarousel . attach(`#slider`, options);',
          "bulmaCarousel.attach('#carousel-demo');",
        ].join('\n')
      )
    ).toEqual(['#carousel-demo', '.hero-carousel', '#slider']);
  });

  it('leaves a selector it would have to work out, and an empty one', () => {
    expect(
      carouselSelectors(
        [
          'bulmaCarousel.attach();',
          'bulmaCarousel.attach(selector);',
          "bulmaCarousel.attach('#a' + suffix);",
          'bulmaCarousel.attach(`#${id}`);',
          "bulmaCarousel.attach('#a\\\\:b');",
          "bulmaCarousel.attach('');",
          "myCarousel.attach('#x');",
        ].join('\n')
      )
    ).toEqual([]);
  });
});

describe('readSelector', () => {
  it('reads tags, ids, classes and lists of them', () => {
    expect(readSelector('div#a.carousel.b, .c, *.d, section')).toEqual([
      { tag: 'div', ids: ['a'], classes: ['carousel', 'b'] },
      { tag: null, ids: [], classes: ['c'] },
      { tag: null, ids: [], classes: ['d'] },
      { tag: 'section', ids: [], classes: [] },
    ]);
  });

  it.each([
    '.hero .carousel',
    'div > .carousel',
    '.a + .b',
    '[data-carousel]',
    '.carousel:not(.x)',
    '#1st',
    '.a,',
    '.a..b',
    '',
  ])('reads none of %j', selector => {
    expect(readSelector(selector)).toBeNull();
  });
});

describe('selectAll', () => {
  const page = (body: string, doctype = '<!DOCTYPE html>') =>
    `${doctype}\n<html><body>\n${body}\n</body></html>`;

  it('finds every element an id selects, a repeated id included, in order', () => {
    const source = page(
      [
        '<div id="carousel-demo" class="carousel">a</div>',
        '<p>b</p>',
        '<section><div id="carousel-demo" class="carousel">c</div></section>',
      ].join('\n')
    );
    expect(linesOf(source, '#carousel-demo')).toEqual([3, 5]);
    expect(linesOf(source, 'div.carousel, p')).toEqual([3, 4, 5]);
    expect(linesOf(source, 'DIV#carousel-demo')).toEqual([3, 5]);
    expect(linesOf(source, '#Carousel-demo')).toEqual([]);
    expect(linesOf(source, '#carousel-demo.missing')).toEqual([]);
    expect(linesOf(source, '#carousel-demo#other')).toEqual([]);
    expect(linesOf(source, '.hero .carousel')).toBeNull();
  });

  it('matches ids and classes in any ASCII case in quirks mode', () => {
    const body = '<div id="Slider" class="Carousel">a</div>';
    expect(linesOf(page(body, ''), '#slider')).toEqual([3]);
    expect(linesOf(page(body, ''), '.carousel')).toEqual([3]);
    expect(linesOf(page(body), '#slider')).toEqual([]);
  });

  it("matches a foreign element's tag as written", () => {
    const source = page('<svg><foreignObject class="x"></foreignObject></svg>');
    expect(linesOf(source, 'foreignObject')).toEqual([3]);
    expect(linesOf(source, 'foreignobject')).toEqual([]);
  });

  it("searches neither a template's content nor a noscript", () => {
    const source = page(
      [
        '<template><div class="carousel">a</div></template>',
        '<noscript><div class="carousel">b</div></noscript>',
        '<div class="carousel">c</div>',
      ].join('\n')
    );
    expect(linesOf(source, '.carousel')).toEqual([5]);
  });
});

describe('the notes', () => {
  it('names the script, the selector and the element it makes a carousel', () => {
    const message = drivenMessage({
      selector: '#slider',
      script: "the page's script `js/scripts.js`",
      count: 1,
      carouselClass: false,
    });
    expect(message).toMatch(
      /^the page's script `js\/scripts\.js` attaches bulma-carousel to this element \(`#slider`\): /
    );
    expect(message).toContain('`CarouselItem` for each slide');
    expect(message).toContain('`html-script:carousel` recipe');
    expect(message).not.toContain('bestax.css');
  });

  it('says why several elements are carousels, and what bestax does with the class', () => {
    const message = drivenMessage({
      selector: '#carousel-demo',
      script: 'the inline script at line 482',
      count: 2,
      sharedId: 'carousel-demo',
      carouselClass: true,
    });
    expect(message).toContain(
      'attaches bulma-carousel to `#carousel-demo`, which selects these 2 elements, since the page gives each one `id="carousel-demo"`, so each is a carousel'
    );
    expect(message).toContain('in the place of each');
    expect(message).toContain(
      "`carousel` is bestax `Carousel`'s own class, which `bestax.css` and `extras.css` style as its root"
    );
    expect(
      drivenMessage({
        selector: '.carousel',
        script: 'an inline script',
        count: 3,
        carouselClass: true,
      })
    ).toContain('which selects these 3 elements, so each is a carousel');
  });

  it('says what the class does on a carousel no selector reached', () => {
    expect(carouselClassMessage()).toMatch(
      /^`carousel` is the class bulma-carousel's markup gives a carousel, and bestax `Carousel`'s own, .*: if the page's carousel script drives this element, render bestax's `Carousel` in its place/
    );
  });

  it("names Image's lack of a prop and the CSS that keeps an image covered", () => {
    const message = coveredMessage();
    expect(message).toContain('`Image` has no prop for it');
    expect(message).toContain(
      '`.image.is-covered img { width: 100%; height: 100%; object-fit: cover; }`'
    );
  });
});
