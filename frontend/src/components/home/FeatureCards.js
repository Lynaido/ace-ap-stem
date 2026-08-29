import React from 'react';
import { Link } from 'react-router-dom';
import { FaComments, FaBrain, FaBook, FaLightbulb, FaListOl, FaFolderOpen } from 'react-icons/fa';
import './FeatureCards.css';

const features = [
  {
    icon: <FaListOl />,
    title: 'Solve Problems',
    description: 'Get a structured solution for the full question or only the sub-part you select.',
    link: '/solve-problems'
  },
  {
    icon: <FaLightbulb />,
    title: 'Step-by-Step Hints',
    description: 'Receive guided hints that help you understand the process without giving away the answer.',
    link: '/solve-problems' // Or a specific hints page
  },
  {
    icon: <FaBook />,
    title: 'Concept Notes',
    description: 'Review the essential ideas behind the selected problem without losing the original context.',
    link: '/concept-notes'
  },
  {
    icon: <FaComments />,
    title: 'Chatbot Tutor',
    description: 'Ask questions and get personalized explanations from your on-demand AI tutor.',
    link: '/tutor'
  },
  {
    icon: <FaFolderOpen />,
    title: 'Notes Hub',
    description: 'Save and organize problems, complete solutions, hints, and concept notes in one place.',
    link: '/notes-hub'
  },
  {
    icon: <FaBrain />,
    title: 'Study Mode',
    description: 'Generate practice quizzes and review key concepts to prepare for your exams.',
    link: '/study-mode'
  }
];

const FeatureCards = () => {
  return (
    <section className="feature-cards-section">
      <div className="feature-cards-container">
        <h2>Everything stays connected to what you chose.</h2>
        <div className="cards-grid">
          {features.map((feature, index) => (
            <Link to={feature.link} key={index} className="feature-card">
              <div className="card-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureCards;
