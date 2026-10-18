import {
  Box,
  Column,
  Columns,
  Container,
  Content,
  Media,
  Section,
} from '@allxsmith/bestax-bulma';

const reviews = [
  {
    avatar: '/media/man-user-person-male-profile-avatar-icon.svg',
    text: 'Pellentesque nec nam aliquam sem et tortor. Tristique et egestas quis ipsum suspendisse.',
  },
  {
    avatar: '/media/female-user-girl-person-glasses-avatar-icon.svg',
    text: 'Libero id faucibus nisl tincidunt eget. Adipiscing elit pellentesque habitant morbi tristique senectus et netus et.',
  },
];

/** What clients say, side by side from tablet width up. */
function Reviews() {
  return (
    <Section id="users-feed">
      <Container>
        <Columns>
          {reviews.map(review => (
            <Column key={review.avatar}>
              <Box>
                <Media>
                  <Media.Left as="div">
                    {/* The avatar shows at its SVG's own size, as the
                        original's does: its figure's is-64x64 set no size
                        without Bulma's image class beside it. */}
                    <figure>
                      <img src={review.avatar} alt="" />
                    </figure>
                  </Media.Left>
                  <Media.Content>
                    <Content>
                      <p>
                        <strong>Some Name</strong> <small>@somename</small>
                        <br />
                        {review.text}
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

export default Reviews;
