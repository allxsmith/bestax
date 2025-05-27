---
slug: bulma-hook-helper
title: Bulma Helper
authors: [asmith]
tags: [bulma css props hook helper]
---

We've add a react hook that turns properties into bulma helper classes. It's pretty cool. You can add this to any custom component to leverage Bulma helper classes through properties.

All of the components in this package use this helper `useBulmaClasses`.

<!-- truncate -->

To implement this it's pretty simple.

```jsx
  const { bulmaHelperClasses rest } = useBulmaClasses({
    color: textColor // Map to has-text-{color}
    backgroundColor: bgColor // Map to has-background-{color}
    ...props // Spread remaining Bulma props
  });
```

```jsx title="Implementation"
<MyComponent m="2" color="primary" />
```

The available properties are:

- color
- backgroundColor
- colorShade
- m
- mt
- mr
- mb
- ml
- mx
- my
- p
- pt
- pr
- pb
- pl
- px
- py
- textSize
- textAlign
- textTransform
- textWeight
- fontFamily
- display
- visibility
- flexDirection
- flexWrap
- justifyContent
- alignContent
- alignItems
- alignSelf
- flexGrow
- flexShrink
- float
- overflow
- overlay
- interaction
- radius
- shadow
- responsive
- viewport
