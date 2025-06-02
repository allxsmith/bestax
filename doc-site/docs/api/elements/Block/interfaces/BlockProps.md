# Interface: BlockProps

Props for the Block component.

## Extends

- `HTMLAttributes`\<`HTMLDivElement`\>.`Omit`\<[`BulmaClassesProps`](../../../helpers/useBulmaClasses/interfaces/BulmaClassesProps.md), `"color"` \| `"backgroundColor"`\>

## Properties

### about?

> `optional` **about**: `string`

#### Inherited from

`React.HTMLAttributes.about`

***

### accessKey?

> `optional` **accessKey**: `string`

#### Inherited from

`React.HTMLAttributes.accessKey`

***

### alignContent?

> `optional` **alignContent**: `"flex-start"` \| `"flex-end"` \| `"center"` \| `"space-between"` \| `"space-around"` \| `"space-evenly"` \| `"stretch"`

Align content (e.g., 'center', 'stretch').

#### Inherited from

`Omit.alignContent`

***

### alignItems?

> `optional` **alignItems**: `"flex-start"` \| `"flex-end"` \| `"center"` \| `"start"` \| `"end"` \| `"stretch"` \| `"baseline"`

Align items (e.g., 'center', 'flex-start').

#### Inherited from

`Omit.alignItems`

***

### alignSelf?

> `optional` **alignSelf**: `"auto"` \| `"flex-start"` \| `"flex-end"` \| `"center"` \| `"stretch"` \| `"baseline"`

Align self (e.g., 'auto', 'center').

#### Inherited from

`Omit.alignSelf`

***

### aria-activedescendant?

> `optional` **aria-activedescendant**: `string`

Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application.

#### Inherited from

`React.HTMLAttributes.aria-activedescendant`

***

### aria-atomic?

> `optional` **aria-atomic**: `Booleanish`

Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute.

#### Inherited from

`React.HTMLAttributes.aria-atomic`

***

### aria-autocomplete?

> `optional` **aria-autocomplete**: `"inline"` \| `"none"` \| `"list"` \| `"both"`

Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be
presented if they are made.

#### Inherited from

`React.HTMLAttributes.aria-autocomplete`

***

### aria-braillelabel?

> `optional` **aria-braillelabel**: `string`

Defines a string value that labels the current element, which is intended to be converted into Braille.

#### See

aria-label.

#### Inherited from

`React.HTMLAttributes.aria-braillelabel`

***

### aria-brailleroledescription?

> `optional` **aria-brailleroledescription**: `string`

Defines a human-readable, author-localized abbreviated description for the role of an element, which is intended to be converted into Braille.

#### See

aria-roledescription.

#### Inherited from

`React.HTMLAttributes.aria-brailleroledescription`

***

### aria-busy?

> `optional` **aria-busy**: `Booleanish`

#### Inherited from

`React.HTMLAttributes.aria-busy`

***

### aria-checked?

> `optional` **aria-checked**: `boolean` \| `"true"` \| `"false"` \| `"mixed"`

Indicates the current "checked" state of checkboxes, radio buttons, and other widgets.

#### See

 - aria-pressed
 - aria-selected.

#### Inherited from

`React.HTMLAttributes.aria-checked`

***

### aria-colcount?

> `optional` **aria-colcount**: `number`

Defines the total number of columns in a table, grid, or treegrid.

#### See

aria-colindex.

#### Inherited from

`React.HTMLAttributes.aria-colcount`

***

### aria-colindex?

> `optional` **aria-colindex**: `number`

Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid.

#### See

 - aria-colcount
 - aria-colspan.

#### Inherited from

`React.HTMLAttributes.aria-colindex`

***

### aria-colindextext?

> `optional` **aria-colindextext**: `string`

Defines a human readable text alternative of aria-colindex.

#### See

aria-rowindextext.

#### Inherited from

`React.HTMLAttributes.aria-colindextext`

***

### aria-colspan?

> `optional` **aria-colspan**: `number`

Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid.

#### See

 - aria-colindex
 - aria-rowspan.

#### Inherited from

`React.HTMLAttributes.aria-colspan`

***

### aria-controls?

> `optional` **aria-controls**: `string`

Identifies the element (or elements) whose contents or presence are controlled by the current element.

#### See

aria-owns.

#### Inherited from

`React.HTMLAttributes.aria-controls`

***

### aria-current?

> `optional` **aria-current**: `boolean` \| `"true"` \| `"false"` \| `"page"` \| `"step"` \| `"location"` \| `"date"` \| `"time"`

Indicates the element that represents the current item within a container or set of related elements.

#### Inherited from

`React.HTMLAttributes.aria-current`

***

### aria-describedby?

> `optional` **aria-describedby**: `string`

Identifies the element (or elements) that describes the object.

#### See

aria-labelledby

#### Inherited from

`React.HTMLAttributes.aria-describedby`

***

### aria-description?

> `optional` **aria-description**: `string`

Defines a string value that describes or annotates the current element.

#### See

related aria-describedby.

#### Inherited from

`React.HTMLAttributes.aria-description`

***

### aria-details?

> `optional` **aria-details**: `string`

Identifies the element that provides a detailed, extended description for the object.

#### See

aria-describedby.

#### Inherited from

`React.HTMLAttributes.aria-details`

***

### aria-disabled?

> `optional` **aria-disabled**: `Booleanish`

Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.

#### See

 - aria-hidden
 - aria-readonly.

#### Inherited from

`React.HTMLAttributes.aria-disabled`

***

### ~~aria-dropeffect?~~

> `optional` **aria-dropeffect**: `"link"` \| `"none"` \| `"copy"` \| `"execute"` \| `"move"` \| `"popup"`

