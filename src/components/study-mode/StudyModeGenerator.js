import React, { useState } from 'react';
import Button from '../primitives/Button';
import Spinner from '../primitives/Spinner';
import './StudyModeGenerator.css';

const modeTimeEstimates = {
  'quick-practice': '3-4 min per variant',
  'deep-dive': '6-8 min per variant',
  'exam-sim': '4-6 min per variant',
};

const modeSupportCopy = {
  'quick-practice': 'Speed drills with confidence boosts between each attempt.',
  'deep-dive': 'Guided reflection prompts and layered hints to unpack the why.',
  'exam-sim': 'Timed practice with scoring cues to mirror a high-stakes setting.',
};

const StudyModeGenerator = ({
  variants = [],
  selectedMode,
  selectedProblem,
  loading = false,
  onRegenerate,
  onChangeNote,
  onReset,
  onLaunchVariant,
}) => {
  const [previewingHints, setPreviewingHints] = useState(null);
  const hasVariants = Array.isArray(variants) && variants.length > 0;
  const modeId = selectedMode?.id;
  const problemTags = selectedProblem?.tags || [];

  const getFocusTag = (index) => {
    if (problemTags.length === 0) {
      return 'Core concept reinforcement';
    }
    return problemTags[index % problemTags.length];
  };

  const estimatedTime = modeId ? modeTimeEstimates[modeId] : '5 min per variant';
  const supportDescription = modeId ? modeSupportCopy[modeId] : 'Tailored guidance awaits once you pick a mode.';

  if (!selectedMode || !selectedProblem) {
    return (
      <div className="study-mode-generator-placeholder">
        <p>Select a study mode and note to preview the practice experience.</p>
        <div className="placeholder-actions">
          {onReset && (
            <Button variant="primary" size="medium" onClick={onReset}>
              Start setup
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="study-mode-session">
      <header className="session-header">
        <div className="session-intro">
          <span className="session-eyebrow">Study session preview</span>
          <h2>{selectedMode.name}</h2>
          <p>{selectedMode.description}</p>
        </div>
        <div className="session-actions">
          <Button variant="primary" size="medium" onClick={onRegenerate}>
            Regenerate variants
          </Button>
          <Button variant="secondary" size="medium" onClick={onChangeNote}>
            Switch note
          </Button>
          <Button variant="ghost" size="medium" onClick={onReset}>
            Start over
          </Button>
        </div>
      </header>

      <div className="session-meta">
        <div className="session-meta-tile">
          <span className="meta-label">Anchor note</span>
          <strong>{selectedProblem.title}</strong>
          <p>{selectedProblem.excerpt}</p>
          <div className="meta-tags">
            <span>{selectedProblem.subject || 'Saved problem'}</span>
            <span>{estimatedTime}</span>
          </div>
        </div>
        <div className="session-meta-tile">
          <span className="meta-label">Mode highlights</span>
          <ul>
            {selectedMode.highlights.map((highlight) => (
              <li key={highlight}>{highlight}</li>
            ))}
          </ul>
          <p className="meta-support">{supportDescription}</p>
        </div>
      </div>

      {loading ? (
        <div className="variants-loading-container">
          <div className="variants-loading-content">
            <Spinner size="xl" color="primary" />
            <div className="variants-loading-text">
              <h3>Generating AI-Powered Variants</h3>
              <p>Our AI is creating personalized practice problems based on your selected note and study mode...</p>
            </div>
          </div>
        </div>
      ) : hasVariants ? (
        <div className="session-variants">
          <div className="variants-heading">
            <div>
              <h3>Generated variants</h3>
              <p>
                Built from {selectedProblem.title}. Launch any variant to see the full prompt, hints, and scoring cues.
              </p>
            </div>
            <span className="variant-count">{variants.length} ready</span>
          </div>
          <div className="session-variants-grid">
            {variants.map((variant, index) => {
              const focusTag = getFocusTag(index);
              return (
                <article key={variant.id} className="session-variant-card">
                  <header className="variant-header">
                    <span className="variant-index">{index + 1}</span>
                    <div>
                      <h4>{variant.title}</h4>
                      <p>{variant.excerpt}</p>
                    </div>
                  </header>
                  <div className="variant-body">
                    <div className="variant-detail">
                      <span className="detail-label">Focus area</span>
                      <span className="detail-value">{focusTag}</span>
                    </div>
                    <div className="variant-detail">
                      <span className="detail-label">Estimated time</span>
                      <span className="detail-value">{variant.estimatedTime ? `${variant.estimatedTime} min` : estimatedTime}</span>
                    </div>
                    <div className="variant-detail">
                      <span className="detail-label">Difficulty</span>
                      <span className="detail-value">{variant.difficulty || 'Medium'}</span>
                    </div>
                    {variant.hints && variant.hints.length > 0 && previewingHints === variant.id && (
                      <div className="variant-hints-preview">
                        <span className="detail-label">Available hints ({variant.hints.length})</span>
                        <ul className="hints-list">
                          {variant.hints.map((hint, hintIndex) => (
                            <li key={hintIndex}>{hint}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="variant-actions">
                    <Button 
                      variant="primary" 
                      size="small"
                      onClick={() => onLaunchVariant && onLaunchVariant(variant)}
                    >
                      Launch variant
                    </Button>
                    {variant.hints && variant.hints.length > 0 && (
                      <Button 
                        variant="ghost" 
                        size="small"
                        onClick={() => setPreviewingHints(previewingHints === variant.id ? null : variant.id)}
                      >
                        {previewingHints === variant.id ? 'Hide hints' : `Preview hints (${variant.hints.length})`}
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="study-mode-generator-placeholder">
          <p>No variants generated yet. Use the controls above to create a practice set.</p>
          <div className="placeholder-actions">
            <Button variant="primary" size="medium" onClick={onRegenerate}>
              Generate variants
            </Button>
          </div>
        </div>
      )}
    </section>
  );
};

export default StudyModeGenerator;
