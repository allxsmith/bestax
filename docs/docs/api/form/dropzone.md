---
title: Dropzone
sidebar_label: Dropzone
description: The `Dropzone` component is an area to drop files on or click to pick them, which checks each file and lists the chosen ones with a way to remove each.
---

# Dropzone

## Overview

<!-- bestax:generated overview -->

The `Dropzone` component is an area to drop files on or click to pick them, which checks each file and lists the chosen ones with a way to remove each.

<!-- /bestax:generated overview -->

It's Bulma's boxed, full-width file widget with the real `<input type="file">` lying over it, so
there's nothing to wire: the input is the one tab stop, Enter and Space open the picker, and a
click anywhere on the zone does too. Each file picked, dropped or pasted is checked against
`accept`, `maxSize`, `maxFiles` and `multiple`, and the ones that pass are written to the input,
so a form submits them under `name` like any file input's. Under the zone it lists the chosen
files with their sizes and a remove button each, says which files it refused and why, and
announces both to screen readers.

It hands you files and stops there: it doesn't upload anything. The
[Uploading](#uploading) recipe below sends them with `fetch`.

:::info
Bulma has no drop zone, so `Dropzone` brings its own styles, in `bestax.css` and its variants, or
in `extras.css` next to your own Bulma. Those styles also lift the input above the zone's text,
which is what lets a drop land on it.
:::

---

## Import

<!-- bestax:generated import -->

```tsx
import { Dropzone } from '@allxsmith/bestax-bulma';
```

<!-- /bestax:generated import -->

---

## Usage

### Basic Usage

With `multiple`, every pick or drop adds to the list, and each file can be removed on its own. A
file already in the list is skipped rather than added twice. Drop a few files on the zone, or
click it to pick some.

```tsx live
<Dropzone
  label="Attachments"
  name="attachments"
  multiple
  icon={<Icon name="upload" />}
  hint="Any files, as many as you like"
/>
```

### One File of One Type

Without `multiple` a new file replaces the one chosen, as a plain file input does. `accept` takes
the native attribute's syntax: an extension (`.pdf`), a wildcard (`image/*`) or a MIME type
(`application/pdf`). Browsers offer those types in the picker but don't check a dropped file, so
Dropzone checks every pick, drop and paste itself. Keep the zone's text short, since it names the
input, and put the details in `hint`, which describes it.

```tsx live
<Dropzone
  label="CV"
  name="cv"
  accept=".pdf,application/pdf"
  maxSize={5_000_000}
  hint="PDF up to 5 MB"
  required
/>
```

### Several Files, Up to a Limit

`maxFiles` caps the list. A drop that would go over adds files up to the limit and refuses the
rest, rather than refusing the whole drop.

```tsx live
<Dropzone
  label="Photos"
  name="photos"
  multiple
  maxFiles={5}
  accept="image/*"
  icon={<Icon name="images" />}
  buttonLabel="Choose or drop photos"
  hint="Up to 5 images"
/>
```

### In a Form

The input holds the chosen files, so a plain form submit, `FormData` and React 19 form actions all
carry them, `required` stops a submit with none, and a reset of the form clears the list. Nothing
here is wired by hand.

```tsx live
function ApplicationForm() {
  const [sent, setSent] = useState('');
  return (
    <form
      onSubmit={event => {
        event.preventDefault();
        const names = new FormData(event.currentTarget)
          .getAll('documents')
          .map(entry => (typeof entry === 'string' ? entry : entry.name));
        setSent(names.join(', '));
      }}
    >
      <Dropzone
        label="Documents"
        name="documents"
        multiple
        required
        hint="Required"
      />
      <Buttons>
        <Button type="submit" color="primary">
          Send
        </Button>
        <Button type="reset">Reset</Button>
      </Buttons>
      {sent && <p>Sent: {sent}</p>}
    </form>
  );
}
```

### Controlled

`onFilesChange` gets the whole list each time it changes, and `files` controls it. The input and
the list follow `files`, so setting it from outside, as the button here does, empties both, and a
change you don't take is undone.

```tsx live
function ControlledDropzone() {
  const [files, setFiles] = useState<Array<globalThis.File>>([]);
  return (
    <>
      <Dropzone
        label="Documents"
        multiple
        files={files}
        onFilesChange={setFiles}
      />
      <Buttons>
        <Button onClick={() => setFiles([])} disabled={files.length === 0}>
          Clear {files.length} files
        </Button>
      </Buttons>
    </>
  );
}
```

### Refusals

Each refused file shows as a line in Bulma's danger help style, and `onReject` gets them as
`{ file, code }`:

| `code`              | When                                                              |
| ------------------- | ----------------------------------------------------------------- |
| `file-invalid-type` | `accept` doesn't take it by its name or type, or it's a folder    |
| `file-too-large`    | It's bigger than `maxSize`                                        |
| `too-many-files`    | The list is full: one file without `multiple`, `maxFiles` with it |

The lines go away at the next pick or drop. `rejectionMessage` rewrites them, for another
language or your own wording.

```tsx live
<Dropzone
  label="Spreadsheet"
  accept=".csv,text/csv"
  maxSize={1_000_000}
  hint="One CSV up to 1 MB"
  rejectionMessage={({ file, code }) =>
    code === 'file-too-large'
      ? `${file.name} is over 1 MB. Try splitting it.`
      : code === 'file-invalid-type'
        ? `${file.name} isn't a CSV.`
        : `${file.name}: one file at a time.`
  }
  onReject={rejections => console.log(rejections)}
