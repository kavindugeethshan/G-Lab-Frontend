import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Navbar.css';

const DEFAULT_NAV_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='48' fill='%230b1329' stroke='%2338bdf8' stroke-width='4'/%3E%3Ccircle cx='50' cy='38' r='18' fill='%2338bdf8'/%3E%3Cpath d='M22 84c0-16 12.5-26 28-26s28 10 28 26' fill='%2338bdf8'/%3E%3C/svg%3E";

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const firstName = (user?.firstname || user?.firstName || '').trim();
  const lastName = (user?.lastname || user?.lastName || '').trim();
  const fullName = `${firstName} ${lastName}`.trim();
  const rawName = firstName || fullName || user?.name || (user?.email ? user.email.split('@')[0] : 'User');
  const displayName = rawName ? (rawName.charAt(0).toUpperCase() + rawName.slice(1)) : 'User';

  const avatarUrl = user?.Image || user?.image || user?.avatar || '';

  return (
    <header className="site-header" style={{ width: '100%', maxWidth: '100%', margin: 0, top: 0, left: 0, right: 0, borderRadius: 0 }}>
      <Link to="/" className="logo-title">
        <div className="logo-icon">G</div>
        <div className="logo-text">
          <h1 style={{ color: '#ffffff', WebkitTextFillColor: '#ffffff', background: 'none', margin: 0 }}>G LAB</h1>
          <span style={{ color: 'rgba(255, 255, 255, 0.75)' }}>COMPUTER HARDWARE</span>
        </div>
      </Link>

      <ul className={`nav-links ${mobileOpen ? 'mobile-open' : ''}`}>
        <li>
          <NavLink to="/" end onClick={() => setMobileOpen(false)}>
            Home
          </NavLink>
        </li>
        <li>
          <Link
            to="/#categoriesSection"
            onClick={(e) => {
              setMobileOpen(false);
              if (window.location.pathname === '/') {
                e.preventDefault();
                const el = document.getElementById('categoriesSection');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  window.history.pushState(null, '', '/#categoriesSection');
                }
              }
            }}
          >
            Categories
          </Link>
        </li>
        <li>
          <Link
            to="/#whyGlab"
            onClick={(e) => {
              setMobileOpen(false);
              if (window.location.pathname === '/') {
                e.preventDefault();
                const el = document.getElementById('whyGlab');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  window.history.pushState(null, '', '/#whyGlab');
                }
              }
            }}
          >
            Why G LAB
          </Link>
        </li>
        <li>
          <NavLink to="/products" onClick={() => setMobileOpen(false)}>
            Products
          </NavLink>
        </li>
        {isAdmin && (
          <li>
            <NavLink to="/admin" onClick={() => setMobileOpen(false)} style={{ color: 'var(--accent-color)' }}>
              <i className="fa-solid fa-shield-halved"></i> Admin
            </NavLink>
          </li>
        )}
      </ul>

      <div className="nav-actions">
        {isAuthenticated ? (
          <>
            <Link to="/profile" className="user-greeting" title={`View Profile (${fullName || displayName})`}>
              <img
                src={avatarUrl || DEFAULT_NAV_AVATAR}
                alt={displayName}
                className="user-nav-avatar"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_NAV_AVATAR;
                }}
              />
              <span>Hi, <strong>{displayName}</strong></span>
            </Link>

            <Link to="/cart" className="cart-btn" aria-label="Shopping Cart">
              <i className="fa-solid fa-cart-shopping"></i>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>

            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleLogout}
              title="Logout"
            >
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-primary btn-sm">
              <i className="fa-solid fa-right-to-bracket"></i> Sign In
            </Link>
          </>
        )}

        <button
          type="button"
          className="mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation menu"
        >
          <i className={`fa-solid ${mobileOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
        </button>
      </div>
    </header>
  );
}
