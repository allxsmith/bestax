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
  'https://images.unsplash.com/photo-1550921082-c282cdc432d6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1550945771-515f118cef86?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1550971264-3f7e4a7bb349?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1550931937-2dfd45a40da0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
  'https://images.unsplash.com/photo-1550930516-af8b8cc4f871?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1000&q=80',
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
                <CarouselItem key={photo}>
                  <Card>
                    <Card.Image>
                      <Image
                        size="16by9"
                        className="is-covered"
                        src={photo}
                        alt=""
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
