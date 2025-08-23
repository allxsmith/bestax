import { render, screen } from '@testing-library/react';
import { Tags, TagsProps } from '../Tags';
import { Tag } from '../Tag';
import { ConfigProvider } from '../../helpers/Config';

describe('Tags Component', () => {
  const defaultProps: TagsProps = {
    children: <Tag>Test Tag</Tag>,
  };

  test('renders tags with default props', () => {
    render(<Tags {...defaultProps} />);
    const tags = screen.getByText('Test Tag').parentElement;
    expect(tags).toBeInTheDocument();
    expect(tags?.tagName).toBe('DIV');
    expect(tags).toHaveClass('tags');
  });

  test('applies has-addons class', () => {
    render(<Tags {...defaultProps} hasAddons />);
    const tags = screen.getByText('Test Tag').parentElement;
    expect(tags).toHaveClass('tags has-addons');
  });

  test('applies multiline class', () => {
    render(<Tags {...defaultProps} isMultiline />);
    const tags = screen.getByText('Test Tag').parentElement;
    expect(tags).toHaveClass('tags are-multiline');
  });

  test('applies Bulma helper classes (e.g., margin)', () => {
    render(<Tags {...defaultProps} m="4" />);
    const tags = screen.getByText('Test Tag').parentElement;
    expect(tags).toHaveClass('tags m-4');
  });

  test('applies custom className', () => {
    render(<Tags {...defaultProps} className="custom-tags" />);
    const tags = screen.getByText('Test Tag').parentElement;
    expect(tags).toHaveClass('tags custom-tags');
  });

  test('forwards additional HTML attributes', () => {
    render(<Tags {...defaultProps} data-testid="custom-tags" />);
    const tags = screen.getByTestId('custom-tags');
    expect(tags).toBeInTheDocument();
    expect(tags).toHaveClass('tags');
  });

  test('renders multiple tags', () => {
    render(
      <Tags>
        <Tag>Tag 1</Tag>
        <Tag>Tag 2</Tag>
      </Tags>
    );
    expect(screen.getByText('Tag 1')).toBeInTheDocument();
    expect(screen.getByText('Tag 2')).toBeInTheDocument();
    const tags = screen.getByText('Tag 1').parentElement;
    expect(tags).toHaveClass('tags');
  });

  test('renders without children', () => {
    render(<Tags data-testid="empty-tags" />);
    const tags = screen.getByTestId('empty-tags');
    expect(tags).toBeInTheDocument();
    expect(tags.tagName).toBe('DIV');
    expect(tags).toHaveClass('tags');
    expect(tags).toBeEmptyDOMElement();
  });

  describe('ClassPrefix', () => {
    it('applies classPrefix to main class', () => {
      render(
        <ConfigProvider classPrefix="my-prefix-">
          <Tags>
            <span>Test Tag</span>
          </Tags>
        </ConfigProvider>
      );
      const tags = screen.getByText('Test Tag').parentElement;
      expect(tags).toHaveClass('my-prefix-tags');
    });

    it('uses default class when no classPrefix provided', () => {
      render(
        <ConfigProvider>
          <Tags>
            <span>Test Tag</span>
          </Tags>
        </ConfigProvider>
      );
      const tags = screen.getByText('Test Tag').parentElement;
      expect(tags).toHaveClass('tags');
    });

    it('uses default class when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Tags>
            <span>Test Tag</span>
          </Tags>
        </ConfigProvider>
      );
      const tags = screen.getByText('Test Tag').parentElement;
      expect(tags).toHaveClass('tags');
    });

    it('applies prefix to both main class and helper classes', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Tags hasAddons isMultiline m="2">
            <span>Tag 1</span>
            <span>Tag 2</span>
          </Tags>
        </ConfigProvider>
      );

      const tags = container.querySelector('div');
      expect(tags).toHaveClass('bulma-tags');
      expect(tags).toHaveClass('bulma-has-addons');
      expect(tags).toHaveClass('bulma-are-multiline');
      expect(tags).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      const { container } = render(
        <Tags hasAddons p="3">
          <span>Standard Tag</span>
        </Tags>
      );

      const tags = container.querySelector('div');
      expect(tags).toHaveClass('tags');
      expect(tags).toHaveClass('has-addons');
      expect(tags).toHaveClass('p-3');
    });
  });
});
