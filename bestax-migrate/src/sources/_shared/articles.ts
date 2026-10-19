/**
 * A tag with the article it takes in a TODO message, read aloud: "an <a>",
 * "an <input>", "an <h2>", "a <button>", "a <ul>". A tag starting with a
 * vowel letter takes "an", but `<u>` and `<ul>` (read "you"), and so does a
 * heading (read "aitch").
 */
export function aTag(tag: string): string {
  return `${/^(?:[aeio]|h\d$)/.test(tag) ? 'an' : 'a'} <${tag}>`;
}
