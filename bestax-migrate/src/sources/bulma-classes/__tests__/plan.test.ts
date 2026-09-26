/**
 * The planner's decisions, one rule at a time. Whether a conversion renders
 * the same markup is `e2e/bulma-classes-truth.test.ts`'s job; this file pins
 * which elements convert, which refuse, and what they say.
 */

import { plan, type ElementFacts } from '../plan.js';

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
      expect(plan(facts('div', 'card'))).toEqual({
        conversion: null,
        todos: [{ rule: 'family:card', message: expect.any(String) }],
      });
      expect(plan(facts('div', 'card-content'))).toEqual({
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
      expect(plan(facts('div', 'card box'))).toEqual({
        conversion: null,
        todos: [{ rule: 'family:card', message: expect.any(String) }],
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
