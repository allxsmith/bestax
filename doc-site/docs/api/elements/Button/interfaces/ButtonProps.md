# Interface: ButtonProps

Button component for rendering a styled button element.

Supports Bulma-style modifiers for color, size, and various states, plus additional Bulma helper classes.

## Param

Props for the Button component.

## Param

Bulma color modifier.

## Param

Bulma size modifier.

## Param

Use the light color variant.

## Param

Use rounded corners.

## Param

Show a loading spinner.

## Param

Make the button static (unclickable).

## Param

Make the button take the full width of its container.

## Param

Use the outlined style.

## Param

Use the inverted color scheme.

## Param

Apply the focused style.

## Param

Apply the active style.

## Param

Apply the hovered style.

## Param

Disable the button.

## Param

Additional CSS classes.

## Param

Button content.

## Param

Text color (Bulma color or 'inherit'/'current').

## Param

Background color (Bulma color or 'inherit'/'current').

## Extends

- `ButtonHTMLAttributes`\<`HTMLButtonElement`\>.`Omit`\<[`BulmaClassesProps`](../../../helpers/useBulmaClasses/interfaces/BulmaClassesProps.md), `"color"` \| `"backgroundColor"` \| `"size"`\>

## Properties

### about?

> `optional` **about**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.about`

***

### accessKey?

> `optional` **accessKey**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.accessKey`

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

`React.ButtonHTMLAttributes.aria-activedescendant`

***

### aria-atomic?

> `optional` **aria-atomic**: `Booleanish`

Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute.

#### Inherited from

`React.ButtonHTMLAttributes.aria-atomic`

***

### aria-autocomplete?

> `optional` **aria-autocomplete**: `"inline"` \| `"none"` \| `"list"` \| `"both"`

Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be
presented if they are made.

#### Inherited from

`React.ButtonHTMLAttributes.aria-autocomplete`

***

### aria-braillelabel?

> `optional` **aria-braillelabel**: `string`

Defines a string value that labels the current element, which is intended to be converted into Braille.

#### See

aria-label.

#### Inherited from

`React.ButtonHTMLAttributes.aria-braillelabel`

***

### aria-brailleroledescription?

> `optional` **aria-brailleroledescription**: `string`

Defines a human-readable, author-localized abbreviated description for the role of an element, which is intended to be converted into Braille.

#### See

aria-roledescription.

#### Inherited from

`React.ButtonHTMLAttributes.aria-brailleroledescription`

***

### aria-busy?

> `optional` **aria-busy**: `Booleanish`

#### Inherited from

`React.ButtonHTMLAttributes.aria-busy`

***

### aria-checked?

> `optional` **aria-checked**: `boolean` \| `"true"` \| `"false"` \| `"mixed"`

Indicates the current "checked" state of checkboxes, radio buttons, and other widgets.

#### See

 - aria-pressed
 - aria-selected.

#### Inherited from

`React.ButtonHTMLAttributes.aria-checked`

***

### aria-colcount?

> `optional` **aria-colcount**: `number`

Defines the total number of columns in a table, grid, or treegrid.

#### See

aria-colindex.

#### Inherited from

`React.ButtonHTMLAttributes.aria-colcount`

***

### aria-colindex?

> `optional` **aria-colindex**: `number`

Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid.

#### See

 - aria-colcount
 - aria-colspan.

#### Inherited from

`React.ButtonHTMLAttributes.aria-colindex`

***

### aria-colindextext?

> `optional` **aria-colindextext**: `string`

Defines a human readable text alternative of aria-colindex.

#### See

aria-rowindextext.

#### Inherited from

`React.ButtonHTMLAttributes.aria-colindextext`

***

### aria-colspan?

> `optional` **aria-colspan**: `number`

Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid.

#### See

 - aria-colindex
 - aria-rowspan.

#### Inherited from

`React.ButtonHTMLAttributes.aria-colspan`

***

### aria-controls?

> `optional` **aria-controls**: `string`

Identifies the element (or elements) whose contents or presence are controlled by the current element.

#### See

aria-owns.

#### Inherited from

`React.ButtonHTMLAttributes.aria-controls`

***

### aria-current?

> `optional` **aria-current**: `boolean` \| `"true"` \| `"false"` \| `"page"` \| `"step"` \| `"location"` \| `"date"` \| `"time"`

Indicates the element that represents the current item within a container or set of related elements.

#### Inherited from

`React.ButtonHTMLAttributes.aria-current`

***

### aria-describedby?

> `optional` **aria-describedby**: `string`

Identifies the element (or elements) that describes the object.

#### See

aria-labelledby

#### Inherited from

`React.ButtonHTMLAttributes.aria-describedby`

***

### aria-description?

> `optional` **aria-description**: `string`

Defines a string value that describes or annotates the current element.

#### See

related aria-describedby.

#### Inherited from

`React.ButtonHTMLAttributes.aria-description`

