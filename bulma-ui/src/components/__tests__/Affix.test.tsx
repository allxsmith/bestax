import React, { createRef } from 'react';
import { render, screen, act } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { Affix, type AffixPosition } from '../Affix';
import { Button } from '../../elements/Button';
import { ConfigProvider } from '../../helpers/Config';

/** The `<div>` an Affix renders, found from what's inside it. */
const affixOf = (text: string) =>
  screen.getByText(text).closest('div') as HTMLDivElement;

describe('Affix', () => {
  it('renders a div fixed to the bottom-right corner by default, with no role', () => {
    render(
      <Affix>
        <Button>Help</Button>
      </Affix>
    );
    const affix = screen.getByRole('button', { name: 'Help' }).parentElement!;
    expect(affix.tagName).toBe('DIV');
    expect(affix.className).toBe('affix is-bottom-right');
    expect(affix).not.toHaveAttribute('role');
  });

  it.each<AffixPosition>([
    'top-right',
    'top-left',
    'bottom-right',
    'bottom-left',
  ])('takes the %s corner', position => {
    render(<Affix position={position}>Corner</Affix>);
    expect(affixOf('Corner').className).toBe(`affix is-${position}`);
  });

  it('puts the helper props, className and other attributes on its div', () => {
    render(
      <Affix
        mb="6"
        mr="3"
        visibilityMobile="hidden"
        className="chat-launcher"
        id="launcher"
        data-testid="launcher"
        style={
          {
            '--bulma-affix-offset-vertical': '4rem',
          } as React.CSSProperties
        }
      >
        Chat
      </Affix>
    );
    const affix = screen.getByTestId('launcher');
    expect(affix).toHaveClass(
      'affix',
      'is-bottom-right',
      'mb-6',
      'mr-3',
      'is-hidden-mobile',
      'chat-launcher'
    );
    expect(affix).toHaveAttribute('id', 'launcher');
    expect(affix).not.toHaveAttribute('mb');
    expect(affix.style.getPropertyValue('--bulma-affix-offset-vertical')).toBe(
      '4rem'
    );
  });

  it('forwards its ref to the div', () => {
    const ref = createRef<HTMLDivElement>();
    render(<Affix ref={ref}>Ref</Affix>);
    expect(ref.current).toBe(affixOf('Ref'));
  });

  it('prefixes every class under a ConfigProvider classPrefix', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bestax-">
        <Affix position="top-left" mb="2">
          Prefixed
        </Affix>
      </ConfigProvider>
    );
    const affix = container.querySelector('.bestax-affix');
    expect(affix).toHaveClass('bestax-is-top-left', 'bestax-mb-2');
    expect(affix).not.toHaveClass('affix');
    expect(affix).not.toHaveClass('is-top-left');
  });

  describe('portal', () => {
    it('renders in place by default', () => {
      const { container } = render(<Affix>In place</Affix>);
      expect(container).toContainElement(affixOf('In place'));
    });

    it('renders in place given an empty selector', () => {
      const { container } = render(<Affix portal="">In place</Affix>);
      expect(container).toContainElement(affixOf('In place'));
    });

    it('renders at the end of document.body when portal is true', () => {
      const { container } = render(
        <>
          <Affix portal>Portaled</Affix>
          <p>After it</p>
        </>
      );
      const affix = affixOf('Portaled');
      expect(container).not.toContainElement(affix);
      expect(affix.parentElement).toBe(document.body);
      expect(document.body.lastElementChild).toBe(affix);
    });

    it.each([
      ['a selector', () => '#affix-target'],
      ['an element', () => document.getElementById('affix-target')!],
    ])('renders into a target given as %s', (_, makeTarget) => {
      const target = document.createElement('div');
      target.id = 'affix-target';
      document.body.appendChild(target);
      render(<Affix portal={makeTarget()}>Targeted</Affix>);
      expect(affixOf('Targeted').parentElement).toBe(target);
      target.remove();
    });

    it('falls back to document.body when a selector matches nothing', () => {
      render(<Affix portal="#nowhere">Fallback</Affix>);
      expect(affixOf('Fallback').parentElement).toBe(document.body);
    });

    it('keeps the class prefix once portaled', () => {
      render(
        <ConfigProvider classPrefix="bestax-">
          <Affix portal>Prefixed</Affix>
        </ConfigProvider>
      );
      expect(affixOf('Prefixed').className).toBe(
        'bestax-affix bestax-is-bottom-right'
      );
    });

    it('renders in place on the server, portal or not', () => {
      expect(renderToString(<Affix portal>Server</Affix>)).toBe(
        '<div class="affix is-bottom-right">Server</div>'
      );
      expect(renderToString(<Affix position="top-left">Server</Affix>)).toBe(
        '<div class="affix is-top-left">Server</div>'
      );
    });

    it('hydrates the server markup in place, then moves into the portal and re-points its ref', async () => {
      const seen: (HTMLDivElement | null)[] = [];
      const ui = (
        <Affix
          portal
          ref={(node: HTMLDivElement | null) => {
            seen.push(node);
          }}
        >
          Hydrated
        </Affix>
      );
      const container = document.createElement('div');
      container.innerHTML = renderToString(ui);
      document.body.appendChild(container);
      const serverNode = container.firstElementChild;
      expect(serverNode).toHaveClass('affix');

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let unmountRoot = () => {};
      await act(async () => {
        const root = hydrateRoot(container, ui);
        unmountRoot = () => root.unmount();
      });

      // No hydration mismatch, and it has left the container for the body.
      expect(errorSpy).not.toHaveBeenCalled();
      expect(container).toBeEmptyDOMElement();
      const portaled = affixOf('Hydrated');
      expect(portaled.parentElement).toBe(document.body);
      expect(seen[0]).toBe(serverNode);
      expect(seen[seen.length - 1]).toBe(portaled);

      await act(async () => unmountRoot());
      expect(seen[seen.length - 1]).toBeNull();
      errorSpy.mockRestore();
      container.remove();
    });

    it('hydrates in place without a portal', async () => {
      const ui = <Affix position="bottom-left">Stays</Affix>;
      const container = document.createElement('div');
      container.innerHTML = renderToString(ui);
      document.body.appendChild(container);
      const serverNode = container.firstElementChild;

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let unmountRoot = () => {};
      await act(async () => {
        const root = hydrateRoot(container, ui);
        unmountRoot = () => root.unmount();
      });

      expect(errorSpy).not.toHaveBeenCalled();
      expect(container.firstElementChild).toBe(serverNode);

      await act(async () => unmountRoot());
      errorSpy.mockRestore();
      container.remove();
    });
  });
});
