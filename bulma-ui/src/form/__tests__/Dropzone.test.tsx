import { createRef, useState } from 'react';
import {
  act,
  createEvent,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { Dropzone, type DropzoneProps } from '../Dropzone';
import { Field } from '../Field';
import { Fieldset } from '../Fieldset';
import { ConfigProvider } from '../../helpers/Config';
import { LocaleProvider } from '../../helpers/LocaleProvider';
import { announceDelay } from '../../helpers/statusRegion';
import { resetDevWarnings } from '../../helpers/devWarnings';

// ---- What jsdom lacks ------------------------------------------------------
// jsdom has no DataTransfer, DragEvent or ClipboardEvent, and its file input
// takes only a FileList jsdom made itself. These stand in for them: a
// DataTransfer that collects files, a FileList that is an array with
// `item()`, and a `files` property on every input that holds what it's given,
// which a file input's `value = ''` empties, as it does in a browser.
// Testing Library builds a drag or clipboard event's data on a new
// DataTransfer when one exists, so the mock is what handlers receive.

const fileList = (files: readonly File[]): FileList =>
  Object.assign([...files], {
    item: (index: number) => files[index] ?? null,
  }) as unknown as FileList;

class MockDataTransfer {
  dropEffect = 'none';
  private readonly list: File[] = [];
  items = {
    add: (file: File) => {
      this.list.push(file);
    },
  };
  get files() {
    return fileList(this.list);
  }
}

const held = new WeakMap<HTMLInputElement, File[]>();
const nativeFiles = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  'files'
) as PropertyDescriptor;
const nativeValue = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  'value'
) as PropertyDescriptor;
const globals = globalThis as { DataTransfer?: unknown };

beforeAll(() => {
  Object.defineProperty(HTMLInputElement.prototype, 'files', {
    configurable: true,
    get(this: HTMLInputElement) {
      return fileList(held.get(this) ?? []);
    },
    set(this: HTMLInputElement, list: FileList) {
      held.set(this, Array.from(list));
    },
  });
  Object.defineProperty(HTMLInputElement.prototype, 'value', {
    configurable: true,
    get(this: HTMLInputElement) {
      if (this.type !== 'file') return nativeValue.get?.call(this);
      const first = held.get(this)?.[0];
      return first ? `C:\\fakepath\\${first.name}` : '';
    },
    set(this: HTMLInputElement, value: string) {
      if (this.type !== 'file') nativeValue.set?.call(this, value);
      else if (value === '') held.delete(this);
    },
  });
  globals.DataTransfer = MockDataTransfer;
});

afterAll(() => {
  Object.defineProperty(HTMLInputElement.prototype, 'files', nativeFiles);
  Object.defineProperty(HTMLInputElement.prototype, 'value', nativeValue);
  delete globals.DataTransfer;
});

let warnSpy: jest.SpyInstance;
beforeEach(() => {
  resetDevWarnings();
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => {
  warnSpy.mockRestore();
  jest.useRealTimers();
});

// ---- Files and the ways they arrive ------------------------------------------

const file = (name: string, type: string, size = 100, lastModified = 1) =>
  new File([new Uint8Array(size)], name, { type, lastModified });
const pdf = (name = 'report.pdf', size = 100) =>
  file(name, 'application/pdf', size);
const png = (name = 'photo.png', size = 100) => file(name, 'image/png', size);

interface TransferOptions {
  /** Files that are really folders. */
  folders?: File[];
  /** The data's types; files by default. */
  types?: string[];
  /** Whether it lists `items`, as browsers do; without, only `files`. */
  items?: boolean;
}

/** What a drop or a paste of `files` carries. */
const transfer = (
  files: File[],
  { folders = [], types = ['Files'], items = true }: TransferOptions = {}
) => ({
  types,
  files: fileList(files),
  ...(items
    ? {
        items: files.map(f => ({
          kind: 'file',
          type: f.type,
          getAsFile: () => f,
          webkitGetAsEntry: () => ({ isDirectory: folders.includes(f) }),
        })),
      }
    : {}),
});

/** What a drag of files of these types carries while it's over the zone. */
const dragging = (types: string[]) => ({
  types: ['Files'],
  items: types.map(type => ({ kind: 'file', type })),
});

const rootOf = (container: HTMLElement) =>
  container.querySelector('.dropzone') as HTMLElement;
const inputOf = (container: HTMLElement) =>
  container.querySelector('input[type="file"]') as HTMLInputElement;
const namesIn = (input: HTMLInputElement) =>
  Array.from(input.files ?? [], f => f.name);
const rows = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('.dropzone-item'), row =>
    Array.from(row.children, part =>
      part.tagName === 'BUTTON'
        ? part.getAttribute('aria-label')
        : part.textContent
    ).join(' | ')
  );
const refusals = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll('.dropzone-rejections .help'),
    p => p.textContent
  );

/**
 * A pick: the input is clicked (Enter and Space click it too), then the
 * browser puts the picked files in it and fires change.
 */
const pick = (input: HTMLInputElement, files: File[]) => {
  fireEvent.click(input);
  held.set(input, files);
  fireEvent.change(input);
};
/** A pick from a picker opened with `showPicker()`, which clicks nothing. */
const pickWithoutClick = (input: HTMLInputElement, files: File[]) => {
  held.set(input, files);
  fireEvent.change(input);
};
const drop = (
  input: HTMLInputElement,
  files: File[],
  options?: TransferOptions
) => fireEvent.drop(input, { dataTransfer: transfer(files, options) });

/** What the status region has said, once its delay has passed. */
const spoken = (container: HTMLElement) => {
  act(() => {
    jest.advanceTimersByTime(announceDelay);
  });
  return Array.from(
    container.querySelectorAll('[role="status"] > div'),
    div => div.textContent
  );
};

// ---- Tests -------------------------------------------------------------------

