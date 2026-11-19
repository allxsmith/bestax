// Theme by Example. MIT licence.

import { Box, Container, Section, SubTitle, Title } from "@allxsmith/bestax-bulma";

// TODO(bestax-migrate): the page's `<html lang="en">` belongs to the whole document, which a component can't reach: set it on the `<html>` in the app's index.html (document.html:3)
// TODO(bestax-migrate): the page's `<head>` has `<meta>` tags (charset) that a component can't carry: the app's index.html holds charset and viewport once, and a page's own (a description, social cards) go where the app sets each page's head (document.html:5)
// TODO(bestax-migrate): the page's `<title>` ("Docs") isn't part of a component: set it where the app sets each page's title (under React 19 a component can render `<title>` itself, and React moves it into the head) (document.html:6)
// TODO(bestax-migrate): the page loads Bulma 1.0.4 from `https://cdn.jsdelivr.net/npm/bulma@1.0.4/css/bulma.min.css`, and a component doesn't: load Bulma once for the app, from its entry (`import 'bulma/css/bulma.min.css'`, with `bulma@1.0.4` installed) or a `<link>` in its index.html (document.html:7)
export default function DocumentPage() {
  return (
    <Section>
      <Container>
        <Title>Getting started</Title>
        <SubTitle as="p">Install it, then <strong>run</strong> it.</SubTitle>
        <Box>
          <p>Everything else is optional.</p>
        </Box>
      </Container>
    </Section>
  );
}