***

### aria-details?

> `optional` **aria-details**: `string`

Identifies the element that provides a detailed, extended description for the object.

#### See

aria-describedby.

#### Inherited from

`React.ButtonHTMLAttributes.aria-details`

***

### aria-disabled?

> `optional` **aria-disabled**: `Booleanish`

Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.

#### See

 - aria-hidden
 - aria-readonly.

#### Inherited from

`React.ButtonHTMLAttributes.aria-disabled`

***

### ~~aria-dropeffect?~~

> `optional` **aria-dropeffect**: `"link"` \| `"none"` \| `"copy"` \| `"execute"` \| `"move"` \| `"popup"`

Indicates what functions can be performed when a dragged object is released on the drop target.

#### Deprecated

in ARIA 1.1

#### Inherited from

`React.ButtonHTMLAttributes.aria-dropeffect`

***

### aria-errormessage?

> `optional` **aria-errormessage**: `string`

Identifies the element that provides an error message for the object.

#### See

 - aria-invalid
 - aria-describedby.

#### Inherited from

`React.ButtonHTMLAttributes.aria-errormessage`

***

### aria-expanded?

> `optional` **aria-expanded**: `Booleanish`

Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed.

#### Inherited from

`React.ButtonHTMLAttributes.aria-expanded`

***

### aria-flowto?

> `optional` **aria-flowto**: `string`

Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion,
allows assistive technology to override the general default of reading in document source order.

#### Inherited from

`React.ButtonHTMLAttributes.aria-flowto`

***

### ~~aria-grabbed?~~

> `optional` **aria-grabbed**: `Booleanish`

Indicates an element's "grabbed" state in a drag-and-drop operation.

#### Deprecated

in ARIA 1.1

#### Inherited from

`React.ButtonHTMLAttributes.aria-grabbed`

***

### aria-haspopup?

> `optional` **aria-haspopup**: `boolean` \| `"true"` \| `"false"` \| `"dialog"` \| `"grid"` \| `"listbox"` \| `"menu"` \| `"tree"`

Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element.

#### Inherited from

`React.ButtonHTMLAttributes.aria-haspopup`

***

### aria-hidden?

> `optional` **aria-hidden**: `Booleanish`

Indicates whether the element is exposed to an accessibility API.

#### See

aria-disabled.

#### Inherited from

`React.ButtonHTMLAttributes.aria-hidden`

***

### aria-invalid?

> `optional` **aria-invalid**: `boolean` \| `"true"` \| `"false"` \| `"grammar"` \| `"spelling"`

Indicates the entered value does not conform to the format expected by the application.

#### See

aria-errormessage.

#### Inherited from

`React.ButtonHTMLAttributes.aria-invalid`

***

### aria-keyshortcuts?

> `optional` **aria-keyshortcuts**: `string`

Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element.

#### Inherited from

`React.ButtonHTMLAttributes.aria-keyshortcuts`

***

### aria-label?

> `optional` **aria-label**: `string`

Defines a string value that labels the current element.

#### See

aria-labelledby.

#### Inherited from

`React.ButtonHTMLAttributes.aria-label`

***

### aria-labelledby?

> `optional` **aria-labelledby**: `string`

Identifies the element (or elements) that labels the current element.

#### See

aria-describedby.

#### Inherited from

`React.ButtonHTMLAttributes.aria-labelledby`

***

### aria-level?

> `optional` **aria-level**: `number`

Defines the hierarchical level of an element within a structure.

#### Inherited from

`React.ButtonHTMLAttributes.aria-level`

***

### aria-live?

> `optional` **aria-live**: `"off"` \| `"assertive"` \| `"polite"`

Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region.

#### Inherited from

`React.ButtonHTMLAttributes.aria-live`

***

### aria-modal?

> `optional` **aria-modal**: `Booleanish`

Indicates whether an element is modal when displayed.

#### Inherited from

`React.ButtonHTMLAttributes.aria-modal`

***

### aria-multiline?

> `optional` **aria-multiline**: `Booleanish`

Indicates whether a text box accepts multiple lines of input or only a single line.

#### Inherited from

`React.ButtonHTMLAttributes.aria-multiline`

***

### aria-multiselectable?

> `optional` **aria-multiselectable**: `Booleanish`

Indicates that the user may select more than one item from the current selectable descendants.

#### Inherited from

`React.ButtonHTMLAttributes.aria-multiselectable`

***

### aria-orientation?

> `optional` **aria-orientation**: `"horizontal"` \| `"vertical"`

Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous.

#### Inherited from

`React.ButtonHTMLAttributes.aria-orientation`

***

### aria-owns?

> `optional` **aria-owns**: `string`

Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship
between DOM elements where the DOM hierarchy cannot be used to represent the relationship.

#### See

aria-controls.

#### Inherited from

`React.ButtonHTMLAttributes.aria-owns`

***

### aria-placeholder?

