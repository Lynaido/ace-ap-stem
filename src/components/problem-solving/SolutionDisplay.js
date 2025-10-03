import React, { useState } from 'react';
import Button from '../primitives/Button';
import Card from '../primitives/Card';
import './SolutionDisplay.css';

const SolutionDisplay = ({ solution, problemText, onGetHints, onViewConceptNotes, isGeneratingHints, isGeneratingConceptNotes }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showAllSteps, setShowAllSteps] = useState(false);

  if (!solution || !solution.steps) {
    return null;
  }

  const { steps, finalAnswer, confidence } = solution;
  const totalSteps = steps.length;

  const handleNextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleShowAll = () => {
    setShowAllSteps(!showAllSteps);
  };

  const handleStepClick = (stepIndex) => {
    setCurrentStep(stepIndex);
    setShowAllSteps(false);
  };

  const renderStepNavigation = () => (
    <div className="step-navigation">
      <div className="step-progress">
        <span className="step-counter">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>
      <div className="step-controls">
        <Button
          variant="ghost"
          size="small"
          onClick={handlePrevStep}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="small"
          onClick={handleShowAll}
        >
          {showAllSteps ? 'Step View' : 'Show All'}
        </Button>
        <Button
          variant="ghost"
          size="small"
          onClick={handleNextStep}
          disabled={currentStep === totalSteps - 1}
        >
          Next
        </Button>
      </div>
    </div>
  );

  const renderStepContent = (step, index, isActive = false) => (
    <div 
      key={step.id} 
      className={`solution-step ${isActive ? 'active' : ''} ${showAllSteps ? 'show-all' : ''}`}
      onClick={showAllSteps ? () => handleStepClick(index) : undefined}
    >
      <div className="step-header">
        <div className="step-number">{index + 1}</div>
        <h3 className="step-title">{step.title}</h3>
      </div>
      <div className="step-content">
        <p className="step-main-content">{step.content}</p>
        {step.explanation && (
          <div className="step-explanation">
            <strong>Why this step:</strong> {step.explanation}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card className="solution-display">
      <div className="solution-header">
        <h2>Solution</h2>
        <div className="solution-meta">
          <div className="confidence-indicator">
            <span className="confidence-label">Confidence:</span>
            <div className="confidence-bar">
              <div 
                className="confidence-fill" 
                style={{ width: `${confidence * 100}%` }}
              />
            </div>
            <span className="confidence-value">{Math.round(confidence * 100)}%</span>
          </div>
        </div>
      </div>

      {renderStepNavigation()}

      <div className="solution-content">
        {showAllSteps ? (
          <div className="all-steps-view">
            {steps.map((step, index) => renderStepContent(step, index, false))}
          </div>
        ) : (
          <div className="single-step-view">
            {renderStepContent(steps[currentStep], currentStep, true)}
          </div>
        )}
      </div>

      {(showAllSteps || currentStep === totalSteps - 1) && (
        <div className="final-answer">
          <div className="final-answer-header">
            <h3>Final Answer</h3>
          </div>
          <div className="final-answer-content">
            <p>{finalAnswer}</p>
          </div>
        </div>
      )}

      <div className="solution-actions">
        <Button 
          variant="outline" 
          size="small"
          onClick={() => {
            // TODO: Implement save to notes functionality
            alert('Solution saved! (This will be implemented to save to your notes)');
          }}
        >
          Save Solution
        </Button>
        <Button 
          variant="outline" 
          size="small"
          onClick={onGetHints}
          disabled={isGeneratingHints}
        >
          {isGeneratingHints ? 'Generating...' : 'Get Hints Instead'}
        </Button>
        <Button 
          variant="outline" 
          size="small"
          onClick={onViewConceptNotes}
          disabled={isGeneratingConceptNotes}
        >
          {isGeneratingConceptNotes ? 'Generating...' : 'View Concept Notes'}
        </Button>
      </div>
    </Card>
  );
};

export default SolutionDisplay;