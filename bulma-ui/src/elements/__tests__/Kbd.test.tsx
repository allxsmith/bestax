import React, { createRef } from 'react';
import { act, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { Kbd, KbdGroup, type KbdGroupProps } from '../Kbd';
import { ConfigProvider } from '../../helpers/Config';
import { visuallyHidden } from '../../helpers/statusRegion';

describe('Kbd', () => {
  describe('what it renders', () => {
    it('renders one <kbd class="kbd"> around its children, and nothing else', () => {
      const { container } = render(<Kbd>Esc</Kbd>);
      expect(container.innerHTML).toBe('<kbd class="kbd">Esc</kbd>');
    });

    it('adds no role, no ARIA and no tab stop', () => {
      render(<Kbd>Esc</Kbd>);
      const key = screen.getByText('Esc');
      expect(key).not.toHaveAttribute('role');
      expect(key).not.toHaveAttribute('tabindex');
      expect(
        Array.from(key.attributes).filter(a => a.name.startsWith('aria-'))
      ).toEqual([]);
    });

    it('passes other attributes through to the <kbd>', () => {
      render(
        <Kbd id="close-key" title="Escape" data-testid="key">
          Esc
        </Kbd>
      );
      const key = screen.getByTestId('key');
      expect(key).toHaveAttribute('id', 'close-key');
      expect(key).toHaveAttribute('title', 'Escape');
    });

    it('applies the helper props, with className merged last', () => {
      render(
        <Kbd
          textColor="primary"
          bgColor="light"
          textSize="3"
          mx="1"
          className="custom"
        >
          K
        </Kbd>
      );
      const key = screen.getByText('K');
      expect(key).toHaveClass(
        'kbd',
        'has-text-primary',
        'has-background-light',
        'is-size-3',
        'mx-1',
        'custom'
      );
      expect(key.className.split(' ').pop()).toBe('custom');
    });

    it('forwards its ref to the <kbd>', () => {
      const ref = createRef<HTMLElement>();
      render(<Kbd ref={ref}>Esc</Kbd>);
      expect(ref.current?.tagName).toBe('KBD');
      expect(ref.current).toHaveClass('kbd');
    });

    it('takes no color prop of its own', () => {
      render(
        <>
          {/* @ts-expect-error: a key is neutral; textColor tints it */}
          <Kbd color="primary">A</Kbd>
          {/* @ts-expect-error: and backgroundColor is spelled bgColor here */}
          <Kbd backgroundColor="primary">B</Kbd>
        </>
      );
      expect(screen.getByText('A')).toHaveClass('kbd');
      expect(screen.getByText('B')).toHaveClass('kbd');
    });

    it('has a displayName for dev tools', () => {
      expect(Kbd.displayName).toBe('Kbd');
      expect(Kbd.Group.displayName).toBe('Kbd.Group');
    });
  });

  describe('label', () => {
    it('hides the glyph from assistive tech and puts the label in text', () => {
      const { container } = render(<Kbd label="Command">⌘</Kbd>);
      const key = container.querySelector('kbd') as HTMLElement;
      const [glyph, name] = Array.from(key.children) as HTMLElement[];
      expect(key.children).toHaveLength(2);
      expect(glyph.tagName).toBe('SPAN');
      expect(glyph).toHaveAttribute('aria-hidden', 'true');
      expect(glyph).toHaveTextContent('⌘');
      expect(name.tagName).toBe('SPAN');
      expect(name).toHaveTextContent('Command');
      expect(name).not.toHaveAttribute('aria-hidden');
    });

    it('hides the label with inline styles, not a class', () => {
      render(<Kbd label="Command">⌘</Kbd>);
      const name = screen.getByText('Command');
      expect(name).not.toHaveAttribute('class');
      expect(name).toHaveStyle(visuallyHidden as Record<string, unknown>);
    });

    it('names the key in text, never with aria-label', () => {
      render(<Kbd label="Option">⌥</Kbd>);
      const key = screen.getByText('Option').closest('kbd') as HTMLElement;
      expect(key).not.toHaveAttribute('aria-label');
      expect(key).not.toHaveAttribute('aria-labelledby');
      // What assistive tech gets from the key: the label, and not the glyph.
      const read = Array.from(key.childNodes)
        .filter(node => !(node as Element).hasAttribute?.('aria-hidden'))
        .map(node => node.textContent)
        .join('');
      expect(read).toBe('Option');
    });

    it('renders the children as they are when the label is empty', () => {
      const { container } = render(<Kbd label="">Esc</Kbd>);
      expect(container.innerHTML).toBe('<kbd class="kbd">Esc</kbd>');
    });
  });
});

describe('Kbd.Group', () => {
  const groupIn = (container: HTMLElement) =>
    container.firstElementChild as HTMLElement;

  it('renders an outer <kbd class="kbd-group"> around one <kbd> per key', () => {
    const { container } = render(
      <Kbd.Group>
        <Kbd>Ctrl</Kbd>
        <Kbd>S</Kbd>
      </Kbd.Group>
    );
    expect(container.innerHTML).toBe(
      '<kbd class="kbd-group">' +
        '<kbd class="kbd">Ctrl</kbd>' +
        '<span class="kbd-separator"> + </span>' +
        '<kbd class="kbd">S</kbd>' +
        '</kbd>'
    );
  });

  it('puts the separator between each pair of keys, with a space either side', () => {
    const { container } = render(
      <Kbd.Group>
        <Kbd>Ctrl</Kbd>
        <Kbd>Shift</Kbd>
        <Kbd>P</Kbd>
      </Kbd.Group>
    );
    const group = groupIn(container);
    expect(group.querySelectorAll('.kbd-separator')).toHaveLength(2);
    expect(group).toHaveTextContent('Ctrl + Shift + P', {
      normalizeWhitespace: false,
    });
  });

  it('takes a separator for a sequence', () => {
    const { container } = render(
      <Kbd.Group separator="then">
        <Kbd>G</Kbd>
        <Kbd>I</Kbd>
      </Kbd.Group>
    );
    const separators = groupIn(container).querySelectorAll('.kbd-separator');
    expect(separators).toHaveLength(1);
    expect(separators[0].textContent).toBe(' then ');
    expect(groupIn(container).textContent).toBe('G then I');
  });

  it('gives an empty Fragment between two keys no separator', () => {
    const { container } = render(
      <Kbd.Group>
        <Kbd>Ctrl</Kbd>
        <></>
        <Kbd>S</Kbd>
      </Kbd.Group>
    );
    expect(groupIn(container).textContent).toBe('Ctrl + S');
    expect(groupIn(container).querySelectorAll('.kbd-separator')).toHaveLength(
      1
    );
  });

  it('separates the keys inside a Fragment like the rest', () => {
    const { container } = render(
      <Kbd.Group>
        <>
          <Kbd>Ctrl</Kbd>
          <Kbd>Shift</Kbd>
        </>
        <Kbd>P</Kbd>
      </Kbd.Group>
    );
    const group = groupIn(container);
    expect(group.textContent).toBe('Ctrl + Shift + P');
    // Each key is a direct child of the group, with a separator between
    // each pair, as it would be without the Fragment.
    expect(
      Array.from(group.children).map(el => el.className.split(' ')[0])
    ).toEqual(['kbd', 'kbd-separator', 'kbd', 'kbd-separator', 'kbd']);
  });

  it('gives a child that renders nothing no separator', () => {
    const showShift = false;
    const { container } = render(
      <Kbd.Group>
        {null}
        <Kbd>Ctrl</Kbd>
        {showShift && <Kbd>Shift</Kbd>}
        {undefined}
        <Kbd>S</Kbd>
        {false}
      </Kbd.Group>
    );
    expect(groupIn(container).textContent).toBe('Ctrl + S');
    expect(groupIn(container).querySelectorAll('.kbd-separator')).toHaveLength(
      1
    );
  });

  it('puts no separator around a single key', () => {
    const { container } = render(
      <Kbd.Group>
        <Kbd>Esc</Kbd>
      </Kbd.Group>
    );
    expect(container.innerHTML).toBe(
      '<kbd class="kbd-group"><kbd class="kbd">Esc</kbd></kbd>'
    );
  });

  it('renders an empty group with no keys', () => {
    const { container } = render(<Kbd.Group />);
    expect(container.innerHTML).toBe('<kbd class="kbd-group"></kbd>');
  });

  it('separates keys from an array the same way', () => {
    const keys = ['Ctrl', 'Alt', 'Delete'];
    const { container } = render(
      <Kbd.Group>
        {keys.map(name => (
          <Kbd key={name}>{name}</Kbd>
        ))}
      </Kbd.Group>
    );
    expect(groupIn(container).textContent).toBe('Ctrl + Alt + Delete');
  });

  it('renders a symbol key with its label as the issue describes', () => {
    const { container } = render(
      <Kbd.Group>
        <Kbd label="Command">⌘</Kbd>
        <Kbd>K</Kbd>
      </Kbd.Group>
    );
    const group = groupIn(container);
    const [command, separator, k] = Array.from(group.children);
    expect(group.tagName).toBe('KBD');
    expect(command.outerHTML).toMatch(
      /^<kbd class="kbd"><span aria-hidden="true">⌘<\/span><span style="[^"]+">Command<\/span><\/kbd>$/
    );
    expect(separator.outerHTML).toBe('<span class="kbd-separator"> + </span>');
    expect(k.outerHTML).toBe('<kbd class="kbd">K</kbd>');
  });

  it('applies the helper props, attributes and className to the outer <kbd>', () => {
    render(
      <Kbd.Group
        textColor="info"
        textSize="5"
        ml="2"
        className="custom"
        data-testid="group"
        title="Save"
      >
        <Kbd>Ctrl</Kbd>
        <Kbd>S</Kbd>
      </Kbd.Group>
    );
    const group = screen.getByTestId('group');
    expect(group.tagName).toBe('KBD');
    expect(group).toHaveAttribute('title', 'Save');
    expect(group).toHaveClass(
      'kbd-group',
      'has-text-info',
      'is-size-5',
      'ml-2',
      'custom'
    );
    expect(group).not.toHaveClass('kbd');
    expect(group.className.split(' ').pop()).toBe('custom');
  });

  it('adds no role, no ARIA and no tab stop', () => {
    render(
      <Kbd.Group data-testid="group">
        <Kbd>Ctrl</Kbd>
        <Kbd>S</Kbd>
      </Kbd.Group>
    );
    const group = screen.getByTestId('group');
    expect(group).not.toHaveAttribute('role');
    expect(group).not.toHaveAttribute('tabindex');
    expect(
      Array.from(group.attributes).filter(a => a.name.startsWith('aria-'))
    ).toEqual([]);
  });

  it('forwards its ref to the outer <kbd>', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Kbd.Group ref={ref}>
        <Kbd>Ctrl</Kbd>
        <Kbd>S</Kbd>
      </Kbd.Group>
    );
    expect(ref.current?.tagName).toBe('KBD');
    expect(ref.current).toHaveClass('kbd-group');
  });

  it('takes no background color, since a group is never drawn as a key', () => {
    const props: KbdGroupProps = {
      textColor: 'info',
      // @ts-expect-error: bgColor belongs on a Kbd, not on the group
      bgColor: 'light',
    };
    expect(props.textColor).toBe('info');
  });
});

