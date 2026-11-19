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

/**
 * Pictures drawn for the port, in place of the original's hot-linked stock
 * photos. Put your own weddings' photos here, with alt text.
 */
const photos = [
  '/img/gallery-cake.svg',
  '/img/gallery-rings.svg',
  '/img/gallery-bouquet.svg',
  '/img/gallery-ceremony.svg',
  '/img/gallery-reception.svg',
];

/**
 * The gallery: three cards in view on a tablet or wider and one on a phone,
 * moving one card a step and running round from the last to the first, as
 * the original's bulma-carousel did with `slidesToShow: 3`, `slidesToScroll:
 * 1` and `infinite`.
 */
function Gallery() {
  return (
    <Hero id="gallery">
      <Hero.Body p="0">
        <Container overflow="clipped">
          <Content>
            <Title textAlign="centered">Weddings Gallery</Title>
          </Content>
          <Section p="0">
            <Carousel
              className="gallery-carousel"
              itemsToShow={3}
              itemsToShowMobile={1}
              iconPrev="caret-left"
              iconNext="caret-right"
              ariaLabel="Weddings gallery"
            >
              {photos.map((photo, index) => (
                <CarouselItem key={photo}>
                  <Card>
                    <Card.Image>
                      <Image size="16by9" src={photo} alt="" />
                    </Card.Image>
                    <Card.Content>
                      <div>Mon titre {index + 1}</div>
                      <div>
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
