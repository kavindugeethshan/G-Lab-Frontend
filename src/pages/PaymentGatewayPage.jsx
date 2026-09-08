import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import { useToast } from '../context/ToastContext';
import './PaymentGatewayPage.css';

export default function PaymentGatewayPage() {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  // Address edit modal state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [modalAddress, setModalAddress] = useState({
    fullName: '',
    phone: '',
    addressLine: '',
    city: '',
    province: '',
    postalCode: '',
  });
  const [modalError, setModalError] = useState('');

  const formRef = useRef(null);

  useEffect(() => {
    async function loadPayment() {
      if (!paymentId) {
        setLoading(false);
        return;
      }
      try {
        const data = await paymentService.getPayment(paymentId);
        const p = data.payment || data;
        setPayment(p);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to load payment details', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadPayment();
  }, [paymentId, showToast]);

  const handleOpenAddressModal = () => {
    const cust = payment?.customer || {};
    setModalError('');
    setModalAddress({
      fullName: cust.full_name || `${cust.first_name || ''} ${cust.last_name || ''}`.trim() || 'Customer',
      phone: cust.phone || '',
      addressLine: cust.address || '',
      city: cust.city || '',
      province: cust.province || cust.district || '',
      postalCode: cust.postalCode || '',
    });
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    const cleanPhone = (modalAddress.phone || '').replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setModalError('Phone number must be exactly 10 digits.');
      return;
    }

    setPayment((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        customer: {
          ...prev.customer,
          full_name: modalAddress.fullName.trim(),
          first_name: modalAddress.fullName.trim().split(' ')[0] || 'Customer',
          last_name: modalAddress.fullName.trim().split(' ').slice(1).join(' ') || 'User',
          phone: cleanPhone,
          address: modalAddress.addressLine.trim(),
          city: modalAddress.city.trim(),
          province: modalAddress.province.trim(),
          postalCode: modalAddress.postalCode.trim(),
        },
      };
    });

    showToast('Delivery address updated for this payment.', 'success');
    setIsAddressModalOpen(false);
  };

  const handleSubmitToPayHere = () => {
    if (formRef.current) {
      formRef.current.submit();
    } else {
      showToast('Redirecting to PayHere Sandbox...', 'loading');
    }
  };

  if (loading) {
    return (
      <div className="payment-page-container" style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-muted)' }}>
        <p>Loading payment parameters...</p>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="payment-page-container">
        <div className="payment-card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--error-color)', marginBottom: '16px' }}>⚠️ Payment ID not found or invalid session.</p>
          <button type="button" className="btn-cancel" onClick={() => navigate('/cart')}>
            🛒 Return to Cart & Orders
          </button>
        </div>
      </div>
    );
  }

  const cust = payment.customer || {};
  const firstName = cust.first_name || cust.firstname || 'Customer';
  const lastName = cust.last_name || cust.lastname || 'User';
  const fullName = cust.full_name || `${firstName} ${lastName}`.trim();
  const formattedAmount = Number(payment.amount || 0).toFixed(2);
  const prov = cust.province || cust.district || '';

  const returnUrl = `${window.location.protocol}//${window.location.host}/cart#my-orders`;
  const cancelUrl = `${window.location.protocol}//${window.location.host}/cart`;

  return (
    <div className="payment-page-container">
      <div className="payment-card">
        {/* PAYMENT HEADER */}
        <div className="payment-header">
          <div className="logo-title" style={{ justifyContent: 'center' }}>
            <div className="logo-icon">G</div>
            <div className="logo-text">
              <h1>G LAB PAYMENT GATEWAY</h1>
              <span>SECURE ONLINE PAYMENTS</span>
            </div>
          </div>
          <p>Complete your e-commerce order securely</p>
        </div>

        {/* PAYMENT DETAILS BOX */}
        <div className="payment-details-box">
          <div className="detail-row">
            <span className="detail-label">Payment ID</span>
            <span className="detail-value" style={{ fontFamily: 'monospace', fontSize: '0.84rem' }}>
              {payment._id || payment.id}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Order ID</span>
            <span className="detail-value" style={{ fontFamily: 'monospace', fontSize: '0.84rem' }}>
              {payment.orderId?._id || payment.orderId}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Customer Name</span>
            <span className="detail-value" id="pgCustomerName">{fullName}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Email</span>
            <span className="detail-value">{cust.email || 'N/A'}</span>
          </div>

          {/* Delivery Address Row */}
          <div className="detail-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px', padding: '12px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span className="detail-label" style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="fa-solid fa-location-dot" style={{ color: 'var(--accent-color)' }}></i> Delivery Address
              </span>
              <button type="button" className="btn-change-address" onClick={handleOpenAddressModal}>
                <i className="fa-solid fa-pen-to-square"></i> Change Address
              </button>
            </div>
            <div id="pgDisplayAddress" style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
              <div style={{ fontWeight: 700 }}>
                {fullName} <span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '6px' }}>📞 {cust.phone || 'N/A'}</span>
              </div>
              <div style={{ color: '#475569', fontSize: '0.84rem' }}>
                {cust.address || 'Not specified'}, {cust.city || ''}{prov ? `, ${prov}` : ''} {cust.postalCode || ''}
              </div>
            </div>
          </div>

          <div className="detail-row">
            <span className="detail-label">Payment Method</span>
            <span className="detail-value" style={{ color: 'var(--accent-color)' }}>
              {payment.gateway || 'PayHere'} ({payment.method || 'Card'})
            </span>
          </div>
        </div>

        {/* TOTAL AMOUNT BOX */}
        <div className="total-amount-box">
          <span className="total-label">Payable Total</span>
          <span className="total-value">
            Rs. {Number(payment.amount || 0).toLocaleString()} {payment.currency || 'LKR'}
          </span>
        </div>

        {/* ACTION BUTTONS */}
        <button type="button" className="btn-payhere" onClick={handleSubmitToPayHere}>
          💳 Proceed to PayHere Sandbox
        </button>
        <button type="button" className="btn-cancel" onClick={() => navigate('/cart')}>
          ❌ Cancel & Return to Cart
        </button>

        {/* HIDDEN PAYHERE FORM SUBMISSION */}
        <form
          ref={formRef}
          id="payHereForm"
          action="https://sandbox.payhere.lk/pay/checkout"
          method="POST"
          style={{ display: 'none' }}
        >
          <input type="hidden" name="merchant_id" value={payment.merchantId || '1228224'} />
          <input type="hidden" name="return_url" value={returnUrl} />
          <input type="hidden" name="cancel_url" value={cancelUrl} />
          <input type="hidden" name="notify_url" value={payment.notifyUrl || 'http://localhost:3001/payments/notify'} />
          <input type="hidden" name="order_id" value={payment.orderId?._id || payment.orderId} />
          <input type="hidden" name="items" value={`G-Lab Order #${payment.orderId?._id || payment.orderId}`} />
          <input type="hidden" name="currency" value={payment.currency || 'LKR'} />
          <input type="hidden" name="amount" value={formattedAmount} />
          <input type="hidden" name="first_name" value={firstName} />
          <input type="hidden" name="last_name" value={lastName} />
          <input type="hidden" name="email" value={cust.email || 'customer@example.com'} />
          <input type="hidden" name="phone" value={cust.phone || '0771234567'} />
          <input type="hidden" name="address" value={cust.address || 'Main Street'} />
          <input type="hidden" name="city" value={cust.city || 'Colombo'} />
          <input type="hidden" name="country" value="Sri Lanka" />
          <input type="hidden" name="hash" value={payment.hash || ''} />
        </form>
      </div>

      {/* ADDRESS EDIT MODAL */}
      {isAddressModalOpen && (
        <div
          id="paymentAddressModal"
          className="address-modal-overlay"
          style={{ display: 'flex' }}
          onClick={(e) => {
            if (e.target.id === 'paymentAddressModal') setIsAddressModalOpen(false);
          }}
        >
          <div className="address-modal-box">
            <div className="address-modal-header">
              <h3>
                <i className="fa-solid fa-location-dot" style={{ color: 'var(--accent-color)' }}></i> Edit Billing & Delivery Address
              </h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setIsAddressModalOpen(false)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleSaveAddress}>
              {modalError && (
                <div className="modal-alert-error" style={{ display: 'block', marginBottom: '12px' }}>
                  {modalError}
                </div>
              )}

              <div className="modal-form-row">
                <div className="modal-form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={modalAddress.fullName}
                    onChange={(e) => setModalAddress({ ...modalAddress, fullName: e.target.value })}
                  />
                </div>
                <div className="modal-form-group">
                  <label>Phone Number (10 digits) *</label>
                  <input
                    type="tel"
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
                <label>Address Line / Street *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 123 Tech Street, Suite 4"
                  value={modalAddress.addressLine}
                  onChange={(e) => setModalAddress({ ...modalAddress, addressLine: e.target.value })}
                />
              </div>

              <div className="modal-form-row three-cols">
                <div className="modal-form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Colombo"
                    value={modalAddress.city}
                    onChange={(e) => setModalAddress({ ...modalAddress, city: e.target.value })}
                  />
                </div>
                <div className="modal-form-group">
                  <label>Province *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Western Province"
                    value={modalAddress.province}
                    onChange={(e) => setModalAddress({ ...modalAddress, province: e.target.value })}
                  />
                </div>
                <div className="modal-form-group postal-code-group">
                  <label>Postal Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 00100"
                    value={modalAddress.postalCode}
                    onChange={(e) => setModalAddress({ ...modalAddress, postalCode: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setIsAddressModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
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
