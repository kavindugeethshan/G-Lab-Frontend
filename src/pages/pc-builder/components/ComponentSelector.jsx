import React, { useState, useEffect, useMemo } from 'react';
import { productService } from '../../../services/productService';
import { getProductSpecs } from '../utils/hardwareSpecs';
import { testCandidateCompatibility } from '../utils/compatibility';

// Fallback catalog items for categories currently not in DB (Coolers & Fans)
const STANDARD_COOLER_OPTIONS = [
  {
    _id: 'stock-air-cooler',
    name: 'Standard High-Performance Air Cooler (Stock)',
    brand: 'OEM Precision',
    price: 0,
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=400&q=80',
    description: 'Direct-contact heatpipe air tower cooler with 120mm PWM fan. Included with system assembly.',
    stock: 50,
    componentType: 'cooler',
    coolerType: 'Air',
    supportedSockets: ['AM5', 'AM4', 'LGA1851', 'LGA1700'],
    coolerHeight: 155,
    maxTdpSupported: 180,
    isVerified: true,
  },
  {
    _id: 'deepcool-ak620',
    name: 'Dual-Tower High Static Pressure Cooler',
    brand: 'DeepCool',
    price: 18500,
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=400&q=80',
    description: 'Dual-tower design with dual 120mm FDB PWM fans, nickel-plated copper base, 260W TDP cooling capacity.',
    stock: 20,
    componentType: 'cooler',
    coolerType: 'Air',
    supportedSockets: ['AM5', 'AM4', 'LGA1851', 'LGA1700'],
    coolerHeight: 160,
    maxTdpSupported: 260,
    isVerified: true,
  }
];

const STANDARD_FAN_OPTIONS = [
  {
    _id: 'chassis-default-fans',
    name: 'Pre-Installed Chassis High-Airflow PWM Fans',
    brand: 'Chassis OEM',
    price: 0,
    image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=400&q=80',
    description: 'Pre-installed front intake and rear exhaust PWM fans for optimal chassis airflow.',
    stock: 99,
    componentType: 'fans',
    fanCount: 3,
    fanSize: '120mm',
    isVerified: true,
  },
  {
    _id: 'rgb-triple-pack-fans',
    name: 'ARGB 120mm High Performance Fans (Triple Pack)',
    brand: 'G-Lab Arctic',
    price: 12500,
    image: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=400&q=80',
    description: 'Trio of 120mm addressable RGB fans with fluid dynamic bearings and vibration dampening pads.',
    stock: 25,
    componentType: 'fans',
    fanCount: 3,
    fanSize: '120mm',
    isVerified: true,
  }
];