> `optional` **aria-placeholder**: `string`

Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value.
A hint could be a sample value or a brief description of the expected format.

#### Inherited from

`React.ButtonHTMLAttributes.aria-placeholder`

***

### aria-posinset?

> `optional` **aria-posinset**: `number`

Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.

#### See

aria-setsize.

#### Inherited from

`React.ButtonHTMLAttributes.aria-posinset`

***

### aria-pressed?

> `optional` **aria-pressed**: `boolean` \| `"true"` \| `"false"` \| `"mixed"`

Indicates the current "pressed" state of toggle buttons.

#### See

 - aria-checked
 - aria-selected.

#### Inherited from

`React.ButtonHTMLAttributes.aria-pressed`

***

### aria-readonly?

> `optional` **aria-readonly**: `Booleanish`

Indicates that the element is not editable, but is otherwise operable.

#### See

aria-disabled.

#### Inherited from

`React.ButtonHTMLAttributes.aria-readonly`

***

### aria-relevant?

> `optional` **aria-relevant**: `"text"` \| `"additions"` \| `"additions removals"` \| `"additions text"` \| `"all"` \| `"removals"` \| `"removals additions"` \| `"removals text"` \| `"text additions"` \| `"text removals"`

Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified.

#### See

aria-atomic.

#### Inherited from

`React.ButtonHTMLAttributes.aria-relevant`

***

### aria-required?

> `optional` **aria-required**: `Booleanish`

Indicates that user input is required on the element before a form may be submitted.

#### Inherited from

`React.ButtonHTMLAttributes.aria-required`

***

### aria-roledescription?

> `optional` **aria-roledescription**: `string`

Defines a human-readable, author-localized description for the role of an element.

#### Inherited from

`React.ButtonHTMLAttributes.aria-roledescription`

***

### aria-rowcount?

> `optional` **aria-rowcount**: `number`

Defines the total number of rows in a table, grid, or treegrid.

#### See

aria-rowindex.

#### Inherited from

`React.ButtonHTMLAttributes.aria-rowcount`

***

### aria-rowindex?

> `optional` **aria-rowindex**: `number`

Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid.

#### See

 - aria-rowcount
 - aria-rowspan.

#### Inherited from

`React.ButtonHTMLAttributes.aria-rowindex`

***

### aria-rowindextext?

> `optional` **aria-rowindextext**: `string`

Defines a human readable text alternative of aria-rowindex.

#### See

aria-colindextext.

#### Inherited from

`React.ButtonHTMLAttributes.aria-rowindextext`

***

### aria-rowspan?

> `optional` **aria-rowspan**: `number`

Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.

#### See

 - aria-rowindex
 - aria-colspan.

#### Inherited from

`React.ButtonHTMLAttributes.aria-rowspan`

***

### aria-selected?

> `optional` **aria-selected**: `Booleanish`

Indicates the current "selected" state of various widgets.

#### See

 - aria-checked
 - aria-pressed.

#### Inherited from

`React.ButtonHTMLAttributes.aria-selected`

***

### aria-setsize?

> `optional` **aria-setsize**: `number`

Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.

#### See

aria-posinset.

#### Inherited from

`React.ButtonHTMLAttributes.aria-setsize`

***

### aria-sort?

> `optional` **aria-sort**: `"none"` \| `"ascending"` \| `"descending"` \| `"other"`

Indicates if items in a table or grid are sorted in ascending or descending order.

#### Inherited from

`React.ButtonHTMLAttributes.aria-sort`

***

### aria-valuemax?

> `optional` **aria-valuemax**: `number`

Defines the maximum allowed value for a range widget.

#### Inherited from

`React.ButtonHTMLAttributes.aria-valuemax`

***

### aria-valuemin?

> `optional` **aria-valuemin**: `number`

Defines the minimum allowed value for a range widget.

#### Inherited from

`React.ButtonHTMLAttributes.aria-valuemin`

***

### aria-valuenow?

> `optional` **aria-valuenow**: `number`

Defines the current value for a range widget.

#### See

aria-valuetext.

#### Inherited from

`React.ButtonHTMLAttributes.aria-valuenow`

***

### aria-valuetext?

> `optional` **aria-valuetext**: `string`

Defines the human readable text alternative of aria-valuenow for a range widget.

#### Inherited from

`React.ButtonHTMLAttributes.aria-valuetext`

***

### autoCapitalize?

> `optional` **autoCapitalize**: `"off"` \| `"none"` \| `"on"` \| `"sentences"` \| `"words"` \| `"characters"` \| `string` & `object`

#### Inherited from

`React.ButtonHTMLAttributes.autoCapitalize`

***

### autoCorrect?

> `optional` **autoCorrect**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.autoCorrect`

***

### autoFocus?

> `optional` **autoFocus**: `boolean`

#### Inherited from

`React.ButtonHTMLAttributes.autoFocus`

***

### autoSave?

> `optional` **autoSave**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.autoSave`

