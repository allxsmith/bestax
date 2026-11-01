// What Stack, Group, Center and Flex share through `StackLayout`: the
// `.stack` root, the elements `as` takes, the list role, the ref, the helper
// props with no `display` prop, and the class prefix. Each component's own
// test covers its modifier and defaults.
import React, { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Stack } from '../../layout/Stack';
import { Group } from '../../layout/Group';
import { Center } from '../../layout/Center';
import { Flex } from '../../layout/Flex';
import { ConfigProvider } from '../Config';
import type { LayoutElement } from '../stackLayout';

// One call signature for all four, so `describe.each` can render each the
// same way: TypeScript can't call a union of generic components. Every prop
// used below is one all four take.
type AnyLayout = typeof Flex;

const LAYOUTS: [string, AnyLayout, string | null][] = [
  ['Stack', Stack as unknown as AnyLayout, 'is-vertical'],
  ['Group', Group as unknown as AnyLayout, 'is-horizontal'],
  ['Center', Center as unknown as AnyLayout, 'is-centered'],
  ['Flex', Flex, null],
];

const ELEMENTS: LayoutElement[] = [
  'div',
  'main',
  'section',
  'article',
  'aside',
  'header',
  'footer',
  'nav',
  'ul',
  'ol',
  'form',
  'fieldset',
];

describe.each(LAYOUTS)('%s', (_name, Layout, modifier) => {
  it('renders a div with the stack class and its own modifier', () => {
    render(<Layout data-testid="root">Content</Layout>);
    const root = screen.getByTestId('root');
    expect(root.tagName).toBe('DIV');
    expect(root).toHaveClass('stack');
    expect(root.className.split(' ')).toEqual(
      modifier ? ['stack', modifier] : ['stack']
    );
    expect(root).toHaveTextContent('Content');
  });

  it.each(ELEMENTS)('renders as %s', element => {
    render(<Layout as={element} data-testid="root" />);
    const root = screen.getByTestId('root');
    expect(root.tagName).toBe(element.toUpperCase());
    expect(root).toHaveClass('stack');
  });

  it.each(['ul', 'ol'] as const)(
    'restates the list role on %s, for Safari',
    element => {
      render(
        <Layout as={element} data-testid="root">
          <li>One</li>
          <li>Two</li>
        </Layout>
      );
      expect(screen.getByTestId('root')).toHaveAttribute('role', 'list');
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    }
  );

  it('keeps a role you pass on a list, and the list role through an empty one', () => {
    const { rerender } = render(
      <Layout as="ul" role="tablist" data-testid="root" />
    );
    expect(screen.getByTestId('root')).toHaveAttribute('role', 'tablist');
    rerender(<Layout as="ul" role={undefined} data-testid="root" />);
    expect(screen.getByTestId('root')).toHaveAttribute('role', 'list');
    rerender(<Layout as="ul" role="" data-testid="root" />);
    expect(screen.getByTestId('root')).toHaveAttribute('role', 'list');
  });

  it('adds no role of its own to anything but a list', () => {
    render(<Layout as="nav" aria-label="Pages" data-testid="root" />);
    const root = screen.getByTestId('root');
    expect(root).not.toHaveAttribute('role');
    expect(screen.getByRole('navigation', { name: 'Pages' })).toBe(root);
  });

  it('passes the attributes of the element it renders', () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <Layout
        as="form"
        action="/search"
        method="get"
        aria-label="Search"
        onSubmit={onSubmit}
        data-testid="root"
      >
        <button type="submit">Go</button>
      </Layout>
    );
    const form = screen.getByTestId('root');
    expect(form).toHaveAttribute('action', '/search');
    expect(form).toHaveAttribute('method', 'get');
    screen.getByRole('button', { name: 'Go' }).click();
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('forwards the ref to the element it renders', () => {
    const div = createRef<HTMLDivElement>();
    const { unmount } = render(<Layout ref={div} />);
    expect(div.current).toBeInstanceOf(HTMLDivElement);
    unmount();

    const fieldset = createRef<HTMLFieldSetElement>();
    render(<Layout as="fieldset" ref={fieldset} disabled />);
    expect(fieldset.current).toBeInstanceOf(HTMLFieldSetElement);
    expect(fieldset.current).toBeDisabled();
  });

  it('takes the flex container props with no display prop, and adds no is-flex', () => {
    render(
      <Layout
        data-testid="root"
        alignItems="flex-end"
        justifyContent="space-between"
        flexWrap="nowrap"
        alignContent="center"
        gap="3"
        rowGap="1"
        columnGap="2"
      />
    );
    const root = screen.getByTestId('root');
    expect(root).toHaveClass(
      'is-align-items-flex-end',
      'is-justify-content-space-between',
      'is-flex-wrap-nowrap',
      'is-align-content-center',
      'is-gap-3',
      'is-row-gap-1',
      'is-column-gap-2'
    );
    expect(root).not.toHaveClass('is-flex');
  });

  it('takes the other helper props, the color helpers and className', () => {
    render(
      <Layout
        data-testid="root"
        p="4"
        textColor="primary"
        bgColor="light"
        className="mine"
        display="inline-flex"
      />
    );
    expect(screen.getByTestId('root')).toHaveClass(
      'p-4',
      'has-text-primary',
      'has-background-light',
      'mine',
      'is-inline-flex'
    );
  });

  it('prefixes every class under ConfigProvider classPrefix', () => {
    render(
      <ConfigProvider classPrefix="bestax-">
        <Layout
          data-testid="root"
          gap="2"
          alignItems="center"
          className="mine"
        />
      </ConfigProvider>
    );
    const root = screen.getByTestId('root');
    expect(root).toHaveClass(
      'bestax-stack',
      'bestax-is-gap-2',
      'bestax-is-align-items-center',
      'mine'
    );
    if (modifier) expect(root).toHaveClass(`bestax-${modifier}`);
    expect(root).not.toHaveClass('stack');
  });

  it('renders the same markup on the server', () => {
    const html = renderToStaticMarkup(
      <Layout as="ul" gap="1">
        <li>One</li>
      </Layout>
    );
    expect(html).toBe(
      `<ul class="stack${modifier ? ` ${modifier}` : ''} is-gap-1" role="list"><li>One</li></ul>`
    );
  });
});
