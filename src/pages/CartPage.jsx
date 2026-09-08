import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';
import { authService } from '../services/authService';
import { formatPrice } from '../utils/formatters';
import './CartPage.css';

const DEFAULT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='70' height='70' viewBox='0 0 70 70'%3E%3Crect width='70' height='70' fill='%23f1f5f9' rx='12' stroke='%23e2e8f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='26'%3E💻%3C/text%3E%3C/svg%3E";
const SHIPPING_FEE = 500;

export default function CartPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartTotal, loadCart } = useCart();
  const { user, updateUser, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  // Payment Method State: 'Card' or 'COD'
  const [paymentMethod, setPaymentMethod] = useState('Card');

  // Delivery Address State
  const [currentAddress, setCurrentAddress] = useState(null);
  const [isCustomAddress, setIsCustomAddress] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [modalAddress, setModalAddress] = useState({
    fullName: '',
    phone: '',
    addressLine: '',
    city: '',
    province: '',
    postalCode: '',
    saveDefault: false,
  });
  const [modalError, setModalError] = useState('');

  // Orders State
  const [orders, setOrders] = useState([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Single Order Search
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearchingOrder, setIsSearchingOrder] = useState(false);

  // Cancel Order Modal State
  const [cancelConfirmOrderId, setCancelConfirmOrderId] = useState(null);
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);

  // Checkout submission loading
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Initialize Address from Profile or Session
  useEffect(() => {
    const savedCustom = sessionStorage.getItem('customCheckoutAddress');
    if (savedCustom) {
      try {
        const parsed = JSON.parse(savedCustom);
        setCurrentAddress(parsed);
        setIsCustomAddress(true);
        return;
      } catch (e) {
        // fallback
      }
    }

    if (user) {
      const addr = user.address && typeof user.address === 'object' ? user.address : {};
      const fallbackName = `${user.firstname || ''} ${user.lastname || ''}`.trim() || user.name || '';
      setCurrentAddress({
        fullName: addr.fullName || fallbackName,
        phone: addr.phone || user.phone || '',
        addressLine: addr.addressLine || (typeof user.address === 'string' ? user.address : ''),
        city: addr.city || '',
        district: addr.district || '',
        province: addr.province || addr.district || '',
        postalCode: addr.postalCode || '',
      });
      setIsCustomAddress(false);
    }
  }, [user]);

  // Load orders on mount or when hash changes
  useEffect(() => {
    if (isAuthenticated) {
      loadMyOrders();
    }
    if (location.hash === '#my-orders') {
      const el = document.getElementById('myOrdersSection');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isAuthenticated, location.hash]);

  const loadMyOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await orderService.getMyOrders();
      setOrders(Array.isArray(data?.orders) ? data.orders : (Array.isArray(data) ? data : []));
    } catch (err) {
      showToast('Failed to load past orders', 'error');
    } finally {
      setLoadingOrders(false);
    }
  };

  const safeCartItems = Array.isArray(cartItems) ? cartItems : [];
  const safeOrders = Array.isArray(orders) ? orders : [];

  // Calculations
  const uniqueItemsCount = safeCartItems.length;
  const totalQuantity = safeCartItems.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);

  const subtotalOriginal = safeCartItems.reduce((acc, item) => {
    const p = item.product || item;
    const price = Number(item.originalPrice !== undefined ? item.originalPrice : (p.price || 0));
    return acc + price * (Number(item.quantity) || 1);
  }, 0);

  const finalItemsTotal = safeCartItems.reduce((acc, item) => {
    const p = item.product || item;
    const origPrice = Number(item.originalPrice !== undefined ? item.originalPrice : (p.price || 0));
    const discount = Number(item.discount !== undefined ? item.discount : (p.discount || 0));
    const unitPrice = item.discountedPrice !== undefined ? Number(item.discountedPrice) : (discount > 0 ? origPrice * (1 - discount / 100) : origPrice);
    return acc + unitPrice * (Number(item.quantity) || 1);
  }, 0);

  const totalDiscount = Math.max(0, subtotalOriginal - finalItemsTotal);
  const payableGrandTotal = safeCartItems.length > 0 ? finalItemsTotal + SHIPPING_FEE : 0;

  // Address Modal Handlers
  const handleOpenAddressModal = () => {
    setModalError('');
    setModalAddress({
      fullName: currentAddress?.fullName || `${user?.firstname || ''} ${user?.lastname || ''}`.trim(),
      phone: currentAddress?.phone || user?.phone || '',
      addressLine: currentAddress?.addressLine || '',
      city: currentAddress?.city || '',
      province: currentAddress?.province || currentAddress?.district || '',
      postalCode: currentAddress?.postalCode || '',
      saveDefault: false,
    });
    setIsAddressModalOpen(true);
  };

  const handleCloseAddressModal = () => {
    setIsAddressModalOpen(false);
    setModalError('');
  };

  const handleResetToDefaultAddress = () => {
    sessionStorage.removeItem('customCheckoutAddress');
    setIsCustomAddress(false);
    const addr = user?.address && typeof user.address === 'object' ? user.address : {};
    setCurrentAddress({
      fullName: addr.fullName || `${user?.firstname || ''} ${user?.lastname || ''}`.trim(),
      phone: addr.phone || user?.phone || '',
      addressLine: addr.addressLine || (typeof user?.address === 'string' ? user?.address : ''),
      city: addr.city || '',
      district: addr.district || '',
      province: addr.province || addr.district || '',
      postalCode: addr.postalCode || '',
    });
    setIsAddressModalOpen(false);
    showToast('Restored account default address.', 'info');
  };

  const handleSaveAddressModal = async (e) => {
    e.preventDefault();
    const cleanPhone = (modalAddress.phone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setModalError('Phone number must be exactly 10 digits.');
      return;
    }
    if (!modalAddress.fullName.trim() || !modalAddress.addressLine.trim() || !modalAddress.city.trim() || !modalAddress.postalCode.trim()) {
      setModalError('Please fill in all required address fields.');
      return;
    }

    const updated = {
      fullName: modalAddress.fullName.trim(),
      phone: cleanPhone,
      addressLine: modalAddress.addressLine.trim(),
      city: modalAddress.city.trim(),
      district: modalAddress.province.trim(),
      province: modalAddress.province.trim(),
      postalCode: modalAddress.postalCode.trim(),
    };

    setCurrentAddress(updated);
    setIsCustomAddress(true);
    sessionStorage.setItem('customCheckoutAddress', JSON.stringify(updated));

    if (modalAddress.saveDefault && isAuthenticated) {
      try {
        await authService.updateAddress(updated);
        updateUser({ address: updated, phone: cleanPhone });
        showToast('Address saved as account default!', 'success');
      } catch (err) {
        showToast('Saved for this order only.', 'info');
      }
    } else {
      showToast('Delivery address updated for this order.', 'success');
    }

    setIsAddressModalOpen(false);
  };

  // Place Order Flow
  const handleCheckoutSubmit = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in to complete your purchase.', 'error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    if (safeCartItems.length === 0) {
      showToast('Your shopping cart is empty.', 'error');
      return;
    }

    if (!currentAddress || !currentAddress.addressLine || !currentAddress.city || !currentAddress.postalCode) {
      showToast('Please set your delivery address before placing order.', 'error');
      handleOpenAddressModal();
      return;
    }

    setIsSubmittingOrder(true);
    showToast(paymentMethod === 'COD' ? 'Placing Cash on Delivery order...' : 'Initializing checkout...', 'loading');

    try {
      const orderPayload = {
        deliveryAddress: currentAddress,
        Diliveryaddress: currentAddress, // backend compatibility
        paymentMethod: paymentMethod,
        shippingAddress: `${currentAddress.addressLine}, ${currentAddress.city}, ${currentAddress.postalCode}`,
      };

      const orderRes = await orderService.createOrder(orderPayload);
      const createdOrder = orderRes.order || orderRes;

      if (paymentMethod === 'COD') {
        showToast('🎉 Order placed successfully! Cash on Delivery confirmed.', 'success');
        await clearCart();
        await loadMyOrders();
        // Scroll to orders section
        const el = document.getElementById('myOrdersSection');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Card / PayHere flow
        const paymentRes = await paymentService.createPayment({
          orderId: createdOrder._id,
          amount: payableGrandTotal,
          method: 'Card',
          customer: {
            first_name: user?.firstname || currentAddress.fullName.split(' ')[0] || 'Customer',
            last_name: user?.lastname || currentAddress.fullName.split(' ').slice(1).join(' ') || 'User',
            email: user?.email || 'customer@example.com',
            phone: currentAddress.phone || user?.phone || '0770000000',
            address: currentAddress.addressLine,
            city: currentAddress.city,
            country: 'Sri Lanka',
          },
        });

        const paymentId = paymentRes.payment?._id || paymentRes.payment?.id || paymentRes._id;
        await clearCart();
        navigate(`/checkout/payment/${paymentId}`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Order creation failed', 'error');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Trigger Cancel Order Confirmation Modal
  const handleCancelOrder = (orderId) => {
    setCancelConfirmOrderId(orderId);
  };

  // Confirm and Execute Cancellation
  const handleConfirmCancelOrder = async () => {
    if (!cancelConfirmOrderId) return;
    setIsCancellingOrder(true);
    try {
      await orderService.cancelOrder(cancelConfirmOrderId);
      showToast(`Order #${cancelConfirmOrderId} has been cancelled successfully`, 'info');
      setCancelConfirmOrderId(null);
      await loadMyOrders();
      if (searchResult && searchResult._id === cancelConfirmOrderId) {
        setSearchResult({
          ...searchResult,
          Orderstatus: 'Cancelled',
          status: 'Cancelled'
        });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to cancel order', 'error');
    } finally {
      setIsCancellingOrder(false);
    }
  };

  // Search Order by ID
  const handleSearchOrder = async (e) => {
    e.preventDefault();
    if (!searchOrderId.trim()) {
      showToast('Please enter an Order ID to search', 'error');
      return;
    }
    setIsSearchingOrder(true);
    try {
      const data = await orderService.getOrderById(searchOrderId.trim());
      setSearchResult(data.order || data);
    } catch (err) {
      showToast('Order not found or invalid Order ID', 'error');
      setSearchResult(null);
    } finally {
      setIsSearchingOrder(false);
    }
  };

  // Filter orders
  const filteredOrders = safeOrders.filter((o) => {
    if (orderStatusFilter === 'ALL') return true;
    const status = o.Orderstatus || o.status || 'Pending';
    return status.toLowerCase() === orderStatusFilter.toLowerCase();
  });

  const getStatusBadgeClass = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'confirmed':
        return 'badge-confirmed';
      case 'shipped':
        return 'badge-shipped';
      case 'delivered':
        return 'badge-delivered';
      case 'cancelled':
        return 'badge-cancelled';
      case 'pending':
      default:
        return 'badge-pending';
    }
  };

  return (
    <div className="container cart-page-container" style={{ maxWidth: '1240px', margin: '32px auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>
      {/* SECTION 1: SHOPPING CART MANAGEMENT */}
      <div className="section-card">
        <h2>🛒 Shopping Cart Management</h2>

        {/* Metrics Bar */}
        {safeCartItems.length > 0 && (
          <div className="metrics-grid" id="cartMetricsBar">
            <div className="metric-box">
              <div className="metric-label">Unique Products</div>
              <div className="metric-val" id="metricItemCount">{uniqueItemsCount}</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Total Quantity</div>
              <div className="metric-val" id="metricTotalQuantity">{totalQuantity}</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Total Discount</div>
              <div className="metric-val" style={{ color: 'var(--success-color)' }} id="metricTotalDiscount">
                Rs. {totalDiscount.toLocaleString()}
              </div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Payable Total</div>
              <div className="metric-val" style={{ color: 'var(--accent-color)' }} id="metricPayableTotal">
                Rs. {payableGrandTotal.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Split Layout Container for Cart & Summary */}
        <div className="cart-grid-layout">
          {/* Cart Items Container */}
          <div id="cartContent" style={{ flex: 1 }}>
            {safeCartItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  🛒 Your shopping cart is empty.
                </p>
                <Link to="/products" className="btn btn-primary">
                  <i className="fa-solid fa-store"></i> Explore Products
                </Link>
              </div>
            ) : (
              <div className="cart-table-wrapper">
                <table className="cart-table">
                  <thead>
                    <tr>
                      <th>Product Details</th>
                      <th>Unit Price</th>
                      <th>Quantity</th>
                      <th>Subtotal & Total</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {safeCartItems.map((item) => {
                      const product = item.product || item;
                      const pId = product._id || item.product;
                      const pName = product.name || 'Product';
                      const pCat = product.category || '';
                      const pBrand = product.brand || '';
                      const pStock = product.stock !== undefined ? product.stock : 999;
                      const pImg = (product.images && product.images[0]) || product.image || product.Image || DEFAULT_IMAGE;

                      const origPrice = Number(item.originalPrice !== undefined ? item.originalPrice : (product.price || 0));
                      const discPrice = Number(item.discountedPrice !== undefined ? item.discountedPrice : origPrice);
                      const discount = Number(item.discount !== undefined ? item.discount : (product.discount || 0));

                      const itemSubtotal = origPrice * item.quantity;
                      const itemTotal = discPrice * item.quantity;
                      const itemSaved = itemSubtotal - itemTotal;

                      return (
                        <tr key={pId} className="cart-item-row">
                          <td className="cart-td-product">
                            <div className="cart-product-content">
                              <img
                                src={pImg}
                                className="cart-item-img"
                                alt={pName}
                                onError={(e) => {
                                  e.currentTarget.src = DEFAULT_IMAGE;
                                }}
                              />
                              <div className="cart-product-meta">
                                <strong className="cart-product-name">
                                  <Link to={`/products/${pId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                    {pName}
                                  </Link>
                                </strong>
                                <div className="cart-badge-list">
                                  {pCat && <span className="cart-tag">{pCat}</span>}
                                  {pBrand && <span className="cart-tag">{pBrand}</span>}
                                </div>
                                <div className="cart-stock-status">
                                  Stock available: <strong style={{ color: pStock <= item.quantity ? 'var(--warning-color)' : 'var(--text-main)' }}>{pStock}</strong> units
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="cart-td-price">
                            <span className="mobile-td-label">Unit Price</span>
                            <div className="cart-price-data">
                              <strong className="cart-effective-price">Rs. {discPrice.toLocaleString()}</strong>
                              {discount > 0 && (
                                <div style={{ marginTop: '2px' }}>
                                  <span className="cart-strike-price">Rs. {origPrice.toLocaleString()}</span>
                                  <span className="discount-tag">-{discount}% OFF</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="cart-td-qty">
                            <span className="mobile-td-label">Quantity</span>
                            <div className="cart-qty-wrapper">
                              <div className="qty-picker">
                                <button
                                  type="button"
                                  className="qty-btn"
                                  onClick={() => updateQuantity(pId, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  className="cart-qty-input"
                                  value={item.quantity}
                                  min="1"
                                  max={pStock}
                                  readOnly
                                />
                                <button
                                  type="button"
                                  className="qty-btn"
                                  onClick={() => updateQuantity(pId, item.quantity + 1)}
                                  disabled={item.quantity >= pStock}
                                >
                                  +
                                </button>
                              </div>
                              {item.quantity >= pStock && (
                                <div className="cart-max-warning">Max stock reached</div>
                              )}
                            </div>
                          </td>
                          <td className="cart-td-total">
                            <span className="mobile-td-label">Total Amount</span>
                            <div className="cart-total-data">
                              <strong className="cart-total-amount">Rs. {itemTotal.toLocaleString()}</strong>
                              {itemSaved > 0 && (
                                <div className="cart-saved-badge">
                                  Save Rs. {itemSaved.toLocaleString()}
                                </div>
                              )}
                              <div className="cart-subtotal-sub">
                                Subtotal: Rs. {itemSubtotal.toLocaleString()}
                              </div>
                            </div>
                          </td>
                          <td className="cart-td-action">
                            <button
                              type="button"
                              className="btn btn-danger btn-remove"
                              onClick={() => removeFromCart(pId)}
                            >
                              🗑️ Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sticky Order Summary Side Panel */}
          {safeCartItems.length > 0 && (
            <div className="cart-summary" id="cartSummary">
              <div className="summary-header">Order Summary</div>
              <div className="summary-row">
                <span>Cart Subtotal (Original):</span>
                <span style={{ fontWeight: 600 }} id="cartSubtotal">Rs. {subtotalOriginal.toLocaleString()}</span>
              </div>
              <div className="summary-row">
                <span>Discount Savings:</span>
                <span style={{ color: 'var(--success-color)', fontWeight: 600 }} id="cartTotalDiscount">
                  - Rs. {totalDiscount.toLocaleString()}
                </span>
              </div>
              <div className="summary-row">
                <span>Shipping Fee:</span>
                <span style={{ fontWeight: 600, color: 'var(--warning-color)' }} id="cartShippingFee">
                  Rs. {SHIPPING_FEE.toLocaleString()}
                </span>
              </div>
              <div className="summary-row total-row">
                <span>Final Total:</span>
                <span className="total-price" id="cartGrandTotal">
                  Rs. {payableGrandTotal.toLocaleString()}
                </span>
              </div>

              {/* Delivery Address Review Section */}
              <div className="delivery-address-card" id="checkoutAddressCard">
                <div className="delivery-address-header">
                  <span className="delivery-address-heading">
                    <i className="fa-solid fa-location-dot" style={{ color: 'var(--accent-color)' }}></i> Delivery Address
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isCustomAddress && (
                      <button
                        type="button"
                        className="btn-change-address"
                        id="btnResetAddress"
                        onClick={handleResetToDefaultAddress}
                        style={{ background: '#f8fafc', borderColor: '#cbd5e1', color: '#64748b' }}
                        title="Reset to account default address"
                      >
                        <i className="fa-solid fa-rotate-left"></i> Reset
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-change-address"
                      id="btnChangeAddress"
                      onClick={handleOpenAddressModal}
                    >
                      <i className="fa-solid fa-pen-to-square"></i> Change
                    </button>
                  </div>
                </div>
                <div className="delivery-address-content" id="displayDeliveryAddress">
                  {currentAddress && currentAddress.addressLine ? (
                    <>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.88rem', marginBottom: '2px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                        <span>{currentAddress.fullName || 'Customer'}</span>
                        {currentAddress.phone && (
                          <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            📞 {currentAddress.phone}
                          </span>
                        )}
                        {isCustomAddress && (
                          <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
                            For this order
                          </span>
                        )}
                      </div>
                      <div style={{ color: '#475569', fontSize: '0.82rem', lineHeight: '1.4' }}>
                        {currentAddress.addressLine}, {currentAddress.city}{currentAddress.province ? `, ${currentAddress.province}` : ''} {currentAddress.postalCode}
                      </div>
                    </>
                  ) : (
                    <div style={{ color: '#b45309', fontSize: '0.83rem', lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 700 }}>⚠️ Delivery Address Required:</span>
                      <div style={{ color: '#64748b', marginTop: '2px' }}>Please set your delivery address before placing your order.</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Method Selection Section */}
              <div className="payment-method-card" id="checkoutPaymentMethodCard">
                <div className="payment-method-header">
                  <span className="payment-method-heading">
                    <i className="fa-solid fa-wallet" style={{ color: 'var(--accent-color)' }}></i> Payment Method
                  </span>
                  <span className="payment-method-selected-badge" id="selectedPaymentBadge">
                    {paymentMethod === 'Card' ? 'Card / Online' : 'Cash on Delivery'}
                  </span>
                </div>
                <div className="payment-options-grid">
                  {/* Option 1: Card / Online Payment */}
                  <label
                    className={`payment-option-pill ${paymentMethod === 'Card' ? 'active' : ''}`}
                    id="optCard"
                    onClick={() => setPaymentMethod('Card')}
                  >
                    <div className="payment-option-icon">
                      <i className="fa-solid fa-credit-card"></i>
                    </div>
                    <div className="payment-option-info">
                      <div className="payment-option-title">Credit / Debit Card</div>
                      <div className="payment-option-desc">Online payment via PayHere</div>
                    </div>
                    <div className="payment-check-circle">
                      <i className="fa-solid fa-circle-check"></i>
                    </div>
                  </label>

                  {/* Option 2: Cash on Delivery */}
                  <label
                    className={`payment-option-pill ${paymentMethod === 'COD' ? 'active' : ''}`}
                    id="optCOD"
                    onClick={() => setPaymentMethod('COD')}
                  >
                    <div className="payment-option-icon">
                      <i className="fa-solid fa-hand-holding-dollar"></i>
                    </div>
                    <div className="payment-option-info">
                      <div className="payment-option-title">Cash on Delivery (COD)</div>
                      <div className="payment-option-desc">Pay in cash when order arrives</div>
                    </div>
                    <div className="payment-check-circle">
                      <i className="fa-solid fa-circle-check"></i>
                    </div>
                  </label>
                </div>
              </div>

              <div className="summary-actions">
                <button
                  type="button"
                  className="btn btn-success"
                  id="btnCheckoutSubmit"
                  style={{ fontSize: '1.05rem', padding: '14px 24px', width: '100%' }}
                  onClick={handleCheckoutSubmit}
                  disabled={isSubmittingOrder}
                >
                  {isSubmittingOrder ? (
                    'Processing Order...'
                  ) : paymentMethod === 'Card' ? (
                    '💳 Checkout & Pay Online'
                  ) : (
                    '🚚 Place Cash on Delivery Order'
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ width: '100%', padding: '10px' }}
                  onClick={clearCart}
                >
                  🗑️ Clear Entire Cart
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: MY ORDERS HISTORY & FILTERING */}
      <div className="section-card" id="myOrdersSection">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h2>📦 My Order History</h2>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <select
              id="orderStatusFilter"
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              style={{ padding: '10px 16px', borderRadius: '10px', border: '1.5px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}
            >
              <option value="ALL">All Order Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <button
              type="button"
              className="btn btn-outline"
              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              onClick={loadMyOrders}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        <div id="myOrdersContainer">
          {loadingOrders ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '25px' }}>Loading your order history...</p>
          ) : filteredOrders.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '30px 0' }}>
              No past orders found.
            </p>
          ) : (
            filteredOrders.map((order) => {
              const orderDate = new Date(order.createdAt || Date.now()).toLocaleString();
              const status = order.Orderstatus || order.status || 'Pending';
              const addr = order.Diliveryaddress || order.deliveryAddress || {};
              const addressStr = [addr.addressLine, addr.city, addr.district, addr.postalCode].filter(Boolean).join(', ') || 'No address provided';
              const canCancel = status.toLowerCase() === 'pending' || status.toLowerCase() === 'confirmed';
              const totalUnits = (order.Products || []).reduce((s, p) => s + (p.quantity || 1), 0);

              return (
                <div key={order._id} className="order-card" style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
                  <div className="order-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                    <div>
                      <strong style={{ color: '#2563eb', fontSize: '1.1rem', fontFamily: 'Outfit, sans-serif' }}>Order #{order._id}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px', fontWeight: 600 }}>Placed on: {orderDate}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.78rem', background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '12px', color: '#475569', fontWeight: 700 }}>
                        {order.paymentMethod === 'COD' ? '💵 Cash on Delivery' : '💳 Online Card'}
                      </span>
                      <span style={{ fontSize: '0.78rem', background: '#ffffff', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '12px', color: '#475569', fontWeight: 700 }}>
                        {totalUnits} unit(s)
                      </span>
                      <span className={`status-badge ${getStatusBadgeClass(status)}`}>
                        {status}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '14px', fontWeight: 600 }}>
                    📍 <strong style={{ color: '#0f172a' }}>Delivery Address Snapshot:</strong> {addressStr}
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>Product Snapshot List:</strong>
                    <div style={{ marginTop: '8px' }}>
                      {(order.Products || []).map((p, idx) => (
                        <div key={idx} className="order-item-chip" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px', marginBottom: '6px' }}>
                          <div>
                            <strong style={{ color: '#0f172a' }}>{p.name || 'Product'}</strong>
                            {p.brand && (
                              <span style={{ fontSize: '0.75rem', background: '#ffffff', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '6px', color: '#334155', marginLeft: '6px', fontWeight: 700 }}>
                                {p.brand}
                              </span>
                            )}
                            {p.discount > 0 && (
                              <span className="discount-tag" style={{ marginLeft: '6px' }}>-{p.discount}% OFF</span>
                            )}
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {p.quantity || 1} x Rs. {(p.price || 0).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="order-financials" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '20px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Total Paid:</span>
                    <span style={{ fontSize: '1.15rem', color: 'var(--success-color)', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
                      Rs. {(order.FinalTotal || order.Total || 0).toLocaleString()}
                    </span>
                  </div>

                  {canCancel && (
                    <div style={{ marginTop: '14px', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-danger"
                        style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                        onClick={() => handleCancelOrder(order._id)}
                      >
                        Cancel Order
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECTION 3: SEARCH ORDER BY ID */}
      <div className="section-card">
        <h3>🔍 Find Specific Order By ID</h3>
        <form onSubmit={handleSearchOrder} className="grid-inputs" style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'end', gap: '14px', marginTop: '14px' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="searchOrderId">Order ID</label>
            <input
              type="text"
              id="searchOrderId"
              placeholder="Enter Order ID (e.g. 64a1b2c3...)"
              value={searchOrderId}
              onChange={(e) => setSearchOrderId(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: '45px' }} disabled={isSearchingOrder}>
            {isSearchingOrder ? 'Searching...' : 'Search Order'}
          </button>
        </form>

        {searchResult && (
          <div id="singleOrderResult" style={{ marginTop: '20px', padding: '20px', background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <h4 style={{ fontFamily: 'Outfit, sans-serif', color: '#2563eb', margin: 0 }}>
                Order #{searchResult._id}
              </h4>
              <span className={`status-badge ${getStatusBadgeClass(searchResult.Orderstatus || searchResult.status || 'Pending')}`}>
                {searchResult.Orderstatus || searchResult.status || 'Pending'}
              </span>
            </div>
            <p style={{ marginTop: '10px' }}><strong>Payment Method:</strong> {searchResult.paymentMethod || 'Card'}</p>
            <p><strong>Total Amount:</strong> Rs. {(searchResult.FinalTotal || searchResult.Total || 0).toLocaleString()}</p>
            {((searchResult.Orderstatus || searchResult.status || '').toLowerCase() === 'pending' || (searchResult.Orderstatus || searchResult.status || '').toLowerCase() === 'confirmed') && (
              <div style={{ marginTop: '14px' }}>
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                  onClick={() => handleCancelOrder(searchResult._id)}
                >
                  Cancel Order
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CANCEL ORDER CONFIRMATION MODAL */}
      {cancelConfirmOrderId && (
        <div
          className="address-modal-overlay"
          style={{ display: 'flex' }}
          onClick={(e) => {
            if (e.target.className && e.target.className.includes && e.target.className.includes('address-modal-overlay')) {
              setCancelConfirmOrderId(null);
            }
          }}
        >
          <div className="address-modal-box" style={{ maxWidth: '440px', textAlign: 'center', padding: '30px 24px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '1.5rem' }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h3 style={{ fontFamily: 'Outfit, sans-serif', color: '#0f172a', marginBottom: '8px', fontSize: '1.25rem' }}>
              Cancel Order?
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.5 }}>
              Are you sure you want to cancel <strong>Order #{cancelConfirmOrderId}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setCancelConfirmOrderId(null)}
                disabled={isCancellingOrder}
                style={{ flex: 1, padding: '10px 16px' }}
              >
                Keep Order
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmCancelOrder}
                disabled={isCancellingOrder}
                style={{ flex: 1, padding: '10px 16px' }}
              >
                {isCancellingOrder ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADDRESS EDIT MODAL */}
      {isAddressModalOpen && (
        <div
          id="addressModal"
          className="address-modal-overlay"
          style={{ display: 'flex' }}
          onClick={(e) => {
            if (e.target.id === 'addressModal') handleCloseAddressModal();
          }}
        >
          <div className="address-modal-box">
            <div className="address-modal-header">
              <h3>
                <i className="fa-solid fa-location-dot" style={{ color: 'var(--accent-color)' }}></i> Edit Delivery Address
              </h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={handleCloseAddressModal}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            <form id="checkoutAddressForm" onSubmit={handleSaveAddressModal}>
              {modalError && (
                <div id="modalAddressError" className="modal-alert-error" style={{ display: 'block' }}>
                  {modalError}
                </div>
              )}

              <div className="modal-form-row">
                <div className="modal-form-group">
                  <label htmlFor="modalFullName">
                    Full Name <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    id="modalFullName"
                    required
                    placeholder="e.g. John Doe"
                    value={modalAddress.fullName}
                    onChange={(e) => setModalAddress({ ...modalAddress, fullName: e.target.value })}
                  />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="modalPhone">
                    Phone Number (10 digits) <span className="required-star">*</span>
                  </label>
                  <input
                    type="tel"
                    id="modalPhone"
                    required
                    maxLength={10}
                    minLength={10}
                    pattern="[0-9]{10}"
                    inputMode="numeric"
                    placeholder="e.g. 0771234567"
                    value={modalAddress.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setModalAddress({ ...modalAddress, phone: val });
                    }}
                  />
                </div>
              </div>

              <div className="modal-form-group">
                <label htmlFor="modalAddressLine">
                  Address Line / Street <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  id="modalAddressLine"
                  required
                  placeholder="e.g. 123 Tech Street, Suite 4"
                  value={modalAddress.addressLine}
                  onChange={(e) => setModalAddress({ ...modalAddress, addressLine: e.target.value })}
                />
              </div>

              <div className="modal-form-row three-cols">
                <div className="modal-form-group">
                  <label htmlFor="modalCity">
                    City <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    id="modalCity"
                    required
                    placeholder="e.g. Colombo"
                    value={modalAddress.city}
                    onChange={(e) => setModalAddress({ ...modalAddress, city: e.target.value })}
                  />
                </div>
                <div className="modal-form-group">
                  <label htmlFor="modalProvince">
                    Province <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    id="modalProvince"
                    required
                    placeholder="e.g. Western Province"
                    value={modalAddress.province}
                    onChange={(e) => setModalAddress({ ...modalAddress, province: e.target.value })}
                  />
                </div>
                <div className="modal-form-group postal-code-group">
                  <label htmlFor="modalPostalCode">
                    Postal Code <span className="required-star">*</span>
                  </label>
                  <input
                    type="text"
                    id="modalPostalCode"
                    required
                    placeholder="e.g. 00100"
                    value={modalAddress.postalCode}
                    onChange={(e) => setModalAddress({ ...modalAddress, postalCode: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-checkbox-group">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    id="modalSaveDefault"
                    checked={modalAddress.saveDefault}
                    onChange={(e) => setModalAddress({ ...modalAddress, saveDefault: e.target.checked })}
                  />
                  <span className="checkbox-label-text">Save as default address in my account</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={handleCloseAddressModal}>
                  Cancel
                </button>
                {isCustomAddress && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    id="btnModalResetDefault"
                    onClick={handleResetToDefaultAddress}
                    style={{ color: '#64748b' }}
                    title="Reset to account default address"
                  >
                    <i className="fa-solid fa-rotate-left"></i> Reset
                  </button>
                )}
                <button type="submit" className="btn btn-primary" id="btnSaveModalAddress">
                  <i className="fa-solid fa-check"></i> Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
