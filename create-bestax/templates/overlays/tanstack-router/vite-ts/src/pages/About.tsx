import { Container, Content, Section, Title } from '@allxsmith/bestax-bulma';

function About() {
  return (
    <main>
      <Section>
        <Container breakpoint="desktop" isMax>
          <Title size="1">About</Title>
          <Content>
            <p>
              A second page, so the navbar has somewhere to go. To add a page,
              write it in <code>src/pages</code>, add a route for it in{' '}
              <code>src/router.tsx</code>, and link to it from the navbar in{' '}
              <code>src/Layout.tsx</code> with <code>NavbarLink</code>.
            </p>
          </Content>
        </Container>
      </Section>
    </main>
  );
}

export default About;
