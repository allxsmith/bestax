import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  ConfigProvider,
  useConfig,
  useClassPrefix,
  usePrefixedClass,
  useIconLibrary,
} from '../Config';
import { usePrefixedClassNames } from '../classNames';
import { Button } from '../../elements/Button';
import { Buttons } from '../../elements/Buttons';
import { Icon } from '../../elements/Icon';

// Test component that uses useConfig hook
const TestConfigComponent = () => {
  const config = useConfig();
  return <div data-testid="config-value">{JSON.stringify(config)}</div>;
};

// Test component that uses useClassPrefix hook
const TestClassPrefixComponent = () => {
  const classPrefix = useClassPrefix();
  return (
    <div data-testid="class-prefix" className={`${classPrefix}test-class`}>
      {classPrefix || 'no-prefix'}
    </div>
  );
};

// Test component that uses usePrefixedClass hook
const TestPrefixedClassComponent = () => {
  const prefixedClass = usePrefixedClass();
  const buttonClass = prefixedClass('button');
  const primaryClass = prefixedClass('is-primary');
  return (
    <div data-testid="prefixed-classes">
      <span data-testid="button-class">{buttonClass}</span>
      <span data-testid="primary-class">{primaryClass}</span>
    </div>
  );
};

// Test component that uses usePrefixedClassNames hook
const TestUsePrefixedClassNamesComponent = () => {
  const classes = usePrefixedClassNames('button', { 'is-primary': true });
  return <div data-testid="prefixed-classnames">{classes}</div>;
};

// Component that simulates how a real Bulma component would use the prefix
const MockBulmaComponent = ({ className = '' }: { className?: string }) => {
  const classPrefix = useClassPrefix();
  const baseClass = `${classPrefix}button`;
  const finalClass = className ? `${baseClass} ${className}` : baseClass;

  return (
    <button data-testid="mock-bulma-component" className={finalClass}>
      Button
    </button>
  );
};

// Test component that uses useIconLibrary hook
const TestIconLibraryComponent = () => {
  const iconLibrary = useIconLibrary();
  return <div data-testid="icon-library">{iconLibrary || 'no-library'}</div>;
};

describe('ConfigProvider', () => {
  it('provides default empty config when no props are passed', () => {
    const { getByTestId } = render(
      <ConfigProvider>
        <TestConfigComponent />
      </ConfigProvider>
    );

    const configValue = getByTestId('config-value');
    expect(configValue.textContent).toBe('{}');
  });

  it('provides classPrefix via context', () => {
    const { getByTestId } = render(
      <ConfigProvider classPrefix="bulma-">
        <TestConfigComponent />
      </ConfigProvider>
    );

    const configValue = getByTestId('config-value');
    expect(configValue.textContent).toContain('"classPrefix":"bulma-"');
  });

  it('provides iconLibrary via context', () => {
    const { getByTestId } = render(
      <ConfigProvider iconLibrary="mdi">
        <TestConfigComponent />
      </ConfigProvider>
    );

    const configValue = getByTestId('config-value');
    expect(configValue.textContent).toContain('"iconLibrary":"mdi"');
  });

  it('provides both classPrefix and iconLibrary via context', () => {
    const { getByTestId } = render(
      <ConfigProvider classPrefix="bulma-" iconLibrary="material-icons">
        <TestConfigComponent />
      </ConfigProvider>
    );

    const configValue = getByTestId('config-value');
    expect(configValue.textContent).toContain('"classPrefix":"bulma-"');
    expect(configValue.textContent).toContain('"iconLibrary":"material-icons"');
  });

  it('provides empty string classPrefix when undefined', () => {
    const { getByTestId } = render(
      <ConfigProvider classPrefix={undefined}>
        <TestConfigComponent />
      </ConfigProvider>
    );

    const configValue = getByTestId('config-value');
    expect(configValue.textContent).toBe('{}');
  });

  it('updates context when classPrefix prop changes', () => {
    const { getByTestId, rerender } = render(
      <ConfigProvider classPrefix="old-">
        <TestConfigComponent />
      </ConfigProvider>
    );

    expect(getByTestId('config-value').textContent).toContain(
      '"classPrefix":"old-"'
    );

    rerender(
      <ConfigProvider classPrefix="new-">
        <TestConfigComponent />
      </ConfigProvider>
    );

    expect(getByTestId('config-value').textContent).toContain(
      '"classPrefix":"new-"'
    );
  });

  it('allows nested ConfigProviders with different prefixes', () => {
    const OuterComponent = () => {
      const config = useConfig();
      return <div data-testid="outer-config">{JSON.stringify(config)}</div>;
    };

    const InnerComponent = () => {
      const config = useConfig();
      return <div data-testid="inner-config">{JSON.stringify(config)}</div>;
    };

    const { getByTestId } = render(
      <ConfigProvider classPrefix="outer-">
        <OuterComponent />
        <ConfigProvider classPrefix="inner-">
          <InnerComponent />
        </ConfigProvider>
      </ConfigProvider>
    );

    expect(getByTestId('outer-config').textContent).toContain(
      '"classPrefix":"outer-"'
    );
    expect(getByTestId('inner-config').textContent).toContain(
      '"classPrefix":"inner-"'
    );
  });
});

