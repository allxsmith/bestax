import ContactSection from '../ContactSection.tsx';
import FreshFruits from '../FreshFruits.tsx';
import OurServices from '../OurServices.tsx';
import TastyBanner from '../TastyBanner.tsx';
import Testimonials from '../Testimonials.tsx';
import WelcomeCarousel from '../WelcomeCarousel.tsx';

/** The original's index.html. */
function HomePage() {
  return (
    <>
      <WelcomeCarousel />
      <OurServices />
      <FreshFruits />
      <TastyBanner />
      <Testimonials />
      <ContactSection />
    </>
  );
}

export default HomePage;
