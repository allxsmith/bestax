import React, { createRef } from 'react';
import { act, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { Stats, type StatsProps } from '../Stats';
import { Stat } from '../Stat';
import { ConfigProvider } from '../../helpers/Config';
import { LocaleProvider } from '../../helpers/LocaleProvider';

/** The class list of an element, as an array. */
const classesOf = (el: Element | null) => Array.from(el?.classList ?? []);

/** The markup without the empty comments React's server puts between text. */
const markup = (root: HTMLElement) => root.innerHTML.replace(/<!-- -->/g, '');

const Row: React.FC<Partial<StatsProps>> = props => (
  <Stats {...props}>
    <Stat
      label="Revenue"
      value={8456.4}
      format={{ style: 'currency', currency: 'USD' }}
      locale="en-US"
      change={0.12}
      description="since last month"
    />
    <Stat label="New customers" value={1234} change={-0.019} locale="en-US" />
    <Stat
      label="Churn"
      value={0.021}
      format={{ style: 'percent', maximumFractionDigits: 1 }}
      change={0.004}
      changeColor="danger"
      locale="en-US"
    />
  </Stats>
);

describe('Stats', () => {
  describe('markup', () => {
    it('is one <dl class="stats grid">, with a <div class="stat"> per Stat holding its <dt> and <dd>s', () => {
      const { container } = render(<Row minCol={8} gap={4} />);
      const dl = container.firstElementChild as HTMLElement;
      expect(dl.localName).toBe('dl');
      expect(classesOf(dl)).toEqual([
        'stats',
        'grid',
        'is-col-min-8',
        'is-gap-4',
      ]);
      expect(container.querySelectorAll('dl')).toHaveLength(1);
      expect(
        Array.from(dl.children).map(
          div =>
            `${div.localName}.${div.className}: ` +
            Array.from(div.children)
              .map(part => `${part.localName} ${part.textContent}`)
              .join(' | ')
        )
      ).toEqual([
        'div.stat: dt Revenue | dd $8,456.40 | dd +12% | dd since last month',
        'div.stat: dt New customers | dd 1,234 | dd -1.9%',
        'div.stat: dt Churn | dd 2.1% | dd +0.4%',
      ]);
    });

    it('lists the terms and definitions of every Stat in one list', () => {
      render(<Row />);
      expect(screen.getAllByRole('term').map(dt => dt.textContent)).toEqual([
        'Revenue',
        'New customers',
        'Churn',
      ]);
      expect(screen.getAllByRole('definition')).toHaveLength(7);
    });

    it('passes aria-labelledby to the <dl>, to name it by the heading above', () => {
      const { container } = render(
        <>
          <h2 id="kpis">This month</h2>
          <Row aria-labelledby="kpis" />
        </>
      );
      const id = container.querySelector('dl')?.getAttribute('aria-labelledby');
      expect(document.getElementById(id ?? '')).toHaveTextContent('This month');
    });

    it('adds no minimum width class without minCol, leaving Bulma’s', () => {
      const { container } = render(<Stats />);
      expect(container.innerHTML).toBe('<dl class="stats grid"></dl>');
    });

    it('takes a gap as a string step too', () => {
      const { container } = render(<Stats gap="1.5" />);
      expect(classesOf(container.firstElementChild)).toEqual([
        'stats',
        'grid',
        'is-gap-1.5',
      ]);
    });
  });

  describe('props', () => {
    it('puts the helper props, className, other attributes and ref on the <dl>', () => {
      const ref = createRef<HTMLDListElement>();
      const { container } = render(
        <Stats
          ref={ref}
          className="custom"
          bgColor="light"
          p="4"
          id="kpis"
          data-testid="kpis"
        >
          <Stat label="Revenue" value="$8,456" />
        </Stats>
      );
      const dl = container.querySelector('dl') as HTMLDListElement;
      expect(ref.current).toBe(dl);
      expect(classesOf(dl)).toEqual([
        'stats',
        'grid',
        'has-background-light',
        'p-4',
        'custom',
      ]);
      expect(dl).toHaveAttribute('id', 'kpis');
      expect(dl).toHaveAttribute('data-testid', 'kpis');
    });

    it('puts its textColor on the <dl>, and gives it to each Stat without one of its own, so it colors their figures', () => {
      const { container } = render(
        <Stats textColor="primary">
          <Stat label="Revenue" value="$8,456" />
          <Stat label="Churn" value="2.1%" textColor="danger" />
        </Stats>
      );
      expect(classesOf(container.querySelector('dl'))).toEqual([
        'stats',
        'grid',
        'has-text-primary',
      ]);
      expect(
        Array.from(container.querySelectorAll('dl > div')).map(classesOf)
      ).toEqual([
        ['stat', 'has-text-primary'],
        ['stat', 'has-text-danger'],
      ]);
    });

    it('passes a LocaleProvider around the row on to every figure', () => {
      const { container } = render(
        <LocaleProvider locale="de-DE">
          <Stats>
            <Stat label="Customers" value={1234} change={-0.019} />
            <Stat label="Orders" value={56789} />
          </Stats>
        </LocaleProvider>
      );
      expect(
        Array.from(container.querySelectorAll('data')).map(d => d.textContent)
      ).toEqual(['1.234', '-1,9 %', '56.789']);
    });
  });
});

describe('Compound components', () => {
  it('Stats.Stat is the exported Stat', () => {
    expect(Stats.Stat).toBe(Stat);
  });

  it('renders a row through the dot path, with the Stat parts on it', () => {
    const { container } = render(
      <Stats>
        <Stats.Stat label="Revenue" value="$8,456" />
        <Stats.Stat>
          <Stats.Stat.Label>Churn</Stats.Stat.Label>
          <Stats.Stat.Value>2.1%</Stats.Stat.Value>
        </Stats.Stat>
      </Stats>
    );
    expect(
      Array.from(container.querySelectorAll('dl.stats > div.stat')).map(
        tile => tile.textContent
      )
    ).toEqual(['Revenue$8,456', 'Churn2.1%']);
  });
});

describe('class prefix', () => {
  it('prefixes every class under ConfigProvider classPrefix', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bestax-">
        <Stats minCol={10} gap={2} mb="5">
          <Stat label="Revenue" value={8456.4} change={0.12} />
          <Stat label="Churn" loading />
        </Stats>
      </ConfigProvider>
    );
    expect(classesOf(container.querySelector('dl'))).toEqual([
      'bestax-stats',
      'bestax-grid',
      'bestax-is-col-min-10',
      'bestax-mb-5',
      'bestax-is-gap-2',
    ]);
    const unprefixed = Array.from(container.querySelectorAll('[class]'))
      .flatMap(el => Array.from(el.classList))
      .filter(name => !name.startsWith('bestax-'));
    expect(unprefixed).toEqual([]);
  });
});

describe('server rendering', () => {
  it('renders the same markup on the server as on the client', () => {
    const server = document.createElement('div');
    server.innerHTML = renderToString(<Row minCol={8} gap={4} />);
    const { container } = render(<Row minCol={8} gap={4} />);
    expect(markup(server)).toBe(markup(container));
  });

  it('hydrates without a mismatch', async () => {
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Row minCol={8} />);
    document.body.appendChild(container);
    const before = container.innerHTML;

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let unmountRoot = () => {};
    try {
      await act(async () => {
        const root = hydrateRoot(container, <Row minCol={8} />);
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
