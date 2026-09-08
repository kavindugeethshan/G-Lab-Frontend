import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';
import { uploadFileToFirebase } from '../services/firebase';
import { validatePhoneNumber } from '../utils/formatters';
import { validateImageSecurity } from '../utils/fileValidation';
import './EditProfilePage.css';

const DEFAULT_AVATAR = "https://via.placeholder.com/70?text=Avatar";

export default function EditProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Personal Info Form State
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(DEFAULT_AVATAR);
  const [selectedFile, setSelectedFile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Address Form State
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [savingAddress, setSavingAddress] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstname(user.firstname || user.firstName || '');
      setLastname(user.lastname || user.lastName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAvatarPreview(user.image || user.Image || user.avatar || DEFAULT_AVATAR);

      const addr = user.address && typeof user.address === 'object' ? user.address : {};
      setAddressLine(addr.addressLine || (typeof user.address === 'string' ? user.address : ''));
      setCity(addr.city || '');
      setDistrict(addr.district || addr.province || '');
      setPostalCode(addr.postalCode || '');
    }
  }, [user]);

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = await validateImageSecurity(file);
      if (!validation.valid) {
        showToast(validation.error, 'error');
        return;
      }
      setSelectedFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfileInfo = async (e) => {
    e.preventDefault();
    if (!firstname.trim() || !lastname.trim() || !email.trim()) {
      showToast('First name, last name, and email are required.', 'error');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!validatePhoneNumber(cleanPhone)) {
      showToast('Mobile / Phone number must be exactly 10 digits (e.g. 0771234567).', 'error');
      return;
    }

    setSavingProfile(true);
    showToast('Updating profile information...', 'loading');

    try {
      let imageUrl = user?.image || user?.Image;
      if (selectedFile) {
        imageUrl = await uploadFileToFirebase(selectedFile, 'avatars');
      }

      const payload = {
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        email: email.trim(),
        phone: cleanPhone,
        image: imageUrl,
      };

      await authService.updateProfile(payload);
      updateUser(payload);
      showToast('Profile information updated successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUpdateAddressInfo = async (e) => {
    e.preventDefault();
    if (!addressLine.trim() || !city.trim() || !postalCode.trim()) {
      showToast('Address line, city, and postal code are required.', 'error');
      return;
    }

    setSavingAddress(true);
    showToast('Saving delivery address...', 'loading');

    try {
      const addressPayload = {
        addressLine: addressLine.trim(),
        city: city.trim(),
        district: district.trim(),
        province: district.trim(),
        postalCode: postalCode.trim(),
      };

      await authService.updateAddress(addressPayload);
      updateUser({ address: addressPayload });
      showToast('Delivery address saved successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save address.', 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showToast('Please provide both current and new password.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters.', 'error');
      return;
    }

    setSavingPassword(true);
    showToast('Updating password...', 'loading');

    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
      });
      showToast('Password updated successfully! Please sign in again.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      logout();
      navigate('/login');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update password.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = window.prompt(
      '⚠️ WARNING: This will permanently delete your account, orders, and review history.\nType "DELETE" to confirm:'
    );
    if (confirmation !== 'DELETE') {
      showToast('Account deletion cancelled.', 'info');
      return;
    }

    try {
      await authService.deleteAccount();
      showToast('Your account has been deleted.', 'info');
      logout();
      navigate('/');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete account.', 'error');
    }
  };

  return (
    <div className="page-container">
      <div className="edit-card">
        <h2>Account Settings</h2>

        {/* 1. PERSONAL INFORMATION (PUT /users/profile) */}
        <div className="section-box">
          <h3>
            <i className="fa-solid fa-user-gear" style={{ color: 'var(--accent-color)' }}></i> Personal Profile Information
          </h3>
          <form id="profileForm" onSubmit={handleUpdateProfileInfo}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label htmlFor="firstname">First Name *</label>
                <input
                  type="text"
                  id="firstname"
                  required
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastname">Last Name *</label>
                <input
                  type="text"
                  id="lastname"
                  required
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Mobile / Phone Number (10 digits) *</label>
                <input
                  type="tel"
                  id="phone"
                  required
                  maxLength={10}
                  minLength={10}
                  pattern="[0-9]{10}"
                  inputMode="numeric"
                  placeholder="0771234567"
                  value={phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPhone(val);
                  }}
                />
                <small style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Must be exactly 10 digits (e.g. 0771234567)
                </small>
              </div>
            </div>

            <div className="form-group">
              <label>Profile Picture</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
                <img
                  id="avatarPreview"
                  src={avatarPreview}
                  alt="Avatar Preview"
                  style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-color)', background: '#f1f5f9' }}
                  onError={(e) => {
                    e.currentTarget.src = DEFAULT_AVATAR;
                  }}
                />
                <div style={{ flex: 1 }}>
                  <input
                    type="file"
                    id="profileImageInput"
                    accept=".jpg, .jpeg, .png, .webp, image/jpeg, image/png, image/webp"
                    style={{ padding: '8px' }}
                    onChange={handleImageChange}
                  />
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Choose a JPG, PNG, or WEBP image (max 5MB) from your device.
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={savingProfile}>
              {savingProfile ? 'Saving...' : 'Save Personal Details'}
            </button>
          </form>
        </div>

        {/* 2. DELIVERY ADDRESS (PUT /users/address) */}
        <div className="section-box">
          <h3>
            <i className="fa-solid fa-location-dot" style={{ color: 'var(--accent-color)' }}></i> Delivery Address
          </h3>
          <form id="addressForm" onSubmit={handleUpdateAddressInfo}>
            <div className="form-group">
              <label htmlFor="addressLine">Street Address / Line *</label>
              <input
                type="text"
                id="addressLine"
                required
                placeholder="123 Tech Street, Suite 4"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label htmlFor="city">City *</label>
                <input
                  type="text"
                  id="city"
                  required
                  placeholder="Colombo"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="district">District / Province *</label>
                <input
                  type="text"
                  id="district"
                  required
                  placeholder="Western Province"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="postalCode">Postal Code *</label>
              <input
                type="text"
                id="postalCode"
                required
                placeholder="00100"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={savingAddress}>
              {savingAddress ? 'Saving Address...' : 'Save Delivery Address'}
            </button>
          </form>
        </div>

        {/* 3. CHANGE PASSWORD (PUT /users/change-password) */}
        <div className="section-box">
          <h3>
            <i className="fa-solid fa-lock" style={{ color: 'var(--accent-color)' }}></i> Security & Password
          </h3>
          <form id="passwordForm" onSubmit={handleChangePassword}>
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password *</label>
              <input
                type="password"
                id="currentPassword"
                required
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password *</label>
              <input
                type="password"
                id="newPassword"
                required
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-outline" style={{ width: '100%' }} disabled={savingPassword}>
              {savingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* 4. DANGER ZONE */}
        <div className="section-box" style={{ borderColor: '#fca5a5', background: '#fff5f5' }}>
          <h3 style={{ color: '#dc2626' }}>
            <i className="fa-solid fa-triangle-exclamation"></i> Danger Zone
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Permanently delete your account and all associated order data. This action cannot be undone.
          </p>
          <button type="button" className="btn btn-danger" style={{ width: '100%' }} onClick={handleDeleteAccount}>
            Delete My Account
          </button>
        </div>

        {/* BOTTOM NAVIGATION LINKS */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/profile" className="btn btn-outline" style={{ flex: 1, textAlign: 'center' }}>
            ← Back to Profile
          </Link>
          <Link to="/cart" className="btn btn-outline" style={{ flex: 1, textAlign: 'center' }}>
            🛒 Go to Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
