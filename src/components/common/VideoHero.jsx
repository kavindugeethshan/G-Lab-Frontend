import React, { useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './VideoHero.css';

export default function VideoHero() {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch((err) => {
        console.log('Video autoplay handling:', err);
      });
    }
  }, []);

  return (
    <section className="cinematic-hero-section">
      {/* Background Video & Dark Overlay */}
      <div className="cinematic-hero-bg-wrapper">
        <video
          ref={videoRef}
          id="heroBgVideo"
          className="cinematic-hero-bg-video"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src="/assets/videos/hero.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="cinematic-hero-overlay"></div>
      </div>

      {/* Overlaid Hero Content */}
      <div className="cinematic-hero-container">
        <div className="cinematic-hero-content">
          <div className="cinematic-hero-tag">
            <i className="fa-solid fa-clapperboard"></i> Ultimate Hardware Experience
          </div>
          <h1 className="cinematic-hero-heading">Engineered For Extreme Performance</h1>
          <p className="cinematic-hero-subtext">
            Discover top-tier GPUs, processors, and custom cooling systems benchmarked for peak gaming &amp;
            professional workstation workloads.
          </p>
          <div className="cinematic-hero-actions">
            <a href="#originalHero" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1rem' }}>
              <i className="fa-solid fa-play"></i> Experience G LAB
            </a>
            <Link to="/products" className="btn btn-outline-light" style={{ padding: '14px 32px', fontSize: '1rem' }}>
              <i className="fa-solid fa-bag-shopping"></i> Shop Hardware
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll Down Indicator */}
      <a href="#originalHero" className="cinematic-hero-scroll">
        <span>Scroll Down</span>
        <i className="fa-solid fa-chevron-down"></i>
      </a>
    </section>
  );
}
