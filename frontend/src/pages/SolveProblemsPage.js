import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBolt, FaEye, FaRegLightbulb } from 'react-icons/fa';
import Button from '../components/primitives/Button';
import Card from '../components/primitives/Card';
import SolutionDisplay from '../components/problem-solving/SolutionDisplay';
import HintsDisplay from '../components/problem-solving/HintsDisplay';
import ConceptNotesDisplay from '../components/problem-solving/ConceptNotesDisplay';
import ProblemPartSelector from '../components/problem-solving/ProblemPartSelector';
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
  const {
    currentProblem,
    createProblem,
    uploadFile,
    problemSolution,
    problemHints,
    problemConceptNotes,
    isProblemLoading,
    problemDisplayMode,
    setProblemSolution,
    setProblemHints,
    setProblemConceptNotes,
    setIsProblemLoading,
    setProblemDisplayMode,
    clearProblemState,
    isProblemViewVisible,
    setProblemViewVisible,
    saveItem,
    getFolders,
    setActiveProblem,
    activeThreadId,
  } = useAppContext();
  const [createdProblemId, setCreatedProblemId] = useState(null);
  const [error, setError] = useState(null);
  const [problemText, setProblemText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedAsset, setUploadedAsset] = useState(null);
  const [inputMode, setInputMode] = useState('upload');
  const [, setIsSolving] = useState(false);
  const [, setIsGeneratingHints] = useState(false);
  const [, setIsGeneratingConceptNotes] = useState(false);
  const [, setActiveView] = useState(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [loadedVariant, setLoadedVariant] = useState(null);
  const [folders, setFolders] = useState([]);
  // Multi-part problem handling
  const [problemStructure, setProblemStructure] = useState(null); // detected questions/parts
  const [solveFocus, setSolveFocus] = useState(null); // chosen SolveFocus object
  const [pendingAction, setPendingAction] = useState(null); // action to run after a focus is picked
  const [showPartSelector, setShowPartSelector] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  // Load folders on mount
  useEffect(() => {
    const loadFolders = async () => {
      try {
        const foldersData = await getFolders();
        setFolders(foldersData);
      } catch (error) {
        console.error('Error loading folders:', error);
      }
    };
    loadFolders();
  }, [getFolders]);

  // Check if we should start in create mode
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('create') === 'true') {
      setIsCreateMode(true);
      setInputMode('text'); // Switch to text input for problem creation
    }
  }, [location.search]);

  // Handle incoming problem from Study Mode (variant launch)
  useEffect(() => {
    const incomingProblem = location.state?.problem;
    if (incomingProblem && !loadedVariant) {
      // Store variant info
      setLoadedVariant({
        isVariant: incomingProblem.isVariant,
        originalProblemTitle: incomingProblem.originalProblemTitle,
        studyMode: incomingProblem.studyMode,
        hints: incomingProblem.hints || []
      });
      
      // Pre-fill the form with variant data
      const description = incomingProblem.description || incomingProblem.excerpt || incomingProblem.title || '';
      setProblemText(description);
      setSelectedSubject(incomingProblem.subject || '');
      setInputMode('text');
      
      // Reset other states
      setProblemViewVisible(false);
      setActiveView(null);
      
      // Scroll to top and show the input area
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      
      // Clear the state to prevent re-filling on subsequent renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state, loadedVariant, setProblemViewVisible, setActiveView]);

  useEffect(() => {
    if (isProblemViewVisible) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isProblemViewVisible]);

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

  const chatInitialMessages = [
    {
      id: 1,
      role: 'assistant',
      content: 'Welcome to the AI Tutor! Upload or type your problem, and I will help you solve it.',
      createdAt: new Date(),
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
  // Form is complete if we have a subject AND (either text OR an uploaded image)
  const formIncomplete = !selectedSubject || (!trimmedProblem && !uploadedAsset);
  const isBusy = isUploading || isProblemLoading;

  // The problem content changed, so any previously detected structure / chosen
  // part / created problem no longer applies. Force a fresh detection next time.
  const resetSelection = () => {
    setCreatedProblemId(null);
    setProblemStructure(null);
    setSolveFocus(null);
    setPendingAction(null);
    setShowPartSelector(false);
    setIsDetecting(false);
  };

  const handleImageUpload = () => {
    setInputMode('upload');
    setProblemText('');
    setActiveView(null);
    setProblemViewVisible(false);
    setIsSolving(false);
    setIsGeneratingHints(false);
    setIsGeneratingConceptNotes(false);
    resetSelection();
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
    setProblemViewVisible(false);
    setIsSolving(false);
    setIsGeneratingHints(false);
    setIsGeneratingConceptNotes(false);
    resetSelection();
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    setIsUploading(true);
    setUploadedImage(null); // Clear previous image
    resetSelection(); // A new file means a new problem to detect

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

  // Create the problem row once (and associate its uploaded image once), then
  // reuse the same id for structure detection and every generate action.
  const ensureProblem = async () => {
    if (createdProblemId) return createdProblemId;

    const problemDescription = trimmedProblem || 'Problem from uploaded image';
    const problemData = {
      title: `${problemDescription.substring(0, 50)}${problemDescription.length > 50 ? '...' : ''}`,
      description: problemDescription,
      subject: selectedSubject,
      difficulty: 'medium',
      imageUrl: uploadedAsset ? uploadedAsset.url : null,
    };
    const created = await createProblem(problemData);
    if (!created?.id) {
      throw new Error('Could not create the problem. Please try again.');
    }
    setCreatedProblemId(created.id);
    setActiveProblem(created);

    if (uploadedAsset?.id) {
      const { problemAPI } = await import('../utils/api');
      await problemAPI.associateAssets(created.id, [uploadedAsset.id]);
    }
    return created.id;
  };

  // Run the actual AI generation for one of the three actions, targeting the
  // chosen focus (question / sub-part / all). Shared by the primary buttons and
  // the in-view "get the other thing" buttons.
  const generateFor = async (actionType, problemId, focus) => {
    clearProblemState();
    setShowPartSelector(false);
    setIsProblemLoading(true);
    setProblemDisplayMode(actionType);
    setProblemViewVisible(true);

    const body = focus ? { focus } : {};
    try {
      const { problemAPI } = await import('../utils/api');
      if (actionType === 'solution') {
        const res = await problemAPI.generateSolution(problemId, body);
        if (res.data.solution) {
          setProblemSolution({ ...res.data.solution, id: res.data.solutionId });
        }
      } else if (actionType === 'hints') {
        const res = await problemAPI.generateHints(problemId, body);
        if (res.data.hints) {
          setProblemHints(res.data.hints);
        }
      } else if (actionType === 'concepts') {
        const res = await problemAPI.generateConceptNotes(problemId, body);
        if (res.data.conceptNotes && res.data.conceptNoteIds) {
          const notesWithIds = res.data.conceptNotes.map((note, index) => ({
            ...note,
            id: res.data.conceptNoteIds[index],
          }));
          setProblemConceptNotes(notesWithIds);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProblemLoading(false);
    }
  };

  // Entry point for the three primary buttons. Detects structure first; if the
  // problem has multiple questions/parts and nothing has been chosen yet, shows
  // the part selector and defers the action until the student picks.
  const startAction = async (actionType) => {
    if (formIncomplete) return;
    setError(null);
    setPendingAction(actionType);
    setProblemViewVisible(true);

    try {
      const problemId = await ensureProblem();

      let structure = problemStructure;
      if (!structure) {
        setIsDetecting(true);
        try {
          const { problemAPI } = await import('../utils/api');
          const res = await problemAPI.detectStructure(problemId);
          structure = res.data;
          setProblemStructure(structure);
        } catch (detectErr) {
          // Structure detection is an enhancement, not a hard requirement. If the
          // endpoint isn't available (e.g. backend not yet updated) or fails, fall
          // back to the normal single-problem flow so solving still works.
          console.warn('Structure detection unavailable, continuing without it:', detectErr);
          structure = { hasMultipleQuestions: false, questions: [] };
          setProblemStructure(structure);
        } finally {
          setIsDetecting(false);
        }
      }

      if (structure?.hasMultipleQuestions && !solveFocus) {
        setShowPartSelector(true);
        return; // wait for handleFocusSelected
      }

      await generateFor(actionType, problemId, solveFocus);
    } catch (err) {
      setIsDetecting(false);
      setError(err.message);
    }
  };

  const handleSolveProblem = () => startAction('solution');
  const handleGenerateHints = () => startAction('hints');
  const handleGenerateConceptNotes = () => startAction('concepts');

  // The student picked which question/part to work on.
  const handleFocusSelected = async (focus) => {
    setSolveFocus(focus);
    setShowPartSelector(false);
    const problemId = createdProblemId || currentProblem?.id;
    if (!problemId) {
      setError('Problem ID is missing. Please try again.');
      return;
    }
    await generateFor(pendingAction || 'solution', problemId, focus);
  };

  // Re-open the selector so the student can change what to solve.
  const handleChangeSelection = () => {
    setShowPartSelector(true);
    setProblemViewVisible(true);
  };

  const handleBackToInput = () => {
    setProblemViewVisible(false);
    clearProblemState();
    resetSelection();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGetSolution = async () => {
    // Always switch to solution view
    setProblemDisplayMode('solution');
    
    if (problemSolution) {
      // Solution already exists, just switch view
      return;
    }
    
    // Try to get problem ID from either local state or context
    const problemId = createdProblemId || currentProblem?.id;
    
    if (!problemId) {
      console.error('No problem ID found');
      setError('Problem ID is missing. Please try creating the problem again.');
      return;
    }
    
    setIsProblemLoading(true);
    try {
      const { problemAPI } = await import('../utils/api');
      const res = await problemAPI.generateSolution(problemId, solveFocus ? { focus: solveFocus } : {});
      if (res.data.solution) {
        // Attach the database ID to the solution object
        const solutionWithId = {
          ...res.data.solution,
          id: res.data.solutionId
        };
        setProblemSolution(solutionWithId);
      }
    } catch (err) {
      console.error('Error generating solution:', err);
      setError(err.message);
    } finally {
      setIsProblemLoading(false);
    }
  };

  const handleGetHints = async () => {
    // Always switch to hints view
    setProblemDisplayMode('hints');
    
    if (problemHints && problemHints.length > 0) {
      // Hints already exist, just switch view
      return;
    }
    
    // Try to get problem ID from either local state or context
    const problemId = createdProblemId || currentProblem?.id;
    
    if (!problemId) {
      console.error('No problem ID found');
      setError('Problem ID is missing. Please try creating the problem again.');
      return;
    }
    
    setIsProblemLoading(true);
    try {
      const { problemAPI } = await import('../utils/api');
      const res = await problemAPI.generateHints(problemId, solveFocus ? { focus: solveFocus } : {});
      if (res.data.hints) {
        setProblemHints(res.data.hints);
      }
    } catch (err) {
      console.error('Error generating hints:', err);
      setError(err.message);
    } finally {
      setIsProblemLoading(false);
    }
  };

  const handleGetConceptNotes = async () => {
    setProblemDisplayMode('concepts');
    
    if (problemConceptNotes) {
      // Concept notes already exist, just switch view
      return;
    }
    
    // Try to get problem ID from either local state or context
    const problemId = createdProblemId || currentProblem?.id;
    
    if (!problemId) {
      console.error('No problem ID found', { createdProblemId, currentProblem });
      setError('Problem ID is missing. Please try creating the problem again.');
      return;
    }
    
    setIsProblemLoading(true);
    try {
      const { problemAPI } = await import('../utils/api');
      const res = await problemAPI.generateConceptNotes(problemId, solveFocus ? { focus: solveFocus } : {});
      if (res.data.conceptNotes && res.data.conceptNoteIds) {
        // Attach database IDs to each concept note
        const notesWithIds = res.data.conceptNotes.map((note, index) => ({
          ...note,
          id: res.data.conceptNoteIds[index]
        }));
        setProblemConceptNotes(notesWithIds);
      }
    } catch (err) {
      console.error('Error generating concept notes:', err);
      setError(err.message);
    } finally {
      setIsProblemLoading(false);
    }
  };

  const handleSaveItem = async (saveData) => {
    try {
      await saveItem(saveData);
      // Optionally navigate to notes hub
      // navigate('/notes-hub?refresh=true');
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className={`solve-problems-page ${isProblemViewVisible ? 'solution-mode' : 'upload-mode'}`}>
      <div className="solve-problems-layout">
        <div className="main-content">
          {!isProblemViewVisible ? (
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
                {loadedVariant?.isVariant && (
                  <div className="variant-banner">
                    <div className="variant-banner-icon">🎯</div>
                    <div className="variant-banner-content">
                      <strong>Study Mode Variant</strong>
                      <p>
                        {loadedVariant.studyMode && `${loadedVariant.studyMode} • `}
                        Based on: {loadedVariant.originalProblemTitle}
                        {loadedVariant.hints?.length > 0 && ` • ${loadedVariant.hints.length} hints available`}
                      </p>
                    </div>
                  </div>
                )}
                {isCreateMode ? (
                  <>
                    <h1>Create Your Problem</h1>
                    <p className="card-subtitle">
                      Create and save a new problem to your personal library. You can return to it later or generate study variants.
                    </p>
                  </>
                ) : loadedVariant?.isVariant ? (
                  <>
                    <h1>Practice Variant Loaded</h1>
                    <p className="card-subtitle">
                      Work through this AI-generated practice variant. Click "Solve Problem" to get step-by-step guidance.
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
                    onChange={(e) => {
                      setProblemText(e.target.value);
                      // Editing the problem invalidates any prior detection/choice.
                      if (createdProblemId || problemStructure || solveFocus) {
                        resetSelection();
                      }
                    }}
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
                  className={`problem-action-button solve-action ${isProblemLoading && problemDisplayMode === 'solution' ? 'btn-loading' : ''}`}
                  icon={<FaBolt aria-hidden="true" />}
                >
                  {isProblemLoading && problemDisplayMode === 'solution' ? 'Analyzing...' : 'Solve Problem'}
                </Button>
                <Button
                  variant="ghost"
                  size="large"
                  onClick={handleGenerateHints}
                  disabled={formIncomplete || isBusy}
                  className={`problem-action-button hints-action ${isProblemLoading && problemDisplayMode === 'hints' ? 'btn-loading' : ''}`}
                  icon={<FaEye aria-hidden="true" />}
                >
                  {isProblemLoading && problemDisplayMode === 'hints' ? 'Preparing...' : 'Step-by-Step Hints'}
                </Button>
                <Button
                  variant="ghost"
                  size="large"
                  onClick={handleGenerateConceptNotes}
                  disabled={formIncomplete || isBusy}
                  className={`problem-action-button concept-action ${isProblemLoading && problemDisplayMode === 'concepts' ? 'btn-loading' : ''}`}
                  icon={<FaRegLightbulb aria-hidden="true" />}
                >
                  {isProblemLoading && problemDisplayMode === 'concepts' ? 'Curating...' : 'Generate Concept Notes'}
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
                  <p>Your problem has been saved to the database.</p>
                </div>
              </div>

              {/* Banner showing which part is currently targeted, with a way to change it */}
              {solveFocus && !showPartSelector && !isDetecting && (
                <div className="focus-banner">
                  <span className="focus-banner-text">
                    <strong>Working on:</strong>{' '}
                    {solveFocus.scope === 'part'
                      ? `Only ${solveFocus.partLabel}${solveFocus.questionLabel ? ` of ${solveFocus.questionLabel}` : ''}`
                      : solveFocus.scope === 'all'
                      ? `All of ${solveFocus.questionLabel}`
                      : solveFocus.questionLabel || 'Selected question'}
                  </span>
                  {problemStructure?.hasMultipleQuestions && (
                    <button
                      type="button"
                      className="focus-banner-change"
                      onClick={handleChangeSelection}
                      disabled={isProblemLoading}
                    >
                      Change selection
                    </button>
                  )}
                </div>
              )}

              {(problemSolution || problemHints.length > 0 || problemConceptNotes) && !showPartSelector && !isDetecting && (
                <div className="ai-content-tabs" role="tablist">
                  {problemSolution && (
                    <button
                      className={`ai-tab ${problemDisplayMode === 'solution' ? 'active' : ''}`}
                      onClick={() => setProblemDisplayMode('solution')}
                      role="tab"
                      aria-selected={problemDisplayMode === 'solution'}
                    >
                      <FaBolt aria-hidden="true" /> Solution
                    </button>
                  )}
                  {problemHints.length > 0 && (
                    <button
                      className={`ai-tab ${problemDisplayMode === 'hints' ? 'active' : ''}`}
                      onClick={() => setProblemDisplayMode('hints')}
                      role="tab"
                      aria-selected={problemDisplayMode === 'hints'}
                    >
                      <FaEye aria-hidden="true" /> Hints
                    </button>
                  )}
                  {problemConceptNotes && (
                    <button
                      className={`ai-tab ${problemDisplayMode === 'concepts' ? 'active' : ''}`}
                      onClick={() => setProblemDisplayMode('concepts')}
                      role="tab"
                      aria-selected={problemDisplayMode === 'concepts'}
                    >
                      <FaRegLightbulb aria-hidden="true" /> Concept Notes
                    </button>
                  )}
                </div>
              )}

              <div className="solution-content-stack">
                {isDetecting && (
                  <LoadingPanel
                    title="Reading your problem..."
                    message="We're checking whether this problem has multiple questions or parts."
                  />
                )}

                {!isDetecting && showPartSelector && problemStructure && (
                  <ProblemPartSelector
                    structure={problemStructure}
                    onSelect={handleFocusSelected}
                    onCancel={handleBackToInput}
                    busy={isProblemLoading}
                  />
                )}

                {!isDetecting && !showPartSelector && isProblemLoading && (
                  <LoadingPanel
                    title="Generating..."
                    message="Our AI is analyzing your problem and creating helpful content."
                  />
                )}

                {!isDetecting && !showPartSelector && !isProblemLoading && problemDisplayMode === 'solution' && problemSolution && (
                  <SolutionDisplay
                    solution={problemSolution}
                    onGetHints={handleGetHints}
                    onViewConceptNotes={handleGetConceptNotes}
                    isGeneratingHints={isProblemLoading && problemDisplayMode === 'hints'}
                    isGeneratingConceptNotes={isProblemLoading && problemDisplayMode === 'concepts'}
                    onSave={handleSaveItem}
                    folders={folders}
                    currentProblem={currentProblem}
                  />
                )}
                {!isDetecting && !showPartSelector && !isProblemLoading && problemDisplayMode === 'hints' && problemHints.length > 0 && (
                  <HintsDisplay
                    hints={problemHints}
                    onGetSolution={handleGetSolution}
                    onViewConceptNotes={handleGetConceptNotes}
                    isGeneratingSolution={isProblemLoading && problemDisplayMode === 'solution'}
                    isGeneratingConceptNotes={isProblemLoading && problemDisplayMode === 'concepts'}
                  />
                )}
                {!isDetecting && !showPartSelector && !isProblemLoading && problemDisplayMode === 'concepts' && problemConceptNotes && (
                  <ConceptNotesDisplay
                    conceptNotes={problemConceptNotes}
                    onGetSolution={handleGetSolution}
                    onGetHints={handleGetHints}
                    isGeneratingSolution={isProblemLoading && problemDisplayMode === 'solution'}
                    isGeneratingHints={isProblemLoading && problemDisplayMode === 'hints'}
                    onSave={handleSaveItem}
                    folders={folders}
                    currentProblem={currentProblem}
                  />
                )}

                {/* Show error if any */}
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
          <ChatPanel
            threadId={activeThreadId}
            problemId={currentProblem?.id}
            initialMessages={chatInitialMessages}
            className="chat-panel-elevated"
          />
        </div>
      </div>
    </div>
  );
};

export default SolveProblemsPage;