/>
```

### Your Own List

`showFileList={false}` leaves the list to you, with the files from `onFilesChange`. The refusals
still show under the zone. This one shows image previews, which need an object URL for each file
and its release when the file goes.

```tsx live
function PhotoPreviews() {
  const [files, setFiles] = useState<Array<globalThis.File>>([]);
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    const made = files.map(file => URL.createObjectURL(file));
    setUrls(made);
    return () => made.forEach(url => URL.revokeObjectURL(url));
  }, [files]);
  return (
    <>
      <Dropzone
        label="Photos"
        multiple
        accept="image/*"
        showFileList={false}
        files={files}
        onFilesChange={setFiles}
      />
      <Columns isMultiline isMobile>
        {urls.map((url, index) => (
          <Column key={url} size="one-quarter">
            <Image src={url} alt={files[index]?.name ?? ''} size="square" />
          </Column>
        ))}
      </Columns>
    </>
  );
}
```

### Uploading

Dropzone doesn't upload. Send the files from the form's submit, or from `onFilesChange` to send
each as it arrives, and show the progress with [`Progress`](../elements/progress.md). This sketch
posts the form's files with `fetch` to an endpoint of your own.

```tsx
function UploadForm() {
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async event => {
        event.preventDefault();
        setBusy(true);
        try {
          await fetch('/api/upload', {
            method: 'POST',
            body: new FormData(event.currentTarget),
          });
        } finally {
          setBusy(false);
        }
      }}
    >
      <Dropzone label="Attachments" name="attachments" multiple required />
      {busy && <Progress color="primary" aria-label="Uploading" />}
      <Button type="submit" color="primary" isLoading={busy}>
        Upload
      </Button>
    </form>
  );
}
```

### Opening the Picker From a Button

The `ref` is the input's, so `showPicker()` opens the picker from a button of your own, such as
one in a toolbar.

```tsx live
function BrowseButton() {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <>
      <Dropzone ref={ref} label="Attachments" multiple />
      <Button onClick={() => ref.current?.showPicker()}>Browse…</Button>
    </>
  );
}
```

### Colors and Sizes

The zone takes `File`'s colors and sizes.

```tsx live
<Columns isMultiline>
  <Column size="half">
    <Dropzone label="Primary" color="primary" icon={<Icon name="upload" />} />
  </Column>
  <Column size="half">
    <Dropzone label="Small and info" color="info" size="small" />
  </Column>