***

### bgColor?

> `optional` **bgColor**: `"primary"` \| `"link"` \| `"info"` \| `"success"` \| `"warning"` \| `"danger"` \| `"black"` \| `"black-bis"` \| `"black-ter"` \| `"grey-darker"` \| `"grey-dark"` \| `"grey"` \| `"grey-light"` \| `"grey-lighter"` \| `"white"` \| `"light"` \| `"dark"` \| `"inherit"` \| `"current"`

***

### children?

> `optional` **children**: `ReactNode`

#### Inherited from

`React.ButtonHTMLAttributes.children`

***

### className?

> `optional` **className**: `string`

#### Overrides

`React.ButtonHTMLAttributes.className`

***

### color?

> `optional` **color**: `"primary"` \| `"link"` \| `"info"` \| `"success"` \| `"warning"` \| `"danger"`

#### Overrides

`React.ButtonHTMLAttributes.color`

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

`React.ButtonHTMLAttributes.content`

***

### contentEditable?

> `optional` **contentEditable**: `"inherit"` \| `Booleanish` \| `"plaintext-only"`

#### Inherited from

`React.ButtonHTMLAttributes.contentEditable`

***

### contextMenu?

> `optional` **contextMenu**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.contextMenu`

***

### dangerouslySetInnerHTML?

> `optional` **dangerouslySetInnerHTML**: `object`

#### \_\_html

> **\_\_html**: `string` \| `TrustedHTML`

#### Inherited from

`React.ButtonHTMLAttributes.dangerouslySetInnerHTML`

***

### datatype?

> `optional` **datatype**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.datatype`

***

### defaultChecked?

> `optional` **defaultChecked**: `boolean`

#### Inherited from

`React.ButtonHTMLAttributes.defaultChecked`

***

### defaultValue?

> `optional` **defaultValue**: `string` \| `number` \| readonly `string`[]

#### Inherited from

`React.ButtonHTMLAttributes.defaultValue`

***

### dir?

> `optional` **dir**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.dir`

***

### disabled?

> `optional` **disabled**: `boolean`

#### Inherited from

`React.ButtonHTMLAttributes.disabled`

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

`React.ButtonHTMLAttributes.draggable`

***

### enterKeyHint?

> `optional` **enterKeyHint**: `"enter"` \| `"done"` \| `"go"` \| `"next"` \| `"previous"` \| `"search"` \| `"send"`

#### Inherited from

`React.ButtonHTMLAttributes.enterKeyHint`

***

### exportparts?

> `optional` **exportparts**: `string`

#### See

[https://developer.mozilla.org/en-US/docs/Web/HTML/Global\_attributes/exportparts](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/exportparts)

#### Inherited from

`React.ButtonHTMLAttributes.exportparts`

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

### form?

> `optional` **form**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.form`

***

### formAction?

> `optional` **formAction**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.formAction`

***

### formEncType?

> `optional` **formEncType**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.formEncType`

***

### formMethod?

> `optional` **formMethod**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.formMethod`

***

### formNoValidate?

> `optional` **formNoValidate**: `boolean`

#### Inherited from

`React.ButtonHTMLAttributes.formNoValidate`

***

### formTarget?

> `optional` **formTarget**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.formTarget`

***

### hidden?

> `optional` **hidden**: `boolean`

#### Inherited from

`React.ButtonHTMLAttributes.hidden`

***

### id?

> `optional` **id**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.id`

***

### inlist?

> `optional` **inlist**: `any`

#### Inherited from

`React.ButtonHTMLAttributes.inlist`

***

### inputMode?

> `optional` **inputMode**: `"none"` \| `"search"` \| `"text"` \| `"tel"` \| `"url"` \| `"email"` \| `"numeric"` \| `"decimal"`

Hints at the type of data that might be entered by the user while editing the element or its contents

#### See

[https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute](https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute)

#### Inherited from

`React.ButtonHTMLAttributes.inputMode`

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

`React.ButtonHTMLAttributes.is`

***

### isActive?

> `optional` **isActive**: `boolean`

***

### isDisabled?

> `optional` **isDisabled**: `boolean`

***

### isFocused?

> `optional` **isFocused**: `boolean`

***

### isFullWidth?

> `optional` **isFullWidth**: `boolean`

***

### isHovered?

> `optional` **isHovered**: `boolean`

***

### isInverted?

> `optional` **isInverted**: `boolean`

***

### isLight?

> `optional` **isLight**: `boolean`

***

### isLoading?

> `optional` **isLoading**: `boolean`

***

### isOutlined?

> `optional` **isOutlined**: `boolean`

***

### isRounded?

> `optional` **isRounded**: `boolean`

***

### isStatic?

> `optional` **isStatic**: `boolean`

***

### itemID?

> `optional` **itemID**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.itemID`

***

### itemProp?