Indicates what functions can be performed when a dragged object is released on the drop target.

#### Deprecated

in ARIA 1.1

#### Inherited from

`React.HTMLAttributes.aria-dropeffect`

***

### aria-errormessage?

> `optional` **aria-errormessage**: `string`

Identifies the element that provides an error message for the object.

#### See

 - aria-invalid
 - aria-describedby.

#### Inherited from

`React.HTMLAttributes.aria-errormessage`

***

### aria-expanded?

> `optional` **aria-expanded**: `Booleanish`

Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed.

#### Inherited from

`React.HTMLAttributes.aria-expanded`

***

### aria-flowto?

> `optional` **aria-flowto**: `string`

Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion,
allows assistive technology to override the general default of reading in document source order.

#### Inherited from

`React.HTMLAttributes.aria-flowto`

***

### ~~aria-grabbed?~~

> `optional` **aria-grabbed**: `Booleanish`

Indicates an element's "grabbed" state in a drag-and-drop operation.

#### Deprecated

in ARIA 1.1

#### Inherited from

`React.HTMLAttributes.aria-grabbed`

***

### aria-haspopup?

> `optional` **aria-haspopup**: `boolean` \| `"true"` \| `"false"` \| `"dialog"` \| `"grid"` \| `"listbox"` \| `"menu"` \| `"tree"`

Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element.

#### Inherited from

`React.HTMLAttributes.aria-haspopup`

***

### aria-hidden?

> `optional` **aria-hidden**: `Booleanish`

Indicates whether the element is exposed to an accessibility API.

#### See

aria-disabled.

#### Inherited from

`React.HTMLAttributes.aria-hidden`

***

### aria-invalid?

> `optional` **aria-invalid**: `boolean` \| `"true"` \| `"false"` \| `"grammar"` \| `"spelling"`

Indicates the entered value does not conform to the format expected by the application.

#### See

aria-errormessage.

#### Inherited from

`React.HTMLAttributes.aria-invalid`

***

### aria-keyshortcuts?

> `optional` **aria-keyshortcuts**: `string`

Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element.

#### Inherited from

`React.HTMLAttributes.aria-keyshortcuts`

***

### aria-label?

> `optional` **aria-label**: `string`

Defines a string value that labels the current element.

#### See

aria-labelledby.

#### Inherited from

`React.HTMLAttributes.aria-label`

***

### aria-labelledby?

> `optional` **aria-labelledby**: `string`

Identifies the element (or elements) that labels the current element.

#### See

aria-describedby.

#### Inherited from

`React.HTMLAttributes.aria-labelledby`

***

### aria-level?

> `optional` **aria-level**: `number`

Defines the hierarchical level of an element within a structure.

#### Inherited from

`React.HTMLAttributes.aria-level`

***

### aria-live?

> `optional` **aria-live**: `"off"` \| `"assertive"` \| `"polite"`

Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region.

#### Inherited from

`React.HTMLAttributes.aria-live`

***

### aria-modal?

> `optional` **aria-modal**: `Booleanish`

Indicates whether an element is modal when displayed.

#### Inherited from

`React.HTMLAttributes.aria-modal`

***

### aria-multiline?

> `optional` **aria-multiline**: `Booleanish`

Indicates whether a text box accepts multiple lines of input or only a single line.

#### Inherited from

`React.HTMLAttributes.aria-multiline`

***

### aria-multiselectable?

> `optional` **aria-multiselectable**: `Booleanish`

Indicates that the user may select more than one item from the current selectable descendants.

#### Inherited from

`React.HTMLAttributes.aria-multiselectable`

***

### aria-orientation?

> `optional` **aria-orientation**: `"horizontal"` \| `"vertical"`

Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous.

#### Inherited from

`React.HTMLAttributes.aria-orientation`

***

### aria-owns?

> `optional` **aria-owns**: `string`

Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship
between DOM elements where the DOM hierarchy cannot be used to represent the relationship.

#### See

aria-controls.

#### Inherited from

`React.HTMLAttributes.aria-owns`

***

### aria-placeholder?

> `optional` **aria-placeholder**: `string`

Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value.
A hint could be a sample value or a brief description of the expected format.

#### Inherited from

`React.HTMLAttributes.aria-placeholder`

***

### aria-posinset?

> `optional` **aria-posinset**: `number`

Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.

#### See

aria-setsize.

#### Inherited from

`React.HTMLAttributes.aria-posinset`

***

### aria-pressed?

> `optional` **aria-pressed**: `boolean` \| `"true"` \| `"false"` \| `"mixed"`

Indicates the current "pressed" state of toggle buttons.

#### See

 - aria-checked
 - aria-selected.

#### Inherited from

`React.HTMLAttributes.aria-pressed`

***

### aria-readonly?

> `optional` **aria-readonly**: `Booleanish`

Indicates that the element is not editable, but is otherwise operable.

#### See

aria-disabled.

#### Inherited from

`React.HTMLAttributes.aria-readonly`

***

### aria-relevant?

> `optional` **aria-relevant**: `"text"` \| `"additions"` \| `"additions removals"` \| `"additions text"` \| `"all"` \| `"removals"` \| `"removals additions"` \| `"removals text"` \| `"text additions"` \| `"text removals"`

Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified.

#### See

aria-atomic.

#### Inherited from

`React.HTMLAttributes.aria-relevant`

***

### aria-required?

> `optional` **aria-required**: `Booleanish`

Indicates that user input is required on the element before a form may be submitted.

#### Inherited from

`React.HTMLAttributes.aria-required`

***

### aria-roledescription?

> `optional` **aria-roledescription**: `string`

Defines a human-readable, author-localized description for the role of an element.

#### Inherited from

`React.HTMLAttributes.aria-roledescription`

