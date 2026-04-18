import { createContext, useContext } from 'react';

const FieldContext = createContext(false);
const ControlContext = createContext(false);

/**
 * Hook to detect if the component is inside a Field wrapper.
 * Form components use this to skip rendering their own Field.
 */
export const useInsideField = () => useContext(FieldContext);

/**
 * Hook to detect if the component is inside a Control wrapper.
 * Form components use this to skip rendering their own Control.
 */
export const useInsideControl = () => useContext(ControlContext);

/** Provider for Field context — used internally by Field component. */
export const FieldProvider = FieldContext.Provider;

/** Provider for Control context — used internally by Control component. */
export const ControlProvider = ControlContext.Provider;
