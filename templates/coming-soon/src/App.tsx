import {
  Column,
  Columns,
  Container,
  Hero,
  SubTitle,
  Title,
} from '@allxsmith/bestax-bulma';
import NotifyForm from './NotifyForm.tsx';
import SiteFooter from './SiteFooter.tsx';
import SocialLinks from './SocialLinks.tsx';

function App() {
  return (
    <Hero as="main" size="fullheight">
      <Hero.Body>
        <Container textAlign="centered">
          <Columns isCentered>
            <Column sizeTablet="10" sizeDesktop="10" sizeWidescreen="8">
              <Title size="1">COMING SOON.</Title>
              <Container className="area-center">
                <SocialLinks />
                <SubTitle as="p" size="5" mb="6">
                  Our website is under construction, but we are ready to go!
                  Want to know more about us, tell us about your project or just
                  to say hello? Contact us on social media and we will get back
                  as soon as possible.
                </SubTitle>
              </Container>
              <NotifyForm />
            </Column>
          </Columns>
        </Container>
      </Hero.Body>
      <SiteFooter />
    </Hero>
  );
}

export default App;
