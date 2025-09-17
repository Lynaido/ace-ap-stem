import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../primitives/Button';
import Select from '../primitives/Select';
import Card from '../primitives/Card';
import './ProblemInputModule.css';

const ProblemInputModule = () => {
  const { 
    currentProblem,
    submitProblem,
    generateSolution,
    setError,
    clearCurrentProblem
  } = useAppContext();
  const [problemText, setProblemText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subjects = [
    { value: 'ap-physics', label: 'AP Physics' },
    { value: 'ap-calculus', label: 'AP Calculus' },
    { value: 'ap-chemistry', label: 'AP Chemistry' },
    { value: 'ap-biology', label: 'AP Biology' },
    { value: 'ap-statistics', label: 'AP Statistics' },
    { value: 'general-math', label: 'General Mathematics' }
  ];

  const handleSubmitProblem = async () => {
    if (!problemText.trim() || !selectedSubject) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock problem submission
      const newProblem = {
        id: Date.now().toString(),
        text: problemText.trim(),
        subject: selectedSubject,
        timestamp: new Date().toISOString(),
        status: 'processing'
      };

      submitProblem(newProblem);

      // Mock solution generation after submission
      setTimeout(() => {
        generateSolution({
          problemId: newProblem.id,
          solution: {
            steps: [
              {
                id: 1,
                title: 'Identify Given Information',
                content: 'First, let\'s identify what information we have from the problem statement.',
                explanation: 'This step helps us organize our approach and understand what we\'re working with.'
              },
              {
                id: 2,
                title: 'Apply Relevant Formula',
                content: 'Based on the problem type, we\'ll apply the appropriate formula or principle.',
                explanation: 'This is where we connect the problem to the underlying mathematical or scientific concepts.'
              },
              {
                id: 3,
                title: 'Calculate the Result',
                content: 'Now we\'ll substitute our values and perform the calculations.',
                explanation: 'Step-by-step calculation ensures accuracy and helps identify any errors.'
              }
            ],
            finalAnswer: 'The solution demonstrates the key concepts and provides a clear path to the answer.',
            confidence: 0.95
          }
        });
      }, 2000);

    } catch (error) {
      console.error('Error submitting problem:', error);
      setError('Failed to submit problem. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearInput = () => {
    setProblemText('');
    setSelectedSubject('');
    clearCurrentProblem();
  };

  const isSubmitDisabled = !problemText.trim() || !selectedSubject || isSubmitting;

  return (
    <Card className="problem-input-module">
      <div className="problem-input-header">
        <h2>Solve a Problem</h2>
        <p>Enter your AP STEM problem below and select the subject area for targeted assistance.</p>
      </div>

      <div className="problem-input-form">
        <div className="form-group">
          <label htmlFor="subject-select" className="form-label">
            Subject Area
          </label>
          <Select
            id="subject-select"
            options={subjects}
            value={selectedSubject}
            onChange={setSelectedSubject}
            placeholder="Choose a subject..."
            className="subject-selector"
          />
        </div>

        <div className="form-group">
          <label htmlFor="problem-text" className="form-label">
            Problem Statement
          </label>
          <textarea
            id="problem-text"
            className="problem-text-input"
            value={problemText}
            onChange={(e) => setProblemText(e.target.value)}
            placeholder="Paste or type your problem here. Include all given information, diagrams descriptions, and what you need to find..."
            rows={6}
            disabled={isSubmitting}
          />
        </div>

        <div className="problem-input-actions">
          <Button
            variant="ghost"
            onClick={handleClearInput}
            disabled={isSubmitting || (!problemText && !selectedSubject)}
            className="clear-button"
          >
            Clear
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmitProblem}
            disabled={isSubmitDisabled}
            loading={isSubmitting}
            className="submit-button"
          >
            {isSubmitting ? 'Analyzing...' : 'Solve Problem'}
          </Button>
        </div>
      </div>

      {currentProblem && (
        <div className="current-problem-status">
          <div className="status-indicator">
            <div className={`status-dot ${currentProblem.status}`}></div>
            <span className="status-text">
              {currentProblem.status === 'processing' 
                ? 'Analyzing your problem...' 
                : 'Problem solved successfully'}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ProblemInputModule;