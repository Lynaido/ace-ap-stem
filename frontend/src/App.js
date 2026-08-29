import React, { useEffect } from 'react';
import './styles/main.css';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';
import AuthLoading from './components/AuthLoading';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import SolveProblemsPage from './pages/SolveProblemsPage';
import TutorPage from './pages/TutorPage';
import NotesHubPage from './pages/NotesHubPage';
import StudyModePage from './pages/StudyModePage';
import AboutUsPage from './pages/AboutUsPage';
import ConceptNotesPage from './pages/ConceptNotesPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import PrivacyPage from './pages/PrivacyPage';
import PrimitivesTestPage from './pages/PrimitivesTestPage';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import AppShell from './components/layout/AppShell';

// Scroll to top component
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const MarketingLayout = ({ children }) => (
  <>
    <Header />
    <main>{children}</main>
    <Footer />
  </>
);

const ProductLayout = ({ children }) => (
  <ProtectedRoute>
    <AppShell>{children}</AppShell>
  </ProtectedRoute>
);

function HomePage() {
  const { isAuthenticated, isAuthLoading } = useAppContext();

  if (isAuthLoading) {
    return <AuthLoading />;
  }

  return isAuthenticated
    ? <AppShell><DashboardPage /></AppShell>
    : <MarketingLayout><LandingPage /></MarketingLayout>;
}

const NotFoundPage = () => (
  <MarketingLayout>
    <section className="not-found-page">
      <p>Page not found</p>
      <h1>Let us get you back to learning.</h1>
      <a className="btn btn-primary" href="/">Return home</a>
    </section>
  </MarketingLayout>
);

function App() {
  return (
    <AppProvider>
      <Router>
        <ScrollToTop />
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<ProductLayout><DashboardPage /></ProductLayout>} />
            <Route path="/solve-problems" element={<ProductLayout><SolveProblemsPage /></ProductLayout>} />
            <Route path="/tutor" element={<ProductLayout><TutorPage /></ProductLayout>} />
            <Route path="/notes-hub" element={<ProductLayout><NotesHubPage /></ProductLayout>} />
            <Route path="/study-mode" element={<ProductLayout><StudyModePage /></ProductLayout>} />
            <Route path="/concept-notes" element={<ProductLayout><ConceptNotesPage /></ProductLayout>} />
            <Route path="/about-us" element={<MarketingLayout><AboutUsPage /></MarketingLayout>} />
            <Route path="/sign-in" element={<MarketingLayout><SignInPage /></MarketingLayout>} />
            <Route path="/sign-up" element={<MarketingLayout><SignUpPage /></MarketingLayout>} />
            <Route path="/forgot-password" element={<MarketingLayout><ForgotPasswordPage /></MarketingLayout>} />
            <Route path="/reset-password" element={<MarketingLayout><ResetPasswordPage /></MarketingLayout>} />
            <Route path="/contact" element={<MarketingLayout><ContactPage /></MarketingLayout>} />
            <Route path="/faq" element={<MarketingLayout><FAQPage /></MarketingLayout>} />
            <Route path="/privacy" element={<MarketingLayout><PrivacyPage /></MarketingLayout>} />
            <Route path="/primitives-test" element={<ProductLayout><PrimitivesTestPage /></ProductLayout>} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </Router>
    </AppProvider>
  );
}

export default App;
