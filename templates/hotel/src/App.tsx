import About from './About.tsx';
import Contact from './Contact.tsx';
import Gallery from './Gallery.tsx';
import Rooms from './Rooms.tsx';
import SiteFooter from './SiteFooter.tsx';
import SiteHeader from './SiteHeader.tsx';

function App() {
  return (
    <>
      <SiteHeader />
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
