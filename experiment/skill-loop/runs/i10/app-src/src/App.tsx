import { Theme } from '@allxsmith/bestax-bulma';
import SiteNav from './components/SiteNav';
import HeroSection from './components/HeroSection';
import Benchmarks from './components/Benchmarks';
import Features from './components/Features';
import Pricing from './components/Pricing';
import Testimonials from './components/Testimonials';
import Waitlist from './components/Waitlist';
import SiteFooter from './components/SiteFooter';
import './site.css';

// Single-mode dark design → pin the scheme so an OS light/dark preference can't
// invert text out from under the fixed palette. SkyNet brand = electric azure.
function App() {
  return (
    <Theme isRoot colorMode="dark" primaryH="199" primaryS="94%" primaryL="52%">
      <SiteNav />
      <HeroSection />
      <Benchmarks />
      <Features />
      <Pricing />
      <Testimonials />
      <Waitlist />
      <SiteFooter />
    </Theme>
  );
}

export default App;
