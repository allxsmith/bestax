import type { Metadata } from 'next';
import { Container, Content, Section, Title } from '@allxsmith/bestax-bulma';

export const metadata: Metadata = {
  title: 'About',
};

// A Server Component: bestax components render here directly. Reach a
// component's parts by their own export (NavbarItem, not Navbar.Item), since a
// Server Component can't reach them through the dot.
export default function About() {
  return (
    <main>
      <Section>
        <Container breakpoint="desktop" isMax>
          <Title size="1">About</Title>
          <Content>
            <p>
              A second page, and a Server Component, so the navbar has somewhere
              to go. To add a page, add a folder with a <code>page.tsx</code>{' '}
              under <code>src/app</code>, and link to it from the navbar in{' '}
              <code>src/Navigation.tsx</code>.
            </p>
          </Content>
        </Container>
      </Section>
    </main>
  );
}
