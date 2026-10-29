import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useReducer,
  useRef,
  useState,
} from 'react';
import {
  classNames,
  usePrefixedClassNames,
  prefixedClassNames,
} from '../helpers/classNames';
import { useBulmaClasses, BulmaClassesProps } from '../helpers/useBulmaClasses';
import { useConfig } from '../helpers/Config';
import { useNumberFormat, NumberFormatter } from '../helpers/localeFormat';
import { StatusRegion } from '../helpers/statusRegion';
import { warnOnce } from '../helpers/devWarnings';
import { Delete } from '../elements/Delete';
import {
  useInsideField,
  useInsideControl,
  rendersOwnField,
  useFieldsetDisabled,
} from './FormContext';
import { Field } from './Field';
import { FormFieldProps } from './fieldProps';
import { useAutoLabelId } from './useAutoLabelId';

/** Why a Dropzone refused a file. */
export type DropzoneRejectionCode =
  'file-invalid-type' | 'file-too-large' | 'too-many-files';

/** A file a Dropzone refused, and why. */
export interface DropzoneRejection {
  /** The file. */
  file: File;
  /**
   * Why it was refused: `file-invalid-type` when `accept` doesn't take it, or
   * it's a folder; `file-too-large` when it's over `maxSize`; `too-many-files`
   * when the list is full.
   */
  code: DropzoneRejectionCode;
}

/**
 * Props for the Dropzone component.
 *
 * @helperProps Helper props go on the `.dropzone` root `<div>`, with
 * `className`. The other attributes go on the `<input>`.
 * @extraProp {string} [accept] - File types it takes, as the native attribute writes them (`.pdf`, `image/*`, `application/pdf`). The picker offers them, and Dropzone checks every pick, drop and paste against them by the same rules, since browsers don't check a dropped file. It goes by a file's name and type, not its contents.
 * @extraProp {boolean} [multiple=false] - Takes several files, and each pick, drop or paste adds to the list. Without it, a new file replaces the one chosen.
 * @extraProp {string} [name] - The files' name in the form's data. The input holds the chosen files, so a plain form submit, `FormData` and React 19 actions all carry them.
 * @extraProp {boolean} [required=false] - The browser's own check: a form won't submit with no file chosen.
 * @extraProp {boolean} [disabled=false] - Disables the input, hides the remove buttons and takes no drops. A disabled `Fieldset` around it does the same.
 * @extraProp {(event: React.ChangeEvent<HTMLInputElement>) => void} [onChange] - Called on the input's `change`, after each pick, drop, paste or removal that changes the files, with `event.target.files` holding the new list.
 * @extraProp {React.Ref<HTMLInputElement>} [ref] - Forwarded to the `<input>`, so `ref.current.showPicker()` opens the picker from a button of your own.
 */
