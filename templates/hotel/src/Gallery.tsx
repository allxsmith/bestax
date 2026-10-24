import {
  Card,
  Carousel,
  CarouselItem,
  Container,
  Content,
  Hero,
  Image,
  Section,
  Title,
} from '@allxsmith/bestax-bulma';

/** The gallery's pictures, drawn for this port; README.md says how. */
const photos = [
  {
    src: '/media/gallery-pool.svg',
    alt: 'The pool by day, with loungers and parasols and the sea beyond',
  },
  {
    src: '/media/gallery-restaurant.svg',
    alt: 'The restaurant in the evening, its tables laid under pendant lights',
  },
  {
    src: '/media/gallery-spa.svg',
    alt: 'The spa: stacked stones, candles, rolled towels and an orchid',
  },
  {
    src: '/media/gallery-terrace.svg',
    alt: 'A table for two on the terrace as the sun sets over the sea',
  },
  {
    src: '/media/gallery-bar.svg',
    alt: 'The bar, its stools at the counter and lit shelves of bottles',
  },
];

/**
 * The gallery, three cards in view at a time and round without a break, as
 * the original's bulma-carousel was set up (`slidesToShow: 3`,
 * `slidesToScroll: 1`, `infinite`). bulma-carousel's default breakpoints show
 * one card on a phone; `Carousel`'s nearest is its mobile variant, below
 * Bulma's tablet breakpoint. `hotel-gallery` in index.css draws the arrows
 * as bulma-carousel did: white circles at the edges with a caret in each.
 */
function Gallery() {
  return (
    <Hero id="hotel-gallery">
      <Hero.Body p="0">
        <Container overflow="clipped">
          <Content>
            <Title size="4" className="main_title">
              Hotel Gallery
            </Title>
          </Content>
          <Section p="0">
            <Carousel
              className="hotel-gallery"
              iconPrev="caret-left"
              iconNext="caret-right"
              itemsToShow={3}
              itemsToShowMobile={1}
              itemsToScroll={1}
              ariaLabel="Hotel gallery"
            >
              {photos.map((photo, index) => (
                <CarouselItem key={photo.src}>
                  <Card>
                    <Card.Image>
                      <Image
                        size="16by9"
                        className="is-covered"
                        src={photo.src}
                        alt={photo.alt}
                      />
                    </Card.Image>
                    <Card.Content>
                      <div className="item__title">Mon titre {index + 1}</div>
                      <div className="item__description">
                        Ici une petite description pour tester le slider
                      </div>
                    </Card.Content>
                  </Card>
                </CarouselItem>
              ))}
            </Carousel>
          </Section>
        </Container>
      </Hero.Body>
    </Hero>
  );
}

export default Gallery;
