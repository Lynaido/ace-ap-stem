import React from 'react';
import HeroSection from '../components/home/HeroSection';

// Placeholder components for other sections
import HowItWorks from '../components/home/HowItWorks';
import FeatureCards from '../components/home/FeatureCards';
import Testimonials from '../components/home/Testimonials';
import CtaBanner from '../components/home/CtaBanner';


const LandingPage = () => {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <FeatureCards />
      <Testimonials />
      <CtaBanner />
    </>
  );
};

export default LandingPage;