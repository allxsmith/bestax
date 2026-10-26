import {
  Button,
  Buttons,
  CarouselItem,
  Column,
  Columns,
  Container,
  Image,
  Section,
  Title,
} from '@allxsmith/bestax-bulma';
import TropicoCarousel from './TropicoCarousel.tsx';

const slides = [1, 2, 3];

/**
 * The home page's opening carousel. The original's buttons each carry two
 * colors (`is-black is-primary`, `is-orange is-link`); its own
 * `.button.is-black` and `.button.is-orange` rules decide how they look, so
 * the black one keeps only `is-black`.
 */
function HeroCarousel() {
  return (
    <Section id="carousel-section">
      {/* The original's `pb-6` was on the element bulma-carousel built its
          slider in, so it sat below the slides and their dots. */}
      <Container pb="6">
        <TropicoCarousel label="Welcome">
          {slides.map(slide => (
            <CarouselItem key={slide}>
              <Columns>
                <Column size="half">
                  <Title as="h2" textSize="1">
                    Welcome to Our Fruits Shop
                  </Title>
                  <p>
                    There are many variations of passages of Lorem Ipsum
                    available, but the majority have suffered alteration in some
                    form, by injected humour, or randomised words which don't
                    look even slightly believable.
                  </p>
                  <br />
                  <Buttons>
                    <Button
                      size="medium"
                      color="link"
                      isLight
                      className="is-orange"
                    >
                      SHOP NOW
                    </Button>
                    <Button size="medium" color="black" isLight>
                      CONTACT US
                    </Button>
                  </Buttons>
                </Column>
                <Column size="half">
                  <Image as="figure" src="/images/slide-img.svg" alt="" />
                </Column>
              </Columns>
            </CarouselItem>
          ))}
        </TropicoCarousel>
      </Container>
    </Section>
  );
}

export default HeroCarousel;
