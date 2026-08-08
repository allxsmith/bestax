import React, { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Select } from '../Select';
import { Field } from '../Field';
import { Control } from '../Control';
import { ConfigProvider } from '../../helpers/Config';

describe('Select', () => {
  const renderOptions = () => (
    <>
      <option value="a">Option A</option>
      <option value="b">Option B</option>
      <option value="c">Option C</option>
    </>
  );

  describe('rendering', () => {
    it('renders a select inside a field', () => {
      const { container } = render(
        <Select data-testid="select">{renderOptions()}</Select>
      );
      const select = screen.getByTestId('select');
      expect(select).toBeInTheDocument();
      expect(select.closest('.select')).toBeInTheDocument();
      expect(container.querySelector('.field')).toBeInTheDocument();
      expect(container.querySelector('.control')).toBeInTheDocument();
    });

    it('renders with a label', () => {
      const { container } = render(
        <Select label="Country">{renderOptions()}</Select>
      );
      expect(container.querySelector('.label')).toHaveTextContent('Country');
    });

    it('renders without label when not provided', () => {
      const { container } = render(<Select>{renderOptions()}</Select>);
      expect(container.querySelector('.label')).not.toBeInTheDocument();
    });
  });

  describe('message', () => {
    it('renders help message', () => {
      const { container } = render(
        <Select message="Please select">{renderOptions()}</Select>
      );
      expect(container.querySelector('.help')).toHaveTextContent(
        'Please select'
      );
    });

    it('renders help message with color', () => {
      const { container } = render(
        <Select message="Required" messageColor="danger">
          {renderOptions()}
        </Select>
      );
      const help = container.querySelector('.help');
      expect(help).toHaveTextContent('Required');
      expect(help).toHaveClass('is-danger');
    });

    it('does not render help when message is not provided', () => {
      const { container } = render(<Select>{renderOptions()}</Select>);
      expect(container.querySelector('.help')).not.toBeInTheDocument();
    });
  });

  describe('select props', () => {
    it('passes color to select wrapper', () => {
      render(<Select color="danger">{renderOptions()}</Select>);
      expect(screen.getByRole('combobox').closest('.select')).toHaveClass(
        'is-danger'
      );
    });

    it('passes size to select wrapper', () => {
      render(<Select size="large">{renderOptions()}</Select>);
      expect(screen.getByRole('combobox').closest('.select')).toHaveClass(
        'is-large'
      );
    });

    it('passes disabled', () => {
      render(
        <Select disabled data-testid="select">
          {renderOptions()}
        </Select>
      );
      expect(screen.getByTestId('select')).toBeDisabled();
    });

    it('handles onChange', () => {
      const handleChange = jest.fn();
      render(
        <Select onChange={handleChange} data-testid="select">
          {renderOptions()}
        </Select>
      );
      fireEvent.change(screen.getByTestId('select'), {
        target: { value: 'b' },
      });
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('control props', () => {
    it('renders with icon left name', () => {
      const { container } = render(
        <Select iconLeftName="globe">{renderOptions()}</Select>
      );
      expect(container.querySelector('.control')).toHaveClass('has-icons-left');
    });

    it('applies isLoading to the select wrapper (matches Bulma docs)', () => {
      const { container } = render(
        <Select isLoading>{renderOptions()}</Select>
      );
      // Per Bulma: <div class="select is-loading"> replaces the chevron with a
      // spinner. The .control wrapper does NOT receive is-loading.
      expect(screen.getByRole('combobox').closest('.select')).toHaveClass(
        'is-loading'
      );
      expect(container.querySelector('.control')).not.toHaveClass('is-loading');
    });

    it('applies isExpanded to control', () => {
      const { container } = render(
        <Select isExpanded>{renderOptions()}</Select>
      );
      expect(container.querySelector('.control')).toHaveClass('is-expanded');
    });
  });

  describe('horizontal layout', () => {
    it('applies is-horizontal to field', () => {
      const { container } = render(
        <Select horizontal label="Country">
          {renderOptions()}
        </Select>
      );
      expect(container.querySelector('.field')).toHaveClass('is-horizontal');
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to the select element', () => {
      const ref = createRef<HTMLSelectElement>();
      render(<Select ref={ref}>{renderOptions()}</Select>);
      expect(ref.current).toBeInstanceOf(HTMLSelectElement);
    });
  });

  describe('classPrefix', () => {
    it('applies prefix to field, control, select, and help classes', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <Select label="Test" message="Help" messageColor="info">
            {renderOptions()}
          </Select>
        </ConfigProvider>
      );
      expect(container.querySelector('.bulma-field')).toBeInTheDocument();
      expect(container.querySelector('.bulma-control')).toBeInTheDocument();
      expect(
        screen.getByRole('combobox').closest('.bulma-select')
      ).toBeInTheDocument();
      expect(container.querySelector('.bulma-help')).toBeInTheDocument();
      expect(container.querySelector('.bulma-label')).toBeInTheDocument();
    });
  });

  describe('inside a Field wrapper', () => {
    it('renders as a bare fragment (no extra Field wrapper) when nested in a Field', () => {
      const { container } = render(
        <Field label="Country">
          <Select message="hint" messageColor="info">
            {renderOptions()}
          </Select>
        </Field>
      );
      // Exactly ONE field — the outer Field — and the help message still
      // renders inline as part of the bare fragment fallback.
      expect(container.querySelectorAll('.field').length).toBe(1);
      const help = screen.getByText('hint');
      expect(help).toHaveClass('help');
      expect(help).toHaveClass('is-info');
    });

    it('skips wrapping in Control when already inside a Control', () => {
      const { container } = render(
        <Field label="Country">
          <Control>
            <Select>{renderOptions()}</Select>
          </Control>
        </Field>
      );
      expect(container.querySelectorAll('.control').length).toBe(1);
    });
  });
});

describe('Select label association (#368)', () => {
  it('associates the label with the select via htmlFor/id', () => {
    const { container } = render(
      <Select label="Country">
        <option value="us">United States</option>
      </Select>
    );
    const select = screen.getByLabelText('Country');
    expect(select.tagName).toBe('SELECT');
    expect(select.id).toBeTruthy();
    expect(container.querySelector('label.label')).toHaveAttribute(
      'for',
      select.id
    );
  });

  it('injects no id without a label', () => {
    const { container } = render(
      <Select>
        <option value="us">United States</option>
      </Select>
    );
    expect(container.querySelector('select')).not.toHaveAttribute('id');
  });
});

describe('outer Field label adoption (#495)', () => {
  it('associates the outer Field label with the select', () => {
    const { container } = render(
      <Field label="Outer">
        <Select>
          <option value="a">Option A</option>
        </Select>
      </Field>
    );
    const select = screen.getByLabelText('Outer');
    expect(select.tagName).toBe('SELECT');
    expect(container.querySelector('label.label')).toHaveAttribute(
      'for',
      select.id
    );
  });
});
