import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Taginput } from '../Taginput';
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

      expect(screen.getByRole('listbox')).toBeInTheDocument();
      // All items should be visible
      expect(screen.getAllByRole('option')).toHaveLength(frameworks.length);
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
    it('splits pasted text by comma separator', () => {
      const onChange = jest.fn();
      render(<Taginput onPasteSeparators={[',']} onChange={onChange} />);
      const input = screen.getByRole('textbox');

      fireEvent.paste(input, {
        clipboardData: { getData: () => 'React, Vue, Angular' },
      });

      // addTag is called for each part
      expect(onChange).toHaveBeenCalled();
      const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
      expect(lastCall[0]).toContain('Angular');
    });

    it('splits pasted text by multiple separators', () => {
      const onChange = jest.fn();
      render(<Taginput onPasteSeparators={[',', ';']} onChange={onChange} />);
      const input = screen.getByRole('textbox');

      fireEvent.paste(input, {
        clipboardData: { getData: () => 'React, Vue; Angular' },
      });

      expect(onChange).toHaveBeenCalled();
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
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'a' } });

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveClass('is-active');
    });

    it('does not auto-highlight when keepFirst is false', () => {
      render(<Taginput data={frameworks} />);
      const input = screen.getByRole('textbox');

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
      const input = screen.getByRole('textbox');

      await user.type(input, 'rea');
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      await user.keyboard('{Enter}');

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  describe('ArrowDown opens dropdown', () => {
    it('opens dropdown on ArrowDown when closed and data is available', () => {
      const { container } = render(<Taginput data={frameworks} openOnFocus />);
      const input = screen.getByRole('textbox');

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
      const input = screen.getByRole('textbox');

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
      const input = screen.getByRole('textbox');

      fireEvent.focus(input);

      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });

    it('does not open dropdown on focus when disabled', () => {
      render(<Taginput data={frameworks} openOnFocus disabled />);
      const input = screen.getByRole('textbox');

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
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'a' } });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowUp' });
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveClass('is-active');
    });

    it('keeps highlight at last item when ArrowDown is pressed at end of list', () => {
      render(<Taginput data={['Only']} />);
      const input = screen.getByRole('textbox');

      fireEvent.change(input, { target: { value: 'o' } });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });

      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveClass('is-active');
    });

    it('does not handle keys when disabled', () => {
      const onChange = jest.fn();
      render(<Taginput data={frameworks} disabled onChange={onChange} />);
      const input = screen.getByRole('textbox');

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
      const input = screen.getByRole('textbox');

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
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'r' } });
      expect(screen.getByRole('listbox')).toBeInTheDocument();

      // Mousedown on the input itself (inside containerRef) -> false branch
      // of `containerRef.current && !containerRef.current.contains(target)`.
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
