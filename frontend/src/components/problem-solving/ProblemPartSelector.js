import React, { useState } from 'react';
import Button from '../primitives/Button';
import Card from '../primitives/Card';
import './ProblemPartSelector.css';

/**
 * Shown after OCR detects that a problem contains multiple questions and/or
 * lettered sub-parts. Lets the student pick exactly what to solve so that the
 * Full Solution, Step-by-Step Hints and Concept Notes all target the same part.
 *
 * Props:
 *  - structure: { extractedText, questions: [{ id, label, text, parts: [{id,label,text}] }] }
 *  - onSelect(focus): called with the chosen SolveFocus object
 *  - onCancel(): optional, go back to the input form
 *  - busy: disables the buttons while a request is in flight
 */
const ProblemPartSelector = ({ structure, onSelect, onCancel, busy }) => {
  const questions = structure?.questions || [];
  const extractedText = structure?.extractedText || '';

  // If there's only one question, jump straight to its parts.
  const [selectedQuestionId, setSelectedQuestionId] = useState(
    questions.length === 1 ? questions[0].id : null
  );

  const selectedQuestion =
    questions.find((q) => q.id === selectedQuestionId) || null;

  const chooseWholeQuestion = (question) => {
    const partLabels = (question.parts || []).map((p) => p.label);
    if (partLabels.length > 0) {
      onSelect({
        scope: 'all',
        questionLabel: question.label,
        siblingLabels: partLabels,
        focusText: question.text || '',
        contextText: extractedText,
      });
    } else {
      // A single question with no sub-parts: just solve that question.
      onSelect({
        scope: 'question',
        questionLabel: question.label,
        focusText: question.text || '',
        contextText: extractedText,
      });
    }
  };

  const choosePart = (question, part) => {
    const siblingLabels = (question.parts || [])
      .filter((p) => p.id !== part.id)
      .map((p) => p.label);
    onSelect({
      scope: 'part',
      questionLabel: question.label,
      partLabel: part.label,
      focusText: part.text || '',
      contextText: extractedText,
      siblingLabels,
    });
  };

  return (
    <Card className="part-selector">
      <div className="part-selector-header">
        <span className="part-selector-badge" aria-hidden="true">🧩</span>
        <div>
          <h2>We found more than one part in this problem</h2>
          <p>Choose what you'd like the AI to work on. This applies to the Solution, Hints and Concept Notes.</p>
        </div>
      </div>

      {/* Step 1: pick a question (only when there are several) */}
      {questions.length > 1 && (
        <div className="part-selector-section">
          <p className="part-selector-step-label">1. Select a question</p>
          <div className="part-selector-options">
            {questions.map((q) => (
              <button
                key={q.id}
                type="button"
                className={`part-option question-option ${
                  selectedQuestionId === q.id ? 'active' : ''
                }`}
                onClick={() => setSelectedQuestionId(q.id)}
                disabled={busy}
              >
                <span className="part-option-label">{q.label}</span>
                {q.parts?.length > 0 && (
                  <span className="part-option-hint">
                    {q.parts.length} sub-parts
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: for the selected question, pick whole or a single sub-part */}
      {selectedQuestion && (
        <div className="part-selector-section">
          <p className="part-selector-step-label">
            {questions.length > 1 ? '2. ' : ''}
            What should we solve in {selectedQuestion.label}?
          </p>
          <div className="part-selector-options">
            <button
              type="button"
              className="part-option whole-option"
              onClick={() => chooseWholeQuestion(selectedQuestion)}
              disabled={busy}
            >
              <span className="part-option-label">
                Solve all of {selectedQuestion.label}
              </span>
              {selectedQuestion.parts?.length > 0 && (
                <span className="part-option-hint">
                  {selectedQuestion.parts.map((p) => p.label).join(' → ')}
                </span>
              )}
            </button>

            {(selectedQuestion.parts || []).map((part) => (
              <button
                key={part.id}
                type="button"
                className="part-option"
                onClick={() => choosePart(selectedQuestion, part)}
                disabled={busy}
                title={part.text}
              >
                <span className="part-option-label">Only {part.label}</span>
                {part.text && (
                  <span className="part-option-hint">
                    {part.text.length > 70
                      ? `${part.text.substring(0, 70)}…`
                      : part.text}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {onCancel && (
        <div className="part-selector-footer">
          <Button variant="outline" size="small" onClick={onCancel} disabled={busy}>
            ← Back
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ProblemPartSelector;
