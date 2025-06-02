# Interface: TagProps

Props for the Tag component.

## Extends

- `Omit`\<`React.HTMLAttributes`\<`HTMLSpanElement`\>, `"color"`\>.`Omit`\<[`BulmaClassesProps`](../../../helpers/useBulmaClasses/interfaces/BulmaClassesProps.md), `"backgroundColor"` \| `"color"`\>

## Properties

### about?

> `optional` **about**: `string`

#### Inherited from

`Omit.about`

***

### accessKey?

> `optional` **accessKey**: `string`

#### Inherited from

`Omit.accessKey`

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

`Omit.aria-activedescendant`

***

### aria-atomic?

> `optional` **aria-atomic**: `Booleanish`

Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute.

#### Inherited from

`Omit.aria-atomic`

***

### aria-autocomplete?

> `optional` **aria-autocomplete**: `"inline"` \| `"none"` \| `"list"` \| `"both"`

Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be
presented if they are made.

#### Inherited from

`Omit.aria-autocomplete`

***

### aria-braillelabel?

> `optional` **aria-braillelabel**: `string`

Defines a string value that labels the current element, which is intended to be converted into Braille.

#### See

aria-label.

#### Inherited from

`Omit.aria-braillelabel`

***

### aria-brailleroledescription?

> `optional` **aria-brailleroledescription**: `string`

Defines a human-readable, author-localized abbreviated description for the role of an element, which is intended to be converted into Braille.

#### See

aria-roledescription.

#### Inherited from

`Omit.aria-brailleroledescription`

***

### aria-busy?

> `optional` **aria-busy**: `Booleanish`

#### Inherited from

`Omit.aria-busy`

***

### aria-checked?

> `optional` **aria-checked**: `boolean` \| `"true"` \| `"false"` \| `"mixed"`

Indicates the current "checked" state of checkboxes, radio buttons, and other widgets.

#### See

 - aria-pressed
 - aria-selected.

#### Inherited from

`Omit.aria-checked`

***

### aria-colcount?

> `optional` **aria-colcount**: `number`

Defines the total number of columns in a table, grid, or treegrid.

#### See

aria-colindex.

#### Inherited from

`Omit.aria-colcount`

***

### aria-colindex?

> `optional` **aria-colindex**: `number`

Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid.

#### See

 - aria-colcount
 - aria-colspan.

#### Inherited from

`Omit.aria-colindex`

***

### aria-colindextext?

> `optional` **aria-colindextext**: `string`

Defines a human readable text alternative of aria-colindex.

#### See

aria-rowindextext.

#### Inherited from

`Omit.aria-colindextext`

***

### aria-colspan?

> `optional` **aria-colspan**: `number`

Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid.

#### See

 - aria-colindex
 - aria-rowspan.

#### Inherited from

`Omit.aria-colspan`

***

### aria-controls?

> `optional` **aria-controls**: `string`

Identifies the element (or elements) whose contents or presence are controlled by the current element.

#### See

aria-owns.

#### Inherited from

`Omit.aria-controls`

***

### aria-current?

> `optional` **aria-current**: `boolean` \| `"true"` \| `"false"` \| `"page"` \| `"step"` \| `"location"` \| `"date"` \| `"time"`

Indicates the element that represents the current item within a container or set of related elements.

#### Inherited from

`Omit.aria-current`

***

### aria-describedby?

> `optional` **aria-describedby**: `string`

Identifies the element (or elements) that describes the object.

#### See

aria-labelledby

#### Inherited from

`Omit.aria-describedby`

***

### aria-description?

> `optional` **aria-description**: `string`

Defines a string value that describes or annotates the current element.

#### See

related aria-describedby.

#### Inherited from

`Omit.aria-description`

***

### aria-details?

> `optional` **aria-details**: `string`

Identifies the element that provides a detailed, extended description for the object.

#### See

aria-describedby.

#### Inherited from

`Omit.aria-details`

***

### aria-disabled?

> `optional` **aria-disabled**: `Booleanish`

Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.

#### See

 - aria-hidden
 - aria-readonly.

#### Inherited from

`Omit.aria-disabled`

***

### ~~aria-dropeffect?~~

> `optional` **aria-dropeffect**: `"link"` \| `"none"` \| `"copy"` \| `"execute"` \| `"move"` \| `"popup"`

Indicates what functions can be performed when a dragged object is released on the drop target.