***

### aria-rowcount?

> `optional` **aria-rowcount**: `number`

Defines the total number of rows in a table, grid, or treegrid.

#### See

aria-rowindex.

#### Inherited from

`React.HTMLAttributes.aria-rowcount`

***

### aria-rowindex?

> `optional` **aria-rowindex**: `number`

Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid.

#### See

 - aria-rowcount
 - aria-rowspan.

#### Inherited from

`React.HTMLAttributes.aria-rowindex`

***

### aria-rowindextext?

> `optional` **aria-rowindextext**: `string`

Defines a human readable text alternative of aria-rowindex.

#### See

aria-colindextext.

#### Inherited from

`React.HTMLAttributes.aria-rowindextext`

***

### aria-rowspan?

> `optional` **aria-rowspan**: `number`

Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.

#### See

 - aria-rowindex
 - aria-colspan.

#### Inherited from

`React.HTMLAttributes.aria-rowspan`

***

### aria-selected?

> `optional` **aria-selected**: `Booleanish`

Indicates the current "selected" state of various widgets.

#### See

 - aria-checked
 - aria-pressed.

#### Inherited from

`React.HTMLAttributes.aria-selected`

***

### aria-setsize?

> `optional` **aria-setsize**: `number`

Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.

#### See

aria-posinset.

#### Inherited from

`React.HTMLAttributes.aria-setsize`

***

### aria-sort?

> `optional` **aria-sort**: `"none"` \| `"ascending"` \| `"descending"` \| `"other"`

Indicates if items in a table or grid are sorted in ascending or descending order.

#### Inherited from

`React.HTMLAttributes.aria-sort`

***

### aria-valuemax?

> `optional` **aria-valuemax**: `number`

Defines the maximum allowed value for a range widget.

#### Inherited from

`React.HTMLAttributes.aria-valuemax`

***

### aria-valuemin?

> `optional` **aria-valuemin**: `number`

Defines the minimum allowed value for a range widget.

#### Inherited from

`React.HTMLAttributes.aria-valuemin`

***

### aria-valuenow?

> `optional` **aria-valuenow**: `number`

Defines the current value for a range widget.

#### See

aria-valuetext.

#### Inherited from

`React.HTMLAttributes.aria-valuenow`

***

### aria-valuetext?

> `optional` **aria-valuetext**: `string`

Defines the human readable text alternative of aria-valuenow for a range widget.

#### Inherited from

`React.HTMLAttributes.aria-valuetext`

***

### autoCapitalize?

> `optional` **autoCapitalize**: `"off"` \| `"none"` \| `"on"` \| `"sentences"` \| `"words"` \| `"characters"` \| `string` & `object`

#### Inherited from

`React.HTMLAttributes.autoCapitalize`

***

### autoCorrect?

> `optional` **autoCorrect**: `string`

#### Inherited from

`React.HTMLAttributes.autoCorrect`

***

### autoFocus?

> `optional` **autoFocus**: `boolean`

#### Inherited from

`React.HTMLAttributes.autoFocus`

***

### autoSave?

> `optional` **autoSave**: `string`

#### Inherited from

`React.HTMLAttributes.autoSave`

***

### bgColor?

> `optional` **bgColor**: `"primary"` \| `"link"` \| `"info"` \| `"success"` \| `"warning"` \| `"danger"` \| `"black"` \| `"black-bis"` \| `"black-ter"` \| `"grey-darker"` \| `"grey-dark"` \| `"grey"` \| `"grey-light"` \| `"grey-lighter"` \| `"white"` \| `"light"` \| `"dark"` \| `"inherit"` \| `"current"`

Background color (Bulma color, 'inherit', or 'current').

***

### children?

> `optional` **children**: `ReactNode`

#### Inherited from

`React.HTMLAttributes.children`

***

### className?

> `optional` **className**: `string`

Additional CSS classes to apply.

#### Overrides

`React.HTMLAttributes.className`

***

### color?

> `optional` **color**: `"primary"` \| `"link"` \| `"info"` \| `"success"` \| `"warning"` \| `"danger"`

Bulma color modifier for the block.

#### Overrides

`React.HTMLAttributes.color`

***

### colorShade?

> `optional` **colorShade**: `"00"` \| `"05"` \| `"10"` \| `"15"` \| `"20"` \| `"25"` \| `"30"` \| `"35"` \| `"40"` \| `"45"` \| `"50"` \| `"55"` \| `"60"` \| `"65"` \| `"70"` \| `"75"` \| `"80"` \| `"85"` \| `"90"` \| `"95"` \| `"invert"`

Color shade suffix (e.g., '00', 'invert').

#### Inherited from

`Omit.colorShade`

***

### content?

> `optional` **content**: `string`

#### Inherited from

`React.HTMLAttributes.content`

***

### contentEditable?

> `optional` **contentEditable**: `"inherit"` \| `Booleanish` \| `"plaintext-only"`

#### Inherited from

`React.HTMLAttributes.contentEditable`

***

### contextMenu?

> `optional` **contextMenu**: `string`

#### Inherited from

`React.HTMLAttributes.contextMenu`

***

### dangerouslySetInnerHTML?

> `optional` **dangerouslySetInnerHTML**: `object`

#### \_\_html

> **\_\_html**: `string` \| `TrustedHTML`

#### Inherited from

`React.HTMLAttributes.dangerouslySetInnerHTML`

***

### datatype?

> `optional` **datatype**: `string`

#### Inherited from

`React.HTMLAttributes.datatype`

***

### defaultChecked?

> `optional` **defaultChecked**: `boolean`

#### Inherited from

`React.HTMLAttributes.defaultChecked`

***

### defaultValue?

