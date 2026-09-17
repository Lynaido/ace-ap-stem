import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FaArrowRight,
  FaCamera,
  FaCheck,
  FaComments,
  FaLock,
  FaPlus,
  FaRedo,
  FaSearch,
} from 'react-icons/fa';
import ChatPanel from '../components/chat/ChatPanel';
import { MathText } from '../components/primitives/LatexRenderer';
import apiClient, { chatAPI } from '../utils/api';
import './TutorPage.css';

const IMAGE_PLACEHOLDER = 'Problem from uploaded image';

const SUBJECT_LABELS = {
  ap_physics_1_2: 'AP Physics 1 & 2',
  ap_physics_c_mechanics: 'AP Physics C: Mechanics',
  ap_physics_c_electricity_magnetism: 'AP Physics C: E&M',
  ap_chemistry: 'AP Chemistry',
  ap_biology: 'AP Biology',
  ap_computer_science_a: 'AP Computer Science A',
  ap_computer_science_principles: 'AP CS Principles',
  ap_precalculus: 'AP Pre-calculus',
  ap_calculus_bc: 'AP Calculus BC',
  ap_calculus_ab: 'AP Calculus AB',
  ap_statistics: 'AP Statistics',
};

const subjectLabel = (subject) => SUBJECT_LABELS[subject]
  || String(subject || 'General').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).replace(/^Ap\b/, 'AP');

const problemName = (problem) => {
  const description = String(problem.description || '').trim();
  if (description && description !== IMAGE_PLACEHOLDER) return description;
  const title = String(problem.title || '').trim();
  if (title && title !== IMAGE_PLACEHOLDER) return title;
  return 'Photo problem';
};

// Keep the list readable: one short line of the problem, math left intact.
const previewText = (text, max = 150) => {
  const flat = String(text).replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  // Do not end inside an unclosed inline math span.
  const dollars = (cut.match(/\$/g) || []).length;
  const safe = dollars % 2 ? cut.slice(0, cut.lastIndexOf('$')) : cut;
  return `${safe.replace(/\s+\S*$/, '')}…`;
};

const lastActivity = (problem) => Math.max(
  new Date(problem.updatedAt || problem.createdAt || 0).getTime(),
  problem.conversation ? new Date(problem.conversation.updatedAt || 0).getTime() : 0
);

const formatDay = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const normalizeProblem = (problem) => ({
  ...problem,
  counts: problem.counts || problem._count || { solutions: 0, hints: 0, conceptNotes: 0 },
  hasImage: problem.hasImage ?? (Boolean(problem.imageUrl)
    || (problem.assets || []).some((asset) => String(asset.mimeType).startsWith('image/'))),
  conversation: problem.conversation || null,
});

const loadProblems = async () => {
  try {
    const response = await chatAPI.getTutorProblems();
    return { problems: (response.data || []).map(normalizeProblem), tutorContext: true };
  } catch (error) {
    // Older backend without the tutor endpoint: fall back to the problem list.
    const response = await apiClient.get('/api/problems?limit=100');
    return { problems: (response.data || []).map(normalizeProblem), tutorContext: false };
  }
};

const buildSuggestions = (problem) => {
  const { solutions = 0, hints = 0 } = problem.counts || {};
  if (solutions > 0) {
    return [
      'Walk me through the first step',
      'Why does this method work here?',
      'Explain the final answer simply',
      'Give me a similar practice problem',
    ];
  }
  if (hints > 0) {
    return [
      "I'm stuck after the hints — what next?",
      'What concept is this problem testing?',
      'Give me one more small hint',
      'Which formula should I use?',
    ];
  }
  return [
    'How should I start this problem?',
    'What concept is this problem testing?',
    'Give me a hint, not the answer',
    'Which formulas will I need?',
  ];
};

const ProgressTags = ({ counts }) => {
  const tags = [
    counts.solutions > 0 && 'Solution',
    counts.hints > 0 && 'Hints',
    counts.conceptNotes > 0 && 'Notes',
  ].filter(Boolean);

  if (!tags.length) return <span className="tutor-tag is-muted">Not solved yet</span>;
  return tags.map((tag) => (
    <span className="tutor-tag" key={tag}><FaCheck aria-hidden="true" /> {tag}</span>
  ));
};

