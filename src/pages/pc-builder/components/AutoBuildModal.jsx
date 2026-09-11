import React, { useState } from 'react';
import { generateAutoBuild } from '../utils/recommendations';

export default function AutoBuildModal({
  allProducts,
  initialBudget,
  onApplyBuild,
  onClose,
}) {
  const [budget, setBudget] = useState(initialBudget || 350000);
  const [purpose, setPurpose] = useState('aaa_gaming');
  const [preferredCpu, setPreferredCpu] = useState('all');
  const [preferredGpu, setPreferredGpu] = useState('all');
  const [isAssembling, setIsAssembling] = useState(false);
  const [assemblyStepText, setAssemblyStepText] = useState('');
  const [previewResult, setPreviewResult] = useState(null);

  const formatPrice = (val) => {
    if (typeof val !== 'number') return 'Rs. 0';
    return `Rs. ${val.toLocaleString()}`;
  };

  const handleGenerate = () => {
    setIsAssembling(true);
    setAssemblyStepText('Analyzing component catalog & stock levels...');

    setTimeout(() => {
      setAssemblyStepText('Matching CPU socket & Motherboard form factor...');
    }, 400);

    setTimeout(() => {
      setAssemblyStepText('Verifying GPU chassis clearance & power supply headroom...');
    }, 800);

    setTimeout(() => {
      const result = generateAutoBuild({
        allProducts,
        targetBudget: budget,
        purpose,
        preferredCpuBrand: preferredCpu,
        preferredGpuBrand: preferredGpu,
      });

      setPreviewResult(result);
      setIsAssembling(false);
      setAssemblyStepText('');
    }, 1200);
  };

  const handleConfirmApply = () => {
    if (previewResult && previewResult.build) {
      onApplyBuild(previewResult.build, budget);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop-blur">
      <div className="auto-build-modal-card">
        {/* MODAL HEADER */}
        <div className="modal-card-header">
          <div className="title-with-icon">
            <span className="auto-modal-badge">
              <i className="fa-solid fa-wand-magic-sparkles"></i>
            </span>
            <div>
              <h3>Algorithmic Auto-Build Generator</h3>
              <p className="modal-subtitle">
                G-Lab's mathematical optimization engine calculates 100% compatible component configurations tailored to your budget and performance requirements.
              </p>
            </div>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="modal-card-body">
          {/* BUDGET SLIDER & QUICK PRESETS */}
          <div className="generator-control-group">
            <div className="control-label-row">
              <label>Target Budget Limit:</label>
              <strong className="budget-highlight">{formatPrice(budget)}</strong>
            </div>
            <input
              type="range"
              min="150000"
              max="800000"
              step="10000"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="budget-range-slider"
            />
            <div className="modal-budget-presets">
              {[150000, 250000, 350000, 500000, 700000].map((val) => (
                <button
                  key={val}
                  type="button"
                  className={`btn-budget-chip ${budget === val ? 'active' : ''}`}
                  onClick={() => setBudget(val)}
                >
                  {val / 1000}k
                </button>
              ))}
            </div>
          </div>

          {/* INTENDED USAGE */}
          <div className="generator-control-group">
            <label className="section-label">Primary Rig Purpose:</label>
            <div className="purpose-options-grid">
              {[
                { id: 'esports', label: 'Esports Gaming', desc: 'Maximum 1080p FPS (Valorant, CS2, Fortnite)', icon: 'fa-solid fa-crosshairs' },
                { id: 'aaa_gaming', label: '1440p / 4K AAA Gaming', desc: 'Ultra textures & ray tracing (Cyberpunk, GTA, RDR2)', icon: 'fa-solid fa-gamepad' },
                { id: 'workstation', label: 'Content Creation & Studio', desc: 'Heavy multitasking, 3D rendering, high core count', icon: 'fa-solid fa-video' },
                { id: 'budget', label: 'Value Price/Performance', desc: 'Balanced high efficiency without overspending', icon: 'fa-solid fa-scale-balanced' },
              ].map((item) => (
                <div
                  key={item.id}
                  className={`purpose-tile ${purpose === item.id ? 'active' : ''}`}
                  onClick={() => setPurpose(item.id)}
                >
                  <i className={item.icon}></i>
                  <div>
                    <strong>{item.label}</strong>
                    <span>{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BRAND PREFERENCES */}
          <div className="generator-dual-row">
            <div className="generator-control-group">
              <label className="section-label">Processor Preference:</label>
              <div className="pill-toggle-row">
                {['all', 'amd', 'intel'].map((b) => (
                  <button
                    key={b}
                    type="button"
                    className={`pill-toggle-btn ${preferredCpu === b ? 'active' : ''}`}
                    onClick={() => setPreferredCpu(b)}
                  >
                    {b === 'all' ? 'Any Brand' : b.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="generator-control-group">
              <label className="section-label">Graphics Preference:</label>
              <div className="pill-toggle-row">
                {['all', 'nvidia', 'amd'].map((b) => (
                  <button
                    key={b}
                    type="button"
                    className={`pill-toggle-btn ${preferredGpu === b ? 'active' : ''}`}
                    onClick={() => setPreferredGpu(b)}
                  >
                    {b === 'all' ? 'Any Brand' : b === 'nvidia' ? 'NVIDIA RTX' : 'AMD Radeon'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* GENERATE BUTTON */}
          <div className="generator-submit-row">
            <button
              type="button"
              className="btn btn-primary btn-run-generator"
              onClick={handleGenerate}
              disabled={isAssembling}
            >
              {isAssembling ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i> {assemblyStepText}
                </>
              ) : (
                <>
                  <i className="fa-solid fa-wand-magic-sparkles"></i> Calculate Optimal Configuration
                </>
              )}
            </button>
          </div>

          {/* PREVIEW OF GENERATED RIG OR INSUFFICIENT BUDGET ALERT */}
          {previewResult && previewResult.status === 'insufficient_budget' && (
            <div className="auto-build-insufficient-alert">
              <div className="insufficient-header">
                <div className="insufficient-icon">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                </div>
                <div>
                  <h4 className="text-danger font-bold">Target Budget Insufficient for In-Stock Parts</h4>
                  <p className="insufficient-expl">{previewResult.explanation}</p>
                </div>
              </div>

              <div className="insufficient-metrics-grid">
                <div className="insufficient-metric">
                  <span className="metric-label">Your Budget</span>
                  <span className="metric-val">{formatPrice(previewResult.userBudget)}</span>
                </div>
                <div className="insufficient-metric">
                  <span className="metric-label">Minimum Required</span>
                  <span className="metric-val text-accent">{formatPrice(previewResult.minimumRequiredBudget)}</span>
                </div>
                <div className="insufficient-metric highlight-shortfall">
                  <span className="metric-label">Budget Shortfall</span>
                  <span className="metric-val text-danger">-{formatPrice(previewResult.shortfall)}</span>
                </div>
              </div>

              {previewResult.alternatives && previewResult.alternatives.length > 0 && (
                <div className="insufficient-alternatives">
                  <span className="alternatives-title">Practical Alternatives:</span>
                  <div className="alternatives-list">
                    {previewResult.alternatives.map((alt, idx) => (
                      <div key={idx} className="alternative-card">
                        <div>
                          <strong>{alt.title}</strong>
                          <p>{alt.desc}</p>
                        </div>
                        {idx === 0 && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setBudget(previewResult.minimumRequiredBudget);
                            }}
                          >
                            Set Budget to {formatPrice(previewResult.minimumRequiredBudget)}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SUCCESSFUL PREVIEW OF GENERATED RIG */}
          {previewResult && previewResult.status === 'success' && previewResult.build && (
            <div className="auto-build-preview-result">
              <div className="preview-header">
                <div>
                  <span className="text-success font-bold">
                    <i className="fa-solid fa-circle-check"></i> 100% Compatible Rig Formulated
                  </span>
                  <h4>Calculated Total: {formatPrice(previewResult.totalCost)}</h4>
                </div>
              </div>

              <div className="preview-components-grid">
                {Object.entries(previewResult.build).map(([slot, part]) => {
                  if (!part) return null;
                  return (
                    <div key={slot} className="preview-part-item">
                      <span className="part-slot-tag">{slot.toUpperCase()}</span>
                      <strong className="part-name">{part.name}</strong>
                      <span className="part-price">{formatPrice(part.price)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* MODAL STICKY FOOTER */}
        <div className="modal-card-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          {previewResult && previewResult.status === 'success' && previewResult.build ? (
            <button
              type="button"
              className="btn btn-primary btn-apply-auto-build"
              onClick={handleConfirmApply}
            >
              <i className="fa-solid fa-check-double"></i> Apply Rig to PC Builder
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={isAssembling}
            >
              {isAssembling ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i> Generating...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-wand-magic-sparkles"></i> Calculate Configuration
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
