import { Box, Skeleton } from "@allxsmith/bestax-bulma";
export function Placeholder() {
  // TODO(bestax-migrate): bestax `Skeleton` renders this element's children itself, `lines` bare, empty <div>s, so it converts only when its children are just that; keep it as markup
  return (
    <Box>
      <Skeleton className="mb-3">Loading the heading</Skeleton>
      <Skeleton variant="lines" lines={5} />
      <div className="skeleton-lines">
        <div className="is-short"></div>
        <div></div>
      </div>
    </Box>
  );
}
