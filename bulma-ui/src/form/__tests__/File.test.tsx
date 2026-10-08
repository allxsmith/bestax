import { createRef } from 'react';
import { act, render, screen, fireEvent } from '@testing-library/react';
import File from '../File';
import { Field } from '../Field';
import { ConfigProvider } from '../../helpers/Config';

describe('File', () => {
  it('renders a file input with default label', () => {
    render(<File />);
    const input = screen.getByLabelText(/choose a file/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'file');
  });

  it('renders custom label', () => {
    render(<File buttonLabel="Upload Avatar" />);
    expect(screen.getByLabelText(/upload avatar/i)).toBeInTheDocument();
  });

  it('applies Bulma and custom classes', () => {
    const { container } = render(
      <File
        color="primary"
        size="large"
        className="custom-file"
        isBoxed
        isFullwidth
        hasName
      />
    );
    const wrapper = container.querySelector('.file');
    expect(wrapper).toHaveClass('file');
    expect(wrapper).toHaveClass('is-primary');
    expect(wrapper).toHaveClass('is-large');
    expect(wrapper).toHaveClass('custom-file');
    expect(wrapper).toHaveClass('is-boxed');
    expect(wrapper).toHaveClass('is-fullwidth');
    expect(wrapper).toHaveClass('has-name');
  });

  it('applies classPrefix when provided', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bulma-">
        <File />
      </ConfigProvider>
    );
    const wrapper = container.querySelector('.bulma-file');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass('bulma-file');
  });

  describe('ClassPrefix', () => {
    it('applies prefix to classes when provided', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <File data-testid="file" />
        </ConfigProvider>
      );
      const fileWrapper = screen.getByTestId('file').closest('.bulma-file');
      expect(fileWrapper).toBeInTheDocument();
      expect(fileWrapper).toHaveClass('bulma-file');
    });

    it('uses default classes when no prefix is provided', () => {
      render(<File data-testid="file" />);
      const fileWrapper = screen.getByTestId('file').closest('.file');
      expect(fileWrapper).toBeInTheDocument();
      expect(fileWrapper).toHaveClass('file');
    });

    it('uses default classes when classPrefix is undefined', () => {
      render(
        <ConfigProvider classPrefix={undefined}>
          <File data-testid="file" />
        </ConfigProvider>
      );
      const fileWrapper = screen.getByTestId('file').closest('.file');
      expect(fileWrapper).toBeInTheDocument();
      expect(fileWrapper).toHaveClass('file');
    });

    it('applies prefix to both main class and helper classes', () => {
      render(
        <ConfigProvider classPrefix="bulma-">
          <File color="primary" isBoxed m="2" data-testid="file" />
        </ConfigProvider>
      );
      const fileWrapper = screen.getByTestId('file').closest('.bulma-file');
      expect(fileWrapper).toHaveClass('bulma-file');
      expect(fileWrapper).toHaveClass('bulma-is-primary');
      expect(fileWrapper).toHaveClass('bulma-is-boxed');
      expect(fileWrapper).toHaveClass('bulma-m-2');
    });

    it('works without prefix', () => {
      render(<File color="danger" isFullwidth p="3" data-testid="file" />);
      const fileWrapper = screen.getByTestId('file').closest('.file');
      expect(fileWrapper).toHaveClass('file');
      expect(fileWrapper).toHaveClass('is-danger');
      expect(fileWrapper).toHaveClass('is-fullwidth');
      expect(fileWrapper).toHaveClass('p-3');
    });
  });

  it('renders left and right icons', () => {
    render(
      <File
        iconLeft={<span data-testid="left-icon">L</span>}
        iconRight={<span data-testid="right-icon">R</span>}
      />
    );
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });

  it('shows fileName when hasName and fileName are provided', () => {
    render(<File hasName fileName="myfile.txt" />);
    expect(screen.getByText('myfile.txt')).toBeInTheDocument();
  });

  it('file input uses inputClassName', () => {
    render(<File inputClassName="my-file-input" />);
    const input = screen.getByLabelText(/choose a file/i);
    expect(input).toHaveClass('file-input');
    expect(input).toHaveClass('my-file-input');
  });

  it('forwards ref to file input', () => {
    const ref = createRef<HTMLInputElement>();
    render(<File ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('passes other props to file input', () => {
    render(<File data-testid="my-file" />);
    expect(screen.getByTestId('my-file')).toBeInTheDocument();
  });

  it('supports alignment classes: isRight, isCentered, and precedence of isRight', () => {
    const { container, rerender } = render(<File isRight />);
    let wrapper = container.querySelector('.file');
    expect(wrapper).toHaveClass('is-right');
    rerender(<File isCentered />);
    wrapper = container.querySelector('.file');
    expect(wrapper).toHaveClass('is-centered');
    rerender(<File isRight isCentered />);
    wrapper = container.querySelector('.file');
    expect(wrapper).toHaveClass('is-right');
    expect(wrapper).not.toHaveClass('is-centered');
  });

  it('calls onChange when a file is selected', () => {
    const handleChange = jest.fn();
    render(<File onChange={handleChange} />);
    const input = screen.getByLabelText(/choose a file/i);
    // Simulate file selection, using window.File to avoid naming collision
    const file = new window.File(['abc'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(input, { target: { files: [file] } });
    expect(handleChange).toHaveBeenCalled();
  });

  describe('inside a Field wrapper', () => {
    it('renders as a bare fragment (no extra Field wrapper) when nested in a Field', () => {
      const { container } = render(
        <Field label="Avatar">
          <File message="hint" messageColor="info" />
        </Field>
      );
      // Only the outer Field wrapper exists.
      expect(container.querySelectorAll('.field').length).toBe(1);
      const help = screen.getByText('hint');
      expect(help).toHaveClass('help');
      expect(help).toHaveClass('is-info');
    });
  });
});

describe('File hasName shows the picked file (#941)', () => {
  // window.File, because the component under test is also called File.
  const aFile = (name: string) =>
    new window.File(['abc'], name, { type: 'text/plain' });
  const pick = (input: HTMLElement, ...files: globalThis.File[]) =>
    fireEvent.change(input, { target: { files } });
  const fileInput = (container: HTMLElement) =>
    container.querySelector('input[type="file"]') as HTMLInputElement;
  const shownName = (container: HTMLElement) =>
    container.querySelector('.file-name');

  it('renders no name before a file is picked', () => {
    const { container } = render(<File hasName />);
    expect(shownName(container)).toBeNull();
  });

  it('shows the name of the picked file', () => {
    const { container } = render(<File hasName />);
    pick(fileInput(container), aFile('resume.pdf'));
    expect(shownName(container)).toHaveTextContent('resume.pdf');
  });

  it('shows the latest pick', () => {
    const { container } = render(<File hasName />);
    pick(fileInput(container), aFile('first.pdf'));
    pick(fileInput(container), aFile('second.pdf'));
    expect(shownName(container)).toHaveTextContent('second.pdf');
  });

  it('removes the name when a pick leaves no file', () => {
    const { container } = render(<File hasName />);
    pick(fileInput(container), aFile('resume.pdf'));
    pick(fileInput(container));
    expect(shownName(container)).toBeNull();
  });

  it('shows the one name when multiple is set and one file is picked', () => {
    const { container } = render(<File hasName multiple />);
    pick(fileInput(container), aFile('one.png'));
    expect(shownName(container)).toHaveTextContent('one.png');
  });

  it('shows a count when several files are picked', () => {
    const { container } = render(<File hasName multiple />);
    pick(fileInput(container), aFile('a.png'), aFile('b.png'), aFile('c.png'));
    expect(shownName(container)).toHaveTextContent(/^3 files$/);
  });

  describe('pickedFilesLabel words the count', () => {
    it('builds the text for several files from their count', () => {
      const label = jest.fn((count: number) => `${count} fichiers`);
      const { container } = render(
        <File hasName multiple pickedFilesLabel={label} />
      );
      pick(fileInput(container), aFile('a.png'), aFile('b.png'));
      expect(shownName(container)).toHaveTextContent(/^2 fichiers$/);
      expect(label).toHaveBeenCalledWith(2);
    });

    it('leaves a single pick to its file name', () => {
      const label = jest.fn((count: number) => `${count} fichiers`);
      const { container } = render(
        <File hasName multiple pickedFilesLabel={label} />
      );
      pick(fileInput(container), aFile('one.png'));
      expect(shownName(container)).toHaveTextContent('one.png');
      expect(label).not.toHaveBeenCalled();
    });

    it('follows a new label without a new pick', () => {
      const { container, rerender } = render(<File hasName multiple />);
      pick(fileInput(container), aFile('a.png'), aFile('b.png'));
      rerender(
        <File hasName multiple pickedFilesLabel={n => `${n} fichiers`} />
      );
      expect(shownName(container)).toHaveTextContent(/^2 fichiers$/);
    });

    it('stays off the input', () => {
      // A string, which React would write out as an attribute if it reached
      // the input. A function it drops on its own, so that proves nothing.
      const notAFunction = 'x' as unknown as (count: number) => string;
      const { container } = render(
        <File hasName pickedFilesLabel={notAFunction} />
      );
      expect(fileInput(container)).not.toHaveAttribute('pickedfileslabel');
    });
  });

  it('keeps firing the caller’s onChange', () => {
    const handleChange = jest.fn();
    const { container } = render(<File hasName onChange={handleChange} />);
    pick(fileInput(container), aFile('resume.pdf'));
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange.mock.calls[0][0].target).toBe(fileInput(container));
    expect(shownName(container)).toHaveTextContent('resume.pdf');
  });

  it('renders no name without hasName', () => {
    const { container } = render(<File />);
    pick(fileInput(container), aFile('resume.pdf'));
    expect(shownName(container)).toBeNull();
  });

  it('shows the picked name once hasName is turned on', () => {
    const { container, rerender } = render(<File />);
    pick(fileInput(container), aFile('resume.pdf'));
    rerender(<File hasName />);
    expect(shownName(container)).toHaveTextContent('resume.pdf');
  });

  it('applies the class prefix to the picked name', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bestax-">
        <File hasName />
      </ConfigProvider>
    );
    pick(fileInput(container), aFile('resume.pdf'));
    expect(container.querySelector('.bestax-file-name')).toHaveTextContent(
      'resume.pdf'
    );
  });

  describe('fileName is the controlled override', () => {
    it('keeps its markup byte-identical', () => {
      const { container } = render(<File hasName fileName="resume.pdf" />);
      expect(container.innerHTML).toBe(
        '<div class="field"><div class="file has-name"><label class="file-label">' +
          '<input class="file-input" type="file">' +
          '<span class="file-cta"><span class="file-label">Choose a file…</span></span>' +
          '<span class="file-name">resume.pdf</span></label></div></div>'
      );
    });

    it('wins over a picked file', () => {
      const { container } = render(<File hasName fileName="saved.pdf" />);
      pick(fileInput(container), aFile('resume.pdf'));
      expect(shownName(container)).toHaveTextContent('saved.pdf');
    });

    it('renders no name for an empty string, even after a pick', () => {
      const { container } = render(<File hasName fileName="" />);
      pick(fileInput(container), aFile('resume.pdf'));
      expect(shownName(container)).toBeNull();
    });

    it('hands back to the picked file once it is removed', () => {
      const { container, rerender } = render(
        <File hasName fileName="saved.pdf" />
      );
      pick(fileInput(container), aFile('resume.pdf'));
      rerender(<File hasName />);
      expect(shownName(container)).toHaveTextContent('resume.pdf');
    });
  });

  describe('a reset of the form', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    const renderInForm = () =>
      render(
        <form data-testid="form">
          <File hasName />
        </form>
      );

    it('clears the picked name', () => {
      const { container } = renderInForm();
      pick(fileInput(container), aFile('resume.pdf'));
      act(() => {
        screen.getByTestId<HTMLFormElement>('form').reset();
        jest.runAllTimers();
      });
      expect(shownName(container)).toBeNull();
    });

    it('keeps the name when the reset is cancelled', () => {
      const { container } = renderInForm();
      const form = screen.getByTestId<HTMLFormElement>('form');
      form.addEventListener('reset', e => e.preventDefault());
      pick(fileInput(container), aFile('resume.pdf'));
      act(() => {
        form.reset();
        jest.runAllTimers();
      });
      expect(shownName(container)).toHaveTextContent('resume.pdf');
    });

    it('stops listening once the name is gone', () => {
      const { container } = renderInForm();
      const form = screen.getByTestId<HTMLFormElement>('form');
      const remove = jest.spyOn(form, 'removeEventListener');
      pick(fileInput(container), aFile('resume.pdf'));
      pick(fileInput(container));
      expect(remove).toHaveBeenCalledWith('reset', expect.any(Function));
    });

    it('cancels a pending clear on unmount', () => {
      const { container, unmount } = renderInForm();
      pick(fileInput(container), aFile('resume.pdf'));
      act(() => screen.getByTestId<HTMLFormElement>('form').reset());
      unmount();
      expect(jest.getTimerCount()).toBe(0);
    });
  });
});

