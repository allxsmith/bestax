import {
  Carousel,
  CarouselItem,
  Container,
  Image,
  Paragraph,
  Section,
  SubTitle,
  Title,
} from '@allxsmith/bestax-bulma';

/** The original's two testimonials, which say the same thing. */
const testimonials = ['first', 'second'];

/**
 * The home page's testimonials, one at a time. The original drives this
 * slider with the same bulma-carousel call as the welcome one, so it looks
 * and moves the same way.
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
        <Carousel
          className="tropico-carousel"
          repeat={false}
          iconPrev="caret-left"
          iconNext="caret-right"
          iconFeatures="fa-lg"
          ariaLabel="Testimonials"
        >
          {testimonials.map(testimonial => (
            <CarouselItem key={testimonial}>
              <div className="has-text-centered">
                <Image
                  as="figure"
                  className="is-256x256"
                  mx="auto"
                  src="/images/client.webp"
                  alt=""
                />
                <Title size="3">George Ipsum</Title>
                <Paragraph>
                  There are many variations of passages of Lorem Ipsum
                  available, but the majority have suffered alteration in some
                  form, by injected humour, or randomised words which don&apos;t
                  look even slightly believable. If you are going to use a
                  passage of Lorem Ipsum, you need to be sure
                </Paragraph>
              </div>
            </CarouselItem>
          ))}
        </Carousel>
      </Container>
    </Section>
  );
}

export default Testimonials;