> `optional` **itemProp**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.itemProp`

***

### itemRef?

> `optional` **itemRef**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.itemRef`

***

### itemScope?

> `optional` **itemScope**: `boolean`

#### Inherited from

`React.ButtonHTMLAttributes.itemScope`

***

### itemType?

> `optional` **itemType**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.itemType`

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

`React.ButtonHTMLAttributes.lang`

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

### name?

> `optional` **name**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.name`

***

### nonce?

> `optional` **nonce**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.nonce`

***

### onAbort?

> `optional` **onAbort**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onAbort`

***

### onAbortCapture?

> `optional` **onAbortCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onAbortCapture`

***

### onAnimationEnd?

> `optional` **onAnimationEnd**: `AnimationEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onAnimationEnd`

***

### onAnimationEndCapture?

> `optional` **onAnimationEndCapture**: `AnimationEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onAnimationEndCapture`

***

### onAnimationIteration?

> `optional` **onAnimationIteration**: `AnimationEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onAnimationIteration`

***

### onAnimationIterationCapture?

> `optional` **onAnimationIterationCapture**: `AnimationEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onAnimationIterationCapture`

***

### onAnimationStart?

> `optional` **onAnimationStart**: `AnimationEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onAnimationStart`

***

### onAnimationStartCapture?

> `optional` **onAnimationStartCapture**: `AnimationEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onAnimationStartCapture`

***

### onAuxClick?

> `optional` **onAuxClick**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onAuxClick`

***

### onAuxClickCapture?

> `optional` **onAuxClickCapture**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onAuxClickCapture`

***

### onBeforeInput?

> `optional` **onBeforeInput**: `FormEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onBeforeInput`

***

### onBeforeInputCapture?

> `optional` **onBeforeInputCapture**: `FormEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onBeforeInputCapture`

***

### onBlur?

> `optional` **onBlur**: `FocusEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onBlur`

***

### onBlurCapture?

> `optional` **onBlurCapture**: `FocusEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onBlurCapture`

***

### onCanPlay?

> `optional` **onCanPlay**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onCanPlay`

***

### onCanPlayCapture?

> `optional` **onCanPlayCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onCanPlayCapture`

***

### onCanPlayThrough?

> `optional` **onCanPlayThrough**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onCanPlayThrough`

***

### onCanPlayThroughCapture?

> `optional` **onCanPlayThroughCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onCanPlayThroughCapture`

***

### onChange?

> `optional` **onChange**: `FormEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onChange`

***

### onChangeCapture?

> `optional` **onChangeCapture**: `FormEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onChangeCapture`

***

### onClick?

> `optional` **onClick**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onClick`

***

### onClickCapture?

> `optional` **onClickCapture**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onClickCapture`

***

### onCompositionEnd?

> `optional` **onCompositionEnd**: `CompositionEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onCompositionEnd`

***

### onCompositionEndCapture?

> `optional` **onCompositionEndCapture**: `CompositionEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onCompositionEndCapture`

***

### onCompositionStart?

> `optional` **onCompositionStart**: `CompositionEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onCompositionStart`

***

### onCompositionStartCapture?

> `optional` **onCompositionStartCapture**: `CompositionEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onCompositionStartCapture`

***

### onCompositionUpdate?

> `optional` **onCompositionUpdate**: `CompositionEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onCompositionUpdate`

***

### onCompositionUpdateCapture?

> `optional` **onCompositionUpdateCapture**: `CompositionEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onCompositionUpdateCapture`

***

### onContextMenu?

> `optional` **onContextMenu**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onContextMenu`

***

### onContextMenuCapture?

> `optional` **onContextMenuCapture**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onContextMenuCapture`

***

### onCopy?

> `optional` **onCopy**: `ClipboardEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onCopy`

***

### onCopyCapture?

> `optional` **onCopyCapture**: `ClipboardEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onCopyCapture`

***

### onCut?

> `optional` **onCut**: `ClipboardEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onCut`

***

### onCutCapture?

> `optional` **onCutCapture**: `ClipboardEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onCutCapture`

***

### onDoubleClick?

> `optional` **onDoubleClick**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onDoubleClick`

***

### onDoubleClickCapture?

> `optional` **onDoubleClickCapture**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onDoubleClickCapture`

***

### onDrag?

> `optional` **onDrag**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onDrag`

***

### onDragCapture?

> `optional` **onDragCapture**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onDragCapture`

***

### onDragEnd?

> `optional` **onDragEnd**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onDragEnd`

***

### onDragEndCapture?

> `optional` **onDragEndCapture**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onDragEndCapture`

***

### onDragEnter?

> `optional` **onDragEnter**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onDragEnter`

***

### onDragEnterCapture?

> `optional` **onDragEnterCapture**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onDragEnterCapture`

***

### onDragExit?

> `optional` **onDragExit**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onDragExit`

***

### onDragExitCapture?

