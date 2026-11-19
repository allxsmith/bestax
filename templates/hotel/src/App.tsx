import About from './About.tsx';
import Contact from './Contact.tsx';
import Gallery from './Gallery.tsx';
import Rooms from './Rooms.tsx';
import SiteFooter from './SiteFooter.tsx';
import WelcomeHero from './WelcomeHero.tsx';

function App() {
  return (
    <>
      <WelcomeHero />
      <main>
        <Rooms />
        <About />
        <Gallery />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}

export default App;