> `optional` **defaultValue**: `string` \| `number` \| readonly `string`[]

#### Inherited from

`React.HTMLAttributes.defaultValue`

***

### dir?

> `optional` **dir**: `string`

#### Inherited from

`React.HTMLAttributes.dir`

***

### display?

> `optional` **display**: `"block"` \| `"flex"` \| `"inline"` \| `"inline-block"` \| `"inline-flex"`

Display type (e.g., 'block', 'flex').

#### Inherited from

`Omit.display`

***

### draggable?

> `optional` **draggable**: `Booleanish`

#### Inherited from

`React.HTMLAttributes.draggable`

***

### enterKeyHint?

> `optional` **enterKeyHint**: `"enter"` \| `"done"` \| `"go"` \| `"next"` \| `"previous"` \| `"search"` \| `"send"`

#### Inherited from

`React.HTMLAttributes.enterKeyHint`

***

### exportparts?

> `optional` **exportparts**: `string`

#### See

[https://developer.mozilla.org/en-US/docs/Web/HTML/Global\_attributes/exportparts](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/exportparts)

#### Inherited from

`React.HTMLAttributes.exportparts`

***

### flexDirection?

> `optional` **flexDirection**: `"row"` \| `"row-reverse"` \| `"column"` \| `"column-reverse"`

Flex direction (e.g., 'row', 'column').

#### Inherited from

`Omit.flexDirection`

***

### flexGrow?

> `optional` **flexGrow**: `"0"` \| `"1"`

Flex grow value (e.g., '0', '1').

#### Inherited from

`Omit.flexGrow`

***

### flexShrink?

> `optional` **flexShrink**: `"0"` \| `"1"`

Flex shrink value (e.g., '0', '1').

#### Inherited from

`Omit.flexShrink`

***

### flexWrap?

> `optional` **flexWrap**: `"nowrap"` \| `"wrap"` \| `"wrap-reverse"`

Flex wrap (e.g., 'wrap', 'nowrap').

#### Inherited from

`Omit.flexWrap`

***

### float?

> `optional` **float**: `"left"` \| `"right"`

Float direction (e.g., 'left', 'right').

#### Inherited from

`Omit.float`

***

### fontFamily?

> `optional` **fontFamily**: `"primary"` \| `"sans-serif"` \| `"monospace"` \| `"secondary"` \| `"code"`

Font family (e.g., 'sans-serif', 'code').

#### Inherited from

`Omit.fontFamily`

***

### hidden?

> `optional` **hidden**: `boolean`

#### Inherited from

`React.HTMLAttributes.hidden`

***

### id?

> `optional` **id**: `string`

#### Inherited from

`React.HTMLAttributes.id`

***

### inlist?

> `optional` **inlist**: `any`

#### Inherited from

`React.HTMLAttributes.inlist`

***

### inputMode?

> `optional` **inputMode**: `"none"` \| `"search"` \| `"text"` \| `"tel"` \| `"url"` \| `"email"` \| `"numeric"` \| `"decimal"`

Hints at the type of data that might be entered by the user while editing the element or its contents

#### See

[https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute](https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute)

#### Inherited from

`React.HTMLAttributes.inputMode`

***

### interaction?

> `optional` **interaction**: `"unselectable"` \| `"clickable"`

Interaction behavior (e.g., 'unselectable', 'clickable').

#### Inherited from

`Omit.interaction`

***

### is?

> `optional` **is**: `string`

Specify that a standard HTML element should behave like a defined custom built-in element

#### See

[https://html.spec.whatwg.org/multipage/custom-elements.html#attr-is](https://html.spec.whatwg.org/multipage/custom-elements.html#attr-is)

#### Inherited from

`React.HTMLAttributes.is`

***

### itemID?

> `optional` **itemID**: `string`

#### Inherited from

`React.HTMLAttributes.itemID`

***

### itemProp?

> `optional` **itemProp**: `string`

#### Inherited from

`React.HTMLAttributes.itemProp`

***

### itemRef?

> `optional` **itemRef**: `string`

#### Inherited from

`React.HTMLAttributes.itemRef`

***

### itemScope?

> `optional` **itemScope**: `boolean`

#### Inherited from

`React.HTMLAttributes.itemScope`

***

### itemType?

> `optional` **itemType**: `string`

#### Inherited from

`React.HTMLAttributes.itemType`

***

### justifyContent?

> `optional` **justifyContent**: `"left"` \| `"right"` \| `"flex-start"` \| `"flex-end"` \| `"center"` \| `"space-between"` \| `"space-around"` \| `"space-evenly"` \| `"start"` \| `"end"`

Justify content (e.g., 'center', 'space-between').

#### Inherited from

`Omit.justifyContent`

***

### lang?

> `optional` **lang**: `string`

#### Inherited from

`React.HTMLAttributes.lang`

***

### m?

> `optional` **m**: `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`

Margin (e.g., '0', '1').

#### Inherited from

`Omit.m`

***

### mb?

> `optional` **mb**: `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`

Margin bottom.

#### Inherited from

`Omit.mb`

***

### ml?

> `optional` **ml**: `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`

Margin left.

#### Inherited from

`Omit.ml`

***

### mr?

> `optional` **mr**: `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`

Margin right.

#### Inherited from

`Omit.mr`

***

### mt?

> `optional` **mt**: `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`

Margin top.

#### Inherited from

`Omit.mt`

***

### mx?

> `optional` **mx**: `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`

Margin horizontal (left and right).

#### Inherited from

`Omit.mx`

***

### my?

> `optional` **my**: `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`

Margin vertical (top and bottom).

#### Inherited from

`Omit.my`

***

### nonce?

> `optional` **nonce**: `string`

#### Inherited from

`React.HTMLAttributes.nonce`

***

### onAbort?

> `optional` **onAbort**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onAbort`

***

### onAbortCapture?

> `optional` **onAbortCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onAbortCapture`

***

### onAnimationEnd?

> `optional` **onAnimationEnd**: `AnimationEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onAnimationEnd`

***

### onAnimationEndCapture?

> `optional` **onAnimationEndCapture**: `AnimationEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onAnimationEndCapture`

***

### onAnimationIteration?

> `optional` **onAnimationIteration**: `AnimationEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onAnimationIteration`

***

### onAnimationIterationCapture?

> `optional` **onAnimationIterationCapture**: `AnimationEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onAnimationIterationCapture`

***

### onAnimationStart?

> `optional` **onAnimationStart**: `AnimationEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onAnimationStart`

***

### onAnimationStartCapture?

> `optional` **onAnimationStartCapture**: `AnimationEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onAnimationStartCapture`

***

### onAuxClick?

> `optional` **onAuxClick**: `MouseEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onAuxClick`

***

### onAuxClickCapture?

> `optional` **onAuxClickCapture**: `MouseEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onAuxClickCapture`

***

### onBeforeInput?

> `optional` **onBeforeInput**: `FormEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onBeforeInput`

***

### onBeforeInputCapture?

> `optional` **onBeforeInputCapture**: `FormEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onBeforeInputCapture`

***

### onBlur?

> `optional` **onBlur**: `FocusEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onBlur`

***

### onBlurCapture?

> `optional` **onBlurCapture**: `FocusEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onBlurCapture`

***

### onCanPlay?

> `optional` **onCanPlay**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onCanPlay`

***

### onCanPlayCapture?

> `optional` **onCanPlayCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onCanPlayCapture`

***

### onCanPlayThrough?

> `optional` **onCanPlayThrough**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onCanPlayThrough`

***

### onCanPlayThroughCapture?

> `optional` **onCanPlayThroughCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onCanPlayThroughCapture`

***

### onChange?

> `optional` **onChange**: `FormEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onChange`

***

### onChangeCapture?

> `optional` **onChangeCapture**: `FormEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onChangeCapture`

***

### onClick?

> `optional` **onClick**: `MouseEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onClick`

***

### onClickCapture?

> `optional` **onClickCapture**: `MouseEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onClickCapture`

***

### onCompositionEnd?

> `optional` **onCompositionEnd**: `CompositionEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onCompositionEnd`

***

### onCompositionEndCapture?

> `optional` **onCompositionEndCapture**: `CompositionEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onCompositionEndCapture`

***

### onCompositionStart?

> `optional` **onCompositionStart**: `CompositionEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onCompositionStart`

***

### onCompositionStartCapture?

> `optional` **onCompositionStartCapture**: `CompositionEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onCompositionStartCapture`

***

### onCompositionUpdate?

> `optional` **onCompositionUpdate**: `CompositionEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onCompositionUpdate`

***

### onCompositionUpdateCapture?

> `optional` **onCompositionUpdateCapture**: `CompositionEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onCompositionUpdateCapture`

***

### onContextMenu?

> `optional` **onContextMenu**: `MouseEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onContextMenu`

***

### onContextMenuCapture?

> `optional` **onContextMenuCapture**: `MouseEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onContextMenuCapture`

***

### onCopy?

> `optional` **onCopy**: `ClipboardEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onCopy`

***

### onCopyCapture?

> `optional` **onCopyCapture**: `ClipboardEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onCopyCapture`

***

### onCut?

> `optional` **onCut**: `ClipboardEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onCut`

***

### onCutCapture?

> `optional` **onCutCapture**: `ClipboardEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onCutCapture`

***

### onDoubleClick?

> `optional` **onDoubleClick**: `MouseEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onDoubleClick`

***

### onDoubleClickCapture?

> `optional` **onDoubleClickCapture**: `MouseEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onDoubleClickCapture`

***

### onDrag?

> `optional` **onDrag**: `DragEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onDrag`

***

### onDragCapture?

> `optional` **onDragCapture**: `DragEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onDragCapture`

***

### onDragEnd?

> `optional` **onDragEnd**: `DragEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onDragEnd`

***

### onDragEndCapture?

> `optional` **onDragEndCapture**: `DragEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onDragEndCapture`

***

### onDragEnter?

> `optional` **onDragEnter**: `DragEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onDragEnter`

***

### onDragEnterCapture?

> `optional` **onDragEnterCapture**: `DragEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onDragEnterCapture`

***

### onDragExit?

> `optional` **onDragExit**: `DragEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onDragExit`

***

### onDragExitCapture?

> `optional` **onDragExitCapture**: `DragEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onDragExitCapture`

***

### onDragLeave?

> `optional` **onDragLeave**: `DragEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onDragLeave`

***

### onDragLeaveCapture?

> `optional` **onDragLeaveCapture**: `DragEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onDragLeaveCapture`

***

### onDragOver?

> `optional` **onDragOver**: `DragEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onDragOver`

***

### onDragOverCapture?

> `optional` **onDragOverCapture**: `DragEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onDragOverCapture`

***

### onDragStart?

> `optional` **onDragStart**: `DragEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onDragStart`

***

### onDragStartCapture?

> `optional` **onDragStartCapture**: `DragEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onDragStartCapture`

***

### onDrop?

> `optional` **onDrop**: `DragEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onDrop`

***

### onDropCapture?

> `optional` **onDropCapture**: `DragEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onDropCapture`

***

### onDurationChange?

> `optional` **onDurationChange**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onDurationChange`

***

### onDurationChangeCapture?

> `optional` **onDurationChangeCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onDurationChangeCapture`

***

### onEmptied?

> `optional` **onEmptied**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onEmptied`

***

### onEmptiedCapture?

> `optional` **onEmptiedCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onEmptiedCapture`

***

### onEncrypted?

> `optional` **onEncrypted**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onEncrypted`

***

### onEncryptedCapture?

> `optional` **onEncryptedCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onEncryptedCapture`

***

### onEnded?

> `optional` **onEnded**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onEnded`

***

### onEndedCapture?

> `optional` **onEndedCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onEndedCapture`

***

### onError?

> `optional` **onError**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onError`

***

### onErrorCapture?

> `optional` **onErrorCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onErrorCapture`

***

### onFocus?

> `optional` **onFocus**: `FocusEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onFocus`

***

### onFocusCapture?

> `optional` **onFocusCapture**: `FocusEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onFocusCapture`

***

### onGotPointerCapture?

> `optional` **onGotPointerCapture**: `PointerEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onGotPointerCapture`

***

### onGotPointerCaptureCapture?

> `optional` **onGotPointerCaptureCapture**: `PointerEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onGotPointerCaptureCapture`

***

### onInput?

> `optional` **onInput**: `FormEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onInput`

***

### onInputCapture?

> `optional` **onInputCapture**: `FormEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onInputCapture`

***

### onInvalid?

> `optional` **onInvalid**: `FormEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onInvalid`

***

### onInvalidCapture?

> `optional` **onInvalidCapture**: `FormEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onInvalidCapture`

***

### onKeyDown?

> `optional` **onKeyDown**: `KeyboardEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onKeyDown`

***

### onKeyDownCapture?

> `optional` **onKeyDownCapture**: `KeyboardEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onKeyDownCapture`

***

### ~~onKeyPress?~~

> `optional` **onKeyPress**: `KeyboardEventHandler`\<`HTMLDivElement`\>

#### Deprecated

Use `onKeyUp` or `onKeyDown` instead

#### Inherited from

`React.HTMLAttributes.onKeyPress`

***

### ~~onKeyPressCapture?~~

> `optional` **onKeyPressCapture**: `KeyboardEventHandler`\<`HTMLDivElement`\>

#### Deprecated

Use `onKeyUpCapture` or `onKeyDownCapture` instead

#### Inherited from

`React.HTMLAttributes.onKeyPressCapture`

***

### onKeyUp?

> `optional` **onKeyUp**: `KeyboardEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onKeyUp`

***

### onKeyUpCapture?

> `optional` **onKeyUpCapture**: `KeyboardEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onKeyUpCapture`

***

### onLoad?

> `optional` **onLoad**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onLoad`

***

### onLoadCapture?

> `optional` **onLoadCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onLoadCapture`

***

### onLoadedData?

> `optional` **onLoadedData**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onLoadedData`

***

### onLoadedDataCapture?

> `optional` **onLoadedDataCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onLoadedDataCapture`

***

### onLoadedMetadata?

> `optional` **onLoadedMetadata**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onLoadedMetadata`

***

### onLoadedMetadataCapture?

> `optional` **onLoadedMetadataCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onLoadedMetadataCapture`

***

### onLoadStart?

> `optional` **onLoadStart**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onLoadStart`

***

### onLoadStartCapture?

> `optional` **onLoadStartCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onLoadStartCapture`

***

### onLostPointerCapture?

> `optional` **onLostPointerCapture**: `PointerEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onLostPointerCapture`

***

### onLostPointerCaptureCapture?

> `optional` **onLostPointerCaptureCapture**: `PointerEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onLostPointerCaptureCapture`

***

### onMouseDown?

> `optional` **onMouseDown**: `MouseEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onMouseDown`

***

### onMouseDownCapture?

> `optional` **onMouseDownCapture**: `MouseEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onMouseDownCapture`

***

### onMouseEnter?

> `optional` **onMouseEnter**: `MouseEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onMouseEnter`

***

### onMouseLeave?

> `optional` **onMouseLeave**: `MouseEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onMouseLeave`

***

### onMouseMove?

> `optional` **onMouseMove**: `MouseEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onMouseMove`

***

### onMouseMoveCapture?

> `optional` **onMouseMoveCapture**: `MouseEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onMouseMoveCapture`

***

### onMouseOut?

> `optional` **onMouseOut**: `MouseEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onMouseOut`

***

### onMouseOutCapture?

> `optional` **onMouseOutCapture**: `MouseEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onMouseOutCapture`

***

### onMouseOver?

> `optional` **onMouseOver**: `MouseEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onMouseOver`

***

### onMouseOverCapture?

> `optional` **onMouseOverCapture**: `MouseEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onMouseOverCapture`

***

### onMouseUp?

> `optional` **onMouseUp**: `MouseEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onMouseUp`

***

### onMouseUpCapture?

> `optional` **onMouseUpCapture**: `MouseEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onMouseUpCapture`

***

### onPaste?

> `optional` **onPaste**: `ClipboardEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onPaste`

***

### onPasteCapture?

> `optional` **onPasteCapture**: `ClipboardEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onPasteCapture`

***

### onPause?

> `optional` **onPause**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onPause`

***

### onPauseCapture?

> `optional` **onPauseCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onPauseCapture`

***

### onPlay?

> `optional` **onPlay**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onPlay`

***

### onPlayCapture?

> `optional` **onPlayCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onPlayCapture`

***

### onPlaying?

> `optional` **onPlaying**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onPlaying`

***

### onPlayingCapture?

> `optional` **onPlayingCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onPlayingCapture`

***

### onPointerCancel?

> `optional` **onPointerCancel**: `PointerEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onPointerCancel`

***

### onPointerCancelCapture?

> `optional` **onPointerCancelCapture**: `PointerEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onPointerCancelCapture`

***

### onPointerDown?

> `optional` **onPointerDown**: `PointerEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onPointerDown`

***

### onPointerDownCapture?

> `optional` **onPointerDownCapture**: `PointerEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onPointerDownCapture`

***

### onPointerEnter?

> `optional` **onPointerEnter**: `PointerEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onPointerEnter`

***

### onPointerLeave?

> `optional` **onPointerLeave**: `PointerEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onPointerLeave`

***

### onPointerMove?

> `optional` **onPointerMove**: `PointerEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onPointerMove`

***

### onPointerMoveCapture?

> `optional` **onPointerMoveCapture**: `PointerEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onPointerMoveCapture`

***

### onPointerOut?

> `optional` **onPointerOut**: `PointerEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onPointerOut`

***

### onPointerOutCapture?

> `optional` **onPointerOutCapture**: `PointerEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onPointerOutCapture`

***

### onPointerOver?

> `optional` **onPointerOver**: `PointerEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onPointerOver`

***

### onPointerOverCapture?

> `optional` **onPointerOverCapture**: `PointerEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onPointerOverCapture`

***

### onPointerUp?

> `optional` **onPointerUp**: `PointerEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onPointerUp`

***

### onPointerUpCapture?

> `optional` **onPointerUpCapture**: `PointerEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onPointerUpCapture`

***

### onProgress?

> `optional` **onProgress**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onProgress`

***

### onProgressCapture?

> `optional` **onProgressCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onProgressCapture`

***

### onRateChange?

> `optional` **onRateChange**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onRateChange`

***

### onRateChangeCapture?

> `optional` **onRateChangeCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onRateChangeCapture`

***

### onReset?

> `optional` **onReset**: `FormEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onReset`

***

### onResetCapture?

> `optional` **onResetCapture**: `FormEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onResetCapture`

***

### onScroll?

> `optional` **onScroll**: `UIEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onScroll`

***

### onScrollCapture?

> `optional` **onScrollCapture**: `UIEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onScrollCapture`

***

### onSeeked?

> `optional` **onSeeked**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onSeeked`

***

### onSeekedCapture?

> `optional` **onSeekedCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onSeekedCapture`

***

### onSeeking?

> `optional` **onSeeking**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onSeeking`

***

### onSeekingCapture?

> `optional` **onSeekingCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onSeekingCapture`

***

### onSelect?

> `optional` **onSelect**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onSelect`

***

### onSelectCapture?

> `optional` **onSelectCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onSelectCapture`

***

### onStalled?

> `optional` **onStalled**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onStalled`

***

### onStalledCapture?

> `optional` **onStalledCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onStalledCapture`

***

### onSubmit?

> `optional` **onSubmit**: `FormEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onSubmit`

***

### onSubmitCapture?

> `optional` **onSubmitCapture**: `FormEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onSubmitCapture`

***

### onSuspend?

> `optional` **onSuspend**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onSuspend`

***

### onSuspendCapture?

> `optional` **onSuspendCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onSuspendCapture`

***

### onTimeUpdate?

> `optional` **onTimeUpdate**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onTimeUpdate`

***

### onTimeUpdateCapture?

> `optional` **onTimeUpdateCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onTimeUpdateCapture`

***

### onTouchCancel?

> `optional` **onTouchCancel**: `TouchEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onTouchCancel`

***

### onTouchCancelCapture?

> `optional` **onTouchCancelCapture**: `TouchEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onTouchCancelCapture`

***

### onTouchEnd?

> `optional` **onTouchEnd**: `TouchEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onTouchEnd`

***

### onTouchEndCapture?

> `optional` **onTouchEndCapture**: `TouchEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onTouchEndCapture`

***

### onTouchMove?

> `optional` **onTouchMove**: `TouchEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onTouchMove`

***

### onTouchMoveCapture?

> `optional` **onTouchMoveCapture**: `TouchEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onTouchMoveCapture`

***

### onTouchStart?

> `optional` **onTouchStart**: `TouchEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onTouchStart`

***

### onTouchStartCapture?

> `optional` **onTouchStartCapture**: `TouchEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onTouchStartCapture`

***

### onTransitionEnd?

> `optional` **onTransitionEnd**: `TransitionEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onTransitionEnd`

***

### onTransitionEndCapture?

> `optional` **onTransitionEndCapture**: `TransitionEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onTransitionEndCapture`

***

### onVolumeChange?

> `optional` **onVolumeChange**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onVolumeChange`

***

### onVolumeChangeCapture?

> `optional` **onVolumeChangeCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onVolumeChangeCapture`

***

### onWaiting?

> `optional` **onWaiting**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onWaiting`

***

### onWaitingCapture?

> `optional` **onWaitingCapture**: `ReactEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onWaitingCapture`

***

### onWheel?

> `optional` **onWheel**: `WheelEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onWheel`

***

### onWheelCapture?

> `optional` **onWheelCapture**: `WheelEventHandler`\<`HTMLDivElement`\>

#### Inherited from

`React.HTMLAttributes.onWheelCapture`

***

### overflow?

> `optional` **overflow**: `"clipped"`

Overflow behavior (e.g., 'clipped').

#### Inherited from

`Omit.overflow`

***

### overlay?

> `optional` **overlay**: `boolean`

Applies overlay styling if true.

#### Inherited from

`Omit.overlay`

***

### p?

> `optional` **p**: `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`

Padding (e.g., '0', '1').

#### Inherited from

`Omit.p`

***

### part?

> `optional` **part**: `string`

#### See

[https://developer.mozilla.org/en-US/docs/Web/HTML/Global\_attributes/part](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/part)

#### Inherited from

`React.HTMLAttributes.part`

***

### pb?

> `optional` **pb**: `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`

Padding bottom.

#### Inherited from

`Omit.pb`

***

### pl?

> `optional` **pl**: `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`

Padding left.

#### Inherited from

`Omit.pl`

***

### pr?

> `optional` **pr**: `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`

Padding right.

#### Inherited from

`Omit.pr`

***

### prefix?

> `optional` **prefix**: `string`

#### Inherited from

`React.HTMLAttributes.prefix`

***

### property?

> `optional` **property**: `string`

#### Inherited from

`React.HTMLAttributes.property`

***

### pt?

> `optional` **pt**: `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`

Padding top.

#### Inherited from

`Omit.pt`

***

### px?

> `optional` **px**: `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`

Padding horizontal (left and right).

#### Inherited from

`Omit.px`

***

### py?

> `optional` **py**: `"0"` \| `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"auto"`

Padding vertical (top and bottom).

#### Inherited from

`Omit.py`

***

### radioGroup?

> `optional` **radioGroup**: `string`

#### Inherited from

`React.HTMLAttributes.radioGroup`

***

### radius?

> `optional` **radius**: `"radiusless"`

Border radius style (e.g., 'radiusless').

#### Inherited from

`Omit.radius`

***

### rel?

> `optional` **rel**: `string`

#### Inherited from

`React.HTMLAttributes.rel`

***

### resource?

> `optional` **resource**: `string`

#### Inherited from

`React.HTMLAttributes.resource`

***

### responsive?

> `optional` **responsive**: `"mobile"` \| `"narrow"`

Responsive behavior (e.g., 'mobile', 'narrow').

#### Inherited from

`Omit.responsive`

***

### results?

> `optional` **results**: `number`

#### Inherited from

`React.HTMLAttributes.results`

***

### rev?

> `optional` **rev**: `string`

#### Inherited from

`React.HTMLAttributes.rev`

***

### role?

> `optional` **role**: `AriaRole`

#### Inherited from

`React.HTMLAttributes.role`

***

### security?

> `optional` **security**: `string`

#### Inherited from

`React.HTMLAttributes.security`

***

### shadow?

> `optional` **shadow**: `"shadowless"`

Shadow style (e.g., 'shadowless').

#### Inherited from

`Omit.shadow`

***

### slot?

> `optional` **slot**: `string`

#### Inherited from

`React.HTMLAttributes.slot`

***

### spellCheck?

> `optional` **spellCheck**: `Booleanish`

#### Inherited from

`React.HTMLAttributes.spellCheck`

***

### style?

> `optional` **style**: `CSSProperties`

#### Inherited from

`React.HTMLAttributes.style`

***

### suppressContentEditableWarning?

> `optional` **suppressContentEditableWarning**: `boolean`

#### Inherited from

`React.HTMLAttributes.suppressContentEditableWarning`

***

### suppressHydrationWarning?

> `optional` **suppressHydrationWarning**: `boolean`

#### Inherited from

`React.HTMLAttributes.suppressHydrationWarning`

***

### tabIndex?

> `optional` **tabIndex**: `number`

#### Inherited from

`React.HTMLAttributes.tabIndex`

***

### textAlign?

> `optional` **textAlign**: `"centered"` \| `"justified"` \| `"left"` \| `"right"`

Text alignment (e.g., 'centered', 'left').

#### Inherited from

`Omit.textAlign`

***

### textColor?

> `optional` **textColor**: `"primary"` \| `"link"` \| `"info"` \| `"success"` \| `"warning"` \| `"danger"` \| `"black"` \| `"black-bis"` \| `"black-ter"` \| `"grey-darker"` \| `"grey-dark"` \| `"grey"` \| `"grey-light"` \| `"grey-lighter"` \| `"white"` \| `"light"` \| `"dark"` \| `"inherit"` \| `"current"`

Text color (Bulma color, 'inherit', or 'current').

***

### textSize?

> `optional` **textSize**: `"1"` \| `"2"` \| `"3"` \| `"4"` \| `"5"` \| `"6"` \| `"7"`

Text size (e.g., '1', '2').

#### Inherited from

`Omit.textSize`

***

### textTransform?

> `optional` **textTransform**: `"capitalized"` \| `"lowercase"` \| `"uppercase"` \| `"italic"`

Text transformation (e.g., 'uppercase', 'italic').

#### Inherited from

`Omit.textTransform`

***

### textWeight?

> `optional` **textWeight**: `"light"` \| `"normal"` \| `"medium"` \| `"semibold"` \| `"bold"`

Text weight (e.g., 'light', 'bold').

#### Inherited from

`Omit.textWeight`

***

### title?

> `optional` **title**: `string`

#### Inherited from

`React.HTMLAttributes.title`

***

### translate?

> `optional` **translate**: `"yes"` \| `"no"`

#### Inherited from

`React.HTMLAttributes.translate`

***

### typeof?

> `optional` **typeof**: `string`

#### Inherited from

`React.HTMLAttributes.typeof`

***

### unselectable?

> `optional` **unselectable**: `"off"` \| `"on"`

#### Inherited from

`React.HTMLAttributes.unselectable`

***

### viewport?

> `optional` **viewport**: `"mobile"` \| `"tablet"` \| `"desktop"` \| `"widescreen"` \| `"fullhd"`

Viewport for responsive classes (e.g., 'mobile', 'desktop').

#### Inherited from

`Omit.viewport`

***

### visibility?

> `optional` **visibility**: `"hidden"` \| `"sr-only"`

Visibility (e.g., 'hidden', 'sr-only').

#### Inherited from

`Omit.visibility`

***

### vocab?

> `optional` **vocab**: `string`

#### Inherited from

`React.HTMLAttributes.vocab`
