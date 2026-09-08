import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './NotFoundPage.css';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="error-page-container">
      <div className="error-card">
        {/* 404 Animation Video */}
        <div className="caveman-video-wrapper">
          <video
            id="cavemanVideo"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="caveman-video"
          >
            <source src="/animation/error-404.webm" type="video/webm" />
            <source src="/animation/Error%20404.webm" type="video/webm" />
            <source src="/animation/caveman-404.webm" type="video/webm" />
            Your browser does not support webm video playback.
          </video>
        </div>

        {/* Error Text */}
        <div className="error-code">404</div>
        <h2 className="error-title">Oops! This page doesn't exist.</h2>
        <p className="error-description">
          The page you're looking for may have been moved, renamed, or doesn't exist in our store catalog.
        </p>

        {/* Action Buttons */}
        <div className="error-actions">
          <Link to="/" className="btn btn-primary">
            <i className="fa-solid fa-house"></i> Go Home
          </Link>
          <button type="button" onClick={() => navigate(-1)} className="btn btn-outline">
            <i className="fa-solid fa-arrow-left"></i> Go Back
          </button>
          <Link to="/products" className="btn btn-outline">
            <i className="fa-solid fa-cart-shopping"></i> Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}
