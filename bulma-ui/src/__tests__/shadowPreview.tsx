import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { fireEvent, screen } from '@testing-library/react';
import { ConfigProvider } from '../helpers/Config';

/**
 * A page that renders `children` into a shadow root through a portal, the way
 * the docs site's live examples do, with a `ConfigProvider` that makes an
 * element inside the root where they portal. The children wait for that
 * element, so nothing they portal mounts in `document.body` first. The page
 * around the shadow host is React's too, which is what keeps React from
 * making an enter for something the pointer reaches from the page.
 */
export function ShadowPreview({ children }: { children: React.ReactNode }) {
  const [root, setRoot] = useState<ShadowRoot | null>(null);
  const [target, setTarget] = useState<HTMLDivElement | null>(null);
  return (
    <>
      <p>Page text</p>
      <div
        ref={el => {
          if (el && !el.shadowRoot) setRoot(el.attachShadow({ mode: 'open' }));
        }}
      >
        {root &&
          createPortal(
            <>
              {target && (
                <ConfigProvider portalContainer={target}>
                  {children}
                </ConfigProvider>
              )}
              <div ref={setTarget} />
            </>,
            root
          )}
      </div>
    </>
  );
}

const page = () => screen.getByText('Page text');
const host = () => page().nextElementSibling!;

/** The shadow root `ShadowPreview` renders into. */
export const previewRoot = () => host().shadowRoot!;

/**
 * The mouse events a browser sends as the pointer moves from `from` onto `to`:
 * a mouseout on `from` naming `outRelated`, and a mouseover on `to` naming
 * `overRelated`. Each names the other end as the browser shows it from that
 * event's side of the shadow boundary, where the host stands for anything
 * inside the shadow root.
 */
const move = (
  from: Element,
  to: Element,
  outRelated: Element,
  overRelated: Element
) => {
  fireEvent.mouseOut(from, { relatedTarget: outRelated });
  fireEvent.mouseOver(to, { relatedTarget: overRelated });
};

/** The pointer moves from the page onto `el`, inside the shadow root. */
export const mouseInFromPage = (el: Element) =>
  move(page(), el, host(), page());

/** The pointer moves from `el`, inside the shadow root, back onto the page. */
export const mouseOutToPage = (el: Element) => move(el, page(), page(), host());