#### Deprecated

in ARIA 1.1

#### Inherited from

`Omit.aria-dropeffect`

***

### aria-errormessage?

> `optional` **aria-errormessage**: `string`

Identifies the element that provides an error message for the object.

#### See

 - aria-invalid
 - aria-describedby.

#### Inherited from

`Omit.aria-errormessage`

***

### aria-expanded?

> `optional` **aria-expanded**: `Booleanish`

Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed.

#### Inherited from

`Omit.aria-expanded`

***

### aria-flowto?

> `optional` **aria-flowto**: `string`

Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion,
allows assistive technology to override the general default of reading in document source order.

#### Inherited from

`Omit.aria-flowto`

***

### ~~aria-grabbed?~~

> `optional` **aria-grabbed**: `Booleanish`

Indicates an element's "grabbed" state in a drag-and-drop operation.

#### Deprecated

in ARIA 1.1

#### Inherited from

`Omit.aria-grabbed`

***

### aria-haspopup?

> `optional` **aria-haspopup**: `boolean` \| `"true"` \| `"false"` \| `"dialog"` \| `"grid"` \| `"listbox"` \| `"menu"` \| `"tree"`

Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element.

#### Inherited from

`Omit.aria-haspopup`

***

### aria-hidden?

> `optional` **aria-hidden**: `Booleanish`

Indicates whether the element is exposed to an accessibility API.

#### See

aria-disabled.

#### Inherited from

`Omit.aria-hidden`

***

### aria-invalid?

> `optional` **aria-invalid**: `boolean` \| `"true"` \| `"false"` \| `"grammar"` \| `"spelling"`

Indicates the entered value does not conform to the format expected by the application.

#### See

aria-errormessage.

#### Inherited from

`Omit.aria-invalid`

***

### aria-keyshortcuts?

> `optional` **aria-keyshortcuts**: `string`

Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element.

#### Inherited from

`Omit.aria-keyshortcuts`

***

### aria-label?

> `optional` **aria-label**: `string`

Defines a string value that labels the current element.

#### See

aria-labelledby.

#### Inherited from

`Omit.aria-label`

***

### aria-labelledby?

> `optional` **aria-labelledby**: `string`

Identifies the element (or elements) that labels the current element.

#### See

aria-describedby.

#### Inherited from

`Omit.aria-labelledby`

***

### aria-level?

> `optional` **aria-level**: `number`

Defines the hierarchical level of an element within a structure.

#### Inherited from

`Omit.aria-level`

***

### aria-live?

> `optional` **aria-live**: `"off"` \| `"assertive"` \| `"polite"`

Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region.

#### Inherited from

`Omit.aria-live`

***

### aria-modal?

> `optional` **aria-modal**: `Booleanish`

Indicates whether an element is modal when displayed.

#### Inherited from

`Omit.aria-modal`

***

### aria-multiline?

> `optional` **aria-multiline**: `Booleanish`

Indicates whether a text box accepts multiple lines of input or only a single line.

#### Inherited from

`Omit.aria-multiline`

***

### aria-multiselectable?

> `optional` **aria-multiselectable**: `Booleanish`

Indicates that the user may select more than one item from the current selectable descendants.

#### Inherited from

`Omit.aria-multiselectable`

***

### aria-orientation?

> `optional` **aria-orientation**: `"horizontal"` \| `"vertical"`

Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous.

#### Inherited from

`Omit.aria-orientation`

***

### aria-owns?

> `optional` **aria-owns**: `string`

Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship
between DOM elements where the DOM hierarchy cannot be used to represent the relationship.

#### See

aria-controls.

#### Inherited from

`Omit.aria-owns`

***

### aria-placeholder?

> `optional` **aria-placeholder**: `string`

Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value.
A hint could be a sample value or a brief description of the expected format.

#### Inherited from

`Omit.aria-placeholder`

***

### aria-posinset?

> `optional` **aria-posinset**: `number`

Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.

#### See

aria-setsize.

#### Inherited from

`Omit.aria-posinset`

***

### aria-pressed?

> `optional` **aria-pressed**: `boolean` \| `"true"` \| `"false"` \| `"mixed"`

Indicates the current "pressed" state of toggle buttons.

#### See

 - aria-checked
 - aria-selected.

#### Inherited from

`Omit.aria-pressed`

***

### aria-readonly?

> `optional` **aria-readonly**: `Booleanish`