> `optional` **onDragExitCapture**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onDragExitCapture`

***

### onDragLeave?

> `optional` **onDragLeave**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onDragLeave`

***

### onDragLeaveCapture?

> `optional` **onDragLeaveCapture**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onDragLeaveCapture`

***

### onDragOver?

> `optional` **onDragOver**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onDragOver`

***

### onDragOverCapture?

> `optional` **onDragOverCapture**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onDragOverCapture`

***

### onDragStart?

> `optional` **onDragStart**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onDragStart`

***

### onDragStartCapture?

> `optional` **onDragStartCapture**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onDragStartCapture`

***

### onDrop?

> `optional` **onDrop**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onDrop`

***

### onDropCapture?

> `optional` **onDropCapture**: `DragEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onDropCapture`

***

### onDurationChange?

> `optional` **onDurationChange**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onDurationChange`

***

### onDurationChangeCapture?

> `optional` **onDurationChangeCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onDurationChangeCapture`

***

### onEmptied?

> `optional` **onEmptied**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onEmptied`

***

### onEmptiedCapture?

> `optional` **onEmptiedCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onEmptiedCapture`

***

### onEncrypted?

> `optional` **onEncrypted**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onEncrypted`

***

### onEncryptedCapture?

> `optional` **onEncryptedCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onEncryptedCapture`

***

### onEnded?

> `optional` **onEnded**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onEnded`

***

### onEndedCapture?

> `optional` **onEndedCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onEndedCapture`

***

### onError?

> `optional` **onError**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onError`

***

### onErrorCapture?

> `optional` **onErrorCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onErrorCapture`

***

### onFocus?

> `optional` **onFocus**: `FocusEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onFocus`

***

### onFocusCapture?

> `optional` **onFocusCapture**: `FocusEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onFocusCapture`

***

### onGotPointerCapture?

> `optional` **onGotPointerCapture**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onGotPointerCapture`

***

### onGotPointerCaptureCapture?

> `optional` **onGotPointerCaptureCapture**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onGotPointerCaptureCapture`

***

### onInput?

> `optional` **onInput**: `FormEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onInput`

***

### onInputCapture?

> `optional` **onInputCapture**: `FormEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onInputCapture`

***

### onInvalid?

> `optional` **onInvalid**: `FormEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onInvalid`

***

### onInvalidCapture?

> `optional` **onInvalidCapture**: `FormEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onInvalidCapture`

***

### onKeyDown?

> `optional` **onKeyDown**: `KeyboardEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onKeyDown`

***

### onKeyDownCapture?

> `optional` **onKeyDownCapture**: `KeyboardEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onKeyDownCapture`

***

### ~~onKeyPress?~~

> `optional` **onKeyPress**: `KeyboardEventHandler`\<`HTMLButtonElement`\>

#### Deprecated

Use `onKeyUp` or `onKeyDown` instead

#### Inherited from

`React.ButtonHTMLAttributes.onKeyPress`

***

### ~~onKeyPressCapture?~~

> `optional` **onKeyPressCapture**: `KeyboardEventHandler`\<`HTMLButtonElement`\>

#### Deprecated

Use `onKeyUpCapture` or `onKeyDownCapture` instead

#### Inherited from

`React.ButtonHTMLAttributes.onKeyPressCapture`

***

### onKeyUp?

> `optional` **onKeyUp**: `KeyboardEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onKeyUp`

***

### onKeyUpCapture?

> `optional` **onKeyUpCapture**: `KeyboardEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onKeyUpCapture`

***

### onLoad?

> `optional` **onLoad**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onLoad`

***

### onLoadCapture?

> `optional` **onLoadCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onLoadCapture`

***

### onLoadedData?

> `optional` **onLoadedData**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onLoadedData`

***

### onLoadedDataCapture?

> `optional` **onLoadedDataCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onLoadedDataCapture`

***

### onLoadedMetadata?

> `optional` **onLoadedMetadata**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onLoadedMetadata`

***

### onLoadedMetadataCapture?

> `optional` **onLoadedMetadataCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onLoadedMetadataCapture`

***

### onLoadStart?

> `optional` **onLoadStart**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onLoadStart`

***

### onLoadStartCapture?

> `optional` **onLoadStartCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onLoadStartCapture`

***

### onLostPointerCapture?

> `optional` **onLostPointerCapture**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onLostPointerCapture`

***

### onLostPointerCaptureCapture?

> `optional` **onLostPointerCaptureCapture**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onLostPointerCaptureCapture`

***

### onMouseDown?

> `optional` **onMouseDown**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onMouseDown`

***

### onMouseDownCapture?

> `optional` **onMouseDownCapture**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onMouseDownCapture`

***

### onMouseEnter?

> `optional` **onMouseEnter**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onMouseEnter`

***

### onMouseLeave?

> `optional` **onMouseLeave**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onMouseLeave`

***

### onMouseMove?

