import { createContext, useContext } from 'react';

// Whether the nearest enclosing `Control` shows its `isLoading` spinner. The
// picker bases read it so their right-side launcher gives way to that
// spinner, which sits at the same edge, whether the `Control` is the one a
// convenience input renders or one the caller wrapped around the input.
// Autocomplete reads it for its clear button, which sits there too.
// Kept apart from `FormContext`, whose contexts only report whether a `Field`
// or `Control` is present. Internal; not part of the public API.
const ControlLoadingContext = createContext(false);

/** Provider for the loading state, used internally by `Control`. */
export const ControlLoadingProvider = ControlLoadingContext.Provider;

/** Whether the nearest enclosing `Control` is loading; `false` outside one. */
export const useControlLoading = () => useContext(ControlLoadingContext);
