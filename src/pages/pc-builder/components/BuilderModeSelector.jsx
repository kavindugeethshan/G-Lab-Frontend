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
    <div className="pcb-nav-modes-container builder-mode-switcher-container">
      <div className="pcb-nav-modes-bar builder-mode-tabs" role="tablist" aria-label="PC Builder Modes">
        {MODES.map((mode) => {
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              id={`pcb-mode-${mode.id}-tab`}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`pcb-mode-tab mode-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectMode(mode.id)}
            >
              <span className="pcb-mode-icon mode-tab-icon">
                <i className={mode.icon}></i>
              </span>
              <div className="pcb-mode-info mode-tab-info">
                <div className="pcb-mode-title-row mode-tab-title-row">
                  <span className="pcb-mode-title mode-tab-title">{mode.label}</span>
                  <span className="pcb-mode-badge mode-tab-badge">{mode.badge}</span>
                </div>
                <span className="pcb-mode-desc mode-tab-desc">{mode.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
