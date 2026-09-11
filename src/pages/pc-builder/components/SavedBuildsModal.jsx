import React, { useState, useEffect } from 'react';
import { getSavedBuilds, saveBuildToStorage, deleteSavedBuild } from '../utils/pcBuilderStorage';

export default function SavedBuildsModal({
  currentParts,
  targetBudget,
  onLoadBuild,
  onClose,
  showToast,
}) {
  const [savedBuilds, setSavedBuilds] = useState([]);
  const [newBuildName, setNewBuildName] = useState('');

  useEffect(() => {
    setSavedBuilds(getSavedBuilds());
  }, []);

  const formatPrice = (val) => {
    if (typeof val !== 'number') return 'Rs. 0';
    return `Rs. ${val.toLocaleString()}`;
  };

  const handleSaveCurrent = (e) => {
    e.preventDefault();
    const installedCount = Object.values(currentParts).filter(Boolean).length;
    if (installedCount === 0) {
      showToast('Cannot save an empty build. Install components first!', 'error');
      return;
    }

    const saved = saveBuildToStorage(newBuildName, currentParts, targetBudget);
    setSavedBuilds(getSavedBuilds());
    setNewBuildName('');
    showToast(`Build "${saved.name}" saved to your local library!`, 'success');
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete saved build "${name}"?`)) {
      const updated = deleteSavedBuild(id);
      setSavedBuilds(updated);
      showToast(`Deleted build "${name}".`, 'info');
    }
  };

  const handleLoad = (build) => {
    onLoadBuild(build.parts, build.targetBudget);
    showToast(`Loaded build "${build.name}"!`, 'success');
    onClose();
  };

  return (
    <div className="modal-backdrop-blur">
      <div className="saved-builds-modal-card">
        <div className="modal-card-header">
          <div className="title-with-icon">
            <span className="saved-modal-badge">
              <i className="fa-solid fa-bookmark"></i>
            </span>
            <div>
              <h3>Saved Builds Library</h3>
              <p className="modal-subtitle">Save multiple PC configurations or reload a previously assembled custom rig.</p>
            </div>
          </div>
          <button type="button" className="btn-close-modal" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="modal-card-body">
          {/* SAVE CURRENT BUILD FORM */}
          <form onSubmit={handleSaveCurrent} className="save-current-build-form">
            <div className="save-form-input-row">
              <input
                type="text"
                placeholder="Name your build (e.g. Cyberpunk 4K Beast, Esports Speedster)..."
                value={newBuildName}
                onChange={(e) => setNewBuildName(e.target.value)}
                maxLength={45}
              />
              <button type="submit" className="btn btn-primary">
                <i className="fa-solid fa-floppy-disk"></i> Save Current Rig
              </button>
            </div>
          </form>

          {/* LIST OF SAVED BUILDS */}
          <div className="saved-builds-list">
            {savedBuilds.length === 0 ? (
              <div className="empty-saved-builds">
                <i className="fa-solid fa-folder-open"></i>
                <p>No saved builds found yet. Save your current hardware configuration above!</p>
              </div>
            ) : (
              savedBuilds.map((b) => {
                const parts = b.parts || {};
                const partsCount = Object.values(parts).filter(Boolean).length;
                const cpuName = parts.cpu?.name;
                const gpuName = parts.gpu?.name;
                const ramName = parts.ram?.name;
                const moboName = parts.motherboard?.name;

                return (
                  <div key={b.id} className="saved-build-row">
                    <div className="build-info-col">
                      <div className="build-title-row">
                        <h4 className="build-name" title={b.name}>{b.name}</h4>
                        <span className="build-date-tag">
                          <i className="fa-solid fa-calendar-day"></i> {new Date(b.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="build-meta">
                        <span className="build-count-badge">{partsCount} components</span>
                        <span>•</span>
                        <strong className="text-accent build-price-tag">{formatPrice(b.totalPrice)}</strong>
                        {b.targetBudget > 0 && (
                          <span className="build-budget-tag">Budget: {formatPrice(b.targetBudget)}</span>
                        )}
                      </div>

                      {/* MAIN COMPONENTS CHIPS */}
                      <div className="saved-build-components-chips">
                        {cpuName && (
                          <span className="saved-part-chip" title={`CPU: ${cpuName}`}>
                            <i className="fa-solid fa-microchip"></i> {cpuName}
                          </span>
                        )}
                        {gpuName && (
                          <span className="saved-part-chip" title={`GPU: ${gpuName}`}>
                            <i className="fa-solid fa-tv"></i> {gpuName}
                          </span>
                        )}
                        {ramName && (
                          <span className="saved-part-chip" title={`RAM: ${ramName}`}>
                            <i className="fa-solid fa-memory"></i> {ramName}
                          </span>
                        )}
                        {moboName && (
                          <span className="saved-part-chip" title={`Motherboard: ${moboName}`}>
                            <i className="fa-solid fa-border-all"></i> {moboName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="build-actions-col">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm btn-load-saved-rig"
                        onClick={() => handleLoad(b)}
                        title="Load this build into the workspace"
                      >
                        <i className="fa-solid fa-arrow-right-to-bracket"></i> Load Rig
                      </button>
                      <button
                        type="button"
                        className="btn-delete-saved"
                        onClick={() => handleDelete(b.id, b.name)}
                        title="Delete build"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
