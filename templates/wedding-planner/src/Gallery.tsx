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

const photos = [
  'https://images.unsplash.com/photo-1425421543490-6a133856ff32?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
  'https://images.unsplash.com/photo-1520342868574-5fa3804e551c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
  'https://images.unsplash.com/photo-1504993945773-3f38e1b6a626?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
  'https://images.unsplash.com/photo-1506072328856-cd6629b00b62?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
  'https://images.unsplash.com/photo-1444920275954-9dddec6b714e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
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