describe('Compound components', () => {
  test('Kbd.Group is the exported KbdGroup', () => {
    expect(Kbd.Group).toBe(KbdGroup);
  });

  test('renders a group through the dot path and by name alike', () => {
    const { container } = render(
      <>
        <Kbd.Group>
          <Kbd>Ctrl</Kbd>
          <Kbd>C</Kbd>
        </Kbd.Group>
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>V</Kbd>
        </KbdGroup>
      </>
    );
    const groups = container.querySelectorAll('kbd.kbd-group');
    expect(groups).toHaveLength(2);
    expect(groups[0].textContent).toBe('Ctrl + C');
    expect(groups[1].textContent).toBe('Ctrl + V');
  });
});

describe('class prefix', () => {
  it('prefixes every class under ConfigProvider classPrefix', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bestax-">
        <Kbd.Group textColor="primary">
          <Kbd label="Command">⌘</Kbd>
          <Kbd textSize="3">K</Kbd>
        </Kbd.Group>
      </ConfigProvider>
    );
    expect(container.querySelector('.bestax-kbd-group')).toHaveClass(
      'bestax-has-text-primary'
    );
    expect(container.querySelectorAll('.bestax-kbd')).toHaveLength(2);
    expect(container.querySelector('.bestax-kbd-separator')).not.toBeNull();
    expect(screen.getByText('K')).toHaveClass('bestax-kbd', 'bestax-is-size-3');
    const unprefixed = Array.from(container.querySelectorAll('[class]'))
      .flatMap(el => Array.from(el.classList))
      .filter(name => !name.startsWith('bestax-'));
    expect(unprefixed).toEqual([]);
  });
});

