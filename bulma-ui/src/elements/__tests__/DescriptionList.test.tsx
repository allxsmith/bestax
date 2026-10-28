import React, { createRef } from 'react';
import { act, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import {
  DescriptionList,
  DescriptionListItem,
  DescriptionListLabel,
  DescriptionListValue,
  type DescriptionListOrientation,
  type DescriptionListProps,
} from '../DescriptionList';
import { ConfigProvider } from '../../helpers/Config';

/** The class list of an element, as an array. */
const classesOf = (el: Element | null) => Array.from(el?.classList ?? []);

/** The parts of each item, as tag and text: `dt Order`, `dd #1234`. */
const partsOf = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('dl > div')).map(div =>
    Array.from(div.children).map(
      el => `${el.localName} ${el.textContent ?? ''}`
    )
  );

/** The markup without the empty comments React's server puts between text. */
const markup = (root: HTMLElement) => root.innerHTML.replace(/<!-- -->/g, '');

const Order: React.FC<Partial<DescriptionListProps>> = props => (
  <DescriptionList {...props}>
    <DescriptionList.Item label="Order" value="#1234" />
    <DescriptionList.Item label="Placed on" value="14 October 2026" />
    <DescriptionList.Item label="Total" value="$86.40" />
  </DescriptionList>
);

