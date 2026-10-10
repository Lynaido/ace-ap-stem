import React, { Suspense, lazy } from 'react';

// Shares the landing-page customizer so learners keep one familiar control set.
const MascotShowcase = lazy(() => import('../components/home/MascotShowcase'));

const CustomizeAceyPage = () => (
  <div className="customize-acey-page">
    <Suspense fallback={<p className="customize-acey-page__loading" role="status">Preparing Acey…</p>}>
      <MascotShowcase variant="workspace" />
    </Suspense>
  </div>
);

export default CustomizeAceyPage;
