import React, { createRef } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import {
  Timeline,
  TimelineItem,
  type TimelineItemProps,
  type TimelineProps,
} from '../Timeline';
import { Icon } from '../../elements/Icon';
import { ConfigProvider } from '../../helpers/Config';
import { visuallyHidden } from '../../helpers/statusRegion';

/** The class list of an element, as an array. */
const classesOf = (el: Element | null) => Array.from(el?.classList ?? []);

/** Every `<li>` the timeline in `container` renders. */
const itemsOf = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('li'));

/** Each item's state class, or `-` for none. */
const statesOf = (container: HTMLElement) =>
  itemsOf(container).map(
    li =>
      classesOf(li).find(name =>
        /^is-(completed|active|upcoming|pending)$/.test(name)
      ) ?? '-'
  );

/** Each item's title as a screen reader gets it: the words included. */
const titlesOf = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('.timeline-title')).map(
    title => title.textContent
  );

/**
 * The markup with each style attribute written the way the DOM writes it,
 * and without the empty comments React's server puts between text.
 */
const markup = (root: HTMLElement) => {
  const copy = root.cloneNode(true) as HTMLElement;
  copy.querySelectorAll<HTMLElement>('[style]').forEach(el => {
    el.setAttribute('style', el.style.cssText);
  });
  return copy.innerHTML.replace(/<!-- -->/g, '');
};

const Order: React.FC<Partial<TimelineProps>> = props => (
  <Timeline titleAs="h3" {...props}>
    <Timeline.Item
      title="Order placed"
      time="12 October, 09:30"
      dateTime="2026-10-12T09:30"
    />
    <Timeline.Item
      title="Packed"
      time="13 October, 14:05"
      dateTime="2026-10-13T14:05"
    />
    <Timeline.Item
      title="Shipped"
      time="14 October, 08:12"
      dateTime="2026-10-14T08:12"
    >
      Left the warehouse in Leeds.
    </Timeline.Item>
  </Timeline>
);

