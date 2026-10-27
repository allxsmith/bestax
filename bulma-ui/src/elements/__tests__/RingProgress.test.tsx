import React from 'react';
import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { RingProgress, type RingProgressProps } from '../RingProgress';
import { ConfigProvider } from '../../helpers/Config';
import { resetDevWarnings } from '../../helpers/devWarnings';

beforeEach(() => resetDevWarnings());
afterEach(() => jest.restoreAllMocks());

const arcsOf = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll<SVGCircleElement>('.ring-progress-arc')
  );
const arcAt = (arc: SVGCircleElement) => ({
  length: Number(arc.style.getPropertyValue('--ring-progress-length')),
  start: Number(arc.style.getPropertyValue('--ring-progress-start')),
});

describe('RingProgress', () => {
  describe('One value', () => {
    it('is a named progressbar with its value, and an arc for its share', () => {
      const { container } = render(<RingProgress value={72} label="Upload" />);
      const ring = screen.getByRole('progressbar', { name: 'Upload' });
      expect(ring).toHaveAttribute('aria-valuenow', '72');
      expect(ring).toHaveAttribute('aria-valuemin', '0');
      expect(ring).toHaveAttribute('aria-valuemax', '100');
      const [arc] = arcsOf(container);
      expect(arcAt(arc)).toEqual({ length: 72, start: 0 });
      expect(arc).toHaveAttribute('pathLength', '100');
    });

    it('is a meter with isMeter', () => {
      render(<RingProgress isMeter value={64} label="Storage used" />);
      expect(
        screen.getByRole('meter', { name: 'Storage used' })
      ).toHaveAttribute('aria-valuenow', '64');
    });

    it('takes its share of max, and clamps a value outside it', () => {
      const { container, rerender } = render(
        <RingProgress value={7} max={10} label="Tasks" />
      );
      expect(arcAt(arcsOf(container)[0]).length).toBe(70);
      expect(screen.getByRole('progressbar')).toHaveAttribute(
        'aria-valuemax',
        '10'
      );
      rerender(<RingProgress value={15} max={10} label="Tasks" />);
      expect(screen.getByRole('progressbar')).toHaveAttribute(
        'aria-valuenow',
        '10'
      );
      expect(arcAt(arcsOf(container)[0]).length).toBe(100);
      rerender(<RingProgress value={-3} max={10} label="Tasks" />);
      expect(screen.getByRole('progressbar')).toHaveAttribute(
        'aria-valuenow',
        '0'
      );
    });

    it('draws no arc for nothing, and treats a max of zero or less as 100', () => {
      const { container, rerender } = render(<RingProgress label="Empty" />);
      expect(arcsOf(container)).toHaveLength(0);
      expect(screen.getByRole('progressbar')).toHaveAttribute(
        'aria-valuenow',
        '0'
      );
      rerender(<RingProgress value={30} max={0} label="Odd" />);
      expect(screen.getByRole('progressbar')).toHaveAttribute(
        'aria-valuemax',
        '100'
      );
      expect(arcAt(arcsOf(container)[0]).length).toBe(30);
    });

    it('takes its name from aria-label or aria-labelledby, and passes aria-valuetext', () => {
      const { rerender } = render(
        <RingProgress
          value={7}
          max={10}
          aria-label="Tasks"
          aria-valuetext="7 of 10 tasks"
        />
      );
      const ring = screen.getByRole('progressbar', { name: 'Tasks' });
      expect(ring).toHaveAttribute('aria-valuetext', '7 of 10 tasks');
      rerender(
        <>
          <h2 id="goal">Weekly goal</h2>
          <RingProgress value={7} max={10} aria-labelledby="goal" />
        </>
      );
      expect(
        screen.getByRole('progressbar', { name: 'Weekly goal' })
      ).toBeInTheDocument();
    });

    it('never lets a role passed in win', () => {
      render(
        <RingProgress
          {...({ role: 'button' } as unknown as RingProgressProps)}
          value={10}
          label="Upload"
        />
      );
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Sections', () => {
    const storage = [
      { value: 40, color: 'info' as const, label: 'Documents' },
      { value: 15, color: 'warning' as const, label: 'Photos' },
      { value: 15, label: 'Video' },
    ];

    it('is an image whose name writes every section out', () => {
      render(<RingProgress label="Storage" sections={storage} />);
      expect(
        screen.getByRole('img', {
          name: 'Storage: Documents 40%, Photos 15%, Video 15%',
        })
      ).not.toHaveAttribute('aria-valuenow');
    });

    it('leads with aria-label in place of label, and lists the sections alone with neither', () => {
      const { rerender } = render(
        <RingProgress aria-label="Disk" sections={storage} />
      );
      expect(
        screen.getByRole('img', {
          name: 'Disk: Documents 40%, Photos 15%, Video 15%',
        })
      ).toBeInTheDocument();
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      rerender(<RingProgress sections={storage} />);
      expect(
        screen.getByRole('img', {
          name: 'Documents 40%, Photos 15%, Video 15%',
        })
      ).toBeInTheDocument();
    });

    it('draws each arc after the one before, in its color, and marks the root', () => {
      const { container } = render(
        <RingProgress label="Storage" sections={storage} />
      );
      expect(container.firstChild).toHaveClass('has-sections');
      const arcs = arcsOf(container);
      expect(arcs.map(arcAt)).toEqual([
        { length: 40, start: 0 },
        { length: 15, start: 40 },
        { length: 15, start: 55 },
      ]);
      expect(arcs[0]).toHaveClass('ring-progress-arc', 'is-info');
      expect(arcs[1]).toHaveClass('is-warning');
      expect(arcs[2].getAttribute('class')).toBe('ring-progress-arc');
    });

    it('fills the ring and stops when the sections add up to more than max', () => {
      const { container } = render(
        <RingProgress
          label="Over"
          sections={[
            { value: 70, label: 'A' },
            { value: 50, label: 'B' },
            { value: 10, label: 'C' },
          ]}
        />
      );
      expect(arcsOf(container).map(arcAt)).toEqual([
        { length: 70, start: 0 },
        { length: 30, start: 70 },
      ]);
      expect(
        screen.getByRole('img', { name: 'Over: A 70%, B 30%, C 0%' })
      ).toBeInTheDocument();
    });

    it('ignores isMeter and value with sections, and warns about value', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(
        <RingProgress isMeter value={90} label="Storage" sections={storage} />
      );
      expect(screen.getByRole('img')).toBeInTheDocument();
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('both value and sections')
      );
    });

    it('ignores a color it doesn’t know on a section', () => {
      const { container } = render(
        <RingProgress
          label="Odd"
          sections={[
            {
              value: 50,
              label: 'A',
              color: 'teal' as unknown as 'primary',
            },
          ]}
        />
      );
      expect(arcsOf(container)[0].getAttribute('class')).toBe(
        'ring-progress-arc'
      );
    });
  });

  describe('The ring and its middle', () => {
    it('draws a track under the arcs, and hides the drawing', () => {
      const { container } = render(<RingProgress value={50} label="Half" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('ring-progress-ring');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg?.querySelector('.ring-progress-track')).not.toBeNull();
    });

    it('centres the children, hidden from assistive tech', () => {
      const { container } = render(
        <RingProgress value={72} label="Upload">
          72%
        </RingProgress>
      );
      const middle = container.querySelector('.ring-progress-label');
      expect(middle).toHaveTextContent('72%');
      expect(middle).toHaveAttribute('aria-hidden', 'true');
    });

    it('leaves the middle out with no children', () => {
      const { container } = render(<RingProgress value={72} label="Upload" />);
      expect(container.querySelector('.ring-progress-label')).toBeNull();
    });

    it.each([
      [{}, []],
      [{ size: 'small' }, ['is-small']],
      [{ size: 'large' }, ['is-large']],
      [{ color: 'danger' }, ['is-danger']],
      [{ isRounded: true }, ['is-rounded']],
      [{ size: 'huge' }, []],
      [{ color: 'teal' }, []],
    ] as [Partial<RingProgressProps>, string[]][])(
      'gives the root the classes for %j',
      (props, classes) => {
        const { container } = render(
          <RingProgress value={10} label="Ring" {...props} />
        );
        expect((container.firstChild as HTMLElement).className).toBe(
          ['ring-progress', ...classes].join(' ')
        );
      }
    );

    it('puts the helper props, className, other attributes and ref on the root', () => {
      const ref = React.createRef<HTMLDivElement>();
      const { container } = render(
        <RingProgress
          ref={ref}
          value={10}
          label="Ring"
          className="extra"
          m="2"
          textColor="primary"
          bgColor="light"
          id="ring"
          data-testid="ring"
        />
      );
      const root = container.firstChild as HTMLElement;
      expect(root).toHaveClass(
        'ring-progress',
        'extra',
        'm-2',
        'has-text-primary',
        'has-background-light'
      );
      expect(root).toHaveAttribute('id', 'ring');
      expect(screen.getByTestId('ring')).toBe(root);
      expect(ref.current).toBe(root);
    });

    it('has a display name', () => {
      expect(RingProgress.displayName).toBe('RingProgress');
    });
  });

  describe('Names', () => {
    it('warns in development with no name', () => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(<RingProgress value={10} />);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('<RingProgress> has no accessible name')
      );
    });

    it.each([
      [{ label: 'Upload' }],
      [{ 'aria-label': 'Upload' }],
      [{ 'aria-labelledby': 'heading' }],
    ])("doesn't warn when it's named with %j", name => {
      const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
      render(<RingProgress value={10} {...name} />);
      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('Server rendering', () => {
    it('renders the ring from its props alone', () => {
      const html = renderToString(
        <RingProgress value={72} label="Upload" color="success">
          72%
        </RingProgress>
      );
      expect(html).toContain(
        'class="ring-progress is-success" role="progressbar" aria-valuenow="72"'
      );
      expect(html).toContain('--ring-progress-length:72');
      expect(html).toContain('pathLength="100"');
    });
  });

  describe('Class prefix', () => {
    it('prefixes every class under ConfigProvider classPrefix', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bestax-">
          <RingProgress
            label="Storage"
            size="small"
            color="primary"
            isRounded
            sections={[{ value: 30, color: 'success', label: 'A' }]}
          >
            30%
          </RingProgress>
        </ConfigProvider>
      );
      const root = container.firstChild as HTMLElement;
      expect(root.className).toBe(
        'bestax-ring-progress bestax-is-small bestax-is-primary bestax-is-rounded bestax-has-sections'
      );
      expect(root.querySelector('svg')?.getAttribute('class')).toBe(
        'bestax-ring-progress-ring'
      );
      expect(root.querySelector('circle')?.getAttribute('class')).toBe(
        'bestax-ring-progress-track'
      );
      expect(root.querySelectorAll('circle')[1].getAttribute('class')).toBe(
        'bestax-ring-progress-arc bestax-is-success'
      );
      expect(root.lastElementChild?.className).toBe(
        'bestax-ring-progress-label'
      );
    });
  });
});
