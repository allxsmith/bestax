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

  test('applies classPrefix when provided via ConfigProvider', () => {
    render(
      <ConfigProvider classPrefix="bulma-">
        <Tags {...defaultProps} />
      </ConfigProvider>
    );
    const tags = screen.getByText('Test Tag').parentElement;
    expect(tags).toHaveClass('bulma-tags');
    expect(tags).not.toHaveClass('tags');
  });
});
