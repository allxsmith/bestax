import React, { createContext, useContext, ReactNode } from 'react';

export interface ConfigContextProps {
  classPrefix?: string;
}

const ConfigContext = createContext<ConfigContextProps>({});

export const useConfig = () => useContext(ConfigContext);

export interface ConfigProviderProps {
  children: ReactNode;
  classPrefix?: string;
}

/**
 * ConfigProvider injects a classPrefix into all child components via React context.
 * - classPrefix: Used by components to prefix their classNames.
 */
export const ConfigProvider: React.FC<ConfigProviderProps> = ({
  classPrefix,
  children,
}) => {
  return (
    <ConfigContext.Provider value={{ classPrefix }}>
      {children}
    </ConfigContext.Provider>
  );
};

/**
 * Utility hook for components to get the classPrefix and apply it to their classNames.
 * Usage: const { classPrefix } = useConfig();
 */
export const useClassPrefix = () => {
  const { classPrefix } = useConfig();
  return classPrefix || '';
};

/**
 * Utility function to create prefixed Bulma modifier classes.
 * Usage: const prefixedClass = usePrefixedClass('is-primary');
 */
export const usePrefixedClass = () => {
  const { classPrefix } = useConfig();
  return (className: string) =>
    classPrefix ? `${classPrefix}${className}` : className;
};