describe('File label association (#368)', () => {
  it('associates the Field label with the file input', () => {
    const { container } = render(<File label="Avatar" />);
    const input = screen.getByLabelText('Avatar');
    expect(input).toHaveAttribute('type', 'file');
    expect(input.id).toBeTruthy();
    expect(container.querySelector('label.label')).toHaveAttribute(
      'for',
      input.id
    );
  });

  it('resolves the Field label and the CTA label to the same input', () => {
    render(<File label="Avatar" />);
    expect(screen.getByLabelText('Avatar')).toBe(
      screen.getByLabelText(/choose a file/i)
    );
  });

  it('injects no id without a label', () => {
    const { container } = render(<File />);
    expect(container.querySelector('input')).not.toHaveAttribute('id');
  });
});

describe('File fullwidth aliases', () => {
  it('applies is-fullwidth via the canonical isFullwidth prop', () => {
    const { container } = render(<File isFullwidth />);
    expect(container.querySelector('.file')).toHaveClass('is-fullwidth');
  });

  it('applies is-fullwidth via the deprecated isFullWidth prop', () => {
    const { container } = render(<File isFullWidth />);
    expect(container.querySelector('.file')).toHaveClass('is-fullwidth');
  });

  it('isFullwidth wins when both spellings are set', () => {
    const { container } = render(<File isFullwidth={false} isFullWidth />);
    expect(container.querySelector('.file')).not.toHaveClass('is-fullwidth');
  });

  it('does not leak the deprecated alias onto the DOM input', () => {
    const { container } = render(<File isFullWidth />);
    expect(container.querySelector('input')).not.toHaveAttribute('isFullWidth');
  });

  it('applies the class prefix to is-fullwidth', () => {
    const { container } = render(
      <ConfigProvider classPrefix="bestax-">
        <File isFullwidth />
      </ConfigProvider>
    );
    expect(container.querySelector('.bestax-file')).toHaveClass(
      'bestax-is-fullwidth'
    );
  });
});
