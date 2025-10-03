import React, { useState } from 'react';
import Button from '../primitives/Button';
import Card from '../primitives/Card';
import Tabs from '../primitives/Tabs';
import './ConceptNotesDisplay.css';

const ConceptNotesDisplay = ({ conceptNotes, problemText, onGetSolution, onGetHints, isGeneratingSolution, isGeneratingHints }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [expandedSections, setExpandedSections] = useState(new Set());

  if (!conceptNotes || !conceptNotes.length) {
    return null;
  }

  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const tabs = [
    { id: 'concepts', label: 'Key Concepts', count: conceptNotes.filter(note => note.type === 'concept').length },
    { id: 'formulas', label: 'Formulas', count: conceptNotes.filter(note => note.type === 'formula').length },
    { id: 'examples', label: 'Examples', count: conceptNotes.filter(note => note.type === 'example').length },
    { id: 'tips', label: 'Study Tips', count: conceptNotes.filter(note => note.type === 'tip').length }
  ];

  const getFilteredNotes = (tabId) => {
    const typeMap = {
      concepts: 'concept',
      formulas: 'formula',
      examples: 'example',
      tips: 'tip'
    };

    const targetType = typeMap[tabId] || tabId;
    return conceptNotes.filter(note => note.type === targetType);
  };

  const getCurrentNotes = () => {
    const currentTab = tabs[activeTab];
    return getFilteredNotes(currentTab.id);
  };

  const renderNote = (note, index) => {
    const isExpanded = expandedSections.has(note.id);
    const hasDetails = note.details || note.formula || note.derivation || note.applications;

    return (
      <div key={note.id} className={`concept-note ${note.type}`}>
        <div className="note-header" onClick={() => hasDetails && toggleSection(note.id)}>
          <div className="note-title-section">
            <div className="note-icon">
              {getIconForType(note.type)}
            </div>
            <h3 className="note-title">{note.title}</h3>
            {note.difficulty && (
              <span className={`difficulty-badge ${note.difficulty}`}>
                {note.difficulty}
              </span>
            )}
          </div>
          {hasDetails && (
            <button className={`expand-button ${isExpanded ? 'expanded' : ''}`}>
              ↓
            </button>
          )}
        </div>

        <div className="note-content">
          <p className="note-description">{note.description}</p>
          
          {note.formula && (
            <div className="formula-section">
              <strong>Formula:</strong>
              <div className="formula-display">{note.formula}</div>
            </div>
          )}

          {isExpanded && hasDetails && (
            <div className="note-details">
              {note.details && (
                <div className="details-section">
                  <strong>Details:</strong>
                  <p>{note.details}</p>
                </div>
              )}

              {note.derivation && (
                <div className="derivation-section">
                  <strong>Derivation:</strong>
                  <p>{note.derivation}</p>
                </div>
              )}

              {note.applications && (
                <div className="applications-section">
                  <strong>Common Applications:</strong>
                  <ul>
                    {note.applications.map((app, idx) => (
                      <li key={idx}>{app}</li>
                    ))}
                  </ul>
                </div>
              )}

              {note.relatedTopics && (
                <div className="related-topics">
                  <strong>Related Topics:</strong>
                  <div className="topic-tags">
                    {note.relatedTopics.map((topic, idx) => (
                      <span key={idx} className="topic-tag">{topic}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'concept': return '💡';
      case 'formula': return '📐';
      case 'example': return '📝';
      case 'tip': return '💭';
      default: return '📋';
    }
  };

  return (
    <Card className="concept-notes-display">
      <div className="concept-notes-header">
        <h2>Concept Notes</h2>
        <p>Get essential theories and concepts required to understand and solve this problem without revealing the final answer. Use them as the background guide for your thinking process.</p>
      </div>

      <div className="concept-tabs-container">
        <Tabs
          tabs={tabs.map(tab => ({
            ...tab,
            label: `${tab.label} (${tab.count})`
          }))}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      <div className="concept-notes-content">
        {getCurrentNotes().length > 0 ? (
          <div className="notes-list">
            {getCurrentNotes().map((note, index) => renderNote(note, index))}
          </div>
        ) : (
          <div className="no-notes-message">
            <p>No {tabs[activeTab].label.toLowerCase()} available for this problem.</p>
          </div>
        )}
      </div>

      <div className="concept-notes-actions">
        <Button 
          variant="outline" 
          size="small"
          onClick={() => {
            alert('Notes saved! (This will be implemented to save to your notes)');
          }}
        >
          Save Notes
        </Button>
        <Button 
          variant="outline" 
          size="small"
          onClick={onGetSolution}
          disabled={isGeneratingSolution}
        >
          {isGeneratingSolution ? 'Generating...' : 'Get Full Solution'}
        </Button>
        <Button 
          variant="outline" 
          size="small"
          onClick={onGetHints}
          disabled={isGeneratingHints}
        >
          {isGeneratingHints ? 'Generating...' : 'Get Hints Instead'}
        </Button>
      </div>
    </Card>
  );
};

export default ConceptNotesDisplay;