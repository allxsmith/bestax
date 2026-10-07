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
        ],
        className: 'has-shadow',
        drop: [],
        numbers: [],
      });
      expect(plan(facts('nav', 'navbar')).todos.map(todo => todo.rule)).toEqual(
        ['defaults:Navbar']
      );
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

      it('needs both defaults when the name is an expression', () => {
        expect(
          icon({ 'aria-label': null, role: 'img', 'aria-hidden': 'false' })
            .conversion?.target
        ).toBe('Icon');
        const half = icon({ 'aria-label': null, role: 'img' });
        expect(half.todos.map(t => t.rule)).toEqual(['defaults:Icon']);
        expect(half.todos[0].message).toBe(
          'bestax `Icon` renders `role="img"` when it has a name and `aria-hidden="true"` when it has none, and this element\'s `aria-label` is an expression that may render as either; set `aria-hidden` here to what you want, then re-run'
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

    it('leaves a block on another tag as markup with no TODO', () => {
      // bestax renders those as Panel.CheckboxBlock, InputBlock or ButtonBlock.
      for (const tag of ['label', 'div']) {
        expect(plan(facts(tag, 'panel-block'))).toEqual({
          conversion: null,
          todos: [],
        });
      }
      // Any other tag still gets the usual TODO.
      expect(
        plan(facts('span', 'panel-block')).todos.map(todo => todo.rule)
      ).toEqual(['tag:Panel.Block']);
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

      it('converts the <li> and its <a> together, with a nested list after', () => {
        expect(
          item('my-item mt-2', { key: null, tabIndex: '0' }, [
            link({
              tokens: ['is-active'],
              attributes: new Map([['href', '/team']]),
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
