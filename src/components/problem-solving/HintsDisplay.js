import React, { useState } from 'react';
import Button from '../primitives/Button';
import Card from '../primitives/Card';
import './HintsDisplay.css';

const HintsDisplay = ({ hints, problemText, onGetSolution, onViewConceptNotes, isGeneratingSolution, isGeneratingConceptNotes }) => {
  const [revealedHints, setRevealedHints] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  if (!hints || !hints.length) {
    return null;
  }

  const handleRevealNext = () => {
    if (revealedHints < hints.length) {
      setRevealedHints(revealedHints + 1);
    }
  };

  const handleRevealAnswer = () => {
    setShowAnswer(true);
  };

  const handleReset = () => {
    setRevealedHints(0);
    setShowAnswer(false);
  };

  const handleGetSolution = () => {
    if (onGetSolution) {
      onGetSolution();
    }
  };

  const canRevealMore = revealedHints < hints.length;
  const allHintsRevealed = revealedHints === hints.length;

  return (
    <Card className="hints-display">
      <div className="hints-header">
        <h2>Problem Hints</h2>
        <div className="hints-progress">
          <span className="hints-counter">
            {revealedHints} of {hints.length} hints revealed
          </span>
          <div className="hints-progress-bar">
            <div 
              className="hints-progress-fill"
              style={{ width: `${(revealedHints / hints.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="hints-description">
        <p>Work through this problem step by step. Each hint will guide you closer to the solution.</p>
      </div>

      <div className="hints-content">
        {hints.slice(0, revealedHints).map((hint, index) => (
          <div key={index} className="hint-item">
            <div className="hint-header">
              <div className="hint-number">{index + 1}</div>
              <div className="hint-type">{hint.type || 'Hint'}</div>
            </div>
            <div className="hint-content">
              <p className="hint-text">{hint.text}</p>
              {hint.explanation && (
                <div className="hint-explanation">
                  <strong>Why this helps:</strong> {hint.explanation}
                </div>
              )}
            </div>
          </div>
        ))}

        {revealedHints === 0 && (
          <div className="no-hints-message">
            <p>Ready to get started? Click "Reveal Next Hint" to begin working through this problem.</p>
          </div>
        )}
      </div>

      <div className="hints-actions">
        <div className="primary-actions">
          {canRevealMore && (
            <Button
              variant="primary"
              onClick={handleRevealNext}
              className="reveal-button"
            >
              Reveal Next Hint ({revealedHints + 1}/{hints.length})
            </Button>
          )}
          
          {allHintsRevealed && !showAnswer && (
            <Button
              variant="primary"
              onClick={handleRevealAnswer}
              className="reveal-answer-button"
            >
              Show Final Answer
            </Button>
          )}
        </div>

        <div className="secondary-actions">
          <Button
            variant="outline"
            size="small"
            onClick={handleReset}
            disabled={revealedHints === 0 && !showAnswer}
          >
            Reset Hints
          </Button>
          <Button
            variant="outline"
            size="small"
            onClick={handleGetSolution}
            disabled={isGeneratingSolution}
          >
            {isGeneratingSolution ? 'Generating...' : 'Get Full Solution'}
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
      </div>

      {showAnswer && hints.find(h => h.isAnswer) && (
        <div className="final-answer-section">
          <div className="final-answer-header">
            <h3>Final Answer</h3>
          </div>
          <div className="final-answer-content">
            <p>{hints.find(h => h.isAnswer).text}</p>
            {hints.find(h => h.isAnswer).explanation && (
              <div className="answer-explanation">
                <strong>Solution Summary:</strong> {hints.find(h => h.isAnswer).explanation}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="hints-tips">
        <div className="tips-header">
          <h4>💡 Study Tips</h4>
        </div>
        <ul className="tips-list">
          <li>Try to understand each hint before revealing the next one</li>
          <li>Think about how each hint connects to the problem</li>
          <li>Consider attempting the problem steps yourself between hints</li>
        </ul>
      </div>
    </Card>
  );
};

export default HintsDisplay;