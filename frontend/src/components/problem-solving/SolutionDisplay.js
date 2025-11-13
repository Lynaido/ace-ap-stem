import React, { useState, useEffect, memo } from 'react';
import LatexRenderer from '../primitives/LatexRenderer';
import Button from '../primitives/Button';
import Card from '../primitives/Card';
import SaveNotesModal from '../notes/SaveNotesModal';
import './SolutionDisplay.css';

const SolutionDisplay = ({ solution, problemText, onGetHints, onViewConceptNotes, isGeneratingHints, isGeneratingConceptNotes, onSave, folders = [], currentProblem }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showAllSteps, setShowAllSteps] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [lastSolutionId, setLastSolutionId] = useState(null);

  // Reset step navigation when solution changes
  useEffect(() => {
    if (solution?.id && solution.id !== lastSolutionId) {
      setCurrentStep(0);
      setShowAllSteps(false);
      setLastSolutionId(solution.id);
    }
  }, [solution?.id, lastSolutionId]);

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
        <h3 className="step-title"><LatexRenderer content={step.title} /></h3>
      </div>
      <div className="step-content">
        <div className="step-main-content"><LatexRenderer content={step.content} /></div>
        {step.explanation && (
          <div className="step-explanation">
            <strong>Why this step:</strong> <LatexRenderer content={step.explanation} />
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

      {(showAllSteps || currentStep === totalSteps - 1) && finalAnswer && (
        <div className="final-answer">
          <div className="final-answer-header">
            <h3>Final Answer</h3>
          </div>
          <div className="final-answer-content">
            {typeof finalAnswer === 'string' ? (
              <LatexRenderer content={finalAnswer} />
            ) : typeof finalAnswer === 'object' ? (
              <div className="final-answer-structured">
                {Object.entries(finalAnswer).map(([key, value]) => (
                  <div key={key} className="answer-field">
                    <strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong>{' '}
                    <LatexRenderer content={String(value)} />
                  </div>
                ))}
              </div>
            ) : (
              <LatexRenderer content={String(finalAnswer)} />
            )}
          </div>
        </div>
      )}

      {(onSave || onGetHints || onViewConceptNotes) && (
        <div className="solution-actions">
          {onSave && (
            <Button 
              variant="outline" 
              size="small"
              onClick={() => setShowSaveModal(true)}
            >
              Save Solution
            </Button>
          )}
          {onGetHints && (
            <Button 
              variant="outline" 
              size="small"
              onClick={onGetHints}
              disabled={isGeneratingHints}
            >
              {isGeneratingHints ? 'Generating...' : 'Get Hints Instead'}
            </Button>
          )}
          {onViewConceptNotes && (
            <Button 
              variant="outline" 
              size="small"
              onClick={onViewConceptNotes}
              disabled={isGeneratingConceptNotes}
            >
              {isGeneratingConceptNotes ? 'Generating...' : 'View Concept Notes'}
            </Button>
          )}
        </div>
      )}

      <SaveNotesModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={onSave}
        itemType="SOLUTION"
        itemData={{
          solutionId: solution.id,
          problemId: currentProblem?.id
        }}
        folders={folders}
        defaultTitle={currentProblem?.title || 'Solution'}
        defaultTags={currentProblem?.subject ? [currentProblem.subject] : []}
      />
    </Card>
  );
};

export default memo(SolutionDisplay);
