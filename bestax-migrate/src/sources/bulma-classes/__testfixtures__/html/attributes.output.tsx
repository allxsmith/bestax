import { Box, Button, Notification, Title } from "@allxsmith/bestax-bulma";

export default function AttributesPage() {
  // TODO(bestax-migrate): `.is-4` stays in its `className`, which renders the same: bestax `Title` renders it exactly only on an <h4> or a <p>, as `size="4"`; on this <h2>, write `textSize="4"` in its place, which sizes it the same and keeps the <h2>, though `textSize` renders a Bulma helper class, which is `!important`: check the page's own CSS sets no size on it (attributes.html:2)
  // TODO(bestax-migrate): bestax `Tag` renders only <span>, not an <a>; keep the markup, or change the tag and re-run (attributes.html:5)
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
