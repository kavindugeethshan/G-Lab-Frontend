import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, calculateDiscountPrice } from '../utils/formatters';
import './ProductDetailPage.css';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  // Review form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Inline edit review state
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  const currentUserId = user?._id || user?.id || null;

  const loadProductDetail = async () => {
    try {
      const prodData = await productService.getProductById(id);
      const p = prodData.product || prodData;
      setProduct(p);
      const allImages = p.images && p.images.length > 0 ? p.images : [(p.Image || p.image || DEFAULT_IMAGE)];
      setSelectedImage(allImages[0]);
    } catch (err) {
      showToast('Failed to load product details', 'error');
    }
  };

  const loadRatingSummary = async () => {
    try {
      const data = await productService.getProductRating(id);
      setRatingSummary(data);
    } catch {
      // fallback
    }
  };

  const loadReviews = async () => {
    try {
      const data = await productService.getProductReviews(id);
      setReviews(data.reviews || data || []);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      setLoading(true);
      await Promise.all([loadProductDetail(), loadRatingSummary(), loadReviews()]);
      if (isMounted) setLoading(false);
    };
    init();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      showToast('Please sign in to add items to your shopping cart.', 'error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    await addToCart(product._id, quantity);
  };

  const handleBuyNow = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      showToast('Please sign in to make a purchase.', 'error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    const ok = await addToCart(product._id, quantity);
    if (ok) {
      navigate('/cart');
    }
  };

  const handleQuantityChange = (delta) => {
    const stock = Number(product?.stock || 1);
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > stock) return stock;
      return next;
    });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please sign in to submit a review.', 'error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    if (!newComment.trim()) {
      showToast('Please write a comment for your review.', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      await productService.addReview(id, {
        rating: Number(newRating),
        comment: newComment.trim(),
      });
      showToast('🎉 Review posted successfully!', 'success');
      setNewComment('');
      setNewRating(5);
      await Promise.all([loadReviews(), loadRatingSummary(), loadProductDetail()]);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleStartEditReview = (rev) => {
    setEditingReviewId(rev._id);
    setEditRating(rev.rating || 5);
    setEditComment(rev.comment || '');
  };

  const handleSaveEditReview = async (revId) => {
    try {
      await productService.updateReview(revId, {
        rating: Number(editRating),
        comment: editComment.trim(),
      });
      showToast('Review updated successfully!', 'success');
      setEditingReviewId(null);
      await Promise.all([loadReviews(), loadRatingSummary(), loadProductDetail()]);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update review', 'error');
    }
  };

  const handleDeleteReview = async (revId) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    try {
      await productService.deleteReview(revId);
      showToast('Review deleted successfully', 'info');
      setReviews((prev) => prev.filter((r) => r._id !== revId));
      await Promise.all([loadRatingSummary(), loadProductDetail()]);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete review', 'error');
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>
          <i className="fa-solid fa-circle-notch fa-spin fa-2x" style={{ color: 'var(--accent-color)', marginBottom: '14px', display: 'block' }}></i>
          Loading product specifications...
        </p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2>Product Not Found</h2>
        <p style={{ color: 'var(--text-muted)', margin: '14px 0 24px 0' }}>The product you are looking for does not exist or has been removed.</p>
        <Link to="/products" className="btn btn-primary">Browse All Products</Link>
      </div>
    );
  }

  const origPrice = Number(product.price || 0);
  const discount = Number(product.discount || 0);
  const discPrice = calculateDiscountPrice(origPrice, discount);
  const stock = Number(product.stock !== undefined ? product.stock : 0);

  let stockClass = 'stock-in';
  let stockText = `In Stock (${stock} available)`;
  if (stock === 0) {
    stockClass = 'stock-out';
    stockText = 'Out of Stock';
  } else if (stock <= 5) {
    stockClass = 'stock-low';
    stockText = `Low Stock (${stock} left)`;
  }

  const allImages = product.images && product.images.length > 0
    ? product.images
    : [(product.Image || product.image || DEFAULT_IMAGE)];
  const currentImg = selectedImage || allImages[0];

  const avgRating = ratingSummary?.ratingAverage !== undefined
    ? ratingSummary.ratingAverage
    : (product.ratingAverage || 0);
  const ratingCount = ratingSummary?.ratingCount !== undefined
    ? ratingSummary.ratingCount
    : (product.ratingCount || reviews.length);

  return (
    <div className="page-container">
      {/* BREADCRUMB NAVIGATION */}
      <div className="breadcrumb">
        <Link to="/"><i className="fa-solid fa-house"></i> Home</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.7rem' }}></i>
        <Link to="/products">All Products</Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.7rem' }}></i>
        <Link to={`/products?category=${encodeURIComponent(product.category || '')}`}>
          {product.category || 'Hardware'}
        </Link>
        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.7rem' }}></i>
        <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{product.name}</span>
      </div>

      {/* 1. PRODUCT SHOWCASE CARD */}
      <div className="product-showcase-card">
        {/* LEFT: IMAGE GALLERY */}
        <div className="product-gallery-side">
          <div className="main-image-box">
            <img
              id="mainProductImage"
              src={currentImg}
              alt={product.name}
              onError={(e) => {
                e.currentTarget.src = DEFAULT_IMAGE;
              }}
            />
            {discount > 0 && (
              <span className="discount-badge">-{discount}% OFF</span>
            )}
          </div>

          {allImages.length > 1 && (
            <div className="thumbnail-row">
              {allImages.map((img, i) => (
                <div
                  key={i}
                  className={`thumb-item ${currentImg === img ? 'active' : ''}`}
                  onClick={() => setSelectedImage(img)}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${i + 1}`}
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_IMAGE;
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: PRODUCT INFO & PURCHASE */}
        <div className="product-info-side">
          <div>
            <div className="badge-row">
              <span className="pill-badge">{product.category || 'Hardware'}</span>
              <span className="pill-badge">{product.brand || 'G LAB Official'}</span>
              <span className={`stock-badge ${stockClass}`}>{stockText}</span>
            </div>

            <h1 className="product-main-title">{product.name}</h1>

            <div className="rating-summary-row">
              <span className="stars-gold">
                <i className="fa-solid fa-star"></i> {avgRating > 0 ? `${avgRating} / 5` : 'No ratings yet'}
              </span>
              <span>•</span>
              <span id="reviewCountHeader" style={{ color: 'var(--text-muted)' }}>
                {ratingCount} Review{ratingCount === 1 ? '' : 's'}
              </span>
            </div>

            <div className="price-box">
              <span className="price-current">{formatPrice(discPrice)}</span>
              {discount > 0 && (
                <span className="price-original">{formatPrice(origPrice)}</span>
              )}
            </div>

            <p className="short-desc">
              {product.description || 'High performance genuine computer component with manufacturer warranty.'}
            </p>
          </div>

          <div>
            <div className="purchase-controls-row">
              <div className="qty-picker">
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1 || stock === 0}
                >
                  -
                </button>
                <input
                  type="number"
                  id="purchaseQty"
                  value={quantity}
                  min="1"
                  max={stock}
                  className="qty-input"
                  readOnly
                />
                <button
                  type="button"
                  className="qty-btn"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= stock || stock === 0}
                >
                  +
                </button>
              </div>

              <div className="action-btns-group">
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '13px' }}
                  onClick={handleAddToCart}
                  disabled={stock === 0}
                >
                  <i className="fa-solid fa-cart-plus"></i> Add to Cart
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  style={{ flex: 1, padding: '13px' }}
                  onClick={handleBuyNow}
                  disabled={stock === 0}
                >
                  <i className="fa-solid fa-bolt"></i> Buy Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PRODUCT SPECIFICATIONS & OVERVIEW */}
      <div className="details-section-card">
        <div className="section-heading">
          <span><i className="fa-solid fa-list-check" style={{ color: 'var(--accent-color)' }}></i> Product Specifications</span>
        </div>

        <table className="specs-table">
          <tbody>
            <tr>
              <td className="spec-name">Product ID</td>
              <td className="spec-value" style={{ fontFamily: 'monospace' }}>{product._id}</td>
            </tr>
            <tr>
              <td className="spec-name">Category</td>
              <td className="spec-value">{product.category || 'Computer Hardware'}</td>
            </tr>
            <tr>
              <td className="spec-name">Brand / Manufacturer</td>
              <td className="spec-value">{product.brand || 'Official Authorized'}</td>
            </tr>
            <tr>
              <td className="spec-name">Stock Status</td>
              <td className="spec-value">{stockText}</td>
            </tr>
            <tr>
              <td className="spec-name">Warranty Period</td>
              <td className="spec-value">1 to 3 Years Official Manufacturer Warranty</td>
            </tr>
            <tr>
              <td className="spec-name">Shipping</td>
              <td className="spec-value">Fast Insured Islandwide Courier Delivery</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 3. CUSTOMER REVIEWS SECTION */}
      <div className="details-section-card">
        <div className="section-heading">
          <span><i className="fa-solid fa-comments" style={{ color: 'var(--accent-color)' }}></i> Customer Reviews & Ratings</span>
        </div>

        {/* Write Review Form */}
        <div className="write-review-box">
          <h4 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.05rem', marginBottom: '12px' }}>
            Write a Review for this Component
          </h4>
          <form onSubmit={handleReviewSubmit}>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
                Rating (1 to 5 Stars) *
              </label>
              <select
                id="newReviewRating"
                className="form-select"
                value={newRating}
                onChange={(e) => setNewRating(Number(e.target.value))}
              >
                <option value="5">⭐⭐⭐⭐⭐ (5/5 Stars)</option>
                <option value="4">⭐⭐⭐⭐ (4/5 Stars)</option>
                <option value="3">⭐⭐⭐ (3/5 Stars)</option>
                <option value="2">⭐⭐ (2/5 Stars)</option>
                <option value="1">⭐ (1/5 Star)</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: '6px' }}>
                Review Comment *
              </label>
              <textarea
                id="newReviewComment"
                className="form-textarea"
                rows="3"
                placeholder="Share your experience regarding performance, build quality, and setup..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              ></textarea>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submittingReview}
            >
              {submittingReview ? 'Submitting Review...' : 'Submit Review'}
            </button>
          </form>
        </div>

        {/* Reviews List */}
        <div id="reviewsList" style={{ marginTop: '20px' }}>
          {reviews.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
              No customer reviews yet. Be the first to share your feedback!
            </p>
          ) : (
            reviews.map((r) => {
              const reviewer = r.user || {};
              const reviewerId = reviewer._id || (typeof r.user === 'string' ? r.user : null);
              const isOwnReview = currentUserId && reviewerId && (String(currentUserId) === String(reviewerId));
              const reviewerName = `${reviewer.firstname || ''} ${reviewer.lastname || ''}`.trim() || 'Verified Buyer';
              const reviewDate = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '';
              const isEditing = editingReviewId === r._id;

              return (
                <div key={r._id} className="review-card" id={`review-card-${r._id}`}>
                  <div className="review-header">
                    <span className="review-author">
                      <i className="fa-solid fa-user-check" style={{ color: 'var(--accent-color)' }}></i> {reviewerName}
                      {isOwnReview && (
                        <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, marginLeft: '6px' }}>
                          Your Review
                        </span>
                      )}
                    </span>
                    <div>
                      <span className="review-stars">⭐ {r.rating} / 5</span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                        {reviewDate}
                      </span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    {r.comment || 'No text comment.'}
                  </p>

                  {/* Inline Edit Box */}
                  {isEditing && (
                    <div style={{ marginTop: '14px', background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                        Update Rating:
                      </label>
                      <select
                        className="form-select"
                        style={{ marginBottom: '8px' }}
                        value={editRating}
                        onChange={(e) => setEditRating(Number(e.target.value))}
                      >
                        <option value="5">⭐⭐⭐⭐⭐ (5/5)</option>
                        <option value="4">⭐⭐⭐⭐ (4/5)</option>
                        <option value="3">⭐⭐⭐ (3/5)</option>
                        <option value="2">⭐⭐ (2/5)</option>
                        <option value="1">⭐ (1/5)</option>
                      </select>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                        Update Comment:
                      </label>
                      <textarea
                        className="form-textarea"
                        rows="2"
                        style={{ marginBottom: '10px' }}
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                      ></textarea>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                          onClick={() => handleSaveEditReview(r._id)}
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                          onClick={() => setEditingReviewId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {isOwnReview && !isEditing && (
                    <div className="review-actions">
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                        onClick={() => handleStartEditReview(r)}
                      >
                        <i className="fa-solid fa-pen-to-square"></i> Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: '4px 12px', fontSize: '0.78rem' }}
                        onClick={() => handleDeleteReview(r._id)}
                      >
                        <i className="fa-solid fa-trash"></i> Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
