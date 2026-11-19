import { Container } from '@allxsmith/bestax-bulma';
import Browse from './Browse.tsx';
import Landlords from './Landlords.tsx';
import Listings from './Listings.tsx';
import Marketplaces from './Marketplaces.tsx';
import SearchHero from './SearchHero.tsx';
import SiteFooter from './SiteFooter.tsx';

function App() {
  return (
    <>
      {/* Each Hero renders a <section>, so the page's <main> wraps them. */}
      <main>
        <SearchHero />
        <Listings />
        <Container>
          <hr />
        </Container>
        <Marketplaces />
        <Browse />
        <Landlords />
      </main>
      <SiteFooter />
    </>
  );
}

export default App;