describe('DescriptionList', () => {
  describe('markup', () => {
    it('is a <dl> with a <div> per item, a <dt> per label and a <dd> per value', () => {
      const { container } = render(<Order />);
      expect(container.innerHTML).toBe(
        '<dl class="description-list">' +
          '<div class="description-list-item">' +
          '<dt class="description-list-label">Order</dt>' +
          '<dd class="description-list-value">#1234</dd></div>' +
          '<div class="description-list-item">' +
          '<dt class="description-list-label">Placed on</dt>' +
          '<dd class="description-list-value">14 October 2026</dd></div>' +
          '<div class="description-list-item">' +
          '<dt class="description-list-label">Total</dt>' +
          '<dd class="description-list-value">$86.40</dd></div>' +
          '</dl>'
      );
    });

    it('adds no roles, so the parts keep their own: terms and definitions', () => {
      const { container } = render(<Order />);
      expect(container.querySelectorAll('[role]')).toHaveLength(0);
      expect(screen.getAllByRole('term').map(t => t.textContent)).toEqual([
        'Order',
        'Placed on',
        'Total',
      ]);
      expect(screen.getAllByRole('definition')).toHaveLength(3);
    });

    it('passes aria-labelledby to the <dl>, to name it by the heading above', () => {
      const { container } = render(
        <>
          <h2 id="order-heading">Order details</h2>
          <Order aria-labelledby="order-heading" />
        </>
      );
      const id = container.querySelector('dl')?.getAttribute('aria-labelledby');
      expect(document.getElementById(id ?? '')).toHaveTextContent(
        'Order details'
      );
    });

    it('renders an empty list with no children', () => {
      const { container } = render(<DescriptionList />);
      expect(container.innerHTML).toBe('<dl class="description-list"></dl>');
    });
  });

  describe('an item', () => {
    it('renders label before the children and value after them', () => {
      const { container } = render(
        <DescriptionList>
          <DescriptionList.Item label="Tags">
            <DescriptionList.Value>Gift</DescriptionList.Value>
            <DescriptionList.Value>Priority</DescriptionList.Value>
          </DescriptionList.Item>
          <DescriptionList.Item value="Partner warehouse">
            <DescriptionList.Label>Fulfilment</DescriptionList.Label>
          </DescriptionList.Item>
          <DescriptionList.Item label="Name" value="Ada">
            <DescriptionList.Value>Lovelace</DescriptionList.Value>
          </DescriptionList.Item>
        </DescriptionList>
      );
      expect(partsOf(container)).toEqual([
        ['dt Tags', 'dd Gift', 'dd Priority'],
        ['dt Fulfilment', 'dd Partner warehouse'],
        ['dt Name', 'dd Lovelace', 'dd Ada'],
      ]);
    });

    it('takes several labels for one value', () => {
      const { container } = render(
        <DescriptionList>
          <DescriptionList.Item value="Ada Lovelace">
            <DescriptionList.Label>Author</DescriptionList.Label>
            <DescriptionList.Label>Writer</DescriptionList.Label>
          </DescriptionList.Item>
        </DescriptionList>
      );
      expect(partsOf(container)).toEqual([
        ['dt Author', 'dt Writer', 'dd Ada Lovelace'],
      ]);
    });

    it('renders nothing for undefined, null, a boolean or an empty string, and renders 0', () => {
      const { container } = render(
        <DescriptionList>
          <DescriptionList.Item label="Undefined" value={undefined} />
          <DescriptionList.Item label="Null" value={null} />
          <DescriptionList.Item label="False" value={false} />
          <DescriptionList.Item label="True" value={true} />
          <DescriptionList.Item label="Empty" value="" />
          <DescriptionList.Item label="Zero" value={0} />
          <DescriptionList.Item label={null} value="No label" />
        </DescriptionList>
      );
      expect(partsOf(container)).toEqual([
        ['dt Undefined'],
        ['dt Null'],
        ['dt False'],
        ['dt True'],
        ['dt Empty'],
        ['dt Zero', 'dd 0'],
        ['dd No label'],
      ]);
    });

    it('takes any node as a label or a value', () => {
      render(
        <DescriptionList>
          <DescriptionList.Item
            label={<abbr title="Stock keeping unit">SKU</abbr>}
            value={<a href="/items/42">BX-42</a>}
          />
        </DescriptionList>
      );
      expect(screen.getByRole('term')).toContainHTML(
        '<abbr title="Stock keeping unit">SKU</abbr>'
      );
      expect(screen.getByRole('link', { name: 'BX-42' })).toHaveAttribute(
        'href',
        '/items/42'
      );
    });
  });

  describe('orientation', () => {
    const viewports = [
      ['orientationMobile', 'mobile'],
      ['orientationTablet', 'tablet'],
      ['orientationDesktop', 'desktop'],
      ['orientationWidescreen', 'widescreen'],
      ['orientationFullhd', 'fullhd'],
    ] as const;

    it('adds no class without one, leaving the stylesheet’s responsive default', () => {
      const { container } = render(<Order />);
      expect(classesOf(container.querySelector('dl'))).toEqual([
        'description-list',
      ]);
    });

    it.each(['horizontal', 'vertical'] as const)(
      'adds is-%s for orientation, at every width',
      orientation => {
        const { container } = render(<Order orientation={orientation} />);
        expect(classesOf(container.querySelector('dl'))).toEqual([
          'description-list',
          `is-${orientation}`,
        ]);
      }
    );

    it.each(viewports)('adds is-<orientation>-%s for %s', (prop, viewport) => {
      for (const orientation of ['horizontal', 'vertical'] as const) {
        const { container, unmount } = render(
          <Order {...{ [prop]: orientation }} />
        );
        expect(classesOf(container.querySelector('dl'))).toEqual([
          'description-list',
          `is-${orientation}-${viewport}`,
        ]);
        unmount();
      }
    });

    it('adds a class for each one given, together', () => {
      const { container } = render(
        <Order
          orientation="vertical"
          orientationMobile="vertical"
          orientationTablet="horizontal"
          orientationDesktop="vertical"
          orientationWidescreen="horizontal"
          orientationFullhd="vertical"
        />
      );
      expect(classesOf(container.querySelector('dl'))).toEqual([
        'description-list',
        'is-vertical',
        'is-vertical-mobile',
        'is-horizontal-tablet',
        'is-vertical-desktop',
        'is-horizontal-widescreen',
        'is-vertical-fullhd',
      ]);
    });

    it('ignores an orientation outside the type', () => {
      const odd = 'diagonal' as DescriptionListOrientation;
      const { container } = render(
        <Order orientation={odd} orientationTablet={odd} />
      );
      expect(classesOf(container.querySelector('dl'))).toEqual([
        'description-list',
      ]);
    });
  });

  describe('hasDividers', () => {
    it('adds has-dividers', () => {
      const { container } = render(<Order hasDividers />);
      expect(classesOf(container.querySelector('dl'))).toEqual([
        'description-list',
        'has-dividers',
      ]);
    });
  });

  describe('props on each part', () => {
    it('puts the helper props, className, other attributes and ref on the <dl>', () => {
      const ref = createRef<HTMLDListElement>();
      const { container } = render(
        <DescriptionList
          ref={ref}
          className="custom"
          textSize="7"
          textColor="danger"
          bgColor="light"
          id="summary"
          data-testid="summary"
        >
          <DescriptionList.Item label="Order" value="#1234" />
        </DescriptionList>
      );
      const dl = container.querySelector('dl') as HTMLDListElement;
      expect(ref.current).toBe(dl);
      expect(classesOf(dl)).toEqual([
        'description-list',
        'has-text-danger',
        'has-background-light',
        'is-size-7',
        'custom',
      ]);
      expect(dl).toHaveAttribute('id', 'summary');
      expect(dl).toHaveAttribute('data-testid', 'summary');
    });

    it('puts them on an item’s <div>', () => {
      const ref = createRef<HTMLDivElement>();
      const { container } = render(
        <DescriptionList>
          <DescriptionList.Item
            ref={ref}
            label="Order"
            value="#1234"
            className="custom"
            mt="2"
            textColor="grey"
            bgColor="white"
            data-row="order"
          />
        </DescriptionList>
      );
      const div = container.querySelector('dl > div') as HTMLDivElement;
      expect(ref.current).toBe(div);
      expect(classesOf(div)).toEqual([
        'description-list-item',
        'has-text-grey',
        'has-background-white',
        'mt-2',
        'custom',
      ]);
      expect(div).toHaveAttribute('data-row', 'order');
    });

    it('puts them on a label’s <dt> and a value’s <dd>', () => {
      const labelRef = createRef<HTMLElement>();
      const valueRef = createRef<HTMLElement>();
      const { container } = render(
        <DescriptionList>
          <DescriptionList.Item>
            <DescriptionList.Label
              ref={labelRef}
              className="label"
              textWeight="semibold"
              textColor="dark"
              bgColor="light"
              id="total-label"
            >
              Total
            </DescriptionList.Label>
            <DescriptionList.Value
              ref={valueRef}
              className="value"
              textAlign="right"
              textColor="success"
              bgColor="white"
              aria-describedby="total-label"
            >
              $86.40
            </DescriptionList.Value>
          </DescriptionList.Item>
        </DescriptionList>
      );
      const dt = container.querySelector('dt') as HTMLElement;
      const dd = container.querySelector('dd') as HTMLElement;
      expect(labelRef.current).toBe(dt);
      expect(valueRef.current).toBe(dd);
      expect(classesOf(dt)).toEqual([
        'description-list-label',
        'has-text-dark',
        'has-background-light',
        'has-text-weight-semibold',
        'label',
      ]);
      expect(classesOf(dd)).toEqual([
        'description-list-value',
        'has-text-success',
        'has-background-white',
        'has-text-right',
        'value',
      ]);
      expect(dt).toHaveAttribute('id', 'total-label');
      expect(dd).toHaveAttribute('aria-describedby', 'total-label');
    });

    it('adds no tab stop, no live region and no handlers', () => {
      const { container } = render(
        <Order hasDividers orientation="horizontal" />
      );
      const attributes = Array.from(container.querySelectorAll('*')).flatMap(
        el => Array.from(el.attributes).map(a => a.name)
      );
      expect(
        attributes.filter(name =>
          /^(tabindex|aria-live|aria-busy|on)/.test(name)
        )
      ).toEqual([]);
    });
  });
});

