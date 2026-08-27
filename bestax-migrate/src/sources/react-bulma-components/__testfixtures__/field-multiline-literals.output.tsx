import { Field } from "@allxsmith/bestax-bulma";

export function Fields({ isMultiline }: { isMultiline: boolean }) {
  // TODO(bestax-migrate): `multiline` has a dynamic value; resolve the bestax `grouped`/`hasAddons` combination by hand
  return (
    <div>
      <Field />
      <Field grouped />
      <Field grouped="right" />
      <Field hasAddons />
      <Field multiline={isMultiline} />
      <Field multiline={isMultiline} grouped />
      <Field multiline={isMultiline} hasAddons />
    </div>
  );
}