describe('Dropzone', () => {
  describe('markup', () => {
    it("renders Bulma's boxed, full-width file widget with the input over it", () => {
      const { container } = render(<Dropzone />);
      const root = rootOf(container);
      // On its own it renders its own Field, as File does.
      expect(root.parentElement).toHaveClass('field');
      const zone = root.firstElementChild as HTMLElement;
      expect(zone).toHaveClass('file', 'is-boxed', 'is-fullwidth');
      const input = inputOf(container);
      expect(input).toHaveClass('file-input');
      expect(input.parentElement).toHaveClass('file-label');
      expect(input.nextElementSibling).toHaveClass('file-cta');
      expect(screen.getByLabelText('Choose or drop a file')).toBe(input);
      expect(container.querySelector('[role="status"]')).toBeInTheDocument();
      expect(container.querySelector('.dropzone-list')).toBeNull();
    });

    it('says files with multiple, and takes its own text', () => {
      const { rerender } = render(<Dropzone multiple />);
      expect(screen.getByLabelText('Choose or drop files')).toBeInTheDocument();
      rerender(<Dropzone multiple buttonLabel="Add attachments" />);
      expect(screen.getByLabelText('Add attachments')).toBeInTheDocument();
      rerender(<Dropzone buttonLabel="" />);
      expect(
        screen.getByLabelText('Choose or drop a file')
      ).toBeInTheDocument();
    });

    it('puts an icon above the text, inside the label', () => {
      const { container } = render(<Dropzone icon={<svg data-icon />} />);
      const icon = container.querySelector('.file-cta > .file-icon');
      expect(icon?.querySelector('[data-icon]')).toBeInTheDocument();
    });

    it('takes File colours and sizes on the zone', () => {
      const { container } = render(<Dropzone color="success" size="large" />);
      expect(container.querySelector('.file')).toHaveClass(
        'is-success',
        'is-large'
      );
    });

    it('puts the attributes on the input and the helpers on the root', () => {
      const { container } = render(
        <Dropzone
          name="cv"
          accept=".pdf"
          required
          className="custom"
          m="3"
          data-testid="zone"
        />
      );
      const input = inputOf(container);
      expect(input).toHaveAttribute('name', 'cv');
      expect(input).toHaveAttribute('accept', '.pdf');
      expect(input).toBeRequired();
      expect(input).toHaveAttribute('data-testid', 'zone');
      expect(input).not.toHaveAttribute('multiple');
      expect(rootOf(container)).toHaveClass('dropzone', 'custom', 'm-3');
    });

    it('forwards an object ref and a function ref to the input', () => {
      const ref = createRef<HTMLInputElement>();
      const { unmount } = render(<Dropzone ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
      expect(ref.current?.type).toBe('file');
      unmount();
      const calls: Array<HTMLInputElement | null> = [];
      render(<Dropzone ref={node => void calls.push(node)} />);
      expect(calls[0]).toBeInstanceOf(HTMLInputElement);
    });

    it('describes the input by the hint, the refusals and the message', () => {
      jest.useFakeTimers();
      const { container } = render(
        <Dropzone
          accept=".pdf"
          hint="PDF up to 5 MB"
          message="Attach your CV"
          messageColor="danger"
          aria-describedby="extra"
        />
      );
      const input = inputOf(container);
      const ids = () =>
        (input.getAttribute('aria-describedby') ?? '').split(' ');
      const hint = screen.getByText('PDF up to 5 MB');
      const message = screen.getByText('Attach your CV');
      expect(hint).toHaveClass('help', 'dropzone-hint');
      expect(message).toHaveClass('help', 'is-danger');
      expect(ids()).toEqual(['extra', hint.id, message.id]);
      drop(input, [png()]);
      const list = container.querySelector(
        '.dropzone-rejections'
      ) as HTMLElement;
      expect(ids()).toEqual(['extra', hint.id, list.id, message.id]);
    });

    it('describes the input by nothing without a hint, a message or refusals', () => {
      const { container } = render(<Dropzone />);
      expect(inputOf(container)).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('Field', () => {
    it('renders its own Field with a label that names the input', () => {
      const { container } = render(<Dropzone label="CV" />);
      const field = container.firstElementChild as HTMLElement;
      expect(field).toHaveClass('field');
      expect(field.querySelector(':scope > .dropzone')).toBeInTheDocument();
      const input = screen.getByLabelText('CV');
      expect(input).toBe(inputOf(container));
      expect(input.id).toBeTruthy();
    });

    it('keeps an id you pass', () => {
      render(<Dropzone label="CV" id="cv" />);
      expect(screen.getByLabelText('CV')).toHaveAttribute('id', 'cv');
    });

    it('renders no Field of its own inside one, whose label names it', () => {
      const { container } = render(
        <Field label="Attachments">
          <Dropzone label="Dropped" message="Help" />
        </Field>
      );
      expect(container.querySelectorAll('.field')).toHaveLength(1);
      expect(screen.queryByText('Dropped')).toBeNull();
      expect(screen.getByText('Help')).toHaveClass('help');
      expect(screen.getByLabelText('Attachments')).toBe(inputOf(container));
    });
  });

  describe('picking', () => {
    it('lists a picked file with its size and a remove button', () => {
      const onFilesChange = jest.fn();
      const onChange = jest.fn();
      const { container } = render(
        <Dropzone onFilesChange={onFilesChange} onChange={onChange} />
      );
      const input = inputOf(container);
      const report = pdf('report.pdf', 1234);
      pick(input, [report]);
      expect(rows(container)).toEqual([
        'report.pdf | 1.2 kB | Remove report.pdf',
      ]);
      expect(onFilesChange).toHaveBeenCalledWith([report]);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(namesIn(onChange.mock.calls[0][0].target)).toEqual(['report.pdf']);
    });

    it('replaces the file without multiple', () => {
      const { container } = render(<Dropzone />);
      const input = inputOf(container);
      pick(input, [pdf('a.pdf')]);
      pick(input, [pdf('b.pdf')]);
      expect(namesIn(input)).toEqual(['b.pdf']);
      expect(rows(container)).toHaveLength(1);
    });

    it('adds to the list with multiple, writing the whole list to the input', () => {
      const { container } = render(<Dropzone multiple />);
      const input = inputOf(container);
      pick(input, [pdf('a.pdf')]);
      pick(input, [pdf('b.pdf'), pdf('c.pdf')]);
      expect(namesIn(input)).toEqual(['a.pdf', 'b.pdf', 'c.pdf']);
    });

    it('keeps the list when a pick comes back empty', () => {
      const onFilesChange = jest.fn();
      const { container } = render(
        <Dropzone multiple onFilesChange={onFilesChange} />
      );
      const input = inputOf(container);
      pick(input, [pdf('a.pdf')]);
      pick(input, []);
      expect(namesIn(input)).toEqual(['a.pdf']);
      expect(onFilesChange).toHaveBeenCalledTimes(1);
    });

    it('reads a change with no files list as an empty pick', () => {
      const { container } = render(<Dropzone />);
      const input = inputOf(container);
      pick(input, [pdf('a.pdf')]);
      Object.defineProperty(input, 'files', {
        configurable: true,
        writable: true,
        value: null,
      });
      fireEvent.change(input);
      delete (input as { files?: unknown }).files;
      expect(rows(container)).toHaveLength(1);
    });

    it('refuses a picked file accept does not take, and keeps the list', () => {
      const onReject = jest.fn();
      const { container } = render(
        <Dropzone accept=".pdf" onReject={onReject} />
      );
      const input = inputOf(container);
      const report = pdf();
      pick(input, [report]);
      const photo = png();
      pick(input, [photo]);
      expect(namesIn(input)).toEqual(['report.pdf']);
      expect(refusals(container)).toEqual(['photo.png: only PDF files']);
      expect(onReject).toHaveBeenCalledWith([
        { file: photo, code: 'file-invalid-type' },
      ]);
    });
  });

  describe('dropping', () => {
    it('takes the drop itself, so the browser never assigns it', () => {
      const { container } = render(<Dropzone />);
      const input = inputOf(container);
      const allowed = drop(input, [pdf()]);
      expect(allowed).toBe(false);
      expect(namesIn(input)).toEqual(['report.pdf']);
      expect(rows(container)).toEqual([
        'report.pdf | 100 bytes | Remove report.pdf',
      ]);
    });

    it('reads files from a drop that lists no items', () => {
      const { container } = render(<Dropzone multiple />);
      const input = inputOf(container);
      drop(input, [pdf('a.pdf'), pdf('b.pdf')], { items: false });
      expect(namesIn(input)).toEqual(['a.pdf', 'b.pdf']);
    });

    it('skips an item that holds no file, and one with no entry', () => {
      const { container } = render(<Dropzone multiple />);
      const input = inputOf(container);
      const a = pdf('a.pdf');
      fireEvent.drop(input, {
        dataTransfer: {
          types: ['Files', 'text/uri-list'],
          items: [
            { kind: 'string', type: 'text/uri-list', getAsFile: () => null },
            { kind: 'file', type: 'application/pdf', getAsFile: () => null },
            { kind: 'file', type: 'application/pdf', getAsFile: () => a },
          ],
        },
      });
      expect(namesIn(input)).toEqual(['a.pdf']);
    });

    it('reads a drop with neither items nor files as empty', () => {
      const onFilesChange = jest.fn();
      const { container } = render(<Dropzone onFilesChange={onFilesChange} />);
      fireEvent.drop(inputOf(container), {
        dataTransfer: { types: ['Files'], items: undefined, files: undefined },
      });
      expect(onFilesChange).not.toHaveBeenCalled();
    });

    it('leaves a drag of something other than files alone', () => {
      const onDrop = jest.fn();
      const { container } = render(<Dropzone onDrop={onDrop} />);
      const input = inputOf(container);
      expect(
        fireEvent.drop(input, { dataTransfer: { types: ['text/plain'] } })
      ).toBe(true);
      expect(fireEvent.drop(input, { dataTransfer: { items: [] } })).toBe(true);
      expect(onDrop).toHaveBeenCalledTimes(2);
    });

    it('checks accept by extension, by wildcard and by MIME type', () => {
      const { container } = render(
        <Dropzone multiple accept=" .PDF , image/*, text/csv, pdf, ., " />
      );
      const input = inputOf(container);
      const doc = file('NOTES.Pdf', '');
      const photo = file('photo', 'IMAGE/JPEG');
      const table = file('table', 'text/csv');
      const words = file('words.txt', 'text/plain');
      drop(input, [doc, photo, table, words]);
      expect(namesIn(input)).toEqual(['NOTES.Pdf', 'photo', 'table']);
      expect(refusals(container)).toEqual([
        'words.txt: only PDF, image, or CSV files',
      ]);
    });

    it('takes every file when accept names no type it recognizes', () => {
      const { container } = render(<Dropzone multiple accept="pdf, ." />);
      const input = inputOf(container);
      drop(input, [file('anything.bin', 'application/octet-stream')]);
      expect(namesIn(input)).toEqual(['anything.bin']);
    });

    it.each([
      ['application/pdf', 'PDF'],
      ['image/svg+xml', 'SVG'],
      ['text/plain', 'text'],
      ['application/vnd.ms-excel', 'application/vnd.ms-excel'],
      ['.pdf,application/pdf', 'PDF'],
      ['.png,.jpg', 'PNG or JPG'],
      ['video/*', 'video'],
    ])('names accept %s as %s in the default message', (accept, words) => {
      const { container } = render(<Dropzone accept={accept} />);
      drop(inputOf(container), [file('odd.xyz', 'chemical/x-xyz')]);
      expect(refusals(container)).toEqual([`odd.xyz: only ${words} files`]);
    });

    it('refuses a file over maxSize', () => {
      const onReject = jest.fn();
      const { container } = render(
        <Dropzone multiple maxSize={5_000_000} onReject={onReject} />
      );
      const input = inputOf(container);
      const big = pdf('big.pdf', 5_000_001);
      const fits = pdf('fits.pdf', 5_000_000);
      drop(input, [big, fits]);
      expect(namesIn(input)).toEqual(['fits.pdf']);
      expect(refusals(container)).toEqual(['big.pdf: larger than 5 MB']);
      expect(onReject).toHaveBeenCalledWith([
        { file: big, code: 'file-too-large' },
      ]);
    });

    it('takes one file without multiple, and refuses the rest', () => {
      const { container } = render(<Dropzone />);
      const input = inputOf(container);
      drop(input, [pdf('a.pdf'), pdf('b.pdf')]);
      expect(namesIn(input)).toEqual(['a.pdf']);
      expect(refusals(container)).toEqual(['b.pdf: only one file']);
    });

    it('adds up to maxFiles and refuses the surplus', () => {
      const onReject = jest.fn();
      const { container } = render(
        <Dropzone multiple maxFiles={3} onReject={onReject} />
      );
      const input = inputOf(container);
      drop(input, [pdf('a.pdf'), pdf('b.pdf')]);
      const d = pdf('d.pdf');
      drop(input, [pdf('c.pdf'), d]);
      expect(namesIn(input)).toEqual(['a.pdf', 'b.pdf', 'c.pdf']);
      expect(refusals(container)).toEqual(['d.pdf: only 3 files']);
      expect(onReject).toHaveBeenLastCalledWith([
        { file: d, code: 'too-many-files' },
      ]);
    });

    it('says one file when maxFiles is 1', () => {
      const { container } = render(<Dropzone multiple maxFiles={1} />);
      drop(inputOf(container), [pdf('a.pdf'), pdf('b.pdf')]);
      expect(refusals(container)).toEqual(['b.pdf: only one file']);
    });

    it('skips a file already in the list', () => {
      jest.useFakeTimers();
      const onFilesChange = jest.fn();
      const { container } = render(
        <Dropzone multiple onFilesChange={onFilesChange} />
      );
      const input = inputOf(container);
      drop(input, [pdf('a.pdf')]);
      spoken(container);
      drop(input, [pdf('a.pdf')]);
      expect(namesIn(input)).toEqual(['a.pdf']);
      expect(refusals(container)).toEqual([]);
      expect(onFilesChange).toHaveBeenCalledTimes(1);
      expect(spoken(container)).toEqual(['a.pdf added']);
    });

    it('refuses a folder', () => {
      const { container } = render(<Dropzone multiple />);
      const input = inputOf(container);
      const folder = file('photos', '', 0);
      drop(input, [folder, pdf()], { folders: [folder] });
      expect(namesIn(input)).toEqual(['report.pdf']);
      expect(refusals(container)).toEqual(["photos: folders can't be added"]);
    });

    it('clears the refusals on the next drop', () => {
      const { container } = render(<Dropzone accept=".pdf" />);
      const input = inputOf(container);
      drop(input, [png()]);
      expect(refusals(container)).toHaveLength(1);
      drop(input, [pdf()]);
      expect(refusals(container)).toEqual([]);
      expect(container.querySelector('.dropzone-rejections')).toBeNull();
    });

    it('takes nothing while disabled, and refuses the drag', () => {
      const onFilesChange = jest.fn();
      const { container } = render(
        <Dropzone disabled onFilesChange={onFilesChange} />
      );
      const input = inputOf(container);
      const over = createEvent.dragOver(input, {
        dataTransfer: dragging(['application/pdf']),
      });
      fireEvent(input, over);
      expect(over.defaultPrevented).toBe(true);
      expect((over as DragEvent).dataTransfer?.dropEffect).toBe('none');
      expect(rootOf(container)).not.toHaveClass('is-dragover');
      expect(drop(input, [pdf()])).toBe(false);
      expect(onFilesChange).not.toHaveBeenCalled();
      expect(rootOf(container)).toHaveClass('is-disabled');
    });

    it('hands the drag events to your handlers too', () => {
      const handlers = {
        onDragEnter: jest.fn(),
        onDragOver: jest.fn(),
        onDragLeave: jest.fn(),
        onDrop: jest.fn(),
        onPaste: jest.fn(),
      };
      const { container } = render(<Dropzone {...handlers} />);
      const input = inputOf(container);
      fireEvent.dragEnter(input, { dataTransfer: dragging([]) });
      fireEvent.dragOver(input, { dataTransfer: dragging([]) });
      fireEvent.dragLeave(input);
      drop(input, [pdf()]);
      fireEvent.paste(input, { clipboardData: transfer([]) });
      for (const handler of Object.values(handlers)) {
        expect(handler).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('dragging over', () => {
    const over = (input: HTMLInputElement, types: string[]) => {
      const event = createEvent.dragEnter(input, {
        dataTransfer: dragging(types),
      });
      fireEvent(input, event);
      return event as DragEvent;
    };

    it('shows is-dragover, and leaves it when the drag leaves', () => {
      const { container } = render(<Dropzone />);
      const input = inputOf(container);
      const root = rootOf(container);
      const event = over(input, ['application/pdf']);
      expect(event.defaultPrevented).toBe(true);
      expect(event.dataTransfer?.dropEffect).toBe('copy');
      expect(root).toHaveClass('is-dragover');
      expect(root).not.toHaveClass('is-drag-reject');
      fireEvent.dragLeave(input);
      expect(root).not.toHaveClass('is-dragover');
    });

    it('drops the drag state on a drop', () => {
      const { container } = render(<Dropzone />);
      const input = inputOf(container);
      over(input, ['application/pdf']);
      drop(input, [pdf()]);
      expect(rootOf(container)).not.toHaveClass('is-dragover');
    });

    it('ignores a drag of something other than files', () => {
      const { container } = render(<Dropzone />);
      const input = inputOf(container);
      const event = createEvent.dragOver(input, {
        dataTransfer: { types: ['text/plain'] },
      });
      fireEvent(input, event);
      expect(event.defaultPrevented).toBe(false);
      expect(rootOf(container)).not.toHaveClass('is-dragover');
    });

    it('shows is-drag-reject when every dragged type is one accept refuses', () => {
      const { container } = render(<Dropzone multiple accept="image/*" />);
      const input = inputOf(container);
      over(input, ['application/pdf', 'text/plain']);
      expect(rootOf(container)).toHaveClass('is-drag-reject');
      over(input, ['application/pdf', 'image/png']);
      expect(rootOf(container)).toHaveClass('is-dragover');
    });

    it('waits for the drop when a type is unknown, or accept names an extension', () => {
      const { container: unknown } = render(<Dropzone accept="image/*" />);
      over(inputOf(unknown), ['']);
      expect(rootOf(unknown)).toHaveClass('is-dragover');
      const { container: byName } = render(<Dropzone accept=".pdf" />);
      over(inputOf(byName), ['image/png']);
      expect(rootOf(byName)).toHaveClass('is-dragover');
      const { container: anything } = render(<Dropzone />);
      over(inputOf(anything), ['image/png']);
      expect(rootOf(anything)).toHaveClass('is-dragover');
    });

    it('shows is-dragover for a drag that lists no items', () => {
      const { container } = render(<Dropzone multiple accept="image/*" />);
      const input = inputOf(container);
      fireEvent.dragEnter(input, {
        dataTransfer: { types: ['Files'], items: undefined },
      });
      expect(rootOf(container)).toHaveClass('is-dragover');
    });

    it('shows is-drag-reject once the list is full', () => {
      const { container } = render(<Dropzone multiple maxFiles={1} />);
      const input = inputOf(container);
      drop(input, [pdf()]);
      over(input, ['application/pdf']);
      expect(rootOf(container)).toHaveClass('is-drag-reject');
    });
  });

  describe('pasting', () => {
    it('takes pasted files through the same checks', () => {
      const { container } = render(<Dropzone multiple accept="image/*" />);
      const input = inputOf(container);
      const allowed = fireEvent.paste(input, {
        clipboardData: transfer([png('shot.png'), pdf()]),
      });
      expect(allowed).toBe(false);
      expect(namesIn(input)).toEqual(['shot.png']);
      expect(refusals(container)).toEqual(['report.pdf: only image files']);
    });

    it('leaves a paste with no files alone', () => {
      const { container } = render(<Dropzone />);
      const input = inputOf(container);
      expect(
        fireEvent.paste(input, {
          clipboardData: { types: ['text/plain'], items: [] },
        })
      ).toBe(true);
      expect(fireEvent.paste(input)).toBe(true);
    });

    it('takes no paste with allowPaste off, or while disabled', () => {
      const { container } = render(
        <>
          <Dropzone allowPaste={false} />
          <Dropzone disabled />
        </>
      );
      for (const input of container.querySelectorAll('input')) {
        expect(
          fireEvent.paste(input, { clipboardData: transfer([pdf()]) })
        ).toBe(true);
        expect(namesIn(input)).toEqual([]);
      }
    });
  });

  describe('removing', () => {
    it('removes a file, rewriting the input, and moves focus to the next button', () => {
      const onFilesChange = jest.fn();
      const { container } = render(
        <Dropzone multiple onFilesChange={onFilesChange} />
      );
      const input = inputOf(container);
      drop(input, [pdf('a.pdf'), pdf('b.pdf'), pdf('c.pdf')]);
      fireEvent.click(screen.getByRole('button', { name: 'Remove b.pdf' }));
      expect(namesIn(input)).toEqual(['a.pdf', 'c.pdf']);
      expect(onFilesChange).toHaveBeenLastCalledWith([
        expect.objectContaining({ name: 'a.pdf' }),
        expect.objectContaining({ name: 'c.pdf' }),
      ]);
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Remove c.pdf' })
      );
    });

    it('moves focus to the button before when the last row goes, then to the input', () => {
      const { container } = render(<Dropzone multiple />);
      const input = inputOf(container);
      drop(input, [pdf('a.pdf'), pdf('b.pdf')]);
      fireEvent.click(screen.getByRole('button', { name: 'Remove b.pdf' }));
      expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Remove a.pdf' })
      );
      fireEvent.click(screen.getByRole('button', { name: 'Remove a.pdf' }));
      expect(document.activeElement).toBe(input);
      expect(container.querySelector('.dropzone-list')).toBeNull();
    });

    it('names the remove buttons with removeLabel', () => {
      const { container } = render(
        <Dropzone removeLabel={f => `Entfernen: ${f.name}`} />
      );
      drop(inputOf(container), [pdf()]);
      expect(
        screen.getByRole('button', { name: 'Entfernen: report.pdf' })
      ).toBeInTheDocument();
    });

    it('shows no remove buttons while disabled', () => {
      const { container } = render(
        <Dropzone disabled files={[pdf()]} onFilesChange={() => {}} />
      );
      expect(rows(container)).toEqual(['report.pdf | 100 bytes']);
      expect(container.querySelector('.delete')).toBeNull();
    });
  });

  describe('announcing', () => {
    it('announces additions, refusals and removals', () => {
      jest.useFakeTimers();
      const { container } = render(<Dropzone multiple accept=".pdf" />);
      const input = inputOf(container);
      drop(input, [pdf('a.pdf')]);
      expect(spoken(container)).toEqual(['a.pdf added']);
      drop(input, [pdf('b.pdf'), pdf('c.pdf'), png()]);
      expect(spoken(container)).toEqual([
        'a.pdf added',
        '2 files added',
        'photo.png: only PDF files',
      ]);
      fireEvent.click(screen.getByRole('button', { name: 'Remove a.pdf' }));
      expect(spoken(container)).toContain('a.pdf removed');
    });

    it('announces in your words', () => {
      jest.useFakeTimers();
      const rejectionMessage = jest.fn(
        (r: Parameters<NonNullable<DropzoneProps['rejectionMessage']>>[0]) =>
          `${r.file.name} abgelehnt (${r.code})`
      );
      const { container } = render(
        <Dropzone
          multiple
          accept=".pdf"
          addedMessage={files => `${files.length} hinzugefügt`}
          removedMessage={f => `${f.name} entfernt`}
          rejectionMessage={rejectionMessage}
        />
      );
      const input = inputOf(container);
      drop(input, [pdf('a.pdf'), png()]);
      expect(spoken(container)).toEqual([
        '1 hinzugefügt',
        'photo.png abgelehnt (file-invalid-type)',
      ]);
      expect(refusals(container)).toEqual([
        'photo.png abgelehnt (file-invalid-type)',
      ]);
      expect(rejectionMessage.mock.calls[0][0]).toEqual({
        file: expect.objectContaining({ name: 'photo.png' }),
        code: 'file-invalid-type',
      });
      jest.advanceTimersByTime(2000);
      fireEvent.click(screen.getByRole('button', { name: 'Remove a.pdf' }));
      expect(spoken(container)).toEqual(['a.pdf entfernt']);
    });
  });

  describe('sizes', () => {
    it.each([
      [1, '1 byte'],
      [999, '999 bytes'],
      [1000, '1 kB'],
      [1250, '1.3 kB'],
      [250_000, '250 kB'],
      [1_200_000, '1.2 MB'],
      [3_400_000_000, '3.4 GB'],
    ])('writes %d bytes as %s', (size, text) => {
      const { container } = render(<Dropzone />);
      drop(inputOf(container), [pdf('a.pdf', size)]);
      expect(container.querySelector('.dropzone-size')).toHaveTextContent(text);
    });

    it("writes sizes and counts in a LocaleProvider's locale", () => {
      jest.useFakeTimers();
      const { container } = render(
        <LocaleProvider locale="de">
          <Dropzone multiple maxFiles={1500} maxSize={1_500_000} />
        </LocaleProvider>
      );
      const input = inputOf(container);
      drop(input, [
        pdf('a.pdf', 1_250_000),
        pdf('b.pdf', 1),
        pdf('c.pdf', 2_000_000),
      ]);
      // Intl puts a no-break space between a number and its unit.
      const plain = (text: string | null) => text?.replace(/\u00a0/g, ' ');
      expect(
        Array.from(container.querySelectorAll('.dropzone-size'), s =>
          plain(s.textContent)
        )
      ).toEqual(['1,3 MB', '1 Byte']);
      expect(refusals(container).map(plain)).toEqual([
        'c.pdf: larger than 1,5 MB',
      ]);
      expect(spoken(container)[0]).toBe('2 files added');
      const many = Array.from({ length: 1500 }, (_, i) => pdf(`f${i}.pdf`));
      drop(input, many);
      expect(refusals(container)).toContain('f1498.pdf: only 1.500 files');
      act(() => {
        jest.advanceTimersByTime(2000);
      });
      drop(input, [pdf('x.pdf'), pdf('y.pdf')]);
      expect(spoken(container)).toContain('x.pdf: only 1.500 files');
    });
  });

  describe('controlled', () => {
    function Controlled(props: DropzoneProps) {
      const [files, setFiles] = useState<File[]>([]);
      return (
        <>
          <Dropzone {...props} files={files} onFilesChange={setFiles} />
          <output>{files.map(f => f.name).join(',')}</output>
        </>
      );
    }

    it('follows the files prop and reports changes', () => {
      const { container } = render(<Controlled multiple />);
      const input = inputOf(container);
      drop(input, [pdf('a.pdf'), pdf('b.pdf')]);
      expect(container.querySelector('output')).toHaveTextContent(
        'a.pdf,b.pdf'
      );
      expect(namesIn(input)).toEqual(['a.pdf', 'b.pdf']);
      fireEvent.click(screen.getByRole('button', { name: 'Remove a.pdf' }));
      expect(container.querySelector('output')).toHaveTextContent('b.pdf');
      expect(namesIn(input)).toEqual(['b.pdf']);
    });

    it('writes files given from outside to the input', () => {
      const a = pdf('a.pdf');
      const { container, rerender } = render(
        <Dropzone multiple files={[a]} onFilesChange={() => {}} />
      );
      const input = inputOf(container);
      expect(namesIn(input)).toEqual(['a.pdf']);
      rerender(<Dropzone multiple files={[a]} onFilesChange={() => {}} />);
      expect(namesIn(input)).toEqual(['a.pdf']);
      rerender(<Dropzone multiple files={[]} onFilesChange={() => {}} />);
      expect(namesIn(input)).toEqual([]);
    });

    it('undoes a change the app does not take', () => {
      const a = pdf('a.pdf');
      const onFilesChange = jest.fn();
      const { container } = render(
        <Dropzone multiple files={[a]} onFilesChange={onFilesChange} />
      );
      const input = inputOf(container);
      drop(input, [pdf('b.pdf')]);
      expect(onFilesChange).toHaveBeenCalledWith([
        a,
        expect.objectContaining({ name: 'b.pdf' }),
      ]);
      expect(namesIn(input)).toEqual(['a.pdf']);
      expect(rows(container)).toHaveLength(1);
    });

    it('keys rows apart when the files repeat', () => {
      const a = pdf('a.pdf');
      const error = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { container } = render(<Dropzone multiple files={[a, a]} />);
      expect(rows(container)).toHaveLength(2);
      expect(error).not.toHaveBeenCalled();
      error.mockRestore();
    });
  });

  describe('form reset', () => {
    it('clears the list and the refusals a task after the reset', () => {
      jest.useFakeTimers();
      const onFilesChange = jest.fn();
      const { container } = render(
        <form>
          <Dropzone multiple accept=".pdf" onFilesChange={onFilesChange} />
        </form>
      );
      const input = inputOf(container);
      drop(input, [pdf(), png()]);
      fireEvent.reset(container.querySelector('form') as HTMLFormElement);
      expect(rows(container)).toHaveLength(1);
      act(() => {
        jest.runOnlyPendingTimers();
      });
      expect(rows(container)).toEqual([]);
      expect(refusals(container)).toEqual([]);
      expect(onFilesChange).toHaveBeenLastCalledWith([]);
    });

    it('asks a controlled Dropzone to clear, and clears only refusals when empty', () => {
      jest.useFakeTimers();
      const onFilesChange = jest.fn();
      const { container, rerender } = render(
        <form>
          <Dropzone
            accept=".pdf"
            files={[pdf()]}
            onFilesChange={onFilesChange}
          />
        </form>
      );
      const form = container.querySelector('form') as HTMLFormElement;
      fireEvent.reset(form);
      act(() => {
        jest.runOnlyPendingTimers();
      });
      expect(onFilesChange).toHaveBeenCalledWith([]);
      rerender(
        <form>
          <Dropzone accept=".pdf" files={[]} onFilesChange={onFilesChange} />
        </form>
      );
      drop(inputOf(container), [png()]);
      onFilesChange.mockClear();
      fireEvent.reset(form);
      act(() => {
        jest.runOnlyPendingTimers();
      });
      expect(refusals(container)).toEqual([]);
      expect(onFilesChange).not.toHaveBeenCalled();
    });

    it('clears the list with no onFilesChange to tell', () => {
      jest.useFakeTimers();
      const { container } = render(
        <form>
          <Dropzone />
        </form>
      );
      drop(inputOf(container), [pdf()]);
      fireEvent.reset(container.querySelector('form') as HTMLFormElement);
      act(() => {
        jest.runOnlyPendingTimers();
      });
      expect(rows(container)).toEqual([]);
    });

    it('keeps the list when the reset is cancelled', () => {
      jest.useFakeTimers();
      const { container } = render(
        <form onReset={e => e.preventDefault()}>
          <Dropzone />
        </form>
      );
      drop(inputOf(container), [pdf()]);
      fireEvent.reset(container.querySelector('form') as HTMLFormElement);
      act(() => {
        jest.runOnlyPendingTimers();
      });
      expect(rows(container)).toHaveLength(1);
    });

    it('stops listening once unmounted', () => {
      jest.useFakeTimers();
      const onFilesChange = jest.fn();
      const form = document.createElement('form');
      document.body.appendChild(form);
      const { container, unmount } = render(
        <Dropzone onFilesChange={onFilesChange} />,
        { container: form }
      );
      drop(inputOf(container), [pdf()]);
      onFilesChange.mockClear();
      fireEvent.reset(form);
      unmount();
      act(() => {
        jest.runOnlyPendingTimers();
      });
      fireEvent.reset(form);
      act(() => {
        jest.runOnlyPendingTimers();
      });
      expect(onFilesChange).not.toHaveBeenCalled();
      form.remove();
    });
  });

  describe('a drop outside the zone', () => {
    const dragOutside = (
      target: EventTarget,
      type: 'dragOver' | 'drop',
      types = ['Files']
    ) => {
      const event = createEvent[type](target as Element, {
        dataTransfer: { types },
      });
      fireEvent(target as Element, event);
      return event as DragEvent;
    };

    it('is cancelled, with no drop shown, while a Dropzone is on the page', () => {
      render(<Dropzone />);
      const outside = document.createElement('div');
      document.body.appendChild(outside);
      const over = dragOutside(outside, 'dragOver');
      expect(over.defaultPrevented).toBe(true);
      expect(over.dataTransfer?.dropEffect).toBe('none');
      const dropped = dragOutside(outside, 'drop');
      expect(dropped.defaultPrevented).toBe(true);
      expect(dropped.dataTransfer?.dropEffect).toBe('none');
      expect(dragOutside(document, 'drop').defaultPrevented).toBe(true);
      outside.remove();
    });

    it('is left to file inputs, editable fields, and drags of other things', () => {
      render(<Dropzone />);
      const host = document.createElement('div');
      host.innerHTML =
        '<input type="file"><input type="file" disabled><textarea></textarea><div contenteditable="true"><b>x</b></div><div contenteditable="false"></div>';
      document.body.appendChild(host);
      const [fileInput, disabledInput] = host.querySelectorAll('input');
      expect(dragOutside(fileInput, 'drop').defaultPrevented).toBe(false);
      expect(dragOutside(disabledInput, 'drop').defaultPrevented).toBe(true);
      expect(
        dragOutside(host.querySelector('textarea')!, 'drop').defaultPrevented
      ).toBe(false);
      expect(
        dragOutside(host.querySelector('b')!, 'drop').defaultPrevented
      ).toBe(false);
      expect(
        dragOutside(host.querySelector('[contenteditable="false"]')!, 'drop')
          .defaultPrevented
      ).toBe(true);
      expect(
        dragOutside(host, 'dragOver', ['text/plain']).defaultPrevented
      ).toBe(false);
      host.remove();
    });

    it('is left to a file input inside a shadow root', () => {
      render(<Dropzone />);
      const host = document.createElement('div');
      document.body.appendChild(host);
      const shadow = host.attachShadow({ mode: 'open' });
      shadow.innerHTML = '<input type="file">';
      const input = shadow.querySelector('input') as HTMLInputElement;
      expect(dragOutside(input, 'drop').defaultPrevented).toBe(false);
      host.remove();
    });

    it('is left alone once something else has handled it', () => {
      const { container } = render(<Dropzone />);
      const input = inputOf(container);
      const over = createEvent.dragOver(input, {
        dataTransfer: dragging(['application/pdf']),
      });
      fireEvent(input, over);
      expect((over as DragEvent).dataTransfer?.dropEffect).toBe('copy');
    });

    it('is not guarded with preventDocumentDrop off, or once unmounted', () => {
      const { unmount } = render(<Dropzone preventDocumentDrop={false} />);
      const outside = document.createElement('div');
      document.body.appendChild(outside);
      expect(dragOutside(outside, 'drop').defaultPrevented).toBe(false);
      unmount();
      const { unmount: unmountGuarded } = render(<Dropzone />);
      unmountGuarded();
      expect(dragOutside(outside, 'drop').defaultPrevented).toBe(false);
      outside.remove();
    });
  });

  // A script can write an uncontrolled Dropzone's input through the ref:
  // `value = ''` is the usual way to clear a file input, and a form library
  // may set `files`. No event reports either, so the list shows the write
  // only from the next change, and that change builds on the input.
  describe('a script writing the input through the ref', () => {
    const setup = (props: DropzoneProps = {}) => {
      const ref = createRef<HTMLInputElement>();
      const onFilesChange = jest.fn();
      const utils = render(
        <Dropzone ref={ref} multiple onFilesChange={onFilesChange} {...props} />
      );
      const input = ref.current as HTMLInputElement;
      drop(input, [pdf('a.pdf'), pdf('b.pdf')]);
      onFilesChange.mockClear();
      return { ...utils, input, onFilesChange };
    };
    const writeFiles = (input: HTMLInputElement, files: File[]) => {
      const transfer = new MockDataTransfer();
      for (const f of files) transfer.items.add(f);
      input.files = transfer.files;
    };

    it('keeps cleared files out of the next drop', () => {
      const { container, input, onFilesChange } = setup();
      input.value = '';
      expect(namesIn(input)).toEqual([]);
      // The list catches up only at the next change.
      expect(rows(container)).toHaveLength(2);
      drop(input, [pdf('c.pdf')]);
      expect(namesIn(input)).toEqual(['c.pdf']);
      expect(rows(container)).toEqual(['c.pdf | 100 bytes | Remove c.pdf']);
      expect(onFilesChange).toHaveBeenCalledWith([
        expect.objectContaining({ name: 'c.pdf' }),
      ]);
    });

    it('keeps cleared files out of the next paste', () => {
      const { input } = setup();
      input.value = '';
      fireEvent.paste(input, { clipboardData: transfer([png()]) });
      expect(namesIn(input)).toEqual(['photo.png']);
    });

    it('keeps cleared files out of the next pick', () => {
      const { input } = setup();
      input.value = '';
      pick(input, [pdf('c.pdf')]);
      expect(namesIn(input)).toEqual(['c.pdf']);
    });

    it('builds the next add on files a script set', () => {
      const { container, input } = setup();
      writeFiles(input, [pdf('x.pdf')]);
      drop(input, [pdf('y.pdf')]);
      expect(namesIn(input)).toEqual(['x.pdf', 'y.pdf']);
      expect(rows(container)).toHaveLength(2);
      writeFiles(input, [pdf('z.pdf')]);
      pick(input, [pdf('w.pdf')]);
      expect(namesIn(input)).toEqual(['z.pdf', 'w.pdf']);
    });

    it('catches the list up when a stale row is removed', () => {
      const { container, input, onFilesChange } = setup();
      input.value = '';
      fireEvent.click(screen.getByRole('button', { name: 'Remove a.pdf' }));
      expect(namesIn(input)).toEqual([]);
      expect(rows(container)).toEqual([]);
      expect(onFilesChange).toHaveBeenCalledWith([]);
    });

    it('counts the room left from the input', () => {
      const { container, input } = setup({ maxFiles: 2 });
      input.value = '';
      fireEvent.dragEnter(input, {
        dataTransfer: dragging(['application/pdf']),
      });
      expect(rootOf(container)).toHaveClass('is-dragover');
      drop(input, [pdf('c.pdf'), pdf('d.pdf')]);
      expect(namesIn(input)).toEqual(['c.pdf', 'd.pdf']);
      expect(refusals(container)).toEqual([]);
    });

    it('builds a pick opened with showPicker() on the list', () => {
      const { input } = setup();
      pickWithoutClick(input, [pdf('c.pdf')]);
      expect(namesIn(input)).toEqual(['a.pdf', 'b.pdf', 'c.pdf']);
    });

    it('forgets the clicked input once something else changes it', () => {
      const { input } = setup();
      // A click whose picker is cancelled, then a drop.
      fireEvent.click(input);
      drop(input, [pdf('c.pdf')]);
      pickWithoutClick(input, [pdf('d.pdf')]);
      expect(namesIn(input)).toEqual(['a.pdf', 'b.pdf', 'c.pdf', 'd.pdf']);
    });

    it('hands a click to your handler too', () => {
      const onClick = jest.fn();
      const { container } = render(<Dropzone onClick={onClick} />);
      fireEvent.click(inputOf(container));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('without a DataTransfer', () => {
    it('still lists the files, leaving the input as the browser set it', () => {
      const saved = globals.DataTransfer;
      delete globals.DataTransfer;
      try {
        const { container } = render(<Dropzone multiple />);
        const input = inputOf(container);
        pick(input, [pdf('a.pdf')]);
        pick(input, [pdf('b.pdf')]);
        expect(rows(container)).toHaveLength(2);
        expect(namesIn(input)).toEqual(['b.pdf']);
      } finally {
        globals.DataTransfer = saved;
      }
    });
  });

  describe('showFileList', () => {
    it('hides the list, and still shows the refusals', () => {
      const { container } = render(
        <Dropzone accept=".pdf" multiple showFileList={false} />
      );
      const input = inputOf(container);
      drop(input, [pdf(), png()]);
      expect(namesIn(input)).toEqual(['report.pdf']);
      expect(container.querySelector('.dropzone-list')).toBeNull();
      expect(refusals(container)).toEqual(['photo.png: only PDF files']);
    });
  });

  describe('disabled', () => {
    it('takes a disabled Fieldset around it', () => {
      const { container } = render(
        <Fieldset disabled>
          <Dropzone files={[pdf()]} onFilesChange={() => {}} />
        </Fieldset>
      );
      expect(container.querySelector('.dropzone')).toHaveClass('is-disabled');
      expect(inputOf(container)).toBeDisabled();
      expect(container.querySelector('.delete')).toBeNull();
    });
  });

  describe('development warnings', () => {
    it('warns once that maxFiles needs multiple', () => {
      render(
        <>
          <Dropzone maxFiles={2} />
          <Dropzone maxFiles={2} />
          <Dropzone multiple maxFiles={2} />
        </>
      );
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0][0]).toContain(
        '<Dropzone maxFiles> takes effect only with multiple'
      );
    });
  });

  describe('class prefix', () => {
    it('prefixes every class it renders', () => {
      const { container } = render(
        <ConfigProvider classPrefix="bestax-">
          <Dropzone
            label="CV"
            accept=".pdf"
            multiple
            color="primary"
            size="small"
            icon={<span />}
            hint="PDF only"
            message="Required"
            messageColor="danger"
          />
        </ConfigProvider>
      );
      const input = inputOf(container);
      drop(input, [pdf(), png()]);
      fireEvent.dragEnter(input, { dataTransfer: dragging(['image/png']) });
      const classes = new Set(
        Array.from(container.querySelectorAll('[class]'), el =>
          Array.from(el.classList)
        ).flat()
      );
      expect([...classes].filter(c => !c.startsWith('bestax-'))).toEqual([]);
      for (const expected of [
        'bestax-dropzone',
        'bestax-is-dragover',
        'bestax-file',
        'bestax-is-boxed',
        'bestax-is-fullwidth',
        'bestax-is-primary',
        'bestax-is-small',
        'bestax-file-label',
        'bestax-file-input',
        'bestax-file-cta',
        'bestax-file-icon',
        'bestax-dropzone-hint',
        'bestax-dropzone-list',
        'bestax-dropzone-item',
        'bestax-dropzone-name',
        'bestax-dropzone-size',
        'bestax-delete',
        'bestax-dropzone-rejections',
        'bestax-help',
        'bestax-is-danger',
      ]) {
        expect(classes).toContain(expected);
      }
    });
  });

  describe('server rendering', () => {
    it('renders the zone on the server and hydrates without a mismatch', () => {
      const element = (
        <Dropzone label="CV" name="cv" hint="PDF up to 5 MB" required />
      );
      const html = renderToString(element);
      expect(html).toContain('class="dropzone"');
      expect(html).toContain('type="file"');
      expect(html).toContain('name="cv"');
      expect(html).toContain('PDF up to 5 MB');
      const host = document.createElement('div');
      host.innerHTML = html;
      document.body.appendChild(host);
      const error = jest.spyOn(console, 'error').mockImplementation(() => {});
      try {
        act(() => {
          hydrateRoot(host, element);
        });
        expect(error).not.toHaveBeenCalled();
      } finally {
        error.mockRestore();
        host.remove();
      }
    });
  });
});