Indicates that the element is not editable, but is otherwise operable.

#### See

aria-disabled.

#### Inherited from

`Omit.aria-readonly`

***

### aria-relevant?

> `optional` **aria-relevant**: `"text"` \| `"additions"` \| `"additions removals"` \| `"additions text"` \| `"all"` \| `"removals"` \| `"removals additions"` \| `"removals text"` \| `"text additions"` \| `"text removals"`

Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified.

#### See

aria-atomic.

#### Inherited from

`Omit.aria-relevant`

***

### aria-required?

> `optional` **aria-required**: `Booleanish`

Indicates that user input is required on the element before a form may be submitted.

#### Inherited from

`Omit.aria-required`

***

### aria-roledescription?

> `optional` **aria-roledescription**: `string`

Defines a human-readable, author-localized description for the role of an element.

#### Inherited from

`Omit.aria-roledescription`

***

### aria-rowcount?

> `optional` **aria-rowcount**: `number`

Defines the total number of rows in a table, grid, or treegrid.

#### See

aria-rowindex.

#### Inherited from

`Omit.aria-rowcount`

***

### aria-rowindex?

> `optional` **aria-rowindex**: `number`

Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid.

#### See

 - aria-rowcount
 - aria-rowspan.

#### Inherited from

`Omit.aria-rowindex`

***

### aria-rowindextext?

> `optional` **aria-rowindextext**: `string`

Defines a human readable text alternative of aria-rowindex.

#### See

aria-colindextext.

#### Inherited from

`Omit.aria-rowindextext`

***

### aria-rowspan?

> `optional` **aria-rowspan**: `number`

Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.

#### See

 - aria-rowindex
 - aria-colspan.

#### Inherited from

`Omit.aria-rowspan`

***

### aria-selected?

> `optional` **aria-selected**: `Booleanish`

Indicates the current "selected" state of various widgets.

#### See

 - aria-checked
 - aria-pressed.

#### Inherited from

`Omit.aria-selected`

***

### aria-setsize?

> `optional` **aria-setsize**: `number`

Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.

#### See

aria-posinset.

#### Inherited from

`Omit.aria-setsize`

***

### aria-sort?

> `optional` **aria-sort**: `"none"` \| `"ascending"` \| `"descending"` \| `"other"`

Indicates if items in a table or grid are sorted in ascending or descending order.

#### Inherited from

`Omit.aria-sort`

***

### aria-valuemax?

> `optional` **aria-valuemax**: `number`

Defines the maximum allowed value for a range widget.

#### Inherited from

`Omit.aria-valuemax`

***

### aria-valuemin?

> `optional` **aria-valuemin**: `number`

Defines the minimum allowed value for a range widget.

#### Inherited from

`Omit.aria-valuemin`

***

### aria-valuenow?

> `optional` **aria-valuenow**: `number`

Defines the current value for a range widget.

#### See

aria-valuetext.

#### Inherited from

`Omit.aria-valuenow`

***

### aria-valuetext?

> `optional` **aria-valuetext**: `string`

Defines the human readable text alternative of aria-valuenow for a range widget.

#### Inherited from

`Omit.aria-valuetext`

***

### autoCapitalize?

> `optional` **autoCapitalize**: `"off"` \| `"none"` \| `"on"` \| `"sentences"` \| `"words"` \| `"characters"` \| `string` & `object`

#### Inherited from

`Omit.autoCapitalize`

***

### autoCorrect?

> `optional` **autoCorrect**: `string`

#### Inherited from

`Omit.autoCorrect`

***

### autoFocus?

> `optional` **autoFocus**: `boolean`

#### Inherited from

`Omit.autoFocus`

***

### autoSave?

> `optional` **autoSave**: `string`

#### Inherited from

`Omit.autoSave`

***

### children?

> `optional` **children**: `ReactNode`

Tag content.

#### Overrides

`Omit.children`

***

### className?

> `optional` **className**: `string`

Additional CSS classes to apply.

#### Overrides

`Omit.className`

***

### color?

> `optional` **color**: `"primary"` \| `"link"` \| `"info"` \| `"success"` \| `"warning"` \| `"danger"` \| `"black"` \| `"white"` \| `"light"` \| `"dark"`

Bulma color modifier for the tag.

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

`Omit.content`

***

### contentEditable?

> `optional` **contentEditable**: `"inherit"` \| `Booleanish` \| `"plaintext-only"`

