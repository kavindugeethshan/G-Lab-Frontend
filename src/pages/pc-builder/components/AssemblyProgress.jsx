import React, { useMemo } from 'react';
import { validateBuildCompatibility } from '../utils/compatibility';

export const ASSEMBLY_STEPS = [
  { id: 'pcCase', label: '1. Case', shortLabel: 'Case', icon: 'fa-solid fa-server', categoryKey: 'PC Cases' },
  { id: 'motherboard', label: '2. Motherboard', shortLabel: 'Motherboard', icon: 'fa-solid fa-network-wired', categoryKey: 'Motherboards' },
  { id: 'cpu', label: '3. CPU', shortLabel: 'CPU', icon: 'fa-solid fa-microchip', categoryKey: 'Processors' },
  { id: 'cooler', label: '4. CPU Cooler', shortLabel: 'Cooler', icon: 'fa-solid fa-fan', categoryKey: 'Coolers' },
  { id: 'ram', label: '5. Memory (RAM)', shortLabel: 'RAM', icon: 'fa-solid fa-memory', categoryKey: 'RAM' },
  { id: 'gpu', label: '6. Graphics (GPU)', shortLabel: 'GPU', icon: 'fa-solid fa-gamepad', categoryKey: 'Graphic Cards' },
  { id: 'storage', label: '7. Storage (SSD)', shortLabel: 'Storage', icon: 'fa-solid fa-hard-drive', categoryKey: 'Storage' },
  { id: 'psu', label: '8. Power Supply', shortLabel: 'PSU', icon: 'fa-solid fa-plug', categoryKey: 'Power Supply' },
  { id: 'fans', label: '9. Cooling Fans', shortLabel: 'Fans', icon: 'fa-solid fa-wind', categoryKey: 'Fans' },
  { id: 'review', label: '10. Final Review', shortLabel: 'Review', icon: 'fa-solid fa-clipboard-check', categoryKey: null },
];

export default function AssemblyProgress({ currentStepIndex, onSelectStep, selectedParts = {} }) {
  const validation = useMemo(() => validateBuildCompatibility(selectedParts), [selectedParts]);

  // Identify slots with direct incompatibility
  const incompatibleSlots = useMemo(() => {
    const slots = new Set();
    const checks = validation.checks || [];
    checks.forEach((c) => {
      if (c.status === 'incompatible') {
        if (c.id === 'cpu-mobo') {
          slots.add('cpu');
          slots.add('motherboard');
        } else if (c.id === 'ram-mobo') {
          slots.add('ram');
        } else if (c.id === 'gpu-case') {
          slots.add('gpu');
        } else if (c.id === 'cooler-case' || c.id === 'cpu-cooling') {
          slots.add('cooler');
        } else if (c.id === 'mobo-case') {
          slots.add('motherboard');
        } else if (c.id === 'psu-power') {
          slots.add('psu');
        }
      }
    });
    return slots;
  }, [validation]);

  const installedPartsCount = Object.keys(selectedParts).filter((k) => k !== 'review' && selectedParts[k]).length;
  const totalHardwareSteps = ASSEMBLY_STEPS.length - 1; // excluding review

  return (
    <div className="assembly-progress-container">
      <div className="assembly-progress-header">
        <div className="progress-tally">
          <span className="tally-count">
            <strong>{installedPartsCount}</strong> / {totalHardwareSteps} Hardware Components Installed
          </span>
          <span className="tally-percentage">
            {Math.round((installedPartsCount / totalHardwareSteps) * 100)}% Complete
          </span>
        </div>
        <div className="progress-legend">
          <span className="legend-item"><i className="legend-sym check">✓</i> Completed</span>
          <span className="legend-item"><i className="legend-sym arrow">→</i> Current</span>
          <span className="legend-item"><i className="legend-sym pending">○</i> Pending</span>
          <span className="legend-item"><i className="legend-sym error">✗</i> Incompatible</span>
        </div>
      </div>

      <div className="assembly-progress-bar">
        {ASSEMBLY_STEPS.map((step, idx) => {
          const isSelected = !!selectedParts[step.id];
          const isCurrent = idx === currentStepIndex;
          const isReview = step.id === 'review';
          const isIncompatible = incompatibleSlots.has(step.id);

          let stepState = 'pending';
          let stateSymbol = '○';

          if (isIncompatible) {
            stepState = 'error';
            stateSymbol = '✗';
          } else if (isCurrent) {
            stepState = 'current';
            stateSymbol = '→';
          } else if (isSelected || (isReview && installedPartsCount === totalHardwareSteps)) {
            stepState = 'completed';
            stateSymbol = '✓';
          }

          return (
            <button
              key={step.id}
              type="button"
              className={`assembly-step-pill state-${stepState} ${isCurrent ? 'is-current' : ''}`}
              onClick={() => onSelectStep(idx)}
              title={`${step.label}: ${stepState.toUpperCase()} ${isSelected ? `(${selectedParts[step.id]?.name})` : ''}`}
            >
              <span className={`step-symbol state-${stepState}`}>{stateSymbol}</span>
              <span className="step-name">{step.shortLabel}</span>
              {isSelected && selectedParts[step.id] && (
                <span className="step-part-badge" title={selectedParts[step.id]?.name}>
                  {selectedParts[step.id]?.brand || selectedParts[step.id]?.name?.split(' ')[0] || 'OK'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
