import {
  Column,
  Columns,
  Container,
  Hero,
  SubTitle,
  Title,
} from '@allxsmith/bestax-bulma';
import SignupForm from './SignupForm.tsx';
import SiteFooter from './SiteFooter.tsx';
import SocialLinks from './SocialLinks.tsx';

function App() {
  return (
    // Hero renders a <section>, so the page's <main> wraps it.
    <main>
      <Hero size="fullheight">
        <Hero.Body>
          <Container textAlign="centered">
            <Columns isCentered>
              <Column sizeTablet="10" sizeDesktop="10" sizeWidescreen="8">
                <Title size="1">COMING SOON.</Title>
                {/* `area-center` is the original's entrance animation. */}
                <Container className="area-center">
                  <SocialLinks />
                  <SubTitle as="p" size="5" mb="6">
                    Our website is under construction, but we are ready to go!
                    Want to know more about us, tell us about your project or
                    just to say hello? Contact us on social media and we will
                    get back as soon as possible.
                  </SubTitle>
                </Container>
                <SignupForm />
              </Column>
            </Columns>
          </Container>
        </Hero.Body>
        <SiteFooter />
      </Hero>
    </main>
  );
}

export default App;
