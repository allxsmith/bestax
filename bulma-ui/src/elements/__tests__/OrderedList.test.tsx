import { render, screen } from '@testing-library/react';
import { OrderedList } from '../OrderedList';
import { ListItem } from '../ListItem';
import { ConfigProvider } from '../../helpers/Config';

describe('OrderedList Component', () => {
  test('renders children content', () => {
    render(
      <OrderedList>
        <ListItem>Test Item</ListItem>
      </OrderedList>
    );
    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });

  test('renders as ol element', () => {
    render(<OrderedList data-testid="list" />);
    const list = screen.getByTestId('list');
    expect(list.tagName).toBe('OL');
  });

  test('applies custom className', () => {
    render(<OrderedList className="custom-class" data-testid="list" />);
    expect(screen.getByTestId('list')).toHaveClass('custom-class', {
      exact: false,
    });
  });

  test('applies textColor class', () => {
    render(<OrderedList textColor="primary" data-testid="list" />);
    expect(screen.getByTestId('list')).toHaveClass('has-text-primary', {
      exact: false,
    });
  });

  test('applies bgColor class', () => {
    render(<OrderedList bgColor="light" data-testid="list" />);
    expect(screen.getByTestId('list')).toHaveClass('has-background-light', {
      exact: false,
    });
  });

  test('applies type attribute', () => {
    render(<OrderedList type="a" data-testid="list" />);
    expect(screen.getByTestId('list')).toHaveAttribute('type', 'a');
  });

  test('applies start attribute', () => {
    render(<OrderedList start={5} data-testid="list" />);
    expect(screen.getByTestId('list')).toHaveAttribute('start', '5');
  });

  test('applies reversed attribute', () => {
    render(<OrderedList reversed data-testid="list" />);
    expect(screen.getByTestId('list')).toHaveAttribute('reversed');
  });

  test('applies Bulma helper classes', () => {
    render(<OrderedList m="3" p="4" textAlign="centered" data-testid="list" />);
    const list = screen.getByTestId('list');
    expect(list).toHaveClass('m-3', { exact: false });
    expect(list).toHaveClass('p-4', { exact: false });
    expect(list).toHaveClass('has-text-centered', { exact: false });
  });

  test('passes HTML attributes to ol', () => {
    render(
      <OrderedList
        id="list-id"
        data-testid="list"
        aria-label="List"
        title="List title"
      />
    );
    const list = screen.getByTestId('list');
    expect(list).toHaveAttribute('id', 'list-id');
    expect(list).toHaveAttribute('aria-label', 'List');
    expect(list).toHaveAttribute('title', 'List title');
  });

  test('does not pass non-HTML props to ol', () => {
    render(
      <OrderedList
        textColor="primary"
        bgColor="light"
        m="3"
        data-testid="list"
      />
    );
    const list = screen.getByTestId('list');
    expect(list).not.toHaveAttribute('textColor');
    expect(list).not.toHaveAttribute('bgColor');
    expect(list).not.toHaveAttribute('m');
  });

  test('renders without className when no classes are applied', () => {
    render(<OrderedList data-testid="list" />);
    const list = screen.getByTestId('list');
    expect(list.getAttribute('class')).toBeNull();
  });

  test('renders multiple list items', () => {
    render(
      <OrderedList>
        <ListItem>Item 1</ListItem>
        <ListItem>Item 2</ListItem>
        <ListItem>Item 3</ListItem>
      </OrderedList>
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  describe('ClassPrefix', () => {
    it('applies prefix to helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <OrderedList m="2" p="3" data-testid="list" />
        </ConfigProvider>
      );
      const list = screen.getByTestId('list');
      expect(list).toHaveClass('bulma-m-2');
      expect(list).toHaveClass('bulma-p-3');
    });

    it('works without prefix', () => {
      render(<OrderedList m="4" textAlign="centered" data-testid="list" />);
      const list = screen.getByTestId('list');
      expect(list).toHaveClass('m-4');
      expect(list).toHaveClass('has-text-centered');
    });

    it('uses default classes when no classPrefix provided', () => {
      render(
        <ConfigProvider>
          <OrderedList m="2" data-testid="list" />
        </ConfigProvider>
      );
      expect(screen.getByTestId('list')).toHaveClass('m-2');
    });
  });
});
