import { Container, Delete, Navbar, Notification } from "@allxsmith/bestax-bulma";

// TODO(bestax-migrate): the page's `<title>` ("Scripts") isn't part of a component: set it where the app sets each page's title (under React 19 a component can render `<title>` itself, and React moves it into the head) (scripts.html:4)
// TODO(bestax-migrate): structured data for search engines (JSON-LD) was dropped with the page's scripts: data about the whole site, or about a single-page app's one page, goes in the app's index.html as it is, where a crawler that runs no JavaScript still reads it, and data that differs from page to page goes where the app sets each page's head, as `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />`; the JSON is still in the page (scripts.html:5)
// TODO(bestax-migrate): an inline script was dropped, since a component doesn't run a page's scripts: port what it does into the component (state, effects, event handlers); its code is still in the page (scripts.html:14)
// TODO(bestax-migrate): the page loads bulma-carousel, a Bulma extension, from `https://cdn.jsdelivr.net/npm/bulma-carousel@4/dist/js/bulma…`, and bestax has a component for what it does: `Carousel`, with a `CarouselItem` for each slide, whose styles ship in bestax's `extras.css` and `bestax.css`; render that in place of the extension's markup and script, and stop loading the extension once nothing the app keeps uses its classes (scripts.html:20)
// TODO(bestax-migrate): an inline script toggles the navbar burger: bestax's `Navbar.Burger` takes `active` and `onClick`, and `Navbar.Menu` the same `active`, so keep the open state in `useState` and pass it to both; it was dropped, since a component doesn't run a page's scripts, and its code is still in the page (scripts.html:21-30)
// TODO(bestax-migrate): an inline script removes an element when its `.delete` is clicked: bestax's `Notification` takes `hasDelete` and `onDelete`, `Tag` takes `onDelete` and `Message` takes `onClose`, so keep whether it shows in state; it was dropped, since a component doesn't run a page's scripts, and its code is still in the page (scripts.html:21-30)
// TODO(bestax-migrate): an inline script switches Bulma's light and dark schemes: bestax's `Theme` writes `data-theme` on `<html>` from its `colorMode` (`light`, `dark` or `system`), so keep the choice in state, saved in `localStorage`, and pass it; `Theme` writes the attribute from an effect, after the first paint, so for a saved choice to paint first, keep a small inline script in the `<head>` of the app's index.html that reads it (or the OS's, with none saved) and writes `data-theme` before the app loads, and start the state from what that script wrote (the bestax-theming skill's dark-mode example has both); it was dropped, since a component doesn't run a page's scripts, and its code is still in the page (scripts.html:31-35)
export default function ScriptsPage() {
  return (
    <>
      <Navbar role="navigation" aria-label="main navigation">
        <Navbar.Brand>
          <Navbar.Item href="/">Home</Navbar.Item>
        </Navbar.Brand>
      </Navbar>
      <Container>
        <p>Before after</p>
        <Notification color="primary">
          <Delete aria-label="Close" />{" "}
          Saved
        </Notification>
      </Container>
    </>
  );
}
