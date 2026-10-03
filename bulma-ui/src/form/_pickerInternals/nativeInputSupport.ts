const support = new Map<string, boolean>();

/**
 * Whether this browser implements `<input type={type}>`. A browser that
 * doesn't know a type reads it back as `'text'`, so this sets the type on a
 * detached input and checks what sticks. The answer can't change within a
 * page, so it is worked out once per type.
 *
 * It needs a DOM, so callers ask only after hydration. It also can't see a
 * browser that recognises a type without drawing a control for it: desktop
 * Safari reports `'month'` but shows a plain text box.
 */
export function supportsInputType(type: string): boolean {
  let supported = support.get(type);
  if (supported === undefined) {
    const input = document.createElement('input');
    input.setAttribute('type', type);
    supported = input.type === type;
    support.set(type, supported);
  }
  return supported;
}
