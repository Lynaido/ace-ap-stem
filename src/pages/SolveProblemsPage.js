import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaBolt, FaEye, FaRegLightbulb } from 'react-icons/fa';
import Button from '../components/primitives/Button';
import Card from '../components/primitives/Card';
import SolutionDisplay from '../components/problem-solving/SolutionDisplay';
import HintsDisplay from '../components/problem-solving/HintsDisplay';
import ConceptNotesDisplay from '../components/problem-solving/ConceptNotesDisplay';
import ChatPanel from '../components/chat/ChatPanel';
import { useAppContext } from '../context/AppContext';
import './SolveProblemsPage.css';

const LoadingPanel = ({ title, message }) => (
  <Card className="solution-loading-panel">
    <div className="solution-loading-spinner" aria-hidden="true" />
    <div className="solution-loading-copy">
      <p className="loading-title">{title}</p>
      <p className="loading-message">{message}</p>
    </div>
  </Card>
);

const SolveProblemsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentProblem, activeSolution, activeHints, activeConceptNotes, loading, error, createProblem, uploadFile } = useAppContext();
  const [showSolution, setShowSolution] = useState(false);
  const [problemText, setProblemText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedAsset, setUploadedAsset] = useState(null);
  const [inputMode, setInputMode] = useState('upload');
  const [isSolving, setIsSolving] = useState(false);
  const [isGeneratingHints, setIsGeneratingHints] = useState(false);
  const [isGeneratingConceptNotes, setIsGeneratingConceptNotes] = useState(false);
  const [activeView, setActiveView] = useState(null);
  const [isCreateMode, setIsCreateMode] = useState(false);

  // Check if we should start in create mode
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('create') === 'true') {
      setIsCreateMode(true);
      setInputMode('text'); // Switch to text input for problem creation
    }
  }, [location.search]);

  useEffect(() => {
    if (showSolution) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [showSolution]);

  const subjects = [
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

  const RESPONSE_DELAY = 450;

  const createMockSolution = () => ({
    steps: [
      {
        id: 1,
        title: 'Understand the Problem',
        content: 'Carefully read the prompt and restate the question in your own words.',
        explanation: 'This ensures you know exactly what is being asked before diving into calculations.'
      },
      {
        id: 2,
        title: 'Identify Key Information',
        content: 'Collect the givens, unknowns, and constraints that frame the problem.',
        explanation: 'Setting up a clear list of knowns keeps later algebra focused on the goal.'
      },
      {
        id: 3,
        title: 'Plan Your Approach',
        content: 'Match the situation to the governing concept or formula that fits best.',
        explanation: 'A deliberate plan prevents guesswork and keeps each step purposeful.'
      },
      {
        id: 4,
        title: 'Execute Systematically',
        content: 'Apply your plan symbolically first, then substitute values and compute.',
        explanation: 'Working symbolically exposes cancellations and guards against algebra slips.'
      },
      {
        id: 5,
        title: 'Check and Reflect',
        content: 'Verify units, directionality, and the realism of the result.',
        explanation: 'A quick sense check confirms the answer aligns with the scenario.'
      },
    ],
    finalAnswer: 'The structured solution confirms the result and the reasoning behind it.',
    confidence: 0.95,
  });

  const createMockHints = (subjectLabel) => ([
    {
      type: 'Problem Scan',
      text: 'Highlight the quantities and conditions the prompt gives you.',
      explanation: 'Capturing the knowns and unknowns keeps the work focused on the target of the question.'
    },
    {
      type: 'Strategy Hint',
      text: `Decide which core concept from ${subjectLabel} should guide your approach.`,
      explanation: 'Choose the governing law or definition first so every algebraic step has purpose.'
    },
    {
      type: 'Step Hint',
      text: 'Write the key relationship symbolically before substituting numbers.',
      explanation: 'Staying symbolic exposes cancellations and avoids committing arithmetic too early.'
    },
    {
      isAnswer: true,
      text: 'Once finished, verify that your result matches the expected units and scenario.',
      explanation: 'Consistency checks are the quickest way to catch slips before finalizing an answer.'
    }
  ]);

  const createMockConceptNotes = (subjectLabel) => ([
    {
      id: 'concept-1',
      type: 'concept',
      title: 'Essential Theories',
      description: `Summarize the fundamental ideas from ${subjectLabel} that govern this question.`,
      details: 'List the core definitions or conservation laws that should hold so you can check each step against them.',
      relatedTopics: ['Problem decomposition', 'Checking assumptions']
    },
    {
      id: 'concept-2',
      type: 'formula',
      title: 'Anchor Relationships',
      description: 'Record the symbolic relationships you will rely on before inserting values.',
      formula: 'Focus on the algebraic structure first, then plug in numbers after simplifying.',
      applications: ['Sanity-check each term', 'Track units explicitly']
    },
    {
      id: 'concept-3',
      type: 'example',
      title: 'Worked Analogy',
      description: `Compare with a simpler ${subjectLabel} example that shares the same core structure.`,
      details: 'Map each element of the current prompt to the simpler example to avoid misapplying the principle.'
    },
    {
      id: 'concept-4',
      type: 'tip',
      title: 'Learning Tip',
      description: 'After solving, explain the story of the solution aloud to reinforce the reasoning chain.',
      applications: ['Summarize the why behind each major step', 'Note any approximations you used']
    }
  ]);

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

  const trimmedProblem = problemText.trim();
  const subjectLabel = subjects.find((subject) => subject.value === selectedSubject)?.label || 'this AP subject';
  const formIncomplete = !trimmedProblem || !selectedSubject;
  const isBusy = isUploading || isSolving || isGeneratingHints || isGeneratingConceptNotes;

  const handleImageUpload = () => {
    setInputMode('upload');
    setProblemText('');
    setActiveView(null);
    setShowSolution(false);
    setIsSolving(false);
    setIsGeneratingHints(false);
    setIsGeneratingConceptNotes(false);
    setIsUploading(true);

    // Simulate upload
    setTimeout(() => {
      setIsUploading(false);
    }, 600);
  };

  const handleTypeProblem = () => {
    setInputMode('text');
    setProblemText('');
    setActiveView(null);
    setShowSolution(false);
    setIsSolving(false);
    setIsGeneratingHints(false);
    setIsGeneratingConceptNotes(false);
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    setIsUploading(true);
    setUploadedImage(null); // Clear previous image

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

        // Create a preview URL
        const previewUrl = URL.createObjectURL(file);
        setUploadedImage({ file, previewUrl });

        const asset = await uploadFile(file, null, `Upload for problem: ${trimmedProblem.substring(0, 50)}...`);
        setUploadedAsset(asset);
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

  const handleSolveProblem = async () => {
    if (formIncomplete) {
      return;
    }

    setActiveView('solution');
    setIsSolving(true);
    setIsGeneratingHints(true);
    setIsGeneratingConceptNotes(true);
    setShowSolution(true);

    try {
      const problemData = {
        title: `${trimmedProblem.substring(0, 50)}${trimmedProblem.length > 50 ? '...' : ''}`,
        description: trimmedProblem,
        subject: selectedSubject,
        difficulty: 'medium',
        imageUrl: uploadedAsset ? uploadedAsset.url : null
      };

      const folderId = new URLSearchParams(location.search).get('folderId');
      const createdProblem = await createProblem(problemData, folderId);

      // If in create mode, redirect to Notes Hub to see the saved problem
      if (isCreateMode) {
        // Wait a bit for the toast to show and for the saved item to be created
        setTimeout(() => {
          navigate('/notes-hub?refresh=true', { replace: true });
        }, 2000); // Increased time to ensure saved item creation completes
      }

      // Clear form after successful submission
      setProblemText('');
      setSelectedSubject('');

    } catch (error) {
      console.error('Error submitting problem:', error);
      // Error is already handled in context
    } finally {
      setIsSolving(false);
      setIsGeneratingHints(false);
      setIsGeneratingConceptNotes(false);
    }
  };

  const handleGenerateHints = () => {
    if (formIncomplete) {
      return;
    }

    setActiveView('hints');
    setIsGeneratingHints(true);
    setIsGeneratingConceptNotes(true);
    setShowSolution(true);

    setTimeout(() => {
      setIsGeneratingHints(false);
      setIsGeneratingConceptNotes(false);
    }, RESPONSE_DELAY);
  };

  const handleGenerateConceptNotes = () => {
    if (formIncomplete) {
      return;
    }

    setActiveView('concepts');
    setIsGeneratingConceptNotes(true);
    setShowSolution(true);

    setTimeout(() => {
      setIsGeneratingConceptNotes(false);
    }, RESPONSE_DELAY);
  };

  const handleBackToInput = () => {
    setShowSolution(false);
    setActiveView(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className={`solve-problems-page ${showSolution ? 'solution-mode' : 'upload-mode'}`}>
      <div className="solve-problems-layout">
        <div className="main-content">
          {!showSolution ? (
            <div className="upload-card">
              <div className="card-top-bar">
                {isCreateMode ? (
                  <div className="create-mode-header">
                    <h2>Create New Problem</h2>
                    <p>Create and save a new problem to your library</p>
                  </div>
                ) : (
                  <Link to="/notes-hub" className="notes-link" aria-label="Go to Notes Hub (List of Notes)">
                    <span className="notes-link-icon" aria-hidden="true">📒</span>
                    <span className="notes-link-text">List of Notes</span>
                  </Link>
                )}
              </div>
              <div className="card-heading">
                {isCreateMode ? (
                  <>
                    <h1>Create Your Problem</h1>
                    <p className="card-subtitle">
                      Create and save a new problem to your personal library. You can return to it later or generate study variants.
                    </p>
                  </>
                ) : (
                  <>
                    <h1>Upload Your Problem</h1>
                    <p className="card-subtitle">
                      Share a question or upload a snapshot and we will walk through the solution with you step by step.
                    </p>
                  </>
                )}
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
                  <>
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      disabled={isBusy}
                      style={{ display: 'none' }}
                    />
                    <div
                      className="image-drop-area"
                      tabIndex={0}
                      role="button"
                      aria-label="Upload an image of the problem"
                      onClick={() => document.getElementById('file-upload').click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          const files = Array.from(e.dataTransfer.files);
                          // Create a synthetic event object for the file input
                          const syntheticEvent = {
                            target: { files: e.dataTransfer.files }
                          };
                          handleFileUpload(syntheticEvent);
                        }
                      }}
                    >
                      {uploadedImage ? (
                        <img src={uploadedImage.previewUrl} alt="Problem preview" className="image-preview" />
                      ) : (
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
                      )}
                    </div>
                  </>
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
                  onClick={handleSolveProblem}
                  disabled={formIncomplete || isBusy}
                  className={`problem-action-button solve-action ${isSolving ? 'btn-loading' : ''}`}
                  icon={<FaBolt aria-hidden="true" />}
                >
                  {isSolving ? 'Analyzing Problem' : 'Solve Problem'}
                </Button>
                <Button
                  variant="ghost"
                  size="large"
                  onClick={handleGenerateHints}
                  disabled={formIncomplete || isBusy}
                  className={`problem-action-button hints-action ${isGeneratingHints ? 'btn-loading' : ''}`}
                  icon={<FaEye aria-hidden="true" />}
                >
                  {isGeneratingHints ? 'Preparing Hints' : 'Step-by-Step Hints'}
                </Button>
                <Button
                  variant="ghost"
                  size="large"
                  onClick={handleGenerateConceptNotes}
                  disabled={formIncomplete || isBusy}
                  className={`problem-action-button concept-action ${isGeneratingConceptNotes ? 'btn-loading' : ''}`}
                  icon={<FaRegLightbulb aria-hidden="true" />}
                >
                  {isGeneratingConceptNotes ? 'Curating Notes' : 'Generate Concept Notes'}
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
            </div>
          ) : (
            <>
              <div className="solution-view-header">
                <div className="solution-view-actions">
                  <Button variant="outline" size="small" onClick={handleBackToInput}>
                    ← Back to Create Problem
                  </Button>
                </div>
                <div className="solution-view-meta">
                  <span className="view-pill">Problem Created</span>
                  <p>Your problem has been saved to the database. AI processing will begin shortly.</p>
                </div>
              </div>

              <div className="solution-content-stack">
                {loading && currentProblem && (
                  <LoadingPanel
                    title="Processing problem..."
                    message="Your problem is being analyzed by our AI system."
                  />
                )}

                {currentProblem && (
                  <Card className="solution-loading-panel">
                    <div className="solution-loading-spinner" aria-hidden="true" />
                    <div className="solution-loading-copy">
                      <p className="loading-title">Problem Created Successfully</p>
                      <p className="loading-message">
                        Your problem has been saved to the database. The AI system will process it and provide solutions, hints, and concept notes.
                      </p>
                    </div>
                  </Card>
                )}

                {error && (
                  <Card className="solution-loading-panel">
                    <div className="solution-loading-copy">
                      <p className="loading-title" style={{ color: '#dc2626' }}>Error</p>
                      <p className="loading-message">{error}</p>
                    </div>
                  </Card>
                )}
              </div>
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
