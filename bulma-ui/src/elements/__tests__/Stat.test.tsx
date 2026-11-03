import React, { createRef } from 'react';
import { act, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import {
  Stat,
  StatChange,
  StatDescription,
  StatLabel,
  StatValue,
  type StatProps,
} from '../Stat';
import { Stats } from '../Stats';
import { NumberFormatter } from '../NumberFormatter';
import { ConfigProvider } from '../../helpers/Config';
import { LocaleProvider } from '../../helpers/LocaleProvider';
import { resetDevWarnings } from '../../helpers/devWarnings';

/** The class list of an element, as an array. */
const classesOf = (el: Element | null) => Array.from(el?.classList ?? []);

/** The markup without the empty comments React's server puts between text. */
const markup = (root: HTMLElement) => root.innerHTML.replace(/<!-- -->/g, '');

/** The root's parts, as tag, class and text: `dt stat-label Revenue`. */
const partsOf = (root: Element | null) =>
  Array.from(root?.children ?? []).map(el =>
    `${el.localName} ${el.className} ${el.textContent ?? ''}`.trim()
  );

const UP = 'M8 13V3M3.5 7.5 8 3l4.5 4.5';
const DOWN = 'M8 3v10M3.5 8.5 8 13l4.5-4.5';

/** The arrow a change draws: `up`, `down`, or `none`. */
const arrowOf = (dd: Element | null) => {
  const d = dd?.querySelector('svg path')?.getAttribute('d');
  return d === UP ? 'up' : d === DOWN ? 'down' : d ? d : 'none';
};

const changeOf = (container: HTMLElement) =>
  container.querySelector('.stat-change') as HTMLElement;

const Revenue: React.FC<Partial<StatProps>> = props => (
  <Stat
    label="Revenue"
    value={8456.4}
    format={{ style: 'currency', currency: 'USD' }}
    locale="en-US"
    change={0.12}
    description="since last month"
    {...props}
  />
);

describe('Stat', () => {
  describe('markup', () => {
    it('is a <dl> on its own, with a <dt> for the label and a <dd> for each value', () => {
      const { container } = render(<Revenue />);
      expect(container.innerHTML).toBe(
        '<dl class="stat">' +
          '<dt class="stat-label">Revenue</dt>' +
          '<dd class="stat-value"><data value="8456.4">$8,456.40</data></dd>' +
          '<dd class="stat-change is-success">' +
          '<svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true">' +
          `<path d="${UP}" fill="none" stroke="currentColor" stroke-width="1.75" ` +
          'stroke-linecap="round" stroke-linejoin="round"></path></svg>' +
          '<data value="0.12">+12%</data></dd>' +
          '<dd class="stat-description">since last month</dd>' +
          '</dl>'
      );
    });

    it('adds no roles, so the parts keep their own: a term and its definitions', () => {
      const { container } = render(<Revenue />);
      expect(container.querySelectorAll('[role]')).toHaveLength(0);
      expect(screen.getByRole('term')).toHaveTextContent('Revenue');
      expect(
        screen.getAllByRole('definition').map(dd => dd.textContent)
      ).toEqual(['$8,456.40', '+12%', 'since last month']);
    });

    it('adds no tab stop, no live region and no handlers', () => {
      const { container } = render(<Revenue />);
      const attributes = Array.from(container.querySelectorAll('*')).flatMap(
        el => Array.from(el.attributes).map(a => a.name)
      );
      expect(
        attributes.filter(name =>
          /^(tabindex|aria-live|aria-busy|on)/.test(name)
        )
      ).toEqual([]);
    });

    it('renders the figure’s <dd>, empty, with nothing given', () => {
      const { container } = render(<Stat />);
      expect(container.innerHTML).toBe(
        '<dl class="stat"><dd class="stat-value"></dd></dl>'
      );
    });

    it('renders label before the children, and value, change and description after them', () => {
      const { container } = render(
        <Stat
          label="Storage"
          value="12 GB"
          change={-0.05}
          description="of 50 GB"
          locale="en-US"
        >
          <Stat.Value>24%</Stat.Value>
        </Stat>
      );
      expect(partsOf(container.firstElementChild)).toEqual([
        'dt stat-label Storage',
        'dd stat-value 24%',
        'dd stat-value 12 GB',
        'dd stat-change is-danger -5%',
        'dd stat-description of 50 GB',
      ]);
    });

    it('renders nothing for undefined, null, a boolean or an empty string, the figure’s <dd> left empty, and renders 0', () => {
      for (const nothing of [undefined, null, true, false, '']) {
        const { container, unmount } = render(
          <Stat label={nothing} value={nothing} description={nothing} />
        );
        expect(container.innerHTML).toBe(
          '<dl class="stat"><dd class="stat-value"></dd></dl>'
        );
        unmount();
      }
      const { container } = render(
        <Stat label={0} value={0} description={0} change={0} locale="en-US" />
      );
      expect(partsOf(container.firstElementChild)).toEqual([
        'dt stat-label 0',
        'dd stat-value 0',
        'dd stat-change 0%',
        'dd stat-description 0',
      ]);
    });

    it('renders no change for one that is not a number', () => {
      const { container } = render(
        <Stat label="Revenue" change={null as unknown as number} value="N/A" />
      );
      expect(changeOf(container)).toBeNull();
    });
  });

  describe('keeping the list valid', () => {
    beforeEach(() => resetDevWarnings());
    afterEach(() => vi.restoreAllMocks());

    it('renders the figure’s <dd>, empty, for a label whose value isn’t there yet', () => {
      const total: number | undefined = undefined;
      const { container } = render(<Stat label="Total" value={total} />);
      expect(container.innerHTML).toBe(
        '<dl class="stat"><dt class="stat-label">Total</dt>' +
          '<dd class="stat-value"></dd></dl>'
      );
      expect(screen.getByRole('term')).toHaveTextContent('Total');
      expect(screen.getAllByRole('definition')).toHaveLength(1);
    });

    it('adds no empty <dd> beside parts, which bring their own', () => {
      const { container } = render(
        <>
          <Stat>
            <Stat.Label>Errors</Stat.Label>
            <Stat.Change value={-0.4} color="success" locale="en-US" />
          </Stat>
          <Stat label="Revenue">
            <Stat.Value>$8,456</Stat.Value>
          </Stat>
        </>
      );
      const [errors, revenue] = Array.from(container.children);
      expect(partsOf(errors)).toEqual([
        'dt stat-label Errors',
        'dd stat-change is-success -40%',
      ]);
      expect(partsOf(revenue)).toEqual([
        'dt stat-label Revenue',
        'dd stat-value $8,456',
      ]);
    });

    it('warns once in development about a Stat with no label and no parts', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const { container } = render(
        <>
          <Stat value={1234} locale="en-US" />
          <Stat value={5} description="today" />
        </>
      );
      expect(container.firstElementChild?.outerHTML).toBe(
        '<dl class="stat"><dd class="stat-value">' +
          '<data value="1234">1,234</data></dd></dl>'
      );
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toMatch(
        /<Stat> has no label\. Pass label, or a Stat\.Label child/
      );
    });

    it('doesn’t warn with a label, or with parts that can hold one', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <>
          <Stat label="Revenue" value={1} />
          <Stat label={0} />
          <Stat>
            <Stat.Label>Errors</Stat.Label>
          </Stat>
        </>
      );
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('value', () => {
    it('writes a number with NumberFormatter, in format and locale', () => {
      const { container, rerender } = render(
        <Stat label="Churn" value={0.021} locale="de-DE" />
      );
      const data = () => container.querySelector('.stat-value data');
      expect(data()).toHaveAttribute('value', '0.021');
      expect(data()?.textContent).toBe('0,021');
      rerender(
        <Stat
          label="Churn"
          value={0.021}
          locale="de-DE"
          format={{ style: 'percent', maximumFractionDigits: 1 }}
        />
      );
      expect(data()?.textContent).toBe('2,1 %');
    });

    it('follows a LocaleProvider around it', () => {
      const { container } = render(
        <LocaleProvider locale="de-DE">
          <Stat label="Customers" value={1234} change={-0.019} />
        </LocaleProvider>
      );
      expect(
        Array.from(container.querySelectorAll('data')).map(d => d.textContent)
      ).toEqual(['1.234', '-1,9 %']);
    });

    it('renders anything else as given, and format does nothing to it', () => {
      const { container } = render(
        <Stat
          label="Uptime"
          value={
            <>
              <NumberFormatter value={99.95} locale="en-US" /> days
            </>
          }
          format={{ style: 'currency', currency: 'USD' }}
        />
      );
      expect(container.querySelector('.stat-value')?.textContent).toBe(
        '99.95 days'
      );
      const { container: words } = render(<Stat label="Uptime" value="N/A" />);
      expect(words.querySelector('.stat-value')?.innerHTML).toBe('N/A');
    });
  });

  describe('change', () => {
    it('writes +12%, -1.9% and 0% with an up arrow, a down arrow and none, in the sign’s tone', () => {
      const cases: [number, string, string, string[]][] = [
        [0.12, '+12%', 'up', ['stat-change', 'is-success']],
        [-0.019, '-1.9%', 'down', ['stat-change', 'is-danger']],
        [0, '0%', 'none', ['stat-change']],
      ];
      for (const [change, text, arrow, classes] of cases) {
        const { container, unmount } = render(
          <Stat label="Revenue" change={change} locale="en-US" />
        );
        const dd = changeOf(container);
        expect(dd.textContent).toBe(text);
        expect(arrowOf(dd)).toBe(arrow);
        expect(classesOf(dd)).toEqual(classes);
        unmount();
      }
    });

    it('hides the arrow from assistive tech, so the sign in the text carries the direction', () => {
      const { container } = render(
        <Stat label="Revenue" change={0.12} locale="en-US" />
      );
      expect(container.querySelector('svg')).toHaveAttribute(
        'aria-hidden',
        'true'
      );
      expect(
        screen.getAllByRole('definition').map(dd => dd.textContent)
      ).toEqual(['', '+12%']);
    });

    it('takes changeColor for the color only, the arrow still following the sign', () => {
      const { container } = render(
        <Stat
          label="Churn"
          change={0.004}
          changeColor="danger"
          locale="en-US"
        />
      );
      const dd = changeOf(container);
      expect(classesOf(dd)).toEqual(['stat-change', 'is-danger']);
      expect(arrowOf(dd)).toBe('up');
      expect(dd.textContent).toBe('+0.4%');
    });

    it('keeps a changeColor at zero', () => {
      const { container } = render(
        <Stat label="Errors" change={0} changeColor="info" locale="en-US" />
      );
      expect(classesOf(changeOf(container))).toEqual([
        'stat-change',
        'is-info',
      ]);
      expect(arrowOf(changeOf(container))).toBe('none');
    });

    it('reads a change that rounds to zero as zero: no arrow and no tone', () => {
      for (const change of [0.0004, -0.0004, -0]) {
        const { container, unmount } = render(
          <Stat label="Revenue" change={change} locale="en-US" />
        );
        const dd = changeOf(container);
        expect(dd.textContent).toBe('0%');
        expect(arrowOf(dd)).toBe('none');
        expect(classesOf(dd)).toEqual(['stat-change']);
        unmount();
      }
    });

    it('reads a change that rounds to zero as zero whatever the signDisplay', () => {
      const cases: [Intl.NumberFormatOptions['signDisplay'], number, string][] =
        [
          ['auto', 0.0004, '0%'],
          ['auto', -0.0004, '-0%'],
          ['always', 0.0004, '+0%'],
          ['always', -0.0004, '-0%'],
          ['exceptZero', -0.0004, '0%'],
          ['never', -0.0004, '0%'],
        ];
      for (const [signDisplay, change, text] of cases) {
        const { container, unmount } = render(
          <Stat
            label="Revenue"
            change={change}
            changeFormat={{
              style: 'percent',
              maximumFractionDigits: 1,
              signDisplay,
            }}
            locale="en-US"
          />
        );
        const dd = changeOf(container);
        expect(dd.textContent).toBe(text);
        expect(arrowOf(dd)).toBe('none');
        expect(classesOf(dd)).toEqual(['stat-change']);
        unmount();
      }
    });

    it('keeps the direction of a change that doesn’t round to zero, whatever the signDisplay', () => {
      for (const signDisplay of ['auto', 'always', 'never'] as const) {
        for (const [change, arrow, tone] of [
          [0.05, 'up', 'is-success'],
          [-0.05, 'down', 'is-danger'],
        ] as const) {
          const { container, unmount } = render(
            <Stat
              label="Revenue"
              change={change}
              changeFormat={{ style: 'percent', signDisplay }}
              locale="en-US"
            />
          );
          expect(arrowOf(changeOf(container))).toBe(arrow);
          expect(classesOf(changeOf(container))).toEqual(['stat-change', tone]);
          unmount();
        }
      }
    });

    it('draws no arrow and no tone for NaN, which has no sign', () => {
      const { container } = render(
        <Stat label="Revenue" change={NaN} locale="en-US" />
      );
      expect(arrowOf(changeOf(container))).toBe('none');
      expect(classesOf(changeOf(container))).toEqual(['stat-change']);
    });

    it('replaces the default with a changeFormat of your own, keeping the sign', () => {
      const { container } = render(
        <Stat
          label="Revenue"
          change={1250}
          changeFormat={{ style: 'currency', currency: 'USD' }}
          locale="en-US"
        />
      );
      const dd = changeOf(container);
      expect(dd.textContent).toBe('+$1,250.00');
      expect(dd.querySelector('data')).toHaveAttribute('value', '1250');
      expect(arrowOf(dd)).toBe('up');
    });

    it('drops the sign only when your changeFormat sets a signDisplay', () => {
      const { container, rerender } = render(
        <Stat
          label="Points"
          change={-3}
          changeFormat={{ signDisplay: 'never' }}
          locale="en-US"
        />
      );
      expect(changeOf(container).textContent).toBe('3');
      expect(arrowOf(changeOf(container))).toBe('down');
      rerender(
        <Stat
          label="Points"
          change={3}
          changeFormat={{ signDisplay: 'always' }}
          locale="en-US"
        />
      );
      expect(changeOf(container).textContent).toBe('+3');
      rerender(
        <Stat
          label="Points"
          change={3}
          changeFormat={{ maximumFractionDigits: 0 }}
          locale="en-US"
        />
      );
      expect(changeOf(container).textContent).toBe('+3');
    });

    it('writes the change in the Stat’s locale, a Stat.Change’s own winning', () => {
      const { container } = render(
        <Stat label="Revenue" locale="de-DE">
          <Stat.Change value={-0.019} />
          <Stat.Change value={-0.019} locale="en-US" />
        </Stat>
      );
      expect(
        Array.from(container.querySelectorAll('.stat-change')).map(
          dd => dd.textContent
        )
      ).toEqual(['-1,9 %', '-1.9%']);
    });

    it('takes a Stat.Change with a color of its own, where down is good', () => {
      const { container } = render(
        <Stat>
          <Stat.Label>Median response time</Stat.Label>
          <Stat.Change value={-0.08} color="success" locale="en-US" />
        </Stat>
      );
      const dd = changeOf(container);
      expect(classesOf(dd)).toEqual(['stat-change', 'is-success']);
      expect(arrowOf(dd)).toBe('down');
      expect(dd.textContent).toBe('-8%');
    });
  });

  describe('size', () => {
    it('adds is-small, is-medium or is-large to the Stat', () => {
      for (const size of ['small', 'medium', 'large'] as const) {
        const { container, unmount } = render(<Stat size={size} />);
        expect(classesOf(container.firstElementChild)).toEqual([
          'stat',
          `is-${size}`,
        ]);
        unmount();
      }
    });
  });

  describe('loading', () => {
    it('puts a Skeleton in the value’s place and sets aria-busy on the Stat', () => {
      const { container } = render(<Revenue loading />);
      const dl = container.firstElementChild as HTMLElement;
      expect(dl).toHaveAttribute('aria-busy', 'true');
      expect(partsOf(dl)).toEqual([
        'dt stat-label Revenue',
        'dd stat-value',
        'dd stat-change is-success +12%',
        'dd stat-description since last month',
      ]);
      expect(
        container.querySelector('.stat-value > .skeleton-block')
      ).not.toBeNull();
      expect(container.querySelector('.stat-value data')).toBeNull();
    });

    it('shows the Skeleton with no value yet', () => {
      const { container } = render(<Stat label="Revenue" loading />);
      expect(partsOf(container.firstElementChild)).toEqual([
        'dt stat-label Revenue',
        'dd stat-value',
      ]);
      expect(container.querySelector('.skeleton-block')).not.toBeNull();
    });

    it('leaves aria-busy off when not loading, and keeps one you give', () => {
      const { container, rerender } = render(<Revenue loading={false} />);
      expect(container.firstElementChild).not.toHaveAttribute('aria-busy');
      rerender(<Revenue aria-busy="true" />);
      expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('props on each part', () => {
    it('puts the helper props, className, other attributes and ref on the <dl>', () => {
      const ref = createRef<HTMLElement>();
      const { container } = render(
        <Stat
          ref={ref}
          label="Revenue"
          value="$8,456"
          className="custom"
          textColor="primary"
          bgColor="light"
          p="4"
          id="revenue"
          data-testid="revenue"
        />
      );
      const dl = container.querySelector('dl') as HTMLElement;
      expect(ref.current).toBe(dl);
      expect(classesOf(dl)).toEqual([
        'stat',
        'has-text-primary',
        'has-background-light',
        'p-4',
        'custom',
      ]);
      expect(dl).toHaveAttribute('id', 'revenue');
      expect(dl).toHaveAttribute('data-testid', 'revenue');
    });

    it('puts them on the label’s <dt> and the value’s and description’s <dd>s', () => {
      const labelRef = createRef<HTMLElement>();
      const valueRef = createRef<HTMLElement>();
      const descriptionRef = createRef<HTMLElement>();
      const { container } = render(
        <Stat>
          <Stat.Label
            ref={labelRef}
            className="label"
            textTransform="uppercase"
            textColor="dark"
            bgColor="light"
            id="revenue-label"
          >
            Revenue
          </Stat.Label>
          <Stat.Value
            ref={valueRef}
            className="value"
            textColor="success"
            bgColor="white"
            aria-describedby="revenue-label"
          >
            $8,456
          </Stat.Value>
          <Stat.Description
            ref={descriptionRef}
            className="note"
            textColor="grey"
            bgColor="white"
            mt="1"
          >
            since last month
          </Stat.Description>
        </Stat>
      );
      const [dt, value, description] = Array.from(
        container.querySelectorAll('dt, dd')
      );
      expect(labelRef.current).toBe(dt);
      expect(valueRef.current).toBe(value);
      expect(descriptionRef.current).toBe(description);
      expect(classesOf(dt)).toEqual([
        'stat-label',
        'has-text-dark',
        'has-background-light',
        'is-uppercase',
        'label',
      ]);
      expect(classesOf(value)).toEqual([
        'stat-value',
        'has-text-success',
        'has-background-white',
        'value',
      ]);
      expect(classesOf(description)).toEqual([
        'stat-description',
        'has-text-grey',
        'has-background-white',
        'mt-1',
        'note',
      ]);
      expect(dt).toHaveAttribute('id', 'revenue-label');
      expect(value).toHaveAttribute('aria-describedby', 'revenue-label');
    });

    it('puts them on the change’s <dd>', () => {
      const ref = createRef<HTMLElement>();
      const { container } = render(
        <Stat>
          <Stat.Change
            ref={ref}
            value={0.12}
            className="change"
            ml="2"
            title="Since last month"
            locale="en-US"
          />
        </Stat>
      );
      const dd = changeOf(container);
      expect(ref.current).toBe(dd);
      expect(classesOf(dd)).toEqual([
        'stat-change',
        'is-success',
        'ml-2',
        'change',
      ]);
      expect(dd).toHaveAttribute('title', 'Since last month');
    });
  });

  describe('inside a row', () => {
    it('is a <div> in the row’s <dl>, with its ref on the <div>', () => {
      const ref = createRef<HTMLElement>();
      const { container } = render(
        <Stats>
          <Stat ref={ref} label="Revenue" value="$8,456" />
        </Stats>
      );
      const div = container.querySelector('dl > div') as HTMLElement;
      expect(ref.current).toBe(div);
      expect(classesOf(div)).toEqual(['stat']);
      expect(container.querySelectorAll('dl')).toHaveLength(1);
    });

    it('renders a <dl> of its own for a Stat inside one of its parts, which leaves the row’s color behind', () => {
      const { container } = render(
        <Stats textColor="link">
          <Stat label="Storage">
            <Stat.Description>
              <Stat label="Photos" value="12 GB" />
            </Stat.Description>
          </Stat>
        </Stats>
      );
      const outer = container.querySelector('dl > div') as HTMLElement;
      const inner = container.querySelector('dd > .stat') as HTMLElement;
      expect(classesOf(outer)).toEqual(['stat', 'has-text-link']);
      expect(inner.localName).toBe('dl');
      expect(classesOf(inner)).toEqual(['stat']);
    });
  });
});

describe('Compound components', () => {
  test('each static is the exported part', () => {
    expect(Stat.Label).toBe(StatLabel);
    expect(Stat.Value).toBe(StatValue);
    expect(Stat.Change).toBe(StatChange);
    expect(Stat.Description).toBe(StatDescription);
  });

  test('renders the parts through the dot path and by name alike', () => {
    const dotted = render(
      <Stat>
        <Stat.Label>Median response time</Stat.Label>
        <Stat.Value>182 ms</Stat.Value>
        <Stat.Change value={-0.08} color="success" locale="en-US" />
        <Stat.Description>this week</Stat.Description>
      </Stat>
    );
    const named = render(
      <Stat>
        <StatLabel>Median response time</StatLabel>
        <StatValue>182 ms</StatValue>
        <StatChange value={-0.08} color="success" locale="en-US" />
        <StatDescription>this week</StatDescription>
      </Stat>
    );
    expect(dotted.container.innerHTML).toBe(named.container.innerHTML);
  });

  test('names each part for React’s dev tools', () => {
    expect(Stat.displayName).toBe('Stat');
    expect(Stat.Label.displayName).toBe('Stat.Label');
    expect(Stat.Value.displayName).toBe('Stat.Value');
    expect(Stat.Change.displayName).toBe('Stat.Change');
    expect(Stat.Description.displayName).toBe('Stat.Description');
  });
});

describe('class prefix', () => {
  it('prefixes every class under ConfigProvider classPrefix', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bestax-">
        <Revenue size="medium" mb="2" />
        <Stat label="Churn" loading change={-0.004} changeColor="warning" />
      </ConfigProvider>
    );
    const [revenue, churn] = Array.from(container.children);
    expect(classesOf(revenue)).toEqual([
      'bestax-stat',
      'bestax-is-medium',
      'bestax-mb-2',
    ]);
    expect(partsOf(revenue).map(part => part.split(' ')[1])).toEqual([
      'bestax-stat-label',
      'bestax-stat-value',
      'bestax-stat-change',
      'bestax-stat-description',
    ]);
    expect(classesOf(churn.querySelector('dd:last-child'))).toEqual([
      'bestax-stat-change',
      'bestax-is-warning',
    ]);
    expect(churn.querySelector('.bestax-skeleton-block')).not.toBeNull();
    const unprefixed = Array.from(container.querySelectorAll('[class]'))
      .flatMap(el => Array.from(el.classList))
      .filter(name => !name.startsWith('bestax-'));
    expect(unprefixed).toEqual([]);
  });
});

describe('server rendering', () => {
  const Dashboard: React.FC = () => (
    <>
      <Revenue />
      <Stat label="Churn" loading change={0} locale="en-US" />
    </>
  );

  it('renders the same markup on the server as on the client', () => {
    const server = document.createElement('div');
    server.innerHTML = renderToString(<Dashboard />);
    const { container } = render(<Dashboard />);
    expect(markup(server)).toBe(markup(container));
  });

  it('hydrates without a mismatch', async () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Dashboard />);
    document.body.appendChild(container);
    const before = container.innerHTML;

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let unmountRoot = () => {};
    try {
      await act(async () => {
        const root = hydrateRoot(container, <Dashboard />);
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
