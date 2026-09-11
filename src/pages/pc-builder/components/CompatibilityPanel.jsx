import React from 'react';
import { validateBuildCompatibility } from '../utils/compatibility';

export default function CompatibilityPanel({ selectedParts }) {
  const validation = validateBuildCompatibility(selectedParts);
  const { categories, overallStatus, isCompatible: _isCompatible, powerAnalysis } = validation;
  const { estimatedPower, recommendedPsuWattage, hasIncompletePowerData } = powerAnalysis;

  const installedCount = Object.values(selectedParts).filter(Boolean).length;
  const installedPsu = selectedParts.psu;
  const psuWattage = installedPsu?.wattage || 0;

  // Calculate PSU utilization percentage if PSU is chosen
  const psuUtilization = psuWattage > 0 ? Math.min(Math.round((estimatedPower / psuWattage) * 100), 100) : 0;

  return (
    <div className="compatibility-panel-card horizontal-console-view">
      {/* TOP COMMAND STRIP: TITLE + REAL-TIME POWER HUD + OVERALL BADGE */}
      <div className="compat-horizontal-command-strip">
        <div className="compat-title-row">
          <span className="compat-header-icon">
            <i className="fa-solid fa-microchip"></i>
          </span>
          <div className="compat-header-text">
            <div className="compat-title-badge-wrap">
              <h4>Compatibility Diagnostics</h4>
              <span className="compat-live-pill">
                <span className="live-dot"></span> Real-Time Interoperability
              </span>
            </div>
            <span className="compat-subtitle">Deterministic Hardware Interoperability</span>
          </div>
        </div>

        {/* SYSTEM POWER ESTIMATOR BAR IN TOP COMMAND STRIP */}
        <div className="power-estimator-section horizontal-hud">
          <div className="power-hud-top">
            <div className="power-metrics-header">
              <span className="metric-label">
                <i className="fa-solid fa-bolt text-warning"></i> System Load:
              </span>
              <strong className="metric-val">{estimatedPower}W</strong>
            </div>
            <div className="power-submetrics-compact">
              <span>Target PSU: <strong>{recommendedPsuWattage}W+</strong> (25% safety margin)</span>
              {psuWattage > 0 ? (
                <span>Installed PSU: <strong>{psuWattage}W</strong> ({psuUtilization}% Load)</span>
              ) : (
                <span className="text-muted">No PSU selected</span>
              )}
            </div>
          </div>

          <div className="power-gauge-track">
            <div
              className={`power-gauge-fill ${
                psuWattage > 0 && estimatedPower > psuWattage
                  ? 'overload'
                  : psuUtilization > 85
                  ? 'high'
                  : 'normal'
              }`}
              style={{
                width: `${
                  psuWattage > 0
                    ? psuUtilization
                    : Math.min(Math.round((estimatedPower / (recommendedPsuWattage || 500)) * 100), 100)
                }%`,
              }}
            ></div>
          </div>

          {hasIncompletePowerData && (
            <div className="unverified-power-note">
              <i className="fa-solid fa-info-circle"></i> Estimated baseline TDP.
            </div>
          )}
        </div>

        {/* OVERALL STATUS BADGE */}
        <div className="overall-badge-wrapper">
          {installedCount === 0 ? (
            <span className="overall-badge waiting">
              <i className="fa-solid fa-hourglass-start"></i> Awaiting Parts
            </span>
          ) : overallStatus === 'incompatible' ? (
            <span className="overall-badge error">
              <i className="fa-solid fa-triangle-exclamation"></i> Issues Detected
            </span>
          ) : overallStatus === 'warning' ? (
            <span className="overall-badge warning">
              <i className="fa-solid fa-circle-exclamation"></i> Warnings Found
            </span>
          ) : overallStatus === 'unverified' ? (
            <span className="overall-badge unverified">
              <i className="fa-solid fa-circle-question"></i> Specs Unverified
            </span>
          ) : (
            <span className="overall-badge success">
              <i className="fa-solid fa-circle-check"></i> 100% Compatible
            </span>
          )}
        </div>
      </div>

      {/* 4 DIAGNOSTIC CATEGORIES LAID OUT ALONG THE HORIZONTAL AXIS */}
      <div className="compat-categories-container horizontal-axis-grid">
        {categories &&
          Object.values(categories).map((cat) => {
            const categoryChecks = cat.checks || [];

            return (
              <div key={cat.id} className={`compat-category-block status-${cat.status}`}>
                <div className="compat-category-header">
                  <div className="category-title-group">
                    <span className="cat-icon-badge">
                      <i className={cat.icon}></i>
                    </span>
                    <h5>{cat.title}</h5>
                  </div>
                  <span className={`category-status-pill ${cat.status}`}>
                    {cat.status === 'compatible' && '✓ Compatible'}
                    {cat.status === 'incompatible' && '✗ Incompatible'}
                    {cat.status === 'warning' && '⚠ Warning'}
                    {cat.status === 'unverified' && '⚠ Unverified'}
                    {cat.status === 'pending' && '○ Pending'}
                  </span>
                </div>

                <div className="category-checks-list">
                  {categoryChecks.map((check) => {
                    let statusBadgeText = '✓ Compatible';
                    let statusClass = 'check-item-success';
                    let statusBadgeClass = 'compatible';

                    if (check.status === 'incompatible') {
                      statusBadgeText = '✗ Incompatible';
                      statusClass = 'check-item-danger';
                      statusBadgeClass = 'incompatible';
                    } else if (check.status === 'unverified') {
                      statusBadgeText = '⚠ Cannot be fully verified';
                      statusClass = 'check-item-unverified';
                      statusBadgeClass = 'unverified';
                    } else if (check.status === 'warning') {
                      statusBadgeText = '⚠ Warning';
                      statusClass = 'check-item-warning';
                      statusBadgeClass = 'warning';
                    } else if (check.status === 'pending') {
                      statusBadgeText = '— Pending Selection';
                      statusClass = 'check-item-pending';
                      statusBadgeClass = 'pending';
                    }

                    return (
                      <div key={check.id} className={`compat-check-item ${statusClass}`}>
                        <div className="check-item-header">
                          <strong className="check-item-title">{check.title}</strong>
                          <span className={`status-pill ${statusBadgeClass}`}>{statusBadgeText}</span>
                        </div>
                        <p className="check-item-message">{check.message}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
