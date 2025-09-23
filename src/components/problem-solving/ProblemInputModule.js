import React, { useState } from 'react';
import { FaBolt, FaEye, FaRegLightbulb } from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';
import Button from '../primitives/Button';
import Select from '../primitives/Select';
import Card from '../primitives/Card';
import './ProblemInputModule.css';

const AP_SUBJECTS = [
  { value: 'ap-physics-1-2', label: 'AP Physics 1 & 2 (algebra-based)' },
  { value: 'ap-physics-c-mechanics', label: 'AP Physics C: Mechanics' },
  { value: 'ap-physics-c-em', label: 'AP Physics C: Electricity & Magnetism' },
  { value: 'ap-chemistry', label: 'AP Chemistry' },
  { value: 'ap-biology', label: 'AP Biology' },
  { value: 'ap-compsci-a', label: 'AP Computer Science A' },
  { value: 'ap-compsci-principles', label: 'AP Computer Science Principles' },
  { value: 'ap-precalculus', label: 'AP Pre-calculus' },
  { value: 'ap-calculus-bc', label: 'AP Calculus BC' },
  { value: 'ap-calculus-ab', label: 'AP Calculus AB' },
  { value: 'ap-statistics', label: 'AP Statistics' }
];

const createMockSolution = () => ({
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
});

const createMockHints = (subjectLabel) => ([
  {
    type: 'Problem Scan',
    text: 'Highlight the quantities and conditions the prompt gives you.',
    explanation: 'Capturing the knowns and unknowns keeps the work focused on the target of the question.'
  },
  {
    type: 'Strategy Hint',
    text: `Decide which core concept from ${subjectLabel} can bridge the given information to the goal.`,
    explanation: 'Choose the governing law or definition first so each algebraic step has a purpose.'
  },
  {
    type: 'Step Hint',
    text: 'Write the symbolic relationship before substituting numbers.',
    explanation: 'Working symbolically exposes cancellations and keeps you from committing arithmetic too early.'
  },
  {
    isAnswer: true,
    text: 'Check that your final expression has the right units and is consistent with the scenario.',
    explanation: 'Verifying units and directionality confirms the solution aligns with the real-world behaviour described in the problem.'
  }
]);

const createMockConceptNotes = (subjectLabel) => ([
  {
    id: 'concept-1',
    type: 'concept',
    title: 'Essential Theories',
    description: `Summarize the fundamental ideas from ${subjectLabel} that govern this question.`,
    details: 'List the core definitions or conservation laws that must hold so you can test each step against them.',
    relatedTopics: ['Problem decomposition', 'Checking assumptions']
  },
  {
    id: 'concept-2',
    type: 'formula',
    title: 'Anchor Relationships',
    description: 'Record the formulas or patterns you will need before inserting values.',
    formula: 'Focus on symbolic relationships first, then plug in numbers.',
    applications: ['Sanity check each term', 'Track units explicitly']
  },
  {
    id: 'concept-3',
    type: 'example',
    title: 'Worked Analogy',
    description: `Compare with a simpler ${subjectLabel} example that shares the same core structure.`,
    details: 'Map each part of the current prompt to the simpler example to ensure you are applying the principle correctly.'
  },
  {
    id: 'concept-4',
    type: 'tip',
    title: 'Learning Tip',
    description: 'After solving, explain the story of the solution aloud to reinforce the reasoning chain.',
    applications: ['Summarize the why behind each major step', 'Note any approximations you used']
  }
]);

const MOCK_RESPONSE_DELAY = 450;

