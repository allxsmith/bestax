import { render, screen } from '@testing-library/react';
import { Emphasis } from '../Emphasis';
import { ConfigProvider } from '../../helpers/Config';

describe('Emphasis Component', () => {
  test('renders children content', () => {
    render(<Emphasis>Emphasized text</Emphasis>);
    expect(screen.getByText('Emphasized text')).toBeInTheDocument();
  });

  test('renders as em element', () => {
    render(<Emphasis data-testid="emphasis">Test</Emphasis>);
    const emphasis = screen.getByTestId('emphasis');
    expect(emphasis.tagName).toBe('EM');
  });

  test('applies custom className', () => {
    render(<Emphasis className="custom-class">Test</Emphasis>);
    expect(screen.getByText('Test')).toHaveClass('custom-class', {
      exact: false,
    });
  });

  test('applies textColor class', () => {
    render(<Emphasis textColor="primary">Test</Emphasis>);
    expect(screen.getByText('Test')).toHaveClass('has-text-primary', {
      exact: false,
    });
  });

  test('applies bgColor class', () => {
    render(<Emphasis bgColor="light">Test</Emphasis>);
    expect(screen.getByText('Test')).toHaveClass('has-background-light', {
      exact: false,
    });
  });

  test('applies Bulma helper classes', () => {
    render(
      <Emphasis m="3" p="4" textSize="5" data-testid="emphasis">
        Test
      </Emphasis>
    );
    const emphasis = screen.getByTestId('emphasis');
    expect(emphasis).toHaveClass('m-3', { exact: false });
    expect(emphasis).toHaveClass('p-4', { exact: false });
    expect(emphasis).toHaveClass('is-size-5', { exact: false });
  });

  test('passes HTML attributes to em', () => {
    render(
      <Emphasis
        id="emphasis-id"
        data-testid="emphasis"
        aria-label="Emphasis"
        title="Emphasis title"
      >
        Test
      </Emphasis>
    );
    const emphasis = screen.getByTestId('emphasis');
    expect(emphasis).toHaveAttribute('id', 'emphasis-id');
    expect(emphasis).toHaveAttribute('aria-label', 'Emphasis');
    expect(emphasis).toHaveAttribute('title', 'Emphasis title');
  });

  test('does not pass non-HTML props to em', () => {
    render(
      <Emphasis
        textColor="primary"
        bgColor="light"
        m="3"
        data-testid="emphasis"
      >
        Test
      </Emphasis>
    );
    const emphasis = screen.getByTestId('emphasis');
    expect(emphasis).not.toHaveAttribute('textColor');
    expect(emphasis).not.toHaveAttribute('bgColor');
    expect(emphasis).not.toHaveAttribute('m');
  });

  test('renders without className when no classes are applied', () => {
    render(<Emphasis data-testid="emphasis">Plain Emphasis</Emphasis>);
    const emphasis = screen.getByTestId('emphasis');
    expect(emphasis.getAttribute('class')).toBeNull();
  });

  test('combines multiple color-related classes', () => {
    render(
      <Emphasis textColor="primary" bgColor="light">
        Styled Emphasis
      </Emphasis>
    );
    const emphasis = screen.getByText('Styled Emphasis');
    expect(emphasis).toHaveClass('has-text-primary', { exact: false });
    expect(emphasis).toHaveClass('has-background-light', { exact: false });
  });

  describe('ClassPrefix', () => {
    it('applies prefix to helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Emphasis m="2" p="3">
            Test Emphasis
          </Emphasis>
        </ConfigProvider>
      );
      const emphasis = screen.getByText('Test Emphasis');
      expect(emphasis).toHaveClass('bulma-m-2');
      expect(emphasis).toHaveClass('bulma-p-3');
    });

    it('works without prefix', () => {
      render(
        <Emphasis m="4" textAlign="centered">
          Standard Emphasis
        </Emphasis>
      );
      const emphasis = screen.getByText('Standard Emphasis');
      expect(emphasis).toHaveClass('m-4');
      expect(emphasis).toHaveClass('has-text-centered');
    });

    it('uses default classes when no classPrefix provided', () => {
      render(
        <ConfigProvider>
          <Emphasis m="2">Test</Emphasis>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('m-2');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Emphasis p="3">Test</Emphasis>
        </ConfigProvider>
      );
      expect(screen.getByText('Test')).toHaveClass('p-3');
    });
  });
});
