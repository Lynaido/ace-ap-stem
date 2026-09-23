import React, { useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaCheck,
  FaCheckCircle,
  FaMagic,
  FaPalette,
  FaRegHeart,
  FaRegUser,
  FaTshirt,
} from 'react-icons/fa';
import { OUTFITS, POSED_VARIANTS, getBuddyName, getOutfitAccessories } from '../mascot/mascotCatalog';
import { useAcey } from './AceyContext';
import AceyAvatar from './AceyAvatar';
import { BuddyColorPicker, BuddyNameForm } from './BuddyControls';
import './AceyBuddyPanel.css';

const TOPICS = ['Homework questions', 'Concept explanations', 'Practice problems', 'AP strategies', 'And more!'];

export const outfitThumbnail = (outfitId) => `/mascot/thumbs/${outfitId}.webp`;

const hideBrokenImage = (event) => {
  event.currentTarget.hidden = true;
};

// Dashboard home for Acey: meet the study buddy, then customize it in place.
// Every change saves through AceyContext, so the floating companion and the
// full studio at /customize-acey show the same look.
const AceyBuddyPanel = () => {
  const { appearance, updateAppearance, syncStatus } = useAcey();
  const name = getBuddyName(appearance);
  const idBase = useId();
  const tabRefs = useRef([]);
  const [activeTab, setActiveTab] = useState('outfit');
  const [reaction, setReaction] = useState(null);

  const activeOutfit = OUTFITS.find((outfit) => outfit.id === appearance.outfitId) || OUTFITS[0];
  const accessories = getOutfitAccessories(activeOutfit);

  const tabs = [
    { id: 'outfit', label: 'Choose Outfit', icon: FaTshirt },
    { id: 'color', label: 'Pick Color', icon: FaPalette },
    { id: 'accessories', label: 'Accessories', icon: FaRegHeart },
    { id: 'name', label: `Name ${name}`, icon: FaRegUser },
  ];

  // Acey celebrates each change so learners see it land on the model.
  const update = (partial) => {
    updateAppearance(partial);
    setReaction({ id: 'celebrate', key: Date.now() });
  };

  const handleTabKeyDown = (event, index) => {
    const moves = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const next = (moves[event.key] + tabs.length) % tabs.length;
    setActiveTab(tabs[next].id);
    tabRefs.current[next]?.focus();
  };

  const panelId = (tabId) => `${idBase}-panel-${tabId}`;
  const tabId = (id) => `${idBase}-tab-${id}`;

  return (
    <section className="acey-buddy" aria-label={`${name}, your study buddy`}>
      <div className="acey-buddy__meet">
        <div className="acey-buddy__stage">
          <span className="acey-buddy__orb" aria-hidden="true" />
          <div className="acey-buddy__avatar" role="img" aria-label={`${name} in the ${activeOutfit.label} look`}>
            <AceyAvatar appearance={appearance} reaction={reaction} compact={false} />
          </div>
          <span className="acey-buddy__float acey-buddy__float--dots" aria-hidden="true"><i /><i /><i /></span>
          <span className="acey-buddy__float acey-buddy__float--heart" aria-hidden="true">💜</span>
          <span className="acey-buddy__role">{activeOutfit.number} · {activeOutfit.label}</span>
        </div>

        <div className="acey-buddy__intro">
          <p className="acey-buddy__eyebrow">Meet Your Study Buddy</p>
          <h2 id={`${idBase}-title`}>
            This is {name}! <span aria-hidden="true">💜</span>
          </h2>
          <p>
            Your AI companion for smarter learning. Always here to support, motivate,
            and guide you through every challenge.
          </p>
          <Link className="acey-buddy__cta" to="/tutor">
            Chat with {name} <FaMagic aria-hidden="true" />
          </Link>
        </div>

        <figure className="acey-buddy__chat">
          <figcaption className="acey-buddy__visually-hidden">Example conversation with {name}</figcaption>
          <span className="acey-buddy__chat-dots" aria-hidden="true"><i /><i /><i /></span>
          <p className="acey-buddy__question">How do I solve this integral?</p>
          <div className="acey-buddy__answer">
            <span className="acey-buddy__mini" aria-hidden="true">
              <img src={outfitThumbnail(activeOutfit.id)} alt="" onError={hideBrokenImage} />
            </span>
            <p>Let&apos;s break it down step by step! <span aria-hidden="true">🚀</span></p>
            <div className="acey-buddy__steps">
              <p>Step 1: Use u-substitution with u = 2x + 1.</p>
              <p>Step 2: Rewrite the integral in terms of u.</p>
            </div>
          </div>
          <p className="acey-buddy__typing">
            <span className="acey-buddy__typing-dots" aria-hidden="true"><i /><i /><i /></span>
            {name} is typing…
          </p>
        </figure>

        <div className="acey-buddy__topics">
          <h3>Ask anything about:</h3>
          <ul>
            {TOPICS.map((topic) => (
              <li key={topic}><FaCheckCircle aria-hidden="true" /> {topic}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="acey-buddy__studio" id="acey-studio" data-acey-target="customize-acey">
        <div className="acey-buddy__studio-copy">
          <h2 id={`${idBase}-studio`}>
            Make {name} truly <span className="acey-buddy__nowrap">yours <span aria-hidden="true">✨</span></span>
          </h2>
          <p>Personalize your study buddy to match your style and keep learning fun and motivating!</p>
          <Link className="acey-buddy__cta" to="/customize-acey">
            Customize {name} <FaMagic aria-hidden="true" />
          </Link>
          <p className="acey-buddy__studio-note">
            {syncStatus === 'offline'
              ? 'Saved on this device. We will sync it to your account.'
              : `Changes save automatically. Open the full studio for moods, reactions and a 3D view.`}
          </p>
        </div>

        <div className="acey-buddy__controls">
          <div className="acey-buddy__tabs" role="tablist" aria-labelledby={`${idBase}-studio`}>
            {tabs.map(({ id, label, icon: Icon }, index) => (
              <button
                type="button"
                role="tab"
                key={id}
                id={tabId(id)}
                ref={(element) => { tabRefs.current[index] = element; }}
                className="acey-buddy__tab"
                aria-selected={activeTab === id}
                aria-controls={panelId(id)}
                tabIndex={activeTab === id ? 0 : -1}
                onClick={() => setActiveTab(id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
              >
                <Icon aria-hidden="true" /> {label}
              </button>
            ))}
          </div>

          <div
            className="acey-buddy__panel"
            role="tabpanel"
            id={panelId(activeTab)}
            aria-labelledby={tabId(activeTab)}
          >
            {activeTab === 'outfit' && (
              <div className="acey-buddy__outfit-row">
                <div className="acey-buddy__outfits">
                  {OUTFITS.map((outfit) => {
                    const selected = outfit.id === activeOutfit.id;
                    return (
                      <button
                        type="button"
                        key={outfit.id}
                        className={`acey-buddy__outfit${selected ? ' is-selected' : ''}`}
                        aria-pressed={selected}
                        onClick={() => update({ outfitId: outfit.id })}
                      >
                        <span className="acey-buddy__outfit-art">
                          <img
                            src={outfitThumbnail(outfit.id)}
                            alt=""
                            width="120"
                            height="120"
                            loading="lazy"
                            onError={hideBrokenImage}
                          />
                        </span>
                        <span className="acey-buddy__outfit-label">
                          <small>{outfit.number}</small>
                          {outfit.label}
                        </span>
                        {selected && (
                          <span className="acey-buddy__outfit-check" aria-hidden="true"><FaCheck /></span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="acey-buddy__bubble">
                  Let&apos;s learn something amazing today! <span aria-hidden="true">💗</span>
                </p>
              </div>
            )}

            {activeTab === 'color' && (
              <div className="acey-buddy__color">
                <BuddyColorPicker
                  colorId={appearance.colorId}
                  buddyName={name}
                  onChange={(colorId) => update({ colorId })}
                />
                <p className="acey-buddy__hint">
                  {appearance.accessoriesEnabled && POSED_VARIANTS[activeOutfit.id] && !POSED_VARIANTS[activeOutfit.id].brainMaterials
                    ? `In the ${activeOutfit.label} look ${name}'s brain keeps its designer color; the color shows in the other looks.`
                    : `${name} keeps this color in every outfit and on every study page.`}
                </p>
              </div>
            )}

            {activeTab === 'accessories' && (
              <div className="acey-buddy__props">
                {accessories && (
                  <div className={`acey-buddy__props-card${accessories.builtIn || appearance.accessoriesEnabled ? ' is-on' : ''}`}>
                    <span className="acey-buddy__props-icon" aria-hidden="true">✦</span>
                    <span className="acey-buddy__props-copy">
                      <strong>{accessories.label}</strong>
                      <small>
                        {accessories.builtIn
                          ? `Always part of the ${activeOutfit.label} look.`
                          : `${name} holds these in the ${activeOutfit.label} look.`}
                      </small>
                    </span>
                    {accessories.builtIn ? (
                      <span className="acey-buddy__props-badge">Included</span>
                    ) : (
                      <label className="acey-buddy__switch">
                        <input
                          type="checkbox"
                          role="switch"
                          checked={appearance.accessoriesEnabled}
                          aria-label={`Show props: ${accessories.label}`}
                          onChange={(event) => update({ accessoriesEnabled: event.target.checked })}
                        />
                        <span className="acey-buddy__switch-track" aria-hidden="true" />
                        <span className="acey-buddy__switch-state" aria-hidden="true">
                          {appearance.accessoriesEnabled ? 'On' : 'Off'}
                        </span>
                      </label>
                    )}
                  </div>
                )}
                <p className="acey-buddy__hint">Every role comes with its own props. Pick one to try it on:</p>
                <div className="acey-buddy__prop-roles">
                  {OUTFITS.map((outfit) => (
                    <button
                      type="button"
                      key={outfit.id}
                      className="acey-buddy__prop-role"
                      aria-pressed={outfit.id === activeOutfit.id}
                      onClick={() => update({ outfitId: outfit.id })}
                    >
                      <strong>{outfit.label}</strong>
                      <small>{outfit.plain ? 'No outfit, just ACE' : getOutfitAccessories(outfit)?.label}</small>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'name' && (
              <BuddyNameForm name={appearance.name} onSave={(value) => update({ name: value })} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AceyBuddyPanel;
