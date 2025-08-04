import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConfigProvider, useConfig, useClassPrefix } from '../Config';

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
