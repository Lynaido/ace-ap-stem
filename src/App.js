import React from 'react';
import './styles/main.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LandingPage from './pages/LandingPage';
import SolveProblemsPage from './pages/SolveProblemsPage';
import ConceptNotesPage from './pages/ConceptNotesPage';
import TutorPage from './pages/TutorPage';
import NotesHubPage from './pages/NotesHubPage';
import StudyModePage from './pages/StudyModePage';
import AboutUsPage from './pages/AboutUsPage';
import SignInPage from './pages/SignInPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import PrivacyPage from './pages/PrivacyPage';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

function App() {
  return (
    <Router>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/solve-problems" element={<SolveProblemsPage />} />
          <Route path="/concept-notes" element={<ConceptNotesPage />} />
          <Route path="/tutor" element={<TutorPage />} />
          <Route path="/notes-hub" element={<NotesHubPage />} />
          <Route path="/study-mode" element={<StudyModePage />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;