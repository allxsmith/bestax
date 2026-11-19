import Contact from './Contact.tsx';
import Gallery from './Gallery.tsx';
import Header from './Header.tsx';
import SiteFooter from './SiteFooter.tsx';
import Steps from './Steps.tsx';
import Testimonials from './Testimonials.tsx';

function App() {
  return (
    <div id="wrapper" className="has-text-centered-mobile">
      <Header />
      <Testimonials />
      <Steps />
      <Gallery />
      <Contact />
      <SiteFooter />
    </div>
  );
}

export default App;
