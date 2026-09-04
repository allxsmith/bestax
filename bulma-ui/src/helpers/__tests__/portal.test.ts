import { resolvePortalContainer } from '../portal';

describe('resolvePortalContainer', () => {
  it('resolves to document.body when no container is given', () => {
    expect(resolvePortalContainer()).toBe(document.body);
  });

  it('resolves an element container directly', () => {
    const el = document.createElement('div');
    expect(resolvePortalContainer(el)).toBe(el);
  });

  it('resolves a string container via querySelector', () => {
    const el = document.createElement('div');
    el.id = 'target';
    document.body.appendChild(el);
    expect(resolvePortalContainer('#target')).toBe(el);
    document.body.removeChild(el);
  });

  it('falls back to document.body when the selector matches nothing', () => {
    expect(resolvePortalContainer('#does-not-exist')).toBe(document.body);
  });

  it('treats an empty string as no container rather than querying it', () => {
    // document.querySelector('') throws a SyntaxError, so the empty string has
    // to short-circuit to document.body — Toast relied on this before the
    // resolver was extracted here.
    expect(() => resolvePortalContainer('')).not.toThrow();
    expect(resolvePortalContainer('')).toBe(document.body);
  });
});