> `optional` **onMouseMove**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onMouseMove`

***

### onMouseMoveCapture?

> `optional` **onMouseMoveCapture**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onMouseMoveCapture`

***

### onMouseOut?

> `optional` **onMouseOut**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onMouseOut`

***

### onMouseOutCapture?

> `optional` **onMouseOutCapture**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onMouseOutCapture`

***

### onMouseOver?

> `optional` **onMouseOver**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onMouseOver`

***

### onMouseOverCapture?

> `optional` **onMouseOverCapture**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onMouseOverCapture`

***

### onMouseUp?

> `optional` **onMouseUp**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onMouseUp`

***

### onMouseUpCapture?

> `optional` **onMouseUpCapture**: `MouseEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onMouseUpCapture`

***

### onPaste?

> `optional` **onPaste**: `ClipboardEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onPaste`

***

### onPasteCapture?

> `optional` **onPasteCapture**: `ClipboardEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onPasteCapture`

***

### onPause?

> `optional` **onPause**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onPause`

***

### onPauseCapture?

> `optional` **onPauseCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onPauseCapture`

***

### onPlay?

> `optional` **onPlay**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onPlay`

***

### onPlayCapture?

> `optional` **onPlayCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onPlayCapture`

***

### onPlaying?

> `optional` **onPlaying**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onPlaying`

***

### onPlayingCapture?

> `optional` **onPlayingCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onPlayingCapture`

***

### onPointerCancel?

> `optional` **onPointerCancel**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onPointerCancel`

***

### onPointerCancelCapture?

> `optional` **onPointerCancelCapture**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onPointerCancelCapture`

***

### onPointerDown?

> `optional` **onPointerDown**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onPointerDown`

***

### onPointerDownCapture?

> `optional` **onPointerDownCapture**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onPointerDownCapture`

***

### onPointerEnter?

> `optional` **onPointerEnter**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onPointerEnter`

***

### onPointerLeave?

> `optional` **onPointerLeave**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onPointerLeave`

***

### onPointerMove?

> `optional` **onPointerMove**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onPointerMove`

***

### onPointerMoveCapture?

> `optional` **onPointerMoveCapture**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onPointerMoveCapture`

***

### onPointerOut?

> `optional` **onPointerOut**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onPointerOut`

***

### onPointerOutCapture?

> `optional` **onPointerOutCapture**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onPointerOutCapture`

***

### onPointerOver?

> `optional` **onPointerOver**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onPointerOver`

***

### onPointerOverCapture?

> `optional` **onPointerOverCapture**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onPointerOverCapture`

***

### onPointerUp?

> `optional` **onPointerUp**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onPointerUp`

***

### onPointerUpCapture?

> `optional` **onPointerUpCapture**: `PointerEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onPointerUpCapture`

***

### onProgress?

> `optional` **onProgress**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onProgress`

***

### onProgressCapture?

> `optional` **onProgressCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onProgressCapture`

***

### onRateChange?

> `optional` **onRateChange**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onRateChange`

***

### onRateChangeCapture?

> `optional` **onRateChangeCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onRateChangeCapture`

***

### onReset?

> `optional` **onReset**: `FormEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onReset`

***

### onResetCapture?

> `optional` **onResetCapture**: `FormEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onResetCapture`

***

### onScroll?

> `optional` **onScroll**: `UIEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onScroll`

***

### onScrollCapture?

> `optional` **onScrollCapture**: `UIEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onScrollCapture`

***

### onSeeked?

> `optional` **onSeeked**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onSeeked`

***

### onSeekedCapture?

> `optional` **onSeekedCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onSeekedCapture`

***

### onSeeking?

> `optional` **onSeeking**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onSeeking`

***

### onSeekingCapture?

> `optional` **onSeekingCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onSeekingCapture`

***

### onSelect?

> `optional` **onSelect**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onSelect`

***

### onSelectCapture?

> `optional` **onSelectCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onSelectCapture`

***

### onStalled?

> `optional` **onStalled**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onStalled`

***

### onStalledCapture?

> `optional` **onStalledCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onStalledCapture`

***

### onSubmit?

> `optional` **onSubmit**: `FormEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onSubmit`

***

### onSubmitCapture?

> `optional` **onSubmitCapture**: `FormEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onSubmitCapture`

***

### onSuspend?

> `optional` **onSuspend**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onSuspend`

***

### onSuspendCapture?

> `optional` **onSuspendCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onSuspendCapture`

***

### onTimeUpdate?

> `optional` **onTimeUpdate**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onTimeUpdate`

***

### onTimeUpdateCapture?

> `optional` **onTimeUpdateCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onTimeUpdateCapture`

***

### onTouchCancel?

> `optional` **onTouchCancel**: `TouchEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onTouchCancel`

***

### onTouchCancelCapture?

> `optional` **onTouchCancelCapture**: `TouchEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onTouchCancelCapture`

***

### onTouchEnd?

