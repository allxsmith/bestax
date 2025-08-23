import { render, screen, fireEvent } from '@testing-library/react';
import Panel from '../Panel';
import { ConfigProvider } from '../../helpers/Config';

describe('Panel', () => {
  it('renders panel nav with panel class', () => {
    render(<Panel data-testid="panel" />);
    expect(screen.getByTestId('panel')).toHaveClass('panel');
  });

  it('applies color class', () => {
    render(<Panel color="primary" data-testid="panel" />);
    expect(screen.getByTestId('panel')).toHaveClass('is-primary');
  });

  it('accepts custom className', () => {
    render(<Panel className="custom-panel" data-testid="panel" />);
    expect(screen.getByTestId('panel')).toHaveClass('custom-panel');
  });

  it('renders children', () => {
    render(
      <Panel>
        <span data-testid="child">Child</span>
      </Panel>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('applies classPrefix when provided via ConfigProvider', () => {
    render(
      <ConfigProvider classPrefix="bulma-">
        <Panel data-testid="panel" />
      </ConfigProvider>
    );
    const panel = screen.getByTestId('panel');
    expect(panel).toHaveClass('bulma-panel');
    expect(panel).not.toHaveClass('panel');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Panel data-testid="panel" />
        </ConfigProvider>
      );
      const panel = screen.getByTestId('panel');
      expect(panel).toHaveClass('bulma-panel');
    });

    it('uses default classes when no prefix is provided', () => {
      render(<Panel data-testid="panel" />);
      const panel = screen.getByTestId('panel');
      expect(panel).toHaveClass('panel');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <Panel data-testid="panel" />
        </ConfigProvider>
      );
      const panel = screen.getByTestId('panel');
      expect(panel).toHaveClass('panel');
    });

    it('applies prefix to both main class and helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <Panel color="primary" m="2" data-testid="panel" />
        </ConfigProvider>
      );
      const panel = screen.getByTestId('panel');
      expect(panel).toHaveClass('bulma-panel');
      expect(panel).toHaveClass('bulma-is-primary');
      expect(panel).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      render(<Panel color="danger" data-testid="panel" />);
      const panel = screen.getByTestId('panel');
      expect(panel).toHaveClass('panel');
      expect(panel).toHaveClass('is-danger');
    });
  });

  it('applies classPrefix to PanelInputBlock input when provided via ConfigProvider', () => {
    render(
      <ConfigProvider classPrefix="custom-">
        <Panel.InputBlock
          placeholder="Search with prefix"
          data-testid="input-block"
        />
      </ConfigProvider>
    );

    const inputBlock = screen.getByTestId('input-block');
    const input = inputBlock.querySelector('input');
    expect(input).toHaveClass('custom-input');
    expect(input).not.toHaveClass('input');
  });
});

describe('Panel.Heading', () => {
  it('renders heading', () => {
    render(<Panel.Heading data-testid="heading">Test Heading</Panel.Heading>);
    const heading = screen.getByTestId('heading');
    expect(heading).toHaveClass('panel-heading');
    expect(heading).toHaveTextContent('Test Heading');
  });

  it('accepts custom className', () => {
    render(<Panel.Heading className="custom-heading" data-testid="heading" />);
    expect(screen.getByTestId('heading')).toHaveClass('custom-heading');
  });
});

describe('Panel.Tabs', () => {
  it('renders tabs', () => {
    render(
      <Panel.Tabs data-testid="tabs">
        <a>Tab1</a>
        <a>Tab2</a>
      </Panel.Tabs>
    );
    const tabs = screen.getByTestId('tabs');
    expect(tabs).toHaveClass('panel-tabs');
    expect(tabs.querySelectorAll('a')).toHaveLength(2);
  });

  it('accepts custom className', () => {
    render(<Panel.Tabs className="custom-tabs" data-testid="tabs" />);
    expect(screen.getByTestId('tabs')).toHaveClass('custom-tabs');
  });
});