describe('Compound components', () => {
  test('each static is the exported part', () => {
    expect(DescriptionList.Item).toBe(DescriptionListItem);
    expect(DescriptionList.Label).toBe(DescriptionListLabel);
    expect(DescriptionList.Value).toBe(DescriptionListValue);
  });

  test('renders the parts through the dot path and by name alike', () => {
    const dotted = render(
      <DescriptionList>
        <DescriptionList.Item label="Order" value="#1234" />
        <DescriptionList.Item>
          <DescriptionList.Label>Tags</DescriptionList.Label>
          <DescriptionList.Value>Gift</DescriptionList.Value>
        </DescriptionList.Item>
      </DescriptionList>
    );
    const named = render(
      <DescriptionList>
        <DescriptionListItem label="Order" value="#1234" />
        <DescriptionListItem>
          <DescriptionListLabel>Tags</DescriptionListLabel>
          <DescriptionListValue>Gift</DescriptionListValue>
        </DescriptionListItem>
      </DescriptionList>
    );
    expect(dotted.container.innerHTML).toBe(named.container.innerHTML);
  });

  test('names each part for React’s dev tools', () => {
    expect(DescriptionList.displayName).toBe('DescriptionList');
    expect(DescriptionList.Item.displayName).toBe('DescriptionList.Item');
    expect(DescriptionList.Label.displayName).toBe('DescriptionList.Label');
    expect(DescriptionList.Value.displayName).toBe('DescriptionList.Value');
  });
});

