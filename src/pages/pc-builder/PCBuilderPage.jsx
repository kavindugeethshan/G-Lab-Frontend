import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { productService } from '../../services/productService';
import AssemblyProgress, { ASSEMBLY_STEPS } from './components/AssemblyProgress';
import BuildVisualizer from './components/BuildVisualizer';
import ComponentSelector from './components/ComponentSelector';
import CompatibilityPanel from './components/CompatibilityPanel';
import BudgetPanel from './components/BudgetPanel';
import BuilderModeSelector from './components/BuilderModeSelector';
import GameSelector from './components/GameSelector';
import AutoBuildModal from './components/AutoBuildModal';
import SavedBuildsModal from './components/SavedBuildsModal';
import { generateBuildSpecSheet, encodeRigToQuery, decodeRigFromQuery, getSavedBuilds } from './utils/pcBuilderStorage';
import { generateAutoBuild } from './utils/recommendations';
import { calculateSystemPower, validateBuildCompatibility } from './utils/compatibility';
import { getProductSpecs } from './utils/hardwareSpecs';
import './PCBuilderPage.css';

const LOCAL_STORAGE_BUILD_KEY = 'glab_pc_builder_parts';
const LOCAL_STORAGE_BUDGET_KEY = 'glab_pc_builder_budget';

