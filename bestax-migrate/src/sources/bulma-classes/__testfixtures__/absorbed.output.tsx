import { Breadcrumb, SelectBase } from "@allxsmith/bestax-bulma";
export function Absorbed({ onPick }: { onPick: () => void }) {
  // TODO(bestax-migrate): bestax `SelectBase` puts the attributes it is given on the <select> inside `.select`, so this element's `id` would move there; move it onto the <select> if that is what you want, then re-run
  return (
    <section>
      <SelectBase size="small" isFullwidth mb="3" id="plan" name="plan" onChange={onPick}>
        <option>Free</option>
        <option>Pro</option>
      </SelectBase>
      <SelectBase multiple multipleSize={4} isFocused>
        <option>One</option>
        <option>Two</option>
      </SelectBase>
      <div className="select" id="kept">
        <select>
          <option>An attribute on the wrapper keeps it as markup</option>
        </select>
      </div>
      <Breadcrumb separator="succeeds" alignment="right" aria-label="breadcrumbs">
        <li>
          <a href="#">Home</a>
        </li>
        <li className="is-active">
          <a href="#" aria-current="page">
            Here
          </a>
        </li>
      </Breadcrumb>
    </section>
  );
}
