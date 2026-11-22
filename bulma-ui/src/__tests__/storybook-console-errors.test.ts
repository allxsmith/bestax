/**
 * The Storybook smoke pass fails a story on the console errors it logs, and
 * `.storybook/consoleErrors.ts` decides which those are: not a failed load
 * from an RFC 2606 `.invalid` host, which a broken-image story means to make,
 * not what YouTube's player script logs in Image's With Iframe story (#2294),
 * and not React's note about the harness's unawaited `act`.
 */
import { isStoryError } from '../../.storybook/consoleErrors';

/** A console message, with what the check reads of Playwright's. */
const message = (type: string, url: string, text = 'Something went wrong') => ({
  type: () => type,
  text: () => text,
  location: () => ({ url }),
});

/**
 * Where a story's own console error is located in the smoke pass: Vitest's
 * console wrapper, which `describe()` in the config leaves out of the message.
 */
const STORY = 'http://localhost:63315/__vitest_browser__/tester/tester.html';

describe('the console errors that fail a story in the smoke pass', () => {
  it.each([
    STORY,
    // A failed load of one of the story's own modules or files.
    'http://localhost:63315/src/elements/Image.tsx',
    // No location to read.
    '',
    // Hosts that aren't YouTube's, though they name it.
    'https://youtube.com.example.org/base.js',
    'https://notyoutube.com/base.js',
    'https://example.org/?next=https://www.youtube.com/',
  ])('counts an error from %s', url => {
    expect(isStoryError(message('error', url))).toBe(true);
  });

  it.each([
    'https://example.invalid/missing.jpg',
    'http://photos.example.invalid',
    // Where YouTube's player script logged the errors that failed CI.
    'https://www.youtube.com/s/player/6b3d0364/player_embed.vflset/en_US/base.js',
    'https://www.youtube.com/embed/YE7VzlLtp-4',
    'https://youtube.com/',
    'https://www.youtube-nocookie.com/embed/YE7VzlLtp-4',
  ])('leaves out an error from %s', url => {
    expect(isStoryError(message('error', url))).toBe(false);
  });

  it('counts an error with no location at all', () => {
    const unplaced = { ...message('error', ''), location: () => undefined };
    expect(isStoryError(unplaced)).toBe(true);
  });

  it("leaves out React's note about the harness's unawaited act", () => {
    const note =
      'A component suspended inside an `act` scope, but the `act` call was not awaited.';
    expect(isStoryError(message('error', STORY, note))).toBe(false);
  });

  it.each(['warning', 'log', 'info'])(
    'leaves out a %s from the story',
    type => {
      expect(isStoryError(message(type, STORY))).toBe(false);
    }
  );
});
