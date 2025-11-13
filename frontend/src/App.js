import React, { useEffect } from 'react';
import './styles/main.css';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LandingPage from './pages/LandingPage';
import SolveProblemsPage from './pages/SolveProblemsPage';
import TutorPage from './pages/TutorPage';
import NotesHubPage from './pages/NotesHubPage';
import StudyModePage from './pages/StudyModePage';
import AboutUsPage from './pages/AboutUsPage';
import ConceptNotesPage from './pages/ConceptNotesPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import PrivacyPage from './pages/PrivacyPage';
import PrimitivesTestPage from './pages/PrimitivesTestPage';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Scroll to top component
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <AppProvider>
      <Router>
        <ScrollToTop />
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/solve-problems" element={<ProtectedRoute><SolveProblemsPage /></ProtectedRoute>} />
            <Route path="/tutor" element={<TutorPage />} />
            <Route path="/notes-hub" element={<ProtectedRoute><NotesHubPage /></ProtectedRoute>} />
            <Route path="/study-mode" element={<ProtectedRoute><StudyModePage /></ProtectedRoute>} />
            <Route path="/concept-notes" element={<ConceptNotesPage />} />
            <Route path="/about-us" element={<AboutUsPage />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/primitives-test" element={<PrimitivesTestPage />} />
          </Routes>
        </main>
        <Footer />
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
