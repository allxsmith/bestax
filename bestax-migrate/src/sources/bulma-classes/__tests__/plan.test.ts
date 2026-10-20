/**
 * The planner's decisions, one rule at a time. Whether a conversion renders
 * the same markup is `e2e/bulma-classes-truth.test.ts`'s job; this file pins
 * which elements convert, which refuse, and what they say.
 */

import { plan, type ChildFacts, type ElementFacts } from '../plan.js';

function facts(
  tag: string,
  className: string,
  attributes: Record<string, string | true | null> = {},
  extra: Partial<ElementFacts> = {}
): ElementFacts {
  return {
    tag,
    tokens: className.split(' ').filter(Boolean),
    attributes: new Map(Object.entries(attributes)),
    hasSpread: false,
    hasRef: false,
    hasChildren: true,
    ...extra,
  };
}

describe('plan', () => {
  it('converts a root with its modifiers and keeps unknown classes', () => {
    expect(
      plan(facts('button', 'button is-primary is-large my-cta')).conversion
    ).toEqual({
      target: 'Button',
      props: [
        ['color', 'primary'],
        ['size', 'large'],
      ],
      className: 'my-cta',
      drop: [],
      numbers: [],
    });
  });

  it('reaches another tag through `as` where the target takes one', () => {
    expect(plan(facts('a', 'button')).conversion).toEqual({
      target: 'Button',
      props: [['as', 'a']],
      className: null,
      drop: [],
      numbers: [],
    });
  });

  it('refuses a tag the target cannot render', () => {
    const result = plan(facts('div', 'section'));
    expect(result.conversion).toBeNull();
    expect(result.todos).toEqual([
      {
        rule: 'tag:Section',
        message: expect.stringContaining('renders only <section>'),
      },
    ]);
  });

  describe('Title and SubTitle', () => {
    it('writes the size on the heading it names', () => {
      expect(plan(facts('h3', 'title is-3')).conversion).toEqual({
        target: 'Title',
        props: [['size', '3']],
        className: null,
        drop: [],
        numbers: [],
      });
    });

    it('keeps a size that would change the heading as a class', () => {
      expect(plan(facts('h2', 'subtitle is-4')).conversion).toEqual({
        target: 'SubTitle',
        props: [['as', 'h2']],
        className: 'is-4',
        drop: [],
        numbers: [],
      });
    });

    it('takes any size on a <p>', () => {
      expect(plan(facts('p', 'title is-5')).conversion).toEqual({
        target: 'Title',
        props: [
          ['as', 'p'],
          ['size', '5'],
        ],
        className: null,
        drop: [],
        numbers: [],
      });
    });
  });

  describe('refusals', () => {
    it('refuses a spread', () => {
      expect(
        plan(facts('div', 'box', {}, { hasSpread: true })).todos[0].rule
      ).toBe('spread:Box');
    });

    it('refuses a ref on a target that does not forward one', () => {
      expect(
        plan(facts('div', 'box', { ref: null }, { hasRef: true })).todos[0].rule
      ).toBe('ref:Box');
    });

    it('keeps a ref on a target that forwards it', () => {
      expect(
        plan(facts('button', 'button', { ref: null }, { hasRef: true }))
          .conversion?.target
      ).toBe('Button');
    });

    it('refuses an attribute the target reads as a prop', () => {
      expect(plan(facts('span', 'tag', { size: 'x' })).todos[0].rule).toBe(
        'attr:size'
      );
      expect(plan(facts('div', 'box', { color: 'red' })).todos[0].rule).toBe(
        'attr:color'
      );
    });

    it('lets through an attribute the target passes to the DOM', () => {
      expect(
        plan(facts('progress', 'progress', { value: '4', max: '9' })).conversion
          ?.target
      ).toBe('Progress');
    });

    it('refuses an element missing attributes the target would add', () => {
      const result = plan(facts('button', 'delete'));
      expect(result.todos[0].rule).toBe('defaults:Delete');
      expect(result.todos[0].message).toContain('`type="button"` and');
      expect(
        plan(facts('button', 'delete', { type: 'button', 'aria-label': 'x' }))
          .conversion?.target
      ).toBe('Delete');
    });

    it('refuses an attribute the target drops on this tag', () => {
      expect(plan(facts('a', 'button', { disabled: true })).todos[0].rule).toBe(
        'drops:Button'
      );
      expect(
        plan(facts('button', 'button', { disabled: true })).conversion?.target
      ).toBe('Button');
    });

    it('keeps a disabled button-styled link as markup, since Bulma styles it', () => {
      const [todo] = plan(facts('a', 'button', { disabled: true })).todos;
      expect(todo.message).toContain('keep this element as markup');
      expect(todo.message).not.toContain('remove it');
      const [inert] = plan(facts('button', 'button', { href: '/x' })).todos;
      expect(inert.message).toContain('remove it, then re-run');
      // Bulma styles no disabled `.card-footer-item`, so there it is inert.
      const [footer] = plan(
        facts('span', 'card-footer-item', { disabled: true })
      ).todos;
      expect(footer.rule).toBe('drops:Card.FooterItem');
      expect(footer.message).toContain('remove it, then re-run');
      // A `name` on an <a> still names a fragment target, so it is not inert.
      const [named] = plan(
        facts('a', 'card-footer-item', { name: 'save' })
      ).todos;
      expect(named.rule).toBe('drops:Card.FooterItem');
      expect(named.message).toContain('keep this element as markup');
      expect(named.message).not.toContain('remove it');
    });

    it('refuses the only child of a component', () => {
      expect(
        plan(facts('a', 'button', {}, { onlyChildOf: 'Link' })).todos
      ).toEqual([
        {
          rule: 'only-child:Button',
          message: expect.stringContaining('only child of `<Link>`'),
        },
      ]);
    });

    it('refuses a tag the target cannot render before anything else', () => {
      // Each would otherwise ask for work (attributes added, renamed or
      // dropped, a child moved) that a re-run then refuses on the tag.
      const cases: Array<
        [
          string,
          string,
          string,
          Record<string, string | true | null>,
          Partial<ElementFacts>,
        ]
      > = [
        ['Navbar', 'div', 'navbar', {}, {}],
        ['Delete', 'a', 'delete', {}, {}],
        ['Breadcrumb', 'div', 'breadcrumb', {}, {}],
        ['Pagination', 'div', 'pagination', {}, {}],
        ['Card.Header.Icon', 'div', 'card-header-icon', {}, {}],
        ['Pagination.Link', 'div', 'pagination-link', {}, {}],
        // Not only a missing default: a prop it reads, or a spread.
        ['Delete', 'a', 'delete', { size: 'x' }, {}],
        ['Delete', 'a', 'delete', {}, { hasSpread: true }],
        ['Navbar', 'div', 'navbar', { role: null }, {}],
      ];
      for (const [target, tag, className, attributes, extra] of cases) {
        const result = plan(facts(tag, className, attributes, extra));
        expect({
          element: `<${tag} class="${className}">`,
          rules: result.todos.map(todo => todo.rule),
        }).toEqual({
          element: `<${tag} class="${className}">`,
          rules: [`tag:${target}`],
        });
      }
      // On the tag it renders, the same element is told what it lacks.
      expect(plan(facts('nav', 'navbar')).todos.map(t => t.rule)).toEqual([
        'defaults:Navbar',
      ]);
      expect(plan(facts('button', 'delete')).todos.map(t => t.rule)).toEqual([
        'defaults:Delete',
      ]);
    });

    it('refuses dangerouslySetInnerHTML', () => {
      expect(
        plan(facts('div', 'content', { dangerouslySetInnerHTML: null })).todos
      ).toEqual([
        {
          rule: 'attr:dangerouslySetInnerHTML',
          message: expect.stringContaining('keep this element as markup'),
        },
      ]);
    });
  });

  describe('helper classes', () => {
    it('uses the text-color prop the target renders it through', () => {
      expect(plan(facts('div', 'box has-text-info')).conversion?.props).toEqual(
        [['textColor', 'info']]
      );
      expect(
        plan(facts('table', 'table has-text-info')).conversion?.props
      ).toEqual([['color', 'info']]);
    });

    it('keeps a text color the target has no prop for', () => {
      expect(plan(facts('span', 'tag has-text-info')).conversion).toEqual({
        target: 'Tag',
        props: [],
        className: 'has-text-info',
        drop: [],
        numbers: [],
      });
    });

    it('keeps a base display beside a per-viewport one', () => {
      expect(
        plan(facts('div', 'box is-flex is-block-mobile')).conversion
      ).toEqual({
        target: 'Box',
        props: [['displayMobile', 'block']],
        className: 'is-flex',
        drop: [],
        numbers: [],
      });
    });

    it('keeps flex-container classes without a flex display', () => {
      expect(
        plan(facts('div', 'box is-justify-content-center')).conversion
          ?.className
      ).toBe('is-justify-content-center');
      expect(
        plan(facts('div', 'box is-flex is-justify-content-center')).conversion
          ?.props
      ).toEqual([
        ['display', 'flex'],
        ['justifyContent', 'center'],
      ]);
    });

    it('writes a prop once and keeps the second class', () => {
      expect(
        plan(facts('button', 'button is-small is-large')).conversion
      ).toEqual({
        target: 'Button',
        props: [['size', 'small']],
        className: 'is-large',
        drop: [],
        numbers: [],
      });
    });

    it('prefers the root modifier over the helper of the same name', () => {
      expect(plan(facts('div', 'columns is-mobile')).conversion?.props).toEqual(
        [['isMobile', true]]
      );
    });

    it('converts the gap, position, overflow, radius and aspect-ratio helpers', () => {
      expect(
        plan(
          facts(
            'div',
            'box is-flex is-gap-1.5 is-row-gap-3 is-position-sticky is-overflow-y-auto has-radius-large is-aspect-ratio-16by9'
          )
        ).conversion
      ).toEqual({
        target: 'Box',
        props: [
          ['display', 'flex'],
          ['gap', '1.5'],
          ['rowGap', '3'],
          ['pos', 'sticky'],
          ['overflowY', 'auto'],
          ['radius', 'large'],
          ['aspectRatio', '16by9'],
        ],
        className: null,
        drop: [],
        numbers: [],
      });
      expect(
        plan(facts('p', 'is-gapless is-overflow-x-clip')).conversion?.props
      ).toEqual([
        ['gapless', true],
        ['overflowX', 'clip'],
      ]);
    });

    it('keeps is-gapless beside a gap, which bestax renders in its place', () => {
      expect(
        plan(facts('div', 'box is-gapless is-gap-2 is-column-gap-1')).conversion
      ).toEqual({
        target: 'Box',
        props: [
          ['gap', '2'],
          ['columnGap', '1'],
        ],
        className: 'is-gapless',
        drop: [],
        numbers: [],
      });
      // Grid's own gap renders its class itself, beside the gapless helper.
      expect(
        plan(facts('div', 'grid is-gap-2 is-gapless')).conversion?.props
      ).toEqual([
        ['gap', '2'],
        ['gapless', true],
      ]);
    });

    it('keeps is-relative beside a position, which bestax renders in its place', () => {
      expect(
        plan(facts('div', 'box is-relative is-position-absolute is-overlay'))
          .conversion
      ).toEqual({
        target: 'Box',
        props: [
          ['pos', 'absolute'],
          ['overlay', true],
        ],
        className: 'is-relative',
        drop: [],
        numbers: [],
      });
    });

    it('keeps a both-axes overflow beside an axis one, which bestax writes per axis', () => {
      expect(
        plan(facts('div', 'box is-overflow-hidden is-overflow-y-auto'))
          .conversion
      ).toEqual({
        target: 'Box',
        props: [['overflowY', 'auto']],
        className: 'is-overflow-hidden',
        drop: [],
        numbers: [],
      });
      expect(
        plan(facts('div', 'box is-overflow-x-scroll is-clipped')).conversion
      ).toEqual({
        target: 'Box',
        props: [['overflowX', 'scroll']],
        className: 'is-clipped',
        drop: [],
        numbers: [],
      });
    });

    it('keeps the gap helpers on Columns, whose own gap is its gutter', () => {
      expect(
        plan(
          facts(
            'div',
            'columns is-gap-2 is-column-gap-1 is-row-gap-1 is-gapless is-3'
          )
        ).conversion
      ).toEqual({
        target: 'Columns',
        props: [
          ['isGapless', true],
          ['gap', '3'],
        ],
        className: 'is-gap-2 is-column-gap-1 is-row-gap-1',
        drop: [],
        numbers: [],
      });
    });
  });

  describe('wrappers', () => {
    it('wraps a plain tag that carries a helper class', () => {
      expect(
        plan(facts('p', 'has-text-centered mt-4 intro')).conversion
      ).toEqual({
        target: 'Paragraph',
        props: [
          ['textAlign', 'centered'],
          ['mt', '4'],
        ],
        className: 'intro',
        drop: [],
        numbers: [],
      });
    });

    it('leaves a tag with no wrapper, or no helper class, alone', () => {
      expect(plan(facts('div', 'mt-4')).conversion).toBeNull();
      expect(plan(facts('p', 'intro')).conversion).toBeNull();
      // With no TODO either, whatever else it carries: it was never going
      // to become the wrapper.
      for (const attributes of [{ tabIndex: '00' }, { children: null }]) {
        expect(plan(facts('p', 'intro', attributes))).toEqual({
          conversion: null,
          todos: [],
        });
      }
      expect(plan(facts('p', 'intro', {}, { hasSpread: true }))).toEqual({
        conversion: null,
        todos: [],
      });
      // Nor one whose helper class the wrapper would drop: a flex-container
      // helper with no flex `display` stays a class.
      expect(
        plan(facts('p', 'is-justify-content-center', { tabIndex: '00' }))
      ).toEqual({ conversion: null, todos: [] });
    });

    it('leaves markup with a root it does not convert alone', () => {
      expect(plan(facts('p', 'help is-danger mt-1'))).toEqual({
        conversion: null,
        todos: [],
      });
    });

    it('keeps a helper with no prop as a class, and still converts the element', () => {
      // `marginless` has `m-0`'s rule, and bestax renders that as `m-0`.
      for (const helper of ['marginless', 'paddingless']) {
        expect(plan(facts('p', `has-text-centered ${helper}`))).toEqual({
          conversion: {
            target: 'Paragraph',
            props: [['textAlign', 'centered']],
            className: helper,
            drop: [],
            numbers: [],
          },
          todos: [],
        });
        expect(plan(facts('p', helper))).toEqual({
          conversion: null,
          todos: [],
        });
      }
    });
  });

  describe('a Bulma 0.9 helper v1 removed', () => {
    it('converts as the v1 helper that replaced it, with nothing left to say', () => {
      expect(plan(facts('p', 'is-marginless intro'))).toEqual({
        conversion: {
          target: 'Paragraph',
          props: [['m', '0']],
          className: 'intro',
          drop: [],
          numbers: [],
        },
        todos: [],
      });
      expect(plan(facts('div', 'hero-body is-paddingless'))).toEqual({
        conversion: {
          target: 'Hero.Body',
          props: [['p', '0']],
          className: null,
          drop: [],
          numbers: [],
        },
        todos: [],
      });
    });

    it('leaves the prop to a live class for it, in either order, and stays with its TODO', () => {
      const legacy = (token: string) => ({
        rule: `legacy:${token}`,
        message: expect.stringContaining('Bulma v1 removed'),
      });
      for (const [removed, live, prop, value] of [
        ['is-paddingless', 'p-2', 'p', '2'],
        ['is-marginless', 'm-0', 'm', '0'],
      ]) {
        for (const order of [
          `box ${removed} ${live}`,
          `box ${live} ${removed}`,
        ]) {
          expect({ order, plan: plan(facts('div', order)) }).toEqual({
            order,
            plan: {
              conversion: {
                target: 'Box',
                props: [[prop, value]],
                className: removed,
                drop: [],
                numbers: [],
              },
              todos: [legacy(removed)],
            },
          });
        }
      }
    });

    it('converts beside a class for another prop, such as an axis, in either order', () => {
      // `px-2` and `p-0` both render: v1 puts `px-2` after `p-0`, so the
      // axis keeps its sides.
      for (const order of ['px-2 is-paddingless', 'is-paddingless px-2']) {
        expect({ order, plan: plan(facts('p', order)) }).toEqual({
          order,
          plan: {
            conversion: {
              target: 'Paragraph',
              props: [
                ['px', '2'],
                ['p', '0'],
              ],
              className: null,
              drop: [],
              numbers: [],
            },
            todos: [],
          },
        });
      }
    });

    it('says what replaced it wherever it stays a class', () => {
      const legacy = (token: string) => ({
        rule: `legacy:${token}`,
        message: expect.stringContaining('Bulma v1 removed'),
      });
      // No component for the tag.
      expect(plan(facts('div', 'is-marginless'))).toEqual({
        conversion: null,
        todos: [legacy('is-marginless')],
      });
      // A prop another class already wrote.
      expect(plan(facts('div', 'box p-2 is-paddingless'))).toEqual({
        conversion: {
          target: 'Box',
          props: [['p', '2']],
          className: 'is-paddingless',
          drop: [],
          numbers: [],
        },
        todos: [legacy('is-paddingless')],
      });
      // A family left as markup, and an element that refuses.
      expect(plan(facts('div', 'message is-marginless')).todos).toEqual([
        { rule: 'family:message', message: expect.any(String) },
        legacy('is-marginless'),
      ]);
      expect(
        plan(facts('div', 'box is-marginless', {}, { hasSpread: true })).todos
      ).toEqual([
        { rule: 'spread:Box', message: expect.any(String) },
        legacy('is-marginless'),
      ]);
      // Added under a condition, which stays in the call.
      const conditional = plan({
        ...facts('div', 'box'),
        conditional: [['is-marginless']],
      });
      expect(conditional.conversion?.target).toBe('Box');
      expect(conditional.todos).toEqual([legacy('is-marginless')]);
      expect(plan(facts('div', 'is-marginless')).todos[0].message).toContain(
        '`m="0"`'
      );
    });
  });

  describe('an `.image` modifier away from its `.image`', () => {
    const stray = {
      rule: 'modifier:image',
      message: expect.stringContaining('styles nothing'),
    };

    it('flags the size or ratio, which styles nothing there', () => {
      expect(plan(facts('figure', 'is-64x64'))).toEqual({
        conversion: null,
        todos: [stray],
      });
      // The element still converts on what it does carry.
      expect(plan(facts('figure', 'is-4by3 mx-auto'))).toEqual({
        conversion: {
          target: 'Figure',
          props: [['mx', 'auto']],
          className: 'is-4by3',
          drop: [],
          numbers: [],
        },
        todos: [stray],
      });
      expect(plan(facts('div', 'card-image is-square')).todos).toEqual([stray]);
      expect(plan(facts('figure', 'is-64x64')).todos[0].message).toContain(
        'add `image`, which bestax `Image` renders, then re-run'
      );
    });

    it('promises a re-run only on a tag `Image` renders', () => {
      for (const tag of ['div', 'figure', 'p']) {
        expect({
          tag,
          message: plan(facts(tag, 'is-64x64')).todos[0].message,
        }).toEqual({ tag, message: expect.stringContaining('then re-run') });
      }
      for (const tag of ['span', 'a', 'img']) {
        const [todo] = plan(facts(tag, 'is-64x64')).todos;
        expect({ tag, rule: todo.rule }).toEqual({
          tag,
          rule: 'modifier:image',
        });
        expect(todo.message).toContain(
          `bestax \`Image\` renders <div>, <figure>, <p>, not ${tag === 'span' ? 'a' : 'an'} <${tag}>, so the element stays markup`
        );
        expect(todo.message).not.toContain('re-run');
        // Following it: the element is then refused on its tag, as said.
        expect(
          plan(facts(tag, 'image is-64x64')).todos.map(found => found.rule)
        ).toEqual(['tag:Image']);
      }
    });

    it("claims nothing of a className it doesn't read whole", () => {
      // A variable or a call may carry `.image`, and the remedy drops a class.
      expect(
        plan(facts('figure', 'is-64x64', {}, { unreadClasses: true })).todos
      ).toEqual([]);
      expect(
        plan(facts('figure', 'is-4by3 mx-auto', {}, { unreadClasses: true }))
          .todos
      ).toEqual([]);
    });

    it('says nothing on an `.image`, or of a class for the element inside one', () => {
      expect(
        plan(facts('figure', 'image is-64x64', {}, { hasChildren: false }))
          .todos
      ).toEqual([{ rule: 'children:Image', message: expect.any(String) }]);
      expect(
        plan({ ...facts('figure', 'is-16by9'), conditional: [['image']] }).todos
      ).toEqual([]);
      expect(plan(facts('iframe', 'has-ratio')).todos).toEqual([]);
      // A page's own size, which Bulma has no rule for at all.
      expect(plan(facts('figure', 'is-256x256')).todos).toEqual([]);
    });
  });

  describe('roots', () => {
    it('picks the layout root when there are two', () => {
      expect(plan(facts('div', 'box column is-4')).conversion).toEqual({
        target: 'Column',
        props: [['size', '4']],
        className: 'box',
        drop: [],
        numbers: [],
      });
    });

    it('says the other root stays a class, which one won and why', () => {
      expect(plan(facts('div', 'columns box')).todos).toEqual([
        {
          rule: 'second-component:Box',
          message:
            "`.box` is bestax `Box`'s class too, and an element converts to one component: `Columns` here, since the codemod ranks `.columns` first, putting layout and parts ahead of surfaces, so `.box` stays in its `className`, which renders the same; to use `Box`, give it an element of its own around or inside this one and drop the class, then check the layout, since two elements space differently from one",
        },
      ]);
      // One for each, and for one a condition adds, which stays in the call.
      expect(
        plan({ ...facts('div', 'columns content box'), conditional: [['box']] })
          .todos
      ).toEqual([
        { rule: 'second-component:Content', message: expect.any(String) },
        { rule: 'second-component:Box', message: expect.any(String) },
      ]);
      // A root a condition adds was never in the running, whatever its rank
      // or place: the planner picks from the classes the element always has.
      expect(
        plan({ ...facts('div', 'box'), conditional: [['columns']] }).todos
      ).toEqual([
        {
          rule: 'second-component:Columns',
          message: expect.stringContaining(
            '`Box` here, since `.columns` is there only when its condition holds, and the codemod picks from the classes the element always carries'
          ),
        },
      ]);
      // Between two roots the table doesn't rank, the first on the element.
      const both = plan(facts('p', 'panel-heading menu-label'));
      expect(both.conversion?.target).toBe('Panel.Heading');
      expect(both.todos).toEqual([
        {
          rule: 'second-component:Menu.Label',
          message: expect.stringContaining(
            'since `.panel-heading` comes first on the element'
          ),
        },
      ]);
    });

    it('picks a root whose target renders the tag over one ranked ahead of it', () => {
      // Around an element written out, which Image renders as given.
      const inside = {
        tag: 'iframe',
        attributes: new Map(),
        hasSpread: false,
        isEmpty: true,
      };
      const result = plan(
        facts('figure', 'image is-128x128 container', {}, { soleChild: inside })
      );
      expect(result.conversion).toEqual({
        target: 'Image',
        props: [
          ['as', 'figure'],
          ['size', '128x128'],
        ],
        className: 'container',
        drop: [],
        numbers: [],
      });
      // `.container` gets its own advice: on a sized image it centers it.
      expect(result.todos).toEqual([
        {
          rule: 'second-component:Container',
          message: expect.stringContaining(
            '`Image` here, since `Container` renders <div>, <main>, <section>, <article>, <aside>, <header>, <footer>, <nav>, not a <figure>, so `.container` stays in its `className`, which renders the same; where it is only there to center this element, `mx="auto"` centers it, and otherwise wrap the element in a `Container`'
          ),
        },
      ]);
      // On a tag both render, the table's ranking decides as before.
      expect(
        plan(
          facts('div', 'image is-128x128 container', {}, { soleChild: inside })
        ).conversion?.target
      ).toBe('Container');
    });

    it('picks the root whose own tag it is over one that reaches it through `as`', () => {
      // `Container` reaches a <section> through `as`, and it is `Hero`'s own.
      const hero = plan(facts('section', 'container hero is-primary'));
      expect(hero.conversion).toMatchObject({
        target: 'Hero',
        props: [['color', 'primary']],
        className: 'container',
      });
      expect(hero.todos).toEqual([
        {
          rule: 'second-component:Container',
          message: expect.stringContaining(
            "`Hero` here, since a <section> is `Hero`'s own element, and `Container` renders one only through `as`"
          ),
        },
      ]);
      // The other way round on a <div>, `Container`'s own.
      const div = plan(facts('div', 'hero container'));
      expect(div.conversion).toMatchObject({
        target: 'Container',
        className: 'hero',
      });
      expect(div.todos).toEqual([
        {
          rule: 'second-component:Hero',
          message: expect.stringContaining(
            "since a <div> is `Container`'s own element, and `Hero` renders one only through `as`"
          ),
        },
      ]);
      // Two that reach it only through `as`: the table's ranking.
      expect(plan(facts('main', 'hero container')).conversion).toMatchObject({
        target: 'Container',
        props: [['as', 'main']],
      });
    });

    it('takes no class of a glyph inside an `.icon` for a second root', () => {
      const glyph = {
        tag: 'i',
        tokens: ['fas', 'fa-home'],
        attributes: new Map([['aria-hidden', 'true']]),
        hasSpread: false,
        isEmpty: true,
      };
      const result = plan(facts('span', 'icon', {}, { soleChild: glyph }));
      expect(result.conversion?.target).toBe('Icon');
      expect(
        result.todos.filter(todo => todo.rule.startsWith('second-component'))
      ).toEqual([]);
    });

    it('leaves the second root to a refusal when none renders the tag', () => {
      expect(plan(facts('span', 'container box')).todos).toEqual([
        { rule: 'tag:Container', message: expect.any(String) },
      ]);
    });

    it('flags the outermost class of a family it does not convert', () => {
      expect(plan(facts('div', 'dropdown'))).toEqual({
        conversion: null,
        todos: [{ rule: 'family:dropdown', message: expect.any(String) }],
      });
      expect(plan(facts('div', 'dropdown-menu'))).toEqual({
        conversion: null,
        todos: [],
      });
    });

    it('flags a Bulma 0.9 class v1 removed', () => {
      expect(plan(facts('div', 'tile is-ancestor')).todos).toEqual([
        { rule: 'legacy:tile', message: expect.stringContaining('Grid') },
      ]);
    });

    it('keeps a family beside a root it converts as markup, and flags it', () => {
      expect(plan(facts('div', 'dropdown box'))).toEqual({
        conversion: null,
        todos: [{ rule: 'family:dropdown', message: expect.any(String) }],
      });
    });

    it('reads no class as an inherited Object member', () => {
      for (const token of ['toString', 'constructor', '__proto__']) {
        expect(plan(facts('div', token))).toEqual({
          conversion: null,
          todos: [],
        });
        expect(plan(facts('div', `box ${token}`)).conversion).toEqual({
          target: 'Box',
          props: [],
          className: token,
          drop: [],
          numbers: [],
        });
      }
      expect(plan(facts('hasOwnProperty', 'has-text-centered'))).toEqual({
        conversion: null,
        todos: [],
      });
    });
  });

  describe('a component that wraps its children', () => {
    const card = (childTargets: string[], hasChildren = true) =>
      plan(facts('div', 'card', {}, { childTargets, hasChildren }));

    it('converts beside a child that is one of its parts', () => {
      expect(card(['Card.Content']).conversion?.target).toBe('Card');
      expect(card(['Box', 'Card.Footer']).conversion?.target).toBe('Card');
    });

    it('refuses when no child is one, and says which would do', () => {
      for (const children of [[], ['Box'], ['Card.Header.Title']]) {
        expect(card(children)).toEqual({
          conversion: null,
          todos: [
            {
              rule: 'children:Card',
              message: expect.stringContaining(
                '`.card-content` of its own unless one of them is a `Card.Header`,'
              ),
            },
          ],
        });
      }
    });

    it('converts with no children, where Card renders none of its own', () => {
      expect(card([], false).conversion?.target).toBe('Card');
    });

    it('holds Card.Header to a title even when it is empty', () => {
      const header = (childTargets: string[], hasChildren = true) =>
        plan(facts('header', 'card-header', {}, { childTargets, hasChildren }));
      expect(header(['Card.Header.Title']).conversion?.target).toBe(
        'Card.Header'
      );
      expect(header(['Card.Header.Icon']).todos).toEqual([
        {
          rule: 'children:Card.Header',
          message: expect.stringContaining(
            'unless one of them is a `Card.Header.Title`,'
          ),
        },
      ]);
      expect(header([], false).todos.map(todo => todo.rule)).toEqual([
        'children:Card.Header',
      ]);
    });

    it('converts the parts on their own', () => {
      expect(
        plan(facts('p', 'card-header-title is-centered')).conversion?.props
      ).toEqual([
        ['as', 'p'],
        ['centered', true],
      ]);
      expect(
        plan(facts('span', 'card-header-title')).todos.map(todo => todo.rule)
      ).toEqual(['tag:Card.Header.Title']);
      expect(
        plan(facts('div', 'card-header-title is-centered')).conversion
      ).toEqual({
        target: 'Card.Header.Title',
        props: [['centered', true]],
        className: null,
        drop: [],
        numbers: [],
      });
      expect(
        plan(facts('button', 'card-header-icon')).todos.map(todo => todo.rule)
      ).toEqual(['defaults:Card.Header.Icon']);
      expect(
        plan(facts('a', 'card-footer-item', { href: '#' })).conversion?.props
      ).toEqual([['as', 'a']]);
      expect(
        plan(facts('div', 'card-footer-item')).todos.map(todo => todo.rule)
      ).toEqual(['tag:Card.FooterItem']);
    });

    it('converts a footer item button only with a type it keeps', () => {
      const button = (attributes: Record<string, string | true | null>) =>
        plan(facts('button', 'card-footer-item', attributes));
      for (const type of ['button', 'submit', 'reset']) {
        expect(button({ type }).conversion?.props).toEqual([['as', 'button']]);
      }
      expect(button({}).todos.map(todo => todo.rule)).toEqual([
        'defaults:Card.FooterItem',
      ]);
      for (const type of ['text/html', null]) {
        expect(button({ type }).todos.map(todo => todo.rule)).toEqual([
          'attr:type',
        ]);
      }
      // Only a <button> gets one: a <span> or an <a> converts with none.
      expect(plan(facts('span', 'card-footer-item')).todos).toEqual([]);
    });
  });

  describe('Navbar', () => {
    const bulmaNav = { role: 'navigation', 'aria-label': 'main navigation' };

    it("converts a navbar that carries Bulma's role and label", () => {
      expect(
        plan(
          facts('nav', 'navbar is-primary is-fixed-top has-shadow', bulmaNav)
        ).conversion
      ).toEqual({
        target: 'Navbar',
        props: [
          ['color', 'primary'],
          ['fixed', 'top'],
          ['hasShadow', true],
        ],
        className: null,
        drop: [],
        numbers: [],
      });
      expect(plan(facts('nav', 'navbar')).todos.map(todo => todo.rule)).toEqual(
        ['defaults:Navbar']
      );
    });

    it('writes is-spaced and has-shadow as their flags, under a condition too', () => {
      expect(
        plan(
          facts('nav', 'navbar is-transparent is-spaced has-shadow', bulmaNav)
        ).conversion?.props
      ).toEqual([
        ['transparent', true],
        ['isSpaced', true],
        ['hasShadow', true],
      ]);
      const { conversion } = plan(
        facts('nav', 'navbar', bulmaNav, {
          conditional: [['is-spaced'], ['has-shadow']],
        })
      );
      expect(conversion?.conditional).toEqual([
        ['isSpaced', 'is-spaced'],
        ['hasShadow', 'has-shadow'],
      ]);
    });

    it('keeps helper classes on a part that takes no helper props', () => {
      expect(
        plan(facts('div', 'navbar-dropdown is-right mt-2')).conversion
      ).toEqual({
        target: 'Navbar.DropdownMenu',
        props: [['right', true]],
        className: 'mt-2',
        drop: [],
        numbers: [],
      });
    });

    it('converts a divider, keeping its other classes in className', () => {
      expect(plan(facts('hr', 'navbar-divider')).conversion?.target).toBe(
        'Navbar.Divider'
      );
      const { conversion, todos } = plan(facts('hr', 'navbar-divider mt-2'));
      expect(todos).toEqual([]);
      expect(conversion?.props).toEqual([]);
      expect(conversion?.className).toBe('mt-2');
    });

    it('writes a text color on the navbar areas as textColor', () => {
      for (const [root, target] of [
        ['navbar-menu', 'Navbar.Menu'],
        ['navbar-start', 'Navbar.Start'],
        ['navbar-end', 'Navbar.End'],
      ]) {
        const { conversion } = plan(facts('div', `${root} has-text-white`));
        expect(conversion?.target).toBe(target);
        expect(conversion?.props).toContainEqual(['textColor', 'white']);
        expect(conversion?.className).toBeNull();
      }
    });

    it('leaves the burger and the dropdown trigger to a person', () => {
      expect(plan(facts('a', 'navbar-burger')).todos.map(t => t.rule)).toEqual([
        'family:navbar-burger',
      ]);
      expect(plan(facts('a', 'navbar-link')).todos.map(t => t.rule)).toEqual([
        'family:navbar-link',
      ]);
    });
  });

  describe('Tabs and Icon', () => {
    it('converts .tabs, unless it already holds something that reads its context', () => {
      expect(plan(facts('div', 'tabs is-boxed')).conversion).toMatchObject({
        target: 'Tabs',
        props: [['boxed', true]],
      });
      // Each spelling of each reader: the panel is `Tabs.Content.Item`,
      // `TabsContent.Item` and `TabContentItem`.
      for (const inside of [
        'Tabs.Tab',
        'Tab',
        'Tabs.Content',
        'TabsContent',
        'Tabs.Content.Item',
        'TabsContent.Item',
        'TabContentItem',
      ]) {
        expect(
          plan(facts('div', 'tabs', {}, { bestaxInside: [inside] })).todos.map(
            todo => todo.rule
          )
        ).toEqual(['context:Tabs']);
      }
      // Other bestax components inside don't read it.
      expect(
        plan(facts('div', 'tabs', {}, { bestaxInside: ['Icon', 'Tag'] }))
          .conversion?.target
      ).toBe('Tabs');
    });

    it('converts .icon only around element children, hidden as Icon hides it', () => {
      const i = {
        tag: 'i',
        attributes: new Map(),
        hasSpread: false,
        isEmpty: true,
      };
      expect(
        plan(facts('span', 'icon', { 'aria-hidden': 'true' }, { soleChild: i }))
          .conversion?.target
      ).toBe('Icon');
      const bare = plan(facts('span', 'icon', {}, { soleChild: i }));
      expect(bare.todos.map(t => t.rule)).toEqual(['defaults:Icon']);
      expect(bare.todos[0].message).toMatch(
        /renders `aria-hidden="true"` when the element does not set it/
      );
      // `{show && <i />}`: Icon would switch to its `name` path when empty.
      expect(
        plan(facts('span', 'icon', { 'aria-hidden': 'true' })).todos.map(
          t => t.rule
        )
      ).toEqual(['children:Icon']);
    });

    describe('.icon around a glyph', () => {
      const glyph = (
        tokens: string[],
        attributes: Record<string, string> = {}
      ) => ({
        tag: 'i',
        tokens,
        attributes: new Map(Object.entries(attributes)),
        hasSpread: false,
        isEmpty: true,
      });
      const hidden = { 'aria-hidden': 'true' };

      it('writes the glyph it reads as props, in place of the <i>', () => {
        expect(
          plan(
            facts('span', 'icon is-small is-left', hidden, {
              soleChild: glyph(['fab', 'fa-github', 'fa-lg']),
            })
          ).conversion
        ).toEqual({
          target: 'Icon',
          props: [['size', 'small']],
          className: 'is-left',
          drop: [],
          numbers: [],
          rendersChildren: true,
          glyph: {
            library: 'fa',
            name: 'github',
            variant: 'brands',
            features: ['fa-lg'],
          },
        });
        // Font Awesome 4's `fa` reads as itself, which `Icon` renders as
        // written.
        expect(
          plan(
            facts('span', 'icon', hidden, {
              soleChild: glyph(['fa', 'fa-envelope']),
            })
          ).conversion?.glyph
        ).toEqual({ library: 'fa', name: 'envelope', variant: 'fa' });
      });

      it('keeps an <i> it reads no glyph from as its child', () => {
        const kept = plan(
          facts('span', 'icon', hidden, {
            soleChild: glyph(['fas', 'fa-home'], { id: 'x' }),
          })
        ).conversion;
        expect(kept?.target).toBe('Icon');
        expect(kept?.glyph).toBeUndefined();
        expect(kept?.rendersChildren).toBeUndefined();
      });

      describe('the TODO an unhidden one gets', () => {
        const todo = (
          className: string,
          inner: ReturnType<typeof glyph>,
          extra: Partial<ElementFacts> = {},
          attributes: Record<string, string> = {}
        ) => {
          const { todos } = plan(
            facts('span', className, attributes, { soleChild: inner, ...extra })
          );
          expect(todos.map(t => t.rule)).toEqual(['defaults:Icon']);
          return todos[0].message;
        };
        const control = { parentTokens: ['control', 'has-icons-left'] };

        it("moves up the aria-hidden Font Awesome's own markup puts on a bare <i>", () => {
          const fa = glyph(['fa-solid', 'fa-envelope'], hidden);
          const moved = plan(
            facts(
              'span',
              'icon is-medium is-left',
              {},
              {
                soleChild: fa,
                ...control,
              }
            )
          );
          expect(moved).toEqual({
            conversion: {
              target: 'Icon',
              props: [['size', 'medium']],
              className: 'is-left',
              drop: [],
              numbers: [],
              rendersChildren: true,
              glyph: { library: 'fa', name: 'envelope', variant: 'fa-solid' },
              movesHidden: true,
            },
            todos: [],
          });
          // So does JSX's own spelling of it.
          expect(
            plan(
              facts(
                'span',
                'icon',
                {},
                {
                  soleChild: {
                    ...fa,
                    attributes: new Map([['aria-hidden', true]]),
                  },
                }
              )
            ).conversion?.movesHidden
          ).toBe(true);
        });

        it('keeps it off a .icon that carries anything assistive tech reads, in any spelling', () => {
          const fa = glyph(['fas', 'fa-home'], hidden);
          // Written out, a tabIndex keeps Icon from hiding anything, so the
          // <i> stays its child, hidden itself, and nothing moves.
          const kept = plan(
            facts('span', 'icon', { tabIndex: '0' }, { soleChild: fa })
          ).conversion;
          expect(kept?.target).toBe('Icon');
          expect(kept?.movesHidden).toBeUndefined();
          expect(kept?.glyph).toBeUndefined();
          const { todos } = plan(
            facts('span', 'icon', { tabIndex: null }, { soleChild: fa })
          );
          expect(todos).toEqual([
            {
              rule: 'defaults:Icon',
              message:
                'bestax `Icon` takes Font Awesome\'s `aria-hidden` up off a bare <i> like this one only onto a `.icon` that carries nothing assistive tech reads, and this one carries `tabIndex`, which the move would hide, or, beside a `role` or `tabIndex`, leave with no `aria-hidden` at all; if the icon means something, give the `.icon` an `aria-label` and `role="img"`, and if it is decoration, drop `tabIndex`, then re-run',
            },
          ]);
          for (const attributes of [
            { role: null },
            { title: 'Home' },
            { 'aria-describedby': 'tip' },
            { 'aria-description': 'Home' },
          ]) {
            const [name] = Object.keys(attributes);
            const result = plan(
              facts('span', 'icon', attributes, { soleChild: fa })
            );
            expect(result.conversion).toBeNull();
            expect(result.todos[0].message).toContain(
              `this one carries \`${name}\``
            );
          }
          // What it doesn't read rides along.
          expect(
            plan(
              facts(
                'span',
                'icon',
                { id: 'x', 'data-test': 'y', style: null },
                {
                  soleChild: fa,
                }
              )
            ).conversion?.movesHidden
          ).toBe(true);
        });

        it('gives no advice on a tag Icon cannot render, only the tag', () => {
          // Each would ask for work a re-run then refuses on the tag.
          const tagOnly = (
            label: string,
            inner: ReturnType<typeof glyph>,
            extra: Partial<ElementFacts> = {},
            attributes: Record<string, string | null> = {}
          ) => {
            const result = plan(
              facts('div', 'icon', attributes, { soleChild: inner, ...extra })
            );
            expect({
              label,
              conversion: result.conversion,
              rules: result.todos.map(t => t.rule),
            }).toEqual({ label, conversion: null, rules: ['tag:Icon'] });
          };
          const fa = glyph(['fab', 'fa-github', 'fa-lg']);
          tagOnly('an unhidden glyph', fa);
          tagOnly('in a named link', fa, {
            clickableAround: { tag: 'a', label: 'aria-label' },
          });
          tagOnly('in an icon-only link', fa, {
            clickableAround: { tag: 'a', label: 'none' },
          });
          tagOnly('in a .control with icons', glyph(['fas', 'fa-envelope']), {
            parentTokens: ['control', 'has-icons-left'],
          });
          tagOnly(
            "Font Awesome's own hidden <i>",
            glyph(['fas', 'fa-home'], hidden)
          );
          tagOnly(
            'a hidden <i> beside a title',
            glyph(['fas', 'fa-home'], hidden),
            {},
            { title: 'Home' }
          );
          tagOnly('a name as an expression', fa, {}, { 'aria-label': null });
          // On the <span> it renders, the same element gets the advice.
          expect(
            plan(
              facts(
                'span',
                'icon',
                {},
                {
                  soleChild: fa,
                  clickableAround: { tag: 'a', label: 'none' },
                }
              )
            ).todos[0].message
          ).toMatch(/^nothing names the <a> around this `\.icon`/);
        });

        it('says to move it up by hand off any other <i>', () => {
          // One that carries more stays the icon's child, so no glyph is
          // promised.
          expect(
            todo('icon', glyph(['fas', 'fa-moon'], { ...hidden, id: 'x' }))
          ).toBe(
            'bestax `Icon` writes `aria-hidden="true"` on the `.icon`, and takes it from the <i> inside only when that <i> is empty, carries nothing else and names a glyph it renders from props, which this one doesn\'t; the `.icon` holds nothing else, so the attribute hides the same glyph there: move it up onto the `.icon`, then re-run'
          );
          expect(todo('icon', glyph(['material-icons'], hidden))).toMatch(
            /which this one doesn't; .* move it up onto the `\.icon`/
          );
        });

        it('names Control’s prop only for a bare icon on the side its .control has icons', () => {
          const fa = glyph(['fas', 'fa-check']);
          expect(
            todo('icon is-small is-right', fa, {
              parentTokens: ['control', 'has-icons-right'],
            })
          ).toMatch(
            /give that `Control` `iconRight=\{\{ library: "fa", name: "check", size: "small" \}\}`/
          );
          // Its flags and features, as an object holds them.
          expect(
            todo(
              'icon is-left is-clearfix',
              glyph(['fas', 'fa-spinner', 'fa-spin', 'fa-fw']),
              control
            )
          ).toMatch(
            /`Icon` with `library="fa" name="spinner" features=\{\["fa-spin", "fa-fw"\]\}`; .*`iconLeft=\{\{ library: "fa", name: "spinner", features: \["fa-spin", "fa-fw"\], clearfix: true \}\}`/
          );
          const none = [
            todo('icon is-left', fa, {
              parentTokens: ['control', 'has-icons-right'],
            }),
            todo('icon is-left', fa, { parentTokens: ['has-icons-left'] }),
            todo('icon is-left', fa),
            todo('icon is-left my-icon', fa, control),
            todo('icon is-left', fa, control, { id: 'x' }),
            todo('icon', fa, { ...control, conditional: [['is-left']] }),
          ];
          for (const message of none) expect(message).not.toMatch(/Control/);
        });

        it("points Font Awesome's script-drawn <svg> at the <i> it was drawn from", () => {
          const svg = {
            tag: 'svg',
            tokens: ['svg-inline--fa', 'fa-search', 'fa-w-16'],
            attributes: new Map([
              ['aria-hidden', 'true'],
              ['data-prefix', 'fa'],
              ['data-icon', 'search'],
            ]),
            hasSpread: false,
            isEmpty: false,
          };
          expect(todo('icon is-small is-left', svg, control)).toBe(
            'this `.icon` holds the <svg> Font Awesome\'s script draws in place of an <i>, and bestax `Icon` writes `aria-hidden="true"` on the `.icon`, which this one doesn\'t carry; add it, then re-run, and this converts to `Icon` around the <svg> as it is; or write `Icon` with `library="fa" name="search" variant="fa"` in its place, which renders the <i> the script draws from, and shows only where Font Awesome\'s stylesheet or script is loaded; or, since the `.control` around it has `has-icons-left`, drop this `.icon` and give that `Control` `iconLeft={{ library: "fa", name: "search", variant: "fa", size: "small" }}`, which it renders after its children as a `.icon.is-left` around the glyph\'s <i>, hidden the way `Icon` hides it'
          );
        });

        it('calls an icon in a link or button its label names decoration', () => {
          const fa = glyph(['fab', 'fa-github', 'fa-lg']);
          expect(
            todo('icon', fa, {
              clickableAround: { tag: 'a', label: 'aria-label' },
            })
          ).toBe(
            'this `.icon` sits in an <a> that its `aria-label` names, so the icon is decoration there, and bestax `Icon` writes `aria-hidden="true"` on an icon with no name of its own, which this one doesn\'t carry; add it, then re-run, and this converts to `Icon` with `library="fa" name="github" variant="brands" features="fa-lg"`'
          );
          expect(
            todo('icon', fa, {
              clickableAround: { tag: 'button', label: 'text' },
            })
          ).toMatch(
            /^this `\.icon` sits in a <button> that its own text names/
          );
          expect(
            todo('icon', fa, {
              clickableAround: { tag: 'a', label: 'aria-labelledby' },
            })
          ).toMatch(/^this `\.icon` sits in an <a> that its `aria-labelledby`/);
        });

        it('says to name a link or button its icons alone fill', () => {
          const fa = glyph(['fab', 'fa-twitter', 'fa-lg']);
          expect(
            todo('icon', fa, { clickableAround: { tag: 'a', label: 'none' } })
          ).toBe(
            'nothing names the <a> around this `.icon`: it has no `aria-label` and no text outside its icons, and a font icon\'s glyph is no name a screen reader can read; give the <a> an `aria-label` that says what it does, then add `aria-hidden="true"` here, which bestax `Icon` writes on an icon with no name of its own, and re-run, and this converts to `Icon` with `library="fa" name="twitter" variant="brands" features="fa-lg"`'
          );
        });

        it('says what a re-run converts to anywhere else', () => {
          const fa = glyph(['fas', 'fa-user']);
          const usual =
            'bestax `Icon` renders `aria-hidden="true"` when the element does not set it; add it here if that is what you want, then re-run';
          expect(todo('icon', fa)).toBe(
            `${usual}, and this converts to \`Icon\` with \`library="fa" name="user"\``
          );
          // A link or button whose label can't be told from here.
          expect(todo('icon', fa, { clickableAround: { tag: 'a' } })).toBe(
            `${usual}, and this converts to \`Icon\` with \`library="fa" name="user"\``
          );
          // An <i> it reads no glyph from: no promise.
          expect(
            todo('icon', glyph(['fas', 'fa-user'], { id: 'x' }), {
              clickableAround: { tag: 'a', label: 'none' },
            })
          ).toBe(usual);
        });
      });
    });

    describe('.icon with a name', () => {
      const i = {
        tag: 'i',
        attributes: new Map(),
        hasSpread: false,
        isEmpty: true,
      };
      const icon = (attributes: Record<string, string | true | null>) =>
        plan(facts('span', 'icon', attributes, { soleChild: i }));

      it.each(['aria-label', 'aria-labelledby'])(
        'converts one named by %s only as the image Icon makes it',
        name => {
          expect(icon({ [name]: 'home', role: 'img' }).conversion?.target).toBe(
            'Icon'
          );
          // It needs no aria-hidden then: Icon renders none on a named icon.
          const unset = icon({ [name]: 'home', 'aria-hidden': 'true' });
          expect(unset.todos.map(t => t.rule)).toEqual(['defaults:Icon']);
          expect(unset.todos[0].message).toMatch(
            /renders `role="img"` when the element does not set it/
          );
        }
      );

      it('reads a bare attribute as a name, and an empty one as none', () => {
        expect(icon({ 'aria-label': true }).todos[0].message).toMatch(
          /`role="img"`/
        );
        expect(
          icon({ 'aria-label': '', 'aria-hidden': 'true' }).conversion?.target
        ).toBe('Icon');
        expect(icon({ 'aria-label': '' }).todos[0].message).toMatch(
          /`aria-hidden="true"`/
        );
      });

      it('needs no aria-hidden on an unnamed icon with a role of its own', () => {
        // Icon leaves an unnamed icon with a role visible, an icon made a
        // button, say.
        expect(icon({ role: 'button' }).conversion?.target).toBe('Icon');
        // A role given as an expression may render as none, and then Icon
        // hides the icon, so it still needs aria-hidden written out.
        expect(icon({ role: null }).todos.map(t => t.rule)).toEqual([
          'defaults:Icon',
        ]);
      });

      it('needs no aria-hidden on an unnamed icon with a tabIndex of its own', () => {
        // Icon leaves an unnamed icon that can take focus visible.
        expect(icon({ tabIndex: '0' }).conversion?.target).toBe('Icon');
        expect(icon({ tabIndex: null }).todos.map(t => t.rule)).toEqual([
          'defaults:Icon',
        ]);
      });

      it('needs a role when the name is an expression', () => {
        // Named or not, an icon with a role of its own keeps it and isn't
        // hidden, so a role written out makes either outcome render as given.
        expect(
          icon({ 'aria-label': null, role: 'img' }).conversion?.target
        ).toBe('Icon');
        const half = icon({ 'aria-label': null, 'aria-hidden': 'false' });
        expect(half.todos.map(t => t.rule)).toEqual(['defaults:Icon']);
        expect(half.todos[0].message).toBe(
          'bestax `Icon` renders `role="img"` when it has a name and `aria-hidden="true"` when it has none, and this element\'s `aria-label` is an expression that may render as either; set `role` here to what you want, then re-run'
        );
        // A name written out settles it, whatever the other one is.
        expect(
          icon({ 'aria-label': null, 'aria-labelledby': 'x', role: 'img' })
            .conversion?.target
        ).toBe('Icon');
      });
    });
  });

  describe('Panel', () => {
    it('converts the root, heading, tabs and an <a> block', () => {
      expect(plan(facts('nav', 'panel is-primary')).conversion).toMatchObject({
        target: 'Panel',
        props: [],
        className: 'is-primary',
      });
      expect(plan(facts('p', 'panel-heading')).conversion?.target).toBe(
        'Panel.Heading'
      );
      expect(
        plan(facts('a', 'panel-block is-active')).conversion
      ).toMatchObject({ target: 'Panel.Block', props: [['active', true]] });
    });

    it('converts the root and a block on the tags their `as` takes', () => {
      for (const tag of ['article', 'section', 'aside', 'div']) {
        expect(plan(facts(tag, 'panel')).conversion).toMatchObject({
          target: 'Panel',
          props: [['as', tag]],
        });
      }
      for (const tag of ['label', 'div']) {
        expect(plan(facts(tag, 'panel-block is-active'))).toEqual({
          conversion: {
            target: 'Panel.Block',
            props: [
              ['as', tag],
              ['active', true],
            ],
            className: null,
            drop: [],
            numbers: [],
          },
          todos: [],
        });
      }
      // Any other tag still gets the usual TODO.
      expect(
        plan(facts('span', 'panel-block')).todos.map(todo => todo.rule)
      ).toEqual(['tag:Panel.Block']);
      expect(plan(facts('ul', 'panel')).todos.map(todo => todo.rule)).toEqual([
        'tag:Panel',
      ]);
    });

    it("keeps a block's anchor and label attributes to their own tags", () => {
      // bestax drops each set on the other tags (`STRIP_FROM_NON_ANCHOR` and
      // `STRIP_FROM_NON_LABEL` in Panel.tsx), where it did nothing anyway.
      expect(
        plan(facts('a', 'panel-block', { href: '#' })).conversion?.props
      ).toEqual([]);
      expect(
        plan(facts('label', 'panel-block', { htmlFor: 'x' })).conversion?.props
      ).toEqual([['as', 'label']]);
      for (const [tag, attr] of [
        ['div', 'href'],
        ['label', 'rel'],
        ['div', 'htmlFor'],
        ['a', 'form'],
      ]) {
        const [todo] = plan(facts(tag, 'panel-block', { [attr]: 'x' })).todos;
        expect(todo.rule).toBe('drops:Panel.Block');
        expect(todo.message).toContain('remove it, then re-run');
      }
    });

    it('refuses a tag it does not render before any attribute it drops', () => {
      // On a <button>, `type` picks submit or button, and removing it would
      // not unlock a conversion: the tag is the reason, and the only one.
      expect(
        plan(facts('button', 'panel-block', { type: 'submit' })).todos.map(
          todo => todo.rule
        )
      ).toEqual(['tag:Panel.Block']);
      expect(
        plan(facts('span', 'level-item', { href: '#' })).todos.map(
          todo => todo.rule
        )
      ).toEqual(['tag:Level.Item']);
    });
  });

  describe('Hero and Container', () => {
    it('converts on the landmark tags their `as` takes', () => {
      const cases: Array<[string, string, string]> = [
        ['main', 'hero', 'Hero'],
        ['footer', 'hero', 'Hero'],
        ['header', 'hero-head', 'Hero.Head'],
        ['nav', 'hero-head', 'Hero.Head'],
        ['footer', 'hero-foot', 'Hero.Foot'],
        ['nav', 'hero-foot', 'Hero.Foot'],
        ['main', 'container', 'Container'],
        ['footer', 'container', 'Container'],
        ['section', 'container', 'Container'],
      ];
      for (const [tag, className, target] of cases) {
        expect(plan(facts(tag, className)).conversion).toMatchObject({
          target,
          props: [['as', tag]],
        });
      }
      // Their default tags convert with no `as`.
      expect(plan(facts('section', 'hero')).conversion?.props).toEqual([]);
      expect(plan(facts('div', 'hero-foot')).conversion?.props).toEqual([]);
    });

    it('still refuses a tag outside them', () => {
      const cases: Array<[string, string, string]> = [
        ['figure', 'container', 'tag:Container'],
        ['nav', 'hero', 'tag:Hero'],
        ['footer', 'hero-head', 'tag:Hero.Head'],
        ['header', 'hero-foot', 'tag:Hero.Foot'],
        ['main', 'hero-body', 'tag:Hero.Body'],
      ];
      for (const [tag, className, rule] of cases) {
        expect(
          plan(facts(tag, className)).todos.map(todo => todo.rule)
        ).toEqual([rule]);
      }
    });
  });

  describe('Modal', () => {
    it('converts the parts, but not inside a bestax Modal, which picks its render from them', () => {
      expect(plan(facts('div', 'modal-content')).conversion?.target).toBe(
        'Modal.Content'
      );
      for (const root of ['modal-background', 'modal-content', 'modal-card']) {
        expect(
          plan(facts('div', root, {}, { bestaxAround: ['Modal'] })).todos.map(
            todo => todo.rule
          )
        ).toEqual([expect.stringMatching(/^context:Modal\./)]);
      }
      // A card part is not one of the children the root looks at.
      expect(
        plan(
          facts('header', 'modal-card-head', {}, { bestaxAround: ['Modal'] })
        ).conversion?.target
      ).toBe('Modal.Card.Head');
    });
  });

  describe('Image', () => {
    const img = (attributes: Record<string, string | true | null> = {}) => ({
      tag: 'img',
      attributes: new Map(Object.entries(attributes)),
      hasSpread: false,
      isEmpty: true,
    });

    it('absorbs a bare <img>, and converts around anything else', () => {
      const bare = plan(
        facts('figure', 'image is-64x64', {}, { soleChild: img({ src: 'a' }) })
      ).conversion;
      expect(bare?.absorbs).toBeDefined();
      const lazy = plan(
        facts(
          'figure',
          'image is-64x64',
          {},
          { soleChild: img({ src: 'a', loading: 'lazy' }) }
        )
      ).conversion;
      expect(lazy?.target).toBe('Image');
      expect(lazy?.absorbs).toBeUndefined();
      expect(lazy?.props).toEqual([
        ['as', 'figure'],
        ['size', '64x64'],
      ]);
      // An <iframe> is the same: it stays as written.
      const iframe = { ...img({ src: 'v' }), tag: 'iframe' };
      expect(
        plan(facts('figure', 'image is-16by9', {}, { soleChild: iframe }))
          .conversion?.className
      ).toBe('is-16by9');
    });

    it("keeps it as markup around children it can't tell are never empty", () => {
      // `{src && <img />}`: when it's falsy, Image renders its own <img>.
      const { conversion, todos } = plan(facts('figure', 'image is-64x64'));
      expect(conversion).toBeNull();
      expect(todos.map(todo => todo.rule)).toEqual(['children:Image']);
    });

    it('keeps an empty .image as markup, since Image would render an <img>', () => {
      const { conversion, todos } = plan(
        facts('figure', 'image', {}, { hasChildren: false })
      );
      expect(conversion).toBeNull();
      expect(todos.map(todo => todo.rule)).toEqual(['children:Image']);
    });
  });

  describe('IconText', () => {
    const glyphOf = (tokens: string[]): ChildFacts => ({
      tag: 'i',
      tokens,
      attributes: new Map(),
      hasSpread: false,
      isEmpty: true,
    });
    /** A `.icon` as the transform hands it over: planned on its own first. */
    const icon = (
      glyph = ['fas', 'fa-home'],
      attributes: Record<string, string | true | null> = {
        'aria-hidden': 'true',
      },
      tokens: string[] = []
    ): ChildFacts => {
      const own = facts('span', ['icon', ...tokens].join(' '), attributes, {
        soleChild: glyphOf(glyph),
      });
      const becomes = plan(own).conversion;
      return {
        tag: 'span',
        tokens: own.tokens,
        attributes: own.attributes,
        hasSpread: false,
        isEmpty: false,
        ...(becomes && { becomes }),
        soleChild: glyphOf(glyph),
      };
    };
    const text = (value = 'Home', extra: Partial<ChildFacts> = {}) => ({
      tag: 'span',
      attributes: new Map(),
      hasSpread: false,
      isEmpty: false,
      text: value,
      ...extra,
    });
    const iconText = (
      children: ChildFacts[] | undefined,
      className = 'icon-text',
      tag = 'span'
    ) => plan(facts(tag, className, {}, { childElements: children }));
    const rules = (result: ReturnType<typeof plan>) =>
      result.todos.map(todo => todo.rule);

    it('builds one icon, with the text after it', () => {
      expect(iconText([icon(), text()]).conversion).toEqual({
        target: 'IconText',
        props: [],
        className: null,
        drop: [],
        numbers: [],
        icons: [
          {
            index: 0,
            props: [
              ['library', 'fa'],
              ['name', 'home'],
            ],
            className: null,
            drop: [],
            numbers: [],
            text: 'Home',
          },
        ],
      });
    });

    it("carries each icon's glyph, classes and numbers, and each text after one", () => {
      const conversion = iconText(
        [
          icon(['far', 'fa-bell', 'fa-lg', 'fa-fw'], {
            'aria-hidden': 'true',
            tabIndex: '0',
          }),
          text('a'),
          icon(['mdi', 'mdi-home'], { 'aria-hidden': 'true' }, [
            'is-small',
            'my-icon',
          ]),
          icon(),
          text('b'),
        ],
        'icon-text has-text-success'
      ).conversion!;
      expect(conversion.props).toEqual([['textColor', 'success']]);
      expect(conversion.icons).toEqual([
        {
          index: 0,
          props: [
            ['library', 'fa'],
            ['name', 'bell'],
            ['variant', 'regular'],
            ['features', ['fa-lg', 'fa-fw']],
          ],
          className: null,
          drop: [],
          numbers: ['tabIndex'],
          text: 'a',
        },
        {
          index: 2,
          props: [
            ['library', 'mdi'],
            ['name', 'home'],
            ['size', 'small'],
          ],
          className: 'my-icon',
          drop: [],
          numbers: [],
        },
        {
          index: 3,
          props: [
            ['library', 'fa'],
            ['name', 'home'],
          ],
          className: null,
          drop: [],
          numbers: [],
          text: 'b',
        },
      ]);
    });

    it('keeps it as markup unless its children are icons, each with at most one text after it', () => {
      const shaped: Array<[string, ChildFacts[] | undefined]> = [
        ['no children', []],
        ['anything but HTML elements', undefined],
        ['only a text', [text()]],
        ['a text first', [text(), icon()]],
        ['two texts', [icon(), text(), text()]],
        ['a text with a class', [icon(), text('x', { tokens: ['bold'] })]],
        [
          'a text with an attribute',
          [icon(), text('x', { attributes: new Map([['id', 'x']]) })],
        ],
        ['a text with a spread', [icon(), text('x', { hasSpread: true })]],
        [
          'a text that is not one static text',
          [icon(), { ...text(), text: undefined }],
        ],
        ['an empty text', [icon(), text('')]],
        ['another element', [icon(), { ...text(), tag: 'strong' }]],
        ['a glyph Icon reads no name from', [icon(['bi', 'bi-house'])]],
        [
          'an icon with a key',
          [icon(['fas', 'fa-home'], { 'aria-hidden': 'true', key: 'k' })],
        ],
        [
          'an icon with a ref',
          [icon(['fas', 'fa-home'], { 'aria-hidden': 'true', ref: null })],
        ],
        [
          'an icon with a data attribute',
          [
            icon(['fas', 'fa-home'], {
              'aria-hidden': 'true',
              'data-test': 'x',
            }),
          ],
        ],
      ];
      for (const [label, children] of shaped) {
        const result = iconText(children);
        expect({ label, rules: rules(result) }).toEqual({
          label,
          rules: ['children:IconText'],
        });
        expect(result.todos[0].message).toMatch(/builds its icons from props/);
      }
      // An `aria-` attribute is one its props declare.
      expect(
        iconText([
          icon(['fas', 'fa-home'], {
            'aria-hidden': 'true',
            'aria-describedby': 'y',
          }),
        ]).conversion
      ).not.toBeNull();
    });

    it('waits for each icon to convert on its own, unless another child does', () => {
      // No aria-hidden, which Icon writes: the icon stays, and says so.
      const bare = icon(['fas', 'fa-home'], {});
      expect(bare.becomes).toBeUndefined();
      const waits = iconText([bare, text()]);
      expect(rules(waits)).toEqual(['children:IconText']);
      expect(waits.todos[0].message).toMatch(/see the TODO on each/);
      // Beside one that converts, the next run finds a component there
      // instead, so the reason is the one it gives then.
      expect(iconText([icon(), bare]).todos[0].message).toMatch(
        /builds its icons from props/
      );
      const joined = icon();
      joined.becomes = { ...joined.becomes!, conditional: [['size', 'x']] };
      expect(iconText([joined]).todos[0].message).toMatch(
        /builds its icons from props/
      );
    });

    it('refuses another tag before looking at the children', () => {
      expect(rules(iconText(undefined, 'icon-text', 'div'))).toEqual([
        'tag:IconText',
      ]);
    });
  });

  describe('File', () => {
    const node = (
      tag: string,
      tokens: string[] | undefined,
      extra: Partial<ChildFacts> = {}
    ): ChildFacts => ({
      tag,
      ...(tokens && { tokens }),
      attributes: new Map(),
      hasSpread: false,
      isEmpty: false,
      ...extra,
    });
    const span = (token: string, extra: Partial<ChildFacts> = {}) =>
      node('span', [token], { staticContent: true, ...extra });
    const icon = () =>
      span('file-icon', {
        children: [node('i', ['fas', 'fa-upload'], { isEmpty: true })],
      });
    interface Tree {
      input?: Partial<ChildFacts>;
      cta?: ChildFacts[];
      label?: Partial<ChildFacts>;
      name?: ChildFacts;
      beside?: ChildFacts[];
    }
    /** The `.file`'s children, with one part of the tree swapped out. */
    const tree = (swap: Tree = {}): ChildFacts[] => [
      node('label', ['file-label'], {
        children: [
          node('input', ['file-input'], {
            attributes: new Map([
              ['type', 'file'],
              ['name', 'cv'],
            ]),
            isEmpty: true,
            ...swap.input,
          }),
          node('span', ['file-cta'], {
            children: swap.cta ?? [span('file-label', { text: 'Upload' })],
          }),
          ...(swap.name ? [swap.name] : []),
        ],
        ...swap.label,
      }),
      ...(swap.beside ?? []),
    ];
    const file = (
      children: ChildFacts[] | undefined = tree(),
      className = 'file',
      attributes: Record<string, string | true | null> = {},
      extra: Partial<ElementFacts> = {}
    ) =>
      plan(
        facts('div', className, attributes, {
          childElements: children,
          classesAround: ['field'],
          ...extra,
        })
      );
    const rules = (result: ReturnType<typeof plan>) =>
      result.todos.map(todo => todo.rule);

    it('builds the tree it renders, and takes the input attributes as its own', () => {
      expect(file().conversion).toEqual({
        target: 'File',
        props: [],
        className: null,
        drop: [],
        numbers: [],
        file: { inputClassName: null, buttonLabel: 0 },
      });
      const built = file(
        tree({
          input: {
            tokens: ['file-input', 'my-input'],
            attributes: new Map<string, string | true>([
              ['type', 'file'],
              ['tabIndex', '0'],
            ]),
          },
          cta: [icon(), span('file-label', { text: 'Choose a file…' }), icon()],
          name: span('file-name', { text: 'cv.pdf' }),
        }),
        'file has-name is-boxed is-primary'
      ).conversion!;
      expect(built.props).toEqual([
        ['hasName', true],
        ['isBoxed', true],
      ]);
      expect(built.className).toBe('is-primary');
      expect(built.numbers).toEqual(['tabIndex']);
      expect(built.file).toEqual({
        inputClassName: 'my-input',
        iconLeft: 0,
        iconRight: 2,
        fileName: 'cv.pdf',
      });
    });

    it('takes is-empty on a name slot with no name, which File renders there itself', () => {
      // Bulma's modifier for a `has-name` `.file` with nothing to name (#978).
      const empty = file(tree(), 'file has-name is-empty').conversion!;
      expect(empty.props).toEqual([['hasName', true]]);
      expect(empty.className).toBeNull();
      // Its name is pinned empty: unpinned, `File` would show the file a
      // user picks, and drop `is-empty` with it, where the markup never does.
      expect(empty.file).toEqual({
        inputClassName: null,
        buttonLabel: 0,
        fileName: '',
      });
      // Without it `File` adds a class the markup doesn't have, and a
      // condition can't promise one `File` renders whatever it says.
      const bare = file(tree(), 'file has-name');
      expect(rules(bare)).toEqual(['defaults:File']);
      expect(bare.todos[0].message).toMatch(/`is-empty`/);
      // And says what that conversion pins, so a pick never shows a name.
      expect(bare.todos[0].message).toContain('converts with `fileName=""`');
      // A conditional `is-empty` refuses too, and the TODO says so, or an
      // author who has one reads it as already met.
      const conditional = file(
        tree(),
        'file has-name',
        {},
        { conditional: [['is-empty']] }
      );
      expect(rules(conditional)).toEqual(['defaults:File']);
      expect(conditional.todos[0].message).toContain(
        "a condition on `is-empty` can't stand in for it; write `is-empty` here as a static class"
      );
      // Beside a name `File` renders none, so one written there stays a class.
      const named = file(
        tree({ name: span('file-name', { text: 'cv.pdf' }) }),
        'file has-name is-empty'
      ).conversion!;
      expect(named.className).toBe('is-empty');
      expect(named.file?.fileName).toBe('cv.pdf');
    });

    it('converts only inside a Field, already there or becoming one', () => {
      expect(rules(file(tree(), 'file', {}, { classesAround: [] }))).toEqual([
        'context:File',
      ]);
      expect(
        file(tree(), 'file', {}, { classesAround: [], bestaxAround: ['Field'] })
          .conversion?.target
      ).toBe('File');
    });

    it('refuses an attribute of its own, which would move to the input', () => {
      expect(rules(file(tree(), 'file', { id: 'x' }))).toEqual(['attr:id']);
      expect(
        rules(file(tree(), 'file', { ref: null }, { hasRef: true }))
      ).toEqual(['attr:ref']);
      expect(file(tree(), 'file', { key: 'k' }).conversion).not.toBeNull();
    });

    it('refuses an input attribute it reads as a prop, or a number misspelled', () => {
      for (const name of ['size', 'color', 'label', 'm']) {
        const result = file(
          tree({
            input: {
              attributes: new Map([
                ['type', 'file'],
                [name, 'x'],
              ]),
            },
          })
        );
        expect({ name, rules: rules(result) }).toEqual({
          name,
          rules: [`attr:${name}`],
        });
      }
      expect(
        rules(
          file(
            tree({
              input: {
                attributes: new Map([
                  ['type', 'file'],
                  ['tabIndex', '00'],
                ]),
              },
            })
          )
        )
      ).toEqual(['attr:tabIndex']);
    });

    it('keeps it as markup when its tree is any other', () => {
      const shaped: Array<[string, ChildFacts[] | undefined]> = [
        ['no children to read', []],
        [
          'something beside the label',
          tree({ beside: [node('p', undefined)] }),
        ],
        [
          'a label with an attribute',
          tree({ label: { attributes: new Map([['htmlFor', 'x']]) } }),
        ],
        [
          'an input of another type',
          tree({
            input: { attributes: new Map([['type', 'text']]) },
          }),
        ],
        [
          'an input with a key',
          tree({
            input: {
              attributes: new Map([
                ['type', 'file'],
                ['key', 'k'],
              ]),
            },
          }),
        ],
        ['an input with a spread', tree({ input: { hasSpread: true } })],
        ['no button text', tree({ cta: [icon()] })],
        [
          'button text that is not static',
          tree({ cta: [span('file-label', { staticContent: false })] }),
        ],
        [
          'two icons before the text',
          tree({ cta: [icon(), icon(), span('file-label', { text: 'x' })] }),
        ],
        [
          'something else in the call to action',
          tree({
            cta: [span('file-label', { text: 'x' }), node('small', undefined)],
          }),
        ],
        [
          'an icon with a class of its own',
          tree({
            cta: [
              span('file-label', { text: 'x' }),
              { ...icon(), tokens: ['file-icon', 'is-large'] },
            ],
          }),
        ],
        [
          'a name that is not static text',
          tree({ name: span('file-name', { text: undefined }) }),
        ],
      ];
      for (const [label, children] of shaped) {
        expect({ label, rules: rules(file(children)) }).toEqual({
          label,
          rules: ['children:File'],
        });
      }
      // A name needs `has-name`, which `File` renders it beside, and one a
      // condition adds stays in the call, so it isn't there to rely on.
      expect(
        rules(file(tree({ name: span('file-name', { text: 'cv.pdf' }) })))
      ).toEqual(['children:File']);
      expect(
        rules(
          file(
            tree({ name: span('file-name', { text: 'cv.pdf' }) }),
            'file',
            {},
            { conditional: [['has-name']] }
          )
        )
      ).toEqual(['children:File']);
    });
  });

  describe('Pagination links and ellipsis', () => {
    const li = (extra: Partial<ChildFacts> = {}): ChildFacts => ({
      tag: 'li',
      attributes: new Map(),
      hasSpread: false,
      isEmpty: false,
      ...extra,
    });
    const rules = (result: ReturnType<typeof plan>) =>
      result.todos.map(todo => todo.rule);
    const link = (
      className: string,
      attributes: Record<string, string | true | null> = {},
      extra: Partial<ElementFacts> = {}
    ) =>
      plan(
        facts(
          'a',
          className,
          { tabIndex: '0', ...attributes },
          { soleChildOf: li(), ...extra }
        )
      );

    it('converts a link in the place of the bare <li> around it', () => {
      expect(link('pagination-link', { href: '#1' }).conversion).toMatchObject({
        target: 'Pagination.Link',
        replacesParent: true,
      });
      // The <li>'s key comes with it.
      expect(
        link(
          'pagination-link',
          {},
          {
            soleChildOf: li({ attributes: new Map([['key', null]]) }),
          }
        ).conversion?.target
      ).toBe('Pagination.Link');
    });

    it('keeps it as markup anywhere but alone in a bare <li>', () => {
      for (const holder of [
        undefined,
        li({ tag: 'div' }),
        li({ tokens: ['my-item'] }),
        li({ tokens: [] }),
        li({ attributes: new Map([['id', 'x']]) }),
        li({ hasSpread: true }),
      ]) {
        expect(
          rules(link('pagination-link', {}, { soleChildOf: holder }))
        ).toEqual(['context:Pagination.Link']);
      }
      expect(
        rules(
          link(
            'pagination-link',
            { key: 'a' },
            {
              soleChildOf: li({ attributes: new Map([['key', null]]) }),
            }
          )
        )
      ).toEqual(['attr:key']);
    });

    it("keeps it as markup when the <li> is a component's only child", () => {
      // That component could hand the <li> props with cloneElement.
      expect(
        rules(link('pagination-link', {}, { holderOnlyChildOf: 'Tooltip' }))
      ).toEqual(['only-child:Pagination.Link']);
    });

    it('makes is-current active only beside an aria-current of its own', () => {
      expect(
        link('pagination-link is-current', { 'aria-current': 'page' })
          .conversion
      ).toMatchObject({ props: [['active', true]], className: null });
      expect(link('pagination-link is-current').conversion).toMatchObject({
        props: [],
        className: 'is-current',
      });
      // Under a condition too: without one, it stays in the call.
      const conditional = (attributes: Record<string, string>) =>
        plan(
          facts(
            'a',
            'pagination-link',
            { tabIndex: '0', ...attributes },
            { soleChildOf: li(), conditional: [['is-current']] }
          )
        ).conversion?.conditional;
      expect(conditional({ 'aria-current': 'page' })).toEqual([
        ['active', 'is-current'],
      ]);
      expect(conditional({})).toBeUndefined();
    });

    it('converts an ellipsis holding exactly its own text, and nothing else on it', () => {
      const ellipsis = (className: string, text?: string) =>
        plan(facts('span', className, {}, { soleChildOf: li(), text }));
      expect(ellipsis('pagination-ellipsis', '…').conversion).toMatchObject({
        target: 'Pagination.Ellipsis',
        rendersChildren: true,
      });
      expect(rules(ellipsis('pagination-ellipsis', '...'))).toEqual([
        'children:Pagination.Ellipsis',
      ]);
      expect(rules(ellipsis('pagination-ellipsis'))).toEqual([
        'children:Pagination.Ellipsis',
      ]);
      expect(rules(ellipsis('pagination-ellipsis mt-2', '…'))).toEqual([
        'attr:className',
      ]);
    });
  });

  it('writes a tabIndex string as the number every target types it as', () => {
    expect(
      plan(facts('div', 'box', { tabIndex: '0' })).conversion?.numbers
    ).toEqual(['tabIndex']);
    expect(
      plan(facts('div', 'box', { tabIndex: '00' })).todos.map(t => t.rule)
    ).toEqual(['attr:tabIndex']);
    // An expression is carried over as written.
    expect(
      plan(facts('div', 'box', { tabIndex: null })).conversion?.numbers
    ).toEqual([]);
  });

  describe('Menu', () => {
    it('converts the root, its labels and a top-level list', () => {
      expect(plan(facts('aside', 'menu mt-4')).conversion).toMatchObject({
        target: 'Menu',
        props: [['mt', '4']],
      });
      expect(plan(facts('p', 'menu-label')).conversion?.target).toBe(
        'Menu.Label'
      );
      expect(plan(facts('ul', 'menu-list')).conversion?.target).toBe(
        'Menu.List'
      );
    });

    it('keeps a list with a role of its own as markup, since Menu.List writes role="list"', () => {
      // Written after its props, for Safari. No role, or `list`, is the same
      // list; any other role would be lost.
      const list = (attributes: Record<string, string | null>) =>
        plan(facts('ul', 'menu-list', attributes));
      expect(list({ role: 'list' }).conversion?.target).toBe('Menu.List');
      for (const role of ['menu', 'note', null]) {
        const { conversion, todos } = list({ role });
        expect(conversion).toBeNull();
        expect(todos.map(todo => todo.rule)).toEqual(['attr:role']);
      }
      expect(list({ role: 'menu' }).todos[0].message).toBe(
        'bestax `Menu.List` keeps a <ul>\'s `role` only as `list`, and writes `role="list"` in place of anything else, so this one converts only with no `role` or as one of those; keep this element as markup'
      );
    });

    it('keeps a list inside another as markup, since Menu.List drops the class there', () => {
      for (const around of [
        { classesAround: ['menu-list'] },
        { bestaxAround: ['Menu.List'] },
        // Around one: that one would lose the class instead.
        { bestaxInside: ['Menu.List'] },
      ]) {
        const { conversion, todos } = plan(
          facts('ul', 'menu-list', {}, around)
        );
        expect(conversion).toBeNull();
        expect(todos.map(todo => todo.rule)).toEqual(['context:Menu.List']);
      }
      // Another class around it, or another component, is no reason.
      expect(
        plan(facts('ul', 'menu-list', {}, { classesAround: ['menu', 'box'] }))
          .conversion?.target
      ).toBe('Menu.List');
    });

    it('leaves a `.menu-item` to a person', () => {
      expect(plan(facts('a', 'menu-item')).todos.map(t => t.rule)).toEqual([
        'family:menu-item',
      ]);
    });

    describe('an item of a list', () => {
      const link = (extra: Partial<ChildFacts> = {}): ChildFacts => ({
        tag: 'a',
        attributes: new Map(),
        hasSpread: false,
        isEmpty: false,
        ...extra,
      });
      const nested: ChildFacts = { ...link(), tag: 'ul' };
      const item = (
        className: string,
        attributes: Record<string, string | true | null>,
        children: ChildFacts[] | undefined
      ) =>
        plan(
          facts('li', className, attributes, {
            itemOf: 'menu-list',
            childElements: children,
          })
        );
      const rules = (result: ReturnType<typeof plan>) =>
        result.todos.map(todo => todo.rule);

      it('says a component class on the <li> stays a class', () => {
        expect(item('box', {}, [link()]).todos).toEqual([
          {
            rule: 'second-component:Box',
            message: expect.stringContaining(
              '`Menu.Item` here, since an item of a list converts by where it sits'
            ),
          },
        ]);
        // One a condition adds says so, there as anywhere.
        expect(
          plan({
            ...facts(
              'li',
              '',
              {},
              {
                itemOf: 'menu-list',
                childElements: [link()],
              }
            ),
            conditional: [['box']],
          }).todos
        ).toEqual([
          {
            rule: 'second-component:Box',
            message: expect.stringContaining(
              '`Menu.Item` here, since `.box` is there only when its condition holds'
            ),
          },
        ]);
      });

      it('converts the <li> and its <a> together, with a nested list after', () => {
        expect(
          item('my-item mt-2', { key: null, tabIndex: '0' }, [
            link({
              tokens: ['is-active'],
              attributes: new Map([
                ['href', '/team'],
                ['aria-current', 'page'],
              ]),
            }),
            nested,
          ]).conversion
        ).toEqual({
          target: 'Menu.Item',
          props: [],
          // The <li>'s classes stay, even a helper: Menu.Item puts its
          // helper props on the <a>.
          className: 'my-item mt-2',
          drop: [],
          numbers: ['tabIndex'],
          absorbs: {
            props: [['active', true]],
            renames: [],
            drop: [],
            after: 'Menu.List',
          },
        });
      });

      it('makes is-active active only beside an aria-current of its own', () => {
        // `active` writes aria-current="page" on the <a> unless it has one,
        // and the class can't stay a class on an <a> Menu.Item renders.
        const active = (attributes: Array<[string, string | null]>) =>
          item('', {}, [
            link({ tokens: ['is-active'], attributes: new Map(attributes) }),
          ]);
        for (const value of ['page', 'location', null]) {
          expect(
            active([['aria-current', value]]).conversion?.absorbs?.props
          ).toEqual([['active', true]]);
        }
        const bare = active([['href', '/team']]);
        expect(bare.conversion).toBeNull();
        expect(rules(bare)).toEqual(['attr:aria-current']);
        // The TODO says how to make it convert.
        expect(bare.todos[0].message).toContain(
          'If this is the current page, add `aria-current="page"` to the <a>, then re-run'
        );
      });

      it('keeps it as markup with an empty class, which it would lose', () => {
        expect(
          rules(
            plan(
              facts(
                'li',
                '',
                {},
                {
                  itemOf: 'menu-list',
                  childElements: [link()],
                  emptyClass: true,
                }
              )
            )
          )
        ).toEqual(['attr:className']);
      });

      it('keeps it as markup when an attribute would move', () => {
        expect(rules(item('', { onClick: null }, [link()]))).toEqual([
          'attr:onClick',
        ]);
        expect(
          rules(item('', {}, [link({ attributes: new Map([['title', 'x']]) })]))
        ).toEqual(['attr:title']);
        expect(
          rules(item('', {}, [link({ attributes: new Map([['key', 'k']]) })]))
        ).toEqual(['attr:key']);
      });

      it('keeps it as markup around anything but one <a> and a bare list', () => {
        expect(rules(item('', {}, undefined))).toEqual(['children:Menu.Item']);
        expect(rules(item('', {}, [link({ tag: 'button' })]))).toEqual([
          'children:Menu.Item',
        ]);
        expect(rules(item('', {}, [link(), nested, nested]))).toEqual([
          'children:Menu.Item',
        ]);
        expect(
          rules(item('', {}, [link(), { ...nested, tokens: ['menu-list'] }]))
        ).toEqual(['children:Menu.List']);
        expect(rules(item('', {}, [link({ isEmpty: true })]))).toEqual([
          'children:Menu.Item',
        ]);
        expect(
          rules(item('', {}, [link({ tokens: ['is-selected'] })]))
        ).toEqual(['attr:className']);
      });
    });
  });

  describe('forms', () => {
    it('keeps an input color as a class, since color sets the text too', () => {
      expect(
        plan(
          facts('input', 'input is-danger is-small', {}, { hasChildren: false })
        ).conversion
      ).toEqual({
        target: 'InputBase',
        props: [['size', 'small']],
        className: 'is-danger',
        drop: [],
        numbers: [],
      });
    });

    it('keeps the addon and group variants as classes', () => {
      expect(
        plan(facts('div', 'field has-addons has-addons-centered')).conversion
      ).toEqual({
        target: 'Field',
        props: [['hasAddons', true]],
        className: 'has-addons-centered',
        drop: [],
        numbers: [],
      });
    });

    it('keeps a field around a bestax form control as markup', () => {
      expect(
        plan(facts('div', 'field', {}, { bestaxInside: ['Input'] })).todos
      ).toEqual([
        { rule: 'context:Field', message: expect.stringContaining('`Input`') },
      ]);
    });

    it('keeps an input without an id inside a bestax Field as markup', () => {
      const input = (attributes: Record<string, string>) =>
        plan(
          facts('input', 'input', attributes, {
            hasChildren: false,
            bestaxAround: ['Field'],
          })
        );
      expect(input({}).todos.map(todo => todo.rule)).toEqual([
        'context:InputBase',
      ]);
      expect(input({ id: 'email' }).conversion?.target).toBe('InputBase');
    });

    it('keeps an input without an id inside any other component as markup', () => {
      const input = (componentsAround: string[]) =>
        plan(
          facts('input', 'input', {}, { hasChildren: false, componentsAround })
        );
      expect(input(['Labelled']).todos).toEqual([
        {
          rule: 'context:InputBase',
          message: expect.stringContaining('inside `<Labelled>`'),
        },
      ]);
      expect(input([]).conversion?.target).toBe('InputBase');
    });
  });

  describe('wrappers a component renders', () => {
    const fixed = (tag: string, className: string) =>
      plan(facts(tag, className, {}, { soleChildTarget: 'Grid' }));

    it('folds the wrapper and its modifiers into props on the component', () => {
      expect(fixed('div', 'fixed-grid has-3-cols has-1-cols-mobile')).toEqual({
        conversion: null,
        fold: {
          target: 'Grid',
          props: [
            ['isFixed', true],
            ['fixedCols', '3'],
            ['fixedColsMobile', '1'],
          ],
          numbers: ['fixedCols', 'fixedColsMobile'],
        },
        todos: [],
      });
    });

    it('stays on another tag, or with two counts for one prop', () => {
      expect(fixed('section', 'fixed-grid').todos.map(t => t.rule)).toEqual([
        'tag:Grid',
      ]);
      expect(
        fixed('div', 'fixed-grid has-3-cols has-4-cols').todos.map(t => t.rule)
      ).toEqual(['attr:className']);
    });
  });

  describe('Grid and Cell', () => {
    it('writes a prop typed as a number as a number', () => {
      expect(plan(facts('div', 'cell is-col-span-2 mt-2')).conversion).toEqual({
        target: 'Cell',
        props: [
          ['colSpan', '2'],
          ['mt', '2'],
        ],
        className: null,
        drop: [],
        numbers: ['colSpan'],
      });
    });

    it("keeps a gap a string, which Grid's gap takes, half steps included", () => {
      expect(
        plan(facts('div', 'grid is-gap-0.5 is-column-gap-7.5 is-gap-2'))
          .conversion
      ).toEqual({
        target: 'Grid',
        props: [
          ['gap', '0.5'],
          ['columnGap', '7.5'],
        ],
        className: 'is-gap-2',
        drop: [],
        numbers: [],
      });
    });
  });

  describe('number attributes', () => {
    it('turns a number spelled the way it renders into a number', () => {
      expect(
        plan(facts('progress', 'progress', { value: '40', max: '100' }))
          .conversion?.numbers
      ).toEqual(['value', 'max']);
    });

    it('refuses a string that is not one, or that renders differently', () => {
      for (const value of ['half', '040', '1.50', ' 40 ', '-0', '']) {
        expect({
          value,
          rules: plan(facts('progress', 'progress', { max: value })).todos.map(
            todo => todo.rule
          ),
        }).toEqual({ value, rules: ['attr:max'] });
      }
    });
  });
});
