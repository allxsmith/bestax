---
title: Media
sidebar_label: Media
---

# Media

## Overview

The `Media` component implements Bulma’s powerful media object layout for React. It’s perfect for aligning images or icons (usually on the left), with content and actions in the center and right. `Media` supports nesting, Bulma color/background helpers, and comes with subcomponents for left, content, and right sections.

:::info
Use `Media` for comments, posts, cards, notifications, or any structured block with media, text, and actions.
:::

---

## Import

```tsx
import { Media } from '@allxsmith/bestax-bulma';
```

---

## Props

| Prop        | Type                                                                                                                                                                                                                                                                                     | Default     | Description                                      |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------ |
| `as`        | `'article'` \| `'div'`                                                                                                                                                                                                                                                                   | `'article'` | Element type for the root Media container.       |
| `color`     | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —           | Bulma color modifier.                            |
| `bgColor`   | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —           | Bulma background color helper.                   |
| `textColor` | `'primary'` \| `'link'` \| `'info'` \| `'success'` \| `'warning'` \| `'danger'` \| `'black'` \| `'black-bis'` \| `'black-ter'` \| `'grey-darker'` \| `'grey-dark'` \| `'grey'` \| `'grey-light'` \| `'grey-lighter'` \| `'white'` \| `'light'` \| `'dark'` \| `'inherit'` \| `'current'` | —           | Bulma text color helper.                         |
| `className` | `string`                                                                                                                                                                                                                                                                                 | —           | Additional CSS classes.                          |
| `children`  | `React.ReactNode`                                                                                                                                                                                                                                                                        | —           | Content inside the media container.              |
| ...         | All standard HTML and Bulma helper props                                                                                                                                                                                                                                                 |             | (See [Helper Props](../helpers/usebulmaclasses)) |

**Subcomponents:**

- `Media.Left`: For avatars, thumbnails, icons (renders as `figure` or `div`)
- `Media.Content`: Main content (renders as `div`)
- `Media.Right`: Actions or controls (renders as `div`)

---

## Usage

### Default Media

```tsx live
<Media>
  <Media.Left>
    <Image
      as="p"
      size="64x64"
      src="https://bulma.io/assets/images/placeholders/128x128.png"
      alt=""
    />
  </Media.Left>
  <Media.Content>
    <div className="content">
      <p>
        <strong>Alexander Hamilton</strong> <small>@hamilton</small>{' '}
        <small>31m</small>
        <br />
        If men were angels, no government would be necessary. If angels were to
        govern men, neither external nor internal controls on government would
        be necessary.
      </p>
    </div>
    <Level isMobile>
      <Level.Left>
        <Level.Item as="a">
          <span className="icon is-small">
            <Icon name="reply" library="fa" libraryFeatures={['fas']} />
          </span>
        </Level.Item>
        <Level.Item as="a">
          <span className="icon is-small">
            <Icon name="retweet" library="fa" libraryFeatures={['fas']} />
          </span>
        </Level.Item>
        <Level.Item as="a">
          <span className="icon is-small">
            <Icon name="heart" library="fa" libraryFeatures={['fas']} />
          </span>
        </Level.Item>
      </Level.Left>
    </Level>
  </Media.Content>
  <Media.Right>
    <button className="delete" aria-label="delete" />
  </Media.Right>
</Media>
```

---

### Media With Inputs

```tsx live
<Media>
  <Media.Left>
    <Image
      as="p"
      size="64x64"
      src="https://bulma.io/assets/images/placeholders/128x128.png"
      alt=""
    />
  </Media.Left>
  <Media.Content>
    <Field>
      <Control as="p">
        <TextArea className="textarea" placeholder="Add a comment..." />
      </Control>
    </Field>
    <Level>
      <Level.Left>
        <Level.Item>
          <Button as="a" color="info">
            Submit
          </Button>
        </Level.Item>
      </Level.Left>
      <Level.Right>
        <Level.Item>
          <Checkbox>Press enter to submit</Checkbox>
        </Level.Item>
      </Level.Right>
    </Level>
  </Media.Content>
</Media>
```

