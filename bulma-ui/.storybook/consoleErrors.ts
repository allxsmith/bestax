/**
 * Which console messages fail a story in the smoke pass
 * (`vitest.storybook.config.ts`): its errors, less those that aren't the
 * story's own.
 */

/**
 * A story that demos a broken-image fallback loads from an RFC 2606 `.invalid`
 * host (Avatar's https://example.invalid/missing.jpg), and that load failing
 * is the story working as intended.
 */
const INVALID_HOST = /^https?:\/\/[^/]*\.invalid(\/|$)/;

/**
 * Image's With Iframe story embeds a YouTube video, and YouTube's player
 * script sometimes logs an error, located at that script on YouTube's host
 * (#2294). What YouTube's own code logs isn't the story's.
 */
const YOUTUBE_HOST =
  /^https?:\/\/([a-z0-9-]+\.)*(youtube\.com|youtube-nocookie\.com)(:\d+)?(\/|$)/;

/**
 * Storybook's test integration runs each user event inside a React `act` that
 * it does not await, and React says so whenever that leaves work queued. The
 * warning is about the harness rather than the story, and outside a test
 * there is no `act` to give it.
 */
const UNAWAITED_ACT = /^A component suspended inside an `act` scope/;

/** What the check reads from a console message, Playwright's included. */
interface ConsoleMessageLike {
  type(): string;
  text(): string;
  location(): { url: string } | undefined;
}

/** Whether a console message is an error of the story's own. */
export function isStoryError(msg: ConsoleMessageLike): boolean {
  if (msg.type() !== 'error') return false;
  const url = msg.location()?.url ?? '';
  if (INVALID_HOST.test(url) || YOUTUBE_HOST.test(url)) return false;
  return !UNAWAITED_ACT.test(msg.text());
}