describe('Panel.Block', () => {
  it('renders block', () => {
    render(<Panel.Block data-testid="block">Block</Panel.Block>);
    const block = screen.getByTestId('block');
    expect(block).toHaveClass('panel-block');
    expect(block).toHaveTextContent('Block');
  });

  it('applies is-active class if active', () => {
    render(
      <Panel.Block active data-testid="block">
        Active Block
      </Panel.Block>
    );
    expect(screen.getByTestId('block')).toHaveClass('is-active');
  });

  it('accepts custom className', () => {
    render(<Panel.Block className="custom-block" data-testid="block" />);
    expect(screen.getByTestId('block')).toHaveClass('custom-block');
  });

  it('calls onClick', () => {
    const handleClick = jest.fn();
    render(
      <Panel.Block data-testid="block" onClick={handleClick}>
        Clickable
      </Panel.Block>
    );
    fireEvent.click(screen.getByTestId('block'));
    expect(handleClick).toHaveBeenCalled();
  });
});

describe('Panel.Icon', () => {
  it('renders icon span', () => {
    render(
      <Panel.Block>
        <Panel.Icon data-testid="icon">
          <i className="fas fa-user" />
        </Panel.Icon>
        Item
      </Panel.Block>
    );
    const icon = screen.getByTestId('icon');
    expect(icon).toHaveClass('panel-icon');
    expect(icon.querySelector('i')).toHaveClass('fas', 'fa-user');
  });

  it('accepts custom className', () => {
    render(
      <Panel.Block>
        <Panel.Icon className="custom-icon" data-testid="icon" />
      </Panel.Block>
    );
    expect(screen.getByTestId('icon')).toHaveClass('custom-icon');
  });
});

describe('Panel.InputBlock', () => {
  it('renders input with icon', () => {
    render(<Panel.InputBlock placeholder="Search" data-testid="input-block" />);
    const inputBlock = screen.getByTestId('input-block');
    expect(inputBlock).toHaveClass('panel-block');
    expect(inputBlock.querySelector('input')).toHaveAttribute(
      'placeholder',
      'Search'
    );
    expect(inputBlock.querySelector('span.icon')).toBeInTheDocument();
    expect(inputBlock.querySelector('i')).toHaveClass('fas', 'fa-search');
  });

  it('calls onChange when input changes', () => {
    const handleChange = jest.fn();
    render(
      <Panel.InputBlock onChange={handleChange} data-testid="input-block" />
    );
    const input = screen.getByTestId('input-block').querySelector('input')!;
    fireEvent.change(input, { target: { value: 'abc' } });
    expect(handleChange).toHaveBeenCalled();
  });
});

describe('Panel.CheckboxBlock', () => {
  it('renders checkbox and label', () => {
    render(
      <Panel.CheckboxBlock data-testid="checkbox">
        remember me
      </Panel.CheckboxBlock>
    );
    const checkbox = screen.getByTestId('checkbox');
    expect(checkbox).toHaveClass('panel-block');
    expect(
      checkbox.querySelector('input[type="checkbox"]')
    ).toBeInTheDocument();
    expect(checkbox).toHaveTextContent('remember me');
  });

  it('calls onChange when checkbox changes', () => {
    const handleChange = jest.fn();
    render(
      <Panel.CheckboxBlock onChange={handleChange} data-testid="checkbox">
        remember me
      </Panel.CheckboxBlock>
    );
    const input = screen
      .getByTestId('checkbox')
      .querySelector('input[type="checkbox"]')!;
    fireEvent.click(input);
    expect(handleChange).toHaveBeenCalled();
  });
});

describe('Panel.ButtonBlock', () => {
  it('renders button inside panel-block', () => {
    render(
      <Panel.ButtonBlock data-testid="button">
        Reset all filters
      </Panel.ButtonBlock>
    );
    const buttonBlock = screen.getByTestId('button').closest('.panel-block');
    expect(buttonBlock).toBeInTheDocument();
    expect(screen.getByTestId('button')).toHaveClass(
      'button',
      'is-link',
      'is-outlined',
      'is-fullwidth'
    );
    expect(screen.getByTestId('button')).toHaveTextContent('Reset all filters');
  });

  it('calls onClick when button clicked', () => {
    const handleClick = jest.fn();
    render(
      <Panel.ButtonBlock onClick={handleClick} data-testid="button">
        Click me
      </Panel.ButtonBlock>
    );
    fireEvent.click(screen.getByTestId('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
