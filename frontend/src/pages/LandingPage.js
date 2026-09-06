import React, { Suspense, lazy, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HeroSection from '../components/home/HeroSection';

// Placeholder components for other sections
import HowItWorks from '../components/home/HowItWorks';
import FeatureCards from '../components/home/FeatureCards';
import Testimonials from '../components/home/Testimonials';
import FaqSection from '../components/home/FaqSection';
import CtaBanner from '../components/home/CtaBanner';

const MascotShowcase = lazy(() => import('../components/home/MascotShowcase'));

const LandingPage = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.slice(1));
      if (element) {
        const timer = setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [location]);

  return (
    <>
      <HeroSection />
      <HowItWorks />
      <FeatureCards />
      <Suspense
        // Keep the study-buddy anchor available while its code-split 3D
        // section is loading. Without this target, a direct /#meet-ace visit
        // can run the hash scroll before MascotShowcase has mounted and leave
        // the visitor at the Home hero.
        fallback={<div id="meet-ace" style={{ minHeight: '640px', background: '#f5f1ff' }} aria-hidden="true" />}
      >
        <MascotShowcase />
      </Suspense>
      <Testimonials />
      <FaqSection />
      <CtaBanner />
    </>
  );
};

export default LandingPage;
