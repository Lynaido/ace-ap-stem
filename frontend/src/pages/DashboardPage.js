import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaArrowRight,
  FaBookOpen,
  FaComments,
  FaLightbulb,
  FaRegClock,
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
      .then((response) => {
        if (active) setRecentItems(response.data || []);
      })
      .catch(() => {
        if (active) setRecentItems([]);
      });
    return () => { active = false; };
  }, []);

  const getItemTitle = (item) => (
    item.problem?.title
    || item.conceptNote?.title
    || `${item.type?.replace('_', ' ').toLowerCase() || 'Saved'} item`
  );

  const tools = [
    {
      title: 'Solve a problem',
      description: 'Upload an image or type a question, then choose the exact question or sub-part you want to solve.',
      to: '/solve-problems?create=true',
      cta: 'Start solving',
      icon: FaUpload,
      primary: true,
    },
    {
      title: 'Ask the AI tutor',
      description: 'Work through a difficult concept in a conversational tutoring session.',
      to: '/tutor',
      cta: 'Open tutor',
      icon: FaComments,
    },
    {
      title: 'Review your notes',
      description: 'Find saved solutions, hints and concept notes in one organized workspace.',
      to: '/notes-hub',
      cta: 'View notes',
      icon: FaBookOpen,
    },
    {
      title: 'Practice with purpose',
      description: 'Generate focused practice from problems you have already worked through.',
      to: '/study-mode',
      cta: 'Enter study mode',
      icon: FaLightbulb,
    },
  ];

  return (
    <section className="dashboard-page" aria-labelledby="dashboard-title">
      <div className="dashboard-shell">
        <header className="dashboard-hero">
          <div>
            <p className="dashboard-eyebrow">YOUR LEARNING WORKSPACE</p>
            <h1 id="dashboard-title">Ready for your next win, {firstName}?</h1>
            <p className="dashboard-intro">
              Choose a tool below. ACE keeps your solutions, hints and concept notes connected to the part of the problem you selected.
            </p>
          </div>
          <div className="dashboard-hero-mark" aria-hidden="true">
            <img src="/logo.png" alt="" />
          </div>
        </header>

        <div className="dashboard-grid">
          {tools.map(({ title, description, to, cta, icon: Icon, primary }) => (
            <article className={`dashboard-card${primary ? ' dashboard-card--primary' : ''}`} key={title}>
              <div className="dashboard-card__icon" aria-hidden="true">
                <Icon />
              </div>
              <div className="dashboard-card__content">
                <h2>{title}</h2>
                <p>{description}</p>
              </div>
              <Link className="dashboard-card__link" to={to}>
                {cta} <FaArrowRight aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>

        <section className="dashboard-recent" aria-labelledby="recent-learning-title">
          <div className="dashboard-section-heading">
            <div>
              <p>YOUR LIBRARY</p>
              <h2 id="recent-learning-title">Continue where you left off</h2>
            </div>
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
              <p>Your saved learning will appear here after you solve and save a problem.</p>
              <Link to="/solve-problems?create=true">Solve your first problem <FaArrowRight aria-hidden="true" /></Link>
            </div>
          )}
        </section>

        <aside className="dashboard-tip">
          <span className="dashboard-tip__label">Study tip</span>
          <p>When a problem contains 2(a), 2(b) and 2(c), choose one part or solve the full question in order. The same choice carries across every AI learning tool.</p>
        </aside>
      </div>
    </section>
  );
};

export default DashboardPage;
