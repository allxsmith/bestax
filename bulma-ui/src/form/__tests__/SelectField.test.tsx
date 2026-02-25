import React, { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SelectField } from '../SelectField';
import { ConfigProvider } from '../../helpers/Config';

describe('SelectField', () => {
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
        <SelectField data-testid="select">{renderOptions()}</SelectField>
      );
      expect(screen.getByTestId('select')).toBeInTheDocument();
      expect(container.querySelector('.field')).toBeInTheDocument();
      expect(container.querySelector('.control')).toBeInTheDocument();
      expect(container.querySelector('.select')).toBeInTheDocument();
    });

    it('renders with a label', () => {
      const { container } = render(
        <SelectField label="Country">{renderOptions()}</SelectField>
      );
      expect(container.querySelector('.label')).toHaveTextContent('Country');
    });

    it('renders without label when not provided', () => {
      const { container } = render(
        <SelectField>{renderOptions()}</SelectField>
      );
      expect(container.querySelector('.label')).not.toBeInTheDocument();
    });
  });

  describe('message', () => {
    it('renders help message', () => {
      const { container } = render(
        <SelectField message="Please select">{renderOptions()}</SelectField>
      );
      expect(container.querySelector('.help')).toHaveTextContent(
        'Please select'
      );
    });

    it('renders help message with color', () => {
      const { container } = render(
        <SelectField message="Required" messageColor="danger">
          {renderOptions()}
        </SelectField>
      );
      const help = container.querySelector('.help');
      expect(help).toHaveTextContent('Required');
      expect(help).toHaveClass('is-danger');
    });

    it('does not render help when message is not provided', () => {
      const { container } = render(
        <SelectField>{renderOptions()}</SelectField>
      );
      expect(container.querySelector('.help')).not.toBeInTheDocument();
    });
  });

  describe('select props', () => {
    it('passes color to select wrapper', () => {
      const { container } = render(
        <SelectField color="danger">{renderOptions()}</SelectField>
      );
      expect(container.querySelector('.select')).toHaveClass('is-danger');
    });

    it('passes size to select wrapper', () => {
      const { container } = render(
        <SelectField size="large">{renderOptions()}</SelectField>
      );
      expect(container.querySelector('.select')).toHaveClass('is-large');
    });

    it('passes disabled', () => {
      render(
        <SelectField disabled data-testid="select">
          {renderOptions()}
        </SelectField>
      );
      expect(screen.getByTestId('select')).toBeDisabled();
    });

    it('handles onChange', () => {
      const handleChange = jest.fn();
      render(
        <SelectField onChange={handleChange} data-testid="select">
          {renderOptions()}
        </SelectField>
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
        <SelectField iconLeftName="globe">{renderOptions()}</SelectField>
      );
      expect(container.querySelector('.control')).toHaveClass('has-icons-left');
    });

    it('applies isLoading to control', () => {
      const { container } = render(
        <SelectField isLoading>{renderOptions()}</SelectField>
      );
      expect(container.querySelector('.control')).toHaveClass('is-loading');
    });

    it('applies isExpanded to control', () => {
      const { container } = render(
        <SelectField isExpanded>{renderOptions()}</SelectField>
      );
      expect(container.querySelector('.control')).toHaveClass('is-expanded');
    });
  });

  describe('horizontal layout', () => {
    it('applies is-horizontal to field', () => {
      const { container } = render(
        <SelectField horizontal label="Country">
          {renderOptions()}
        </SelectField>
      );
      expect(container.querySelector('.field')).toHaveClass('is-horizontal');
    });
  });

  describe('ref forwarding', () => {
    it('forwards ref to the select element', () => {
      const ref = createRef<HTMLSelectElement>();
      render(<SelectField ref={ref}>{renderOptions()}</SelectField>);
      expect(ref.current).toBeInstanceOf(HTMLSelectElement);
    });
  });

  describe('classPrefix', () => {
    it('applies prefix to field, control, select, and help classes', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bulma-">
          <SelectField label="Test" message="Help" messageColor="info">
            {renderOptions()}
          </SelectField>
        </ConfigProvider>
      );
      expect(container.querySelector('.bulma-field')).toBeInTheDocument();
      expect(container.querySelector('.bulma-control')).toBeInTheDocument();
      expect(container.querySelector('.bulma-select')).toBeInTheDocument();
      expect(container.querySelector('.bulma-help')).toBeInTheDocument();
      expect(container.querySelector('.bulma-label')).toBeInTheDocument();
    });
  });
});
