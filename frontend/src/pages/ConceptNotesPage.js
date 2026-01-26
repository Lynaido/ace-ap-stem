import React, { useMemo, useState } from 'react';
import Card from '../components/primitives/Card';
import Select from '../components/primitives/Select';
import Button from '../components/primitives/Button';
import ConceptNotesDisplay from '../components/problem-solving/ConceptNotesDisplay';
import './ConceptNotesPage.css';

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

const buildConceptNotes = (subjectValue, includeAdvanced = false) => {
  const label = AP_SUBJECTS.find((subject) => subject.value === subjectValue)?.label || 'this AP subject';

  const baseNotes = [
    {
      id: `${subjectValue}-concept-1`,
      type: 'concept',
      title: 'Core Principles',
      description: `Summarize the fundamental theories from ${label} that frame this problem class.`,
      details: 'List the governing laws, definitions, or conservation ideas you will reference while planning a solution.',
      relatedTopics: ['Problem framing', 'Key assumptions']
    },
    {
      id: `${subjectValue}-concept-2`,
      type: 'formula',
      title: 'Essential Relationships',
      description: 'Capture the symbolic relationships before substituting numbers to keep the reasoning transparent.',
      formula: 'Start from the base law, rearrange for the target variable, then substitute known values.',
      applications: ['Check units at each transformation', 'Track sign conventions explicitly']
    },
    {
      id: `${subjectValue}-concept-3`,
      type: 'example',
      title: 'Worked Analogy',
      description: `Walk through a simpler ${label} scenario that shares the same underlying structure.`,
      details: 'Map each element of the current prompt to the example to verify the concept applies as expected.'
    },
    {
      id: `${subjectValue}-concept-4`,
      type: 'tip',
      title: 'Strategy Reminder',
      description: 'Pause after each algebraic step to ensure the move still aligns with the governing concept.',
      applications: ['Explain the “why” for every manipulation', 'Note potential sources of error to revisit later']
    }
  ];

  if (!includeAdvanced) {
    return baseNotes;
  }

  const advancedNotes = [
    {
      id: `${subjectValue}-concept-5`,
      type: 'concept',
      title: 'Edge Cases',
      description: 'Identify the limits where the standard model breaks down and what corrective factors are needed.',
      details: 'Highlight boundary conditions, non-linear terms, or experimental caveats that become important at extremes.',
      relatedTopics: ['Model constraints', 'Error bounds']
    },
    {
      id: `${subjectValue}-concept-6`,
      type: 'example',
      title: 'Assessment Checkpoint',
      description: 'Draft a short question that forces you to articulate the concept without redoing the full solution.',
      details: 'Use this as a quick self-test after reviewing the main example or immediately before an exam.'
    }
  ];

  return [...baseNotes, ...advancedNotes];
};

const ConceptNotesPage = () => {
  const [selectedSubject, setSelectedSubject] = useState(AP_SUBJECTS[0].value);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const conceptNotes = useMemo(
    () => buildConceptNotes(selectedSubject, showAdvanced),
    [selectedSubject, showAdvanced]
  );

  return (
    <div className="concept-notes-page">
      <section className="concept-notes-hero">
        <h1>Concept Notes Library</h1>
        <p>
          Browse exemplar concept notes for each AP subject. Use them to prep before uploading a problem or to
          reinforce the theories behind a step-by-step solution.
        </p>
      </section>

      <Card className="concept-notes-controls">
        <div className="controls-header">
          <h2>Preview Concept Notes by Subject</h2>
          <p>Select a subject to load a sample set of notes and see how the experience will look for students.</p>
        </div>

        <div className="controls-grid">
          <div className="control-group">
            <label htmlFor="concept-notes-subject">AP Subject</label>
            <Select
              id="concept-notes-subject"
              options={AP_SUBJECTS}
              value={selectedSubject}
              onChange={setSelectedSubject}
              placeholder="Choose an AP subject"
            />
          </div>
          <div className="control-group">
            <label htmlFor="concept-notes-depth">Depth</label>
            <Button
              id="concept-notes-depth"
              variant="ghost"
              className="depth-toggle"
              onClick={() => setShowAdvanced((prev) => !prev)}
            >
              {showAdvanced ? 'Show Core Set' : 'Include Advanced Topics'}
            </Button>
          </div>
        </div>
      </Card>

      <ConceptNotesDisplay conceptNotes={conceptNotes} />
    </div>
  );
};

export default ConceptNotesPage;