export default function PCBuilderPage() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  // Mode: 'manual' | 'auto' | 'game'
  const [activeMode, setActiveMode] = useState('manual');
  // Step index: 0 to 9
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  // Target budget in LKR
  const [targetBudget, setTargetBudget] = useState(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_BUDGET_KEY);
    return saved ? Number(saved) : 350000;
  });
  // Active mobile view tab: 'builder' | 'chassis' | 'diagnostics'
  const [mobileActiveTab, setMobileActiveTab] = useState('builder');
  // Power On state for interactive 2D chassis animation
  const [isPoweredOn, setIsPoweredOn] = useState(false);

  // Modals state
  const [isAutoModalOpen, setIsAutoModalOpen] = useState(false);
  const [isSavedBuildsModalOpen, setIsSavedBuildsModalOpen] = useState(false);
  const [savedBuildsCount, setSavedBuildsCount] = useState(0);

  useEffect(() => {
    setSavedBuildsCount(getSavedBuilds().length);
  }, [isSavedBuildsModalOpen]);

  // Global inventory products cache for recommendations
  const [catalogProducts, setCatalogProducts] = useState([]);

  // Selected components map
  const [selectedParts, setSelectedParts] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_BUILD_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Fetch full inventory once on mount for algorithmic recommendations
  useEffect(() => {
    let isMounted = true;
    const fetchCatalog = async () => {
      try {
        const res = await productService.getProducts({ limit: 1000 });
        if (isMounted && res.products) {
          setCatalogProducts(res.products);
        }
      } catch (err) {
        console.warn('Failed to prefetch inventory for auto-builder', err);
      }
    };
    fetchCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Restore rig from URL query string if present (?rig=...)
  useEffect(() => {
    if (catalogProducts.length === 0) return;
    const urlParams = new URLSearchParams(window.location.search);
    const rigQuery = urlParams.get('rig');
    if (!rigQuery) return;

    const decoded = decodeRigFromQuery(rigQuery);
    if (decoded && decoded.p) {
      const restored = {};
      Object.entries(decoded.p).forEach(([slot, partId]) => {
        const found = catalogProducts.find((p) => (p._id || p.id) === partId);
        if (found) {
          const specs = getProductSpecs(found);
          restored[slot] = { ...specs, ...found };
        }
      });

      if (Object.keys(restored).length > 0) {
        setSelectedParts(restored);
        if (decoded.b) setTargetBudget(Number(decoded.b));
        showToast('Shared PC build configuration loaded successfully!', 'success');
      }
    }
  }, [catalogProducts, showToast]);

  // Persist selections to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_BUILD_KEY, JSON.stringify(selectedParts));
    } catch (e) {
      console.warn('Failed to persist build to localStorage', e);
    }
  }, [selectedParts]);

  // Persist target budget
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_BUDGET_KEY, String(targetBudget));
    } catch (e) {
      console.warn('Failed to persist budget to localStorage', e);
    }
  }, [targetBudget]);

  // Install a part into a slot
  const handleSelectPart = useCallback((slotId, product) => {
    setSelectedParts((prev) => ({
      ...prev,
      [slotId]: product,
    }));
    showToast(`Installed ${product.name} in ${slotId.toUpperCase()} slot!`, 'success');
  }, [showToast]);

  // Remove a part from a slot
  const handleRemovePart = useCallback((slotId) => {
    setSelectedParts((prev) => {
      const updated = { ...prev };
      delete updated[slotId];
      return updated;
    });
    // Turn off power if critical part removed
    if (['cpu', 'motherboard', 'psu', 'ram'].includes(slotId)) {
      setIsPoweredOn(false);
    }
    showToast(`Removed component from ${slotId.toUpperCase()} slot.`, 'info');
  }, [showToast]);

  // Clear entire build
  const handleClearBuild = useCallback(() => {
    if (window.confirm('Are you sure you want to reset your current PC build? All selected components will be cleared.')) {
      setSelectedParts({});
      setIsPoweredOn(false);
      showToast('PC build reset successfully.', 'info');
    }
  }, [showToast]);

  // Jump to step by slot key (e.g. from 2D Chassis click)
  const handleSlotClick = useCallback((slotId) => {
    const stepIdx = ASSEMBLY_STEPS.findIndex((s) => s.id === slotId);
    if (stepIdx !== -1) {
      setCurrentStepIndex(stepIdx);
      setMobileActiveTab('builder');
    }
  }, []);

  // Step navigation
  const handleNextStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, ASSEMBLY_STEPS.length - 1));
  }, []);

  const handlePrevStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  // Toggle power on
  const handleTogglePower = useCallback(() => {
    setIsPoweredOn((prev) => !prev);
    if (!isPoweredOn) {
      showToast('System Powered On! RGB Lighting and cooling fans active.', 'success');
    } else {
      showToast('System Powered Down.', 'info');
    }
  }, [isPoweredOn, showToast]);

  // Handle Mode Change
  const handleModeChange = useCallback((mode) => {
    setActiveMode(mode);
    if (mode === 'auto') {
      setIsAutoModalOpen(true);
    }
  }, []);

  // Apply build generated from AutoBuildModal
  const handleApplyAutoBuild = useCallback((newBuild, newBudget) => {
    setSelectedParts(newBuild);
    if (newBudget) setTargetBudget(newBudget);
    setCurrentStepIndex(ASSEMBLY_STEPS.length - 1); // Jump to Final Review
    showToast('Auto-generated 100% compatible rig applied to your build!', 'success');
  }, [showToast]);

  // Apply build generated for a specific game
  const handleApplyGameBuild = useCallback((newBuild, newBudget, game) => {
    if (!newBuild) return;
    setSelectedParts(newBuild);
    if (newBudget) setTargetBudget(newBudget);
    setActiveMode('manual');
    setCurrentStepIndex(ASSEMBLY_STEPS.length - 1); // Jump to review
    showToast(`Optimized rig for ${game?.name || 'selected game'} assembled successfully!`, 'success');
  }, [showToast]);

  // Load a saved build from library
  const handleLoadSavedBuild = useCallback((loadedParts, loadedBudget) => {
    setSelectedParts(loadedParts || {});
    if (loadedBudget) setTargetBudget(loadedBudget);
    setIsPoweredOn(false);
  }, []);

  // Export Bill of Materials (BOM)
  const handleExportSpecSheet = useCallback(() => {
    const powerData = calculateSystemPower(selectedParts);
    const text = generateBuildSpecSheet(selectedParts, targetBudget, powerData);

    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
      showToast('Spec sheet copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Failed to copy to clipboard', 'error');
    });

    // Also download as text file
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `G-Lab_Custom_Rig_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }, [selectedParts, targetBudget, showToast]);

  // Share build link (/pc-builder?rig=...)
  const handleShareBuild = useCallback(() => {
    const rigQuery = encodeRigToQuery(selectedParts, targetBudget);
    const shareUrl = rigQuery
      ? `${window.location.origin}/pc-builder?rig=${rigQuery}`
      : `${window.location.origin}/pc-builder`;

    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast('Build link copied successfully.', 'success');
    }).catch(() => {
      showToast('Failed to copy build link to clipboard', 'error');
    });
  }, [selectedParts, targetBudget, showToast]);

  // Add all installed build parts to shopping cart (single consolidated toast)
  const handleAddAllToCart = useCallback(async () => {
    const installedList = Object.entries(selectedParts).filter(([_, part]) => !!part && (part._id || part.productId));
    if (installedList.length === 0) {
      showToast('No components installed in your build yet.', 'error');
      return;
    }

    let successCount = 0;
    for (const [_, part] of installedList) {
      const pId = part._id || part.productId;
      if (typeof pId === 'string' && (pId.startsWith('stock-') || pId.startsWith('chassis-'))) continue;

      const ok = await addToCart(pId, 1, true); // silent = true
      if (ok) successCount++;
    }

    if (successCount > 0) {
      showToast(`${successCount} components added to cart successfully.`, 'success');
    } else {
      showToast('Unable to add components to cart.', 'error');
    }
  }, [selectedParts, addToCart, showToast]);

  const currentStep = ASSEMBLY_STEPS[currentStepIndex];
  const compatValidation = validateBuildCompatibility(selectedParts);
  const totalCost = Object.values(selectedParts).reduce((sum, p) => sum + (p?.price || 0), 0);
  const installedCount = Object.values(selectedParts).filter(Boolean).length;

  return (
    <div className="glab-pc-builder-page-wrapper">
      <div className="glab-pc-builder-page">
        {/* PAGE HERO HEADER */}
        <div className="pc-builder-hero">
          <div className="hero-content">
            <div className="hero-badge">
              <i className="fa-solid fa-microchip"></i> Next-Gen Custom Rig Studio
            </div>
            <h1 className="hero-title">G-LAB PC BUILDER</h1>
            <p className="hero-description">
              Engineer your ultimate gaming or workstation rig. Live 2D chassis assembly, deterministic hardware validation, game framerate benchmarks, and real-time power budget calculation.
            </p>
          </div>

          {/* TOP CONTROLS & RESET */}
          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-modern-hero btn-saved-builds-trigger"
              onClick={() => setIsSavedBuildsModalOpen(true)}
              title="View or load saved builds"
            >
              <i className="fa-solid fa-bookmark"></i>
              <span>Saved Builds</span>
            </button>
            <button
              type="button"
              className="btn btn-modern-hero btn-clear-rig"
              onClick={handleClearBuild}
              title="Reset build"
            >
              <i className="fa-solid fa-rotate-left"></i>
              <span>Reset Rig</span>
            </button>
          </div>
        </div>

        {/* MODE SELECTOR (Manual / Auto / Game) */}
        <BuilderModeSelector
          activeMode={activeMode}
          onSelectMode={handleModeChange}
        />

        {/* GAME MODE PANEL (If active) */}
        {activeMode === 'game' && (
          <GameSelector
            allProducts={catalogProducts}
            targetBudget={targetBudget}
            onBudgetChange={setTargetBudget}
            selectedParts={selectedParts}
            onApplyGameBuild={handleApplyGameBuild}
            onCloseGameMode={() => setActiveMode('manual')}
          />
        )}

        {/* STEP-BY-STEP GUIDED ASSEMBLY PROGRESS BAR */}
        <AssemblyProgress
          currentStepIndex={currentStepIndex}
          onSelectStep={(idx) => setCurrentStepIndex(idx)}
          selectedParts={selectedParts}
        />

        {/* MOBILE TAB CONTROLS (Only visible on small screens) */}
        <div className="mobile-view-tabs">
          <button
            type="button"
            className={`mobile-tab-btn ${mobileActiveTab === 'builder' ? 'active' : ''}`}
            onClick={() => setMobileActiveTab('builder')}
          >
            <i className="fa-solid fa-list-check"></i>
            <span>Parts ({currentStep?.shortLabel})</span>
          </button>
          <button
            type="button"
            className={`mobile-tab-btn ${mobileActiveTab === 'chassis' ? 'active' : ''}`}
            onClick={() => setMobileActiveTab('chassis')}
          >
            <i className="fa-solid fa-server"></i>
            <span>2D Chassis</span>
          </button>
          <button
            type="button"
            className={`mobile-tab-btn ${mobileActiveTab === 'diagnostics' ? 'active' : ''}`}
            onClick={() => setMobileActiveTab('diagnostics')}
          >
            <i className="fa-solid fa-shield-halved"></i>
            <span>Diagnostics & Budget</span>
          </button>
        </div>

        {/* MAIN BUILDER WORKSPACE (Dual / Triple Column Layout) */}
        <div className={`pc-builder-workspace mobile-tab-${mobileActiveTab}`}>
          {/* LEFT COLUMN: 2D CHASSIS VISUALIZER & DIAGNOSTICS */}
          <div className="builder-sidebar-column">
            {/* 2D VISUALIZER */}
            <BuildVisualizer
              selectedParts={selectedParts}
              onSlotClick={handleSlotClick}
              isPoweredOn={isPoweredOn}
              onTogglePower={handleTogglePower}
            />

            {/* BUDGET TRACKER */}
            <BudgetPanel
              selectedParts={selectedParts}
              targetBudget={targetBudget}
              onBudgetChange={setTargetBudget}
            />
          </div>

          {/* RIGHT COLUMN: STEP COMPONENT SELECTOR */}
          <div className="builder-main-column">
            <ComponentSelector
              step={currentStep}
              stepIndex={currentStepIndex}
              totalSteps={ASSEMBLY_STEPS.length}
              selectedParts={selectedParts}
              onSelectPart={handleSelectPart}
              onRemovePart={handleRemovePart}
              onNextStep={handleNextStep}
              onPrevStep={handlePrevStep}
              onAddAllToCart={handleAddAllToCart}
              onSaveBuildClick={() => setIsSavedBuildsModalOpen(true)}
              onExportSpecSheet={handleExportSpecSheet}
              onShareBuild={handleShareBuild}
            />
          </div>

          {/* HORIZONTAL COMPATIBILITY DIAGNOSTICS CONSOLE (Full Width Across Horizontal Axis) */}
          <div className="builder-horizontal-diagnostics-column">
            <CompatibilityPanel selectedParts={selectedParts} />
          </div>
        </div>

        {/* PERSISTENT BUILD SUMMARY BAR */}
        <div className="pc-builder-summary-bar">
          <div className="summary-left-stats">
            <div className="summary-stat-block">
              <span className="stat-label">Total Cost</span>
              <strong className="stat-value text-accent">
                Rs. {totalCost.toLocaleString()}
              </strong>
            </div>
            <div className="summary-stat-block">
              <span className="stat-label">Installed</span>
              <strong className="stat-value">
                {installedCount}/9 parts
              </strong>
            </div>
            <div className="summary-stat-block summary-compat-block">
              <span className="stat-label">Compatibility</span>
              <span className={`summary-status-badge ${compatValidation.overallStatus}`}>
                {compatValidation.overallStatus === 'compatible' && '✓ 100% Compatible'}
                {compatValidation.overallStatus === 'incompatible' && '✗ Incompatible'}
                {compatValidation.overallStatus === 'warning' && '⚠ Warning'}
                {compatValidation.overallStatus === 'unverified' && '⚠ Unverified'}
                {compatValidation.overallStatus === 'pending' && '○ In Progress'}
              </span>
            </div>
          </div>

          <div className="summary-right-actions">
            <button
              type="button"
              className="btn btn-modern-summary-action btn-summary-save"
              onClick={() => setIsSavedBuildsModalOpen(true)}
              title="Save this build to library"
            >
              <i className="fa-solid fa-bookmark"></i>
              <span>Save Rig</span>
            </button>
            <button
              type="button"
              className="btn btn-modern-summary-action btn-summary-library"
              onClick={() => navigate('/profile')}
              title="View your Saved Builds Library in Profile"
            >
              <i className="fa-solid fa-layer-group"></i>
              <span>Builds Library</span>
              {savedBuildsCount > 0 && (
                <span className="summary-builds-badge">{savedBuildsCount}</span>
              )}
            </button>
            <button
              type="button"
              className="btn btn-modern-summary-cta btn-summary-cart"
              onClick={handleAddAllToCart}
              disabled={installedCount === 0}
              title="Add all installed parts to shopping cart"
            >
              <i className="fa-solid fa-cart-shopping"></i>
              <span>Add Build to Cart</span>
            </button>
          </div>
        </div>

        {/* AUTO BUILD MODAL */}
        {isAutoModalOpen && (
          <AutoBuildModal
            allProducts={catalogProducts}
            initialBudget={targetBudget}
            onApplyBuild={handleApplyAutoBuild}
            onClose={() => {
              setIsAutoModalOpen(false);
              if (activeMode === 'auto') setActiveMode('manual');
            }}
          />
        )}

        {/* SAVED BUILDS MODAL */}
        {isSavedBuildsModalOpen && (
          <SavedBuildsModal
            currentParts={selectedParts}
            targetBudget={targetBudget}
            onLoadBuild={handleLoadSavedBuild}
            onClose={() => setIsSavedBuildsModalOpen(false)}
            showToast={showToast}
          />
        )}
      </div>
    </div>
  );
}
