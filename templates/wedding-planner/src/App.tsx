import Contact from './Contact.tsx';
import Gallery from './Gallery.tsx';
import Reviews from './Reviews.tsx';
import SiteFooter from './SiteFooter.tsx';
import SiteHero from './SiteHero.tsx';
import Steps from './Steps.tsx';

function App() {
  return (
    <div id="wrapper" className="has-text-centered-mobile">
      <SiteHero />
      <Reviews />
      <Steps />
      <Gallery />
      <Contact />
      <SiteFooter />
    </div>
  );
}

export default App;
