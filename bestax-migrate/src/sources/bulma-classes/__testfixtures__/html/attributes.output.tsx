import { Box, Button, Notification, Title } from "@allxsmith/bestax-bulma";

export default function AttributesPage() {
  // TODO(bestax-migrate): bestax `Tag` renders only <span>, not an <a>; keep the markup, or change the tag and re-run
  return (
    <Box
      id="intro"
      data-section="intro"
      aria-labelledby="intro-title"
      tabIndex={-1}>
      <Title as="h2" className="is-4" id="intro-title">Attributes</Title>
      <img src="/cover.png" srcSet="/cover.png 1x, /cover@2x.png 2x" width={640} height={360} alt="" loading="lazy" />{" "}
      <Button href="/report.pdf" download as="a" size="small">Download</Button>{" "}
      <a href="https://example.com" target="_blank" rel="noopener" className="tag is-link">External</a>{" "}
      <Notification color="success" style={{ marginBottom: "0", WebkitUserSelect: "none" }} hidden>Saved</Notification>
      <Button disabled>Disabled</Button>
      <div role="progressbar" aria-valuenow={40} aria-valuemin={0} aria-valuemax={100}>40%</div>
      <details open><summary>More</summary><p>Hidden until opened.</p></details>
      <p contentEditable="true" spellCheck="false" translate="no" />
      <ol start={3} reversed><li value="5">Five</li></ol>
    </Box>
  );
}