</Columns>
```

### In Another Language

`buttonLabel`, `removeLabel`, `rejectionMessage`, `addedMessage` and `removedMessage` take your
own words. Inside a [`LocaleProvider`](../helpers/localeprovider.md) the file sizes and counts are
written in its locale, and the list follows its direction.

```tsx live
<LocaleProvider locale="de">
  <Dropzone
    label="Anhänge"
    multiple
    buttonLabel="Dateien wählen oder ablegen"
    hint="Beliebige Dateien"
    removeLabel={file => `${file.name} entfernen`}
    addedMessage={files =>
      files.length === 1
        ? `${files[0].name} hinzugefügt`
        : `${files.length} Dateien hinzugefügt`
    }
    removedMessage={file => `${file.name} entfernt`}
    rejectionMessage={({ file }) => `${file.name} wurde nicht hinzugefügt`}
  />
</LocaleProvider>
```

### Disabled

`disabled` disables the input, takes no drops and hides the remove buttons. A disabled
[`Fieldset`](./fieldset.md) around it does the same.

```tsx live
<Dropzone label="Attachments" disabled hint="Uploads are closed" />
```

---

## Accessibility

- **One control:** the native file input, the zone's one tab stop, named by the zone's text and
  by a `label` through `htmlFor`. The browser reports its state itself ("No file chosen", "2
  files"), in its own language.
- **Not drag only:** a click on the zone, or Enter or Space on the input, opens the picker, so
  dropping is never the only way to choose a file (WCAG 2.5.7 and 2.1.1). Dropping needs a pointer
  and a desktop; on phones the picker is the way in.
- **Descriptions:** the input's `aria-describedby` points at the `hint`, at the refusals while
  there are any, and at the Field `message`, after any ids you pass.
- **Announcements:** additions ("report.pdf added", "2 files added"), refusals and removals are
  announced politely through a status region, since a screen reader can't see the list change.
  Nothing is announced while a file is dragged over the zone.
- **The list:** a `<ul>` with a row per file, each with a real remove button named "Remove" and
  the file's name. After a removal, focus moves to the next row's button, the one before, or the
  input.
- **Drag states:** the zone's dashed border turns solid while files are dragged over it, so the
  state shows without color, and in forced colors too. Only the files' types can be read during a
  drag, so the refused look shows only when `accept` names no extension and every type is one it
  refuses; the drop's result is what counts.
- **Forced colors:** the drop target's border takes the system highlight color, and the remove
  buttons keep their circle and cross in the system's button colors, which Bulma's delete button
  otherwise loses there.
- **No ARIA drag attributes:** `aria-dropeffect` and `aria-grabbed` are deprecated, and nothing
  overrides the input's role.

---

## Related Components

- [`File`](./file.md): Bulma's file input, for a single pick shown by its name, with no checks,
  list or announcements.
- [`Field`](./field.md): A label and a message around the zone.
- [`Fieldset`](./fieldset.md): Disables the zone with the rest of a form section.
- [`Progress`](../elements/progress.md): The progress of an upload you send yourself.
- [Helper Props](../helpers/usebulmaclasses.md): Bulma helper props for spacing, color, etc.

---

## Additional Resources

- [Storybook: Dropzone Stories](https://bestax.io/storybook/?path=/story/form-dropzone--default)
- [HTML: the file upload state of the input element](<https://html.spec.whatwg.org/multipage/input.html#file-upload-state-(type=file)>)
- [W3C WAI: Dragging Movements (WCAG 2.5.7)](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)
- [Bulma: File](https://bulma.io/documentation/form/file/)

---

## Props

<!-- bestax:generated props -->

| Prop                  | Type                                                                                                                               | Default | Description                                                                                                                                                                                                                                                                                             |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`               | `React.ReactNode`                                                                                                                  | —       | Field label, rendered above the zone. It names the input along with the zone's own text, through `htmlFor` (your `id` when you pass one). Inside an outer `Field` it's dropped, and that `Field`'s label names the input.                                                                               |
| `labelProps`          | `React.LabelHTMLAttributes<HTMLLabelElement> & { [key: string]: unknown; }`                                                        | —       | Props for the label element. An explicit `htmlFor` here overrides the automatic association (no id is generated then).                                                                                                                                                                                  |
| `color`               | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'dark'` \| `'light'` \| `'white'` | —       | Bulma color modifier for the zone, as `File` takes it.                                                                                                                                                                                                                                                  |
| `size`                | `'small'` \| `'medium'` \| `'large'`                                                                                               | —       | Size modifier for the zone.                                                                                                                                                                                                                                                                             |
| `buttonLabel`         | `React.ReactNode`                                                                                                                  | —       | The zone's text. It's the input's accessible name, so keep it short, and put details such as "PDF up to 5 MB" in `hint`. Default: "Choose or drop a file", or "Choose or drop files" with `multiple`.                                                                                                   |
| `icon`                | `React.ReactNode`                                                                                                                  | —       | An icon above the zone's text. It sits inside the `<label>` that names the input, so leave an `Icon` here unnamed (`<Icon name="upload" />`).                                                                                                                                                           |
| `hint`                | `React.ReactNode`                                                                                                                  | —       | A line under the zone that describes the input through `aria-describedby`, such as "PDF up to 5 MB".                                                                                                                                                                                                    |
| `maxSize`             | `number`                                                                                                                           | —       | The largest file it takes, in bytes. A bigger one is refused with `file-too-large`.                                                                                                                                                                                                                     |
| `maxFiles`            | `number`                                                                                                                           | —       | With `multiple`, how many files the list holds at most. A drop that would go over adds files up to the limit and refuses the rest with `too-many-files`.                                                                                                                                                |
| `files`               | `File[]`                                                                                                                           | —       | The chosen files, to control the list. The input and the list follow it, and a change you don't take through `onFilesChange` is undone.                                                                                                                                                                 |
| `onFilesChange`       | `(files: File[]) => void`                                                                                                          | —       | Called with the whole list of chosen files each time it changes.                                                                                                                                                                                                                                        |
| `onReject`            | `(rejections: DropzoneRejection[]) => void`                                                                                        | —       | Called with the files a pick, drop or paste refused, and why.                                                                                                                                                                                                                                           |
| `showFileList`        | `boolean`                                                                                                                          | `true`  | Shows the chosen files under the zone, each with its size and a remove button. Turn it off to show them your own way from `onFilesChange`. The refusals still show.                                                                                                                                     |
| `allowPaste`          | `boolean`                                                                                                                          | `true`  | Takes files pasted while the input has focus, through the same checks as a drop.                                                                                                                                                                                                                        |
| `preventDocumentDrop` | `boolean`                                                                                                                          | `true`  | While it's on the page, stops the browser opening a file dropped outside any drop target, which would leave the page. Drops on other file inputs and on editable fields are left alone.                                                                                                                 |
| `removeLabel`         | `(file: File) => string`                                                                                                           | —       | Names a file's remove button, for localization. Default: `` `Remove ${file.name}` ``.                                                                                                                                                                                                                   |
| `rejectionMessage`    | `(rejection: DropzoneRejection) => string`                                                                                         | —       | The text shown and announced for a refused file, for localization. Default: the file's name and the reason, such as "photo.png: only PDF files".                                                                                                                                                        |
| `addedMessage`        | `(files: File[]) => string`                                                                                                        | —       | What's announced when files are added, for localization. Default: the file's name and "added", or a count ("2 files added").                                                                                                                                                                            |
| `removedMessage`      | `(file: File) => string`                                                                                                           | —       | What's announced when a file is removed, for localization. Default: `` `${file.name} removed` ``.                                                                                                                                                                                                       |
| `message`             | `React.ReactNode`                                                                                                                  | —       | Help or validation message under the Dropzone. It describes the input through `aria-describedby`, after the hint and any refusals.                                                                                                                                                                      |
| `className`           | `string`                                                                                                                           | —       | Additional CSS classes for the root.                                                                                                                                                                                                                                                                    |
| `labelSize`           | `'small'` \| `'normal'` \| `'medium'` \| `'large'`                                                                                 | —       | Size for the label (used in horizontal layouts).                                                                                                                                                                                                                                                        |
| `horizontal`          | `boolean`                                                                                                                          | `false` | Horizontal field layout.                                                                                                                                                                                                                                                                                |
| `messageColor`        | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'`                                                    | —       | Bulma color for the message.                                                                                                                                                                                                                                                                            |
| `fieldClassName`      | `string`                                                                                                                           | —       | Additional CSS classes for the Field wrapper.                                                                                                                                                                                                                                                           |
| `accept`              | `string`                                                                                                                           | —       | File types it takes, as the native attribute writes them (`.pdf`, `image/*`, `application/pdf`). The picker offers them, and Dropzone checks every pick, drop and paste against them by the same rules, since browsers don't check a dropped file. It goes by a file's name and type, not its contents. |
| `multiple`            | `boolean`                                                                                                                          | `false` | Takes several files, and each pick, drop or paste adds to the list. Without it, a new file replaces the one chosen.                                                                                                                                                                                     |
| `name`                | `string`                                                                                                                           | —       | The files' name in the form's data. The input holds the chosen files, so a plain form submit, `FormData` and React 19 actions all carry them.                                                                                                                                                           |
| `required`            | `boolean`                                                                                                                          | `false` | The browser's own check: a form won't submit with no file chosen.                                                                                                                                                                                                                                       |
| `disabled`            | `boolean`                                                                                                                          | `false` | Disables the input, hides the remove buttons and takes no drops. A disabled `Fieldset` around it does the same.                                                                                                                                                                                         |
| `onChange`            | `(event: React.ChangeEvent<HTMLInputElement>) => void`                                                                             | —       | Called on the input's `change`, after each pick, drop, paste or removal that changes the files, with `event.target.files` holding the new list.                                                                                                                                                         |
| `ref`                 | `React.Ref<HTMLInputElement>`                                                                                                      | —       | Forwarded to the `<input>`, so `ref.current.showPicker()` opens the picker from a button of your own.                                                                                                                                                                                                   |
| `...`                 | All standard `<input>` attributes and Bulma helper props                                                                           | —       | Helper props go on the `.dropzone` root `<div>`, with `className`. The other attributes go on the `<input>`. See [Helper Props](../helpers/usebulmaclasses.md)                                                                                                                                          |

