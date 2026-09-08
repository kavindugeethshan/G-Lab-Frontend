import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { uploadFileToFirebase } from '../services/firebase';
import { authService } from '../services/authService';
import { validateImageSecurity } from '../utils/fileValidation';
import './ProfilePage.css';

const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23e2e8f0'/%3E%3Cpath d='M50 48a18 18 0 1 0 0-36 18 18 0 0 0 0 36zm0 10c-20 0-36 12-36 28h72c0-16-16-28-36-28z' fill='%2394a3b8'/%3E%3C/svg%3E";

export default function ProfilePage() {
  const { user, isAdmin, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

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
    <div className="page-container">
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
    </div>
  );
}
