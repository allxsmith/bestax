# Bulma Login Template, rebuilt with bestax

A sign-in page on a frosted glass card, with social login buttons and a language picker,
rebuilt as a React app with [bestax-bulma](https://bestax.io).

The original is [aldi](https://github.com/aldi)'s
[Bulma Login Template](https://github.com/aldi/bulma-login-template), part of
[awesome-bulma-templates](https://github.com/aldi/awesome-bulma-templates), aldi's collection of
free Bulma templates. This port was made from commit
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

- `src/App.tsx` lays out the page, and `LoginForm.tsx`, `AccountLinks.tsx` and `SiteFooter.tsx`
  hold its sections, built from bestax components in place of the original's Bulma markup.
- `src/index.css` is the original's stylesheet, ported, and `public/` holds the background drawn
  for this port (see [Images](#images)) and the favicon.
- The social buttons take their brand colors from aldi's
  [bulma-social](https://github.com/aldi/bulma-social), as the original does: its classes go on
  bestax's `Button` through `className`, and `src/main.tsx` imports the file for each brand the
  page shows.
- Icons are Font Awesome, from its npm package, and the Quicksand font loads from Google Fonts in
  `index.html`.

## Changes from the original

- The "Remember me" box is bestax's `Checkbox`, which draws its own, larger box in place of the
  browser's.
- `index.html` pins Bulma's light scheme, which the original is designed for. The original held
  its inputs light in a dark system scheme with rules of its own, which the port leaves out.
- Submitting the form stays on the page. The original posts to `#`, which a static host answers
  with an error page; send the sign-in from the form's `onSubmit` in `src/LoginForm.tsx`.
- The original's canonical link named its own demo site, so it's left out. Add your own where you
  deploy.

## Images

`public/media/background.svg`, a blocky sea at sunset with a sailboat and a lighthouse, and
`public/favicon.svg`, a pixel padlock, are voxel art drawn by code for this port:
[`scenes/login.mjs`](https://github.com/allxsmith/bestax/blob/main/docs/scripts/template-art/scenes/login.mjs)
in the bestax repository places every block, and the renderer beside it writes the SVG, so running
it again writes the same files. No photo, illustration, stock image or image-generation model went
into them, and none copies existing artwork. They replace the original's background photo, whose
source the original does not record, and an earlier favicon whose making was not recorded, so this
port ships no image of unknown origin.

`image-provenance.json` records each image with its SHA-256 hash, so anyone can check that the file
shipped is the one described here.

## License

MIT, as the original is. [LICENSE](LICENSE) keeps aldi's notice, followed by the notice for this
port.
