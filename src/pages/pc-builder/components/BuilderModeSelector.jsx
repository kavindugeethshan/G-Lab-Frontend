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
    <nav className="pcb-mode-navbar" aria-label="Builder Modes Navigation">
      <div className="pcb-mode-navbar-track" role="tablist">
        {MODES.map((mode) => {
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`pcb-mode-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectMode(mode.id)}
            >
              <span className="pcb-mode-nav-icon">
                <i className={mode.icon}></i>
              </span>
              <div className="pcb-mode-nav-content">
                <div className="pcb-mode-nav-header">
                  <span className="pcb-mode-nav-label">{mode.label}</span>
                  <span className="pcb-mode-nav-badge">{mode.badge}</span>
                </div>
                <p className="pcb-mode-nav-desc">{mode.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