describe('Timeline', () => {
  describe('a record', () => {
    it('renders the issue’s order history exactly', () => {
      const { container } = render(
        <Timeline titleAs="h3">
          <Timeline.Item
            title="Delivered"
            time="16 October 2026, 11:40"
            dateTime="2026-10-16T11:40"
            color="success"
          >
            Signed for by A. Smith.
          </Timeline.Item>
          <Timeline.Item
            title="Order placed"
            time="12 October 2026, 09:30"
            dateTime="2026-10-12T09:30"
          />
        </Timeline>
      );
      expect(container.innerHTML).toBe(
        '<ol class="timeline" role="list">' +
          '<li class="timeline-item is-success">' +
          '<div class="timeline-marker" aria-hidden="true"></div>' +
          '<div class="timeline-content">' +
          '<h3 class="timeline-title">Delivered</h3>' +
          '<time class="timeline-time" datetime="2026-10-16T11:40">' +
          '16 October 2026, 11:40</time>' +
          'Signed for by A. Smith.</div></li>' +
          '<li class="timeline-item">' +
          '<div class="timeline-marker" aria-hidden="true"></div>' +
          '<div class="timeline-content">' +
          '<h3 class="timeline-title">Order placed</h3>' +
          '<time class="timeline-time" datetime="2026-10-12T09:30">' +
          '12 October 2026, 09:30</time></div></li>' +
          '</ol>'
      );
    });

    it('marks nothing: no state, no words and no aria-current', () => {
      const { container } = render(<Order />);
      expect(statesOf(container)).toEqual(['-', '-', '-']);
      expect(titlesOf(container)).toEqual([
        'Order placed',
        'Packed',
        'Shipped',
      ]);
      expect(container.querySelector('[aria-current]')).toBeNull();
      expect(container.querySelector('[style]')).toBeNull();
    });

    it('puts an aria-current passed to an item on its <li>', () => {
      const { container } = render(
        <Timeline>
          <Timeline.Item title="Then" />
          <Timeline.Item title="Now" aria-current="time" />
        </Timeline>
      );
      expect(itemsOf(container)[1]).toHaveAttribute('aria-current', 'time');
      expect(itemsOf(container)[0]).not.toHaveAttribute('aria-current');
    });

    it('renders an empty list with no children', () => {
      const { container } = render(<Timeline />);
      expect(container.innerHTML).toBe(
        '<ol class="timeline" role="list"></ol>'
      );
    });
  });

  describe('an item', () => {
    it('renders the marker and then the content, the title, time and children in order', () => {
      const { container } = render(
        <Timeline>
          <Timeline.Item title="Shipped" time="14 October">
            <p>Left the warehouse.</p>
            <p>Tracking number 1Z999.</p>
          </Timeline.Item>
        </Timeline>
      );
      const li = itemsOf(container)[0];
      expect(Array.from(li.children).map(child => child.className)).toEqual([
        'timeline-marker',
        'timeline-content',
      ]);
      expect(li.querySelector('.timeline-content')?.innerHTML).toBe(
        '<h2 class="timeline-title">Shipped</h2>' +
          '<span class="timeline-time">14 October</span>' +
          '<p>Left the warehouse.</p><p>Tracking number 1Z999.</p>'
      );
    });

    it('renders the time in a <time> with dateTime and a <span> without', () => {
      const { container } = render(
        <Timeline>
          <Timeline.Item time="14 October 2026" dateTime="2026-10-14" />
          <Timeline.Item time="2 hours ago" />
        </Timeline>
      );
      const [machine, words] = itemsOf(container).map(li =>
        li.querySelector('.timeline-time')
      );
      expect(machine?.tagName).toBe('TIME');
      expect(machine).toHaveAttribute('datetime', '2026-10-14');
      expect(words?.tagName).toBe('SPAN');
      expect(words).not.toHaveAttribute('datetime');
    });

    it.each([
      ['undefined', undefined],
      ['null', null],
      ['false', false],
      ['an empty string', ''],
    ])('renders no title and no time for %s', (_label, value) => {
      const { container } = render(
        <Timeline>
          <Timeline.Item
            title={value as React.ReactNode}
            time={value as React.ReactNode}
            dateTime="2026-10-14"
          >
            Body
          </Timeline.Item>
        </Timeline>
      );
      expect(container.querySelector('.timeline-content')?.innerHTML).toBe(
        'Body'
      );
    });

    it('renders outside a Timeline as a record item with an h2 title', () => {
      const { container } = render(
        <ol>
          <TimelineItem title="Alone" time="Today" />
        </ol>
      );
      const li = itemsOf(container)[0];
      expect(classesOf(li)).toEqual(['timeline-item']);
      expect(li.querySelector('h2')).toHaveTextContent('Alone');
      expect(li).not.toHaveAttribute('aria-current');
    });

    it('takes helper props and other attributes, with className last, but keeps title for the event', () => {
      const ref = createRef<HTMLLIElement>();
      const { container } = render(
        <Timeline>
          <Timeline.Item
            ref={ref}
            title="Shipped"
            className="custom"
            textColor="grey"
            bgColor="light"
            p="2"
            id="shipped"
            data-testid="item"
          />
        </Timeline>
      );
      const li = screen.getByTestId('item');
      expect(ref.current).toBe(li);
      expect(li.tagName).toBe('LI');
      expect(li).toHaveAttribute('id', 'shipped');
      expect(li).not.toHaveAttribute('title');
      expect(classesOf(li)).toEqual([
        'timeline-item',
        'has-text-grey',
        'has-background-light',
        'p-2',
        'custom',
      ]);
      expect(container.querySelector('h2')).toHaveTextContent('Shipped');
    });
  });

  describe('titleAs', () => {
    it('is an h2 by default', () => {
      const { container } = render(
        <Timeline>
          <Timeline.Item title="Shipped" />
        </Timeline>
      );
      expect(container.querySelector('.timeline-title')?.tagName).toBe('H2');
    });

    it.each(['h2', 'h3', 'h4', 'h5', 'h6', 'p'] as const)(
      'renders every title as %s',
      level => {
        const { container } = render(
          <Timeline titleAs={level} pending="Next">
            <Timeline.Item title="One" />
            <Timeline.Item title="Two" />
          </Timeline>
        );
        const tags = Array.from(
          container.querySelectorAll('.timeline-title')
        ).map(title => title.tagName.toLowerCase());
        expect(tags).toEqual([level, level, level]);
      }
    );

    it('falls back to an h2 for anything outside the type', () => {
      const { container } = render(
        <Timeline titleAs={'h1' as TimelineProps['titleAs']}>
          <Timeline.Item title="Shipped" />
        </Timeline>
      );
      expect(container.querySelector('.timeline-title')?.tagName).toBe('H2');
    });
  });

  describe('icon', () => {
    it('renders a string as an Icon by that name, in the default library, and adds is-icon', () => {
      const { container } = render(
        <Timeline>
          <Timeline.Item title="Shipped" icon="truck" />
        </Timeline>
      );
      const marker = container.querySelector('.timeline-marker');
      expect(classesOf(marker)).toEqual(['timeline-marker', 'is-icon']);
      expect(marker?.innerHTML).toBe(
        '<span class="icon" aria-hidden="true"><i class="fas fa-truck"></i></span>'
      );
    });

    it('draws a string from the icon library ConfigProvider sets', () => {
      const { container } = render(
        <ConfigProvider iconLibrary="mdi">
          <Timeline>
            <Timeline.Item icon="truck" />
          </Timeline>
        </ConfigProvider>
      );
      expect(container.querySelector('.timeline-marker i')?.className).toBe(
        'mdi mdi-truck'
      );
    });

    it('renders any other node as given, and adds is-icon', () => {
      const { container } = render(
        <Timeline>
          <Timeline.Item
            icon={<Icon name="mobile" variant="solid" ariaLabel="Phone" />}
          />
          <Timeline.Item icon={<svg data-testid="art" />} />
        </Timeline>
      );
      const [first, second] = Array.from(
        container.querySelectorAll('.timeline-marker')
      );
      expect(classesOf(first)).toContain('is-icon');
      expect(first.querySelector('i')?.className).toBe('fas fa-mobile');
      expect(classesOf(second)).toContain('is-icon');
      expect(second.firstElementChild?.tagName.toLowerCase()).toBe('svg');
    });

    it('leaves a dot without one, and keeps every marker hidden', () => {
      const { container } = render(
        <Timeline active={0}>
          <Timeline.Item title="Dot" icon={false} />
          <Timeline.Item
            title="Labelled icon"
            icon={<Icon name="star" ariaLabel="Starred" />}
          />
        </Timeline>
      );
      const markers = Array.from(
        container.querySelectorAll('.timeline-marker')
      );
      expect(classesOf(markers[0])).toEqual(['timeline-marker']);
      expect(markers[0].innerHTML).toBe('');
      for (const marker of markers) {
        expect(marker).toHaveAttribute('aria-hidden', 'true');
      }
      // Hidden with everything in it, the icon's own label included.
      expect(screen.queryByRole('img')).toBeNull();
      expect(container.querySelector('[role="img"]')).not.toBeNull();
    });
  });

  describe('color and align', () => {
    it('adds neither class by default', () => {
      const { container } = render(<Order />);
      expect(classesOf(container.querySelector('ol'))).toEqual(['timeline']);
    });

    it.each([
      ['end', 'is-end'],
      ['alternate', 'is-alternate'],
    ] as const)('adds a class for align="%s"', (align, name) => {
      const { container } = render(<Order align={align} />);
      expect(classesOf(container.querySelector('ol'))).toEqual([
        'timeline',
        name,
      ]);
    });

    it('adds is-<color> to the root and to an item, so the item’s is its own', () => {
      const { container } = render(
        <Timeline color="primary">
          <Timeline.Item title="One" />
          <Timeline.Item title="Two" color="info" />
        </Timeline>
      );
      expect(classesOf(container.querySelector('ol'))).toEqual([
        'timeline',
        'is-primary',
      ]);
      expect(itemsOf(container).map(classesOf)).toEqual([
        ['timeline-item'],
        ['timeline-item', 'is-info'],
      ]);
    });

    it('ignores a color or an align outside the types', () => {
      const { container } = render(
        <Timeline
          color={'dark' as TimelineProps['color']}
          align={'center' as TimelineProps['align']}
        >
          <Timeline.Item
            title="One"
            color={'grey' as TimelineItemProps['color']}
          />
        </Timeline>
      );
      expect(classesOf(container.querySelector('ol'))).toEqual(['timeline']);
      expect(classesOf(itemsOf(container)[0])).toEqual(['timeline-item']);
    });
  });

  describe('progress with active', () => {
    it('marks the items before it completed, the one at it current and the rest upcoming', () => {
      const { container } = render(
        <Timeline active={1}>
          <Timeline.Item title="Order placed" />
          <Timeline.Item title="Shipped" />
          <Timeline.Item title="Delivered" />
        </Timeline>
      );
      expect(statesOf(container)).toEqual([
        'is-completed',
        'is-active',
        'is-upcoming',
      ]);
      expect(titlesOf(container)).toEqual([
        'Order placed completed',
        'Shipped',
        'Delivered upcoming',
      ]);
      expect(
        itemsOf(container).map(li => li.getAttribute('aria-current'))
      ).toEqual([null, 'step', null]);
    });

    it('hides the words with inline styles, after a space, at the end of the title', () => {
      const { container } = render(
        <Timeline active={1}>
          <Timeline.Item title="Packed" />
          <Timeline.Item title="Shipped" />
        </Timeline>
      );
      const title = container.querySelector('.timeline-title');
      const words = title?.lastElementChild as HTMLElement;
      expect(words.tagName).toBe('SPAN');
      expect(words.textContent).toBe(' completed');
      expect(words).toHaveStyle(visuallyHidden as Record<string, unknown>);
      expect(words.className).toBe('');
      // The heading's name is the title and the words.
      expect(
        screen.getByRole('heading', { name: 'Packed completed' })
      ).toBeInTheDocument();
      // The current item gets none.
      expect(itemsOf(container)[1].querySelector('[style]')).toBeNull();
    });

    it('puts the words first in the content when an item has no title', () => {
      const { container } = render(
        <Timeline active={1}>
          <Timeline.Item time="12 October" />
          <Timeline.Item title="Shipped" />
        </Timeline>
      );
      const content = container.querySelector('.timeline-content');
      expect(content?.firstElementChild?.textContent).toBe(' completed');
      expect(content?.firstElementChild).toHaveStyle(
        visuallyHidden as Record<string, unknown>
      );
      expect(content?.lastElementChild).toHaveClass('timeline-time');
    });

    it('reads the order example as the issue writes it', () => {
      const { container } = render(
        <Order active={2} pending="Out for delivery" />
      );
      expect(statesOf(container)).toEqual([
        'is-completed',
        'is-completed',
        'is-active',
        'is-pending',
      ]);
      const list = screen.getByRole('list');
      expect(within(list).getAllByRole('listitem')).toHaveLength(4);
      expect(
        within(list)
          .getAllByRole('heading', { level: 3 })
          .map(heading => heading.textContent)
      ).toEqual([
        'Order placed completed',
        'Packed completed',
        'Shipped',
        'Out for delivery in progress',
      ]);
    });

    it('marks every item upcoming at -1', () => {
      const { container } = render(<Order active={-1} />);
      expect(statesOf(container)).toEqual([
        'is-upcoming',
        'is-upcoming',
        'is-upcoming',
      ]);
      expect(container.querySelector('[aria-current]')).toBeNull();
    });

    it('marks every item completed past the last', () => {
      const { container } = render(<Order active={3} />);
      expect(statesOf(container)).toEqual([
        'is-completed',
        'is-completed',
        'is-completed',
      ]);
      expect(container.querySelector('[aria-current]')).toBeNull();
    });

    it.each([
      [1.5, ['is-completed', 'is-active', 'is-upcoming']],
      [2.99, ['is-completed', 'is-completed', 'is-active']],
      [-0.5, ['is-upcoming', 'is-upcoming', 'is-upcoming']],
    ])(
      'counts a fraction, %s, as the item it has reached',
      (active, states) => {
        // An app that computes the index can land between two items, and
        // progress with no current item would leave aria-current on nothing.
        const { container } = render(<Order active={active} />);
        expect(statesOf(container)).toEqual(states);
        expect(
          container.querySelectorAll('[aria-current="step"]')
        ).toHaveLength(states.includes('is-active') ? 1 : 0);
      }
    );

    it('keeps no other aria-current an item was given', () => {
      const { container } = render(
        <Timeline active={1}>
          <Timeline.Item title="One" aria-current="time" />
          <Timeline.Item title="Two" aria-current="false" />
          <Timeline.Item title="Three" aria-current="date" />
        </Timeline>
      );
      expect(
        itemsOf(container).map(li => li.getAttribute('aria-current'))
      ).toEqual([null, 'step', null]);
    });

    it('takes the words in the app’s language', () => {
      const { container } = render(
        <Timeline
          active={1}
          pending="En livraison"
          completedLabel="terminé"
          upcomingLabel="à venir"
          pendingLabel="en cours"
        >
          <Timeline.Item title="Commande passée" />
          <Timeline.Item title="Expédiée" />
          <Timeline.Item title="Livrée" />
        </Timeline>
      );
      expect(titlesOf(container)).toEqual([
        'Commande passée terminé',
        'Expédiée',
        'Livrée à venir',
        'En livraison en cours',
      ]);
    });

    it('counts the items in Fragments and arrays one by one', () => {
      const shipped = ['Packed', 'Shipped'];
      const { container } = render(
        <Timeline active={2}>
          <>
            <Timeline.Item title="Order placed" />
          </>
          {shipped.map(title => (
            <Timeline.Item key={title} title={title} />
          ))}
          {null}
          {false}
          <>
            <>
              <Timeline.Item title="Delivered" />
            </>
          </>
        </Timeline>
      );
      expect(statesOf(container)).toEqual([
        'is-completed',
        'is-completed',
        'is-active',
        'is-upcoming',
      ]);
    });

    it('gives an item wrapped in a component of the app’s own its state', () => {
      const Stage: React.FC<{ name: string }> = ({ name }) => (
        <Timeline.Item title={name} time="Today" />
      );
      const { container } = render(
        <Timeline active={1}>
          <Stage name="Order placed" />
          <Stage name="Shipped" />
          <Stage name="Delivered" />
        </Timeline>
      );
      expect(statesOf(container)).toEqual([
        'is-completed',
        'is-active',
        'is-upcoming',
      ]);
      expect(itemsOf(container)[1]).toHaveAttribute('aria-current', 'step');
    });

    it('counts a component that renders nothing, and a text child, as items too', () => {
      const Nothing: React.FC = () => null;
      const { container } = render(
        <Timeline active={2}>
          <Nothing />
          {0}
          <Timeline.Item title="Third" />
        </Timeline>
      );
      expect(statesOf(container)).toEqual(['is-active']);
    });

    it('leaves a timeline nested in an item’s body to its own root', () => {
      const { container } = render(
        <Timeline active={0}>
          <Timeline.Item title="Outer">
            <Timeline titleAs="h4">
              <Timeline.Item title="Inner" />
            </Timeline>
          </Timeline.Item>
        </Timeline>
      );
      const inner = container.querySelector('ol ol li');
      expect(classesOf(inner)).toEqual(['timeline-item']);
      expect(inner).not.toHaveAttribute('aria-current');
      expect(inner?.querySelector('.timeline-title')?.tagName).toBe('H4');
    });

    it('keeps a moved item’s node, keyed by its own key', () => {
      const Feed: React.FC<{ names: string[] }> = ({ names }) => (
        <Timeline>
          {names.map(name => (
            <Timeline.Item key={name} title={name} />
          ))}
        </Timeline>
      );
      const { container, rerender } = render(<Feed names={['Two', 'One']} />);
      const two = itemsOf(container)[0];
      rerender(<Feed names={['Three', 'Two', 'One']} />);
      expect(itemsOf(container)[1]).toBe(two);
    });
  });

  describe('pending', () => {
    it('adds a last item after the children, with its words and no aria-current', () => {
      const { container } = render(
        <Order active={2} pending="Out for delivery" />
      );
      const last = itemsOf(container).pop() as HTMLLIElement;
      expect(last.outerHTML.replace(/ style="[^"]*"/, '')).toBe(
        '<li class="timeline-item is-pending">' +
          '<div class="timeline-marker" aria-hidden="true"></div>' +
          '<div class="timeline-content">' +
          '<h3 class="timeline-title">Out for delivery' +
          '<span> in progress</span></h3></div></li>'
      );
    });

    it('renders its item without active, and leaves the rest a record', () => {
      const { container } = render(
        <Timeline pending="Processing">
          <Timeline.Item title="Received" aria-current="time" />
        </Timeline>
      );
      expect(statesOf(container)).toEqual(['-', 'is-pending']);
      expect(titlesOf(container)).toEqual([
        'Received',
        'Processing in progress',
      ]);
      expect(itemsOf(container)[0]).toHaveAttribute('aria-current', 'time');
      expect(itemsOf(container)[1]).not.toHaveAttribute('aria-current');
    });

    it.each([
      ['null', null],
      ['false', false],
      ['an empty string', ''],
    ])('renders nothing for %s', (_label, value) => {
      const { container } = render(
        <Order active={1} pending={value as React.ReactNode} />
      );
      expect(itemsOf(container)).toHaveLength(3);
    });
  });

  describe('the root', () => {
    it('forwards its ref to the <ol>', () => {
      const ref = createRef<HTMLOListElement>();
      const { container } = render(
        <Timeline ref={ref}>
          <Timeline.Item title="One" />
        </Timeline>
      );
      expect(ref.current).toBe(container.querySelector('ol'));
    });

    it('applies the helper props, with className last, and passes other attributes through', () => {
      const { container } = render(
        <Order
          className="custom"
          textSize="7"
          textColor="grey"
          bgColor="light"
          aria-label="Order history"
          id="history"
        />
      );
      const ol = container.querySelector('ol') as HTMLOListElement;
      expect(classesOf(ol)).toEqual([
        'timeline',
        'has-text-grey',
        'has-background-light',
        'is-size-7',
        'custom',
      ]);
      expect(ol).toHaveAttribute('aria-label', 'Order history');
      expect(ol).toHaveAttribute('id', 'history');
    });

    it('is always a list: a role passed in never wins', () => {
      const props = { role: 'feed' } as unknown as TimelineProps;
      const { container } = render(<Order {...props} />);
      expect(container.querySelector('ol')).toHaveAttribute('role', 'list');
    });

    it('adds no tab stop, no live region and no handlers', () => {
      const { container } = render(
        <Order active={1} pending="Out for delivery" align="alternate" />
      );
      const attributes = [
        container.querySelector('ol') as Element,
        ...Array.from(container.querySelectorAll('ol *')),
      ].flatMap(el => Array.from(el.attributes).map(a => a.name));
      expect(
        attributes.filter(name =>
          /^(tabindex|aria-live|aria-busy|on)/.test(name)
        )
      ).toEqual([]);
    });
  });
});

