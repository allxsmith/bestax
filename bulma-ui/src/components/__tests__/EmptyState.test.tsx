import React, { createRef } from 'react';
import { act, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import {
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIndicator,
  EmptyStateTitle,
  type EmptyStateProps,
} from '../EmptyState';
import { Button } from '../../elements/Button';
import { Icon } from '../../elements/Icon';
import { ConfigProvider } from '../../helpers/Config';

/** The root `<div>` an EmptyState renders into `container`. */
const rootOf = (container: HTMLElement) =>
  container.firstElementChild as HTMLElement;

/** The class list of an element, as an array. */
const classesOf = (el: Element | null) => Array.from(el?.classList ?? []);

/** Every attribute name on `el` and the elements inside it. */
const attributesUnder = (el: Element) =>
  [el, ...Array.from(el.querySelectorAll('*'))].flatMap(node =>
    Array.from(node.attributes).map(a => a.name)
  );

describe('EmptyState', () => {
  describe('the shorthand props', () => {
    it('renders the issue’s one-button example exactly, the button last', () => {
      const { container } = render(
        <EmptyState
          icon="folder-open"
          title="No projects yet"
          description="Projects you create or join show up here."
        >
          <Button color="primary">New project</Button>
        </EmptyState>
      );
      expect(container.innerHTML).toBe(
        '<div class="empty-state">' +
          '<div class="empty-state-indicator" aria-hidden="true">' +
          '<span class="icon" aria-hidden="true">' +
          '<i class="fas fa-folder-open"></i></span></div>' +
          '<h2 class="title empty-state-title">No projects yet</h2>' +
          '<p class="empty-state-description">' +
          'Projects you create or join show up here.</p>' +
          '<button class="button is-primary">New project</button>' +
          '</div>'
      );
    });

    it('renders only the root when none is given', () => {
      const { container } = render(<EmptyState />);
      expect(container.innerHTML).toBe('<div class="empty-state"></div>');
    });

    it.each([
      ['icon', { icon: 'folder-open' }, '.empty-state-indicator'],
      ['title', { title: 'No projects yet' }, 'h2.title.empty-state-title'],
      ['description', { description: 'Nothing here.' }, 'p'],
    ] as const)(
      'renders %s’s part alone, and no empty wrappers',
      (_name, props, selector) => {
        const { container } = render(<EmptyState {...props} />);
        const root = rootOf(container);
        expect(root.children).toHaveLength(1);
        expect(root.firstElementChild?.matches(selector)).toBe(true);
      }
    );

    it.each([null, false, true, ''])(
      'renders nothing for a shorthand prop given %p',
      value => {
        const { container } = render(
          <EmptyState
            icon={value as React.ReactNode}
            title={value as React.ReactNode}
            description={value as React.ReactNode}
          />
        );
        expect(rootOf(container).childNodes).toHaveLength(0);
      }
    );

    it('keeps the parts in a fixed order, whatever order the props are in', () => {
      const { container } = render(
        <EmptyState description="Second line" title="Heading" icon="star" />
      );
      expect(
        Array.from(rootOf(container).children).map(child => child.className)
      ).toEqual([
        'empty-state-indicator',
        'title empty-state-title',
        'empty-state-description',
      ]);
    });

    it('renders the same markup as the parts written as children', () => {
      const props = render(
        <EmptyState
          icon="folder-open"
          title="No projects yet"
          titleAs="h3"
          description="Projects you create or join show up here."
        >
          <EmptyState.Actions>
            <Button color="primary">New project</Button>
            <Button>Import</Button>
          </EmptyState.Actions>
        </EmptyState>
      );
      const parts = render(
        <EmptyState>
          <EmptyState.Indicator>
            <Icon name="folder-open" />
          </EmptyState.Indicator>
          <EmptyState.Title as="h3">No projects yet</EmptyState.Title>
          <EmptyState.Description>
            Projects you create or join show up here.
          </EmptyState.Description>
          <EmptyState.Actions>
            <Button color="primary">New project</Button>
            <Button>Import</Button>
          </EmptyState.Actions>
        </EmptyState>
      );
      expect(props.container.innerHTML).toBe(parts.container.innerHTML);
    });
  });

  describe('the children', () => {
    // Anything at all, so nothing about it gets special treatment: text, a
    // lone button, a list, a Fragment, a part written out of order, and a
    // null that renders nothing.
    const children = (
      <>
        Some text
        <Button>Clear search</Button>
        <ul>
          <li>Try another word</li>
        </ul>
        <>
          <Paragraph>In a Fragment</Paragraph>
        </>
        {null}
        <EmptyState.Indicator>
          <Icon name="star" />
        </EmptyState.Indicator>
        <Button>Second button</Button>
      </>
    );

    function Paragraph({ children }: { children: React.ReactNode }) {
      return <p>{children}</p>;
    }

    /** What `children` renders on its own, with no EmptyState around it. */
    const alone = () => render(<div>{children}</div>).container.firstChild;

    it('renders them exactly as written when no shorthand is given', () => {
      const { container } = render(<EmptyState>{children}</EmptyState>);
      expect(rootOf(container).innerHTML).toBe(
        (alone() as HTMLElement).innerHTML
      );
    });

    it('renders them exactly as written after the shorthand parts', () => {
      const { container } = render(
        <EmptyState icon="search" title="No results" description="Try again.">
          {children}
        </EmptyState>
      );
      const root = rootOf(container);
      const expected = (alone() as HTMLElement).innerHTML;
      const parts = Array.from(root.children)
        .slice(0, 3)
        .map(el => el.outerHTML)
        .join('');
      expect(root.innerHTML).toBe(parts + expected);
    });

    it('leaves two loose buttons loose, with no row of its own around them', () => {
      const { container } = render(
        <EmptyState title="No projects yet">
          <Button>One</Button>
          <Button>Two</Button>
        </EmptyState>
      );
      expect(
        Array.from(rootOf(container).children).map(child => child.tagName)
      ).toEqual(['H2', 'BUTTON', 'BUTTON']);
      expect(container.querySelector('.buttons')).toBeNull();
    });
  });

  describe('icon', () => {
    it('renders a string as an Icon by that name, in the default library', () => {
      const { container } = render(<EmptyState icon="inbox" />);
      const indicator = container.querySelector('.empty-state-indicator');
      expect(indicator?.innerHTML).toBe(
        '<span class="icon" aria-hidden="true"><i class="fas fa-inbox"></i></span>'
      );
    });

    it('draws a string from the icon library ConfigProvider sets', () => {
      const { container } = render(
        <ConfigProvider iconLibrary="mdi">
          <EmptyState icon="inbox" />
        </ConfigProvider>
      );
      expect(
        container.querySelector('.empty-state-indicator i')?.className
      ).toBe('mdi mdi-inbox');
    });

    it('renders any other node as given', () => {
      const svg = (
        <svg viewBox="0 0 16 16" data-testid="art">
          <circle cx="8" cy="8" r="6" />
        </svg>
      );
      const { container } = render(<EmptyState icon={svg} />);
      const indicator = container.querySelector('.empty-state-indicator');
      expect(indicator?.innerHTML).toBe(
        render(svg).container.innerHTML.replace(/^<div>|<\/div>$/g, '')
      );
      expect(indicator?.firstElementChild?.tagName.toLowerCase()).toBe('svg');
    });

    it('renders an Icon element with its own library and variant as given', () => {
      const { container } = render(
        <EmptyState
          icon={<Icon name="file" library="fa" variant="regular" />}
        />
      );
      expect(
        container.querySelector('.empty-state-indicator i')?.className
      ).toBe('far fa-file');
    });
  });

  describe('the heading level', () => {
    it('is an h2 by default', () => {
      render(<EmptyState title="No projects yet" />);
      expect(
        screen.getByRole('heading', { name: 'No projects yet' }).tagName
      ).toBe('H2');
    });

    it.each(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const)(
      'is %s with titleAs, at every size',
      level => {
        for (const size of ['small', 'normal', 'medium', 'large'] as const) {
          const { unmount } = render(
            <EmptyState title="No projects yet" titleAs={level} size={size} />
          );
          expect(
            screen.getByRole('heading', { name: 'No projects yet' }).tagName
          ).toBe(level.toUpperCase());
          unmount();
        }
      }
    );

    it('is whatever EmptyState.Title’s as says', () => {
      render(<EmptyState.Title as="h4">Nothing uploaded yet</EmptyState.Title>);
      expect(screen.getByRole('heading', { level: 4 })).toHaveClass(
        'title',
        'empty-state-title'
      );
    });

    it('never takes a size, which on Title would pick the tag', () => {
      render(
        // @ts-expect-error: the size comes from the EmptyState, not the title
        <EmptyState.Title size="5">Nothing here</EmptyState.Title>
      );
      const heading = screen.getByRole('heading', { name: 'Nothing here' });
      expect(heading.tagName).toBe('H2');
      expect(heading).not.toHaveClass('is-5');
      expect(heading).not.toHaveAttribute('size');
    });

    it('is always a heading, so a p falls back to an h2', () => {
      render(
        // @ts-expect-error: a title is always a heading
        <EmptyState.Title as="p">Nothing here</EmptyState.Title>
      );
      expect(screen.getByText('Nothing here').tagName).toBe('H2');
    });

    it('keeps textSize as the escape hatch for the title’s size', () => {
      render(<EmptyState.Title textSize="3">Nothing here</EmptyState.Title>);
      const heading = screen.getByRole('heading', { name: 'Nothing here' });
      expect(heading.tagName).toBe('H2');
      expect(heading).toHaveClass('is-size-3');
    });

    it('takes no isSpaced', () => {
      // The type is what refuses it, so Title's own margin stays out of the
      // gap between the parts.
      const props: React.ComponentProps<typeof EmptyStateTitle> = {
        // @ts-expect-error: the gap is the only space between the parts
        isSpaced: true,
      };
      expect(props).toBeDefined();
    });
  });

  describe('accessibility', () => {
    it('hides the indicator, and everything in it, from assistive tech', () => {
      const { container } = render(
        <EmptyState>
          <EmptyState.Indicator aria-hidden={false} data-testid="indicator">
            <Icon name="star" ariaLabel="Favourite" />
          </EmptyState.Indicator>
        </EmptyState>
      );
      expect(screen.getByTestId('indicator')).toHaveAttribute(
        'aria-hidden',
        'true'
      );
      expect(screen.queryByRole('img')).toBeNull();
      expect(container.querySelector('[role="img"]')).not.toBeNull();
    });

    it('adds no role, no aria-live and no tab stop anywhere', () => {
      const { container } = render(
        <EmptyState
          icon="search"
          title="No projects match"
          description="Check the spelling."
          color="info"
          size="large"
          align="left"
        >
          <EmptyState.Actions>
            <Button>Clear search</Button>
          </EmptyState.Actions>
        </EmptyState>
      );
      const root = rootOf(container);
      const own = [
        root,
        ...Array.from(root.querySelectorAll('[class*="empty-state"]')),
      ];
      for (const el of own) {
        expect(el).not.toHaveAttribute('role');
        expect(el).not.toHaveAttribute('aria-live');
        expect(el).not.toHaveAttribute('tabindex');
      }
      expect(attributesUnder(root)).not.toContain('aria-live');
      expect(screen.queryByRole('status')).toBeNull();
      expect(screen.queryByRole('region')).toBeNull();
    });
  });

  describe('size, align, color and variant', () => {
    it('adds none of their classes by default', () => {
      const { container } = render(<EmptyState title="Empty" />);
      expect(classesOf(rootOf(container))).toEqual(['empty-state']);
    });

    it.each([
      [{ size: 'small' }, 'is-small'],
      [{ size: 'medium' }, 'is-medium'],
      [{ size: 'large' }, 'is-large'],
      [{ align: 'left' }, 'is-left'],
      [{ color: 'primary' }, 'is-primary'],
      [{ color: 'link' }, 'is-link'],
      [{ color: 'info' }, 'is-info'],
      [{ color: 'success' }, 'is-success'],
      [{ color: 'warning' }, 'is-warning'],
      [{ color: 'danger' }, 'is-danger'],
      [{ variant: 'filled' }, 'is-filled'],
    ] as [Partial<EmptyStateProps>, string][])(
      '%p adds %s',
      (props, className) => {
        const { container } = render(<EmptyState {...props} />);
        expect(classesOf(rootOf(container))).toEqual([
          'empty-state',
          className,
        ]);
      }
    );

    it.each([
      [{ size: 'normal' }],
      [{ align: 'center' }],
      [{ variant: 'light' }],
    ] as [Partial<EmptyStateProps>][])(
      '%p is the default and adds nothing',
      props => {
        const { container } = render(<EmptyState {...props} />);
        expect(classesOf(rootOf(container))).toEqual(['empty-state']);
      }
    );

    it('combines them', () => {
      const { container } = render(
        <EmptyState
          size="large"
          align="left"
          color="success"
          variant="filled"
        />
      );
      expect(classesOf(rootOf(container)).sort()).toEqual(
        ['empty-state', 'is-filled', 'is-large', 'is-left', 'is-success'].sort()
      );
    });

    it('ignores values outside the types', () => {
      const props = {
        size: 'huge',
        align: 'right',
        color: 'black',
        variant: 'outlined',
      } as unknown as EmptyStateProps;
      const { container } = render(<EmptyState {...props} />);
      expect(classesOf(rootOf(container))).toEqual(['empty-state']);
    });

    it('keeps color off the text: it colors the indicator only', () => {
      const { container } = render(
        <EmptyState color="danger" title="Empty" description="Nothing here." />
      );
      const root = rootOf(container);
      expect(root.className).not.toMatch(/has-text|has-background/);
      expect(container.querySelector('.has-text-danger')).toBeNull();
    });

    it('refuses a color that isn’t one of the six, and a variant it doesn’t have', () => {
      render(
        <>
          {/* @ts-expect-error: the indicator takes the six Bulma colors */}
          <EmptyState color="dark" />
          {/* @ts-expect-error: light or filled */}
          <EmptyState variant="outlined" />
          {/* @ts-expect-error: no right alignment */}
          <EmptyState align="right" />
        </>
      );
      expect(document.querySelectorAll('.empty-state')).toHaveLength(3);
    });
  });

  describe('the root', () => {
    it('forwards its ref to the <div>', () => {
      const ref = createRef<HTMLDivElement>();
      const { container } = render(<EmptyState ref={ref} title="Empty" />);
      expect(ref.current).toBe(rootOf(container));
      expect(ref.current?.tagName).toBe('DIV');
    });

    it('applies the helper props, with className last', () => {
      const { container } = render(
        <EmptyState
          textColor="grey"
          bgColor="light"
          py="2"
          className="custom"
          title="Empty"
        />
      );
      const root = rootOf(container);
      expect(root).toHaveClass(
        'empty-state',
        'has-text-grey',
        'has-background-light',
        'py-2',
        'custom'
      );
      expect(root.className.split(' ').pop()).toBe('custom');
    });

    it('passes other attributes through, but keeps title as the heading', () => {
      const { container } = render(
        <EmptyState id="no-projects" data-testid="root" title="No projects" />
      );
      const root = rootOf(container);
      expect(root).toHaveAttribute('id', 'no-projects');
      expect(root).toHaveAttribute('data-testid', 'root');
      expect(root).not.toHaveAttribute('title');
    });
  });

  describe('the parts', () => {
    it('renders EmptyState.Indicator as a hidden <div> with helper props', () => {
      const { container } = render(
        <EmptyStateIndicator textColor="info" bgColor="white" className="x">
          <Icon name="star" />
        </EmptyStateIndicator>
      );
      const indicator = rootOf(container);
      expect(indicator.tagName).toBe('DIV');
      expect(indicator).toHaveAttribute('aria-hidden', 'true');
      expect(indicator).toHaveClass(
        'empty-state-indicator',
        'has-text-info',
        'has-background-white',
        'x'
      );
    });

    it('renders EmptyState.Description as a <p>, with helper props', () => {
      render(
        <EmptyStateDescription textColor="grey" className="x">
          Nothing here.
        </EmptyStateDescription>
      );
      const description = screen.getByText('Nothing here.');
      expect(description.tagName).toBe('P');
      expect(description).toHaveClass(
        'empty-state-description',
        'has-text-grey',
        'x'
      );
    });

    it('renders EmptyState.Actions as a Buttons row, sizes and addons included', () => {
      const { container } = render(
        <EmptyStateActions size="small" hasAddons className="x">
          <Button>One</Button>
          <Button>Two</Button>
        </EmptyStateActions>
      );
      const actions = rootOf(container);
      expect(actions.tagName).toBe('DIV');
      expect(classesOf(actions)).toEqual([
        'buttons',
        'has-addons',
        'are-small',
        'empty-state-actions',
        'x',
      ]);
      expect(actions.querySelectorAll('button')).toHaveLength(2);
    });

    it('leaves the actions’ alignment to the EmptyState', () => {
      render(
        <>
          {/* @ts-expect-error: the EmptyState centers the row */}
          <EmptyState.Actions isCentered>
            <Button>One</Button>
          </EmptyState.Actions>
          {/* @ts-expect-error: and puts it at the start of the line */}
          <EmptyState.Actions isRight>
            <Button>Two</Button>
          </EmptyState.Actions>
        </>
      );
      expect(document.querySelectorAll('.empty-state-actions')).toHaveLength(2);
    });

    it('renders EmptyState.Title with the helper props Title takes', () => {
      render(
        <EmptyStateTitle as="h3" textColor="primary" className="x">
          Nothing here
        </EmptyStateTitle>
      );
      expect(screen.getByRole('heading', { level: 3 })).toHaveClass(
        'title',
        'empty-state-title',
        'has-text-primary',
        'x'
      );
    });
  });
});

describe('Compound components', () => {
  test('EmptyState.Indicator is the exported EmptyStateIndicator', () => {
    expect(EmptyState.Indicator).toBe(EmptyStateIndicator);
  });

  test('EmptyState.Title is the exported EmptyStateTitle', () => {
    expect(EmptyState.Title).toBe(EmptyStateTitle);
  });

  test('EmptyState.Description is the exported EmptyStateDescription', () => {
    expect(EmptyState.Description).toBe(EmptyStateDescription);
  });

  test('EmptyState.Actions is the exported EmptyStateActions', () => {
    expect(EmptyState.Actions).toBe(EmptyStateActions);
  });

  test('renders the parts through the dot path and by name alike', () => {
    const dotted = render(
      <EmptyState>
        <EmptyState.Indicator>
          <Icon name="star" />
        </EmptyState.Indicator>
        <EmptyState.Title>Empty</EmptyState.Title>
        <EmptyState.Description>Nothing here.</EmptyState.Description>
        <EmptyState.Actions>
          <Button>Add</Button>
        </EmptyState.Actions>
      </EmptyState>
    );
    const named = render(
      <EmptyState>
        <EmptyStateIndicator>
          <Icon name="star" />
        </EmptyStateIndicator>
        <EmptyStateTitle>Empty</EmptyStateTitle>
        <EmptyStateDescription>Nothing here.</EmptyStateDescription>
        <EmptyStateActions>
          <Button>Add</Button>
        </EmptyStateActions>
      </EmptyState>
    );
    expect(dotted.container.innerHTML).toBe(named.container.innerHTML);
  });

  test('names each part for React’s dev tools', () => {
    expect(EmptyState.displayName).toBe('EmptyState');
    expect(EmptyState.Indicator.displayName).toBe('EmptyState.Indicator');
    expect(EmptyState.Title.displayName).toBe('EmptyState.Title');
    expect(EmptyState.Description.displayName).toBe('EmptyState.Description');
    expect(EmptyState.Actions.displayName).toBe('EmptyState.Actions');
  });
});

describe('class prefix', () => {
  it('prefixes every class under ConfigProvider classPrefix', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bestax-">
        <EmptyState
          icon="folder-open"
          title="No projects yet"
          description="Projects you create show up here."
          size="small"
          align="left"
          color="warning"
          variant="filled"
          textColor="grey"
        >
          <EmptyState.Actions size="small">
            <Button>New project</Button>
          </EmptyState.Actions>
        </EmptyState>
      </ConfigProvider>
    );
    const root = rootOf(container);
    expect(classesOf(root)).toEqual([
      'bestax-empty-state',
      'bestax-is-small',
      'bestax-is-left',
      'bestax-is-warning',
      'bestax-is-filled',
      'bestax-has-text-grey',
    ]);
    expect(
      container.querySelector('.bestax-empty-state-indicator')
    ).not.toBeNull();
    expect(container.querySelector('h2')).toHaveClass(
      'bestax-title',
      'bestax-empty-state-title'
    );
    expect(container.querySelector('p')).toHaveClass(
      'bestax-empty-state-description'
    );
    expect(container.querySelector('.bestax-empty-state-actions')).toHaveClass(
      'bestax-buttons',
      'bestax-are-small'
    );
    const unprefixed = Array.from(container.querySelectorAll('[class]'))
      .flatMap(el => Array.from(el.classList))
      .filter(name => !name.startsWith('bestax-'))
      .filter(name => !/^(fas|fa-[a-z-]+)$/.test(name));
    expect(unprefixed).toEqual([]);
  });
});

describe('server rendering', () => {
  const Empty: React.FC = () => (
    <EmptyState
      icon="search"
      title="No projects match “kraken”"
      titleAs="h3"
      description="Check the spelling, or clear the search."
      color="info"
      size="small"
    >
      <EmptyState.Actions>
        <Button>Clear search</Button>
        <Button color="primary">New project</Button>
      </EmptyState.Actions>
    </EmptyState>
  );

  /** The markup without the empty comments React's server puts between text. */
  const markup = (root: HTMLElement) => root.innerHTML.replace(/<!-- -->/g, '');

  it('renders the same markup on the server as on the client', () => {
    const server = document.createElement('div');
    server.innerHTML = renderToString(<Empty />);
    const { container } = render(<Empty />);
    expect(markup(server)).toBe(markup(container));
  });

  it('hydrates without a mismatch', async () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Empty />);
    document.body.appendChild(container);
    const before = container.innerHTML;

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let unmountRoot = () => {};
    try {
      await act(async () => {
        const root = hydrateRoot(container, <Empty />);
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
