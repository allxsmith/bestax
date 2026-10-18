import { Navbar, Section, Title } from "@allxsmith/bestax-bulma";

// TODO(bestax-migrate): the page's `<html lang="fr">` belongs to the whole document, which a component can't reach: set it on the `<html>` in the app's index.html (head-assets.html:2)
// TODO(bestax-migrate): the page's `<html dir="ltr">` belongs to the whole document, which a component can't reach: set it on the `<html>` in the app's index.html (head-assets.html:2)
// TODO(bestax-migrate): the page's `<html>` has `has-navbar-fixed-top`, which Bulma reads to pad the page for a fixed navbar: put it on the `<html>` in the app's index.html, since bestax's `Navbar` adds no class there, whatever its `fixed` says (head-assets.html:2)
// TODO(bestax-migrate): the page's `<html>` has `theme-dark`, which sets Bulma's dark scheme: put it on the `<html>` in the app's index.html, or render bestax's `<Theme colorMode="dark">`, which writes `data-theme` on `<html>` (head-assets.html:2)
// TODO(bestax-migrate): the page's `<head>` has `<meta>` tags (charset, viewport, og:title) that a component can't carry: the app's index.html holds charset and viewport once, and a page's own (a description, social cards) go where the app sets each page's head (head-assets.html:4)
// TODO(bestax-migrate): the page's `<title>` ("Accueil") isn't part of a component: set it where the app sets each page's title (under React 19 a component can render `<title>` itself, and React moves it into the head) (head-assets.html:7)
// TODO(bestax-migrate): the page sets `<base href="/">`, which changes how every relative URL on it resolves, and a component can't carry it: check the page's relative URLs resolve without it (head-assets.html:8)
// TODO(bestax-migrate): the page's `<head>` has `<link>` tags (icon, preconnect) that a component can't carry: keep the app-wide ones (icons, preconnects, preloads) in the app's index.html, and a page's own (canonical) where the app sets each page's head (head-assets.html:9)
// TODO(bestax-migrate): the page loads the stylesheet `https://fonts.googleapis.com/css2?family=Inter&display=swap`, and a component doesn't: load it once for the app, from its entry or a `<link>` in its index.html (head-assets.html:11)
// TODO(bestax-migrate): the page loads Bulma's stylesheet from `https://cdn.jsdelivr.net/npm/bulma@1.0.4/css/bulma.min.css`, and a component doesn't: load Bulma once for the app, from its entry (`import 'bulma/css/bulma.min.css'`, with `bulma` installed) or a `<link>` in its index.html (head-assets.html:12)
// TODO(bestax-migrate): the page loads the stylesheet `https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@…`, and a component doesn't: load it once for the app, from its entry or a `<link>` in its index.html (head-assets.html:13)
// TODO(bestax-migrate): the page loads the stylesheet `css/site.css`, and a component doesn't: load it once for the app, from its entry or a `<link>` in its index.html (head-assets.html:14)
// TODO(bestax-migrate): the page's `<head>` has a `<style>` block, which was dropped: move its rules into the app's stylesheet; they are still in the page (head-assets.html:15-17)
// TODO(bestax-migrate): the page loads the script `https://code.jquery.com/jquery-3.7.1.min.js`, and a component runs no page scripts: load it in the app if the app still needs it, or replace what it does with React code (head-assets.html:18)
// TODO(bestax-migrate): the page's `<body>` has classes a component can't carry (`has-background-white-ter`): put them on the app's own `<body>`, or on an element around this page's content (head-assets.html:20)
// TODO(bestax-migrate): the page's `<body>` has `data-page="home"`, which a component can't carry: move it to the app's own `<body>`, or onto an element around this page's content (head-assets.html:20)
export default function HeadAssetsPage() {
  // TODO(bestax-migrate): `src="images/logo.svg"` is relative to the page's folder, and in the app it resolves against the address the component renders at: make it absolute from the site root (`/img/logo.png`, with the file in the app's public folder) or import the file; a link to another page should point at the route it becomes (head-assets.html:23)
  return (
    <>
      <Navbar fixed="top" role="navigation" aria-label="main navigation">
        <Navbar.Brand>
          <Navbar.Item href="/"><img src="images/logo.svg" alt="Accueil" /></Navbar.Item>
        </Navbar.Brand>
      </Navbar>
      <Section>
        <Title as="p">Bonjour</Title>
      </Section>
    </>
  );
}
