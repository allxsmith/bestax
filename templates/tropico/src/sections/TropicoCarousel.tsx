import type { ReactNode } from 'react';
import { Carousel } from '@allxsmith/bestax-bulma';

/**
 * The original runs bulma-carousel with its defaults on both of the home
 * page's carousels: one slide in view, stopping at either end, with arrows
 * at the sides and dots over the foot of the slide. This is bestax's
 * `Carousel` set up the same way, with bulma-carousel's look from the
 * `.tropico-carousel` rules in `src/index.css`.
 */
function TropicoCarousel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Carousel
      className="tropico-carousel"
      ariaLabel={label}
      repeat={false}
      indicatorInside
      iconLibrary="fa"
      iconVariant="solid"
      iconPrev="caret-left"
      iconNext="caret-right"
      iconSize="medium"
    >
      {children}
    </Carousel>
  );
}

export default TropicoCarousel;
