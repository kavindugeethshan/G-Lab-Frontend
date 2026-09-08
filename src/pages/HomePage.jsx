import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import VideoHero from '../components/common/VideoHero';
import ProductCard from '../components/products/ProductCard';
import { productService } from '../services/productService';
import './HomePage.css';

function normalizeCategoryStr(cat) {
  return (cat || '').toLowerCase().trim();
}

function isLaptopProduct(p) {
  const cat = normalizeCategoryStr(p.category);
  const name = (p.name || '').toLowerCase();
  return cat.includes('laptop') || cat.includes('notebook') || cat.includes('macbook') || name.includes('laptop');
}

function isCameraProduct(p) {
  const cat = normalizeCategoryStr(p.category);
  const name = (p.name || '').toLowerCase();
  return cat.includes('camera') || cat.includes('dslr') || cat.includes('mirrorless') || name.includes('camera');
}

function isDroneProduct(p) {
  const cat = normalizeCategoryStr(p.category);
  const name = (p.name || '').toLowerCase();
  return cat.includes('drone') || cat.includes('aerial') || cat.includes('quadcopter') || name.includes('drone');
}

function isHardwareProduct(p) {
  return !isLaptopProduct(p) && !isCameraProduct(p) && !isDroneProduct(p);
}

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const lottieRef = useRef(null);

  useEffect(() => {
    const player = lottieRef.current;
    if (!player) return;

    const configurePlayer = () => {
      try {
        player.setAttribute('loop', 'true');
        player.setAttribute('autoplay', 'true');
        if (typeof player.setLooping === 'function') {
          player.setLooping(true);
        }
        if (typeof player.play === 'function') {
          player.play();
        }
      } catch (err) {
        console.warn('DotLottie configure error:', err);
      }
    };

    const restartAndPlay = () => {
      try {
        if (typeof player.seek === 'function') {
          player.seek(0);
        }
        if (typeof player.play === 'function') {
          player.play();
        }
      } catch (err) {
        console.warn('DotLottie restart error:', err);
      }
    };

    // When player is ready or loaded, enforce loop configuration
    player.addEventListener('ready', configurePlayer);
    player.addEventListener('load', configurePlayer);

    // Guaranteed loop restart on completion or stop
    player.addEventListener('complete', restartAndPlay);
    player.addEventListener('stop', restartAndPlay);

    configurePlayer();

    // Liveness watchdog: ensure continuous playback without freezing or stopping
    const livenessTimer = setInterval(() => {
      try {
        const state = (player.currentState || '').toLowerCase();
        if (state === 'paused' || state === 'stopped' || state === 'completed' || state === 'frozen') {
          if (typeof player.seek === 'function' && (state === 'completed' || state === 'stopped')) {
            player.seek(0);
          }
          if (typeof player.play === 'function') {
            player.play();
          }
        }
      } catch (e) {}
    }, 1000);

    return () => {
      player.removeEventListener('ready', configurePlayer);
      player.removeEventListener('load', configurePlayer);
      player.removeEventListener('complete', restartAndPlay);
      player.removeEventListener('stop', restartAndPlay);
      clearInterval(livenessTimer);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      try {
        const data = await productService.getProducts({ limit: 100 });
        if (isMounted) {
          setProducts(data.products || []);
        }
      } catch (err) {
        console.warn('Error loading products for home page:', err?.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Re-align scroll position to target hash once dynamic product sections have loaded and DOM has stabilized
  useEffect(() => {
    if (!loading) {
      const hash = window.location.hash;
      if (hash) {
        const timer = setTimeout(() => {
          const element = document.querySelector(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 120);
        return () => clearTimeout(timer);
      }
    }
  }, [loading]);

  const laptopProducts = products.filter(isLaptopProduct).slice(0, 4);
  const hardwareProducts = products.filter(isHardwareProduct).slice(0, 4);
  const cameraProducts = products.filter(isCameraProduct).slice(0, 4);
  const droneProducts = products.filter(isDroneProduct).slice(0, 4);

  return (
    <div>
      {/* 1. FULL-VIEWPORT CINEMATIC VIDEO HERO */}
      <VideoHero />

      {/* 2. ORIGINAL HERO SECTION WITH DOTLOTTIE ANIMATION */}
      <section className="hero-section" id="originalHero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge-tag">
              <i className="fa-solid fa-microchip"></i> High Performance Technology
            </div>
            <h1 className="hero-title">Next-Gen PC Hardware &amp; Performance Components</h1>
            <p className="hero-subtitle">
              Power your custom gaming rigs and workstations with authentic processors, graphics cards, memory,
              and storage backed by official islandwide warranty.
            </p>
            <div className="hero-ctas">
              <Link to="/products" className="btn btn-primary" style={{ padding: '13px 26px', fontSize: '0.98rem' }}>
                <i className="fa-solid fa-bag-shopping"></i> Shop Now
              </Link>
              <a
                href="#categoriesSection"
                className="btn btn-outline"
                style={{ padding: '13px 26px', fontSize: '0.98rem' }}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById('categoriesSection');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    window.history.pushState(null, '', '#categoriesSection');
                  }
                }}
              >
                <i className="fa-solid fa-layer-group"></i> Explore Categories
              </a>
            </div>

            <div className="hero-features-bar">
              <div className="feature-item">
                <i className="fa-solid fa-shield-check"></i>
                <span>100% Genuine</span>
              </div>
              <div className="feature-item">
                <i className="fa-solid fa-truck-fast"></i>
                <span>Islandwide Delivery</span>
              </div>
              <div className="feature-item">
                <i className="fa-solid fa-credit-card"></i>
                <span>PayHere Secured</span>
              </div>
            </div>
          </div>

          <div className="hero-media-wrapper">
            <dotlottie-player
              ref={lottieRef}
              src="/animation/Welcome Animation.lottie"
              background="transparent"
              speed="1"
              style={{ width: '100%', maxWidth: '440px', height: '380px' }}
              loop="true"
              autoplay="true"
            ></dotlottie-player>
          </div>
        </div>
      </section>

      {/* 3. CATEGORIES SECTION */}
      <section className="categories-section" id="categoriesSection">
        <div className="section-header-center">
          <h3>Major Component Categories</h3>
          <p>Select a category to browse specific high-performance hardware</p>
        </div>

        <div className="category-grid">
          <Link to="/products?category=Processors" className="category-card">
            <div className="category-icon"><i className="fa-solid fa-microchip"></i></div>
            <div className="category-name">Processors</div>
            <div className="category-count">Intel &amp; AMD Ryzen</div>
          </Link>
          <Link to="/products?category=Graphics Cards" className="category-card">
            <div className="category-icon"><i className="fa-solid fa-gamepad"></i></div>
            <div className="category-name">Graphics Cards</div>
            <div className="category-count">NVIDIA RTX &amp; AMD Radeon</div>
          </Link>
          <Link to="/products?category=RAM" className="category-card">
            <div className="category-icon"><i className="fa-solid fa-memory"></i></div>
            <div className="category-name">Memory (RAM)</div>
            <div className="category-count">DDR4 &amp; DDR5 Modules</div>
          </Link>
          <Link to="/products?category=Storage" className="category-card">
            <div className="category-icon"><i className="fa-solid fa-hard-drive"></i></div>
            <div className="category-name">SSDs &amp; Storage</div>
            <div className="category-count">NVMe M.2 &amp; SATA Drives</div>
          </Link>
          <Link to="/products?category=Motherboards" className="category-card">
            <div className="category-icon"><i className="fa-solid fa-network-wired"></i></div>
            <div className="category-name">Motherboards</div>
            <div className="category-count">Intel &amp; AMD Chipsets</div>
          </Link>
          <Link to="/products?category=Power Supplies" className="category-card">
            <div className="category-icon"><i className="fa-solid fa-bolt"></i></div>
            <div className="category-name">Power Supplies</div>
            <div className="category-count">80 Plus Gold &amp; Platinum</div>
          </Link>
        </div>
      </section>

      {/* 4. NEW LAPTOP ARRIVALS */}
      <section className="featured-section">
        <div className="featured-container">
          <div className="section-header-center">
            <h3>New Laptop Arrivals</h3>
            <p>Explore the latest laptops built for work, gaming, and everyday performance.</p>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Loading laptops...</p>
          ) : laptopProducts.length > 0 ? (
            <div className="featured-grid">
              {laptopProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No laptop products currently available.</p>
          )}

          <div style={{ textAlign: 'center' }}>
            <Link to="/products?category=Laptops" className="btn btn-outline" style={{ padding: '12px 30px', fontSize: '0.95rem' }}>
              View All Laptops <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. SECOND CINEMATIC BANNER (hero2.mp4) - NEXT-GEN HARDWARE */}
      <section className="cinematic-banner-section">
        <div className="cinematic-banner-frame">
          <video className="cinematic-banner-video" autoPlay muted loop playsInline preload="auto">
            <source src="/assets/videos/hero2.mp4" type="video/mp4" />
          </video>
          <div className="cinematic-banner-overlay"></div>
          <div className="cinematic-banner-content">
            <div className="cinematic-banner-tag">
              <i className="fa-solid fa-bolt"></i> Next-Level Performance
            </div>
            <h2 className="cinematic-banner-heading">Next-Gen Hardware</h2>
            <p className="cinematic-banner-subtext">
              Discover the latest components engineered to power your ultimate setup.
            </p>
            <div className="cinematic-banner-actions">
              <Link to="/products" className="btn btn-primary" style={{ padding: '13px 28px', fontSize: '0.98rem' }}>
                <i className="fa-solid fa-fire"></i> Shop High Performance
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. NEXT-GEN HARDWARE GRID */}
      <section className="featured-section" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
        <div className="featured-container">
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Loading components...</p>
          ) : hardwareProducts.length > 0 ? (
            <div className="featured-grid">
              {hardwareProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No hardware components currently available.</p>
          )}

          <div style={{ textAlign: 'center' }}>
            <Link to="/products" className="btn btn-outline" style={{ padding: '12px 30px', fontSize: '0.95rem' }}>
              View All Products <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. THIRD CINEMATIC BANNER (hero3.mp4) - CAMERA COLLECTION */}
      <section className="cinematic-hero3-section">
        <div className="cinematic-hero3-frame">
          <video className="cinematic-hero3-video" autoPlay muted loop playsInline preload="auto">
            <source src="/assets/videos/hero3.mp4" type="video/mp4" />
          </video>
          <div className="cinematic-hero3-overlay"></div>
          <div className="cinematic-hero3-content">
            <div className="cinematic-hero3-tag">
              <i className="fa-solid fa-camera"></i> Cinematic Camera Collection
            </div>
            <h2 className="cinematic-hero3-heading">Cinematic Camera Collection</h2>
            <p className="cinematic-hero3-subtext">
              Capture every moment in stunning detail with cameras built for cinematic storytelling, professional photography, and creative adventures.
            </p>
            <div className="cinematic-hero3-actions">
              <Link to="/products?category=Cameras" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1rem' }}>
                <i className="fa-solid fa-camera"></i> Explore Cameras
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CINEMATIC CAMERA COLLECTION GRID */}
      <section className="featured-section" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
        <div className="featured-container">
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Loading cameras...</p>
          ) : cameraProducts.length > 0 ? (
            <div className="featured-grid">
              {cameraProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No camera products currently available.</p>
          )}

          <div style={{ textAlign: 'center' }}>
            <Link to="/products?category=Cameras" className="btn btn-outline" style={{ padding: '12px 30px', fontSize: '0.95rem' }}>
              View All Cameras <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* 9. FOURTH CINEMATIC BANNER (hero4.mp4) - DRONE COLLECTION */}
      <section className="cinematic-hero4-section">
        <div className="cinematic-hero4-frame">
          <video className="cinematic-hero4-video" autoPlay muted loop playsInline preload="auto">
            <source src="/assets/videos/hero4.mp4" type="video/mp4" />
          </video>
          <div className="cinematic-hero4-overlay"></div>
          <div className="cinematic-hero4-content">
            <div className="cinematic-hero4-tag">
              <i className="fa-solid fa-plane-up"></i> Next-Gen Drone Collection
            </div>
            <h2 className="cinematic-hero4-heading">Drone Zone</h2>
            <p className="cinematic-hero4-subtext">
              Take your creativity to new heights with advanced drones built for stunning aerial footage, exploration, and adventure.
            </p>
            <div className="cinematic-hero4-actions">
              <Link to="/products?category=Drones" className="btn btn-primary" style={{ padding: '14px 32px', fontSize: '1rem' }}>
                <i className="fa-solid fa-plane-up"></i> Explore Drones
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 10. DRONE ZONE GRID */}
      <section className="featured-section" style={{ paddingTop: '20px', paddingBottom: '60px' }}>
        <div className="featured-container">
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Loading drones...</p>
          ) : droneProducts.length > 0 ? (
            <div className="featured-grid">
              {droneProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>No drone products currently available.</p>
          )}

          <div style={{ textAlign: 'center' }}>
            <Link to="/products?category=Drones" className="btn btn-outline" style={{ padding: '12px 30px', fontSize: '0.95rem' }}>
              View All Drones <i className="fa-solid fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>


      {/* 11. WHY CHOOSE G LAB SECTION */}
      <section className="why-section" id="whyGlab">
        <div className="section-header-center">
          <h3>Why Choose G LAB</h3>
          <p>Your trusted hardware partner for custom builds and upgrades</p>
        </div>

        <div className="why-grid">
          <div className="why-card">
            <div className="why-icon"><i className="fa-solid fa-certificate"></i></div>
            <h4>Quality Components</h4>
            <p>All products are 100% authentic, brand-new, and covered under official manufacturer warranty.</p>
          </div>

          <div className="why-card">
            <div className="why-icon"><i className="fa-solid fa-shield-halved"></i></div>
            <h4>Secure Payments</h4>
            <p>Checkout safely with encrypted local PayHere Sandbox payment integration and instant confirmation.</p>
          </div>

          <div className="why-card">
            <div className="why-icon"><i className="fa-solid fa-truck-ramp-box"></i></div>
            <h4>Fast Delivery</h4>
            <p>Reliable Islandwide shipping ensuring your delicate computer hardware arrives safely at your door.</p>
          </div>

          <div className="why-card">
            <div className="why-icon"><i className="fa-solid fa-headset"></i></div>
            <h4>Trusted Service</h4>
            <p>Dedicated technical assistance for custom PC builds, compatibility checks, and post-purchase support.</p>
          </div>
        </div>
      </section>

      {/* 12. CALL TO ACTION BANNER */}
      <section className="cta-section">
        <div className="cta-container">
          <h3>Ready to Build Your Dream Rig?</h3>
          <p>Browse our complete catalog of CPUs, GPUs, RAM, and accessories with instant stock availability.</p>
          <Link to="/products" className="btn btn-white" style={{ padding: '14px 32px', fontSize: '1rem' }}>
            <i className="fa-solid fa-layer-group"></i> Explore Full Catalog
          </Link>
        </div>
      </section>
    </div>
  );
}
