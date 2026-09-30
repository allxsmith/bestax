import type React from 'react';

/** The values HTML defines for a `<button>`'s `type`. */
export type ButtonType = NonNullable<
  React.ButtonHTMLAttributes<HTMLButtonElement>['type']
>;

/**
 * The `type` to render on a `<button>` a component defaults to `button`: the
 * caller's own value when it is `button`, `submit` or `reset`, and `button`
 * otherwise.
 *
 * A missing `type` is not the only way a button ends up submitting the form
 * around it. HTML reads an invalid value, such as the anchor's MIME-type
 * `type="text/html"`, as submit too, and a props spread carrying
 * `type: undefined` removes the attribute outright. Both can arrive through a
 * spread or an untyped caller the component's own types never see, so this
 * checks the value rather than trusting where it came from.
 *
 * Call it AFTER the forwarded props are spread and pass it the forwarded
 * `type`, so its result is the attribute that renders.
 */
export function buttonType(given: unknown): ButtonType {
  return given === 'submit' || given === 'reset' || given === 'button'
    ? given
    : 'button';
}
