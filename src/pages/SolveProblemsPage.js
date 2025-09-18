import React, { useContext, useState } from 'react';
import AppContext from '../context/AppContext';
import Button from '../components/primitives/Button';
import Select from '../components/primitives/Select';
import './SolveProblemsPage.css';

const SolveProblemsPage = () => {
  const { dispatch } = useContext(AppContext);
  const [problemText, setProblemText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [inputMode, setInputMode] = useState('upload'); // 'upload' or 'text'

  const subjects = [
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'physics', label: 'Physics' },
    { value: 'chemistry', label: 'Chemistry' },
    { value: 'biology', label: 'Biology' },
    { value: 'calculus', label: 'Calculus' },
    { value: 'statistics', label: 'Statistics' }
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
    console.log('Solving problem:', { problemText, selectedSubject });
  };

  const handleGenerateLearningGuide = () => {
    console.log('Generate learning guide');
  };



  return (
    <div className="solve-problems-page">
      <div className="container">
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
      </div>
    </div>
  );
};

export default SolveProblemsPage;
