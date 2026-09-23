import React, { useEffect, useId, useState } from 'react';
import {
  BUDDY_NAME_MAX_LENGTH,
  COLORS,
  DEFAULT_BUDDY_NAME,
  normalizeBuddyName,
} from '../mascot/mascotCatalog';
import './BuddyControls.css';

export const NAME_SUGGESTIONS = ['ACE', 'Nova', 'Pixel', 'Sparky', 'Newton'];

// Arrow keys move the choice within a radio group, as native radios do.
const nextIndex = (key, index, count) => {
  if (key === 'ArrowRight' || key === 'ArrowDown') return (index + 1) % count;
  if (key === 'ArrowLeft' || key === 'ArrowUp') return (index - 1 + count) % count;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  return null;
};

export const BuddyColorPicker = ({ colorId, onChange, buddyName, disabled = false }) => {
  const labelId = useId();
  const activeIndex = Math.max(0, COLORS.findIndex((color) => color.id === colorId));
  const active = COLORS[activeIndex];

  const handleKeyDown = (event) => {
    const index = nextIndex(event.key, activeIndex, COLORS.length);
    if (index === null) return;
    event.preventDefault();
    onChange(COLORS[index].id);
    event.currentTarget.parentElement?.querySelectorAll('[role="radio"]')[index]?.focus();
  };

  return (
    <div className="buddy-colors">
      <p className="buddy-controls__label" id={labelId}>{buddyName}&apos;s brain color</p>
      <div className="buddy-colors__swatches" role="radiogroup" aria-labelledby={labelId}>
        {COLORS.map((color, index) => (
          <button
            type="button"
            role="radio"
            key={color.id}
            aria-checked={index === activeIndex}
            aria-label={color.label}
            title={color.label}
            tabIndex={index === activeIndex ? 0 : -1}
            className={`buddy-colors__swatch${index === activeIndex ? ' is-active' : ''}`}
            style={{ '--swatch': color.swatch, '--swatch-glow': color.glow || color.swatch }}
            disabled={disabled}
            onClick={() => onChange(color.id)}
            onKeyDown={handleKeyDown}
          />
        ))}
      </div>
      <p className="buddy-colors__current" aria-live="polite">
        <span className="buddy-colors__dot" style={{ '--swatch': active.swatch, '--swatch-glow': active.glow || active.swatch }} aria-hidden="true" />
        {active.label}
      </p>
    </div>
  );
};

export const BuddyNameForm = ({ name, onSave }) => {
  const inputId = useId();
  const hintId = useId();
  const [draft, setDraft] = useState(name || DEFAULT_BUDDY_NAME);
  const [feedback, setFeedback] = useState({ tone: 'hint', text: '' });

  useEffect(() => {
    setDraft(name || DEFAULT_BUDDY_NAME);
  }, [name]);

  const save = (value) => {
    const cleaned = value.trim().replace(/\s+/g, ' ');
    if (!cleaned || cleaned === DEFAULT_BUDDY_NAME) {
      onSave('');
      setDraft(DEFAULT_BUDDY_NAME);
      setFeedback({ tone: 'success', text: `${DEFAULT_BUDDY_NAME} it is!` });
      return;
    }
    const valid = normalizeBuddyName(cleaned);
    if (!valid) {
      setFeedback({ tone: 'error', text: 'Use letters, numbers, spaces, dots, apostrophes or dashes.' });
      return;
    }
    onSave(valid);
    setDraft(valid);
    setFeedback({ tone: 'success', text: `Nice to meet you, ${valid}!` });
  };

  const current = name || DEFAULT_BUDDY_NAME;

  return (
    <form
      className="buddy-name"
      onSubmit={(event) => {
        event.preventDefault();
        save(draft);
      }}
    >
      <label className="buddy-controls__label" htmlFor={inputId}>Your buddy&apos;s name</label>
      <div className="buddy-name__row">
        <input
          id={inputId}
          type="text"
          value={draft}
          maxLength={BUDDY_NAME_MAX_LENGTH}
          autoComplete="off"
          spellCheck="false"
          aria-describedby={hintId}
          aria-invalid={feedback.tone === 'error'}
          onChange={(event) => {
            setDraft(event.target.value);
            if (feedback.text) setFeedback({ tone: 'hint', text: '' });
          }}
        />
        <button type="submit" disabled={draft.trim().replace(/\s+/g, ' ') === current}>Save name</button>
      </div>
      <div className="buddy-name__suggestions" aria-label="Name ideas">
        {NAME_SUGGESTIONS.map((suggestion) => (
          <button
            type="button"
            key={suggestion}
            className={suggestion === current ? 'is-active' : ''}
            aria-pressed={suggestion === current}
            onClick={() => save(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
      <p
        id={hintId}
        className={`buddy-name__feedback buddy-name__feedback--${feedback.tone}`}
        role={feedback.tone === 'error' ? 'alert' : 'status'}
      >
        {feedback.text || `Up to ${BUDDY_NAME_MAX_LENGTH} characters. ${current} will answer to it on every page.`}
      </p>
    </form>
  );
};
