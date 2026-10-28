import React, { createRef } from 'react';
import { act, render, screen } from '@testing-library/react';
import {
  LocaleProvider,
  LocalePortalScope,
  useLocale,
  useLocaleScope,
  type LocaleContextValue,
} from '../LocaleProvider';
import { Portal } from '../portal';
import { ConfigProvider } from '../Config';
import { resetDevWarnings } from '../devWarnings';
import { Modal } from '../../components/Modal';
import { Dialog } from '../../components/Dialog';
import { Sidebar } from '../../components/Sidebar';
import { Toast, ToastContainer, toast } from '../../components/Toast';
import { Popover } from '../../components/Popover';
import {
  NotificationContainer,
  notification,
} from '../../elements/Notification';
import { DateInput } from '../../form/DateInput';
import { DateRangeInput } from '../../form/DateRangeInput';
import { DateTimeInput } from '../../form/DateTimeInput';
import { TimeInput } from '../../form/TimeInput';
import { DateInputBase } from '../../form/DateInputBase';

/** Renders what `useLocale` returns, for the assertions to read. */
function ShowLocale() {
  const { locale, dir } = useLocale();
  return <output data-testid="locale">{`${locale}|${dir}`}</output>;
}

/** The element a test's content sits in, which carries the provider's settings. */
const scopeOf = (el: Element) => el.parentElement as HTMLElement;

/** The day names along the top of a calendar, in the order they show. */
const dayNames = (root: ParentNode = document) =>
  Array.from(root.querySelectorAll('[class~="dateinput-day-name"]')).map(
    el => el.textContent
  );

