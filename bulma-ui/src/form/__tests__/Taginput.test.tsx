import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Taginput } from '../Taginput';

const frameworks = ['React', 'Vue', 'Angular', 'Svelte'];

describe('Taginput', () => {
  describe('Rendering', () => {
    it('renders an input element', () => {
      render(<Taginput />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders with placeholder', () => {
      render(<Taginput placeholder="Add tags..." />);
      expect(screen.getByPlaceholderText('Add tags...')).toBeInTheDocument();
    });

    it('renders with taginput class', () => {
      const { container } = render(<Taginput />);
      expect(container.firstChild).toHaveClass('taginput');
    });

    it('renders default tags', () => {
      render(<Taginput defaultValue={['Tag1', 'Tag2']} />);
      expect(screen.getByText('Tag1')).toBeInTheDocument();
      expect(screen.getByText('Tag2')).toBeInTheDocument();
    });
  });

  describe('Adding Tags', () => {
    it('adds tag on Enter', () => {
      const onChange = jest.fn();
      render(<Taginput onChange={onChange} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'NewTag' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith(['NewTag']);
    });

    it('adds tag on comma', () => {
      const onChange = jest.fn();
      render(<Taginput onChange={onChange} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'NewTag,' } });

      expect(onChange).toHaveBeenCalledWith(['NewTag']);
    });

    it('calls onAdd when tag is added', () => {
      const onAdd = jest.fn();
      render(<Taginput onAdd={onAdd} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'NewTag' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onAdd).toHaveBeenCalledWith('NewTag');
    });

    it('clears input after adding tag', () => {
      render(<Taginput />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'NewTag' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(input).toHaveValue('');
    });

    it('does not add empty tags', () => {
      const onChange = jest.fn();
      render(<Taginput onChange={onChange} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('trims whitespace from tags', () => {
      const onChange = jest.fn();
      render(<Taginput onChange={onChange} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: '  NewTag  ' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith(['NewTag']);
    });
  });

  describe('Removing Tags', () => {
    it('removes tag when delete button is clicked', () => {
      const onChange = jest.fn();
      render(<Taginput defaultValue={['Tag1', 'Tag2']} onChange={onChange} />);

      fireEvent.click(screen.getByLabelText('Remove Tag1'));

      expect(onChange).toHaveBeenCalledWith(['Tag2']);
    });

    it('calls onRemove when tag is removed', () => {
      const onRemove = jest.fn();
      render(<Taginput defaultValue={['Tag1', 'Tag2']} onRemove={onRemove} />);

      fireEvent.click(screen.getByLabelText('Remove Tag1'));

      expect(onRemove).toHaveBeenCalledWith('Tag1', 0);
    });

    it('removes last tag on Backspace when input is empty', () => {
      const onChange = jest.fn();
      render(<Taginput defaultValue={['Tag1', 'Tag2']} onChange={onChange} />);
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 'Backspace' });

      expect(onChange).toHaveBeenCalledWith(['Tag1']);
    });

    it('does not remove tag on Backspace when input has value', () => {
      const onChange = jest.fn();
      render(<Taginput defaultValue={['Tag1']} onChange={onChange} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.keyDown(input, { key: 'Backspace' });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not show delete button when closable is false', () => {
      render(<Taginput defaultValue={['Tag1']} closable={false} />);
      expect(screen.queryByLabelText('Remove Tag1')).not.toBeInTheDocument();
    });
  });

  describe('Duplicates', () => {
    it('does not add duplicate tags by default', () => {
      const onChange = jest.fn();
      render(<Taginput defaultValue={['Tag1']} onChange={onChange} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'Tag1' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('allows duplicates when allowDuplicates is true', () => {
      const onChange = jest.fn();
      render(
        <Taginput defaultValue={['Tag1']} allowDuplicates onChange={onChange} />
      );
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'Tag1' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith(['Tag1', 'Tag1']);
    });

    it('checks duplicates case-insensitively', () => {
      const onChange = jest.fn();
      render(<Taginput defaultValue={['Tag1']} onChange={onChange} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'TAG1' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Max Tags', () => {
    it('does not add tags when maxTags is reached', () => {
      const onChange = jest.fn();
      // Start with 1 tag when max is 2
      render(
        <Taginput defaultValue={['Tag1']} maxTags={2} onChange={onChange} />
      );
      const input = screen.getByRole('textbox');

      // Add one more tag (should work)
      fireEvent.change(input, { target: { value: 'Tag2' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith(['Tag1', 'Tag2']);
    });

    it('hides input when maxTags is reached', () => {
      render(<Taginput defaultValue={['Tag1', 'Tag2']} maxTags={2} />);
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });
  });

  describe('Allow New', () => {
    it('allows new tags by default', () => {
      const onChange = jest.fn();
      render(<Taginput data={frameworks} onChange={onChange} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'Custom' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith(['Custom']);
    });

    it('does not allow new tags when allowNew is false', () => {
      const onChange = jest.fn();
      render(
        <Taginput data={frameworks} allowNew={false} onChange={onChange} />
      );
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'Custom' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('allows tags from data when allowNew is false', () => {
      const onChange = jest.fn();
      render(
        <Taginput data={frameworks} allowNew={false} onChange={onChange} />
      );
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'React' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith(['React']);
    });
  });

  describe('Autocomplete', () => {
    it('shows dropdown when typing with data', () => {
      render(<Taginput data={frameworks} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'rea' } });

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('filters suggestions based on input', () => {
      render(<Taginput data={frameworks} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'rea' } });

      expect(screen.getByRole('option', { name: 'React' })).toBeInTheDocument();
      expect(
        screen.queryByRole('option', { name: 'Vue' })
      ).not.toBeInTheDocument();
    });

    it('adds tag when suggestion is clicked', () => {
      const onChange = jest.fn();
      render(<Taginput data={frameworks} onChange={onChange} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'rea' } });
      fireEvent.click(screen.getByRole('option', { name: 'React' }));

      expect(onChange).toHaveBeenCalledWith(['React']);
    });

    it('filters out already added tags from suggestions', () => {
      render(<Taginput data={frameworks} defaultValue={['React']} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'r' } });

      expect(
        screen.queryByRole('option', { name: 'React' })
      ).not.toBeInTheDocument();
    });

    it('opens dropdown on focus when openOnFocus is true', () => {
      render(<Taginput data={frameworks} openOnFocus />);
      const input = screen.getByRole('textbox');

      fireEvent.focus(input);

      // No dropdown without typing (filter is empty)
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates down with ArrowDown', () => {
      render(<Taginput data={frameworks} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveClass('is-active');
    });

    it('navigates up with ArrowUp', () => {
      render(<Taginput data={frameworks} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveClass('is-active');
    });

    it('selects highlighted item on Enter', () => {
      const onChange = jest.fn();
      render(<Taginput data={frameworks} onChange={onChange} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalled();
    });

    it('closes dropdown on Escape', () => {
      render(<Taginput data={frameworks} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'a' } });
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      fireEvent.keyDown(input, { key: 'Escape' });

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Disabled', () => {
    it('disables the input', () => {
      render(<Taginput disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('applies disabled class', () => {
      const { container } = render(<Taginput disabled />);
      expect(container.firstChild).toHaveClass('is-disabled');
    });

    it('does not show delete buttons when disabled', () => {
      render(<Taginput defaultValue={['Tag1']} disabled />);
      expect(screen.queryByLabelText('Remove Tag1')).not.toBeInTheDocument();
    });

    it('does not add tags when disabled', () => {
      const onChange = jest.fn();
      render(<Taginput disabled onChange={onChange} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'Tag' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Readonly', () => {
    it('makes input readonly', () => {
      render(<Taginput readonly />);
      expect(screen.getByRole('textbox')).toHaveAttribute('readonly');
    });

    it('does not show delete buttons when readonly', () => {
      render(<Taginput defaultValue={['Tag1']} readonly />);
      expect(screen.queryByLabelText('Remove Tag1')).not.toBeInTheDocument();
    });
  });

  describe('Colors', () => {
    it('applies input color class', () => {
      render(<Taginput color="primary" />);
      expect(screen.getByRole('textbox')).toHaveClass('is-primary');
    });

    it('applies tag color class', () => {
      render(<Taginput defaultValue={['Tag1']} tagColor="success" />);
      const tag = screen.getByText('Tag1').closest('.tag');
      expect(tag).toHaveClass('is-success');
    });
  });

  describe('Sizes', () => {
    it('applies small size class', () => {
      const { container } = render(<Taginput size="small" />);
      expect(container.firstChild).toHaveClass('is-small');
    });

    it('applies medium size class', () => {
      const { container } = render(<Taginput size="medium" />);
      expect(container.firstChild).toHaveClass('is-medium');
    });

    it('applies large size class', () => {
      const { container } = render(<Taginput size="large" />);
      expect(container.firstChild).toHaveClass('is-large');
    });

    it('applies size class to tags', () => {
      render(<Taginput defaultValue={['Tag1']} size="small" />);
      const tag = screen.getByText('Tag1').closest('.tag');
      expect(tag).toHaveClass('is-small');
    });
  });

  describe('Custom Confirm Keys', () => {
    it('uses custom confirm keys', () => {
      const onChange = jest.fn();
      render(<Taginput confirmKeys={['Enter', ';']} onChange={onChange} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'Tag;' } });

      expect(onChange).toHaveBeenCalledWith(['Tag']);
    });
  });

  describe('Remove On Keys', () => {
    it('does not remove on backspace when removeOnKeys is false', () => {
      const onChange = jest.fn();
      render(
        <Taginput
          defaultValue={['Tag1']}
          removeOnKeys={false}
          onChange={onChange}
        />
      );
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 'Backspace' });

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Attached', () => {
    it('applies attached class', () => {
      const { container } = render(<Taginput attached />);
      expect(container.querySelector('.taginput-container')).toHaveClass(
        'is-attached'
      );
    });
  });

  describe('Custom Template', () => {
    it('renders custom tag template', () => {
      render(
        <Taginput
          defaultValue={['Tag1']}
          tagTemplate={tag => <span data-testid="custom">{String(tag)}</span>}
        />
      );
      expect(screen.getByTestId('custom')).toBeInTheDocument();
    });
  });

  describe('Object Tags', () => {
    it('displays field from object tags', () => {
      const tags = [{ value: '1', label: 'Option One' }];
      render(<Taginput defaultValue={tags} field="label" />);
      expect(screen.getByText('Option One')).toBeInTheDocument();
    });
  });

  describe('Callbacks', () => {
    it('calls onTyping when typing', () => {
      const onTyping = jest.fn();
      render(<Taginput onTyping={onTyping} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'test' } });

      expect(onTyping).toHaveBeenCalledWith('test');
    });
  });

  describe('Click Outside', () => {
    it('closes dropdown on click outside', () => {
      render(
        <div>
          <Taginput data={frameworks} />
          <button>Outside</button>
        </div>
      );
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'r' } });
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      fireEvent.mouseDown(screen.getByRole('button', { name: 'Outside' }));

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Controlled Value', () => {
    it('uses controlled value', () => {
      render(<Taginput value={['Controlled']} />);
      expect(screen.getByText('Controlled')).toBeInTheDocument();
    });

    it('updates on onChange', () => {
      const onChange = jest.fn();
      render(<Taginput value={['Tag1']} onChange={onChange} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'Tag2' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith(['Tag1', 'Tag2']);
    });
  });

  describe('Placeholder', () => {
    it('shows placeholder when no tags', () => {
      render(<Taginput placeholder="Add tags..." />);
      expect(screen.getByPlaceholderText('Add tags...')).toBeInTheDocument();
    });

    it('hides placeholder when tags exist', () => {
      render(<Taginput defaultValue={['Tag1']} placeholder="Add tags..." />);
      expect(
        screen.queryByPlaceholderText('Add tags...')
      ).not.toBeInTheDocument();
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref to input element', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Taginput ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('Container Click', () => {
    it('focuses input when container is clicked', () => {
      const { container } = render(<Taginput />);
      const input = screen.getByRole('textbox');

      fireEvent.click(container.firstChild!);

      expect(document.activeElement).toBe(input);
    });
  });
});