export interface DropzoneProps
  extends
    Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'size' | 'color' | 'type' | 'children' | 'value' | 'defaultValue'
    >,
    Omit<BulmaClassesProps, 'color'>,
    FormFieldProps {
  /** Field label, rendered above the zone. It names the input along with the zone's own text, through `htmlFor` (your `id` when you pass one). Inside an outer `Field` it's dropped, and that `Field`'s label names the input. */
  label?: React.ReactNode;
  /** Props for the label element. An explicit `htmlFor` here overrides the automatic association (no id is generated then). */
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement> & {
    [key: string]: unknown;
  };
  /** Bulma color modifier for the zone, as `File` takes it. */
  color?:
    | 'primary'
    | 'link'
    | 'info'
    | 'success'
    | 'warning'
    | 'danger'
    | 'black'
    | 'dark'
    | 'light'
    | 'white';
  /** Size modifier for the zone. */
  size?: 'small' | 'medium' | 'large';
  /**
   * The zone's text. It's the input's accessible name, so keep it short, and
   * put details such as "PDF up to 5 MB" in `hint`. Default: "Choose or drop
   * a file", or "Choose or drop files" with `multiple`.
   */
  buttonLabel?: React.ReactNode;
  /**
   * An icon above the zone's text. It sits inside the `<label>` that names
   * the input, so leave an `Icon` here unnamed (`<Icon name="upload" />`).
   */
  icon?: React.ReactNode;
  /**
   * A line under the zone that describes the input through
   * `aria-describedby`, such as "PDF up to 5 MB".
   */
  hint?: React.ReactNode;
  /** The largest file it takes, in bytes. A bigger one is refused with `file-too-large`. */
  maxSize?: number;
  /**
   * With `multiple`, how many files the list holds at most. A drop that would
   * go over adds files up to the limit and refuses the rest with
   * `too-many-files`.
   */
  maxFiles?: number;
  /**
   * The chosen files, to control the list. The input and the list follow it,
   * and a change you don't take through `onFilesChange` is undone.
   */
  files?: File[];
  /** Called with the whole list of chosen files each time it changes. */
  onFilesChange?: (files: File[]) => void;
  /** Called with the files a pick, drop or paste refused, and why. */
  onReject?: (rejections: DropzoneRejection[]) => void;
  /**
   * Shows the chosen files under the zone, each with its size and a remove
   * button. Turn it off to show them your own way from `onFilesChange`. The
   * refusals still show.
   */
  showFileList?: boolean;
  /** Takes files pasted while the input has focus, through the same checks as a drop. */
  allowPaste?: boolean;
  /**
   * While it's on the page, stops the browser opening a file dropped outside
   * any drop target, which would leave the page. Drops on other file inputs
   * and on editable fields are left alone.
   */
  preventDocumentDrop?: boolean;
  /** Names a file's remove button, for localization. Default: `` `Remove ${file.name}` ``. */
  removeLabel?: (file: File) => string;
  /**
   * The text shown and announced for a refused file, for localization.
   * Default: the file's name and the reason, such as "photo.png: only PDF
   * files".
   */
  rejectionMessage?: (rejection: DropzoneRejection) => string;
  /**
   * What's announced when files are added, for localization. Default: the
   * file's name and "added", or a count ("2 files added").
   */
  addedMessage?: (files: File[]) => string;
  /** What's announced when a file is removed, for localization. Default: `` `${file.name} removed` ``. */
  removedMessage?: (file: File) => string;
  /**
   * Help or validation message under the Dropzone. It describes the input
   * through `aria-describedby`, after the hint and any refusals.
   */
  message?: React.ReactNode;
  /** Additional CSS classes for the root. */
  className?: string;
}

/** A file on its way in, and whether it's really a folder. */
interface Incoming {
  file: File;
  folder: boolean;
}

/** A refusal, with whether the file was a folder, which the default message says. */
interface Refusal extends DropzoneRejection {
  folder: boolean;
}

/** Something the status region says, with an id that's new each time. */
interface Announcement {
  id: string;
  text: string;
}

const noFiles: File[] = [];
const noRefusals: Refusal[] = [];
const noAnnouncements: Announcement[] = [];

const describeAnnouncement = (announcement: Announcement) => announcement.text;

/**
 * The tokens of an `accept` attribute that HTML recognizes, lowercased: an
 * extension (`.pdf`), a wildcard (`image/*`) or a MIME type. Others are
 * ignored, as browsers ignore them.
 */
const acceptTokens = (accept: string | undefined): string[] =>
  (accept ?? '')
    .split(',')
    .map(token => token.trim().toLowerCase())
    .filter(
      token => token.length > 1 && (token[0] === '.' || token.includes('/'))
    );

/** Whether `accept`'s tokens take a file with this name and type. */
const accepts = (tokens: string[], name: string, type: string): boolean => {
  if (tokens.length === 0) return true;
  const lowerName = name.toLowerCase();
  const lowerType = type.toLowerCase();
  return tokens.some(token =>
    token[0] === '.'
      ? lowerName.endsWith(token)
      : token.endsWith('/*')
        ? lowerType.startsWith(token.slice(0, -1))
        : lowerType === token
  );
};

