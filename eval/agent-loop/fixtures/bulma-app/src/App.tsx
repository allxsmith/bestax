import { Contact } from './components/Contact';
import { Features } from './components/Features';
import { Hero } from './components/Hero';
import { Pricing } from './components/Pricing';
import { SiteFooter } from './components/SiteFooter';
import { SiteNavbar } from './components/SiteNavbar';
import { Team } from './components/Team';

export default function App() {
  return (
    <>
      <SiteNavbar />
      <Hero />
      <Features />
      <Pricing />
      <Team />
      <Contact />
      <SiteFooter />
    </>
  );
}