#### Inherited from

`Omit.contentEditable`

***

### contextMenu?

> `optional` **contextMenu**: `string`

#### Inherited from

`Omit.contextMenu`

***

### dangerouslySetInnerHTML?

> `optional` **dangerouslySetInnerHTML**: `object`

#### \_\_html

> **\_\_html**: `string` \| `TrustedHTML`

#### Inherited from

`Omit.dangerouslySetInnerHTML`

***

### datatype?

> `optional` **datatype**: `string`

#### Inherited from

`Omit.datatype`

***

### defaultChecked?

> `optional` **defaultChecked**: `boolean`

#### Inherited from

`Omit.defaultChecked`

***

### defaultValue?

> `optional` **defaultValue**: `string` \| `number` \| readonly `string`[]

#### Inherited from

`Omit.defaultValue`

***

### dir?

> `optional` **dir**: `string`

#### Inherited from

`Omit.dir`

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

`Omit.draggable`

***

### enterKeyHint?

> `optional` **enterKeyHint**: `"enter"` \| `"done"` \| `"go"` \| `"next"` \| `"previous"` \| `"search"` \| `"send"`

#### Inherited from

`Omit.enterKeyHint`

***

### exportparts?

> `optional` **exportparts**: `string`

#### See

[https://developer.mozilla.org/en-US/docs/Web/HTML/Global\_attributes/exportparts](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/exportparts)

#### Inherited from

`Omit.exportparts`

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

`Omit.hidden`

***

### id?

> `optional` **id**: `string`

#### Inherited from

`Omit.id`

***

### inlist?

> `optional` **inlist**: `any`

#### Inherited from

`Omit.inlist`

***

### inputMode?

> `optional` **inputMode**: `"none"` \| `"search"` \| `"text"` \| `"tel"` \| `"url"` \| `"email"` \| `"numeric"` \| `"decimal"`

Hints at the type of data that might be entered by the user while editing the element or its contents

#### See

[https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute](https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute)

#### Inherited from

`Omit.inputMode`

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

`Omit.is`

***

### isDelete?

> `optional` **isDelete**: `boolean`

Whether the tag is a delete button.

***

### isHoverable?

> `optional` **isHoverable**: `boolean`

Whether the tag is hoverable.

***

### isRounded?

> `optional` **isRounded**: `boolean`

Whether the tag should have rounded corners.

***

### itemID?

> `optional` **itemID**: `string`

#### Inherited from

`Omit.itemID`

***

### itemProp?

> `optional` **itemProp**: `string`

#### Inherited from

`Omit.itemProp`

***

### itemRef?

> `optional` **itemRef**: `string`

#### Inherited from

`Omit.itemRef`

***

### itemScope?

> `optional` **itemScope**: `boolean`

#### Inherited from

`Omit.itemScope`

***

### itemType?

> `optional` **itemType**: `string`

#### Inherited from

`Omit.itemType`

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

`Omit.lang`

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

`Omit.nonce`

***

### onAbort?

> `optional` **onAbort**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onAbort`

***

### onAbortCapture?

> `optional` **onAbortCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onAbortCapture`

***

### onAnimationEnd?

> `optional` **onAnimationEnd**: `AnimationEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onAnimationEnd`

***

### onAnimationEndCapture?

> `optional` **onAnimationEndCapture**: `AnimationEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onAnimationEndCapture`

***

### onAnimationIteration?

> `optional` **onAnimationIteration**: `AnimationEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onAnimationIteration`

***

### onAnimationIterationCapture?

> `optional` **onAnimationIterationCapture**: `AnimationEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onAnimationIterationCapture`

***

### onAnimationStart?

> `optional` **onAnimationStart**: `AnimationEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onAnimationStart`

***

### onAnimationStartCapture?

> `optional` **onAnimationStartCapture**: `AnimationEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onAnimationStartCapture`

***

### onAuxClick?

> `optional` **onAuxClick**: `MouseEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onAuxClick`

***

### onAuxClickCapture?

> `optional` **onAuxClickCapture**: `MouseEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onAuxClickCapture`

***

### onBeforeInput?

> `optional` **onBeforeInput**: `FormEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onBeforeInput`

***

### onBeforeInputCapture?

> `optional` **onBeforeInputCapture**: `FormEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onBeforeInputCapture`

***

### onBlur?

> `optional` **onBlur**: `FocusEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onBlur`

***

### onBlurCapture?

> `optional` **onBlurCapture**: `FocusEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onBlurCapture`

***

### onCanPlay?

> `optional` **onCanPlay**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onCanPlay`

***

### onCanPlayCapture?

> `optional` **onCanPlayCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onCanPlayCapture`

***

### onCanPlayThrough?

> `optional` **onCanPlayThrough**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onCanPlayThrough`

***

### onCanPlayThroughCapture?

> `optional` **onCanPlayThroughCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onCanPlayThroughCapture`

***

### onChange?

> `optional` **onChange**: `FormEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onChange`

***

### onChangeCapture?

> `optional` **onChangeCapture**: `FormEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onChangeCapture`

***

### onClick?

> `optional` **onClick**: `MouseEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onClick`

***

### onClickCapture?

> `optional` **onClickCapture**: `MouseEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onClickCapture`

***

### onCompositionEnd?

> `optional` **onCompositionEnd**: `CompositionEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onCompositionEnd`

***

### onCompositionEndCapture?

> `optional` **onCompositionEndCapture**: `CompositionEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onCompositionEndCapture`

***

### onCompositionStart?

> `optional` **onCompositionStart**: `CompositionEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onCompositionStart`

***

### onCompositionStartCapture?

> `optional` **onCompositionStartCapture**: `CompositionEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onCompositionStartCapture`

***

### onCompositionUpdate?

> `optional` **onCompositionUpdate**: `CompositionEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onCompositionUpdate`

***

### onCompositionUpdateCapture?

> `optional` **onCompositionUpdateCapture**: `CompositionEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onCompositionUpdateCapture`

***

### onContextMenu?

> `optional` **onContextMenu**: `MouseEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onContextMenu`

***

### onContextMenuCapture?

> `optional` **onContextMenuCapture**: `MouseEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onContextMenuCapture`

***

### onCopy?

> `optional` **onCopy**: `ClipboardEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onCopy`

***

### onCopyCapture?

> `optional` **onCopyCapture**: `ClipboardEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onCopyCapture`

***

### onCut?

> `optional` **onCut**: `ClipboardEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onCut`

***

### onCutCapture?

> `optional` **onCutCapture**: `ClipboardEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onCutCapture`

***

### onDelete()?

> `optional` **onDelete**: () => `void`

Callback fired when the delete button is clicked.

#### Returns

`void`

***

### onDoubleClick?

> `optional` **onDoubleClick**: `MouseEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onDoubleClick`

***

### onDoubleClickCapture?

> `optional` **onDoubleClickCapture**: `MouseEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onDoubleClickCapture`

***

### onDrag?

> `optional` **onDrag**: `DragEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onDrag`

***

### onDragCapture?

> `optional` **onDragCapture**: `DragEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onDragCapture`

***

### onDragEnd?

> `optional` **onDragEnd**: `DragEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onDragEnd`

***

### onDragEndCapture?

> `optional` **onDragEndCapture**: `DragEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onDragEndCapture`

***

### onDragEnter?

> `optional` **onDragEnter**: `DragEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onDragEnter`

***

### onDragEnterCapture?

> `optional` **onDragEnterCapture**: `DragEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onDragEnterCapture`

***

### onDragExit?

> `optional` **onDragExit**: `DragEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onDragExit`

***

### onDragExitCapture?

> `optional` **onDragExitCapture**: `DragEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onDragExitCapture`

***

### onDragLeave?

> `optional` **onDragLeave**: `DragEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onDragLeave`

***

### onDragLeaveCapture?

> `optional` **onDragLeaveCapture**: `DragEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onDragLeaveCapture`

***

### onDragOver?

> `optional` **onDragOver**: `DragEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onDragOver`

***

### onDragOverCapture?

> `optional` **onDragOverCapture**: `DragEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onDragOverCapture`

***

### onDragStart?

> `optional` **onDragStart**: `DragEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onDragStart`

***

### onDragStartCapture?

> `optional` **onDragStartCapture**: `DragEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onDragStartCapture`

***

### onDrop?

> `optional` **onDrop**: `DragEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onDrop`

***

### onDropCapture?

> `optional` **onDropCapture**: `DragEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onDropCapture`

***

### onDurationChange?

> `optional` **onDurationChange**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onDurationChange`

***

### onDurationChangeCapture?

> `optional` **onDurationChangeCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onDurationChangeCapture`

***

### onEmptied?

> `optional` **onEmptied**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onEmptied`

***

### onEmptiedCapture?

> `optional` **onEmptiedCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onEmptiedCapture`

***

### onEncrypted?

> `optional` **onEncrypted**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onEncrypted`

***

### onEncryptedCapture?

> `optional` **onEncryptedCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onEncryptedCapture`

***

### onEnded?

> `optional` **onEnded**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onEnded`

***

### onEndedCapture?

> `optional` **onEndedCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onEndedCapture`

***

### onError?

> `optional` **onError**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onError`

***

### onErrorCapture?

> `optional` **onErrorCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onErrorCapture`

***

### onFocus?

> `optional` **onFocus**: `FocusEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onFocus`

***

### onFocusCapture?

> `optional` **onFocusCapture**: `FocusEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onFocusCapture`

***

### onGotPointerCapture?

> `optional` **onGotPointerCapture**: `PointerEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onGotPointerCapture`

***

### onGotPointerCaptureCapture?

> `optional` **onGotPointerCaptureCapture**: `PointerEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onGotPointerCaptureCapture`

***

### onInput?

> `optional` **onInput**: `FormEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onInput`

***

### onInputCapture?

> `optional` **onInputCapture**: `FormEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onInputCapture`

***

### onInvalid?

> `optional` **onInvalid**: `FormEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onInvalid`

***

### onInvalidCapture?

> `optional` **onInvalidCapture**: `FormEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onInvalidCapture`

***

### onKeyDown?

> `optional` **onKeyDown**: `KeyboardEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onKeyDown`

***

### onKeyDownCapture?

> `optional` **onKeyDownCapture**: `KeyboardEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onKeyDownCapture`

***

### ~~onKeyPress?~~

> `optional` **onKeyPress**: `KeyboardEventHandler`\<`HTMLSpanElement`\>

#### Deprecated

Use `onKeyUp` or `onKeyDown` instead

#### Inherited from

`Omit.onKeyPress`

***

### ~~onKeyPressCapture?~~

> `optional` **onKeyPressCapture**: `KeyboardEventHandler`\<`HTMLSpanElement`\>

#### Deprecated

Use `onKeyUpCapture` or `onKeyDownCapture` instead

#### Inherited from

`Omit.onKeyPressCapture`

***

### onKeyUp?

> `optional` **onKeyUp**: `KeyboardEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onKeyUp`

***

### onKeyUpCapture?

> `optional` **onKeyUpCapture**: `KeyboardEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onKeyUpCapture`

***

### onLoad?

> `optional` **onLoad**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onLoad`

***

### onLoadCapture?

> `optional` **onLoadCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onLoadCapture`

***

### onLoadedData?

> `optional` **onLoadedData**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onLoadedData`

***

### onLoadedDataCapture?

> `optional` **onLoadedDataCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onLoadedDataCapture`

***

### onLoadedMetadata?

> `optional` **onLoadedMetadata**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onLoadedMetadata`

***

### onLoadedMetadataCapture?

> `optional` **onLoadedMetadataCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onLoadedMetadataCapture`

***

### onLoadStart?

> `optional` **onLoadStart**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onLoadStart`

***

### onLoadStartCapture?

> `optional` **onLoadStartCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onLoadStartCapture`

***

### onLostPointerCapture?

> `optional` **onLostPointerCapture**: `PointerEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onLostPointerCapture`

***

### onLostPointerCaptureCapture?

> `optional` **onLostPointerCaptureCapture**: `PointerEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onLostPointerCaptureCapture`

***

### onMouseDown?

> `optional` **onMouseDown**: `MouseEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onMouseDown`

***

### onMouseDownCapture?

> `optional` **onMouseDownCapture**: `MouseEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onMouseDownCapture`

***

### onMouseEnter?

> `optional` **onMouseEnter**: `MouseEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onMouseEnter`

***

### onMouseLeave?

> `optional` **onMouseLeave**: `MouseEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onMouseLeave`

***

### onMouseMove?

> `optional` **onMouseMove**: `MouseEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onMouseMove`

***

### onMouseMoveCapture?

> `optional` **onMouseMoveCapture**: `MouseEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onMouseMoveCapture`

***

### onMouseOut?

> `optional` **onMouseOut**: `MouseEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onMouseOut`

***

### onMouseOutCapture?

> `optional` **onMouseOutCapture**: `MouseEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onMouseOutCapture`

***

### onMouseOver?

> `optional` **onMouseOver**: `MouseEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onMouseOver`

***

### onMouseOverCapture?

> `optional` **onMouseOverCapture**: `MouseEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onMouseOverCapture`

***

### onMouseUp?

> `optional` **onMouseUp**: `MouseEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onMouseUp`

***

### onMouseUpCapture?

> `optional` **onMouseUpCapture**: `MouseEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onMouseUpCapture`

***

### onPaste?

> `optional` **onPaste**: `ClipboardEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onPaste`

***

### onPasteCapture?

> `optional` **onPasteCapture**: `ClipboardEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onPasteCapture`

***

### onPause?

> `optional` **onPause**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onPause`

***

### onPauseCapture?

> `optional` **onPauseCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onPauseCapture`

***

### onPlay?

> `optional` **onPlay**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onPlay`

***

### onPlayCapture?

> `optional` **onPlayCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onPlayCapture`

***

### onPlaying?

> `optional` **onPlaying**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onPlaying`

***

### onPlayingCapture?

> `optional` **onPlayingCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onPlayingCapture`

***

### onPointerCancel?

> `optional` **onPointerCancel**: `PointerEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onPointerCancel`

***

### onPointerCancelCapture?

> `optional` **onPointerCancelCapture**: `PointerEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onPointerCancelCapture`

***

### onPointerDown?

> `optional` **onPointerDown**: `PointerEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onPointerDown`

***

### onPointerDownCapture?

> `optional` **onPointerDownCapture**: `PointerEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onPointerDownCapture`

***

### onPointerEnter?

> `optional` **onPointerEnter**: `PointerEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onPointerEnter`

***

### onPointerLeave?

> `optional` **onPointerLeave**: `PointerEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onPointerLeave`

***

### onPointerMove?

> `optional` **onPointerMove**: `PointerEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onPointerMove`

***

### onPointerMoveCapture?

> `optional` **onPointerMoveCapture**: `PointerEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onPointerMoveCapture`

***

### onPointerOut?

> `optional` **onPointerOut**: `PointerEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onPointerOut`

***

### onPointerOutCapture?

> `optional` **onPointerOutCapture**: `PointerEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onPointerOutCapture`

***

### onPointerOver?

> `optional` **onPointerOver**: `PointerEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onPointerOver`

***

### onPointerOverCapture?

> `optional` **onPointerOverCapture**: `PointerEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onPointerOverCapture`

***

### onPointerUp?

> `optional` **onPointerUp**: `PointerEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onPointerUp`

***

### onPointerUpCapture?

> `optional` **onPointerUpCapture**: `PointerEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onPointerUpCapture`

***

### onProgress?

> `optional` **onProgress**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onProgress`

***

### onProgressCapture?

> `optional` **onProgressCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onProgressCapture`

***

### onRateChange?

> `optional` **onRateChange**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onRateChange`

***

### onRateChangeCapture?

> `optional` **onRateChangeCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onRateChangeCapture`

***

### onReset?

> `optional` **onReset**: `FormEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onReset`

***

### onResetCapture?

> `optional` **onResetCapture**: `FormEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onResetCapture`

***

### onScroll?

> `optional` **onScroll**: `UIEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onScroll`

***

### onScrollCapture?

> `optional` **onScrollCapture**: `UIEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onScrollCapture`

***

### onSeeked?

> `optional` **onSeeked**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onSeeked`

***

### onSeekedCapture?

> `optional` **onSeekedCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onSeekedCapture`

***

### onSeeking?

> `optional` **onSeeking**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onSeeking`

***

### onSeekingCapture?

> `optional` **onSeekingCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onSeekingCapture`

***

### onSelect?

> `optional` **onSelect**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onSelect`

***

### onSelectCapture?

> `optional` **onSelectCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onSelectCapture`

***

### onStalled?

> `optional` **onStalled**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onStalled`

***

### onStalledCapture?

> `optional` **onStalledCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onStalledCapture`

***

### onSubmit?

> `optional` **onSubmit**: `FormEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onSubmit`

***

### onSubmitCapture?

> `optional` **onSubmitCapture**: `FormEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onSubmitCapture`

***

### onSuspend?

> `optional` **onSuspend**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onSuspend`

***

### onSuspendCapture?

> `optional` **onSuspendCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onSuspendCapture`

***

### onTimeUpdate?

> `optional` **onTimeUpdate**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onTimeUpdate`

***

### onTimeUpdateCapture?

> `optional` **onTimeUpdateCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onTimeUpdateCapture`

***

### onTouchCancel?

> `optional` **onTouchCancel**: `TouchEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onTouchCancel`

***

### onTouchCancelCapture?

> `optional` **onTouchCancelCapture**: `TouchEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onTouchCancelCapture`

***

### onTouchEnd?

> `optional` **onTouchEnd**: `TouchEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onTouchEnd`

***

### onTouchEndCapture?

> `optional` **onTouchEndCapture**: `TouchEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onTouchEndCapture`

***

### onTouchMove?

> `optional` **onTouchMove**: `TouchEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onTouchMove`

***

### onTouchMoveCapture?

> `optional` **onTouchMoveCapture**: `TouchEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onTouchMoveCapture`

***

### onTouchStart?

> `optional` **onTouchStart**: `TouchEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onTouchStart`

***

### onTouchStartCapture?

> `optional` **onTouchStartCapture**: `TouchEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onTouchStartCapture`

***

### onTransitionEnd?

> `optional` **onTransitionEnd**: `TransitionEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onTransitionEnd`

***

### onTransitionEndCapture?

> `optional` **onTransitionEndCapture**: `TransitionEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onTransitionEndCapture`

***

### onVolumeChange?

> `optional` **onVolumeChange**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onVolumeChange`

***

### onVolumeChangeCapture?

> `optional` **onVolumeChangeCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onVolumeChangeCapture`

***

### onWaiting?

> `optional` **onWaiting**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onWaiting`

***

### onWaitingCapture?

> `optional` **onWaitingCapture**: `ReactEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onWaitingCapture`

***

### onWheel?

> `optional` **onWheel**: `WheelEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onWheel`

***

### onWheelCapture?

> `optional` **onWheelCapture**: `WheelEventHandler`\<`HTMLSpanElement`\>

#### Inherited from

`Omit.onWheelCapture`

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

`Omit.part`

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

`Omit.prefix`

***

### property?

> `optional` **property**: `string`

#### Inherited from

`Omit.property`

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

`Omit.radioGroup`

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

`Omit.rel`

***

### resource?

> `optional` **resource**: `string`

#### Inherited from

`Omit.resource`

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

`Omit.results`

***

### rev?

> `optional` **rev**: `string`

#### Inherited from

`Omit.rev`

***

### role?

> `optional` **role**: `AriaRole`

#### Inherited from

`Omit.role`

***

### security?

> `optional` **security**: `string`

#### Inherited from

`Omit.security`

***

### shadow?

> `optional` **shadow**: `"shadowless"`

Shadow style (e.g., 'shadowless').

#### Inherited from

`Omit.shadow`

***

### size?

> `optional` **size**: `"normal"` \| `"medium"` \| `"large"`

Size modifier for the tag.

***

### slot?

> `optional` **slot**: `string`

#### Inherited from

`Omit.slot`

***

### spellCheck?

> `optional` **spellCheck**: `Booleanish`

#### Inherited from

`Omit.spellCheck`

***

### style?

> `optional` **style**: `CSSProperties`

#### Inherited from

`Omit.style`

***

### suppressContentEditableWarning?

> `optional` **suppressContentEditableWarning**: `boolean`

#### Inherited from

`Omit.suppressContentEditableWarning`

***

### suppressHydrationWarning?

> `optional` **suppressHydrationWarning**: `boolean`

#### Inherited from

`Omit.suppressHydrationWarning`

***

### tabIndex?

> `optional` **tabIndex**: `number`

#### Inherited from

`Omit.tabIndex`

***

### textAlign?

> `optional` **textAlign**: `"centered"` \| `"justified"` \| `"left"` \| `"right"`

Text alignment (e.g., 'centered', 'left').

#### Inherited from

`Omit.textAlign`

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

`Omit.title`

***

### translate?

> `optional` **translate**: `"yes"` \| `"no"`

#### Inherited from

`Omit.translate`

***

### typeof?

> `optional` **typeof**: `string`

#### Inherited from

`Omit.typeof`

***

### unselectable?

> `optional` **unselectable**: `"off"` \| `"on"`

#### Inherited from

`Omit.unselectable`

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

`Omit.vocab`