export default function ComponentSelector({
  step,
  stepIndex,
  totalSteps,
  selectedParts,
  onSelectPart,
  onRemovePart,
  onNextStep,
  onPrevStep,
  onAddAllToCart,
  onSaveBuildClick,
  onExportSpecSheet,
  onShareBuild,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyCompatible, setOnlyCompatible] = useState(true);
  const [sortBy, setSortBy] = useState('popular');
  const [pendingIncompatiblePart, setPendingIncompatiblePart] = useState(null);

  const slotId = step?.id;
  const currentlySelected = selectedParts[slotId];
  const isReviewStep = slotId === 'review';

  // Fetch catalog products when step changes
  useEffect(() => {
    if (isReviewStep) return;

    // Handle Coolers & Fans categories (fallback items if none in DB)
    if (slotId === 'cooler') {
      setProducts(STANDARD_COOLER_OPTIONS);
      setLoading(false);
      return;
    }
    if (slotId === 'fans') {
      setProducts(STANDARD_FAN_OPTIONS);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchCategoryProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await productService.getProducts({
          category: step.categoryKey,
          limit: 100,
        });

        if (!isMounted) return;
        const list = res.products || [];
        setProducts(list);
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load components for', step.categoryKey, err);
        setError('Could not load hardware components for this step. Please try again.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCategoryProducts();

    return () => {
      isMounted = false;
    };
  }, [slotId, step?.categoryKey, isReviewStep]);

  // Enrich products with specs & candidate compatibility
  const enrichedProducts = useMemo(() => {
    return products.map((prod) => {
      const specs = getProductSpecs(prod);
      const compatibility = testCandidateCompatibility(specs, selectedParts);
      return {
        raw: prod,
        specs,
        compatibility,
      };
    });
  }, [products, selectedParts]);

  // Filter & sort products
  const filteredProducts = useMemo(() => {
    return enrichedProducts.filter(({ raw, _specs, compatibility }) => {
      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = raw.name?.toLowerCase().includes(query);
        const matchesBrand = raw.brand?.toLowerCase().includes(query);
        const matchesDesc = raw.description?.toLowerCase().includes(query);
        if (!matchesName && !matchesBrand && !matchesDesc) return false;
      }

      // Compatibility filter
      if (onlyCompatible && !compatibility.isCompatible) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // 4-Tier Candidate Sorting Priority:
      // 1. Compatible + In Stock
      // 2. Compatible + Out of Stock
      // 3. Incompatible + In Stock
      // 4. Incompatible + Out of Stock
      const getCandidateTier = (item) => {
        const isComp = !!item.compatibility.isCompatible;
        const isInStock = item.raw.stock === undefined || Number(item.raw.stock) > 0;
        if (isComp && isInStock) return 1;
        if (isComp && !isInStock) return 2;
        if (!isComp && isInStock) return 3;
        return 4;
      };

      const tierA = getCandidateTier(a);
      const tierB = getCandidateTier(b);

      if (tierA !== tierB) {
        return tierA - tierB;
      }

      // Within the same tier, apply user-chosen sorting
      if (sortBy === 'price-asc') return (a.raw.price || 0) - (b.raw.price || 0);
      if (sortBy === 'price-desc') return (b.raw.price || 0) - (a.raw.price || 0);
      return 0; // Default/Popular
    });
  }, [enrichedProducts, searchTerm, onlyCompatible, sortBy]);

  // Format currency
  const formatPrice = (val) => {
    if (typeof val !== 'number') return 'Rs. 0';
    return `Rs. ${val.toLocaleString()}`;
  };

  // 10. FINAL REVIEW STEP UI
  if (isReviewStep) {
    const installedList = Object.entries(selectedParts).filter(([, part]) => !!part);
    const totalPrice = installedList.reduce((sum, [, part]) => sum + (part.price || 0), 0);

    return (
      <div className="component-selector review-step-view">
        <div className="selector-header">
          <div className="header-title-row">
            <h3>
              <i className="fa-solid fa-clipboard-check text-accent"></i> Final Build Review & Assembly
            </h3>
            <span className="step-counter-badge">Step {stepIndex + 1} of {totalSteps}</span>
          </div>
          <p className="selector-subtitle">
            Review your custom hardware selection, verified component compatibility, and bill of materials.
          </p>
        </div>

        <div className="review-bom-table-container">
          <table className="review-bom-table">
            <thead>
              <tr>
                <th>Component Slot</th>
                <th>Selected Product</th>
                <th>Brand</th>
                <th>Key Specifications</th>
                <th>Unit Price</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {installedList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-bom-row">
                    No components installed yet. Navigate back through the steps to assemble your PC.
                  </td>
                </tr>
              ) : (
                installedList.map(([slot, part]) => (
                  <tr key={slot}>
                    <td className="slot-name-cell">
                      <span className="slot-badge">{slot.toUpperCase()}</span>
                    </td>
                    <td className="part-name-cell">
                      <div className="part-name-with-img">
                        {part.image && (
                          <img
                            src={part.image}
                            alt={part.name}
                            className="bom-part-thumb"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                        <div>
                          <strong>{part.name}</strong>
                          {part.isVerified === false && (
                            <span className="unverified-tag" title="Manufacturer specs not fully verified">
                              <i className="fa-solid fa-circle-question"></i> Unverified Specs
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{part.brand || '—'}</td>
                    <td className="specs-cell">
                      {part.socket && <span className="spec-tag">{part.socket}</span>}
                      {part.ramType && <span className="spec-tag">{part.ramType}</span>}
                      {part.wattage && <span className="spec-tag">{part.wattage}W</span>}
                      {part.gpuLength && <span className="spec-tag">{part.gpuLength}mm</span>}
                      {part.formFactor && <span className="spec-tag">{part.formFactor}</span>}
                    </td>
                    <td className="price-cell">
                      <strong>{formatPrice(part.price)}</strong>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-remove-part"
                        onClick={() => onRemovePart(slot)}
                        title="Remove component from build"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="4" className="bom-total-label">Total Custom Build Price:</td>
                <td colSpan="2" className="bom-total-price">
                  {formatPrice(totalPrice)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* STEP FOOTER NAVIGATION */}
        <div className="selector-footer-navigation review-footer-modern">
          <button type="button" className="btn btn-modern-nav btn-step-prev" onClick={onPrevStep}>
            <i className="fa-solid fa-arrow-left"></i>
            <span>Previous Step</span>
          </button>
          <div className="review-action-group">
            {onExportSpecSheet && (
              <button
                type="button"
                className="btn btn-modern-action btn-export-spec-sheet"
                onClick={onExportSpecSheet}
                disabled={installedList.length === 0}
                title="Download / Copy Bill of Materials specification sheet"
              >
                <i className="fa-solid fa-file-arrow-down"></i>
                <span>Export Spec Sheet</span>
              </button>
            )}

            {onShareBuild && (
              <button
                type="button"
                className="btn btn-modern-action btn-share-build-action"
                onClick={onShareBuild}
                disabled={installedList.length === 0}
                title="Copy shareable rig summary to clipboard"
              >
                <i className="fa-solid fa-share-nodes"></i>
                <span>Share Build</span>
              </button>
            )}

            {onSaveBuildClick && (
              <button
                type="button"
                className="btn btn-modern-action btn-save-rig-action"
                onClick={onSaveBuildClick}
                disabled={installedList.length === 0}
                title="Save this build to your local library"
              >
                <i className="fa-solid fa-bookmark"></i>
                <span>Save Rig</span>
              </button>
            )}

            {onAddAllToCart && (
              <button
                type="button"
                className="btn btn-modern-cta btn-add-build-action"
                onClick={onAddAllToCart}
                disabled={installedList.length === 0}
                title="Add all components to your cart"
              >
                <i className="fa-solid fa-cart-shopping"></i>
                <span>Add Complete Build to Cart</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // STANDARD COMPONENT SELECTION STEP UI
  return (
    <div className="component-selector">
      {/* HEADER & CURRENTLY INSTALLED STATUS */}
      <div className="selector-header">
        <div className="header-title-row">
          <div className="step-title-group">
            <span className="step-icon-circle">
              <i className={step.icon}></i>
            </span>
            <div>
              <h3>{step.label}</h3>
              <p className="selector-subtitle">
                Select your preferred {step.shortLabel} from our verified G-Lab catalog.
              </p>
            </div>
          </div>
          <span className="step-counter-badge">Step {stepIndex + 1} of {totalSteps}</span>
        </div>

        {/* CURRENTLY SELECTED SLOT BANNER */}
        {currentlySelected ? (
          <div className="currently-installed-banner">
            <div className="installed-info">
              <span className="installed-tag">
                <i className="fa-solid fa-check"></i> Currently Installed
              </span>
              <h4 className="installed-name">{currentlySelected.name}</h4>
              <span className="installed-price">{formatPrice(currentlySelected.price)}</span>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm btn-remove-installed"
              onClick={() => onRemovePart(slotId)}
            >
              <i className="fa-solid fa-xmark"></i> Remove
            </button>
          </div>
        ) : (
          <div className="slot-unselected-notice">
            <i className="fa-solid fa-circle-info"></i> No {step.shortLabel} selected yet for this slot.
          </div>
        )}

        {/* SEARCH & FILTERS CONTROLS */}
        <div className="selector-controls-row">
          <div className="search-box">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder={`Search ${step.shortLabel} by name, brand, or model...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          <div className="filter-group">
            <label className="toggle-compatible-filter">
              <input
                type="checkbox"
                checked={onlyCompatible}
                onChange={(e) => setOnlyCompatible(e.target.checked)}
              />
              <span>Compatible Only</span>
            </label>

            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="popular">Sort: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* PRODUCT LIST CONTENT */}
      <div className="product-catalog-grid">
        {loading ? (
          <div className="catalog-loading-state">
            <i className="fa-solid fa-circle-notch fa-spin"></i>
            <p>Scanning G-Lab hardware inventory...</p>
          </div>
        ) : error ? (
          <div className="catalog-error-state">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <p>{error}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          slotId === 'motherboard' && selectedParts.cpu?.socket?.toUpperCase() === 'LGA1851' ? (
            <div className="catalog-empty-state lga1851-alert-state">
              <div className="empty-alert-icon">
                <i className="fa-solid fa-circle-exclamation text-warning"></i>
              </div>
              <h5 className="text-warning">No Compatible LGA1851 Motherboards Available in Inventory</h5>
              <p>
                Your installed processor <strong>({selectedParts.cpu.name})</strong> utilizes the Intel <strong>LGA1851</strong> socket. All motherboards currently in G-Lab inventory are AMD <strong>AM5</strong> socket models.
              </p>
              <div className="empty-state-suggestions">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    onRemovePart('cpu');
                    onPrevStep();
                  }}
                >
                  <i className="fa-solid fa-rotate-left"></i> Change to AM5 Processor (e.g. Ryzen 7 9800X3D)
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setOnlyCompatible(false)}
                >
                  Inspect All Catalog Motherboards
                </button>
              </div>
            </div>
          ) : (
            <div className="catalog-empty-state">
              <i className="fa-solid fa-microchip"></i>
              <h5>No matching hardware found</h5>
              <p>
                {onlyCompatible
                  ? 'No products in this category match your search and current hardware compatibility constraints. Try disabling the "Compatible Only" filter to inspect items.'
                  : 'No products available for this selection.'}
              </p>
            </div>
          )
        ) : (
          filteredProducts.map(({ raw, specs, compatibility }) => {
            const isThisSelected = currentlySelected?.productId === raw._id || currentlySelected?._id === raw._id;
            const isCompatible = compatibility.isCompatible;
            const isOutOfStock = raw.stock !== undefined && Number(raw.stock) <= 0;

            return (
              <div
                key={raw._id}
                className={`product-part-card ${isThisSelected ? 'selected' : ''} ${!isCompatible ? 'incompatible-card' : ''} ${isOutOfStock ? 'card-out-of-stock' : ''}`}
              >
                {/* PRODUCT IMAGE */}
                <div className="part-card-img-wrapper">
                  <img
                    src={raw.image || 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=400&q=80'}
                    alt={raw.name}
                    className="part-card-img"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  {raw.stock <= 5 && raw.stock > 0 && (
                    <span className="stock-warning-badge">Low Stock: {raw.stock} left</span>
                  )}
                  {isOutOfStock && (
                    <span className="stock-out-badge">Out of Stock</span>
                  )}
                </div>

                {/* DETAILS */}
                <div className="part-card-content">
                  <div className="brand-category-row">
                    <span className="part-brand">{raw.brand || 'G-LAB'}</span>
                    {/* COMPATIBILITY BADGE */}
                    {isCompatible ? (
                      <span className="compatibility-badge compatible" title={compatibility.message}>
                        <i className="fa-solid fa-check"></i> Compatible
                      </span>
                    ) : (
                      <span className="compatibility-badge incompatible" title={compatibility.message}>
                        <i className="fa-solid fa-triangle-exclamation"></i> Incompatible
                      </span>
                    )}
                  </div>

                  <h4 className="part-card-title" title={raw.name}>
                    {raw.name}
                  </h4>

                  {/* SPECS HIGHLIGHTS */}
                  <div className="part-specs-chips">
                    {specs.socket && <span className="spec-chip">Socket: {specs.socket}</span>}
                    {specs.ramType && <span className="spec-chip">{specs.ramType}</span>}
                    {specs.tdp && <span className="spec-chip">TDP: {specs.tdp}W</span>}
                    {specs.gpuLength && <span className="spec-chip">Length: {specs.gpuLength}mm</span>}
                    {specs.formFactor && <span className="spec-chip">{specs.formFactor}</span>}
                    {specs.wattage && <span className="spec-chip">{specs.wattage}W</span>}
                    {specs.efficiencyRating && <span className="spec-chip">{specs.efficiencyRating}</span>}
                  </div>

                  {/* UNVERIFIED SPEC WARNING */}
                  {specs.isVerified === false && (
                    <div className="unverified-card-warning" title="Hardware specs are inferred from catalog text and cannot be guaranteed by deterministic registry.">
                      <i className="fa-solid fa-circle-question"></i> Specs Unverified
                    </div>
                  )}

                  {/* INCOMPATIBILITY EXPLANATION IF RELEVANT */}
                  {!isCompatible && compatibility.message && (
                    <div className="incompatible-reason-alert">
                      <i className="fa-solid fa-circle-exclamation"></i> {compatibility.message}
                    </div>
                  )}

                  {/* PRICE & ACTION BUTTON */}
                  <div className="part-card-footer">
                    <div className="part-price-display">
                      <span className="price-label">Price</span>
                      <span className="price-amount">{formatPrice(raw.price)}</span>
                    </div>

                    <div className="part-action-col">
                      {isThisSelected ? (
                        <button
                          type="button"
                          className="btn-installed"
                          onClick={() => onRemovePart(slotId)}
                        >
                          <i className="fa-solid fa-check"></i> Installed
                        </button>
                      ) : isOutOfStock ? (
                        <button
                          type="button"
                          className="btn-install btn-out-of-stock"
                          disabled
                          title="This product is currently out of stock and cannot be installed."
                        >
                          <i className="fa-solid fa-ban"></i> Out of Stock
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`btn-install ${!isCompatible ? 'btn-install-warning' : ''}`}
                          onClick={() => {
                            if (!isCompatible) {
                              setPendingIncompatiblePart({
                                slotId,
                                part: { ...specs, ...raw },
                                reason: compatibility.message || compatibility.reason || 'Hardware specifications do not match current components.',
                              });
                            } else {
                              onSelectPart(slotId, { ...specs, ...raw });
                            }
                          }}
                        >
                          {!isCompatible ? 'Install Anyway' : 'Install Part'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOOTER NAVIGATION */}
      <div className="selector-footer-navigation">
        <button
          type="button"
          className="btn btn-outline"
          onClick={onPrevStep}
          disabled={stepIndex === 0}
        >
          <i className="fa-solid fa-arrow-left"></i> Previous Step
        </button>

        <button
          type="button"
          className="btn btn-primary"
          onClick={onNextStep}
        >
          {stepIndex === totalSteps - 1 ? 'Go to Review' : 'Next Step'} <i className="fa-solid fa-arrow-right"></i>
        </button>
      </div>

      {/* INCOMPATIBLE HARDWARE INSTALLATION CONFIRMATION MODAL */}
      {pendingIncompatiblePart && (
        <div
          className="modal-overlay incompatible-warning-overlay"
          onClick={() => setPendingIncompatiblePart(null)}
        >
          <div
            className="incompatible-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-modal-header">
              <div className="confirm-header-icon">
                <i className="fa-solid fa-triangle-exclamation text-danger"></i>
              </div>
              <div>
                <h3>Compatibility Warning</h3>
                <span className="confirm-subtitle">Manual Override Verification</span>
              </div>
            </div>

            <div className="confirm-modal-body">
              <p className="confirm-lead-text">
                This component is incompatible with your current build.
              </p>

              <div className="confirm-reason-callout">
                <span className="reason-heading">Reason:</span>
                <p className="reason-detail">{pendingIncompatiblePart.reason}</p>
              </div>

              <div className="confirm-part-preview">
                <span className="preview-label">Selected Hardware:</span>
                <strong>{pendingIncompatiblePart.part?.name}</strong>
              </div>

              <p className="confirm-warning-footer-note">
                <i className="fa-solid fa-circle-exclamation text-warning"></i> Installing this component may result in an invalid build.
              </p>
            </div>

            <div className="confirm-modal-footer">
              <button
                type="button"
                className="btn btn-outline btn-cancel-install"
                onClick={() => setPendingIncompatiblePart(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-confirm-install-anyway"
                onClick={() => {
                  onSelectPart(pendingIncompatiblePart.slotId, pendingIncompatiblePart.part);
                  setPendingIncompatiblePart(null);
                }}
              >
                Install Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
