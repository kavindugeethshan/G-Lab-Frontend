import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { uploadFileToFirebase } from '../services/firebase';
import { authService } from '../services/authService';
import { validateImageSecurity } from '../utils/fileValidation';
import {
  getSavedBuilds,
  deleteSavedBuild,
  loadBuildIntoWorkspace,
  generateBuildSpecSheet,
} from './pc-builder/utils/pcBuilderStorage';
import { calculateSystemPower } from './pc-builder/utils/compatibility';
import './ProfilePage.css';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23e2e8f0'/%3E%3Cpath d='M50 48a18 18 0 1 0 0-36 18 18 0 0 0 0 36zm0 10c-20 0-36 12-36 28h72c0-16-16-28-36-28z' fill='%2394a3b8'/%3E%3C/svg%3E";

export default function ProfilePage() {
  const { user, isAdmin, logout, updateUser } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Saved PC Builds State
  const [savedBuilds, setSavedBuilds] = useState([]);
  const [addingBuildId, setAddingBuildId] = useState(null);

  useEffect(() => {
    setSavedBuilds(getSavedBuilds());
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleAvatarFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = await validateImageSecurity(file);
    if (!validation.valid) {
      showToast(validation.error, 'error');
      return;
    }

    setUploadingAvatar(true);
    showToast('Uploading profile picture...', 'loading');

    try {
      const downloadUrl = await uploadFileToFirebase(file, 'avatars');
      await authService.updateProfile({ image: downloadUrl });
      updateUser({ image: downloadUrl });
      showToast('Profile picture updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to upload profile picture.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Load build into active 3D PC Builder workspace
  const handleLoadBuild = (build) => {
    loadBuildIntoWorkspace(build);
    showToast(`Loaded "${build.name}" into PC Builder!`, 'success');
    navigate('/pc-builder');
  };

  // Delete saved build
  const handleDeleteBuild = (id, name) => {
    if (window.confirm(`Delete saved build "${name}" from your library?`)) {
      const updated = deleteSavedBuild(id);
      setSavedBuilds(updated);
      showToast(`Deleted build "${name}".`, 'info');
    }
  };

  // Export BOM Spec Sheet text file
  const handleDownloadSpec = (build) => {
    const parts = build.parts || {};
    const powerData = calculateSystemPower(parts);
    const text = generateBuildSpecSheet(parts, build.targetBudget, powerData);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${build.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_spec_sheet.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Spec sheet for "${build.name}" downloaded!`, 'success');
  };

  // 1-Click add all installed parts of the build to cart
  const handleAddBuildToCart = async (build) => {
    const parts = build.parts || {};
    const installedList = Object.entries(parts).filter(([_, part]) => !!part && (part._id || part.productId || part.id));
    if (installedList.length === 0) {
      showToast('This build has no purchasable hardware parts.', 'error');
      return;
    }

    setAddingBuildId(build.id);
    let successCount = 0;
    for (const [_, part] of installedList) {
      const pId = part._id || part.productId || part.id;
      if (typeof pId === 'string' && (pId.startsWith('stock-') || pId.startsWith('chassis-'))) continue;

      const ok = await addToCart(pId, 1, true); // silent = true
      if (ok) successCount++;
    }
    setAddingBuildId(null);

    if (successCount > 0) {
      showToast(`${successCount} components from "${build.name}" added to cart!`, 'success');
    } else {
      showToast('Unable to add components to cart.', 'error');
    }
  };

  const firstName = user?.firstname || user?.firstName || '—';
  const lastName = user?.lastname || user?.lastName || '—';
  const fullName = `${user?.firstname || user?.firstName || ''} ${user?.lastname || user?.lastName || ''}`.trim() || user?.name || user?.email || 'User Account';
  const avatarUrl = user?.image || user?.Image || user?.avatar || DEFAULT_AVATAR;
  const roleName = user?.role || (isAdmin ? 'Admin' : 'Customer');

  let addressStr = 'Not provided';
  if (user?.address) {
    if (typeof user.address === 'object') {
      const parts = [user.address.addressLine, user.address.city, user.address.district || user.address.province, user.address.postalCode].filter(Boolean);
      addressStr = parts.length > 0 ? parts.join(', ') : 'Not provided';
    } else if (typeof user.address === 'string' && user.address.trim()) {
      addressStr = user.address;
    }
  }

  const createdAtFormatted = user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—';

  return (
    <div className="page-container profile-page-container">
      <div className="profile-layout-grid">
        {/* LEFT COLUMN: USER PROFILE CARD */}
        <div className="profile-card">
          <div className="profile-header">
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img
                id="userAvatar"
                className="avatar"
                src={avatarUrl}
                alt="User Avatar"
                onError={(e) => {
                  e.currentTarget.src = DEFAULT_AVATAR;
                }}
              />
              <button
                type="button"
                onClick={() => document.getElementById('quickAvatarInput')?.click()}
                className="btn-avatar-camera"
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: 0,
                  background: 'var(--accent-gradient)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                }}
                title="Upload Profile Picture"
                disabled={uploadingAvatar}
              >
                <i className="fa-solid fa-camera" style={{ fontSize: '0.85rem' }}></i>
              </button>
            </div>
            <input
              type="file"
              id="quickAvatarInput"
              accept=".jpg, .jpeg, .png, .webp, image/jpeg, image/png, image/webp"
              style={{ display: 'none' }}
              onChange={handleAvatarFileChange}
            />
            {uploadingAvatar && (
              <div id="uploadProgress" style={{ fontSize: '0.82rem', color: 'var(--accent-color)', fontWeight: 600, marginTop: '4px' }}>
                Uploading image...
              </div>
            )}
            <h2 id="userName">{fullName}</h2>
            <span className={`badge-role ${isAdmin ? 'badge-admin' : ''}`} id="userRole">
              {roleName}
            </span>
          </div>

          <div className="info-grid">
            <div className="info-group">
              <span className="info-label">First Name</span>
              <span className="info-value" id="infoFirstName">{firstName}</span>
            </div>
            <div className="info-group">
              <span className="info-label">Last Name</span>
              <span className="info-value" id="infoLastName">{lastName}</span>
            </div>
            <div className="info-group">
              <span className="info-label">Mobile Number</span>
              <span className="info-value" id="infoPhone">{user?.phone || 'Not provided'}</span>
            </div>
            <div className="info-group">
              <span className="info-label">Email Address</span>
              <span className="info-value" id="infoEmail">{user?.email || '—'}</span>
            </div>
            <div className="info-group" style={{ gridColumn: 'span 2' }}>
              <span className="info-label">Delivery Address</span>
              <span className="info-value" id="infoAddress">{addressStr}</span>
            </div>
            <div className="info-group" style={{ gridColumn: 'span 2' }}>
              <span className="info-label">Account Created</span>
              <span className="info-value" id="infoCreatedAt">{createdAtFormatted}</span>
            </div>
          </div>

          <div className="action-buttons">
            <Link to="/profile/edit" className="btn btn-primary">
              <i className="fa-solid fa-user-pen"></i> Edit Profile & Address
            </Link>
            <Link to="/" className="btn btn-outline">
              <i className="fa-solid fa-house"></i> Back to Store
            </Link>
            <button type="button" className="btn btn-danger" onClick={handleLogout}>
              <i className="fa-solid fa-right-from-bracket"></i> Logout Account
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: SAVED BUILDS LIBRARY */}
        <div className="saved-builds-profile-card">
          <div className="saved-builds-header-row">
            <div className="saved-builds-title-block">
              <span className="saved-builds-badge">
                <i className="fa-solid fa-bookmark"></i>
              </span>
              <div>
                <h3 className="saved-builds-title">Saved Builds Library</h3>
                <p className="saved-builds-subtitle">
                  Save multiple PC configurations or reload a previously assembled custom rig
                </p>
              </div>
            </div>

            <div className="saved-builds-header-actions">
              <span className="builds-count-tag">
                <i className="fa-solid fa-layer-group"></i> {savedBuilds.length} {savedBuilds.length === 1 ? 'Build' : 'Builds'}
              </span>
              <Link to="/pc-builder" className="btn btn-sm btn-primary btn-new-rig">
                <i className="fa-solid fa-plus"></i> New Build
              </Link>
            </div>
          </div>

          {savedBuilds.length === 0 ? (
            <div className="empty-saved-builds-box">
              <div className="empty-icon-circle">
                <i className="fa-solid fa-computer"></i>
              </div>
              <h4>No Saved Builds Yet</h4>
              <p>
                You haven't saved any custom configurations yet. Head over to our interactive 3D PC Builder to design, assemble, and test your custom hardware setup!
              </p>
              <Link to="/pc-builder" className="btn btn-primary">
                <i className="fa-solid fa-screwdriver-wrench"></i> Launch 3D PC Builder
              </Link>
            </div>
          ) : (
            <div className="saved-builds-cards-list">
              {savedBuilds.map((b) => {
                const parts = b.parts || {};
                const installedCount = Object.values(parts).filter(Boolean).length;
                const powerData = calculateSystemPower(parts);
                const isAddingThis = addingBuildId === b.id;
                const isWithinBudget = b.targetBudget > 0 && b.totalPrice <= b.targetBudget;

                return (
                  <div key={b.id} className="profile-build-item">
                    {/* BUILD HEADER */}
                    <div className="build-item-header">
                      <div className="build-item-title-group">
                        <h4 className="build-item-name">{b.name}</h4>
                        <div className="build-item-meta-tags">
                          <span className="build-item-date">
                            <i className="fa-regular fa-calendar"></i> {new Date(b.createdAt).toLocaleDateString()}
                          </span>
                          <span className="build-item-count-chip">
                            <i className="fa-solid fa-microchip"></i> {installedCount}/9 Components
                          </span>
                          <span className="build-item-power-chip">
                            <i className="fa-solid fa-bolt"></i> ~{powerData?.estimatedPower || 0}W
                          </span>
                        </div>
                      </div>

                      <div className="build-item-pricing-group">
                        <span className="build-item-price">
                          Rs. {Number(b.totalPrice || 0).toLocaleString()}
                        </span>
                        {b.targetBudget > 0 && (
                          <span className={`build-item-budget-pill ${isWithinBudget ? 'within' : 'over'}`}>
                            {isWithinBudget
                              ? `Budget: Rs. ${Number(b.targetBudget).toLocaleString()}`
                              : `Over Budget (Rs. ${(b.totalPrice - b.targetBudget).toLocaleString()})`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* COMPONENT CHIPS GRID */}
                    <div className="build-item-chips-container">
                      {parts.cpu && (
                        <div className="build-mini-chip" title={`CPU: ${parts.cpu.name}`}>
                          <i className="fa-solid fa-brain"></i>
                          <strong className="chip-slot-label">CPU:</strong>
                          <span className="chip-part-text">{parts.cpu.name}</span>
                        </div>
                      )}
                      {parts.gpu && (
                        <div className="build-mini-chip" title={`GPU: ${parts.gpu.name}`}>
                          <i className="fa-solid fa-tv"></i>
                          <strong className="chip-slot-label">GPU:</strong>
                          <span className="chip-part-text">{parts.gpu.name}</span>
                        </div>
                      )}
                      {parts.motherboard && (
                        <div className="build-mini-chip" title={`Motherboard: ${parts.motherboard.name}`}>
                          <i className="fa-solid fa-border-all"></i>
                          <strong className="chip-slot-label">MOBO:</strong>
                          <span className="chip-part-text">{parts.motherboard.name}</span>
                        </div>
                      )}
                      {parts.ram && (
                        <div className="build-mini-chip" title={`RAM: ${parts.ram.name}`}>
                          <i className="fa-solid fa-memory"></i>
                          <strong className="chip-slot-label">RAM:</strong>
                          <span className="chip-part-text">{parts.ram.name}</span>
                        </div>
                      )}
                      {parts.cooler && (
                        <div className="build-mini-chip" title={`Cooler: ${parts.cooler.name}`}>
                          <i className="fa-solid fa-fan"></i>
                          <strong className="chip-slot-label">Cooler:</strong>
                          <span className="chip-part-text">{parts.cooler.name}</span>
                        </div>
                      )}
                      {parts.storage && (
                        <div className="build-mini-chip" title={`Storage: ${parts.storage.name}`}>
                          <i className="fa-solid fa-hard-drive"></i>
                          <strong className="chip-slot-label">SSD:</strong>
                          <span className="chip-part-text">{parts.storage.name}</span>
                        </div>
                      )}
                      {parts.pcCase && (
                        <div className="build-mini-chip" title={`Case: ${parts.pcCase.name}`}>
                          <i className="fa-solid fa-server"></i>
                          <strong className="chip-slot-label">Case:</strong>
                          <span className="chip-part-text">{parts.pcCase.name}</span>
                        </div>
                      )}
                      {parts.psu && (
                        <div className="build-mini-chip" title={`PSU: ${parts.psu.name}`}>
                          <i className="fa-solid fa-bolt"></i>
                          <strong className="chip-slot-label">PSU:</strong>
                          <span className="chip-part-text">{parts.psu.name}</span>
                        </div>
                      )}
                      {parts.fans && (
                        <div className="build-mini-chip" title={`Fans: ${parts.fans.name}`}>
                          <i className="fa-solid fa-wind"></i>
                          <strong className="chip-slot-label">Fans:</strong>
                          <span className="chip-part-text">{parts.fans.name}</span>
                        </div>
                      )}
                    </div>

                    {/* BUILD ACTIONS */}
                    <div className="build-item-actions-row">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm btn-load-workspace"
                        onClick={() => handleLoadBuild(b)}
                        title="Load into 3D PC Builder workspace"
                      >
                        <i className="fa-solid fa-screwdriver-wrench"></i> Load in PC Builder
                      </button>

                      <button
                        type="button"
                        className="btn btn-cart-rig btn-sm"
                        onClick={() => handleAddBuildToCart(b)}
                        disabled={isAddingThis}
                        title="Add all components of this rig to cart"
                      >
                        {isAddingThis ? (
                          <>
                            <i className="fa-solid fa-circle-notch fa-spin"></i> Adding...
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-cart-plus"></i> Add Rig to Cart
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline btn-sm btn-spec-sheet"
                        onClick={() => handleDownloadSpec(b)}
                        title="Download Bill of Materials Spec Sheet"
                      >
                        <i className="fa-solid fa-file-arrow-down"></i> Spec Sheet
                      </button>

                      <button
                        type="button"
                        className="btn btn-delete-rig btn-sm"
                        onClick={() => handleDeleteBuild(b.id, b.name)}
                        title="Delete from saved builds library"
                      >
                        <i className="fa-solid fa-trash-can"></i> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
