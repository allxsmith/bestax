import { Box, Image, Section, Title } from "@allxsmith/bestax-bulma";

// TODO(bestax-migrate): the page's `<title>` ("Carousel") isn't part of a component: set it where the app sets each page's title (under React 19 a component can render `<title>` itself, and React moves it into the head) (carousel.html:4)
// TODO(bestax-migrate): the page loads bulma-carousel, a Bulma extension, from `https://cdn.jsdelivr.net/npm/bulma-carousel@4.0.4/dist/css/…` and `https://cdn.jsdelivr.net/npm/bulma-carousel@4.0.4/dist/js/b…`, and bestax has a component for what it does: `Carousel`, with a `CarouselItem` for each slide, whose styles ship in bestax's `extras.css` and `bestax.css`; render that in place of the extension's markup and script, and stop loading the extension once nothing the app keeps uses its classes; the page's `is-covered` images are cropped by its stylesheet only inside its own slides, which `Carousel` doesn't render, so keeping it doesn't keep them cropped: give them the rule the `html-extension:is-covered` TODO has (carousel.html:5, 6)
// TODO(bestax-migrate): an inline script drives a carousel: bestax's `Carousel` takes its slides as `CarouselItem` children and renders its own arrows and indicators (`autoplay` for a timed one); for several slides in view it takes `itemsToShow`, with a variant per viewport such as `itemsToShowMobile`, and `itemsToScroll`, bulma-carousel's `slidesToShow` and `slidesToScroll`; it loops unless `repeat={false}`, where bulma-carousel stops at the ends unless `loop` or `infinite` is set; its styles ship in bestax's `extras.css` and `bestax.css`, not in Bulma's stylesheet; it was dropped, since a component doesn't run a page's scripts, and its code is still in the page (carousel.html:26-28)
export default function CarouselPage() {
  // TODO(bestax-migrate): the inline script at line 26 attaches bulma-carousel to `#carousel-demo`, which selects these 2 elements, since the page gives each one `id="carousel-demo"`, so each is a carousel: the script makes a slide of each of its children and builds the carousel around them, which the module doesn't do, so render bestax's `Carousel` in the place of each, with a `CarouselItem` for each slide, and carry the script's options over as the `html-script:carousel` recipe says; `carousel` is bestax `Carousel`'s own class, which `bestax.css` and `extras.css` style as its root (`position: relative`, `overflow: hidden`, `width: 100%`) until a `Carousel` takes the element's place (carousel.html:10, 21)
  // TODO(bestax-migrate): `is-covered` is bulma-carousel's class: inside one of the slides its script builds, its stylesheet makes the `<img>` in an `.image` fill the frame and crops the photo to fit (`object-fit: cover`); nothing in bestax reads the class (`Image` has no prop for it, and `Carousel`'s slides aren't bulma-carousel's), so in the app a ratio image stretches its photo instead: keep the class and give it the rule in the app's stylesheet (`.image.is-covered img { width: 100%; height: 100%; object-fit: cover; }`) (carousel.html:12, 15)
  return (
    <>
      <Section>
        <div id="carousel-demo" className="carousel">
          <div className="item-1">
            <Image
              size="16by9"
              className="is-covered"
              src="https://example.com/1.jpg"
              alt="One" />
          </div>
          <div className="item-2">
            <Image
              size="16by9"
              className="is-covered"
              src="https://example.com/2.jpg"
              alt="Two" />
          </div>
        </div>
      </Section>
      <Section>
        <Title as="h2">Testimonials</Title>
        <div id="carousel-demo" className="carousel">
          <Box>Great fruit</Box>
          <Box>Fast delivery</Box>
        </div>
      </Section>
    </>
  );
}