describe('useConfig', () => {
  it('returns empty object when used outside ConfigProvider', () => {
    const { getByTestId } = render(<TestConfigComponent />);

    const configValue = getByTestId('config-value');
    expect(configValue.textContent).toBe('{}');
  });

  it('returns context value when used inside ConfigProvider', () => {
    const { getByTestId } = render(
      <ConfigProvider classPrefix="test-">
        <TestConfigComponent />
      </ConfigProvider>
    );

    const configValue = getByTestId('config-value');
    expect(configValue.textContent).toContain('"classPrefix":"test-"');
  });
});

describe('useIconLibrary', () => {
  it('returns undefined when used outside ConfigProvider', () => {
    const { getByTestId } = render(<TestIconLibraryComponent />);

    const element = getByTestId('icon-library');
    expect(element.textContent).toBe('no-library');
  });

  it('returns undefined when iconLibrary is not provided', () => {
    const { getByTestId } = render(
      <ConfigProvider>
        <TestIconLibraryComponent />
      </ConfigProvider>
    );

    const element = getByTestId('icon-library');
    expect(element.textContent).toBe('no-library');
  });

  it('returns iconLibrary when provided', () => {
    const { getByTestId } = render(
      <ConfigProvider iconLibrary="mdi">
        <TestIconLibraryComponent />
      </ConfigProvider>
    );

    const element = getByTestId('icon-library');
    expect(element.textContent).toBe('mdi');
  });

  it('works with different icon library values', () => {
    const { getByTestId, rerender } = render(
      <ConfigProvider iconLibrary="material-icons">
        <TestIconLibraryComponent />
      </ConfigProvider>
    );

    expect(getByTestId('icon-library').textContent).toBe('material-icons');

    rerender(
      <ConfigProvider iconLibrary="ion">
        <TestIconLibraryComponent />
      </ConfigProvider>
    );

    expect(getByTestId('icon-library').textContent).toBe('ion');
  });
});