const ProblemInputModule = () => {
  const {
    currentProblem,
    submitProblem,
    generateSolution,
    generateHints,
    generateConceptNotes,
    setError,
    clearCurrentProblem
  } = useAppContext();
  const [problemText, setProblemText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingHints, setIsGeneratingHints] = useState(false);
  const [isGeneratingConceptNotes, setIsGeneratingConceptNotes] = useState(false);

  const trimmedProblem = problemText.trim();
  const subjectLabel = AP_SUBJECTS.find((subject) => subject.value === selectedSubject)?.label || 'this AP subject';

  const formIncomplete = !trimmedProblem || !selectedSubject;
  const isBusy = isSubmitting || isGeneratingHints || isGeneratingConceptNotes;

  const registerProblem = () => {
    const newProblem = {
      id: Date.now().toString(),
      text: trimmedProblem,
      subject: selectedSubject,
      timestamp: new Date().toISOString(),
      status: 'processing'
    };

    submitProblem(newProblem);
    return newProblem;
  };

  const handleSubmitProblem = async () => {
    if (formIncomplete) {
      return;
    }

    setIsSubmitting(true);

    const problem = registerProblem();

    try {
      await new Promise((resolve) => setTimeout(resolve, MOCK_RESPONSE_DELAY));

      generateSolution({
        problemId: problem.id,
        solution: createMockSolution()
      });
    } catch (error) {
      console.error('Error submitting problem:', error);
      setError('Failed to submit problem. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateHints = async () => {
    if (formIncomplete) {
      return;
    }

    setIsGeneratingHints(true);

    registerProblem();

    try {
      await new Promise((resolve) => setTimeout(resolve, MOCK_RESPONSE_DELAY));
      generateHints(createMockHints(subjectLabel));
    } catch (error) {
      console.error('Error generating hints:', error);
      setError('Failed to generate hints. Please try again.');
    } finally {
      setIsGeneratingHints(false);
    }
  };

  const handleGenerateConceptNotes = async () => {
    if (formIncomplete) {
      return;
    }

    setIsGeneratingConceptNotes(true);

    registerProblem();

    try {
      await new Promise((resolve) => setTimeout(resolve, MOCK_RESPONSE_DELAY));
      generateConceptNotes(createMockConceptNotes(subjectLabel));
    } catch (error) {
      console.error('Error generating concept notes:', error);
      setError('Failed to generate concept notes. Please try again.');
    } finally {
      setIsGeneratingConceptNotes(false);
    }
  };

  const handleClearInput = () => {
    setProblemText('');
    setSelectedSubject('');
    setIsSubmitting(false);
    setIsGeneratingHints(false);
    setIsGeneratingConceptNotes(false);
    clearCurrentProblem();
  };

  const isSolveDisabled = formIncomplete || isBusy;
  const isHintsDisabled = formIncomplete || isBusy;
  const isConceptDisabled = formIncomplete || isBusy;

  return (
    <Card className="problem-input-module">
      <div className="problem-input-header">
        <h2>Solve a Problem</h2>
        <p>Enter your AP STEM problem below and choose the AP subject area for targeted guidance.</p>
      </div>

      <div className="problem-input-form">
        <div className="form-group">
          <label htmlFor="subject-select" className="form-label">
            AP Subject
          </label>
          <Select
            id="subject-select"
            options={AP_SUBJECTS}
            value={selectedSubject}
            onChange={setSelectedSubject}
            placeholder="Choose an AP subject..."
            className="subject-selector"
            disabled={isBusy}
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
            placeholder="Paste or type your problem here. Include all given information, diagram descriptions, and what you need to find..."
            rows={6}
            disabled={isBusy}
          />
        </div>

        <div className="problem-input-actions">
          <Button
            variant="ghost"
            onClick={handleClearInput}
            disabled={isBusy || (!problemText && !selectedSubject)}
            className="clear-button"
          >
            Clear
          </Button>
          <div className="primary-action-group">
            <Button
              variant="ghost"
              onClick={handleSubmitProblem}
              disabled={isSolveDisabled}
              className={`problem-action-button solve-action ${isSubmitting ? 'btn-loading' : ''}`}
              icon={<FaBolt aria-hidden="true" />}
            >
              {isSubmitting ? 'Analyzing Problem' : 'Solve Problem'}
            </Button>
            <Button
              variant="ghost"
              onClick={handleGenerateHints}
              disabled={isHintsDisabled}
              className={`problem-action-button hints-action ${isGeneratingHints ? 'btn-loading' : ''}`}
              icon={<FaEye aria-hidden="true" />}
            >
              {isGeneratingHints ? 'Preparing Hints' : 'Step-by-Step Hints'}
            </Button>
            <Button
              variant="ghost"
              onClick={handleGenerateConceptNotes}
              disabled={isConceptDisabled}
              className={`problem-action-button concept-action ${isGeneratingConceptNotes ? 'btn-loading' : ''}`}
              icon={<FaRegLightbulb aria-hidden="true" />}
            >
              {isGeneratingConceptNotes ? 'Curating Notes' : 'Generate Concept Notes'}
            </Button>
          </div>
        </div>

        <div className="concept-callout">
          <div className="concept-callout-icon" aria-hidden="true">
            <FaRegLightbulb />
          </div>
          <div className="concept-callout-content">
            <h3>What are Concept Notes?</h3>
            <p>Get essential theories and concepts required to understand and solve a problem, without revealing the final answer. They provide the background knowledge that guides your thinking and learning process.</p>
          </div>
        </div>
      </div>

      {currentProblem && (
        <div className="current-problem-status">
          <div className="status-indicator">
            <div className={`status-dot ${currentProblem.status}`}></div>
            <span className="status-text">
              {currentProblem.status === 'processing'
                ? 'Analyzing your problem...'
                : 'Problem processed successfully'}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ProblemInputModule;
