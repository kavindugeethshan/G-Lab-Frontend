import React, { useState } from 'react';
import { calculateBudgetStatus, DEFAULT_BUDGET_PRESETS } from '../utils/budget';

export default function BudgetPanel({ selectedParts, targetBudget, onBudgetChange }) {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [customInputValue, setCustomInputValue] = useState(targetBudget ? String(targetBudget) : '');
  const [showBreakdown, setShowBreakdown] = useState(false);

  const budgetStatus = calculateBudgetStatus(selectedParts, targetBudget);
  const { currentTotal, remaining, isOverBudget, overAmount, percentUsed, items } = budgetStatus;

  const formatPrice = (val) => {
    if (typeof val !== 'number') return 'Rs. 0';
    return `Rs. ${val.toLocaleString()}`;
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const num = Number(customInputValue.replace(/[^0-9]/g, '')) || 0;
    onBudgetChange(num);
    setIsEditingBudget(false);
  };

  return (
    <div className="budget-tracker-card">
      <div className="budget-card-header">
        <div className="budget-title-row">
          <span className="budget-header-icon">
            <i className="fa-solid fa-wallet"></i>
          </span>
          <div>
            <h4>Budget Tracker</h4>
            <span className="budget-subtitle">Real-time expenditure & allocations</span>
          </div>
        </div>

        <button
          type="button"
          className="btn-toggle-breakdown"
          onClick={() => setShowBreakdown(!showBreakdown)}
          title="Toggle component cost breakdown"
        >
          <i className={`fa-solid ${showBreakdown ? 'fa-chevron-up' : 'fa-list-ul'}`}></i>
          <span>{showBreakdown ? 'Hide Cost' : 'Cost Breakdown'}</span>
        </button>
      </div>

      {/* 2-ROW RESPONSIVE SUMMARY METRICS */}
      <div className="budget-metrics-grid budget-metrics-3col">
        {/* 1. TARGET BUDGET */}
        <div className="budget-metric-block target-budget">
          <div className="target-budget-label-row">
            <span className="metric-label">Target Budget</span>
            {!isEditingBudget && (
              <button
                type="button"
                className="btn-edit-budget"
                onClick={() => setIsEditingBudget(true)}
                title="Edit custom target budget"
              >
                <i className="fa-solid fa-pencil"></i>
              </button>
            )}
          </div>
          {isEditingBudget ? (
            <form onSubmit={handleCustomSubmit} className="budget-input-form">
              <input
                type="number"
                min="0"
                step="5000"
                value={customInputValue}
                onChange={(e) => setCustomInputValue(e.target.value)}
                placeholder="Rs. Budget"
                autoFocus
              />
              <button type="submit" className="btn-save-budget" title="Save budget">
                <i className="fa-solid fa-check"></i>
              </button>
              <button
                type="button"
                className="btn-cancel-budget"
                onClick={() => setIsEditingBudget(false)}
                title="Cancel editing"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </form>
          ) : (
            <div className="budget-display-row" onClick={() => setIsEditingBudget(true)} title="Click to edit budget">
              <strong className="metric-value">
                {targetBudget > 0 ? formatPrice(targetBudget) : 'No limit'}
              </strong>
            </div>
          )}
          <span className="metric-hint">
            {targetBudget > 0 ? 'Click to change' : 'Set limit below'}
          </span>
        </div>

        {/* 2. CURRENT BUILD */}
        <div className="budget-metric-block current-total">
          <span className="metric-label">Current Build</span>
          <strong className="metric-value">{formatPrice(currentTotal)}</strong>
          <span className="metric-hint">{items.length} of 9 components</span>
        </div>

        {/* 3. REMAINING / OVER (RESPONSIVE FULL-WIDTH HERO BLOCK) */}
        <div className={`budget-metric-block ${isOverBudget ? 'over-budget-block' : 'remaining-budget-block'}`}>
          <div className="remaining-block-header">
            <span className="metric-label">
              <i className={`fa-solid ${isOverBudget ? 'fa-triangle-exclamation' : 'fa-circle-check'}`}></i>
              {isOverBudget ? 'Over Budget' : 'Remaining Budget'}
            </span>
            <span className={`remaining-status-pill ${isOverBudget ? 'pill-over' : 'pill-healthy'}`}>
              {targetBudget > 0
                ? isOverBudget
                  ? 'Exceeds Cap'
                  : `${100 - percentUsed}% Left`
                : 'No Cap'}
            </span>
          </div>
          <strong className={`metric-value ${isOverBudget ? 'text-danger' : 'text-success'}`}>
            {targetBudget > 0
              ? isOverBudget
                ? `-${formatPrice(overAmount)}`
                : formatPrice(remaining)
              : 'Unlimited'}
          </strong>
          <span className="metric-hint">
            {targetBudget > 0
              ? isOverBudget
                ? `Hardware exceeds target budget by ${formatPrice(overAmount)}`
                : `${formatPrice(remaining)} available for remaining components`
              : 'No budget limit defined'}
          </span>
        </div>
      </div>

      {/* WARNING ALERTS */}
      {targetBudget > 0 && isOverBudget && (
        <div className="budget-alert-banner alert-danger">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <div>
            <strong>Budget Exceeded:</strong> Current hardware exceeds your target by{' '}
            <span>{formatPrice(overAmount)}</span>. Consider replacing high-cost parts.
          </div>
        </div>
      )}

      {targetBudget > 0 && !isOverBudget && percentUsed >= 90 && items.length < 6 && (
        <div className="budget-alert-banner alert-warning">
          <i className="fa-solid fa-circle-exclamation"></i>
          <div>
            <strong>Heavy Budget Consumption:</strong> {percentUsed}% of budget is already used with only {items.length} parts installed. Ensure enough funds remain for essential components.
          </div>
        </div>
      )}

      {/* PROGRESS BAR */}
      {targetBudget > 0 && (
        <div className="budget-progress-container">
          <div className="budget-progress-track">
            <div
              className={`budget-progress-fill ${isOverBudget ? 'over-budget' : percentUsed > 85 ? 'near-budget' : 'healthy-budget'}`}
              style={{ width: `${Math.min(percentUsed, 100)}%` }}
            ></div>
          </div>
          <div className="budget-progress-labels">
            <span>{percentUsed}% Utilized</span>
            {isOverBudget ? (
              <span className="text-danger font-semibold">
                <i className="fa-solid fa-circle-exclamation"></i> Over Budget by {formatPrice(overAmount)}
              </span>
            ) : (
              <span className="text-muted">{formatPrice(remaining)} Remaining</span>
            )}
          </div>
        </div>
      )}

      {/* PRESET TARGET BUTTONS */}
      <div className="budget-presets-row">
        <div className="presets-header-row">
          <span className="presets-label">
            <i className="fa-solid fa-sliders"></i> Preset Targets
          </span>
          {targetBudget > 0 && (
            <button
              type="button"
              className="btn-clear-preset"
              onClick={() => {
                onBudgetChange(0);
                setCustomInputValue('');
              }}
              title="Clear budget limit"
            >
              <i className="fa-solid fa-rotate-left"></i> Clear Limit
            </button>
          )}
        </div>
        <div className="presets-buttons">
          {DEFAULT_BUDGET_PRESETS.map((preset) => {
            const isSelected = targetBudget === preset.value;
            const shortTitle = preset.label.replace(' Gaming', '').replace(' Enthusiast', '');
            const priceTag = preset.value >= 1000000 ? `${preset.value / 1000000}M` : `${preset.value / 1000}k`;
            return (
              <button
                key={preset.label}
                type="button"
                className={`btn-budget-preset ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  onBudgetChange(preset.value);
                  setCustomInputValue(String(preset.value));
                }}
                title={`Set target budget to ${formatPrice(preset.value)} (${preset.label})`}
              >
                <span className="preset-name">{shortTitle}</span>
                <span className="preset-chip-val">{priceTag}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* EXPANDABLE COST BREAKDOWN */}
      {showBreakdown && (
        <div className="budget-breakdown-table">
          <div className="breakdown-header">
            <span>Slot</span>
            <span>Component</span>
            <span>Cost</span>
          </div>
          {items.length === 0 ? (
            <div className="breakdown-empty">No components installed yet</div>
          ) : (
            items.map((item) => (
              <div key={item.slot} className="breakdown-row">
                <span className="breakdown-slot">{item.slot.toUpperCase()}</span>
                <span className="breakdown-name" title={item.name}>{item.name}</span>
                <span className="breakdown-price">{formatPrice(item.price)}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
