import { Box, Title } from "@allxsmith/bestax-bulma";

export default function PrePage() {
  return (
    <Box>
      <Title as="p" size="5">Install</Title>
      <pre><code className="language-sh">{`pnpm add @allxsmith/bestax-bulma
  # then
pnpm dev`}</code></pre>
      <pre>{`  two leading spaces
`}<b>bold</b>   kept</pre>
      <p>Inline <code>collapses </code>here.</p>
    </Box>
  );
}
