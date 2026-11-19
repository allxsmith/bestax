import { Column, Columns, Container, Hero } from '@allxsmith/bestax-bulma';
import AccountLinks from './AccountLinks.tsx';
import LoginForm from './LoginForm.tsx';
import SiteFooter from './SiteFooter.tsx';

function App() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Hero id="main-content" as="main" size="fullheight">
        <Hero.Body>
          <Container>
            <Columns isCentered>
              <Column
                sizeMobile="12"
                sizeTablet="8"
                sizeDesktop="8"
                sizeWidescreen="4"
              >
                <LoginForm />
                <AccountLinks />
              </Column>
            </Columns>
          </Container>
        </Hero.Body>
        <SiteFooter />
      </Hero>
    </>
  );
}

export default App;