describe('useClassPrefix', () => {
  it('returns empty string when used outside ConfigProvider', () => {
    const { getByTestId } = render(<TestClassPrefixComponent />);

    const element = getByTestId('class-prefix');
    expect(element.textContent).toBe('no-prefix');
    expect(element.className).toBe('test-class');
  });

  it('returns empty string when classPrefix is undefined', () => {
    const { getByTestId } = render(
      <ConfigProvider>
        <TestClassPrefixComponent />
      </ConfigProvider>
    );

    const element = getByTestId('class-prefix');
    expect(element.textContent).toBe('no-prefix');
    expect(element.className).toBe('test-class');
  });

  it('returns classPrefix when provided', () => {
    const { getByTestId } = render(
      <ConfigProvider classPrefix="bulma-">
        <TestClassPrefixComponent />
      </ConfigProvider>
    );

    const element = getByTestId('class-prefix');
    expect(element.textContent).toBe('bulma-');
    expect(element.className).toBe('bulma-test-class');
  });

  it('works with different prefix values', () => {
    const { getByTestId } = render(
      <ConfigProvider classPrefix="my-ui-">
        <TestClassPrefixComponent />
      </ConfigProvider>
    );

    const element = getByTestId('class-prefix');
    expect(element.textContent).toBe('my-ui-');
    expect(element.className).toBe('my-ui-test-class');
  });

  it('handles empty string prefix', () => {
    const { getByTestId } = render(
      <ConfigProvider classPrefix="">
        <TestClassPrefixComponent />
      </ConfigProvider>
    );

    const element = getByTestId('class-prefix');
    expect(element.textContent).toBe('no-prefix');
    expect(element.className).toBe('test-class');
  });
});

describe('Integration with mock Bulma components', () => {
  it('applies prefix to component base classes', () => {
    const { getByTestId } = render(
      <ConfigProvider classPrefix="bulma-">
        <MockBulmaComponent />
      </ConfigProvider>
    );

    const component = getByTestId('mock-bulma-component');
    expect(component.className).toBe('bulma-button');
  });

  it('applies prefix while preserving additional classes', () => {
    const { getByTestId } = render(
      <ConfigProvider classPrefix="bulma-">
        <MockBulmaComponent className="is-primary is-large" />
      </ConfigProvider>
    );

    const component = getByTestId('mock-bulma-component');
    expect(component.className).toBe('bulma-button is-primary is-large');
  });

  it('works without prefix', () => {
    const { getByTestId } = render(
      <MockBulmaComponent className="is-primary" />
    );

    const component = getByTestId('mock-bulma-component');
    expect(component.className).toBe('button is-primary');
  });

  it('applies different prefixes in nested providers', () => {
    const { getAllByTestId, getByTestId } = render(
      <ConfigProvider classPrefix="outer-">
        <MockBulmaComponent />
        <ConfigProvider classPrefix="inner-">
          <div data-testid="nested-wrapper">
            <MockBulmaComponent />
          </div>
        </ConfigProvider>
      </ConfigProvider>
    );

    const components = getAllByTestId('mock-bulma-component');
    const nestedComponent = getByTestId('nested-wrapper').querySelector(
      '[data-testid="mock-bulma-component"]'
    );

    // First component should have outer prefix
    expect(components[0].className).toBe('outer-button');
    // Nested component should have inner prefix
    expect(nestedComponent?.className).toBe('inner-button');
  });
});

describe('usePrefixedClass', () => {
  it('returns function that adds prefix when classPrefix provided', () => {
    const { getByTestId } = render(
      <ConfigProvider classPrefix="bulma-">
        <TestPrefixedClassComponent />
      </ConfigProvider>
    );

    expect(getByTestId('button-class').textContent).toBe('bulma-button');
    expect(getByTestId('primary-class').textContent).toBe('bulma-is-primary');
  });

  it('returns function that returns original class when no prefix', () => {
    const { getByTestId } = render(<TestPrefixedClassComponent />);

    expect(getByTestId('button-class').textContent).toBe('button');
    expect(getByTestId('primary-class').textContent).toBe('is-primary');
  });

  it('returns function that returns original class when classPrefix is undefined', () => {
    const { getByTestId } = render(
      <ConfigProvider classPrefix={undefined}>
        <TestPrefixedClassComponent />
      </ConfigProvider>
    );

    expect(getByTestId('button-class').textContent).toBe('button');
    expect(getByTestId('primary-class').textContent).toBe('is-primary');
  });
});

