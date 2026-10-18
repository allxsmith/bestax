import { Container, Divider } from '@allxsmith/bestax-bulma';
import BrowseRentals from './BrowseRentals.tsx';
import LandlordsCta from './LandlordsCta.tsx';
import Marketplaces from './Marketplaces.tsx';
import RentalListings from './RentalListings.tsx';
import SearchHero from './SearchHero.tsx';
import SiteFooter from './SiteFooter.tsx';

function App() {
  return (
    <>
      <SearchHero />
      <RentalListings />
      <Container>
        <Divider />
      </Container>
      <Marketplaces />
      <BrowseRentals />
      <LandlordsCta />
      <SiteFooter />
    </>
  );
}

export default App;
