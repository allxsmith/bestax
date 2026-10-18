import {
  Button,
  Buttons,
  Carousel,
  CarouselItem,
  Column,
  Columns,
  Container,
  Image,
  Paragraph,
  Section,
  Title,
} from '@allxsmith/bestax-bulma';

/** The original's three slides, which say the same thing. */
const slides = ['first', 'second', 'third'];

/**
 * The home page's slider, one slide at a time and no looping, as the
 * original's bulma-carousel is set up. `tropico-carousel` (index.css) gives
 * it that slider's white arrows and dots, and the caret icons are its
 * triangles.
 */
function WelcomeCarousel() {
  return (
    <Section className="carousel-section">
      <Container pb="6">
        <Carousel
          className="tropico-carousel"
          repeat={false}
          iconPrev="caret-left"
          iconNext="caret-right"
          iconFeatures="fa-lg"
          ariaLabel="Welcome"
        >
          {slides.map(slide => (
            <CarouselItem key={slide}>
              <Columns>
                <Column size="half">
                  <Title as="h2" textSize="1">
                    Welcome to Our Fruits Shop
                  </Title>
                  <Paragraph mb="5">
                    There are many variations of passages of Lorem Ipsum
                    available, but the majority have suffered alteration in some
                    form, by injected humour, or randomised words which
                    don&apos;t look even slightly believable.
                  </Paragraph>
                  <Buttons>
                    <Button
                      type="button"
                      size="medium"
                      color="link"
                      isLight
                      className="is-orange"
                    >
                      SHOP NOW
                    </Button>
                    <Button type="button" size="medium" color="black" isLight>
                      CONTACT US
                    </Button>
                  </Buttons>
                </Column>
                <Column size="half">
                  <Image as="figure" src="/images/slide-img.webp" alt="" />
                </Column>
              </Columns>
            </CarouselItem>
          ))}
        </Carousel>
      </Container>
    </Section>
  );
}

export default WelcomeCarousel;
