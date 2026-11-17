import { isAtBulmaBreakpoint } from '../useBulmaViewport';

/** A window that answers `matchMedia` as one `width` pixels wide would. */
const windowOf = (width: number) => {
  const asked: string[] = [];
  const win = {
    matchMedia: (query: string) => {
      asked.push(query);
      return {
        matches: query
          .split(',')
          .some(
            part =>
              width >=
              Number(/min-width:\s*(\d+)px/.exec(part)?.[1] ?? Infinity)
          ),
      };
    },
  } as unknown as Window;
  return { win, asked };
};

describe('isAtBulmaBreakpoint', () => {
  it('asks the window it is given, through the query Bulma opens the breakpoint with', () => {
    const { win, asked } = windowOf(1024);
    expect(isAtBulmaBreakpoint('desktop', win)).toBe(true);
    expect(asked).toEqual(['screen and (min-width: 1024px)']);
    expect(isAtBulmaBreakpoint('desktop', windowOf(1023).win)).toBe(false);
    expect(isAtBulmaBreakpoint('tablet', windowOf(769).win)).toBe(true);
  });

  it('reads as wide with no window, or no matchMedia, as a server renders', () => {
    expect(isAtBulmaBreakpoint('desktop', null)).toBe(true);
    expect(isAtBulmaBreakpoint('desktop', {} as Window)).toBe(true);
  });
});