/** Whether a drag or a clipboard carries files. */
const carriesFiles = (data: DataTransfer | null): data is DataTransfer =>
  !!data && Array.from(data.types ?? []).includes('Files');

/** The files a drop or a paste brings, with folders marked. */
const incomingFrom = (data: DataTransfer | null): Incoming[] => {
  if (!data) return [];
  const items = Array.from(data.items ?? []).filter(
    item => item.kind === 'file'
  );
  if (items.length === 0) {
    return Array.from(data.files ?? [], file => ({ file, folder: false }));
  }
  const incoming: Incoming[] = [];
  for (const item of items) {
    const file = item.getAsFile();
    if (!file) continue;
    const entry = item.webkitGetAsEntry?.();
    incoming.push({ file, folder: !!entry?.isDirectory });
  }
  return incoming;
};

/** The same file: one object, or one picked again with the same details. */
const sameFile = (a: File, b: File): boolean =>
  a === b ||
  (a.name === b.name && a.size === b.size && a.lastModified === b.lastModified);

/** Whether two lists hold the same files in the same order. */
const sameFiles = (
  a: ArrayLike<File> | null | undefined,
  b: readonly File[]
): boolean =>
  !!a && a.length === b.length && b.every((file, i) => sameFile(a[i], file));

/**
 * Writes files to a file input, through a `DataTransfer`, the one way script
 * can build a `FileList`. Where there's no `DataTransfer` the input is left as
 * it is.
 */
const writeFiles = (input: HTMLInputElement, files: readonly File[]) => {
  if (typeof DataTransfer !== 'function') return;
  const transfer = new DataTransfer();
  for (const file of files) transfer.items.add(file);
  input.files = transfer.files;
};

/** The units a file size is written in, largest first. */
const sizeUnits = [
  ['gigabyte', 1e9, 'GB'],
  ['megabyte', 1e6, 'MB'],
  ['kilobyte', 1e3, 'kB'],
] as const;

/**
 * A file size for display, in decimal units ("1.2 MB"), in the locale of a
 * `LocaleProvider` around it, or as English writes it outside one.
 */
const formatFileSize = (
  bytes: number,
  formatNumber: NumberFormatter | null
): string => {
  for (const [unit, factor, symbol] of sizeUnits) {
    if (bytes >= factor) {
      const value = bytes / factor;
      return formatNumber
        ? formatNumber(value, {
            style: 'unit',
            unit,
            unitDisplay: 'short',
            maximumFractionDigits: 1,
          })
        : `${Math.round(value * 10) / 10} ${symbol}`;
    }
  }
  return formatNumber
    ? formatNumber(bytes, { style: 'unit', unit: 'byte', unitDisplay: 'long' })
    : `${bytes} ${bytes === 1 ? 'byte' : 'bytes'}`;
};

/** A word for each kind of file `accept` names: "PDF", "image". */
const typeNames = (tokens: string[]): string[] => {
  const names: string[] = [];
  for (const token of tokens) {
    let name = token;
    if (token[0] === '.') {
      name = token.slice(1).toUpperCase();
    } else {
      const [type, subtype] = token.split('/');
      const core = subtype.split('+')[0];
      if (subtype === '*') name = type;
      else if (core === 'plain') name = 'text';
      else if (/^[a-z0-9]+$/.test(core)) name = core.toUpperCase();
    }
    if (!names.includes(name)) names.push(name);
  }
  return names;
};

/** "A", "A or B", "A, B, or C". */
const orList = (items: string[]): string =>
  items.length <= 2
    ? items.join(' or ')
    : `${items.slice(0, -1).join(', ')}, or ${items[items.length - 1]}`;

