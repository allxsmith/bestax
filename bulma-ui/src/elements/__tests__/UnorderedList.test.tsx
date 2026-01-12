import { render, screen } from '@testing-library/react';
import { UnorderedList } from '../UnorderedList';
import { ListItem } from '../ListItem';
import { ConfigProvider } from '../../helpers/Config';

describe('UnorderedList Component', () => {
  test('renders children content', () => {
    render(
      <UnorderedList>
        <ListItem>Test Item</ListItem>
      </UnorderedList>
    );
    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });

  test('renders as ul element', () => {
    render(<UnorderedList data-testid="list" />);
    const list = screen.getByTestId('list');
    expect(list.tagName).toBe('UL');
  });

  test('applies custom className', () => {
    render(<UnorderedList className="custom-class" data-testid="list" />);
    expect(screen.getByTestId('list')).toHaveClass('custom-class', {
      exact: false,
    });
  });

  test('applies textColor class', () => {
    render(<UnorderedList textColor="primary" data-testid="list" />);
    expect(screen.getByTestId('list')).toHaveClass('has-text-primary', {
      exact: false,
    });
  });

  test('applies bgColor class', () => {
    render(<UnorderedList bgColor="light" data-testid="list" />);
    expect(screen.getByTestId('list')).toHaveClass('has-background-light', {
      exact: false,
    });
  });

  test('applies Bulma helper classes', () => {
    render(
      <UnorderedList m="3" p="4" textAlign="centered" data-testid="list" />
    );
    const list = screen.getByTestId('list');
    expect(list).toHaveClass('m-3', { exact: false });
    expect(list).toHaveClass('p-4', { exact: false });
    expect(list).toHaveClass('has-text-centered', { exact: false });
  });

  test('passes HTML attributes to ul', () => {
    render(
      <UnorderedList
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

  test('does not pass non-HTML props to ul', () => {
    render(
      <UnorderedList
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
    render(<UnorderedList data-testid="list" />);
    const list = screen.getByTestId('list');
    expect(list.getAttribute('class')).toBeNull();
  });

  test('renders multiple list items', () => {
    render(
      <UnorderedList>
        <ListItem>Item 1</ListItem>
        <ListItem>Item 2</ListItem>
        <ListItem>Item 3</ListItem>
      </UnorderedList>
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  describe('ClassPrefix', () => {
    it('applies prefix to helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <UnorderedList m="2" p="3" data-testid="list" />
        </ConfigProvider>
      );
      const list = screen.getByTestId('list');
      expect(list).toHaveClass('bulma-m-2');
      expect(list).toHaveClass('bulma-p-3');
    });

    it('works without prefix', () => {
      render(<UnorderedList m="4" textAlign="centered" data-testid="list" />);
      const list = screen.getByTestId('list');
      expect(list).toHaveClass('m-4');
      expect(list).toHaveClass('has-text-centered');
    });

    it('uses default classes when no classPrefix provided', () => {
      render(
        <ConfigProvider>
          <UnorderedList m="2" data-testid="list" />
        </ConfigProvider>
      );
      expect(screen.getByTestId('list')).toHaveClass('m-2');
    });
  });
});
