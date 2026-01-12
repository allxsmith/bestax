import { render, screen } from '@testing-library/react';
import { Divider } from '../Divider';
import { ConfigProvider } from '../../helpers/Config';

describe('Divider Component', () => {
  test('renders as hr element', () => {
    render(<Divider data-testid="divider" />);
    const divider = screen.getByTestId('divider');
    expect(divider.tagName).toBe('HR');
  });

  test('applies custom className', () => {
    render(<Divider className="custom-class" data-testid="divider" />);
    expect(screen.getByTestId('divider')).toHaveClass('custom-class', {
      exact: false,
    });
  });

  test('applies bgColor class', () => {
    render(<Divider bgColor="primary" data-testid="divider" />);
    expect(screen.getByTestId('divider')).toHaveClass(
      'has-background-primary',
      {
        exact: false,
      }
    );
  });

  test('applies Bulma helper classes', () => {
    render(<Divider m="3" my="5" data-testid="divider" />);
    const divider = screen.getByTestId('divider');
    expect(divider).toHaveClass('m-3', { exact: false });
    expect(divider).toHaveClass('my-5', { exact: false });
  });

  test('passes HTML attributes to hr', () => {
    render(
      <Divider
        id="divider-id"
        data-testid="divider"
        aria-label="Divider"
        title="Section divider"
      />
    );
    const divider = screen.getByTestId('divider');
    expect(divider).toHaveAttribute('id', 'divider-id');
    expect(divider).toHaveAttribute('aria-label', 'Divider');
    expect(divider).toHaveAttribute('title', 'Section divider');
  });

  test('does not pass non-HTML props to hr', () => {
    render(<Divider bgColor="light" m="3" data-testid="divider" />);
    const divider = screen.getByTestId('divider');
    expect(divider).not.toHaveAttribute('bgColor');
    expect(divider).not.toHaveAttribute('m');
  });

  test('renders without className when no classes are applied', () => {
    render(<Divider data-testid="divider" />);
    const divider = screen.getByTestId('divider');
    expect(divider.getAttribute('class')).toBeNull();
  });

  describe('ClassPrefix', () => {
    it('applies prefix to helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Divider m="2" my="4" data-testid="divider" />
        </ConfigProvider>
      );
      const divider = screen.getByTestId('divider');
      expect(divider).toHaveClass('bulma-m-2');
      expect(divider).toHaveClass('bulma-my-4');
    });

    it('works without prefix', () => {
      render(<Divider m="4" data-testid="divider" />);
      const divider = screen.getByTestId('divider');
      expect(divider).toHaveClass('m-4');
    });

    it('uses default classes when no classPrefix provided', () => {
      render(
        <ConfigProvider>
          <Divider m="2" data-testid="divider" />
        </ConfigProvider>
      );
      expect(screen.getByTestId('divider')).toHaveClass('m-2');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Divider my="3" data-testid="divider" />
        </ConfigProvider>
      );
      expect(screen.getByTestId('divider')).toHaveClass('my-3');
    });
  });
});