const TutorEmptyState = () => (
  <section className="tutor-empty" aria-labelledby="tutor-empty-title">
    <div className="tutor-empty__art" aria-hidden="true">
      <div className="tutor-empty__mascot" />
    </div>
    <div className="tutor-empty__copy">
      <span className="tutor-eyebrow">No problems yet</span>
      <h2 id="tutor-empty-title">Solve a problem first, then ask ACE about it.</h2>
      <p>
        The AI Tutor answers questions about a specific problem you are working on — its steps,
        formulas, and concepts. Add your first problem and it will show up here.
      </p>
      <ol className="tutor-empty__steps">
        <li><span>1</span> Upload a photo or type a problem</li>
        <li><span>2</span> Get a solution, hints, or concept notes</li>
        <li><span>3</span> Come back and ask anything about it</li>
      </ol>
      <Link to="/solve-problems?create=true" className="tutor-cta">
        Go to Solve a problem <FaArrowRight aria-hidden="true" />
      </Link>
    </div>
  </section>
);

const TutorPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [problems, setProblems] = useState(null);
  const [tutorContext, setTutorContext] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [chatSession, setChatSession] = useState(null);
  const chatCardRef = useRef(null);
  const scrollToChatRef = useRef(false);

  const selectedId = searchParams.get('problem');

  const fetchProblems = useCallback(async () => {
    setLoadError('');
    setProblems(null);
    try {
      const result = await loadProblems();
      // Sort once so the list does not reshuffle while the student is chatting.
      setProblems(result.problems.sort((a, b) => lastActivity(b) - lastActivity(a)));
      setTutorContext(result.tutorContext);
    } catch (error) {
      console.error('Error loading problems for the tutor:', error);
      setLoadError('We could not load your problems. Please try again.');
    }
  }, []);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  const sortedProblems = useMemo(() => problems || [], [problems]);

  const selectedProblem = useMemo(
    () => sortedProblems.find((problem) => problem.id === selectedId) || null,
    [sortedProblems, selectedId]
  );

  // A problem opened from the URL (refresh, shared link) resumes its conversation.
  useEffect(() => {
    if (!selectedProblem) return;
    setChatSession((session) => (
      session?.problemId === selectedProblem.id
        ? session
        : {
          problemId: selectedProblem.id,
          key: `${selectedProblem.id}-${Date.now()}`,
          resumeThreadId: selectedProblem.conversation?.threadId || null,
        }
    ));
  }, [selectedProblem]);

  const subjects = useMemo(() => {
    const present = Array.from(new Set(sortedProblems.map((problem) => problem.subject).filter(Boolean)));
    return present.sort((a, b) => subjectLabel(a).localeCompare(subjectLabel(b)));
  }, [sortedProblems]);

  const visibleProblems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sortedProblems.filter((problem) => {
      if (subjectFilter !== 'all' && problem.subject !== subjectFilter) return false;
      if (!needle) return true;
      return `${problemName(problem)} ${subjectLabel(problem.subject)}`.toLowerCase().includes(needle);
    });
  }, [sortedProblems, query, subjectFilter]);

  const selectProblem = (problem) => {
    if (problem.id !== selectedId) {
      setChatSession({
        problemId: problem.id,
        key: `${problem.id}-${Date.now()}`,
        resumeThreadId: problem.conversation?.threadId || null,
      });
      setSearchParams({ problem: problem.id }, { replace: true });
    }
    scrollToChatRef.current = true;
  };

  // On narrow screens the list and the chat stack, so bring the chat into view
  // once it has rendered for the newly chosen problem.
  useEffect(() => {
    if (!scrollToChatRef.current || !selectedProblem) return;
    scrollToChatRef.current = false;
    if (!window.matchMedia?.('(max-width: 900px)').matches) return;
    const card = chatCardRef.current;
    if (!card) return;
    // Leave room for the sticky product top bar.
    const topbar = document.querySelector('.product-topbar')?.getBoundingClientRect().height || 0;
    window.scrollTo({ top: card.getBoundingClientRect().top + window.scrollY - topbar - 12, behavior: 'smooth' });
  }, [selectedProblem]);

  const clearSelection = () => {
    // Keep the student near the list after switching back to it on small screens.
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    setChatSession(null);
    setSearchParams({}, { replace: true });
  };

  const startNewChat = () => {
    if (!selectedProblem) return;
    setChatSession({
      problemId: selectedProblem.id,
      key: `${selectedProblem.id}-${Date.now()}`,
      resumeThreadId: null,
    });
  };

  const handleConversationChange = useCallback(({ threadId, messageCount }) => {
    const problemId = chatSession?.problemId;
    if (!problemId) return;
    setProblems((current) => (current || []).map((problem) => {
      if (problem.id !== problemId) return problem;
      if (!threadId) return { ...problem, conversation: null };
      return {
        ...problem,
        conversation: {
          threadId,
          messageCount,
          updatedAt: problem.conversation?.threadId === threadId && messageCount === problem.conversation?.messageCount
            ? problem.conversation.updatedAt
            : new Date().toISOString(),
        },
      };
    }));
  }, [chatSession?.problemId]);

  const isResuming = Boolean(chatSession?.resumeThreadId);
  const conversationCount = selectedProblem?.conversation?.messageCount || 0;

  const introMessages = useMemo(() => {
    if (!selectedProblem) return [];
    const { solutions = 0, hints = 0, conceptNotes = 0 } = selectedProblem.counts || {};
    const known = [
      'the problem',
      solutions > 0 && 'its solution',
      hints > 0 && 'the hints',
      conceptNotes > 0 && 'the concept notes',
      tutorContext && selectedProblem.hasImage && 'the original photo',
    ].filter(Boolean);
    const knownText = known.length > 1
      ? `${known.slice(0, -1).join(', ')} and ${known[known.length - 1]}`
      : known[0];
    return [{
      id: `intro-${selectedProblem.id}`,
      role: 'assistant',
      content: `Let's dig into this **${subjectLabel(selectedProblem.subject)}** problem together. I can see ${knownText}, so ask me about any step, formula, or idea in it.`,
      createdAt: new Date(),
    }];
  }, [selectedProblem, tutorContext]);

  const suggestions = useMemo(
    () => (selectedProblem ? buildSuggestions(selectedProblem) : []),
    [selectedProblem]
  );

  const hasProblems = sortedProblems.length > 0;
  const layoutClassName = [
    'tutor-layout',
    selectedProblem ? 'has-selection' : 'no-selection',
  ].filter(Boolean).join(' ');

  let statusText = 'Pick a problem to start';
  if (problems && !hasProblems) statusText = 'Waiting for your first problem';
  if (selectedProblem) statusText = 'ACE is ready';

  return (
    <div className="tutor-page">
      <section className="tutor-workspace" aria-label="AI Tutor workspace">
        <header className="tutor-hero">
          <div className="tutor-hero-mascot" aria-hidden="true" />
          <div className="tutor-hero-copy">
            <span className="tutor-eyebrow">Your study buddy</span>
            <h1>Ask, explore, and understand.</h1>
            <p>
              {problems && !hasProblems
                ? 'Solve a problem first, then ask ACE about any step, formula, or concept in it.'
                : 'Choose one of your problems, then ask ACE about any step, formula, or concept in it.'}
            </p>
          </div>
          <div className={`tutor-status${selectedProblem ? '' : ' is-waiting'}`}>
            <span aria-hidden="true" /> {statusText}
          </div>
        </header>

        {problems === null && !loadError && (
          <div className="tutor-layout is-loading" aria-busy="true" aria-label="Loading your problems">
            <div className="tutor-picker">
              {[0, 1, 2, 3].map((item) => <div className="tutor-skeleton" key={item} />)}
            </div>
            <div className="tutor-chat-card tutor-skeleton-card" />
          </div>
        )}

        {loadError && (
          <div className="tutor-error" role="alert">
            <p>{loadError}</p>
            <button type="button" className="tutor-button" onClick={fetchProblems}>
              <FaRedo aria-hidden="true" /> Try again
            </button>
          </div>
        )}

        {problems && !hasProblems && <TutorEmptyState />}

        {problems && hasProblems && (
          <div className={layoutClassName}>
            <aside className="tutor-picker" aria-labelledby="tutor-picker-title">
              <div className="tutor-picker__head">
                <div className="tutor-step">
                  <span className="tutor-step__num">1</span>
                  <div>
                    <h2 id="tutor-picker-title">Choose a problem</h2>
                    <p>{sortedProblems.length} {sortedProblems.length === 1 ? 'problem' : 'problems'} in your library</p>
                  </div>
                </div>
              </div>

              <label className="tutor-search">
                <FaSearch aria-hidden="true" />
                <span className="tutor-sr-only">Search your problems</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search your problems"
                />
              </label>

              {subjects.length > 1 && (
                <div className="tutor-filters" role="group" aria-label="Filter by subject">
                  {['all', ...subjects].map((subject) => (
                    <button
                      type="button"
                      key={subject}
                      className={`tutor-filter${subjectFilter === subject ? ' is-active' : ''}`}
                      aria-pressed={subjectFilter === subject}
                      onClick={() => setSubjectFilter(subject)}
                    >
                      {subject === 'all' ? 'All subjects' : subjectLabel(subject)}
                    </button>
                  ))}
                </div>
              )}

              <ul className="tutor-problem-list">
                {visibleProblems.map((problem) => {
                  const isSelected = problem.id === selectedProblem?.id;
                  const name = problemName(problem);
                  return (
                    <li key={problem.id}>
                      <button
                        type="button"
                        className={`tutor-problem${isSelected ? ' is-selected' : ''}`}
                        aria-pressed={isSelected}
                        onClick={() => selectProblem(problem)}
                      >
                        <span className="tutor-problem__top">
                          <span className="tutor-subject">{subjectLabel(problem.subject)}</span>
                          <span className="tutor-problem__date">{formatDay(lastActivity(problem))}</span>
                        </span>
                        <span className="tutor-problem__name">
                          {problem.hasImage && <FaCamera className="tutor-problem__photo" aria-label="Photo problem" />}
                          <MathText source={previewText(name)} />
                        </span>
                        <span className="tutor-problem__meta">
                          <ProgressTags counts={problem.counts} />
                          {problem.conversation && (
                            <span className="tutor-tag is-chat">
                              <FaComments aria-hidden="true" /> {problem.conversation.messageCount}
                              <span className="tutor-sr-only"> messages</span>
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {visibleProblems.length === 0 && (
                <p className="tutor-no-results">
                  No problems match your search.{' '}
                  <button type="button" onClick={() => { setQuery(''); setSubjectFilter('all'); }}>Clear filters</button>
                </p>
              )}

              <Link to="/solve-problems?create=true" className="tutor-new-problem">
                <FaPlus aria-hidden="true" /> Solve a new problem
              </Link>
            </aside>

            <section className="tutor-chat-card" ref={chatCardRef} aria-label="Conversation">
              {selectedProblem && chatSession?.problemId === selectedProblem.id ? (
                <>
                  <div className="tutor-context">
                    <div className="tutor-context__body">
                      <span className="tutor-context__label">
                        <span className="tutor-step__num is-small">2</span>
                        Asking about · {subjectLabel(selectedProblem.subject)}
                        {isResuming && conversationCount > 0 && (
                          <span className="tutor-context__resume">Continuing your chat</span>
                        )}
                      </span>
                      <p className="tutor-context__name" title={problemName(selectedProblem)}>
                        {selectedProblem.hasImage && <FaCamera className="tutor-problem__photo" aria-hidden="true" />}
                        <MathText source={previewText(problemName(selectedProblem), 180)} />
                      </p>
                    </div>
                    <div className="tutor-context__actions">
                      {conversationCount > 0 && (
                        <button type="button" className="tutor-button is-ghost" onClick={startNewChat}>
                          <FaPlus aria-hidden="true" /> New chat
                        </button>
                      )}
                      <button type="button" className="tutor-button is-ghost tutor-context__change" onClick={clearSelection}>
                        Change problem
                      </button>
                    </div>
                  </div>
                  <div className="tutor-chat-body">
                    <ChatPanel
                      key={chatSession.key}
                      problemId={selectedProblem.id}
                      resumeThreadId={chatSession.resumeThreadId}
                      onConversationChange={handleConversationChange}
                      initialMessages={introMessages}
                      suggestions={suggestions}
                      placeholder="Ask about this problem…"
                      hideHeader
                    />
                  </div>
                </>
              ) : (
                <div className="tutor-locked">
                  <div className="tutor-locked__center">
                    <span className="tutor-locked__icon" aria-hidden="true"><FaLock /></span>
                    <span className="tutor-step__num">2</span>
                    <h2>Pick a problem to start chatting</h2>
                    <p>
                      ACE answers best when it knows exactly which problem you mean. Choose one from
                      your library and the chat unlocks with its solution, hints, and notes as context.
                    </p>
                    <span className="tutor-locked__hint">
                      <FaArrowRight aria-hidden="true" /> Select a problem from the list
                    </span>
                  </div>
                  <div className="tutor-locked__input" aria-hidden="true">
                    <span>Choose a problem first…</span>
                    <span className="tutor-locked__send">Send</span>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </div>
  );
};

export default TutorPage;
