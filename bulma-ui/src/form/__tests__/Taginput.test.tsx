import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Taginput, TagInput, TaginputTag } from '../Taginput';
import { Field } from '../Field';

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
      expect(container.querySelector('.taginput')).toBeInTheDocument();
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

    it('does not add an empty suggestion selected from the dropdown', () => {
      const onChange = jest.fn();
      render(<Taginput data={['', 'Vue']} openOnFocus onChange={onChange} />);
      const input = screen.getByRole('combobox');
      fireEvent.focus(input);

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(2);
      // The first suggestion is the empty string — selecting it is a no-op.
      fireEvent.click(options[0]);
      expect(onChange).not.toHaveBeenCalled();
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

    // keepOpen (the default) leaves the list open after a selection, and
    // openOnFocus keeps it filled with the remaining suggestions, so below
    // the limit it stays on screen. At the limit the input goes, and the
    // list goes with it (#1087).
    it('closes the suggestion list when a click adds the last allowed tag', () => {
      const onChange = jest.fn();
      render(
        <Taginput
          defaultValue={['React']}
          data={['React', 'Vue', 'Svelte']}
          maxTags={2}
          openOnFocus
          onChange={onChange}
        />
      );
      fireEvent.focus(screen.getByRole('combobox'));

      fireEvent.click(screen.getByRole('option', { name: 'Vue' }));

      expect(onChange).toHaveBeenLastCalledWith(['React', 'Vue']);
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      expect(screen.queryByRole('option')).not.toBeInTheDocument();
    });

    it('closes the suggestion list when Enter adds the last allowed tag', () => {
      render(<Taginput data={frameworks} maxTags={1} openOnFocus />);
      const input = screen.getByRole('combobox');
      fireEvent.focus(input);
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      fireEvent.keyDown(input, { key: 'Enter' });

      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    // Reaching the limit with an add dismisses the list, the way a click
    // outside does. Hidden but still active, it came back the moment a
    // tag's delete button made room, with focus on the body.
    it('keeps the list closed when a tag is removed after an add reached the limit', () => {
      render(
        <Taginput
          data={['React', 'Vue', 'Svelte']}
          maxTags={2}
          defaultValue={['React']}
          openOnFocus
        />
      );
      fireEvent.focus(screen.getByRole('combobox'));
      fireEvent.click(screen.getByRole('option', { name: 'Vue' }));

      fireEvent.click(screen.getByRole('button', { name: 'Remove Vue' }));

      const input = screen.getByRole('combobox');
      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
      // Focusing the input opens it again, as openOnFocus does.
      fireEvent.focus(input);
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('keeps the list closed when a controlled value drops back below the limit', () => {
      const ui = (value: string[]) => (
        <Taginput data={frameworks} value={value} maxTags={1} openOnFocus />
      );
      const { rerender } = render(ui([]));
      fireEvent.focus(screen.getByRole('combobox'));
      rerender(ui(['React']));

      rerender(ui([]));

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('closes the suggestion list when a controlled value reaches the limit', () => {
      const ui = (value: string[]) => (
        <Taginput data={frameworks} value={value} maxTags={1} openOnFocus />
      );
      const { rerender } = render(ui([]));
      fireEvent.focus(screen.getByRole('combobox'));
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      rerender(ui(['React']));

      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('Allow New', () => {
    it('allows new tags by default', () => {
      const onChange = jest.fn();
      render(<Taginput data={frameworks} onChange={onChange} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'Custom' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith(['Custom']);
    });

    it('does not allow new tags when allowNew is false', () => {
      const onChange = jest.fn();
      render(
        <Taginput data={frameworks} allowNew={false} onChange={onChange} />
      );
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'Custom' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('allows tags from data when allowNew is false', () => {
      const onChange = jest.fn();
      render(
        <Taginput data={frameworks} allowNew={false} onChange={onChange} />
      );
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'React' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith(['React']);
    });

    it('accepts an existing data item typed in a different case when allowNew is false', () => {
      const onChange = jest.fn();
      render(
        <Taginput data={frameworks} allowNew={false} onChange={onChange} />
      );
      const input = screen.getByRole('combobox');

      // 'react' matches 'React' in data case-insensitively, so it is accepted
      // (the case-sensitive check previously rejected it).
      fireEvent.change(input, { target: { value: 'react' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith(['react']);
    });
  });

  describe('Autocomplete', () => {
    it('shows dropdown when typing with data', () => {
      render(<Taginput data={frameworks} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'rea' } });

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('filters suggestions based on input', () => {
      render(<Taginput data={frameworks} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'rea' } });

      expect(screen.getByRole('option', { name: 'React' })).toBeInTheDocument();
      expect(
        screen.queryByRole('option', { name: 'Vue' })
      ).not.toBeInTheDocument();
    });

    it('adds tag when suggestion is clicked', () => {
      const onChange = jest.fn();
      render(<Taginput data={frameworks} onChange={onChange} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'rea' } });
      fireEvent.click(screen.getByRole('option', { name: 'React' }));

      expect(onChange).toHaveBeenCalledWith(['React']);
    });

    it('filters out already added tags from suggestions', () => {
      render(<Taginput data={frameworks} defaultValue={['React']} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'r' } });

      expect(
        screen.queryByRole('option', { name: 'React' })
      ).not.toBeInTheDocument();
    });

    it('opens dropdown on focus when openOnFocus is true', () => {
      render(<Taginput data={frameworks} openOnFocus />);
      const input = screen.getByRole('combobox');

      fireEvent.focus(input);

      expect(screen.getByRole('listbox')).toBeInTheDocument();
      // All items should be visible
      expect(screen.getAllByRole('option')).toHaveLength(frameworks.length);
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates down with ArrowDown', () => {
      render(<Taginput data={frameworks} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveClass('is-active');
    });

    it('navigates up with ArrowUp', () => {
      render(<Taginput data={frameworks} />);
      const input = screen.getByRole('combobox');

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
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalled();
    });

    it('closes dropdown on Escape', () => {
      render(<Taginput data={frameworks} />);
      const input = screen.getByRole('combobox');

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
      expect(container.querySelector('.taginput')).toHaveClass('is-disabled');
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
      const { container } = render(<Taginput color="primary" />);
      expect(container.querySelector('.taginput')).toHaveClass('is-primary');
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
      expect(container.querySelector('.taginput')).toHaveClass('is-small');
    });

    it('applies medium size class', () => {
      const { container } = render(<Taginput size="medium" />);
      expect(container.querySelector('.taginput')).toHaveClass('is-medium');
    });

    it('applies large size class', () => {
      const { container } = render(<Taginput size="large" />);
      expect(container.querySelector('.taginput')).toHaveClass('is-large');
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
      const input = screen.getByRole('combobox');

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

      fireEvent.click(container.querySelector('.taginput')!);

      expect(document.activeElement).toBe(input);
    });
  });

  describe('Rounded', () => {
    it('applies is-rounded class when rounded prop is true', () => {
      const { container } = render(
        <Taginput defaultValue={['Tag1']} rounded />
      );
      expect(container.querySelector('.taginput')).toHaveClass('is-rounded');
    });

    it('does not apply is-rounded class when rounded is false', () => {
      const { container } = render(<Taginput defaultValue={['Tag1']} />);
      expect(container.querySelector('.taginput')).not.toHaveClass(
        'is-rounded'
      );
    });
  });

  describe('Ellipsis', () => {
    it('applies is-ellipsis class when ellipsis prop is true', () => {
      const { container } = render(
        <Taginput defaultValue={['Tag1']} ellipsis />
      );
      expect(container.querySelector('.taginput')).toHaveClass('is-ellipsis');
    });

    it('renders tag text in a span with title attribute when ellipsis is true', () => {
      render(<Taginput defaultValue={['Long Tag Text']} ellipsis />);
      const tagSpan = screen.getByText('Long Tag Text');
      expect(tagSpan.tagName).toBe('SPAN');
      expect(tagSpan).toHaveAttribute('title', 'Long Tag Text');
    });

    it('does not wrap tag text in a span when ellipsis is false', () => {
      render(<Taginput defaultValue={['Tag1']} />);
      const tagText = screen.getByText('Tag1');
      // Without ellipsis, the text node is directly inside the .tag span
      expect(tagText.closest('.tag')).toBe(tagText);
    });
  });

  describe('HasCounter', () => {
    it('shows counter when hasCounter is true and maxTags is set', () => {
      const { container } = render(
        <Taginput defaultValue={['Tag1']} maxTags={5} hasCounter />
      );
      const counter = container.querySelector('.counter');
      expect(counter).toBeInTheDocument();
      expect(counter).toHaveTextContent('1 / 5');
    });

    it('shows counter for maxlength', () => {
      const { container } = render(<Taginput maxlength={20} hasCounter />);
      const counter = container.querySelector('.counter');
      expect(counter).toBeInTheDocument();
      expect(counter).toHaveTextContent('0 / 20');
    });

    it('does not show counter when hasCounter is false', () => {
      const { container } = render(<Taginput maxTags={5} hasCounter={false} />);
      const counter = container.querySelector('.counter');
      expect(counter).not.toBeInTheDocument();
    });

    it('does not show counter when neither maxTags nor maxlength is set', () => {
      const { container } = render(<Taginput hasCounter />);
      const counter = container.querySelector('.counter');
      expect(counter).not.toBeInTheDocument();
    });
  });

  describe('Paste Separators', () => {
    const paste = (text: string) =>
      fireEvent.paste(
        screen.queryByRole('textbox') ?? screen.getByRole('combobox'),
        { clipboardData: { getData: () => text } }
      );
    const shownTags = () =>
      Array.from(document.querySelectorAll('.tag')).map(tag => tag.textContent);

    it('splits pasted text by comma separator', () => {
      const onChange = jest.fn();
      render(<Taginput onPasteSeparators={[',']} onChange={onChange} />);

      paste('React, Vue, Angular');

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(['React', 'Vue', 'Angular']);
    });

    it('splits pasted text by multiple separators', () => {
      const onChange = jest.fn();
      render(<Taginput onPasteSeparators={[',', ';']} onChange={onChange} />);

      paste('React, Vue; Angular');

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(['React', 'Vue', 'Angular']);
    });

    // Each part used to be added against the tags from before the paste, so
    // the last write won and every check missed the paste's own parts
    // (#1101).
    it('adds every part of a paste, in one change', () => {
      const onChange = jest.fn();
      const onAdd = jest.fn();
      render(
        <Taginput defaultValue={['x']} onChange={onChange} onAdd={onAdd} />
      );

      paste('a,b,c');

      expect(shownTags()).toEqual(['x', 'a', 'b', 'c']);
      expect(onChange.mock.calls).toEqual([[['x', 'a', 'b', 'c']]]);
      expect(onAdd.mock.calls).toEqual([['a'], ['b'], ['c']]);
    });

    it('checks a pasted part against the parts before it for duplicates', () => {
      const onAdd = jest.fn();
      render(<Taginput onAdd={onAdd} />);

      paste('a,A,b,a');

      expect(shownTags()).toEqual(['a', 'b']);
      expect(onAdd.mock.calls).toEqual([['a'], ['b']]);
    });

    it('keeps duplicates within a paste under allowDuplicates', () => {
      const onAdd = jest.fn();
      render(<Taginput allowDuplicates onAdd={onAdd} />);

      paste('a,a');

      expect(shownTags()).toEqual(['a', 'a']);
      expect(onAdd).toHaveBeenCalledTimes(2);
    });

    it('stops adding at maxTags partway through a paste', () => {
      const onChange = jest.fn();
      const onAdd = jest.fn();
      render(
        <Taginput
          defaultValue={['x']}
          maxTags={2}
          onChange={onChange}
          onAdd={onAdd}
        />
      );

      paste('a,b,c');

      expect(shownTags()).toEqual(['x', 'a']);
      expect(onChange.mock.calls).toEqual([[['x', 'a']]]);
      expect(onAdd.mock.calls).toEqual([['a']]);
    });

    it('keeps a parent that builds its tags from onAdd within maxTags', () => {
      const Parent = () => {
        const [tags, setTags] = React.useState<TaginputTag[]>([]);
        return (
          <Taginput
            value={tags}
            maxTags={2}
            onAdd={tag => setTags(prev => [...prev, tag])}
          />
        );
      };
      render(<Parent />);

      paste('a,b,c');

      expect(shownTags()).toEqual(['a', 'b']);
    });

    it('skips the parts that fail a check and adds the rest', () => {
      const onAdd = jest.fn();
      render(
        <Taginput
          data={['React', 'Vue', 'Svelte']}
          allowNew={false}
          beforeAdding={tag => tag !== 'Vue'}
          onAdd={onAdd}
        />
      );

      paste('react, Nope, Vue, ,Svelte');

      expect(shownTags()).toEqual(['react', 'Svelte']);
      expect(onAdd.mock.calls).toEqual([['react'], ['Svelte']]);
    });

    it('changes nothing when no part of a paste can be added', () => {
      const onChange = jest.fn();
      const onAdd = jest.fn();
      render(
        <Taginput defaultValue={['a']} onChange={onChange} onAdd={onAdd} />
      );

      paste('a, ,A');

      expect(onChange).not.toHaveBeenCalled();
      expect(onAdd).not.toHaveBeenCalled();
    });

    // A paste that fills the last slot dismisses the list, as any other add
    // that reaches the limit does, so making room doesn't reopen it.
    it('dismisses the list when a paste fills the last slot', () => {
      render(<Taginput data={frameworks} maxTags={2} openOnFocus />);
      fireEvent.focus(screen.getByRole('combobox'));
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      paste('Vue,Svelte');
      fireEvent.click(screen.getByRole('button', { name: 'Remove Svelte' }));

      expect(shownTags()).toEqual(['Vue']);
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('does not split pasted text without matching separator', () => {
      const onChange = jest.fn();
      render(<Taginput onPasteSeparators={[',']} onChange={onChange} />);
      const input = screen.getByRole('textbox');

      fireEvent.paste(input, {
        clipboardData: { getData: () => 'React' },
      });

      // No separator found, so paste is not intercepted
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('Before Adding', () => {
    it('prevents invalid tags from being added', () => {
      const onChange = jest.fn();
      render(
        <Taginput beforeAdding={tag => tag.length >= 3} onChange={onChange} />
      );
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'ab' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('allows valid tags when beforeAdding returns true', () => {
      const onChange = jest.fn();
      render(
        <Taginput beforeAdding={tag => tag.length >= 3} onChange={onChange} />
      );
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'abc' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith(['abc']);
    });
  });

  describe('Keep First', () => {
    it('auto-highlights first dropdown item when keepFirst is true', () => {
      render(<Taginput data={frameworks} keepFirst />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveClass('is-active');
    });

    it('does not auto-highlight when keepFirst is false', () => {
      render(<Taginput data={frameworks} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });

      const options = screen.getAllByRole('option');
      expect(options[0]).not.toHaveClass('is-active');
    });
  });

  describe('Loading', () => {
    it('renders loading spinner when loading is true', () => {
      const { container } = render(<Taginput loading />);
      expect(container.querySelector('.loader.is-loading')).toBeInTheDocument();
    });

    it('does not render loading spinner when loading is false', () => {
      const { container } = render(<Taginput />);
      expect(
        container.querySelector('.loader.is-loading')
      ).not.toBeInTheDocument();
    });
  });

  describe('Icon', () => {
    it('renders icon element when icon prop is set', () => {
      const { container } = render(<Taginput icon="tag" />);
      expect(container.querySelector('.icon.is-left')).toBeInTheDocument();
    });

    it('adds has-icons-left to container when icon is set', () => {
      const { container } = render(<Taginput icon="tag" />);
      expect(container.querySelector('.taginput-container')).toHaveClass(
        'has-icons-left'
      );
    });

    it('does not render icon when prop is absent', () => {
      const { container } = render(<Taginput />);
      expect(container.querySelector('.icon.is-left')).not.toBeInTheDocument();
    });
  });

  describe('Aria Close Label', () => {
    it('uses ariaCloseLabel for close button aria-label', () => {
      render(<Taginput defaultValue={['Tag1']} ariaCloseLabel="Delete tag" />);
      expect(screen.getByLabelText('Delete tag')).toBeInTheDocument();
    });

    it('uses default aria-label when ariaCloseLabel is not set', () => {
      render(<Taginput defaultValue={['Tag1']} />);
      expect(screen.getByLabelText('Remove Tag1')).toBeInTheDocument();
    });
  });

  describe('keepOpen', () => {
    it('closes dropdown after adding a tag when keepOpen is false', async () => {
      const user = userEvent.setup();
      render(<Taginput data={frameworks} keepOpen={false} />);
      const input = screen.getByRole('combobox');

      await user.type(input, 'rea');
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      await user.keyboard('{Enter}');

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('ArrowDown opens dropdown', () => {
    it('opens dropdown on ArrowDown when closed and data is available', () => {
      const { container } = render(<Taginput data={frameworks} openOnFocus />);
      const input = screen.getByRole('combobox');

      // Dropdown is initially closed (no focus yet)
      expect(container.querySelector('.taginput')).not.toHaveClass('is-active');
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      // ArrowDown sets isActive=true; since openOnFocus is true, hasInput
      // becomes true once isActive flips, so the dropdown renders.
      expect(container.querySelector('.taginput')).toHaveClass('is-active');
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });
  });

  describe('Function Ref Forwarding', () => {
    it('invokes function ref with the input element', () => {
      const refFn = jest.fn();
      render(<Taginput ref={refFn} />);

      expect(refFn).toHaveBeenCalled();
      const lastCall = refFn.mock.calls[refFn.mock.calls.length - 1];
      expect(lastCall[0]).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('Dropdown Mouse Enter', () => {
    it('highlights dropdown item on mouse enter', () => {
      render(<Taginput data={frameworks} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });

      const options = screen.getAllByRole('option');
      // Initially no option is highlighted
      expect(options[0]).not.toHaveClass('is-active');

      fireEvent.mouseEnter(options[0]);

      const updatedOptions = screen.getAllByRole('option');
      expect(updatedOptions[0]).toHaveClass('is-active');
    });
  });

  describe('Hidden Form Inputs', () => {
    it('renders one hidden input per tag when name is provided', () => {
      const { container } = render(
        <Taginput name="tags" defaultValue={['React', 'Vue']} />
      );
      const hiddenInputs = container.querySelectorAll('input[type="hidden"]');
      expect(hiddenInputs).toHaveLength(2);
      expect(hiddenInputs[0]).toHaveAttribute('name', 'tags');
      expect(hiddenInputs[0]).toHaveValue('React');
      expect(hiddenInputs[1]).toHaveValue('Vue');
    });

    it('associates hidden inputs with the form attribute', () => {
      const { container } = render(
        <Taginput name="tags" form="my-form" defaultValue={['React']} />
      );
      const hiddenInput = container.querySelector('input[type="hidden"]');
      expect(hiddenInput).toHaveAttribute('form', 'my-form');
    });
  });

  describe('Inside Field', () => {
    it('does not render its own Field wrapper when inside a Field', () => {
      const { container } = render(
        <Field label="Outer">
          <Taginput defaultValue={['Tag1']} />
        </Field>
      );
      // Only the outer Field's label should exist; Taginput should not
      // render an additional field/label.
      const labels = container.querySelectorAll('label');
      expect(labels).toHaveLength(1);
      expect(labels[0]).toHaveTextContent('Outer');
    });

    it('renders message below taginput when inside a Field', () => {
      const { container } = render(
        <Field label="Outer">
          <Taginput defaultValue={['Tag1']} message="Helpful message" />
        </Field>
      );
      expect(container).toHaveTextContent('Helpful message');
    });
  });

  describe('Branch coverage edge cases', () => {
    it('uses createTag transformation when provided', () => {
      const onChange = jest.fn();
      render(
        <Taginput
          createTag={input => ({ value: input.toLowerCase(), label: input })}
          onChange={onChange}
        />
      );
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'React' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(onChange).toHaveBeenCalledWith([
        { value: 'react', label: 'React' },
      ]);
    });

    it('falls back to tag.value when field property is missing', () => {
      // Object tag has no `label`, so getDisplayValue should fall through to
      // `tag.value`.
      const tags = [{ value: 'fallback' }];
      render(<Taginput defaultValue={tags} field="label" />);
      expect(screen.getByText('fallback')).toBeInTheDocument();
    });

    it('does not remove tag on backspace when disabled', () => {
      const onChange = jest.fn();
      render(<Taginput defaultValue={['Tag1']} disabled onChange={onChange} />);
      const input = screen.getByRole('textbox');

      fireEvent.keyDown(input, { key: 'Backspace' });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not remove tag via delete button when readonly', () => {
      const onRemove = jest.fn();
      render(<Taginput defaultValue={['Tag1']} readonly onRemove={onRemove} />);
      // The delete button is not rendered for readonly tags
      expect(screen.queryByLabelText('Remove Tag1')).not.toBeInTheDocument();
      expect(onRemove).not.toHaveBeenCalled();
    });

    it('does not open dropdown on focus when openOnFocus is false', () => {
      render(<Taginput data={frameworks} />);
      const input = screen.getByRole('combobox');

      fireEvent.focus(input);

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('does not open dropdown on focus when disabled', () => {
      render(<Taginput data={frameworks} openOnFocus disabled />);
      const input = screen.getByRole('combobox');

      fireEvent.focus(input);

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('does nothing on paste when no separators are configured', () => {
      const onChange = jest.fn();
      render(<Taginput onPasteSeparators={[]} onChange={onChange} />);
      const input = screen.getByRole('textbox');

      fireEvent.paste(input, {
        clipboardData: { getData: () => 'React, Vue' },
      });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('keeps highlight at 0 when ArrowUp is pressed at top of list', () => {
      render(<Taginput data={frameworks} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveClass('is-active');
    });

    it('keeps highlight at last item when ArrowDown is pressed at end of list', () => {
      render(<Taginput data={['Only']} />);
      const input = screen.getByRole('combobox');

      fireEvent.change(input, { target: { value: 'o' } });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveClass('is-active');
    });

    it('does not handle keys when disabled', () => {
      const onChange = jest.fn();
      render(<Taginput data={frameworks} disabled onChange={onChange} />);
      const input = screen.getByRole('combobox');

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('returns empty string for object tag missing both field and value', () => {
      // getDisplayValue: tag[field] || tag.value || '' — exercise the final
      // empty-string fallback. Both label and value are absent, so the tag
      // renders an empty span.
      const tags: Array<Record<string, unknown>> = [{ other: 'x' }];
      // Cast through unknown to satisfy the TaginputItem shape.
      render(
        <Taginput defaultValue={tags as unknown as Array<{ value: string }>} />
      );
      // Tag span exists but contains no text.
      const tagSpan = document.querySelector('.tag');
      expect(tagSpan).toBeInTheDocument();
    });

    it('does not open dropdown on focus when openOnFocus is true but data is empty', () => {
      render(<Taginput openOnFocus data={[]} />);
      const input = screen.getByRole('combobox');

      fireEvent.focus(input);

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('intercepts confirm-key character typed at end of input value', () => {
      // Branch in handleInputChange: lastChar in confirmKeys && lastChar !== 'Enter'
      // (Enter never appears as a typed character; comma does.)
      const onChange = jest.fn();
      render(<Taginput onChange={onChange} />);
      const input = screen.getByRole('textbox');

      // Trailing comma triggers the inline-add path.
      fireEvent.change(input, { target: { value: 'NewTag,' } });

      expect(onChange).toHaveBeenCalledWith(['NewTag']);
    });

    it('ignores trailing confirm-key when value is empty before it', () => {
      const onChange = jest.fn();
      render(<Taginput onChange={onChange} />);
      const input = screen.getByRole('textbox');

      // Just a comma — valueWithoutKey is empty, so no tag is added.
      fireEvent.change(input, { target: { value: ',' } });

      expect(onChange).not.toHaveBeenCalled();
    });

    it('addTag returns early when disabled (via paste, which has no disabled gate)', () => {
      const onChange = jest.fn();
      render(
        <Taginput disabled onPasteSeparators={[',']} onChange={onChange} />
      );
      const input = screen.getByRole('textbox');
      fireEvent.paste(input, {
        clipboardData: { getData: () => 'a,b' },
      });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('addTag returns early when readonly (via paste)', () => {
      const onChange = jest.fn();
      render(
        <Taginput readonly onPasteSeparators={[',']} onChange={onChange} />
      );
      const input = screen.getByRole('textbox');
      fireEvent.paste(input, {
        clipboardData: { getData: () => 'a,b' },
      });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('click outside container does not close when click is inside container', () => {
      render(<Taginput data={frameworks} />);
      const input = screen.getByRole('combobox');
      fireEvent.change(input, { target: { value: 'r' } });
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      // Mousedown on the input itself (inside containerRef) -> the inside
      // branch of the click-outside check.
      fireEvent.mouseDown(input);

      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('container click is a no-op when input is not rendered (maxTags reached)', () => {
      const { container } = render(
        <Taginput defaultValue={['Tag1', 'Tag2']} maxTags={2} />
      );
      // No input is rendered when maxTags is reached, so inputRef.current is null.
      // Clicking the container hits the falsy `?.` branch in handleContainerClick.
      const root = container.querySelector('.taginput')!;
      expect(() => fireEvent.click(root)).not.toThrow();
    });
  });
});

describe('Taginput label association (#493)', () => {
  it('associates the label with the inner input via htmlFor/id', () => {
    const { container } = render(<Taginput label="Tags" />);
    const input = screen.getByLabelText('Tags');
    expect(input.tagName).toBe('INPUT');
    expect(input.id).toBeTruthy();
    expect(container.querySelector('label.label')).toHaveAttribute(
      'for',
      input.id
    );
  });

  it('applies a user-supplied id to the inner input, not the wrapper', () => {
    const { container } = render(<Taginput label="Tags" id="tags-input" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('id', 'tags-input');
    expect(container.querySelector('.taginput')).not.toHaveAttribute('id');
    expect(container.querySelector('label.label')).toHaveAttribute(
      'for',
      'tags-input'
    );
  });

  it('drops the "Add tag" fallback name when the label is wired', () => {
    render(<Taginput label="Tags" />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-label');
  });

  it('keeps the "Add tag" fallback when labelProps.htmlFor points elsewhere', () => {
    render(<Taginput label="Tags" labelProps={{ htmlFor: 'elsewhere' }} />);
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-label',
      'Add tag'
    );
  });

  it('keeps the "Add tag" fallback name when unlabeled', () => {
    render(<Taginput />);
    expect(screen.getByRole('textbox')).toHaveAttribute(
      'aria-label',
      'Add tag'
    );
  });

  it("takes the outer Field's label in place of the fallback (#939)", () => {
    render(
      <Field label="Outer">
        <Taginput label="Dropped" />
      </Field>
    );
    const input = screen.getByRole('textbox', { name: 'Outer' });
    expect(input).not.toHaveAttribute('aria-label');
  });

  it('injects no id without a label', () => {
    render(<Taginput />);
    expect(screen.getByRole('textbox')).not.toHaveAttribute('id');
  });

  it('renders the label unwired when the tag limit is reached', () => {
    const { container } = render(
      <Taginput label="Tags" maxTags={1} value={['one']} />
    );
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    const fieldLabel = container.querySelector('label.label');
    expect(fieldLabel).toHaveTextContent('Tags');
    expect(fieldLabel).not.toHaveAttribute('for');
  });
});

describe('Taginput suggestions as a combobox (#1082)', () => {
  /**
   * Each id reference under `root` that names no element in the document, as
   * `attribute=id`, so a reference left pointing at nothing shows up by name.
   */
  const danglingIdRefs = (root: HTMLElement): string[] => {
    const attributes = [
      'aria-labelledby',
      'aria-controls',
      'aria-activedescendant',
      'for',
    ];
    return Array.from(root.querySelectorAll('*')).flatMap(el =>
      attributes.flatMap(attribute =>
        (el.getAttribute(attribute) ?? '')
          .split(/\s+/)
          .filter(id => id && !document.getElementById(id))
          .map(id => `${attribute}=${id}`)
      )
    );
  };

  // "e" matches React, Vue and Svelte.
  const openList = (combobox: HTMLElement) =>
    fireEvent.change(combobox, { target: { value: 'e' } });

  it('stays a plain text field without data, since it never shows a list', () => {
    render(<Taginput openOnFocus />);
    const input = screen.getByRole('textbox', { name: 'Add tag' });
    fireEvent.focus(input);
    openList(input);
    for (const attribute of [
      'role',
      'aria-expanded',
      'aria-controls',
      'aria-activedescendant',
      'aria-haspopup',
      'aria-autocomplete',
    ]) {
      expect(input).not.toHaveAttribute(attribute);
    }
  });

  it('leaves the label without an id when there is no list to name', () => {
    const { container } = render(<Taginput label="Tags" />);
    expect(container.querySelector('label')).not.toHaveAttribute('id');
  });

  it('is a collapsed combobox with data, keeping its "Add tag" name', () => {
    render(<Taginput data={frameworks} />);
    const input = screen.getByRole('combobox', { name: 'Add tag' });
    expect(input).toHaveAttribute('aria-autocomplete', 'list');
    expect(input).toHaveAttribute('aria-haspopup', 'listbox');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).not.toHaveAttribute('aria-controls');
    expect(input).not.toHaveAttribute('aria-activedescendant');
  });

  it('stays a collapsed combobox with an empty data array', () => {
    render(<Taginput data={[]} openOnFocus />);
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    openList(input);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).not.toHaveAttribute('aria-controls');
  });

  it('expands and controls the listbox while it shows suggestions', () => {
    render(<Taginput data={frameworks} />);
    const input = screen.getByRole('combobox');
    openList(input);
    const listbox = screen.getByRole('listbox');
    expect(listbox.id).toBeTruthy();
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(input).toHaveAttribute('aria-controls', listbox.id);
  });

  it('expands when openOnFocus opens the list', () => {
    render(<Taginput data={frameworks} openOnFocus />);
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(input).toHaveAttribute(
      'aria-controls',
      screen.getByRole('listbox').id
    );
  });

  it('collapses and points at nothing while no suggestion matches', () => {
    const { container } = render(<Taginput data={frameworks} />);
    const input = screen.getByRole('combobox');
    openList(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveAttribute('aria-activedescendant');

    fireEvent.change(input, { target: { value: 'zzz' } });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).not.toHaveAttribute('aria-controls');
    expect(input).not.toHaveAttribute('aria-activedescendant');
    expect(danglingIdRefs(container)).toEqual([]);
  });

  it('collapses and points at nothing once the list closes', () => {
    const { container } = render(
      <>
        <Taginput data={frameworks} label="Frameworks" />
        <button type="button">Outside</button>
      </>
    );
    const input = screen.getByRole('combobox', { name: 'Frameworks' });
    expect(danglingIdRefs(container)).toEqual([]);
    openList(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveAttribute('aria-activedescendant');
    expect(danglingIdRefs(container)).toEqual([]);

    fireEvent.mouseDown(screen.getByRole('button', { name: 'Outside' }));

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).not.toHaveAttribute('aria-controls');
    expect(input).not.toHaveAttribute('aria-activedescendant');
    expect(danglingIdRefs(container)).toEqual([]);
  });

  it('points aria-activedescendant at the highlighted option as it moves', () => {
    render(<Taginput data={frameworks} openOnFocus />);
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    const ids = screen.getAllByRole('option').map(option => option.id);
    // The highlighted option, and only that one, has aria-selected="true".
    const expectHighlight = (index: number) => {
      const options = screen.getAllByRole('option');
      expect(input).toHaveAttribute('aria-activedescendant', options[index].id);
      options.forEach((option, i) =>
        expect(option).toHaveAttribute('aria-selected', String(i === index))
      );
    };

    expect(input).not.toHaveAttribute('aria-activedescendant');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expectHighlight(0);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expectHighlight(1);
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    expectHighlight(0);
    fireEvent.mouseEnter(screen.getAllByRole('option')[2]);
    expectHighlight(2);
    // The ids hold still while the highlight moves.
    expect(screen.getAllByRole('option').map(option => option.id)).toEqual(ids);
  });

  it('points aria-activedescendant at the first option under keepFirst', () => {
    render(<Taginput data={frameworks} keepFirst />);
    const input = screen.getByRole('combobox');
    openList(input);
    const [first] = screen.getAllByRole('option');
    expect(first).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', first.id);
  });

  it('clears aria-activedescendant when adding a suggestion leaves nothing highlighted', () => {
    render(<Taginput data={frameworks} openOnFocus />);
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveAttribute('aria-activedescendant');

    fireEvent.keyDown(input, { key: 'Enter' });

    // keepOpen leaves the list open on the remaining suggestions.
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(input).not.toHaveAttribute('aria-activedescendant');
    screen
      .getAllByRole('option')
      .forEach(option =>
        expect(option).toHaveAttribute('aria-selected', 'false')
      );
  });

  it('drops aria-activedescendant when filtering leaves the highlight behind', () => {
    render(<Taginput data={frameworks} openOnFocus />);
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    for (let i = 0; i < 4; i++) {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
    }
    expect(input).toHaveAttribute(
      'aria-activedescendant',
      screen.getAllByRole('option')[3].id
    );
    // "vue" leaves one option, so the fourth-place highlight points past it.
    fireEvent.change(input, { target: { value: 'vue' } });
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(input).not.toHaveAttribute('aria-activedescendant');
  });

  // Enter adds nothing for a suggestion that's blank once trimmed, so the
  // combobox never announces one as the current choice, while the highlight
  // still moves through it on screen as before.
  it.each([
    ['empty', ''],
    ['whitespace-only', '  '],
  ])('points at no %s suggestion, which Enter cannot add', (_kind, blank) => {
    const onChange = jest.fn();
    render(<Taginput data={[blank, 'Vue']} openOnFocus onChange={onChange} />);
    const input = screen.getByRole('combobox');
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const [first, second] = screen.getAllByRole('option');
    expect(first).toHaveClass('is-active');
    expect(first).toHaveAttribute('aria-selected', 'false');
    expect(input).not.toHaveAttribute('aria-activedescendant');

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(second).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', second.id);
  });

  it('keeps the listbox to options, each with an id', () => {
    render(<Taginput data={frameworks} openOnFocus />);
    fireEvent.focus(screen.getByRole('combobox'));
    const children = Array.from(screen.getByRole('listbox').children);
    expect(children).toHaveLength(frameworks.length);
    children.forEach(child => {
      expect(child).toHaveAttribute('role', 'option');
      expect(child.id).toBeTruthy();
    });
  });

  it('gives each Taginput its own listbox and option ids', () => {
    render(
      <>
        <Taginput data={frameworks} openOnFocus />
        <Taginput data={frameworks} openOnFocus />
      </>
    );
    const [a, b] = screen.getAllByRole('combobox');
    fireEvent.focus(a);
    fireEvent.focus(b);
    const [listA, listB] = screen.getAllByRole('listbox');
    expect(listA.id).not.toBe(listB.id);
    expect(a).toHaveAttribute('aria-controls', listA.id);
    expect(b).toHaveAttribute('aria-controls', listB.id);
    const ids = screen.getAllByRole('option').map(option => option.id);
    expect(ids).toHaveLength(frameworks.length * 2);
    expect(new Set(ids).size).toBe(ids.length);

    fireEvent.keyDown(b, { key: 'ArrowDown' });
    expect(b).toHaveAttribute(
      'aria-activedescendant',
      within(listB).getAllByRole('option')[0].id
    );
    expect(a).not.toHaveAttribute('aria-activedescendant');
  });

  // The label that names the input names the list too, whichever renders
  // it. Each builds a Taginput labelled "Frameworks", passing `labelProps`
  // to whichever renders the label.
  type LabelledUi = (labelProps?: { id: string }) => React.ReactElement;
  const labelSources: Array<[string, LabelledUi]> = [
    [
      'its own label prop',
      labelProps => (
        <Taginput
          data={frameworks}
          label="Frameworks"
          labelProps={labelProps}
        />
      ),
    ],
    [
      "a surrounding Field's label",
      labelProps => (
        <Field label="Frameworks" labelProps={labelProps}>
          <Taginput data={frameworks} />
        </Field>
      ),
    ],
    [
      "a horizontal Field's label wired by hand into an inner Field",
      labelProps => (
        <Field
          horizontal
          label="Frameworks"
          labelProps={{ htmlFor: 'fw', id: 'fw-label', ...labelProps }}
        >
          <Field.Body>
            <Field>
              <Taginput id="fw" data={frameworks} />
            </Field>
          </Field.Body>
        </Field>
      ),
    ],
  ];

  it.each(labelSources)('names the listbox by %s', (_source, ui) => {
    const { container } = render(ui());
    openList(screen.getByRole('combobox', { name: 'Frameworks' }));
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAccessibleName('Frameworks');
    expect(listbox).not.toHaveAttribute('aria-label');
    const label = document.getElementById(
      listbox.getAttribute('aria-labelledby') ?? ''
    );
    expect(label?.tagName).toBe('LABEL');
    expect(danglingIdRefs(container)).toEqual([]);
  });

  it.each(labelSources)(
    'names the listbox through a labelProps id of your own on %s',
    (_source, ui) => {
      render(ui({ id: 'my-label' }));
      openList(screen.getByRole('combobox', { name: 'Frameworks' }));
      const listbox = screen.getByRole('listbox');
      expect(listbox).toHaveAttribute('aria-labelledby', 'my-label');
      expect(listbox).toHaveAccessibleName('Frameworks');
    }
  );

  it.each([
    ['with no label', <Taginput key="bare" data={frameworks} />, 'Add tag'],
    [
      'under its own label wired to another control',
      <Taginput
        key="elsewhere"
        data={frameworks}
        label="Frameworks"
        labelProps={{ htmlFor: 'elsewhere' }}
      />,
      'Add tag',
    ],
    [
      "under a Field's label wired by hand with no id to point at",
      <Field key="by-hand" label="Frameworks" labelProps={{ htmlFor: 'fw' }}>
        <Taginput id="fw" data={frameworks} />
      </Field>,
      'Frameworks',
    ],
  ])('names the listbox "Suggestions" %s', (_name, ui, inputName) => {
    render(ui);
    openList(screen.getByRole('combobox', { name: inputName }));
    const listbox = screen.getByRole('listbox');
    expect(listbox).toHaveAccessibleName('Suggestions');
    expect(listbox).not.toHaveAttribute('aria-labelledby');
  });
});

describe('TagInput deprecated alias', () => {
  it('is the same component as Taginput', () => {
    expect(TagInput).toBe(Taginput);
  });

  it('renders via the alias', () => {
    render(<TagInput value={['alpha']} />);
    expect(screen.getByText('alpha')).toBeInTheDocument();
  });
});
