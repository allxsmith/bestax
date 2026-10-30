/**
 * @jest-environment node
 *
 * A server render runs no layout effects, and React 18 logs a warning in
 * development for each `useLayoutEffect` it meets there. The library's layout
 * effects go through `useClientLayoutEffect`, which hands the server a plain
 * `useEffect` instead, so a server render of these logs nothing. React 19
 * dropped that warning, so only the React 18 run can fail here.
 *
 * Lint keeps `useLayoutEffect` from React out of the source. This holds the
 * helper's callers to it, so a component that starts calling the helper, or a
 * hook built on it, belongs in the cases too.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Tooltip } from '../components/Tooltip';
import { ContextMenu } from '../components/ContextMenu';
import { Popover } from '../components/Popover';
import { SegmentedControl } from '../components/SegmentedControl';
import { ScrollArea } from '../components/ScrollArea';
import { Command } from '../components/Command';
import { Splitter } from '../layout/Splitter';
import { Slider } from '../form/Slider';
import { PinInput } from '../form/PinInput';
import { ColorPicker } from '../form/ColorPicker';
import { DateInput } from '../form/DateInput';
import { TimeInput } from '../form/TimeInput';
import { DateTimeInput } from '../form/DateTimeInput';
import { DateRangeInput } from '../form/DateRangeInput';

const cases: Array<[string, React.ReactElement]> = [
  [
    'Tooltip',
    <Tooltip key="tooltip" label="Delete item">
      <button>Delete</button>
    </Tooltip>,
  ],
  [
    'ContextMenu',
    <ContextMenu
      key="context-menu"
      aria-label="Actions for report.pdf"
      trigger={<div>report.pdf</div>}
    >
      <ContextMenu.Item as="button">Rename</ContextMenu.Item>
    </ContextMenu>,
  ],
  [
    // Open and inline, so its panel and header render on the server too.
    'Popover',
    <Popover key="popover" trigger={<button>Filters</button>} defaultOpen>
      <Popover.Header>Filter rows</Popover.Header>
      <Popover.Body>Body</Popover.Body>
    </Popover>,
  ],
  [
    'SegmentedControl',
    <SegmentedControl
      key="segmented"
      aria-label="Text alignment"
      defaultValue="left"
    >
      <SegmentedControl.Segment value="left">Left</SegmentedControl.Segment>
      <SegmentedControl.Segment value="right">Right</SegmentedControl.Segment>
    </SegmentedControl>,
  ],
  [
    'ScrollArea',
    <ScrollArea key="scroll-area" aria-label="Notes" height={120}>
      <p>Notes</p>
    </ScrollArea>,
  ],
  [
    'Splitter',
    <Splitter key="splitter" height={200}>
      <Splitter.Pane label="Files" minSize="10rem" collapsible>
        Files
      </Splitter.Pane>
      <Splitter.Pane label="Editor">Editor</Splitter.Pane>
    </Splitter>,
  ],
  [
    'Command',
    <Command
      key="command"
      label="Commands"
      actions={[{ id: 'open', label: 'Open', group: 'Files' }]}
    />,
  ],
  [
    // Open, so the Modal and the Command in it render on the server too.
    'Command.Dialog',
    <Command.Dialog
      key="command-dialog"
      defaultOpen
      actions={[{ id: 'open', label: 'Open' }]}
    />,
  ],
  ['Slider', <Slider key="slider" label="Volume" />],
  ['PinInput', <PinInput key="pin" label="Code" defaultValue="12" />],
  [
    'ColorPicker',
    <ColorPicker key="color" label="Color" alpha swatches={['red']} />,
  ],
  ['DateInput', <DateInput key="date" label="Date" />],
  ['TimeInput', <TimeInput key="time" label="Time" />],
  ['DateTimeInput', <DateTimeInput key="datetime" label="When" />],
  ['DateRangeInput', <DateRangeInput key="range" label="Dates" />],
];

describe('server rendering (node environment)', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it.each(cases)('logs nothing for a %s', (_, ui) => {
    expect(renderToStaticMarkup(ui)).not.toBe('');
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