/**
 * The `Dropzone` component is an area to drop files on or click to pick
 * them, which checks each file and lists the chosen ones with a way to remove
 * each.
 *
 * It's Bulma's boxed, full-width file widget with the real
 * `<input type="file">` lying over it, so the input is the one tab stop, the
 * click target and the drop target, and Enter and Space open the picker. The
 * input holds the chosen files: a pick, drop or paste that passes the checks
 * is written to it, so a form submits the files under `name`. It doesn't
 * upload anything.
 *
 * @function
 * @param {DropzoneProps} props - Props for the Dropzone component.
 * @returns {JSX.Element} The rendered dropzone.
 *
 * @example
 * <Dropzone
 *   label="CV"
 *   name="cv"
 *   accept=".pdf,application/pdf"
 *   maxSize={5_000_000}
 *   hint="PDF up to 5 MB"
 * />
 */
export const Dropzone = forwardRef<HTMLInputElement, DropzoneProps>(
  (
    {
      // Field props
      label,
      labelSize,
      labelProps,
      horizontal,
      message,
      messageColor,
      fieldClassName,
      color,
      size,
      buttonLabel,
      icon,
      hint,
      maxSize,
      maxFiles,
      files: filesProp,
      onFilesChange,
      onReject,
      showFileList = true,
      allowPaste = true,
      preventDocumentDrop = true,
      removeLabel,
      rejectionMessage,
      addedMessage,
      removedMessage,
      className,
      accept,
      multiple,
      disabled: disabledProp,
      onChange,
      onDragEnter,
      onDragOver,
      onDragLeave,
      onDrop,
      onPaste,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const disabled = useFieldsetDisabled(disabledProp);
    const controlled = filesProp !== undefined;
    const [ownFiles, setOwnFiles] = useState<File[]>(noFiles);
    const files = filesProp ?? ownFiles;
    // A render the controlled list needs after a change, so that one the app
    // didn't take is undone.
    const [, rerender] = useReducer((n: number) => n + 1, 0);
    const [refusals, setRefusals] = useState<Refusal[]>(noRefusals);
    const [drag, setDrag] = useState<'over' | 'reject' | null>(null);
    const [announcements, setAnnouncements] =
      useState<Announcement[]>(noAnnouncements);

    const inputRef = useRef<HTMLInputElement | null>(null);
    const listRef = useRef<HTMLUListElement>(null);
    // Set while Dropzone dispatches the input's own events, so its change
    // handler hands them on rather than reading them as a pick.
    const dispatchingRef = useRef(false);
    // The row a removal emptied, whose neighbour takes focus.
    const removedRowRef = useRef<number | null>(null);
    const announcedRef = useRef(0);

    const setInputRef = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current =
            node;
        }
      },
      [ref]
    );

    const formatNumber = useNumberFormat();
    const tokens = acceptTokens(accept);
    const sizeText = (bytes: number) => formatFileSize(bytes, formatNumber);
    const countText = (count: number) =>
      formatNumber ? formatNumber(count) : String(count);

    const messageFor = (refusal: Refusal): string => {
      const { file, code } = refusal;
      if (rejectionMessage) return rejectionMessage({ file, code });
      if (code === 'file-too-large') {
        return `${file.name}: larger than ${sizeText(maxSize as number)}`;
      }
      if (code === 'too-many-files') {
        const most = multiple ? (maxFiles as number) : 1;
        return `${file.name}: only ${most === 1 ? 'one file' : `${countText(most)} files`}`;
      }
      return refusal.folder
        ? `${file.name}: folders can't be added`
        : `${file.name}: only ${orList(typeNames(tokens))} files`;
    };

    const announce = (texts: string[]) => {
      if (texts.length === 0) return;
      const batch = ++announcedRef.current;
      setAnnouncements(texts.map((text, i) => ({ id: `${batch}-${i}`, text })));
    };

    /**
     * Makes `next` the chosen files: writes them to the input, and when they
     * differ from the list, dispatches the input's `input` and `change` and
     * reports the new list.
     */
    const commit = (next: File[]) => {
      const input = inputRef.current as HTMLInputElement;
      if (!sameFiles(input.files, next)) writeFiles(input, next);
      if (sameFiles(files, next)) return;
      if (controlled) rerender();
      else setOwnFiles(next);
      onFilesChange?.(next);
      dispatchingRef.current = true;
      try {
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      } finally {
        dispatchingRef.current = false;
      }
    };

    /** Checks the files a pick, drop or paste brings, and takes those that pass. */
    const take = (incoming: Incoming[]) => {
      const kept = multiple ? files : noFiles;
      const room = multiple ? (maxFiles ?? Infinity) - kept.length : 1;
      const added: File[] = [];
      const refused: Refusal[] = [];
      for (const { file, folder } of incoming) {
        const code: DropzoneRejectionCode | null =
          folder || !accepts(tokens, file.name, file.type)
            ? 'file-invalid-type'
            : maxSize !== undefined && file.size > maxSize
              ? 'file-too-large'
              : null;
        if (code) {
          refused.push({ file, code, folder });
        } else if (
          multiple &&
          [...kept, ...added].some(f => sameFile(f, file))
        ) {
          // Already in the list: nothing to add, and nothing wrong.
        } else if (added.length >= room) {
          refused.push({ file, code: 'too-many-files', folder });
        } else {
          added.push(file);
        }
      }
      setRefusals(refused.length > 0 ? refused : noRefusals);
      if (refused.length > 0) {
        onReject?.(refused.map(({ file, code }) => ({ file, code })));
      }
      commit(added.length > 0 ? [...kept, ...added] : files);
      const addedText =
        added.length === 0
          ? []
          : [
              addedMessage
                ? addedMessage(added)
                : added.length === 1
                  ? `${added[0].name} added`
                  : `${countText(added.length)} files added`,
            ];
      announce([...addedText, ...refused.map(messageFor)]);
    };

    const remove = (index: number) => {
      const file = files[index];
      removedRowRef.current = index;
      commit(files.filter((_, i) => i !== index));
      announce([
        removedMessage ? removedMessage(file) : `${file.name} removed`,
      ]);
    };

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (dispatchingRef.current) {
        onChange?.(event);
        return;
      }
      // A pick: the browser has put the picked files in the input. With
      // none (a cancelled pick, in a browser that clears it), the list stays.
      const picked = Array.from(event.target.files ?? []);
      if (picked.length === 0) commit(files);
      else take(picked.map(file => ({ file, folder: false })));
    };

    // While files are dragged over the input it's cancelled, which makes the
    // input the drop target and keeps the browser's own drop from running.
    // Disabled, it refuses the drop, so the browser doesn't open the file.
    const handleDragOver = (event: React.DragEvent<HTMLInputElement>) => {
      (event.type === 'dragenter' ? onDragEnter : onDragOver)?.(event);
      if (!carriesFiles(event.dataTransfer)) return;
      event.preventDefault();
      if (disabled) {
        event.dataTransfer.dropEffect = 'none';
        return;
      }
      event.dataTransfer.dropEffect = 'copy';
      // Only the dragged files' types can be read, so a file is known to be
      // refused only when `accept` names no extension and its type is known.
      const room = multiple ? (maxFiles ?? Infinity) - files.length : 1;
      const types = Array.from(event.dataTransfer.items ?? [])
        .filter(item => item.kind === 'file')
        .map(item => item.type);
      const refused =
        room <= 0 ||
        (types.length > 0 &&
          tokens.length > 0 &&
          !tokens.some(token => token[0] === '.') &&
          types.every(type => type !== '' && !accepts(tokens, '', type)));
      setDrag(refused ? 'reject' : 'over');
    };

    const handleDragLeave = (event: React.DragEvent<HTMLInputElement>) => {
      onDragLeave?.(event);
      setDrag(null);
    };

    const handleDrop = (event: React.DragEvent<HTMLInputElement>) => {
      onDrop?.(event);
      setDrag(null);
      if (!carriesFiles(event.dataTransfer)) return;
      event.preventDefault();
      if (!disabled) take(incomingFrom(event.dataTransfer));
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
      onPaste?.(event);
      if (!allowPaste || disabled) return;
      const incoming = incomingFrom(event.clipboardData);
      if (incoming.length === 0) return;
      event.preventDefault();
      take(incoming);
    };

    // A controlled list: the input follows `files`, and a change the app
    // didn't take is undone.
    useEffect(() => {
      const input = inputRef.current;
      if (controlled && input && !sameFiles(input.files, files)) {
        writeFiles(input, files);
      }
    });

    // After a removal, focus goes to the remove button that took the removed
    // one's place, else the one before, else the input.
    useEffect(() => {
      const row = removedRowRef.current;
      if (row === null) return;
      removedRowRef.current = null;
      const buttons = listRef.current?.querySelectorAll('button') ?? [];
      const next = buttons[Math.min(row, buttons.length - 1)];
      (next ?? inputRef.current)?.focus();
    });

    // A reset of the input's form empties the input, so the list and the
    // refusals go too. The reset event fires before the form resets, and a
    // listener after this one can still cancel it, so the list is cleared a
    // task later, and only if the reset went ahead.
    const latestRef = useRef({ files, controlled, onFilesChange });
    useEffect(() => {
      latestRef.current = { files, controlled, onFilesChange };
    });
    const formAttribute = props.form;
    useEffect(() => {
      const form = inputRef.current?.form;
      if (!form) return undefined;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const onReset = (event: Event) => {
        timer = setTimeout(() => {
          if (event.defaultPrevented) return;
          const latest = latestRef.current;
          setRefusals(noRefusals);
          if (latest.files.length === 0) return;
          if (latest.controlled) rerender();
          else setOwnFiles(noFiles);
          latest.onFilesChange?.(noFiles);
        });
      };
      form.addEventListener('reset', onReset);
      return () => {
        form.removeEventListener('reset', onReset);
        clearTimeout(timer);
      };
    }, [formAttribute]);

    // A file dropped just outside the zone would open in the tab. The guard
    // cancels a file drag anywhere nothing else takes it, leaving alone
    // enabled file inputs and editable fields, which take drops of their own,
    // and drops something else already handled. It reads the event's real
    // target, so a file input inside a shadow root is left alone too.
    useEffect(() => {
      if (!preventDocumentDrop) return undefined;
      const guard = (event: DragEvent) => {
        if (event.defaultPrevented || !carriesFiles(event.dataTransfer)) {
          return;
        }
        const target = event.composedPath()[0];
        if (
          target instanceof Element &&
          target.closest(
            'input[type="file"]:not(:disabled), textarea, [contenteditable]:not([contenteditable="false"])'
          )
        ) {
          return;
        }
        event.preventDefault();
        if (event.type === 'dragover') event.dataTransfer.dropEffect = 'none';
      };
      document.addEventListener('dragover', guard);
      document.addEventListener('drop', guard);
      return () => {
        document.removeEventListener('dragover', guard);
        document.removeEventListener('drop', guard);
      };
    }, [preventDocumentDrop]);

    const warnsMaxFiles = maxFiles !== undefined && !multiple;
    useEffect(() => {
      if (warnsMaxFiles) {
        warnOnce(
          'Dropzone:maxFiles-without-multiple',
          '[bestax-bulma] <Dropzone maxFiles> takes effect only with ' +
            'multiple. Without it, each new file replaces the one chosen.'
        );
      }
    }, [warnsMaxFiles]);

    const insideField = useInsideField();
    const insideControl = useInsideControl();
    const ownField = rendersOwnField('Dropzone', {
      insideField,
      insideControl,
      label,
      message,
      horizontal,
      fieldClassName,
    });
    const { controlId, fieldLabelProps } = useAutoLabelId({
      label,
      id: props.id,
      labelProps,
      rendersLabel: ownField,
    });
    const { classPrefix } = useConfig();
    const pcn = (...args: Parameters<typeof classNames>) =>
      prefixedClassNames(classPrefix, ...args);
    // The input takes `controlId`, so `id` stays out of the spread, where an
    // undefined `id` key would wipe the id the label points at.
    const { id: _id, ...inputProps } = props;
    const { bulmaHelperClasses, rest } = useBulmaClasses(inputProps);

    const baseId = useId();
    const hintId = `${baseId}-hint`;
    const refusalsId = `${baseId}-refusals`;
    const messageId = `${baseId}-message`;
    const describedBy =
      [
        ariaDescribedBy,
        hint ? hintId : undefined,
        refusals.length > 0 ? refusalsId : undefined,
        message ? messageId : undefined,
      ]
        .filter(Boolean)
        .join(' ') || undefined;

    const rootClass = usePrefixedClassNames('dropzone', {
      'is-dragover': drag === 'over',
      'is-drag-reject': drag === 'reject',
      'is-disabled': disabled,
    });
    const zoneClass = usePrefixedClassNames(
      'file',
      'is-boxed',
      'is-fullwidth',
      {
        [`is-${color}`]: !!color,
        [`is-${size}`]: !!size,
      }
    );
    const helpClass = usePrefixedClassNames('help', {
      [`is-${messageColor}`]: !!messageColor,
    });

    // Each row's key, from the file's details, which the list keeps unique.
    const seen = new Map<string, number>();
    const keyOf = (file: File) => {
      const key = `${file.name}:${file.size}:${file.lastModified}`;
      const count = seen.get(key) ?? 0;
      seen.set(key, count + 1);
      return count === 0 ? key : `${key}:${count}`;
    };

    const dropzoneElement = (
      <div className={classNames(rootClass, bulmaHelperClasses, className)}>
        <div className={zoneClass}>
          <label className={pcn('file-label')}>
            <input
              {...rest}
              ref={setInputRef}
              className={pcn('file-input')}
              type="file"
              id={controlId}
              accept={accept}
              multiple={multiple}
              disabled={disabled}
              aria-describedby={describedBy}
              onChange={handleChange}
              onDragEnter={handleDragOver}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onPaste={handlePaste}
            />
            <span className={pcn('file-cta')}>
              {icon && <span className={pcn('file-icon')}>{icon}</span>}
              <span className={pcn('file-label')}>
                {buttonLabel ||
                  (multiple ? 'Choose or drop files' : 'Choose or drop a file')}
              </span>
            </span>
          </label>
        </div>
        {hint && (
          <p id={hintId} className={pcn('help', 'dropzone-hint')}>
            {hint}
          </p>
        )}
        {showFileList && files.length > 0 && (
          <ul ref={listRef} className={pcn('dropzone-list')}>
            {files.map((file, index) => (
              <li key={keyOf(file)} className={pcn('dropzone-item')}>
                <span className={pcn('dropzone-name')}>{file.name}</span>
                <span className={pcn('dropzone-size')}>
                  {sizeText(file.size)}
                </span>
                {!disabled && (
                  <Delete
                    size="small"
                    ariaLabel={
                      removeLabel ? removeLabel(file) : `Remove ${file.name}`
                    }
                    onClick={() => remove(index)}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
        {refusals.length > 0 && (
          <div id={refusalsId} className={pcn('dropzone-rejections')}>
            {refusals.map((refusal, index) => (
              <p key={index} className={pcn('help', 'is-danger')}>
                {messageFor(refusal)}
              </p>
            ))}
          </div>
        )}
        <StatusRegion items={announcements} describe={describeAnnouncement} />
      </div>
    );

    const messageEl = message ? (
      <p id={messageId} className={helpClass}>
        {message}
      </p>
    ) : null;

    if (ownField) {
      return (
        <Field
          label={label}
          labelSize={labelSize}
          labelProps={fieldLabelProps}
          horizontal={horizontal}
          className={fieldClassName}
        >
          {dropzoneElement}
          {messageEl}
        </Field>
      );
    }

    return (
      <>
        {dropzoneElement}
        {messageEl}
      </>
    );
  }
);

Dropzone.displayName = 'Dropzone';

export default Dropzone;
