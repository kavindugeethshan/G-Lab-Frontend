import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-brand-col">
          <Link to="/" className="logo-title">
            <div className="logo-icon">G</div>
            <div className="logo-text">
              <h1>G LAB</h1>
              <span>COMPUTER HARDWARE</span>
            </div>
          </Link>
          <p className="footer-brand-desc">
            Sri Lanka's premier destination for genuine computer hardware, high-performance laptops, custom PC components, and cutting-edge gaming gear.
          </p>
          <div className="footer-social-links">
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook">
              <i className="fa-brands fa-facebook-f"></i>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
              <i className="fa-brands fa-instagram"></i>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
              <i className="fa-brands fa-x-twitter"></i>
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
              <i className="fa-brands fa-linkedin-in"></i>
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h4>Explore</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/products">All Products</Link></li>
            <li><Link to="/cart">My Cart</Link></li>
            <li><Link to="/profile">My Account</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Categories</h4>
          <ul>
            <li><Link to="/products?category=Laptops">Laptops</Link></li>
            <li><Link to="/products?category=GPU">Graphics Cards</Link></li>
            <li><Link to="/products?category=CPU">Processors</Link></li>
            <li><Link to="/products?category=RAM">Memory (RAM)</Link></li>
            <li><Link to="/products?category=SSD">Storage & SSDs</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Customer Care</h4>
          <ul>
            <li><i className="fa-solid fa-location-dot" style={{ marginRight: '6px' }}></i> Colombo, Sri Lanka</li>
            <li><i className="fa-solid fa-envelope" style={{ marginRight: '6px' }}></i> support@glab.lk</li>
            <li><i className="fa-solid fa-phone" style={{ marginRight: '6px' }}></i> +94 11 234 5678</li>
            <li><i className="fa-solid fa-truck" style={{ marginRight: '6px' }}></i> Islandwide Express Delivery</li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <div>
          &copy; {new Date().getFullYear()} <strong>G LAB</strong>. All rights reserved.
        </div>
        <div className="footer-developer-credit">
          Designed &amp; Engineered by <span>Kavindu Geethshan</span>
        </div>
      </div>
    </footer>
  );
}
