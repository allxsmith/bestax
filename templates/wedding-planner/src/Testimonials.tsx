import {
  Box,
  Column,
  Columns,
  Container,
  Content,
  Media,
  Section,
} from '@allxsmith/bestax-bulma';

const testimonials = [
  {
    avatar: '/img/avatar-1.svg',
    text: 'Pellentesque nec nam aliquam sem et tortor.Tristique et egestas quis ipsum suspendisse.',
  },
  {
    avatar: '/img/avatar-2.svg',
    text: 'Libero id faucibus nisl tincidunt eget. Adipiscing elit pellentesque habitant morbi tristique senectus et netus et.',
  },
];

/** Two client quotes, side by side. */
function Testimonials() {
  return (
    <Section id="users-feed">
      <Container>
        <Columns>
          {testimonials.map(testimonial => (
            <Column key={testimonial.avatar}>
              <Box>
                <Media>
                  {/* The avatars show at their own size, as in the original,
                      whose 64x64 class sized nothing without `.image`. */}
                  <Media.Left as="div">
                    <figure>
                      <img src={testimonial.avatar} alt="" />
                    </figure>
                  </Media.Left>
                  <Media.Content>
                    <Content>
                      <p>
                        <strong>Some Name</strong> <small>@somename</small>
                        <br />
                        {testimonial.text}
                      </p>
                    </Content>
                  </Media.Content>
                </Media>
              </Box>
            </Column>
          ))}
        </Columns>
      </Container>
    </Section>
  );
}

export default Testimonials;
