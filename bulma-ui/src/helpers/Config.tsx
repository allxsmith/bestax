import React, { createContext, useContext, ReactNode } from 'react';

/** Supported icon library identifiers. */
type IconLibrary = 'fa' | 'mdi' | 'ion' | 'material-icons' | 'material-symbols';

/**
 * Shape of the configuration context value.
 *
 * @property {string} [classPrefix] - Prefix applied to all Bulma class names.
 * @property {IconLibrary} [iconLibrary] - Default icon library for Icon components.
 */
export interface ConfigContextProps {
  classPrefix?: string;
  iconLibrary?: IconLibrary;
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
 *
 * @property {React.ReactNode} children - Child components to receive configuration.
 * @property {string} [classPrefix] - Prefix applied to all Bulma class names.
 * @property {IconLibrary} [iconLibrary] - Default icon library for Icon components.
 */
export interface ConfigProviderProps {
  children: ReactNode;
  classPrefix?: string;
  iconLibrary?: IconLibrary;
}

/**
 * ConfigProvider injects configuration into all child components via React context.
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
  children,
}) => {
  return (
    <ConfigContext.Provider value={{ classPrefix, iconLibrary }}>
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
