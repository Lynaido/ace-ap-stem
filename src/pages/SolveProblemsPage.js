import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/primitives/Button';
import SolutionDisplay from '../components/problem-solving/SolutionDisplay';
import HintsDisplay from '../components/problem-solving/HintsDisplay';
import ChatPanel from '../components/chat/ChatPanel';
import './SolveProblemsPage.css';

const SolveProblemsPage = () => {
  const [problemText, setProblemText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [inputMode, setInputMode] = useState('upload'); // 'upload' or 'text'
  const [showSolution, setShowSolution] = useState(false);
  const [solution, setSolution] = useState(null);
  const [hints, setHints] = useState(null);

  const subjects = [
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'physics', label: 'Physics' },
    { value: 'chemistry', label: 'Chemistry' },
    { value: 'biology', label: 'Biology' },
    { value: 'calculus', label: 'Calculus' },
    { value: 'statistics', label: 'Statistics' }
  ];

  const mockSolution = {
    steps: [
      { id: 1, title: 'Understand the Problem', content: 'The first step is to carefully read and understand the problem statement.', explanation: 'This ensures you know what is being asked.' },
      { id: 2, title: 'Identify Key Information', content: 'Extract all the given values and constraints from the problem.', explanation: 'This helps in setting up the problem correctly.' },
      { id: 3, title: 'Formulate a Plan', content: 'Devise a plan to solve the problem. This may involve choosing the right formulas or algorithms.', explanation: 'A good plan is a roadmap to the solution.' },
      { id: 4, title: 'Execute the Plan', content: 'Carry out the steps as per your plan, performing all the calculations carefully.', explanation: 'This is where you solve the problem.' },
      { id: 5, title: 'Review and Verify', content: 'Check your answer to make sure it is correct and makes sense in the context of the problem.', explanation: 'This helps in catching errors.' },
    ],
    finalAnswer: 'The final answer is 42.',
    confidence: 0.95,
  };

  const mockHints = [
    { type: 'Initial Thought', text: 'What is the core question being asked?', explanation: 'Focusing on the main goal helps to ignore irrelevant information.' },
    { type: 'Formula Hint', text: 'You might need the formula a^2 + b^2 = c^2.', explanation: 'This is the Pythagorean theorem, useful for right-angled triangles.' },
    { type: 'Step Hint', text: 'Try to calculate the value of the intermediate variable x first.', explanation: 'Breaking the problem down into smaller parts makes it easier to solve.' },
    { isAnswer: true, text: 'The final answer is 42.', explanation: 'This is the solution to the problem.' },
  ];

  const chatInitialMessages = [
    {
      id: 1,
      text: 'Welcome to the AI Tutor! Upload or type your problem, and I will help you solve it.',
      sender: 'ai',
      timestamp: new Date(),
    },
  ];

  const iconProps = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    focusable: 'false',
    'aria-hidden': true,
  };

  const handleImageUpload = () => {
    setInputMode('upload');
    setProblemText('');
    setIsUploading(true);

    // Simulate upload
    setTimeout(() => {
      setIsUploading(false);
    }, 2000);
  };

  const handleTypeProblem = () => {
    setInputMode('text');
    setProblemText('');
  };

  const handleSolveProblem = () => {
    if (!problemText.trim() && !selectedSubject) return;

    // Mock problem solving
    setSolution(mockSolution);
    setHints(mockHints);
    setShowSolution(true);
    console.log('Solving problem:', { problemText, selectedSubject });
  };

  const handleGenerateLearningGuide = () => {
    console.log('Generate learning guide');
  };

  return (
    <div className={`solve-problems-page ${showSolution ? 'solution-mode' : 'upload-mode'}`}>
      <div className="solve-problems-layout">
        <div className="main-content">
          {!showSolution ? (
            <div className="upload-card">
              <div className="card-top-bar">
                <Link to="/notes-hub" className="notes-link" aria-label="Go to Notes Hub (List of Notes)">
                  <span className="notes-link-icon" aria-hidden="true">📒</span>
                  <span className="notes-link-text">List of Notes</span>
                </Link>
              </div>
              <div className="card-heading">
                <h1>Upload Your Problem</h1>
                <p className="card-subtitle">
                  Share a question or upload a snapshot and we will walk through the solution with you step by step.
                </p>
              </div>

              <div className="upload-tabs" role="tablist" aria-label="Problem input methods">
                <button
                  type="button"
                  className={`tab-button ${inputMode === 'upload' ? 'active' : ''}`}
                  onClick={handleImageUpload}
                  disabled={isUploading}
                  aria-pressed={inputMode === 'upload'}
                >
                  <span className="tab-icon">
                    <svg {...iconProps}>
                      <path d="M12 16V4" />
                      <path d="M8 8l4-4 4 4" />
                      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                    </svg>
                  </span>
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                </button>
                <button
                  type="button"
                  className={`tab-button ${inputMode === 'text' ? 'active' : ''}`}
                  onClick={handleTypeProblem}
                  aria-pressed={inputMode === 'text'}
                >
                  <span className="tab-icon">
                    <svg {...iconProps}>
                      <path d="M12 20h9" />
                      <path d="M19 20v-9a2 2 0 0 0-2-2h-6l-4-4H5a2 2 0 0 0-2 2v11" />
                      <path d="M9 13h6" />
                      <path d="M9 17h3" />
                    </svg>
                  </span>
                  Type Problem
                </button>
              </div>

              <div className="upload-zone" role="region" aria-live="polite">
                {inputMode === 'upload' ? (
                  <div className="image-drop-area" tabIndex={0} role="button" aria-label="Upload an image of the problem">
                    <div className="drop-content">
                      <div className="document-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true">
                          <path d="M7 3h7l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                          <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                          <path d="M9 13h6" />
                          <path d="M9 17h4" />
                        </svg>
                      </div>
                      <p className="drop-title">Click to upload an image or drag and drop</p>
                      <p className="drop-hint">PNG, JPG or PDF up to 10MB</p>
                    </div>
                  </div>
                ) : (
                  <textarea
                    className="text-input"
                    value={problemText}
                    onChange={(e) => setProblemText(e.target.value)}
                    placeholder="Type your problem here..."
                    rows={8}
                  />
                )}
              </div>

              <div className="form-fields" aria-label="Problem details">
                <div className="field-group">
                  <label className="field-label" htmlFor="subject-select">Subject</label>
                  <select
                    id="subject-select"
                    value={selectedSubject}
                    onChange={(e) => {
                      console.log('Subject changed:', e.target.value);
                      setSelectedSubject(e.target.value);
                    }}
                    className="styled-select"
                  >
                    <option value="">Select subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.value} value={subject.value}>
                        {subject.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label" htmlFor="level-select">Explanation Level</label>
                  <select
                    id="level-select"
                    onChange={(e) => {
                      console.log('Level changed:', e.target.value);
                    }}
                    className="styled-select"
                  >
                    <option value="">Select level</option>
                    <option value="basic">Basic</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="action-row">
                <Button
                  variant="primary"
                  size="large"
                  onClick={handleSolveProblem}
                  disabled={!problemText.trim() && !selectedSubject}
                  className="solve-btn"
                >
                  Solve Problem
                </Button>
                <Button
                  variant="outline"
                  size="large"
                  onClick={handleGenerateLearningGuide}
                  className="guide-btn"
                >
                  Generate Learning Guide
                </Button>
              </div>
            </div>
          ) : (
            <>
              <SolutionDisplay solution={solution} problemText={problemText} />
              <HintsDisplay hints={hints} problemText={problemText} />
            </>
          )}
        </div>
        <div className="chat-sidebar">
          <ChatPanel initialMessages={chatInitialMessages} className="chat-panel-elevated" />
        </div>
      </div>
    </div>
  );
};

export default SolveProblemsPage;
