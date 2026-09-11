import React from 'react';

export default function BuilderModeSelector({ activeMode, onSelectMode }) {
  const MODES = [
    {
      id: 'manual',
      label: 'Manual Build',
      icon: 'fa-solid fa-screwdriver-wrench',
      badge: '10 Steps',
      description: 'Custom part-by-part assembly with live clearance validation',
    },
    {
      id: 'auto',
      label: 'Auto Build',
      icon: 'fa-solid fa-wand-magic-sparkles',
      badge: 'Algorithmic',
      description: 'Optimal compatible rig generated to match your target budget',
    },
    {
      id: 'game',
      label: 'Build for a Game',
      icon: 'fa-solid fa-gamepad',
      badge: 'Benchmarks',
      description: 'Tailored to publisher specs for Cyberpunk, CS2, Valorant & more',
    },
  ];

  return (
    <div className="builder-mode-switcher-container">
      <div className="builder-mode-tabs" role="tablist">
        {MODES.map((mode) => {
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`mode-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectMode(mode.id)}
            >
              <span className="mode-tab-icon">
                <i className={mode.icon}></i>
              </span>
              <div className="mode-tab-info">
                <div className="mode-tab-title-row">
                  <span className="mode-tab-title">{mode.label}</span>
                  <span className="mode-tab-badge">{mode.badge}</span>
                </div>
                <span className="mode-tab-desc">{mode.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
