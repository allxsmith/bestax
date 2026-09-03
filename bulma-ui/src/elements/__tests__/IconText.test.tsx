import { render, screen } from '@testing-library/react';
import { IconText } from '../IconText';
import { Icon } from '../Icon';
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

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <IconText iconProps={defaultIconProps} data-testid="icon-text">
            Star
          </IconText>
        </ConfigProvider>
      );
      const iconText = screen.getByTestId('icon-text');
      expect(iconText).toHaveClass('bulma-icon-text');
    });

    it('uses default classes when no prefix is provided', () => {
      render(
        <IconText iconProps={defaultIconProps} data-testid="icon-text">
          Star
        </IconText>
      );
      const iconText = screen.getByTestId('icon-text');
      expect(iconText).toHaveClass('icon-text');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <IconText iconProps={defaultIconProps} data-testid="icon-text">
            Star
          </IconText>
        </ConfigProvider>
      );
      const iconText = screen.getByTestId('icon-text');
      expect(iconText).toHaveClass('icon-text');
    });

    it('applies prefix to both main class and helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <IconText
            iconProps={defaultIconProps}
            textColor="primary"
            m="2"
            data-testid="icon-text"
          >
            Star
          </IconText>
        </ConfigProvider>
      );
      const iconText = screen.getByTestId('icon-text');
      expect(iconText).toHaveClass('bulma-icon-text');
      expect(iconText).toHaveClass('bulma-has-text-primary');
      expect(iconText).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      render(
        <IconText
          iconProps={defaultIconProps}
          textColor="danger"
          data-testid="icon-text"
        >
          Star
        </IconText>
      );
      const iconText = screen.getByTestId('icon-text');
      expect(iconText).toHaveClass('icon-text');
      expect(iconText).toHaveClass('has-text-danger');
    });
  });
});

describe('Compound components', () => {
  test('IconText.Icon is the Icon component', () => {
    expect(IconText.Icon).toBe(Icon);
  });

  test('renders an icon through the dot path', () => {
    const { container } = render(
      <IconText>
        <IconText.Icon name="star" ariaLabel="star icon" />
        Starred
      </IconText>
    );
    expect(container.querySelector('.icon-text')).toBeInTheDocument();
    expect(container.querySelector('.icon')).toBeInTheDocument();
  });
});

describe('IconText custom node icon', () => {
  it('wraps a custom node in Icon for single icon mode', () => {
    render(
      <IconText iconProps={<svg data-testid="custom-svg" />}>Custom</IconText>
    );
    const iconText = screen.getByText('Custom').parentElement;
    expect(iconText).toHaveClass('icon-text');
    expect(screen.getByTestId('custom-svg')).toBeInTheDocument();
    expect(iconText?.querySelector('.icon')).toBeInTheDocument();
  });

  it('wraps a plain string node in Icon', () => {
    render(<IconText iconProps="★">Star</IconText>);
    const iconText = screen.getByText('Star').parentElement;
    expect(iconText?.querySelector('.icon')).toHaveTextContent('★');
  });

  it('spreads an IconProps object using `children` (no `name`) instead of wrapping it', () => {
    render(
      <IconText iconProps={{ children: <svg data-testid="custom-svg-2" /> }}>
        Custom
      </IconText>
    );
    expect(screen.getByTestId('custom-svg-2')).toBeInTheDocument();
  });

  it('wraps a custom node in Icon for each item in multiple icon mode', () => {
    render(
      <IconText
        items={[
          { iconProps: <svg data-testid="custom-svg-1" />, text: 'One' },
          { iconProps: { name: 'fas fa-star' }, text: 'Two' },
        ]}
      />
    );
    expect(screen.getByTestId('custom-svg-1')).toBeInTheDocument();
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
  });

  it('renders no icon span for a falsy single-mode iconProps', () => {
    // `iconProps={cond && <Node/>}` yields `false` when off — it must not mount an empty
    // `.icon` span in the a11y tree.
    render(<IconText iconProps={false}>Star</IconText>);
    const iconText = screen.getByText('Star').parentElement;
    expect(iconText).toHaveClass('icon-text');
    expect(iconText?.querySelector('.icon')).not.toBeInTheDocument();
  });

  it('skips a falsy iconProps entry in multiple icon mode but keeps its text', () => {
    render(
      <IconText
        items={[
          { iconProps: null, text: 'One' },
          { iconProps: { name: 'fas fa-star' }, text: 'Two' },
        ]}
      />
    );
    // Only the truthy entry renders an icon; both texts still render.
    expect(document.querySelectorAll('.icon')).toHaveLength(1);
    expect(screen.getByText('One')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
  });
});

describe('IconText color text alias', () => {
  it('renders has-text-primary when only color is set', () => {
    const { container } = render(<IconText color="primary">Txt</IconText>);
    expect(container.querySelector('.icon-text')).toHaveClass(
      'has-text-primary'
    );
  });

  it('gives textColor precedence when both are set', () => {
    const { container } = render(
      <IconText textColor="danger" color="primary">
        Txt
      </IconText>
    );
    const iconText = container.querySelector('.icon-text');
    expect(iconText).toHaveClass('has-text-danger');
    expect(iconText).not.toHaveClass('has-text-primary');
  });
});
