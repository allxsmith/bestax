import rule from '../rules/no-bulma-component-class.js';
import { BULMA_COMPONENT_CLASSES } from '../generated/metadata.js';
import { ruleTester } from './helpers.js';

// Plain elements need no import, so no fixture here uses `imported()`.
const jsx = (element: string) => `const x = ${element};\n`;

const converts = (cls: string, component: string, tag = 'div') => ({
  messageId: 'converts' as const,
  data: { tag, cls, component },
});
const family = (cls: string, component: string, tag = 'div') => ({
  messageId: 'family' as const,
  data: { tag, cls, component },
});

ruleTester.run('no-bulma-component-class', rule, {
  valid: [
    // Classes no bestax component renders on their own.
    jsx('<div className="my-card pricing" />'),
    jsx('<div className="has-text-centered mt-4 is-flex" />'),
    jsx('<p className="help is-danger" />'),
    jsx('<label className="label" />'),
    // A part of a family: the family's own class is reported where it sits.
    jsx('<div className="dropdown-menu" />'),
    // A Bulma 0.9 class with no component, and a class named like an Object member.
    jsx('<div className="tile is-ancestor" />'),
    jsx('<div className="toString constructor" />'),
    // Components and custom elements are not plain HTML.
    jsx('<Box className="box" />'),
    jsx('<ui.Card className="card" />'),
    jsx('<my-card className="card" />'),
    // svg and math are not HTML, inside or out.
    jsx('<svg className="icon"><g className="card" /></svg>'),
    jsx('<math className="box" />'),
    // `class`, not `className`.
    jsx('<div class="box" />'),
    // Only what the source spells: a lookup, a glued word, a value it cannot see.
    jsx("<div className={styles['box']} />"),
    jsx('<div className={styles.box} />'),
    jsx('<div className={`button${size}`} />'),
    jsx("<div className={'button' + size} />"),
    jsx('<div className={classes} />'),
    jsx('<div className={cx({ [box]: on })} />'),
    jsx("<div className={'card' + '-' + suffix} />"),
    // A call that is not a class joiner may take a lookup key.
    jsx("<div className={t('button')} />"),
    jsx("<div className={getClass('card')} />"),
    jsx("<div className={styles.get('box')} />"),
    // A function the app defines is one the rule cannot see into, whatever
    // its name: a lookup, or a joiner it cannot tell from one.
    'const cx = (key) => styles[key];\n' +
      jsx("<div className={cx('card')} />"),
    "import { cn } from '@/lib/utils';\n" +
      jsx("<div className={cn('box')} />"),
    // A name nothing declares is not one the rule can call a joiner.
    jsx("<div className={cn('box', extra)} />"),
    // A join that glues the elements together keeps none of their words.
    jsx("<div className={['card', variant].join('-')} />"),
    jsx("<div className={['box', x].join()} />"),
    // `classnames/bind` looks up CSS-module names: `cx('card')` is hashed.
    "import classNames from 'classnames/bind';\nconst cx = classNames.bind(styles);\n" +
      jsx("<div className={cx('card')} />"),
    // The last className is the one that renders.
    jsx('<div className="box" className="my-box" />'),
  ],
  invalid: [
    {
      code: jsx('<div className="box" />'),
      errors: [converts('box', 'Box')],
    },
    {
      code: jsx('<a className="button is-primary is-large" href="/x" />'),
      errors: [converts('button', 'Button', 'a')],
    },
    {
      code: jsx('<div className="hero-body" />'),
      errors: [converts('hero-body', 'Hero.Body')],
    },
    {
      code: jsx('<div className="card" />'),
      errors: [converts('card', 'Card')],
    },
    {
      code: jsx('<header className="card-header" />'),
      errors: [converts('card-header', 'Card.Header', 'header')],
    },
    {
      code: jsx('<nav className="navbar is-primary" />'),
      errors: [converts('navbar', 'Navbar', 'nav')],
    },
    {
      code: jsx('<a className="navbar-burger" />'),
      errors: [family('navbar-burger', 'Navbar.Burger', 'a')],
    },
    {
      code: jsx('<div className="dropdown is-active" />'),
      errors: [family('dropdown', 'Dropdown')],
    },
    // One report per element, for the class the codemod decides by: a family
    // before anything, then by precedence.
    {
      code: jsx('<div className="box dropdown" />'),
      errors: [family('dropdown', 'Dropdown')],
    },
    {
      code: jsx('<div className="card-content content" />'),
      errors: [converts('card-content', 'Card.Content')],
    },
    {
      code: jsx('<div className="box column is-6" />'),
      errors: [converts('column', 'Column')],
    },
    // The ways a class name reaches a className at runtime.
    {
      code:
        "import clsx from 'clsx';\n" +
        jsx("<button className={clsx('button', busy && 'is-loading')} />"),
      errors: [converts('button', 'Button', 'button')],
    },
    {
      code: jsx("<div className={on ? 'notification is-danger' : 'box'} />"),
      errors: [converts('notification', 'Notification')],
    },
    {
      code: jsx('<div className={`columns ${gap}`} />'),
      errors: [converts('columns', 'Columns')],
    },
    {
      code: jsx("<h1 className={'title ' + size} />"),
      errors: [converts('title', 'Title', 'h1')],
    },
    {
      code:
        "import cx from 'classnames';\n" +
        jsx("<div className={cx({ box: on, 'is-active': on })} />"),
      errors: [converts('box', 'Box')],
    },
    // A joiner by its import, whatever the file calls it.
    {
      code: "import cls from 'clsx';\n" + jsx("<div className={cls('box')} />"),
      errors: [converts('box', 'Box')],
    },
    // The same binding, required: the preset lints CommonJS files too.
    {
      code:
        "const cx = require('clsx');\n" +
        jsx("<div className={cx('box', extra)} />"),
      errors: [converts('box', 'Box')],
    },
    // Two families: the first the element carries, as the codemod reads it.
    {
      code: jsx('<div className="select field" />'),
      errors: [family('select', 'Select')],
    },
    {
      code: jsx("<div className={['container', extra].join(' ')} />"),
      errors: [converts('container', 'Container')],
    },
    {
      code: jsx("<div className={'box' as string} />"),
      errors: [converts('box', 'Box')],
    },
    // A spread does not silence it: the author wrote the class.
    {
      code: jsx('<div className="box" {...rest} />'),
      errors: [converts('box', 'Box')],
    },
    // The last className is the one that renders.
    {
      code: jsx('<div className="my-box" className="box" />'),
      errors: [converts('box', 'Box')],
    },
    // Inside a component, a plain element is still plain.
    {
      code:
        "import { Card } from '@allxsmith/bestax-bulma';\n" +
        jsx('<Card><div className="content" /></Card>'),
      errors: [converts('content', 'Content')],
    },
  ],
});

describe('the class table', () => {
  it('names a component for every class, and lists families first', () => {
    const entries = [...BULMA_COMPONENT_CLASSES.values()];
    expect(entries.every(entry => /^[A-Z][\w.]*$/.test(entry.component))).toBe(
      true
    );
    const firstConverted = entries.findIndex(entry => entry.converts);
    expect(firstConverted).toBeGreaterThan(0);
    expect(entries.slice(firstConverted).every(entry => entry.converts)).toBe(
      true
    );
  });
});
