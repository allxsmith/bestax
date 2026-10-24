import ContactSection from '../sections/ContactSection.tsx';
import FreshFruitsSection from '../sections/FreshFruitsSection.tsx';
import HeroCarousel from '../sections/HeroCarousel.tsx';
import ServicesSection from '../sections/ServicesSection.tsx';
import TastyBanner from '../sections/TastyBanner.tsx';
import Testimonials from '../sections/Testimonials.tsx';

/** The original's `index.html`. */
function HomePage() {
  return (
    <>
      <HeroCarousel />
      <ServicesSection />
      <FreshFruitsSection />
      <TastyBanner />
      <Testimonials />
      <ContactSection />
    </>
  );
}

export default HomePage;