describe('LocaleProvider', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    resetDevWarnings();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('the wrapper', () => {
    it('writes the locale as lang, and its script direction as dir', () => {
      const { container } = render(
        <LocaleProvider locale="ar-EG">content</LocaleProvider>
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.tagName).toBe('DIV');
      expect(wrapper).toHaveAttribute('lang', 'ar-EG');
      expect(wrapper).toHaveAttribute('dir', 'rtl');
      expect(wrapper).toHaveTextContent('content');
    });

    it('reads a left-to-right script as ltr', () => {
      const { container } = render(
        <LocaleProvider locale="de">x</LocaleProvider>
      );
      expect(container.firstChild).toHaveAttribute('dir', 'ltr');
      expect(container.firstChild).toHaveAttribute('lang', 'de');
    });

    it('writes the canonical form of the tag', () => {
      const { container } = render(
        <LocaleProvider locale="he-il">x</LocaleProvider>
      );
      expect(container.firstChild).toHaveAttribute('lang', 'he-IL');
      expect(container.firstChild).toHaveAttribute('dir', 'rtl');
    });

    it('takes a direction alone, with no lang', () => {
      const { container } = render(
        <LocaleProvider dir="rtl">x</LocaleProvider>
      );
      expect(container.firstChild).toHaveAttribute('dir', 'rtl');
      expect(container.firstChild).not.toHaveAttribute('lang');
    });

    it('lets dir win over the locale', () => {
      const { container } = render(
        <LocaleProvider locale="ar" dir="ltr">
          x
        </LocaleProvider>
      );
      expect(container.firstChild).toHaveAttribute('dir', 'ltr');
      expect(container.firstChild).toHaveAttribute('lang', 'ar');
    });

    it('writes neither with nothing set, or an empty locale', () => {
      const { container } = render(
        <>
          <LocaleProvider>a</LocaleProvider>
          <LocaleProvider locale="">b</LocaleProvider>
        </>
      );
      for (const wrapper of Array.from(container.children)) {
        expect(wrapper).not.toHaveAttribute('dir');
        expect(wrapper).not.toHaveAttribute('lang');
        expect(wrapper).not.toHaveAttribute('class');
      }
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('forwards its ref, helper props and other attributes to the div', () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <LocaleProvider
          ref={ref}
          locale="fr"
          p="4"
          className="extra"
          id="fr-section"
          data-section="quote"
        >
          x
        </LocaleProvider>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
      expect(ref.current).toHaveClass('p-4', 'extra');
      expect(ref.current).toHaveAttribute('id', 'fr-section');
      expect(ref.current).toHaveAttribute('data-section', 'quote');
    });

    it('prefixes its helper classes under ConfigProvider classPrefix', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bestax-">
          <LocaleProvider locale="fr" p="4" textAlign="centered">
            x
          </LocaleProvider>
        </ConfigProvider>
      );
      expect((container.firstChild as HTMLElement).className).toBe(
        'bestax-p-4 bestax-has-text-centered'
      );
    });
  });

  describe('a locale Intl refuses', () => {
    it('is ignored, with one warning in development', () => {
      const { container } = render(
        <>
          <LocaleProvider locale="en_US">a</LocaleProvider>
          <LocaleProvider locale="en_US">b</LocaleProvider>
        </>
      );
      expect(container.firstChild).not.toHaveAttribute('lang');
      expect(container.firstChild).not.toHaveAttribute('dir');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toMatch(
        /<LocaleProvider locale="en_US">: not a language tag Intl accepts/
      );
    });

    it('leaves the outer provider’s locale in place', () => {
      render(
        <LocaleProvider locale="he">
          <LocaleProvider locale="en_US">
            <ShowLocale />
          </LocaleProvider>
        </LocaleProvider>
      );
      expect(screen.getByTestId('locale')).toHaveTextContent('he|rtl');
    });
  });

  describe('nesting', () => {
    it('inherits both settings when it sets neither', () => {
      const { container } = render(
        <LocaleProvider locale="ar">
          <LocaleProvider data-testid="inner">
            <ShowLocale />
          </LocaleProvider>
        </LocaleProvider>
      );
      expect(screen.getByTestId('locale')).toHaveTextContent('ar|rtl');
      const inner = screen.getByTestId('inner');
      expect(inner).toHaveAttribute('lang', 'ar');
      expect(inner).toHaveAttribute('dir', 'rtl');
      expect(container.firstChild).toContainElement(inner);
    });

    it("takes its own locale's direction over the outer direction", () => {
      render(
        <LocaleProvider locale="ar">
          <LocaleProvider locale="fr">
            <ShowLocale />
          </LocaleProvider>
        </LocaleProvider>
      );
      expect(screen.getByTestId('locale')).toHaveTextContent('fr|ltr');
    });

    it('keeps the outer locale when it sets only a direction', () => {
      render(
        <LocaleProvider locale="de">
          <LocaleProvider dir="rtl">
            <ShowLocale />
          </LocaleProvider>
        </LocaleProvider>
      );
      expect(screen.getByTestId('locale')).toHaveTextContent('de|rtl');
    });

    it('keeps the outer direction when only the outer one sets it', () => {
      render(
        <LocaleProvider dir="rtl">
          <LocaleProvider>
            <ShowLocale />
          </LocaleProvider>
        </LocaleProvider>
      );
      expect(screen.getByTestId('locale')).toHaveTextContent('undefined|rtl');
    });
  });

  describe('useLocale', () => {
    it('returns nothing outside a provider, the same object each time', () => {
      const seen: LocaleContextValue[] = [];
      function Probe() {
        seen.push(useLocale());
        return null;
      }
      const { rerender } = render(<Probe />);
      rerender(<Probe />);
      expect(seen[0]).toEqual({});
      expect(seen[1]).toBe(seen[0]);
    });

    it('tells no provider apart from one that sets nothing (internal)', () => {
      const seen: Array<LocaleContextValue | null> = [];
      function Probe() {
        seen.push(useLocaleScope());
        return null;
      }
      render(
        <>
          <Probe />
          <LocaleProvider>
            <Probe />
          </LocaleProvider>
        </>
      );
      expect(seen).toEqual([null, { locale: undefined, dir: undefined }]);
    });
  });

  describe('portaled content', () => {
    afterEach(() => {
      act(() => {
        toast.closeAll();
        notification.closeAll();
      });
    });

    it('renders as before outside a provider', () => {
      render(
        <>
          <Portal>
            <p data-testid="portaled">Portaled</p>
          </Portal>
          <LocalePortalScope target={document.body}>
            <p data-testid="scoped">Scoped</p>
          </LocalePortalScope>
        </>
      );
      expect(scopeOf(screen.getByTestId('portaled'))).toBe(document.body);
      expect(scopeOf(screen.getByTestId('scoped'))).not.toHaveAttribute(
        'style'
      );
    });

    it("puts a Portal's children in an element carrying dir and lang", () => {
      render(
        <LocaleProvider locale="fa">
          <Portal>
            <p data-testid="portaled">Portaled</p>
          </Portal>
        </LocaleProvider>
      );
      const scope = scopeOf(screen.getByTestId('portaled'));
      expect(scope.parentElement).toBe(document.body);
      expect(scope).toHaveAttribute('dir', 'rtl');
      expect(scope).toHaveAttribute('lang', 'fa');
      expect(scope.style.display).toBe('contents');
    });

    it('adds nothing when the provider sets nothing', () => {
      render(
        <LocaleProvider>
          <Portal>
            <p data-testid="portaled">Portaled</p>
          </Portal>
        </LocaleProvider>
      );
      expect(scopeOf(screen.getByTestId('portaled'))).toBe(document.body);
    });

    it('adds nothing to a container that already carries the values', () => {
      // A table row portaled into a body inside the provider has to stay the
      // body's own child, and inherits dir and lang from the provider.
      function Rows() {
        const [body, setBody] = React.useState<HTMLElement | null>(null);
        return (
          <table>
            <tbody ref={setBody} />
            {body && (
              <Portal container={body}>
                <tr data-testid="row">
                  <td>Cell</td>
                </tr>
              </Portal>
            )}
          </table>
        );
      }
      render(
        <LocaleProvider locale="he">
          <Rows />
        </LocaleProvider>
      );
      const row = screen.getByTestId('row');
      expect(row.parentElement!.tagName).toBe('TBODY');
      expect(row.closest('[lang]')).toHaveAttribute('lang', 'he');
    });

    it('wraps it for a container outside the provider', () => {
      const outside = document.createElement('div');
      document.body.appendChild(outside);
      try {
        render(
          <LocaleProvider locale="he">
            <Portal container={outside}>
              <p data-testid="portaled">Portaled</p>
            </Portal>
          </LocaleProvider>
        );
        const scope = scopeOf(screen.getByTestId('portaled'));
        expect(scope.parentElement).toBe(outside);
        expect(scope).toHaveAttribute('lang', 'he');
        expect(scope).toHaveAttribute('dir', 'rtl');
      } finally {
        outside.remove();
      }
    });

    it('wraps it where only part of the values is inherited', () => {
      // A container in an RTL island with no lang still needs the lang.
      const island = document.createElement('div');
      island.setAttribute('dir', 'rtl');
      document.body.appendChild(island);
      try {
        render(
          <LocaleProvider locale="he">
            <Portal container={island}>
              <p data-testid="portaled">Portaled</p>
            </Portal>
          </LocaleProvider>
        );
        expect(scopeOf(screen.getByTestId('portaled'))).toHaveAttribute(
          'lang',
          'he'
        );
      } finally {
        island.remove();
      }
    });

    it('leaves a disabled Portal in place, inside the wrapper', () => {
      render(
        <LocaleProvider locale="he" data-testid="wrapper">
          <Portal disabled>
            <p data-testid="inline">In place</p>
          </Portal>
        </LocaleProvider>
      );
      expect(scopeOf(screen.getByTestId('inline'))).toBe(
        screen.getByTestId('wrapper')
      );
    });

    it('reaches a portaled Modal and the Dialog built on it', () => {
      render(
        <LocaleProvider locale="ar">
          <Modal active portal aria-label="Modal">
            <Modal.Background />
            <Modal.Content>Body</Modal.Content>
          </Modal>
          <Dialog
            isOpen
            portal
            title="Delete?"
            message="Sure?"
            onConfirm={() => {}}
          />
        </LocaleProvider>
      );
      const [modal, dialog] = screen.getAllByTestId('modal');
      for (const root of [modal, dialog]) {
        expect(scopeOf(root)).toHaveAttribute('dir', 'rtl');
        expect(scopeOf(root)).toHaveAttribute('lang', 'ar');
        expect(scopeOf(root).parentElement).toBe(document.body);
      }
    });

    it('reaches a Sidebar, its overlay included', () => {
      render(
        <LocaleProvider locale="he">
          <Sidebar isOpen overlay>
            Menu
          </Sidebar>
        </LocaleProvider>
      );
      const aside = screen.getByRole('dialog');
      expect(scopeOf(aside)).toHaveAttribute('lang', 'he');
      expect(scopeOf(aside)).toHaveAttribute('dir', 'rtl');
      expect(scopeOf(aside).firstElementChild).toHaveClass(
        'sidebar-background'
      );
    });

    it('reaches a Toast and the toasts a ToastContainer shows', () => {
      render(
        <LocaleProvider locale="ur">
          <Toast message="Saved" duration={0} />
          <ToastContainer />
        </LocaleProvider>
      );
      act(() => {
        toast.show({ message: 'Queued', duration: 0 });
      });
      for (const text of ['Saved', 'Queued']) {
        const container = screen
          .getByText(text)
          .closest('[class~="toast-container"]') as HTMLElement;
        expect(scopeOf(container)).toHaveAttribute('lang', 'ur');
        expect(scopeOf(container)).toHaveAttribute('dir', 'rtl');
      }
    });

    it('reaches the notification container and its status region', () => {
      render(
        <LocaleProvider locale="ar">
          <NotificationContainer />
        </LocaleProvider>
      );
      act(() => {
        notification.show({ message: 'Hello', duration: 0 });
      });
      const status = screen.getByRole('status');
      expect(status.closest('[lang]')).toHaveAttribute('lang', 'ar');
      expect(
        screen.getByText('Hello').closest('[dir]') as HTMLElement
      ).toHaveAttribute('dir', 'rtl');
    });

    it("reaches a Popover's appendToBody panel", () => {
      render(
        <LocaleProvider locale="he">
          <Popover
            trigger={<button type="button">Open</button>}
            appendToBody
            defaultOpen
            ariaLabel="Details"
          >
            Panel
          </Popover>
        </LocaleProvider>
      );
      const panel = screen.getByRole('dialog', { name: 'Details' });
      const scope = panel.closest('[style*="contents"]') as HTMLElement;
      expect(scope).toHaveAttribute('lang', 'he');
      expect(scope.parentElement).toBe(document.body);
    });

    it("reaches a picker's appendToBody popover", () => {
      render(
        <LocaleProvider locale="ar-EG">
          <DateInputBase aria-label="Date" appendToBody />
        </LocaleProvider>
      );
      act(() => {
        screen.getByRole('combobox').focus();
      });
      const panel = document.querySelector(
        '[class~="picker-popover"]'
      ) as HTMLElement;
      expect(scopeOf(panel)).toHaveAttribute('lang', 'ar-EG');
      expect(scopeOf(panel)).toHaveAttribute('dir', 'rtl');
      expect(scopeOf(panel).parentElement).toBe(document.body);
    });
  });

  describe("a picker's own language and direction", () => {
    /** Opens the picker and returns its panel. */
    const openPanel = () => {
      act(() => {
        screen.getByRole('combobox').focus();
      });
      return document.querySelector('[class~="picker-popover"]') as HTMLElement;
    };
    /** The values the element and its content take from the DOM. */
    const inherited = (el: Element) => [
      el.closest('[lang]')?.getAttribute('lang'),
      el.closest('[dir]')?.getAttribute('dir'),
    ];

    it.each([
      ['portaled', true],
      ['in place', false],
    ])(
      "follow its own locale over an Arabic provider's, %s",
      (_, appendToBody) => {
        render(
          <LocaleProvider locale="ar-EG">
            <DateInputBase
              aria-label="Date"
              locale="fr"
              appendToBody={appendToBody}
            />
          </LocaleProvider>
        );
        expect(inherited(openPanel())).toEqual(['fr', 'ltr']);
      }
    );

    it('follow its own dir, with the locale it has', () => {
      render(
        <LocaleProvider locale="fr">
          <DateInputBase
            aria-label="Date"
            locale="ar-EG"
            dir="ltr"
            appendToBody
          />
        </LocaleProvider>
      );
      expect(inherited(openPanel())).toEqual(['ar-EG', 'ltr']);
    });

    it("keep the provider's locale with only a dir of its own", () => {
      render(
        <LocaleProvider locale="ar-EG">
          <DateInputBase aria-label="Date" dir="ltr" appendToBody />
        </LocaleProvider>
      );
      const panel = openPanel();
      expect(inherited(panel)).toEqual(['ar-EG', 'ltr']);
      expect(scopeOf(panel).parentElement).toBe(document.body);
    });

    it('put its own values on its root, so an inline calendar follows them', () => {
      const { container } = render(
        <LocaleProvider locale="ar-EG">
          <DateInput inline aria-label="Date" locale="fr" />
        </LocaleProvider>
      );
      const grid = container.querySelector('[role="grid"]')!;
      expect(inherited(grid)).toEqual(['fr', 'ltr']);
      expect(dayNames()[0]).toBe('lun.');
    });

    it('add nothing to the root with no locale of its own', () => {
      render(
        <LocaleProvider locale="ar-EG" data-testid="wrapper">
          <DateInput inline aria-label="Date" />
        </LocaleProvider>
      );
      const grid = document.querySelector('[role="grid"]')!;
      expect(grid.closest('[lang]')).toBe(screen.getByTestId('wrapper'));
    });

    it('ignore a locale Intl refuses', () => {
      render(
        <LocaleProvider locale="he">
          <TimeInput aria-label="Time" locale="en_US" appendToBody />
        </LocaleProvider>
      );
      expect(inherited(openPanel())).toEqual(['he', 'rtl']);
    });

    it('reach the time, range and date-time pickers', () => {
      const { container } = render(
        <LocaleProvider locale="ar-EG">
          <TimeInput inline aria-label="Time" locale="fr" />
          <DateRangeInput inline aria-label="Stay" locale="fr" />
          <DateTimeInput inline aria-label="Meeting" locale="fr" />
        </LocaleProvider>
      );
      const roots = container.querySelectorAll('[lang="fr"]');
      expect(roots).toHaveLength(3);
      roots.forEach(root => expect(root).toHaveAttribute('dir', 'ltr'));
    });

    it('change nothing outside a provider', () => {
      const { container } = render(
        <DateInput inline aria-label="Date" locale="fr" />
      );
      expect(container.querySelector('[lang]')).toBeNull();
      expect(container.querySelector('[dir]')).toBeNull();
    });
  });

  describe('the pickers', () => {
    it('take the locale for their names, and start the week on its first day', () => {
      render(
        <LocaleProvider locale="de">
          <DateInput
            inline
            aria-label="Date"
            defaultValue={new Date(2026, 9, 1)}
          />
        </LocaleProvider>
      );
      const names = dayNames();
      expect(names[0]).toBe(
        new Intl.DateTimeFormat('de', { weekday: 'short' }).format(
          new Date(2026, 9, 26)
        )
      );
      expect(screen.getByText(/Oktober/)).toBeInTheDocument();
    });

    it('keep their own locale, and start the week on its first day', () => {
      render(
        <LocaleProvider locale="en-US">
          <DateInput inline aria-label="Date" locale="ar-EG" />
        </LocaleProvider>
      );
      // Saturday, for Egypt.
      expect(dayNames()[0]).toBe(
        new Intl.DateTimeFormat('ar-EG', { weekday: 'short' }).format(
          new Date(2026, 9, 31)
        )
      );
    });

    it('keep their own firstDayOfWeek', () => {
      render(
        <LocaleProvider locale="de">
          <DateInput inline aria-label="Date" firstDayOfWeek={3} />
        </LocaleProvider>
      );
      expect(dayNames()[0]).toBe('Mi');
    });

    it('start on Sunday inside a provider with no locale from either', () => {
      render(
        <LocaleProvider dir="rtl">
          <DateInput inline aria-label="Date" />
        </LocaleProvider>
      );
      expect(dayNames()[0]).toBe(
        new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(
          new Date(2026, 9, 25)
        )
      );
    });

    it('start on Sunday outside a provider, whatever their locale', () => {
      render(<DateInput inline aria-label="Date" locale="de" />);
      expect(dayNames()[0]).toBe('So');
    });

    it('start on Sunday for a locale Intl refuses', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      // The picker's own formatting throws on the tag, as it always has;
      // what matters here is that the first day doesn't throw first.
      expect(() =>
        render(
          <LocaleProvider>
            <DateInput inline aria-label="Date" locale="en_US" />
          </LocaleProvider>
        )
      ).toThrow(RangeError);
      (console.error as jest.Mock).mockRestore();
    });

    it('reach the range and date-time pickers', () => {
      render(
        <LocaleProvider locale="en-GB">
          <DateRangeInput inline aria-label="Stay" />
          <DateTimeInput inline aria-label="Meeting" />
        </LocaleProvider>
      );
      const calendars = document.querySelectorAll('[role="grid"]');
      expect(calendars.length).toBeGreaterThanOrEqual(2);
      for (const grid of Array.from(calendars)) {
        expect(dayNames(grid.closest('[class~="dateinput"]')!)[0]).toBe('Mon');
      }
    });

    describe('with their own dayNames', () => {
      // October 2026 starts on a Thursday, so the first cell of the grid is
      // the Sunday, Monday, Wednesday or Saturday before it as the week does.
      const october = new Date(2026, 9, 1);
      const sundayFirst = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
      /** The day of the month in each grid's first cell, in order. */
      const firstCells = () =>
        Array.from(document.querySelectorAll('[role="grid"]')).map(
          grid => grid.querySelector('[role="gridcell"]')!.textContent
        );

      it.each(['de', 'ar-EG'])(
        'keep Sunday inside a %s provider, under the names as given',
        locale => {
          render(
            <LocaleProvider locale={locale}>
              <DateInput
                inline
                aria-label="Date"
                defaultValue={october}
                dayNames={sundayFirst}
              />
            </LocaleProvider>
          );
          expect(dayNames()).toEqual(sundayFirst);
          expect(firstCells()).toEqual(['27']);
        }
      );

      it.each([
        ['de', 1, ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'], '28'],
        [
          'ar-EG',
          6,
          [
            'السبت',
            'الأحد',
            'الاثنين',
            'الثلاثاء',
            'الأربعاء',
            'الخميس',
            'الجمعة',
          ],
          '26',
        ],
      ] as const)(
        'start where firstDayOfWeek says inside a %s provider',
        (locale, firstDayOfWeek, names, firstCell) => {
          render(
            <LocaleProvider locale={locale}>
              <DateInput
                inline
                aria-label="Date"
                defaultValue={october}
                firstDayOfWeek={firstDayOfWeek}
                dayNames={[...names]}
              />
            </LocaleProvider>
          );
          expect(dayNames()).toEqual(names);
          expect(firstCells()).toEqual([firstCell]);
        }
      );

      it('keep Sunday in the range and date-time pickers too', () => {
        render(
          <LocaleProvider locale="de">
            <DateRangeInput
              inline
              aria-label="Stay"
              defaultValue={[october, null]}
              dayNames={sundayFirst}
            />
            <DateTimeInput
              inline
              aria-label="Meeting"
              defaultValue={october}
              dayNames={sundayFirst}
            />
          </LocaleProvider>
        );
        expect(firstCells()).toEqual(['27', '27']);
      });

      it('move with the locale when the names are not a full week', () => {
        // The calendar ignores anything but seven names and shows its own,
        // which follow the week wherever it starts.
        render(
          <LocaleProvider locale="de">
            <DateInput
              inline
              aria-label="Date"
              defaultValue={october}
              dayNames={['A', 'B']}
            />
          </LocaleProvider>
        );
        expect(dayNames()[0]).toBe('Mo');
        expect(firstCells()).toEqual(['28']);
      });
    });

    it("give the time picker the provider's locale for Intl formats", () => {
      render(
        <LocaleProvider locale="de">
          <TimeInput
            aria-label="Time"
            format={{ hour: 'numeric', minute: '2-digit', hour12: true }}
            parse={() => null}
            value={new Date(2026, 0, 1, 14, 5)}
          />
        </LocaleProvider>
      );
      expect(screen.getByRole('combobox')).toHaveValue(
        new Intl.DateTimeFormat('de', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).format(new Date(2026, 0, 1, 14, 5))
      );
    });
  });
});