<!-- /bestax:generated props -->

---

## CSS & Sass Variables

<!-- bestax:generated cssvars -->

`Dropzone` registers these variables on its own `.dropzone` element. Override them there (or via `className`) — a value set on an ancestor is only inherited, and loses to the component-level declaration. See [Theme](../helpers/theme.md).

| CSS Variable                             | Sass Variable                     | Default                             |
| ---------------------------------------- | --------------------------------- | ----------------------------------- |
| `--bulma-dropzone-border-style`          | `$dropzone-border-style`          | `dashed`                            |
| `--bulma-dropzone-border-width`          | `$dropzone-border-width`          | `2px`                               |
| `--bulma-dropzone-min-height`            | `$dropzone-min-height`            | `8rem`                              |
| `--bulma-dropzone-dragover-border-color` | `$dropzone-dragover-border-color` | `var(--bulma-primary)`              |
| `--bulma-dropzone-reject-border-color`   | `$dropzone-reject-border-color`   | `var(--bulma-danger)`               |
| `--bulma-dropzone-disabled-opacity`      | `$dropzone-disabled-opacity`      | `0.5`                               |
| `--bulma-dropzone-spacing`               | `$dropzone-spacing`               | `0.5rem`                            |
| `--bulma-dropzone-item-background`       | `$dropzone-item-background`       | `var(--bulma-scheme-main)`          |
| `--bulma-dropzone-item-border-color`     | `$dropzone-item-border-color`     | `var(--bulma-border)`               |
| `--bulma-dropzone-item-border-width`     | `$dropzone-item-border-width`     | `var(--bulma-control-border-width)` |
| `--bulma-dropzone-item-radius`           | `$dropzone-item-radius`           | `var(--bulma-radius)`               |
| `--bulma-dropzone-item-padding`          | `$dropzone-item-padding`          | `0.5em 0.75em`                      |
| `--bulma-dropzone-item-gap`              | `$dropzone-item-gap`              | `0.75em`                            |
| `--bulma-dropzone-item-spacing`          | `$dropzone-item-spacing`          | `0.25rem`                           |
| `--bulma-dropzone-name-color`            | `$dropzone-name-color`            | `var(--bulma-text-strong)`          |
| `--bulma-dropzone-size-color`            | `$dropzone-size-color`            | `var(--bulma-text-weak)`            |
| `--bulma-dropzone-size-font-size`        | `$dropzone-size-font-size`        | `var(--bulma-size-small)`           |

<!-- /bestax:generated cssvars -->