---

### Nested Media

```tsx live
<Media>
  <Media.Left>
    <Image
      as="p"
      size="64x64"
      src="https://bulma.io/assets/images/placeholders/128x128.png"
      alt=""
    />
  </Media.Left>
  <Media.Content>
    <Content>
      <p>
        <strong>John Jay</strong>
        <br />
        The people, in their collective capacity, are the ultimate authority.
        The Union is essential to the security of the people of America against
        foreign danger.
        <br />
        <small>
          <a>Like</a> &middot; <a>Reply</a> &middot; 3 hrs
        </small>
      </p>
    </Content>
    {/* First nested media */}
    <Media>
      <Media.Left>
        <Image
          as="p"
          size="48x48"
          src="https://bulma.io/assets/images/placeholders/96x96.png"
          alt=""
        />
      </Media.Left>
      <Media.Content>
        <Content>
          <p>
            <strong>James Madison</strong>
            <br />
            The accumulation of all powers, legislative, executive, and
            judiciary, in the same hands, may justly be pronounced the very
            definition of tyranny.
            <br />
            <small>
              <a>Like</a> &middot; <a>Reply</a> &middot; 2 hrs
            </small>
          </p>
        </Content>
        {/* 2nd nested media (two siblings) */}
        <Media>
          Experience has taught mankind the necessity of auxiliary precautions.
        </Media>
        <Media>Ambition must be made to counteract ambition.</Media>
      </Media.Content>
    </Media>
    {/* Second nested media */}
    <Media>
      <Media.Left>
        <Image
          as="p"
          size="48x48"
          src="https://bulma.io/assets/images/placeholders/96x96.png"
          alt=""
        />
      </Media.Left>
      <Media.Content>
        <Content>
          <p>
            <strong>Alexander Hamilton</strong>
            <br />
            Safety from external danger is the most powerful director of
            national conduct. The desire for respect and security will always
            influence the policy of nations.
            <br />
            <small>
              <a>Like</a> &middot; <a>Reply</a> &middot; 2 hrs
            </small>
          </p>
        </Content>
      </Media.Content>
    </Media>
  </Media.Content>
</Media>
```

---

### Media With Button Below

```tsx live
<Media>
  <Media.Left>
    <Image
      as="p"
      size="64x64"
      src="https://bulma.io/assets/images/placeholders/128x128.png"
      alt=""
    />
  </Media.Left>
  <Media.Content>
    <Field>
      <p className="control">
        <TextArea className="textarea" placeholder="Add a comment..." />
      </p>
    </Field>
    <Field>
      <p className="control">
        <Button>Post comment</Button>
      </p>
    </Field>
  </Media.Content>
</Media>
```

---

## Accessibility

- The Media root renders as a semantic `<article>` by default. Use `as="div"` for a generic container.
- The left section is commonly used for avatars (as `<figure>`) and is screen-reader accessible.
- Use clear and descriptive text in content and actions for best accessibility.

:::note
When using only icons or controls, provide `aria-label` or screen-reader-only content as appropriate.
:::

---

## Related Components

- [`Level`](./level.md): For actions or stats inside the media content.
- [`Image`](../elements/image.md): For avatars or thumbnails.
- [`Button`](../elements/button.md), [`Checkbox`](../form/checkbox.md), [`TextArea`](../form/textarea.md): For interactive content.
- [Helper Props](../helpers/usebulmaclasses.md): Use Bulma utility helpers for spacing, color, etc.

---

## Additional Resources

- [Bulma Media Object Documentation](https://bulma.io/documentation/layout/media-object/)
- [Storybook: Media Stories](https://bestax.cc/storybook/?path=/story/layout-media--default)

:::tip Pro Tip
You can use all [Bulma helper props](../helpers/usebulmaclasses.md) with `<Media />` and its subcomponents for powerful utility-based styling.
:::
