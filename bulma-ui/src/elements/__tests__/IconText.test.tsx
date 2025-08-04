import { render, screen } from '@testing-library/react';
import { IconText } from '../IconText';
import { ConfigProvider } from '../../helpers/Config';

describe('IconText Component', () => {
  const defaultIconProps = { name: 'fas fa-star', ariaLabel: 'Star icon' };
  const defaultItems = [
    {
      iconProps: { name: 'fas fa-train', ariaLabel: 'Train icon' },
      text: 'Paris',
    },
    {
      iconProps: { name: 'fas fa-arrow-right', ariaLabel: 'Arrow icon' },
      text: 'Budapest',
    },
  ];

  it('renders single icon and text', () => {
    render(<IconText iconProps={defaultIconProps}>Star</IconText>);
    const iconText = screen.getByText('Star').parentElement;
    expect(iconText).toHaveClass('icon-text');
    expect(screen.getByLabelText('Star icon')).toHaveClass('icon');
    expect(screen.getByText('Star')).toBeInTheDocument();
  });

  it('renders multiple icons and text', () => {
    render(<IconText items={defaultItems} />);
    const iconText = screen.getByText('Paris').parentElement;
    expect(iconText).toHaveClass('icon-text');
    expect(screen.getByLabelText('Train icon')).toHaveClass('icon');
    expect(screen.getByLabelText('Arrow icon')).toHaveClass('icon');
    expect(screen.getByText('Paris')).toBeInTheDocument();
    expect(screen.getByText('Budapest')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <IconText iconProps={defaultIconProps} className="custom-icon-text">
        Star
      </IconText>
    );
    const iconText = screen.getByText('Star').parentElement;
    expect(iconText).toHaveClass('icon-text custom-icon-text');
  });

  it('applies textColor using useBulmaClasses', () => {
    render(
      <IconText iconProps={defaultIconProps} textColor="primary">
        Star
      </IconText>
    );
    const iconText = screen.getByText('Star').parentElement;
    expect(iconText).toHaveClass('has-text-primary');
  });

  it('applies margin using useBulmaClasses', () => {
    render(
      <IconText iconProps={defaultIconProps} m="2">
        Star
      </IconText>
    );
    const iconText = screen.getByText('Star').parentElement;
    expect(iconText).toHaveClass('m-2');
  });

  it('renders multiple icons without text', () => {
    render(
      <IconText
        items={[{ iconProps: { name: 'fas fa-star', ariaLabel: 'Star icon' } }]}
      />
    );
    const icon = screen.getByLabelText('Star icon');
    expect(icon).toHaveClass('icon');
    expect(screen.queryByText('Paris')).not.toBeInTheDocument();
  });

  it('passes iconProps to Icon component', () => {
    render(
      <IconText
        iconProps={{ name: 'fas fa-star', size: 'large', textColor: 'danger' }}
      >
        Star
      </IconText>
    );
    const icon = screen.getByLabelText('icon');
    expect(icon).toHaveClass('icon is-large has-text-danger');
  });

  it('passes through non-Bulma props via rest', () => {
    render(
      <IconText iconProps={defaultIconProps} data-testid="test-icon-text">
        Star
      </IconText>
    );
    const iconText = screen.getByTestId('test-icon-text');
    expect(iconText).toBeInTheDocument();
  });

  it('applies classPrefix when provided via ConfigProvider', () => {
    render(
      <ConfigProvider classPrefix="bulma-">
        <IconText iconProps={defaultIconProps}>Star</IconText>
      </ConfigProvider>
    );
    const iconText = screen.getByText('Star').parentElement;
    expect(iconText).toHaveClass('bulma-icon-text');
    expect(iconText).not.toHaveClass('icon-text');
  });
});
