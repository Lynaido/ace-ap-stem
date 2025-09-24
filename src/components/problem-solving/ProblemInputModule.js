import React, { useState, useEffect } from 'react';
import { FaBolt, FaEye, FaRegLightbulb } from 'react-icons/fa';
import { useAppContext } from '../../context/AppContext';
import Button from '../primitives/Button';
import Select from '../primitives/Select';
import Card from '../primitives/Card';
import './ProblemInputModule.css';

const AP_SUBJECTS = [
  { value: 'ap_physics_1_2', label: 'AP Physics 1 & 2 (algebra-based)' },
  { value: 'ap_physics_c_mechanics', label: 'AP Physics C: Mechanics' },
  { value: 'ap_physics_c_electricity_magnetism', label: 'AP Physics C: Electricity & Magnetism' },
  { value: 'ap_chemistry', label: 'AP Chemistry' },
  { value: 'ap_biology', label: 'AP Biology' },
  { value: 'ap_computer_science_a', label: 'AP Computer Science A' },
  { value: 'ap_computer_science_principles', label: 'AP Computer Science Principles' },
  { value: 'ap_precalculus', label: 'AP Pre-calculus' },
  { value: 'ap_calculus_bc', label: 'AP Calculus BC' },
  { value: 'ap_calculus_ab', label: 'AP Calculus AB' },
  { value: 'ap_statistics', label: 'AP Statistics' }
];

const ProblemInputModule = () => {
  const {
    createProblem,
    uploadFile,
    loading,
    error,
    clearError
  } = useAppContext();

  const [problemText, setProblemText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [inputMode, setInputMode] = useState('upload');

  const trimmedProblem = problemText.trim();
  const subjectLabel = AP_SUBJECTS.find((subject) => subject.value === selectedSubject)?.label || 'this AP subject';
  const formIncomplete = !trimmedProblem || !selectedSubject;
  const isBusy = isSubmitting || isUploading || loading;

  const handleImageUpload = () => {
    setInputMode('upload');
    setProblemText('');
  };

  const handleTypeProblem = () => {
    setInputMode('text');
    setProblemText('');
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    setIsUploading(true);

    try {
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
          throw new Error('Only images and PDF files are allowed');
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('File size must be less than 10MB');
        }

        await uploadFile(file, null, `Upload for problem: ${trimmedProblem.substring(0, 50)}...`);
      }

      // Clear the file input
      event.target.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmitProblem = async () => {
    if (formIncomplete) {
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      const problemData = {
        title: `Problem: ${trimmedProblem.substring(0, 50)}${trimmedProblem.length > 50 ? '...' : ''}`,
        description: trimmedProblem,
        subject: selectedSubject,
        difficulty: 'medium'
      };

      await createProblem(problemData);

      // Clear form after successful submission
      setProblemText('');
      setSelectedSubject('');

    } catch (error) {
      console.error('Error submitting problem:', error);
      // Error is already handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearInput = () => {
    setProblemText('');
    setSelectedSubject('');
    setIsSubmitting(false);
    setIsUploading(false);
    clearError();
  };

  return (
    <Card className="problem-input-module">
      <div className="problem-input-header">
        <h2>Upload Your Problem</h2>
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true">
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" focusable="false" aria-hidden="true">
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
          <label className="field-label" htmlFor="subject-select">AP Subject</label>
          <select
            id="subject-select"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="styled-select"
          >
            <option value="">Select AP subject</option>
            {AP_SUBJECTS.map((subject) => (
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
            onChange={(e) => console.log('Level changed:', e.target.value)}
            className="styled-select"
          >
            <option value="">Select level</option>
            <option value="basic">Basic</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      <div className="action-row problem-actions">
        <Button
          variant="ghost"
          size="large"
          onClick={handleSubmitProblem}
          disabled={formIncomplete || isBusy}
          className={`problem-action-button solve-action ${isSubmitting ? 'btn-loading' : ''}`}
          icon={<FaBolt aria-hidden="true" />}
        >
          {isSubmitting ? 'Analyzing Problem' : 'Solve Problem'}
        </Button>
        <Button
          variant="ghost"
          size="large"
          onClick={handleClearInput}
          disabled={isBusy || (!problemText && !selectedSubject)}
          className="problem-action-button hints-action"
          icon={<FaEye aria-hidden="true" />}
        >
          Step-by-Step Hints
        </Button>
        <Button
          variant="ghost"
          size="large"
          onClick={handleClearInput}
          disabled={formIncomplete || isBusy}
          className="problem-action-button concept-action"
          icon={<FaRegLightbulb aria-hidden="true" />}
        >
          Generate Concept Notes
        </Button>
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

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}
    </Card>
  );
};

export default ProblemInputModule;