> `optional` **onTouchEnd**: `TouchEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onTouchEnd`

***

### onTouchEndCapture?

> `optional` **onTouchEndCapture**: `TouchEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onTouchEndCapture`

***

### onTouchMove?

> `optional` **onTouchMove**: `TouchEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onTouchMove`

***

### onTouchMoveCapture?

> `optional` **onTouchMoveCapture**: `TouchEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onTouchMoveCapture`

***

### onTouchStart?

> `optional` **onTouchStart**: `TouchEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onTouchStart`

***

### onTouchStartCapture?

> `optional` **onTouchStartCapture**: `TouchEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onTouchStartCapture`

***

### onTransitionEnd?

> `optional` **onTransitionEnd**: `TransitionEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onTransitionEnd`

***

### onTransitionEndCapture?

> `optional` **onTransitionEndCapture**: `TransitionEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onTransitionEndCapture`

***

### onVolumeChange?

> `optional` **onVolumeChange**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onVolumeChange`

***

### onVolumeChangeCapture?

> `optional` **onVolumeChangeCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onVolumeChangeCapture`

***

### onWaiting?

> `optional` **onWaiting**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onWaiting`

***

### onWaitingCapture?

> `optional` **onWaitingCapture**: `ReactEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onWaitingCapture`

***

### onWheel?

> `optional` **onWheel**: `WheelEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onWheel`

***

### onWheelCapture?

> `optional` **onWheelCapture**: `WheelEventHandler`\<`HTMLButtonElement`\>

#### Inherited from

`React.ButtonHTMLAttributes.onWheelCapture`

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

`React.ButtonHTMLAttributes.part`

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

`React.ButtonHTMLAttributes.prefix`

***

### property?

> `optional` **property**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.property`

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

`React.ButtonHTMLAttributes.radioGroup`

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

`React.ButtonHTMLAttributes.rel`

***

### resource?

> `optional` **resource**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.resource`

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

`React.ButtonHTMLAttributes.results`

***

### rev?

> `optional` **rev**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.rev`

***

### role?

> `optional` **role**: `AriaRole`

#### Inherited from

`React.ButtonHTMLAttributes.role`

***

### security?

> `optional` **security**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.security`

***

### shadow?

> `optional` **shadow**: `"shadowless"`

Shadow style (e.g., 'shadowless').

#### Inherited from

`Omit.shadow`

***

### size?

> `optional` **size**: `"normal"` \| `"medium"` \| `"small"` \| `"large"`

***

### slot?

> `optional` **slot**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.slot`

***

### spellCheck?

> `optional` **spellCheck**: `Booleanish`

#### Inherited from

`React.ButtonHTMLAttributes.spellCheck`

***

### style?

> `optional` **style**: `CSSProperties`

#### Inherited from

`React.ButtonHTMLAttributes.style`

***

### suppressContentEditableWarning?

> `optional` **suppressContentEditableWarning**: `boolean`

#### Inherited from

`React.ButtonHTMLAttributes.suppressContentEditableWarning`

***

### suppressHydrationWarning?

> `optional` **suppressHydrationWarning**: `boolean`

#### Inherited from

`React.ButtonHTMLAttributes.suppressHydrationWarning`

***

### tabIndex?

> `optional` **tabIndex**: `number`

#### Inherited from

`React.ButtonHTMLAttributes.tabIndex`

***

### textAlign?

> `optional` **textAlign**: `"centered"` \| `"justified"` \| `"left"` \| `"right"`

Text alignment (e.g., 'centered', 'left').

#### Inherited from

`Omit.textAlign`

***

### textColor?

> `optional` **textColor**: `"primary"` \| `"link"` \| `"info"` \| `"success"` \| `"warning"` \| `"danger"` \| `"black"` \| `"black-bis"` \| `"black-ter"` \| `"grey-darker"` \| `"grey-dark"` \| `"grey"` \| `"grey-light"` \| `"grey-lighter"` \| `"white"` \| `"light"` \| `"dark"` \| `"inherit"` \| `"current"`

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

`React.ButtonHTMLAttributes.title`

***

### translate?

> `optional` **translate**: `"yes"` \| `"no"`

#### Inherited from

`React.ButtonHTMLAttributes.translate`

***

### type?

> `optional` **type**: `"button"` \| `"submit"` \| `"reset"`

#### Inherited from

`React.ButtonHTMLAttributes.type`

***

### typeof?

> `optional` **typeof**: `string`

#### Inherited from

`React.ButtonHTMLAttributes.typeof`

***

### unselectable?

> `optional` **unselectable**: `"off"` \| `"on"`

#### Inherited from

`React.ButtonHTMLAttributes.unselectable`

***

### value?

> `optional` **value**: `string` \| `number` \| readonly `string`[]

#### Inherited from

`React.ButtonHTMLAttributes.value`

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

`React.ButtonHTMLAttributes.vocab`