describe('usePrefixedClassNames', () => {
  it('applies prefix to all classes when classPrefix provided', () => {
    const { getByTestId } = render(
      <ConfigProvider classPrefix="bulma-">
        <TestUsePrefixedClassNamesComponent />
      </ConfigProvider>
    );

    expect(getByTestId('prefixed-classnames').textContent).toBe(
      'bulma-button bulma-is-primary'
    );
  });

  it('returns classes without prefix when no classPrefix', () => {
    const { getByTestId } = render(<TestUsePrefixedClassNamesComponent />);

    expect(getByTestId('prefixed-classnames').textContent).toBe(
      'button is-primary'
    );
  });

  it('returns classes without prefix when classPrefix is undefined', () => {
    const { getByTestId } = render(
      <ConfigProvider classPrefix={undefined}>
        <TestUsePrefixedClassNamesComponent />
      </ConfigProvider>
    );

    expect(getByTestId('prefixed-classnames').textContent).toBe(
      'button is-primary'
    );
  });
});

describe('Real-world usage scenarios', () => {
  it('supports micro-frontend prefixing scenario', () => {
    const MicroFrontendApp = () => (
      <ConfigProvider classPrefix="mf-bulma-">
        <div data-testid="app-wrapper">
          <MockBulmaComponent className="is-primary" />
          <MockBulmaComponent className="is-secondary is-outlined" />
        </div>
      </ConfigProvider>
    );

    const { getByTestId } = render(<MicroFrontendApp />);
    const wrapper = getByTestId('app-wrapper');
    const buttons = wrapper.querySelectorAll('button');

    expect(buttons[0].className).toBe('mf-bulma-button is-primary');
    expect(buttons[1].className).toBe(
      'mf-bulma-button is-secondary is-outlined'
    );
  });

  it('supports library integration scenario', () => {
    const LibraryComponent = () => (
      <ConfigProvider classPrefix="lib-">
        <div data-testid="library-wrapper">
          <MockBulmaComponent />
        </div>
      </ConfigProvider>
    );

    render(
      <div>
        <MockBulmaComponent /> {/* Standard Bulma */}
        <LibraryComponent /> {/* Prefixed Bulma */}
      </div>
    );

    const buttons = document.querySelectorAll('button');
    expect(buttons[0].className).toBe('button'); // Standard
    expect(buttons[1].className).toBe('lib-button'); // Prefixed
  });

  it('handles multiple ConfigProviders at different levels', () => {
    render(
      <ConfigProvider classPrefix="app-">
        <MockBulmaComponent />
        <div data-testid="section-1">
          <ConfigProvider classPrefix="section-">
            <MockBulmaComponent />
            <div data-testid="subsection">
              <ConfigProvider classPrefix="sub-">
                <MockBulmaComponent />
              </ConfigProvider>
            </div>
          </ConfigProvider>
        </div>
      </ConfigProvider>
    );

    const buttons = document.querySelectorAll('button');
    expect(buttons[0].className).toBe('app-button'); // Top level
    expect(buttons[1].className).toBe('section-button'); // Section level
    expect(buttons[2].className).toBe('sub-button'); // Subsection level
  });
});

