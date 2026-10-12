/**
 * @jest-environment node
 *
 * SSR coverage for ContextMenu, where `document` is genuinely undefined: a
 * regression that measured, listened or portaled during a server render fails
 * here instead of passing by accident under jsdom. Hydrating that markup is
 * covered in `ContextMenu.test.tsx`.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ContextMenu } from '../ContextMenu';
import { ConfigProvider } from '../../helpers/Config';

const ui = (props: Partial<React.ComponentProps<typeof ContextMenu>> = {}) => (
  <ContextMenu
    aria-label="Actions for report.pdf"
    trigger={
      <tr className="file">
        <td>report.pdf</td>
      </tr>
    }
    {...props}
  >
    <ContextMenu.Item as="button">Rename</ContextMenu.Item>
    <ContextMenu.Divider />
    <ContextMenu.Item as="button">Delete</ContextMenu.Item>
  </ContextMenu>
);

describe('ContextMenu on the server (node environment)', () => {
  it('renders the trigger alone, with its class added', () => {
    expect(renderToStaticMarkup(ui())).toBe(
      '<tr class="file context-menu"><td>report.pdf</td></tr>'
    );
  });

  it('adds no class to a disabled trigger', () => {
    expect(renderToStaticMarkup(ui({ disabled: true }))).toBe(
      '<tr class="file"><td>report.pdf</td></tr>'
    );
  });

  it('prefixes the class under ConfigProvider classPrefix', () => {
    expect(
      renderToStaticMarkup(
        <ConfigProvider classPrefix="bestax-">{ui()}</ConfigProvider>
      )
    ).toBe('<tr class="file bestax-context-menu"><td>report.pdf</td></tr>');
  });

  it('gives a trigger with no class of its own just the one', () => {
    expect(
      renderToStaticMarkup(
        <ContextMenu aria-label="Actions" trigger={<li>report.pdf</li>}>
          <ContextMenu.Item>Rename</ContextMenu.Item>
        </ContextMenu>
      )
    ).toBe('<li class="context-menu">report.pdf</li>');
  });
});
