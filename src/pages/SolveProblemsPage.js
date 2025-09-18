import React, { useContext, useState } from 'react';
import AppContext from '../context/AppContext';
import Button from '../components/primitives/Button';
import Select from '../components/primitives/Select';
import SolutionDisplay from '../components/problem-solving/SolutionDisplay';
import HintsDisplay from '../components/problem-solving/HintsDisplay';
import './SolveProblemsPage.css';

const SolveProblemsPage = () => {
  const { dispatch } = useContext(AppContext);
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
    <div className="solve-problems-page">
      <div className="container">
        {!showSolution ? (
          <div className="upload-card">
            <h1>Upload Your Problem</h1>

            <div className="upload-tabs">
              <button
                className={`tab-button ${inputMode === 'upload' ? 'active' : ''}`}
                onClick={handleImageUpload}
                disabled={isUploading}
              >
                <span className="tab-icon">📤</span>
                {isUploading ? 'Uploading...' : 'Upload Image'}
              </button>
              <button
                className={`tab-button ${inputMode === 'text' ? 'active' : ''}`}
                onClick={handleTypeProblem}
              >
                <span className="tab-icon">✏️</span>
                Type Problem
              </button>
            </div>

            <div className="upload-zone">
              {inputMode === 'upload' ? (
                <div className="image-drop-area">
                  <div className="drop-content">
                    <div className="document-icon">📄</div>
                    <p>Click to upload an image or drag and drop</p>
                  </div>
                </div>
              ) : (
                <textarea
                  className="text-input"
                  value={problemText}
                  onChange={(e) => setProblemText(e.target.value)}
                  placeholder="Type your problem here..."
                  rows={8}
                  autoFocus
                />
              )}
            </div>

            <div className="form-fields">
              <div className="field-group">
                <label className="field-label">Subject</label>
                <select 
                  value={selectedSubject}
                  onChange={(e) => {
                    console.log('Subject changed:', e.target.value);
                    setSelectedSubject(e.target.value);
                  }}
                  className="styled-select"
                >
                  <option value="">Select subject</option>
                  {subjects.map(subject => (
                    <option key={subject.value} value={subject.value}>
                      {subject.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Explanation Level</label>
                <select 
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
    </div>
  );
};

export default SolveProblemsPage;
