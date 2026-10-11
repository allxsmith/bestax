import React, { createContext, useContext, ReactNode } from 'react';

/** Supported icon library identifiers. */
type IconLibrary = 'fa' | 'mdi' | 'ion' | 'material-icons' | 'material-symbols';

/**
 * Shape of the configuration context value.
 */
export interface ConfigContextProps {
  /** Prefix applied to all Bulma class names. */
  classPrefix?: string;
  /** Default icon library for Icon components. */
  iconLibrary?: IconLibrary;
  /** Where portaled content goes when it has no target of its own. */
  portalContainer?: string | HTMLElement;
}

const ConfigContext = createContext<ConfigContextProps>({});

/**
 * Hook to access the bulma-ui configuration context.
 *
 * @function
 * @returns {ConfigContextProps} The current configuration values.
 */
export const useConfig = () => useContext(ConfigContext);

/**
 * Props for the ConfigProvider component.
 */
export interface ConfigProviderProps {
  /** Child components to receive configuration. */
  children: ReactNode;
  /** Prefix applied to all Bulma class names. */
  classPrefix?: string;
  /** Default icon library for Icon components. */
  iconLibrary?: IconLibrary;
  /**
   * Where portaled content goes when it has no target of its own: what a
   * `Portal` without a `container` renders, and what the library's components
   * portal, such as Popover's `appendToBody` panel, a `Modal` with `portal`
   * set to `true`, or a `Toast`. An element, or a `document.querySelector`
   * selector. Unset, or a selector that matches nothing, that content goes to
   * `document.body`. A target a component is given, such as a `Toast`'s
   * `container`, still wins, and nothing portals that would otherwise render
   * in place. A selector can't find an element inside a shadow root, so pass
   * the element itself there, held in state from a ref callback so the
   * content renders once it exists.
   */
  portalContainer?: string | HTMLElement;
}

/**
 * ConfigProvider injects configuration into all child components via React context.
 *
 * A nested provider replaces the outer one's settings rather than adding to
 * them, so inside it any setting it leaves out is back to its default.
 *
 * @function
 * @param {ConfigProviderProps} props - Provider props.
 * @returns {JSX.Element} The context provider wrapping children.
 *
 * @example
 * <ConfigProvider classPrefix="my-" iconLibrary="mdi">
 *   <App />
 * </ConfigProvider>
 */
export const ConfigProvider: React.FC<ConfigProviderProps> = ({
  classPrefix,
  iconLibrary,
  portalContainer,
  children,
}) => {
  return (
    <ConfigContext.Provider
      value={{ classPrefix, iconLibrary, portalContainer }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

/**
 * Utility hook to get the configured class prefix string.
 *
 * @function
 * @returns {string} The class prefix, or empty string if none configured.
 */
export const useClassPrefix = () => {
  const { classPrefix } = useConfig();
  return classPrefix || '';
};

/**
 * Hook that returns a function to prefix a class name with the configured prefix.
 *
 * @function
 * @returns {(className: string) => string} A function that applies the class prefix.
 */
export const usePrefixedClass = () => {
  const { classPrefix } = useConfig();
  return (className: string) =>
    classPrefix ? `${classPrefix}${className}` : className;
};

/**
 * Hook to get the default icon library from configuration.
 *
 * @function
 * @returns {IconLibrary | undefined} The configured icon library, or undefined.
 */
export const useIconLibrary = () => {
  const { iconLibrary } = useConfig();
  return iconLibrary;
};