describe('Compound components', () => {
  test('Timeline.Item is the exported TimelineItem', () => {
    expect(Timeline.Item).toBe(TimelineItem);
  });

  test('renders the items through the dot path and by name alike', () => {
    const dotted = render(
      <Timeline active={0}>
        <Timeline.Item title="One" time="Today" icon="star" />
        <Timeline.Item title="Two" />
      </Timeline>
    );
    const named = render(
      <Timeline active={0}>
        <TimelineItem title="One" time="Today" icon="star" />
        <TimelineItem title="Two" />
      </Timeline>
    );
    expect(dotted.container.innerHTML).toBe(named.container.innerHTML);
  });

  test('names each part for React’s dev tools', () => {
    expect(Timeline.displayName).toBe('Timeline');
    expect(Timeline.Item.displayName).toBe('Timeline.Item');
  });
});

describe('class prefix', () => {
  it('prefixes every class under ConfigProvider classPrefix', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bestax-">
        <Timeline
          align="alternate"
          color="success"
          active={1}
          pending="Out for delivery"
          textSize="6"
        >
          <Timeline.Item
            title="Order placed"
            time="12 October"
            dateTime="2026-10-12"
            icon="box"
            color="info"
          />
          <Timeline.Item title="Shipped" time="14 October" />
          <Timeline.Item title="Delivered" />
        </Timeline>
      </ConfigProvider>
    );
    expect(classesOf(container.querySelector('ol'))).toEqual([
      'bestax-timeline',
      'bestax-is-alternate',
      'bestax-is-success',
      'bestax-is-size-6',
    ]);
    expect(itemsOf(container).map(classesOf)).toEqual([
      ['bestax-timeline-item', 'bestax-is-completed', 'bestax-is-info'],
      ['bestax-timeline-item', 'bestax-is-active'],
      ['bestax-timeline-item', 'bestax-is-upcoming'],
      ['bestax-timeline-item', 'bestax-is-pending'],
    ]);
    expect(
      classesOf(container.querySelector('.bestax-timeline-marker'))
    ).toEqual(['bestax-timeline-marker', 'bestax-is-icon']);
    for (const name of ['content', 'title', 'time']) {
      expect(
        container.querySelector(`.bestax-timeline-${name}`)
      ).not.toBeNull();
    }
    const unprefixed = Array.from(container.querySelectorAll('[class]'))
      .flatMap(el => Array.from(el.classList))
      .filter(name => !name.startsWith('bestax-'))
      .filter(name => !/^(fas|fa-[a-z-]+)$/.test(name));
    expect(unprefixed).toEqual([]);
  });
});

