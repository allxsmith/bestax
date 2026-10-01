// INTERNAL: deliberately not exported from src/index.ts.
import React from 'react';

/** The major version of the React this bundle is running against. */
const runningMajor = (): number => Number(React.version.split('.')[0]);

/**
 * The prop that makes an element inert, spelled for the React in use, or
 * nothing when `inert` is false.
 *
 * Both majors must render `inert=""`, and each warns on the other's spelling
 * and then drops the attribute. React 19 treats `inert` as a boolean and
 * rejects the empty string. React 18 does not know the attribute, so it
 * passes a string through and rejects `true`.
 */
export const inertProps = (
  inert: boolean,
  major: number = runningMajor()
): React.HTMLAttributes<HTMLElement> => {
  if (!inert) return {};
  // The cast is for React 18's spelling: this package's types are React 19's,
  // where `inert` is a boolean.
  return (major >= 19
    ? { inert: true }
    : { inert: '' }) as unknown as React.HTMLAttributes<HTMLElement>;
};
