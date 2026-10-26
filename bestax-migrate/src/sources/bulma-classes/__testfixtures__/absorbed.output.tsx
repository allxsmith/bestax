import { Breadcrumb, Figure, Image, SelectBase } from "@allxsmith/bestax-bulma";
export function Absorbed({
  onPick,
  thumb,
}: {
  onPick: () => void;
  thumb: string;
}) {
  // TODO(bestax-migrate): bestax `SelectBase` puts the attributes it is given on the <select> inside `.select`, so this element's `id` would move there; move it onto the <select> if that is what you want, then re-run
  // TODO(bestax-migrate): `is-4by3` is an `.image` modifier, and Bulma styles it only on the element that carries `.image`, so on this one it styles nothing unless the project's own CSS gives it a rule; if this element is the image, convert it to bestax `Image` by hand, and otherwise drop the class
  // TODO(bestax-migrate): bestax `Image` renders its own <img> when it's given no children, so this empty element would gain one; keep it as markup
  // TODO(bestax-migrate): bestax `Image` renders its own <img> when its children are empty, and it can't be told from here that these never are, so this converts only around HTML elements written out; keep it as markup
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
      <Image
        as="figure"
        size="128x128"
        mb="2"
        src="/avatar.png"
        alt="Avatar"
        isRounded />
      <Image as="p" size="64x64" src={thumb} alt="" />
      <Image
        size="4by3"
        src="/photo.jpg"
        alt="A ratio on the figure Image renders for it" />
      <Figure mx="auto" className="is-4by3">
        <img src="/photo.jpg" alt="A ratio with no image converts as a Figure" />
      </Figure>
      <Image
        as="div"
        size="3by2"
        src="/wide.jpg"
        alt="A ratio on a div keeps it through as" />
      <Image as="figure" size="48x48">
        <img src="/lazy.png" alt="Another attribute keeps the img" loading="lazy" />
      </Image>
      <Image size="16by9">
        <iframe
          className="has-ratio"
          src="https://www.youtube.com/embed/x"
          allowFullScreen
        />
      </Image>
      <figure className="image is-64x64" />
      <figure className="image is-32x32">
        {thumb && <img src={thumb} alt="" />}
      </figure>
    </section>
  );
}
