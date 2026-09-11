import React, { useState, useMemo } from 'react';
import { GAMES_DATABASE } from '../data/gamesDatabase';
import {
  evaluateGamePerformance,
  evaluateGameBudgetFeasibility,
  generateGameBuild,
} from '../utils/recommendations';

export default function GameSelector({
  allProducts = [],
  targetBudget = 450000,
  onBudgetChange,
  selectedParts = {},
  onApplyGameBuild,
  onCloseGameMode,
}) {
  const [activeGameId, setActiveGameId] = useState(GAMES_DATABASE[0].id);
  const [targetLevel, setTargetLevel] = useState('1440p'); // '1080p' | '1440p' | '4k'
  const [localBudget, setLocalBudget] = useState(targetBudget);
  const [generationError, setGenerationError] = useState(null);

  const activeGame = GAMES_DATABASE.find((g) => g.id === activeGameId) || GAMES_DATABASE[0];

  // Live feasibility check
  const feasibility = useMemo(() => {
    return evaluateGameBudgetFeasibility({
      allProducts,
      gameId: activeGameId,
      targetBudget: localBudget,
      targetLevel,
    });
  }, [allProducts, activeGameId, localBudget, targetLevel]);

  // Current build benchmark evaluation
  const evaluation = useMemo(() => {
    return evaluateGamePerformance(selectedParts, activeGameId, localBudget);
  }, [selectedParts, activeGameId, localBudget]);

  const formatPrice = (val) => {
    if (typeof val !== 'number' || isNaN(val)) return 'Rs. 0';
    return `Rs. ${val.toLocaleString()}`;
  };

  const handleBudgetInputChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    const num = Number(raw) || 0;
    setLocalBudget(num);
    setGenerationError(null);
    if (onBudgetChange) onBudgetChange(num);
  };

  const handleSelectPresetBudget = (amount) => {
    setLocalBudget(amount);
    setGenerationError(null);
    if (onBudgetChange) onBudgetChange(amount);
  };

  const handleAssembleClick = () => {
    setGenerationError(null);

    // 1. Feasibility check
    if (!feasibility.isFeasible) {
      setGenerationError(
        `No compatible build is currently available within your budget. Minimum estimated build cost is ${formatPrice(feasibility.minimumCost)} (Your budget: ${formatPrice(localBudget)}, Shortfall: ${formatPrice(feasibility.shortfall)}). Please review the recommended alternatives below.`
      );
      return;
    }

    // 2. Generate build using recommendations engine
    const result = generateGameBuild({
      allProducts,
      gameId: activeGameId,
      targetBudget: localBudget,
      targetLevel,
    });

    if (result.status === 'insufficient_budget' || !result.build) {
      const minCost = result.minimumCost || feasibility.minimumCost;
      const shortfall = result.shortfall || feasibility.shortfall;
      setGenerationError(
        `No compatible build is currently available within your budget. Minimum required build cost is ${formatPrice(minCost)} (Your budget: ${formatPrice(localBudget)}, Shortfall: ${formatPrice(shortfall)}).`
      );
      return;
    }

    // Double check: totalCost must never exceed budget
    if (result.totalCost > localBudget) {
      setGenerationError('No compatible build is currently available within your budget.');
      return;
    }

    if (result.status === 'success' && result.build) {
      if (onApplyGameBuild) {
        onApplyGameBuild(result.build, localBudget, activeGame);
      }
    } else {
      setGenerationError(result.message || 'No compatible build is currently available within your budget.');
    }
  };

  return (
    <div className="game-selector-container">
      {/* HEADER */}
      <div className="game-selector-header">
        <div className="game-selector-title-group">
          <span className="game-mode-pill">
            <i className="fa-solid fa-gamepad"></i> Game Mode Budget Studio
          </span>
          <h3>Target Game Performance & Budget Studio</h3>
          <p className="game-selector-subtitle">
            Select a target game title, desired resolution, and budget. Our deterministic engine verifies whether in-stock G-Lab inventory can satisfy the target without silently exceeding your budget.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline btn-sm btn-close-game-mode"
          onClick={onCloseGameMode}
          title="Return to standard view"
        >
          <i className="fa-solid fa-xmark"></i> Close Game Mode
        </button>
      </div>

      {/* STEP 1: SELECT GAME */}
      <div className="studio-step-section">
        <div className="step-section-heading">
          <span className="step-num-circle">1</span>
          <h4>Step 1: Select Game</h4>
        </div>
        <div className="games-picker-grid">
          {GAMES_DATABASE.map((game) => {
            const isSelected = game.id === activeGameId;
            return (
              <div
                key={game.id}
                className={`game-card ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  setActiveGameId(game.id);
                  setGenerationError(null);
                }}
              >
                <div className="game-card-icon-wrapper">
                  <i className={game.icon}></i>
                </div>
                <div className="game-card-info">
                  <span className="game-badge">{game.coverBadge}</span>
                  <h4 className="game-title">{game.name}</h4>
                  <span className="game-genre">{game.genre}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ACTIVE GAME STUDIO BENCHMARK CARD */}
      {activeGame && (
        <div className="active-game-benchmark-card">
          {/* STEP 2 & 3 CONTROLS: TARGET RESOLUTION & BUDGET INPUT */}
          <div className="game-budget-studio-controls">
            {/* STEP 2: SELECT TARGET */}
            <div className="studio-control-block">
              <label className="studio-control-label">
                <span className="step-inline-badge">2</span> Step 2: Select Target Resolution / Level
              </label>
              <div className="target-level-button-group">
                <button
                  type="button"
                  className={`target-level-btn ${targetLevel === '1080p' ? 'active' : ''}`}
                  onClick={() => {
                    setTargetLevel('1080p');
                    setGenerationError(null);
                  }}
                >
                  <strong>1080p</strong>
                  <span>Competitive / Standard</span>
                </button>
                <button
                  type="button"
                  className={`target-level-btn ${targetLevel === '1440p' ? 'active' : ''}`}
                  onClick={() => {
                    setTargetLevel('1440p');
                    setGenerationError(null);
                  }}
                >
                  <strong>1440p</strong>
                  <span>High / Ultra 60FPS+</span>
                </button>
                <button
                  type="button"
                  className={`target-level-btn ${targetLevel === '4k' ? 'active' : ''}`}
                  onClick={() => {
                    setTargetLevel('4k');
                    setGenerationError(null);
                  }}
                >
                  <strong>4K</strong>
                  <span>Enthusiast / Ray Tracing</span>
                </button>
              </div>
            </div>

            {/* STEP 3: ENTER BUDGET */}
            <div className="studio-control-block">
              <label className="studio-control-label">
                <span className="step-inline-badge">3</span> Step 3: Enter Budget (LKR)
              </label>
              <div className="studio-budget-input-wrapper">
                <span className="currency-prefix">Rs.</span>
                <input
                  type="text"
                  className="studio-budget-input"
                  value={localBudget ? localBudget.toLocaleString() : ''}
                  onChange={handleBudgetInputChange}
                  placeholder="e.g. 600,000"
                />
              </div>

              {/* QUICK PRESET CHIPS */}
              <div className="budget-preset-chips">
                <span className="preset-label">Quick:</span>
                {[450000, 600000, 750000, 900000, 1200000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className={`preset-chip ${localBudget === amt ? 'active' : ''}`}
                    onClick={() => handleSelectPresetBudget(amt)}
                  >
                    Rs. {(amt / 1000).toFixed(0)}K
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 4: IMMEDIATELY EVALUATE FEASIBILITY */}
          <div className="studio-step-heading-small">
            <span className="step-inline-badge">4</span>
            <h4>Step 4: Real-Time Feasibility Evaluation</h4>
          </div>

          {/* REAL-TIME BUDGET FEASIBILITY STATUS BANNER */}
          <div
            className={`budget-feasibility-banner ${
              feasibility.isFeasible ? 'feasible' : 'insufficient'
            }`}
          >
            <div className="feasibility-banner-header">
              <div className="feasibility-title-wrap">
                <i
                  className={`fa-solid ${
                    feasibility.isFeasible
                      ? 'fa-circle-check text-success'
                      : 'fa-triangle-exclamation text-danger'
                  }`}
                ></i>
                <h4>
                  {feasibility.isFeasible
                    ? '✓ Budget appears sufficient'
                    : '⚠ Budget insufficient'}
                </h4>
              </div>
              <span className="feasibility-target-tag">
                {activeGame.name} • {targetLevel.toUpperCase()}
              </span>
            </div>

            {/* FEASIBILITY CORE SUMMARY GRID */}
            <div className="feasibility-stats-grid">
              <div className="feasibility-stat-item">
                <span className="stat-label">Game:</span>
                <strong className="stat-value">{activeGame.name}</strong>
              </div>
              <div className="feasibility-stat-item">
                <span className="stat-label">Target:</span>
                <strong className="stat-value">{targetLevel.toUpperCase()}</strong>
              </div>
              <div className="feasibility-stat-item">
                <span className="stat-label">Budget:</span>
                <strong className="stat-value">{formatPrice(localBudget)}</strong>
              </div>
              <div className="feasibility-stat-item">
                <span className="stat-label">Status:</span>
                <strong className={`stat-value ${feasibility.isFeasible ? 'text-success' : 'text-danger'}`}>
                  {feasibility.isFeasible ? '✓ Budget appears sufficient' : '⚠ Budget insufficient'}
                </strong>
              </div>
            </div>

            {/* BUDGET DETAILS ROW */}
            <div className="feasibility-breakdown-row">
              <div className="feasibility-stat-item">
                <span className="stat-label">Your budget:</span>
                <strong className="stat-value">{formatPrice(localBudget)}</strong>
              </div>
              <div className="feasibility-stat-item">
                <span className="stat-label">Estimated minimum:</span>
                <strong className="stat-value">{formatPrice(feasibility.minimumCost)}</strong>
              </div>
              {feasibility.isFeasible ? (
                <div className="feasibility-stat-item text-success">
                  <span className="stat-label">Budget headroom:</span>
                  <strong className="stat-value">{formatPrice(feasibility.headroom)}</strong>
                </div>
              ) : (
                <div className="feasibility-stat-item text-danger">
                  <span className="stat-label">Shortfall:</span>
                  <strong className="stat-value">{formatPrice(feasibility.shortfall)}</strong>
                </div>
              )}
            </div>

            {/* REALISTIC ALTERNATIVES IF BUDGET INSUFFICIENT */}
            {!feasibility.isFeasible && feasibility.alternatives && feasibility.alternatives.length > 0 && (
              <div className="feasibility-alternatives-box">
                <div className="alternatives-header">
                  <i className="fa-solid fa-lightbulb text-warning"></i>
                  <h5>Realistic Alternatives to Satisfy Target:</h5>
                </div>
                <div className="alternatives-list">
                  {feasibility.alternatives.map((alt, idx) => (
                    <div key={idx} className="alternative-card">
                      <div className="alt-content">
                        <strong>{alt.title}</strong>
                        <p>{alt.desc}</p>
                      </div>
                      {alt.id === 'lower_target_1080p' && targetLevel !== '1080p' && (
                        <button
                          type="button"
                          className="btn btn-outline btn-xs btn-apply-alt"
                          onClick={() => setTargetLevel('1080p')}
                        >
                          Switch to 1080p
                        </button>
                      )}
                      {alt.id === 'lower_resolution_1440p' && targetLevel === '4k' && (
                        <button
                          type="button"
                          className="btn btn-outline btn-xs btn-apply-alt"
                          onClick={() => setTargetLevel('1440p')}
                        >
                          Switch to 1440p
                        </button>
                      )}
                      {alt.id === 'change_game' && (
                        <button
                          type="button"
                          className="btn btn-outline btn-xs btn-apply-alt"
                          onClick={() => setActiveGameId('valorant')}
                        >
                          View Valorant
                        </button>
                      )}
                      {alt.id === 'increase_budget' && (
                        <button
                          type="button"
                          className="btn btn-primary btn-xs btn-apply-alt"
                          onClick={() => handleSelectPresetBudget(feasibility.minimumCost)}
                        >
                          Set to {formatPrice(feasibility.minimumCost)}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* GENERATION INLINE ERROR BANNER */}
          {generationError && (
            <div className="generation-error-alert">
              <i className="fa-solid fa-ban text-danger"></i>
              <div>
                <strong>Build Generation Blocked:</strong> {generationError}
              </div>
            </div>
          )}

          {/* OFFICIAL PUBLISHER SPECIFICATIONS VS CURRENT BUILD */}
          <div className="specs-comparison-grid">
            {/* MINIMUM REQUIREMENTS */}
            <div className="spec-tier-box minimum">
              <div className="tier-header">
                <i className="fa-solid fa-shield"></i>
                <h5>Publisher Minimum</h5>
              </div>
              <ul className="tier-specs-list">
                <li><strong>CPU:</strong> {activeGame.minimum.cpu} ({activeGame.minimum.cores}+ Cores)</li>
                <li><strong>GPU:</strong> {activeGame.minimum.gpu} ({activeGame.minimum.vramGB}GB VRAM)</li>
                <li><strong>RAM:</strong> {activeGame.minimum.ramGB}GB Memory</li>
                <li><strong>Storage:</strong> {activeGame.minimum.storageGB}GB {activeGame.minimum.requiresSsd ? '(SSD Required)' : 'HDD/SSD'}</li>
              </ul>
            </div>

            {/* RECOMMENDED REQUIREMENTS */}
            <div className="spec-tier-box recommended">
              <div className="tier-header">
                <i className="fa-solid fa-trophy"></i>
                <h5>Publisher Recommended ({targetLevel.toUpperCase()})</h5>
              </div>
              <ul className="tier-specs-list">
                <li><strong>CPU:</strong> {activeGame.recommended.cpu} ({activeGame.recommended.cores}+ Cores)</li>
                <li><strong>GPU:</strong> {activeGame.recommended.gpu} ({activeGame.recommended.vramGB}GB VRAM)</li>
                <li><strong>RAM:</strong> {activeGame.recommended.ramGB}GB High-Speed RAM</li>
                <li><strong>Storage:</strong> {activeGame.recommended.storageGB}GB NVMe High-Speed SSD</li>
              </ul>
            </div>

            {/* CURRENT BUILD STATUS */}
            <div className="spec-tier-box current-build">
              <div className="tier-header">
                <i className="fa-solid fa-microchip"></i>
                <h5>Your Current Build Verification</h5>
              </div>
              {evaluation && (
                <ul className="current-build-checks-list">
                  {evaluation.checks.map((c, i) => (
                    <li key={i} className={`check-line ${c.status}`}>
                      <i className={`fa-solid ${c.status === 'recommended' ? 'fa-check text-success' : c.status === 'minimum' ? 'fa-info-circle text-warning' : 'fa-xmark text-danger'}`}></i>
                      <span><strong>{c.item}:</strong> {c.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ACTION: ONE-CLICK GENERATE RIG FOR THIS GAME */}
          <div className="benchmark-actions-row">
            <button
              type="button"
              className={`btn btn-primary btn-auto-build-game ${!feasibility.isFeasible ? 'btn-disabled-visual' : ''}`}
              onClick={handleAssembleClick}
              title={
                feasibility.isFeasible
                  ? `Auto-assemble optimal build for ${activeGame.name} within ${formatPrice(localBudget)}`
                  : `Budget is insufficient by ${formatPrice(feasibility.shortfall)}. Please adjust budget or target level.`
              }
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i> Auto-Assemble for Game
            </button>
            <span className="auto-build-hint">
              {feasibility.isFeasible
                ? `Engine will configure a 100% compatible rig within your ${formatPrice(localBudget)} budget targeting ${targetLevel.toUpperCase()} performance.`
                : `Budget shortfall of ${formatPrice(feasibility.shortfall)}. We will not silently exceed your budget.`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
