import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaBookOpen,
  FaComments,
  FaLightbulb,
  FaRegClock,
  FaMagic,
  FaUpload,
} from 'react-icons/fa';
import { useAppContext } from '../context/AppContext';
import { savedItemsAPI } from '../utils/api';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAppContext();
  const firstName = user?.name?.trim()?.split(/\s+/)[0] || 'there';
  const [recentItems, setRecentItems] = useState([]);

  useEffect(() => {
    let active = true;
    savedItemsAPI.getAll({ page: 1, limit: 4 })
      .then((response) => { if (active) setRecentItems(response.data || []); })
      .catch(() => { if (active) setRecentItems([]); });
    return () => { active = false; };
  }, []);

  const getItemTitle = (item) => (
    item.problem?.title
    || item.conceptNote?.title
    || `${item.type?.replace('_', ' ').toLowerCase() || 'Saved'} item`
  );

  const tools = [
    { title: 'Solve a problem', eyebrow: 'UPLOAD OR TYPE', description: 'Choose the exact question or sub-part you want help with.', to: '/solve-problems?create=true', cta: 'Start solving', icon: FaUpload, tone: 'solve' },
    { title: 'Ask the AI tutor', eyebrow: 'TALK IT THROUGH', description: 'Turn a difficult concept into a focused conversation.', to: '/tutor', cta: 'Open tutor', icon: FaComments, tone: 'tutor' },
    { title: 'Open Notes Hub', eyebrow: 'KEEP IT CLOSE', description: 'Return to saved solutions, hints, and concept notes.', to: '/notes-hub', cta: 'View notes', icon: FaBookOpen, tone: 'notes' },
    { title: 'Enter study mode', eyebrow: 'PRACTICE WITH INTENT', description: 'Build focused practice from work you have already done.', to: '/study-mode', cta: 'Start practice', icon: FaLightbulb, tone: 'study' },
  ];

  return (
    <section className="dashboard-page" aria-labelledby="dashboard-title">
      <div className="dashboard-shell">
        <header className="dashboard-hero">
          <div className="dashboard-hero__copy">
            <p className="dashboard-eyebrow"><FaMagic aria-hidden="true" /> YOUR LEARNING SPACE</p>
            <h1 id="dashboard-title">Ready for your next win, {firstName}?</h1>
            <p>Pick a starting point. ACE keeps the useful context with every problem, hint, and note you save.</p>
            <div className="dashboard-hero__actions">
              <Link to="/solve-problems?create=true">Solve a problem <FaArrowRight aria-hidden="true" /></Link>
              <Link className="dashboard-hero__secondary" to="/notes-hub">Open your notes</Link>
              <Link className="dashboard-hero__secondary" to="/customize-acey" data-acey-target="customize-acey">
                <FaMagic aria-hidden="true" /> Customize Acey
              </Link>
            </div>
          </div>
          <div className="dashboard-ace-stage" aria-label="ACE is ready to study with you">
            <div className="dashboard-ace-stage__orb" aria-hidden="true" />
            <div className="ace-sprite ace-sprite--wave" aria-hidden="true" />
            <span className="dashboard-ace-stage__bubble">Let&apos;s make it click.</span>
            <span className="dashboard-ace-stage__tag">READY TO HELP</span>
          </div>
          <aside className="dashboard-setup" aria-label="Today with ACE">
            <span className="dashboard-setup__icon"><FaMagic aria-hidden="true" /></span>
            <div><strong>Today with ACE</strong><p>Your workspace is ready when you are.</p></div>
          </aside>
        </header>

        <section className="dashboard-actions" aria-label="Learning tools">
          {tools.map(({ title, eyebrow, description, to, cta, icon: Icon, tone }) => (
            <article className={`dashboard-action dashboard-action--${tone}`} key={title}>
              <div className="dashboard-action__top">
                <span className="dashboard-action__icon" aria-hidden="true"><Icon /></span>
                <span className="dashboard-action__eyebrow">{eyebrow}</span>
              </div>
              <div><h2>{title}</h2><p>{description}</p></div>
              <Link to={to}>{cta} <FaArrowRight aria-hidden="true" /></Link>
            </article>
          ))}
        </section>

        <aside className="dashboard-tip">
          <span className="dashboard-tip__icon"><FaLightbulb aria-hidden="true" /></span>
          <div><strong>Study tip</strong><p>For a multi-part question, choose the exact part first. ACE will carry the right context into every learning tool.</p></div>
          <Link to="/solve-problems?create=true">Try it <FaArrowRight aria-hidden="true" /></Link>
        </aside>

        <section className="dashboard-library" aria-labelledby="recent-learning-title">
          <div className="dashboard-section-heading">
            <div><p>YOUR LIBRARY</p><h2 id="recent-learning-title">Continue where you left off</h2></div>
            <Link to="/notes-hub">View Notes Hub <FaArrowRight aria-hidden="true" /></Link>
          </div>
          {recentItems.length ? (
            <div className="dashboard-recent__list">
              {recentItems.map((item) => (
                <Link to="/notes-hub" className="dashboard-recent__item" key={item.id}>
                  <span className="dashboard-recent__type">{item.type?.replace('_', ' ')}</span>
                  <strong>{getItemTitle(item)}</strong>
                  <span className="dashboard-recent__date"><FaRegClock aria-hidden="true" /> {new Date(item.createdAt).toLocaleDateString()}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="dashboard-recent__empty">
              <div className="ace-sprite ace-sprite--wave" aria-hidden="true" />
              <div><strong>Your learning library starts here.</strong><p>Save a solution, hint, or concept note and it will be ready for your next visit.</p></div>
              <Link to="/solve-problems?create=true">Solve your first problem <FaArrowRight aria-hidden="true" /></Link>
            </div>
          )}
        </section>
      </div>
    </section>
  );
};

export default DashboardPage;
