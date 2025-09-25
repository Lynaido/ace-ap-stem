import React, { useMemo, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import EmptyState from '../components/primitives/EmptyState';
import Button from '../components/primitives/Button';
import StudyModeGenerator from '../components/study-mode/StudyModeGenerator';
import { useAppContext } from '../context/AppContext';
import { studySessionsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import './StudyModePage.css';

const baseVariants = [
  {
    id: 'variant-1',
    title: 'Variant 1 - Change the givens',
    excerpt: 'Rework the scenario with a new launch velocity and altered angle to test recognition.',
  },
  {
    id: 'variant-2',
    title: 'Variant 2 - Solve for a different unknown',
    excerpt: 'Keep the initial values, but solve for the time of flight instead of range.',
  },
  {
    id: 'variant-3',
    title: 'Variant 3 - Add a twist',
    excerpt: 'Introduce air resistance and compare outcomes with and without drag.',
  },
];

const studyModes = [
  {
    id: 'quick-practice',
    name: 'Quick Practice',
    tagline: 'Warm up with focused reps.',
    description: 'Five fast-paced variants tuned for a 10-minute drill.',
    highlights: ['Time-boxed mini session', 'Confidence-based prompts', 'Great pre-quiz warmup'],
  },
  {
    id: 'deep-dive',
    name: 'Deep Dive',
    tagline: 'Slow it down and unpack the why.',
    description: 'Detailed walkthroughs that emphasize conceptual understanding.',
    highlights: ['Layered hints and scaffolding', 'Concept checkpoints', 'Reflection prompts'],
  },
  {
    id: 'exam-sim',
    name: 'Exam Simulation',
    tagline: 'Get in the test day mindset.',
    description: 'Timed variants with escalating difficulty to mimic exam pressure.',
    highlights: ['Time estimates per variant', 'Mixed difficulty ramp', 'Review-ready summaries'],
  },
];

const savedProblems = [
  {
    id: 'item-physics-projectile',
    title: 'Projectile Motion - Tennis Serve',
    subject: 'Physics | Kinematics',
    lastReviewed: 'Reviewed 2 days ago',
    excerpt: 'Analyze hang time and max height for a tennis serve launched at 28 deg.',
    tags: ['Kinematics', '2D Motion', 'Vectors'],
  },
  {
    id: 'item-algebra-optimization',
    title: 'Quadratic Optimization - Garden Plot',
    subject: 'Algebra II | Quadratics',
    lastReviewed: 'Reviewed yesterday',
    excerpt: 'Complete the square to maximize the area of a rectangular garden with limited fencing.',
    tags: ['Quadratics', 'Optimization'],
  },
  {
    id: 'item-calculus-related',
    title: 'Related Rates - Ladder Slide',
    subject: 'Calculus | Differentiation',
    lastReviewed: 'Saved 4 days ago',
    excerpt: 'A 13ft ladder slides down a wall; find the rate the base moves when the top is 5ft high.',
    tags: ['Related Rates', 'Applied Calculus'],
  },
];

const steps = [
  {
    id: 1,
    label: 'Choose mode',
    description: 'Pick the study format that matches your goal today.',
  },
  {
    id: 2,
    label: 'Select notes',
    description: 'Choose a saved problem to anchor your practice set.',
  },
  {
    id: 3,
    label: 'Review session',
    description: 'Review mock variants and create basic study session.',
  },
];

const StudyModePage = () => {
  const location = useLocation();
  const incomingProblem = location.state?.problem;
  const { getSavedItems, createStudySession, getStudySessions } = useAppContext();

  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const normalizedIncomingProblem = useMemo(() => {
    return incomingProblem
      ? {
        id: incomingProblem.id ?? 'notes-hub-problem',
        title: incomingProblem.title ?? 'Untitled saved problem',
        subject: incomingProblem.subject ?? 'Notes Hub',
        excerpt:
          incomingProblem.excerpt ??
          'Imported from Notes Hub. Generate practice variants to reinforce this concept.',
        tags: incomingProblem.tags ?? [],
        lastReviewed: 'Added from Notes Hub',
      }
      : null;
  }, [incomingProblem]);

  const availableNotes = useMemo(() => {
    if (!normalizedIncomingProblem) {
      return savedItems.map(item => {
        const itemData = item.problem || item.solution || item.hint || item.conceptNote;
        return {
          id: item.id,
          title: itemData?.title || itemData?.content || 'Untitled',
          subject: item.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()),
          lastReviewed: new Date(item.createdAt).toLocaleDateString(),
          excerpt: itemData?.description || itemData?.content?.substring(0, 100) + '...' || 'No description available',
          tags: item.tags || []
        };
      });
    }

    const alreadyIncluded = savedItems.some((item) => item.id === normalizedIncomingProblem.id);
    const notesFromItems = savedItems.map(item => {
      const itemData = item.problem || item.solution || item.hint || item.conceptNote;
      return {
        id: item.id,
        title: itemData?.title || itemData?.content || 'Untitled',
        subject: item.type.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()),
        lastReviewed: new Date(item.createdAt).toLocaleDateString(),
        excerpt: itemData?.description || itemData?.content?.substring(0, 100) + '...' || 'No description available',
        tags: item.tags || []
      };
    });

    return alreadyIncluded ? notesFromItems : [normalizedIncomingProblem, ...notesFromItems];
  }, [normalizedIncomingProblem, savedItems]);

  const [activeStep, setActiveStep] = useState(normalizedIncomingProblem ? 3 : 1);
  const [selectedMode, setSelectedMode] = useState(normalizedIncomingProblem ? studyModes[0] : null);
  const [selectedProblem, setSelectedProblem] = useState(normalizedIncomingProblem);
  const [variants, setVariants] = useState(normalizedIncomingProblem ? baseVariants : []);

  useEffect(() => {
    const fetchSavedItems = async () => {
      try {
        setLoading(true);
        const data = await getSavedItems();
        setSavedItems(data);
      } catch (err) {
        setError('Failed to fetch saved items. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSavedItems();
  }, [getSavedItems]);

  const handleSelectMode = (mode) => {
    setSelectedMode(mode);
    setActiveStep(2);
  };

  const handleSelectProblem = (problem) => {
    setSelectedProblem(problem);
  };

  const handleGenerateSession = async () => {
    if (!selectedMode || !selectedProblem) return;

    try {
      setLoading(true);
      toast.info('Creating study session and generating AI variants...');

      // Create a study session in the database
      const studySession = await createStudySession({
        problemId: selectedProblem.id,
        metadata: {
          studyMode: selectedMode.id,
          modeName: selectedMode.name,
          difficulty: 'medium', // Default for now
          notes: `Created from StudyModePage with ${selectedMode.name} mode`
        }
      });

      // Generate AI-powered variants
      const variantResponse = await studySessionsAPI.generateVariants(studySession.id, {
        studyMode: selectedMode.name,
        variantCount: 3
      });

      const aiVariants = variantResponse.data.variants.map((variant, index) => ({
        id: variant.id,
        title: variant.title,
        excerpt: variant.description, // Map description to excerpt for display
        difficulty: variant.difficulty,
        estimatedTime: variant.estimatedTime,
        hints: variant.hints,
        subject: selectedProblem.subject,
        tags: selectedProblem.tags || [],
        lastReviewed: 'Just generated'
      }));

      setVariants(aiVariants);
      setActiveStep(3);
      toast.success(`Generated ${aiVariants.length} AI-powered practice variants!`);
    } catch (error) {
      console.error('Error generating variants:', error);
      
      // Fallback to mock variants if AI generation fails
      toast.warn('AI generation failed, using fallback variants');
      const fallbackVariants = baseVariants.map((variant, index) => ({
        ...variant,
        id: `${variant.id}-${selectedMode.id}-${index}`,
        title: variant.title.replace('Variant', `${selectedMode.name} Variant`),
        excerpt: `${variant.excerpt} Focus on ${selectedProblem.title.toLowerCase()}.`,
        subject: selectedProblem.subject,
        tags: selectedProblem.tags || [],
        lastReviewed: 'Fallback variant'
      }));

      setVariants(fallbackVariants);
      setActiveStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSession = () => {
    setActiveStep(1);
    setSelectedMode(null);
    setSelectedProblem(null);
    setVariants([]);
  };

  const handleChangeNote = () => {
    setActiveStep(2);
  };

  const currentStep = steps.find((step) => step.id === activeStep);

  if (loading) {
    return (
      <div className="study-mode-page">
        <div className="study-mode-shell">
          <div className="loading-container">
            <p>Loading saved items...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="study-mode-page">
        <div className="study-mode-shell">
          <EmptyState
            title="Error loading study mode"
            message={error}
            action={{ label: 'Try Again', onClick: () => window.location.reload() }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="study-mode-page">
      <div className="study-mode-shell">
        <header className="study-mode-hero">
          <div className="hero-copy">
            <span className="hero-eyebrow">Phase 6: Create Study Mode</span>
            <h1>Design a smarter study session</h1>
            <p>
              Select the practice flow, pull in a saved item, and preview mock variants. AI-powered variant
              generation will be available in Phase 4.
            </p>
            <div className="hero-actions">
              <Button
                variant="primary"
                size="large"
                onClick={() => setActiveStep(selectedMode ? (selectedProblem ? 3 : 2) : 1)}
              >
                Continue where you left off
              </Button>
              {(selectedMode || selectedProblem) && (
                <Button variant="ghost" size="medium" onClick={handleResetSession}>
                  Start over
                </Button>
              )}
            </div>
          </div>
          <div className="hero-summary">
            <div className="summary-tile">
              <span className="summary-label">Study mode</span>
              <strong>{selectedMode ? selectedMode.name : 'Not selected'}</strong>
              <p>{selectedMode ? selectedMode.tagline : 'Pick a mode to define the pacing and tone of practice.'}</p>
            </div>
            <div className="summary-tile">
              <span className="summary-label">Anchor note</span>
              <strong>{selectedProblem ? selectedProblem.title : 'Not selected'}</strong>
              <p>
                {selectedProblem
                  ? selectedProblem.subject ?? 'Saved problem'
                  : 'Choose a saved problem to generate smart variants.'}
              </p>
            </div>
          </div>
        </header>

        <nav className="study-mode-stepper" aria-label="Study mode creation steps">
          {steps.map((step) => {
            const status = activeStep === step.id ? 'is-active' : activeStep > step.id ? 'is-complete' : 'is-pending';
            return (
              <div key={step.id} className={`step-item ${status}`} aria-current={activeStep === step.id ? 'step' : undefined}>
                <div className="step-index">{step.id}</div>
                <div className="step-meta">
                  <span className="step-label">{step.label}</span>
                  <span className="step-description">{step.description}</span>
                </div>
              </div>
            );
          })}
        </nav>

        <section className="study-mode-body" aria-live="polite">
          {activeStep === 1 && (
            <div className="panel">
              <div className="panel-heading">
                <h2>Choose your study flow</h2>
                <p>Each mode fine-tunes the tone, pacing, and support your learner will experience.</p>
              </div>
              <div className="mode-grid">
                {studyModes.map((mode) => {
                  const isSelected = selectedMode?.id === mode.id;
                  return (
                    <article key={mode.id} className={`mode-card ${isSelected ? 'is-selected' : ''}`}>
                      <div className="mode-card-header">
                        <h3>{mode.name}</h3>
                        <p className="mode-tagline">{mode.tagline}</p>
                      </div>
                      <p className="mode-description">{mode.description}</p>
                      <ul className="mode-highlights">
                        {mode.highlights.map((highlight) => (
                          <li key={highlight}>{highlight}</li>
                        ))}
                      </ul>
                      <Button
                        variant={isSelected ? 'secondary' : 'primary'}
                        size="medium"
                        onClick={() => handleSelectMode(mode)}
                      >
                        {isSelected ? 'Mode selected' : 'Select mode'}
                      </Button>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="panel">
              <div className="panel-heading panel-heading-with-actions">
                <div>
                  <h2>Select items to practice</h2>
                  <p>Choose a saved item. Mock variants will be shown for demonstration (AI generation in Phase 4).</p>
                </div>
                <Button variant="ghost" size="small" onClick={() => setActiveStep(1)}>
                  Change study mode
                </Button>
              </div>

              {availableNotes.length === 0 ? (
                <EmptyState
                  title="No saved notes yet"
                  message="Visit the Notes Hub to add problems you want to turn into practice sessions."
                  action={{ label: 'Go to Notes Hub', to: '/notes-hub' }}
                />
              ) : (
                <>
                  <div className="notes-grid">
                    {availableNotes.map((note) => {
                      const isSelected = selectedProblem?.id === note.id;
                      return (
                        <button
                          key={note.id}
                          type="button"
                          className={`note-card ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => handleSelectProblem(note)}
                        >
                          <div className="note-card-header">
                            <span className="note-chip">{note.subject}</span>
                            <span className="note-review">{note.lastReviewed}</span>
                          </div>
                          <h3 className="note-title">{note.title}</h3>
                          <p className="note-excerpt">{note.excerpt}</p>
                          {note.tags?.length > 0 && (
                            <div className="note-tags">
                              {note.tags.map((tag) => (
                                <span key={tag}>{tag}</span>
                              ))}
                            </div>
                          )}
                          <div className="note-cta">{isSelected ? 'Selected' : 'Use this note'}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="panel-actions">
                    <Button
                      variant="primary"
                      size="large"
                      onClick={handleGenerateSession}
                      disabled={!selectedProblem || !selectedMode}
                    >
                      Generate study session
                    </Button>
                    <Button variant="ghost" size="medium" onClick={() => setActiveStep(1)}>
                      Back to mode selection
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {activeStep === 3 && selectedMode && selectedProblem && (
            <StudyModeGenerator
              variants={variants}
              selectedMode={selectedMode}
              selectedProblem={selectedProblem}
              onChangeNote={handleChangeNote}
              onReset={handleResetSession}
              onRegenerate={handleGenerateSession}
            />
          )}

          {activeStep === 3 && (!selectedMode || !selectedProblem) && (
            <EmptyState
              title="Let's set up your session"
              message="Pick a study mode and saved note so we can generate meaningful practice variants."
              action={{ label: 'Start with Mode Selection', onClick: handleResetSession }}
            />
          )}
        </section>

        {currentStep && (
          <footer className="study-mode-footer" aria-live="polite">
            <div className="footer-status">
              <span className="status-label">Current step</span>
              <strong>{currentStep.label}</strong>
            </div>
            <p>{currentStep.description}</p>
          </footer>
        )}
      </div>
    </div>
  );
};

export default StudyModePage;
