import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { calculateDiscountPrice } from '../../utils/formatters';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();

  if (!product) return null;

  const price = Number(product.price || 0);
  const discount = Number(product.discount || 0);
  const finalPrice = calculateDiscountPrice(price, discount);
  const hasDiscount = discount > 0;
  const isOutOfStock = Number(product.stock || 0) <= 0;

  const imageUrl = (product.images && product.images.length > 0)
    ? product.images[0]
    : (product.Image || product.image || DEFAULT_IMAGE);

  const priceFormatted = finalPrice.toLocaleString('en-US');

  return (
    <div className="product-card">
      <div>
        <div className="product-image-container">
          <img
            src={imageUrl}
            alt={product.name || 'Component'}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = DEFAULT_IMAGE;
            }}
          />
          {hasDiscount && (
            <span className="product-discount-badge">-{discount}% OFF</span>
          )}
        </div>

        <span className="product-category">{product.category || 'Hardware'}</span>
        <h4 className="product-title" title={product.name}>
          <Link to={`/products/${product._id}`}>{product.name || 'Component'}</Link>
        </h4>
        <p className="product-details">{product.description || 'High performance computer component.'}</p>
      </div>

      <div className="product-footer">
        <div className="product-price-wrapper">
          <div className="product-price">Rs. {priceFormatted}</div>
          {hasDiscount && (
            <div className="product-original-price">
              Rs. {price.toLocaleString('en-US')}
            </div>
          )}
        </div>

        <div className="product-actions">
          <Link to={`/products/${product._id}`} className="btn btn-outline btn-sm">
            Details
          </Link>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => addToCart(product._id, 1)}
            disabled={isOutOfStock}
          >
            <i className="fa-solid fa-cart-plus"></i> Add
          </button>
        </div>
      </div>
    </div>
  );
}
