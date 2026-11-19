import { Box, Button, InputBase } from "@allxsmith/bestax-bulma";

// TODO(bestax-migrate): the page's `<body onload="start()">` runs code a component can't take as a string: port it into the component (an effect, for `onload`) (events.html:3)
export default function EventsPage() {
  // TODO(bestax-migrate): `onclick="if (confirm('Sure?')) remove()"` was dropped, since React takes a function rather than code in a string: port it into a handler passed as `onClick` (events.html:5)
  // TODO(bestax-migrate): a `javascript:` URL in `href` won't run: React 19 replaces one with a URL that throws, and React 18 warns; move the code into an `onClick` handler (events.html:6)
  // TODO(bestax-migrate): `onsubmit="return validate(this)"` was dropped, since React takes a function rather than code in a string: port it into a handler passed as `onSubmit` (events.html:7)
  // TODO(bestax-migrate): `onkeyup="search(this.value)"` was dropped, since React takes a function rather than code in a string: port it into a handler passed as `onKeyUp` (events.html:8)
  // TODO(bestax-migrate): `onerror="this.remove()"` was dropped, since React takes a function rather than code in a string: port it into a handler passed as `onError` (events.html:10)
  return (
    <Box>
      <Button color="danger" type="button">Remove</Button>{" "}
      <Button as="a" href="javascript:history.back()">Back</Button>
      <form>
        <InputBase id="q" name="q" />
      </form>
      <img src="/x.png" alt="" />
    </Box>
  );
}
