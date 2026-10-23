# Bulma Login Template, rebuilt with bestax

A sign-in page on a frosted glass card, with social login buttons and a language picker,
rebuilt as a React app with [bestax-bulma](https://bestax.io).

The original is [aldi](https://github.com/aldi)'s
[Bulma Login Template](https://github.com/aldi/bulma-login-template), part of
[awesome-bulma-templates](https://github.com/aldi/awesome-bulma-templates), aldi's collection of
free Bulma templates. This port
was made from commit
[`4f6c09947e045152ce73bc6a184d22f42f8493e9`](https://github.com/aldi/bulma-login-template/tree/4f6c09947e045152ce73bc6a184d22f42f8493e9),
and the original's [live demo](https://aldi.github.io/bulma-login-template/) shows the page it
started from.

## Run it

```bash
npm install && npm run dev
```

Inside the bestax repository, install with `pnpm install --ignore-workspace` instead, so pnpm
treats the folder as a project of its own.

## What's inside

- `src/App.tsx` lays out the page, and `LoginForm.tsx`, `SocialLogin.tsx`, `AccountLinks.tsx`
  and `SiteFooter.tsx` hold its sections, built from bestax components in place of the
  original's Bulma markup.
- `src/index.css` is the original's stylesheet, ported, and `public/` holds the background
  drawn for this port (see [Images](#images)) and the favicon.
- The social buttons take their brand colors from aldi's
  [bulma-social](https://github.com/aldi/bulma-social), as the original does: its classes go on
  bestax's `Button` through `className`.
- Icons are Font Awesome, from its npm package, and the Quicksand font loads from Google Fonts
  in `index.html`.

## Changes from the original

- The "Remember me" box is bestax's `Checkbox`, which draws its own box in place of the
  browser's.
- `index.html` pins Bulma's light scheme, as the original's design is light only.
- Submitting the form stays on the page. The original posts to `#`, which a static host answers
  with an error page; send the sign-in from the form's `onSubmit` in `src/LoginForm.tsx`.

## Images

`public/media/background.svg`, the mountains at sunset, was drawn for this port on October 23, 2026
by Claude, Anthropic's AI model, writing SVG code from a text description. No photo, illustration,
stock image or image-generation model went into it, and it copies no existing artwork. The file is
its own source: open it in a text editor to see every shape it draws. It replaces the original's
background photo, whose source the original does not record, so this port ships no image of unknown
origin.

## License

MIT, as the original is. [LICENSE](LICENSE) keeps aldi's notice, followed by the notice for this
port.