describe('server rendering', () => {
  const Shortcut: React.FC = () => (
    <p>
      Open the palette with{' '}
      <Kbd.Group>
        <Kbd label="Command">⌘</Kbd>
        <Kbd>Shift</Kbd>
        <Kbd>P</Kbd>
      </Kbd.Group>
      , or close it with <Kbd>Esc</Kbd>.
    </p>
  );

  /**
   * The markup, with each style attribute written the way the DOM writes it,
   * and without the empty comments React's server puts between adjacent
   * text, which the client never renders.
   */
  const markup = (root: HTMLElement) => {
    const copy = root.cloneNode(true) as HTMLElement;
    copy.querySelectorAll<HTMLElement>('[style]').forEach(el => {
      el.setAttribute('style', el.style.cssText);
    });
    return copy.innerHTML.replace(/<!-- -->/g, '');
  };

  it('renders the same markup on the server as on the client', () => {
    const server = document.createElement('div');
    server.innerHTML = renderToString(<Shortcut />);
    const { container } = render(<Shortcut />);
    expect(markup(server)).toBe(markup(container));
  });

  it('hydrates without a mismatch', async () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Shortcut />);
    document.body.appendChild(container);
    const before = container.innerHTML;

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let unmountRoot = () => {};
    try {
      await act(async () => {
        const root = hydrateRoot(container, <Shortcut />);
        unmountRoot = () => root.unmount();
      });
      expect(errorSpy).not.toHaveBeenCalled();
      expect(container.innerHTML).toBe(before);
    } finally {
      await act(async () => unmountRoot());
      errorSpy.mockRestore();
      document.body.removeChild(container);
    }
  });
});