// Moved from elements/__tests__/Config.integration.test.tsx
describe('Complete prefix functionality', () => {
  it('applies prefix to all classes in a complete example', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bulma-">
        <Buttons isCentered hasAddons mt="4">
          <Button color="primary" size="large" isRounded m="2">
            Primary
          </Button>
          <Button color="info" isOutlined p="3">
            Info
          </Button>
        </Buttons>
      </ConfigProvider>
    );

    // Check Buttons container
    const buttonsContainer = container.querySelector('.bulma-buttons');
    expect(buttonsContainer).toBeInTheDocument();
    expect(buttonsContainer).toHaveClass('bulma-buttons');
    expect(buttonsContainer).toHaveClass('bulma-is-centered');
    expect(buttonsContainer).toHaveClass('bulma-has-addons');
    expect(buttonsContainer).toHaveClass('bulma-mt-4');

    // Check first Button
    const buttons = container.querySelectorAll('button');
    expect(buttons[0]).toHaveClass('bulma-button');
    expect(buttons[0]).toHaveClass('bulma-is-primary');
    expect(buttons[0]).toHaveClass('bulma-is-large');
    expect(buttons[0]).toHaveClass('bulma-is-rounded');
    expect(buttons[0]).toHaveClass('bulma-m-2');

    // Check second Button
    expect(buttons[1]).toHaveClass('bulma-button');
    expect(buttons[1]).toHaveClass('bulma-is-info');
    expect(buttons[1]).toHaveClass('bulma-is-outlined');
    expect(buttons[1]).toHaveClass('bulma-p-3');
  });

  it('works without prefix (standard behavior)', () => {
    const { container } = render(
      <Buttons isCentered mt="4">
        <Button color="primary" size="large" m="2">
          Primary
        </Button>
      </Buttons>
    );

    // Check Buttons container
    const buttonsContainer = container.querySelector('.buttons');
    expect(buttonsContainer).toHaveClass('buttons');
    expect(buttonsContainer).toHaveClass('is-centered');
    expect(buttonsContainer).toHaveClass('mt-4');

    // Check Button
    const button = container.querySelector('button');
    expect(button).toHaveClass('button');
    expect(button).toHaveClass('is-primary');
    expect(button).toHaveClass('is-large');
    expect(button).toHaveClass('m-2');
  });

  it('handles nested providers correctly', () => {
    const { container } = render(
      <ConfigProvider classPrefix="outer-">
        <Button color="primary" m="1">
          Outer
        </Button>
        <ConfigProvider classPrefix="inner-">
          <Button color="info" p="2">
            Inner
          </Button>
        </ConfigProvider>
      </ConfigProvider>
    );

    const buttons = container.querySelectorAll('button');

    // Outer button
    expect(buttons[0]).toHaveClass('outer-button');
    expect(buttons[0]).toHaveClass('outer-is-primary');
    expect(buttons[0]).toHaveClass('outer-m-1');

    // Inner button (overrides outer prefix)
    expect(buttons[1]).toHaveClass('inner-button');
    expect(buttons[1]).toHaveClass('inner-is-info');
    expect(buttons[1]).toHaveClass('inner-p-2');
  });

  it('provides default icon library to Icon components', () => {
    const { container } = render(
      <ConfigProvider iconLibrary="mdi">
        <Icon name="home" />
      </ConfigProvider>
    );

    // The Icon should use mdi classes without specifying library prop
    const iconElement = container.querySelector('i');
    expect(iconElement).toHaveClass('mdi');
    expect(iconElement).toHaveClass('mdi-home');
  });

  it('allows Icon components to override default library', () => {
    const { container } = render(
      <ConfigProvider iconLibrary="mdi">
        <div>
          <Icon name="home" />
          <Icon name="star" library="fa" />
        </div>
      </ConfigProvider>
    );

    const icons = container.querySelectorAll('i');

    // First icon uses default mdi
    expect(icons[0]).toHaveClass('mdi');
    expect(icons[0]).toHaveClass('mdi-home');

    // Second icon overrides with fa
    expect(icons[1]).toHaveClass('fas');
    expect(icons[1]).toHaveClass('fa-star');
  });

  it('works with both classPrefix and iconLibrary', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bulma-" iconLibrary="material-icons">
        <div>
          <Button color="primary">Test</Button>
          <Icon name="home" />
        </div>
      </ConfigProvider>
    );

    // Button should use prefix
    const button = container.querySelector('button');
    expect(button).toHaveClass('bulma-button');
    expect(button).toHaveClass('bulma-is-primary');

    // Icon should use material-icons and prefixed icon class
    const iconContainer = container.querySelector('.bulma-icon');
    expect(iconContainer).toBeInTheDocument();

    const iconElement = container.querySelector('i');
    expect(iconElement).toHaveClass('material-icons');
    expect(iconElement?.textContent).toBe('home');
  });
});