describe('server rendering', () => {
  const Tracker: React.FC = () => (
    <Timeline titleAs="h3" active={2} pending="Out for delivery" color="info">
      <>
        <Timeline.Item
          title="Order placed"
          time="12 October, 09:30"
          dateTime="2026-10-12T09:30"
          icon="box"
        />
        <Timeline.Item title="Packed" time="13 October" />
      </>
      {['Shipped', 'Delivered'].map(title => (
        <Timeline.Item key={title} title={title}>
          A line about it.
        </Timeline.Item>
      ))}
    </Timeline>
  );

  it('renders the states on the server, Fragments and arrays counted', () => {
    const server = document.createElement('div');
    server.innerHTML = renderToStaticMarkup(<Tracker />);
    expect(statesOf(server)).toEqual([
      'is-completed',
      'is-completed',
      'is-active',
      'is-upcoming',
      'is-pending',
    ]);
    expect(titlesOf(server)).toEqual([
      'Order placed completed',
      'Packed completed',
      'Shipped',
      'Delivered upcoming',
      'Out for delivery in progress',
    ]);
    expect(itemsOf(server).map(li => li.getAttribute('aria-current'))).toEqual([
      null,
      null,
      'step',
      null,
      null,
    ]);
  });

  it('renders the same markup on the server as on the client', () => {
    const server = document.createElement('div');
    server.innerHTML = renderToString(<Tracker />);
    const { container } = render(<Tracker />);
    expect(markup(server)).toBe(markup(container));
  });

  it('hydrates without a mismatch', async () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Tracker />);
    document.body.appendChild(container);
    const before = container.innerHTML;

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let unmountRoot = () => {};
    try {
      await act(async () => {
        const root = hydrateRoot(container, <Tracker />);
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