describe('class prefix', () => {
  it('prefixes every class under ConfigProvider classPrefix', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bestax-">
        <DescriptionList
          orientation="vertical"
          orientationTablet="horizontal"
          orientationFullhd="vertical"
          hasDividers
          textSize="6"
        >
          <DescriptionList.Item label="Order" value="#1234" mb="1" />
          <DescriptionList.Item>
            <DescriptionList.Label textColor="dark">Tags</DescriptionList.Label>
            <DescriptionList.Value>Gift</DescriptionList.Value>
          </DescriptionList.Item>
        </DescriptionList>
      </ConfigProvider>
    );
    expect(classesOf(container.querySelector('dl'))).toEqual([
      'bestax-description-list',
      'bestax-is-vertical',
      'bestax-is-horizontal-tablet',
      'bestax-is-vertical-fullhd',
      'bestax-has-dividers',
      'bestax-is-size-6',
    ]);
    expect(classesOf(container.querySelector('div'))).toEqual([
      'bestax-description-list-item',
      'bestax-mb-1',
    ]);
    expect(
      container.querySelectorAll('.bestax-description-list-label')
    ).toHaveLength(2);
    expect(
      container.querySelectorAll('.bestax-description-list-value')
    ).toHaveLength(2);
    const unprefixed = Array.from(container.querySelectorAll('[class]'))
      .flatMap(el => Array.from(el.classList))
      .filter(name => !name.startsWith('bestax-'));
    expect(unprefixed).toEqual([]);
  });
});

describe('server rendering', () => {
  const Summary: React.FC = () => (
    <DescriptionList orientation="vertical" orientationDesktop="horizontal">
      <DescriptionList.Item label="Order" value="#1234" />
      {['Gift', 'Priority'].map(tag => (
        <DescriptionList.Item key={tag} label="Tag" value={tag} />
      ))}
      <DescriptionList.Item value={0}>
        <DescriptionList.Label>Items left</DescriptionList.Label>
      </DescriptionList.Item>
    </DescriptionList>
  );

  it('renders the same markup on the server as on the client', () => {
    const server = document.createElement('div');
    server.innerHTML = renderToString(<Summary />);
    const { container } = render(<Summary />);
    expect(markup(server)).toBe(markup(container));
    expect(classesOf(server.querySelector('dl'))).toEqual([
      'description-list',
      'is-vertical',
      'is-horizontal-desktop',
    ]);
  });

  it('hydrates without a mismatch', async () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Summary />);
    document.body.appendChild(container);
    const before = container.innerHTML;

    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    let unmountRoot = () => {};
    try {
      await act(async () => {
        const root = hydrateRoot(container, <Summary />);
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
