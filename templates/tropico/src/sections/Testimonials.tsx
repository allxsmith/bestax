import {
  CarouselItem,
  Container,
  Image,
  Section,
  SubTitle,
  Title,
} from '@allxsmith/bestax-bulma';
import TropicoCarousel from './TropicoCarousel.tsx';

const testimonials = [1, 2];

/**
 * The home page's testimonials. The original's script attaches bulma-carousel
 * to `#carousel-demo`, an id this carousel shares with the opening one, so
 * the testimonials are a carousel too.
 */
function Testimonials() {
  return (
    <Section>
      <div className="has-text-centered">
        <Title size="1">Testimonial</Title>
        <SubTitle as="h4">
          There are many variations of passages of Lorem Ipsum available, but
          the majority have
        </SubTitle>
      </div>
      <Container>
        <TropicoCarousel label="Testimonials">
          {testimonials.map(testimonial => (
            <CarouselItem key={testimonial}>
              <Container>
                <div className="has-text-centered">
                  <Image
                    as="figure"
                    className="is-256x256"
                    mx="auto"
                    src="/images/client.webp"
                    alt=""
                  />
                  <Title size="3">George Ipsum</Title>
                  <p>
                    There are many variations of passages of Lorem Ipsum
                    available, but the majority have suffered alteration in some
                    form, by injected humour, or randomised words which don't
                    look even slightly believable. If you are going to use a
                    passage of Lorem Ipsum, you need to be sure
                  </p>
                </div>
              </Container>
            </CarouselItem>
          ))}
        </TropicoCarousel>
      </Container>
    </Section>
  );
}

export default Testimonials;
