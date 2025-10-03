import React, { createContext, useContext, ReactNode } from 'react';

type IconLibrary = 'fa' | 'mdi' | 'ion' | 'material-icons' | 'material-symbols';

export interface ConfigContextProps {
  classPrefix?: string;
  iconLibrary?: IconLibrary;
}

const ConfigContext = createContext<ConfigContextProps>({});

export const useConfig = () => useContext(ConfigContext);

export interface ConfigProviderProps {
  children: ReactNode;
  classPrefix?: string;
  iconLibrary?: IconLibrary;
}

/**
 * ConfigProvider injects configuration into all child components via React context.
 * - classPrefix: Used by components to prefix their classNames.
 * - iconLibrary: Sets the default icon library for Icon components.
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

/**
 * Utility hook to get the default icon library setting.
 * Usage: const iconLibrary = useIconLibrary();
 */
export const useIconLibrary = () => {
  const { iconLibrary } = useConfig();
  return iconLibrary;
};
