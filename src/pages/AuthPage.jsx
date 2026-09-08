import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authService } from '../services/authService';
import { validatePhoneNumber } from '../utils/formatters';
import './AuthPage.css';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, verifyEmail } = useAuth();
  const { showToast } = useToast();

  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [isForgotMode, setIsForgotMode] = useState(false);

  // Sign In Fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Sign Up Fields
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registering, setRegistering] = useState(false);

  // Password Requirements State
  const [reqLength, setReqLength] = useState(false);
  const [reqUpper, setReqUpper] = useState(false);
  const [reqLower, setReqLower] = useState(false);
  const [reqNumber, setReqNumber] = useState(false);
  const [reqSpecial, setReqSpecial] = useState(false);

  // OTP Fields
  const [otpInput, setOtpInput] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Forgot Password Fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1);
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submittingForgot, setSubmittingForgot] = useState(false);

  const handlePasswordChange = (val) => {
    setRegPassword(val);
    setReqLength(val.length >= 8);
    setReqUpper(/[A-Z]/.test(val));
    setReqLower(/[a-z]/.test(val));
    setReqNumber(/[0-9]/.test(val));
    setReqSpecial(/[^A-Za-z0-9]/.test(val));
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError(false);
    setLoginSuccess(false);

    if (!loginEmail || !loginPassword) {
      showToast('Email and password are required', 'error');
      return;
    }

    setLoggingIn(true);
    try {
      const data = await login(loginEmail, loginPassword);
      setLoginSuccess(true);
      showToast('Login successful! Welcome back.', 'success');

      const u = data.user || {};
      const isAdmin = u.isadmin === true || u.isadmin === 'true' || u.isAdmin === true || u.role === 'admin';
      const destination = location.state?.from?.pathname || (isAdmin ? '/admin' : '/');

      setTimeout(() => {
        navigate(destination, { replace: true });
      }, 1000);
    } catch (err) {
      setLoginError(true);
      showToast(err.response?.data?.message || 'Invalid email or password', 'error');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!firstname || !lastname || !regEmail || !regPassword) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (regPassword !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    const cleanPhone = regPhone.replace(/\D/g, '');
    if (!validatePhoneNumber(cleanPhone)) {
      showToast('Mobile / Phone number must be exactly 10 digits (e.g. 0771234567)', 'error');
      return;
    }

    setRegistering(true);
    showToast('Creating account and sending verification OTP...', 'loading');

    try {
      await register({
        firstname: firstname.trim(),
        lastname: lastname.trim(),
        email: regEmail.trim().toLowerCase(),
        phone: cleanPhone,
        address: 'Colombo, Sri Lanka',
        password: regPassword,
      });

      showToast(`Verification code sent to ${regEmail}`, 'success');
      setIsOtpMode(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setRegistering(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpInput || otpInput.length < 6) {
      showToast('Please enter the 6-digit OTP code', 'error');
      return;
    }

    setVerifyingOtp(true);
    showToast('Verifying code...', 'loading');

    try {
      await verifyEmail(regEmail.trim().toLowerCase(), otpInput.trim());
      showToast('Email verified! You can now sign in.', 'success');
      setIsOtpMode(false);
      setIsSignUpMode(false);
      setLoginEmail(regEmail);
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid or expired OTP', 'error');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async (e) => {
    e.preventDefault();
    showToast('Resending OTP code...', 'loading');
    try {
      await authService.resendOtp(regEmail.trim().toLowerCase());
      showToast('A new OTP has been sent to your email.', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to resend OTP', 'error');
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (forgotStep === 1) {
      if (!forgotEmail) {
        showToast('Please enter your email', 'error');
        return;
      }
      setSubmittingForgot(true);
      showToast('Sending password reset code...', 'loading');
      try {
        await authService.forgotPassword(forgotEmail.trim().toLowerCase());
        showToast(`Reset code sent to ${forgotEmail}`, 'success');
        setForgotStep(2);
      } catch (err) {
        showToast(err.response?.data?.message || 'Email not found', 'error');
      } finally {
        setSubmittingForgot(false);
      }
    } else {
      if (!resetOtp || !newPassword) {
        showToast('Please enter code and new password', 'error');
        return;
      }
      setSubmittingForgot(true);
      showToast('Resetting password...', 'loading');
      try {
        await authService.resetPassword({
          email: forgotEmail.trim().toLowerCase(),
          otp: resetOtp.trim(),
          newPassword,
        });
        showToast('Password reset successfully! You can now log in.', 'success');
        setIsForgotMode(false);
        setForgotStep(1);
        setLoginEmail(forgotEmail);
      } catch (err) {
        showToast(err.response?.data?.message || 'Failed to reset password', 'error');
      } finally {
        setSubmittingForgot(false);
      }
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className={`container ${isSignUpMode ? 'sign-up-mode' : ''}`} id="mainContainer">
      {/* Back to Home floating link */}
      <Link to="/" className="btn-back-home">
        <i className="fa-solid fa-arrow-left"></i> Home
      </Link>

      <div className="forms-container">
        <div className="signin-signup">
          {/* OTP VERIFICATION VIEW */}
          {isOtpMode ? (
            <div id="otpVerificationView" className="otp-verification-container" style={{ display: 'block' }}>
              <div className="otp-video-box">
                <video id="authOtpVideo" autoPlay loop muted playsInline preload="auto" style={{ width: '100%', height: '100%', objectFit: 'contain' }}>
                  <source src="/animation/auth.webm" type="video/webm" />
                </video>
              </div>
              <h2 className="title" style={{ fontSize: '1.6rem', marginBottom: '4px' }}>Verify Email</h2>
              <p className="subtitle" style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4, marginBottom: '18px' }}>
                We sent a 6-digit verification code to <strong>{regEmail}</strong>.
              </p>

              <form id="otpForm" onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="input-field otp-input-field">
                  <i className="fa-solid fa-key"></i>
                  <input
                    type="text"
                    id="otpInput"
                    required
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    placeholder="Enter 6-digit OTP"
                    style={{ letterSpacing: '4px', fontWeight: 700, fontSize: '1.1rem', textAlign: 'center' }}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </div>

                <div className="otp-actions-container" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="submit" className="btn solid" disabled={verifyingOtp}>
                    {verifyingOtp ? 'Verifying...' : 'Verify Email'}
                  </button>
                  <button type="button" className="btn transparent" onClick={handleResendOtp}>
                    Resend Code
                  </button>
                </div>
              </form>

              <div style={{ marginTop: '14px', textAlign: 'center' }}>
                <a
                  className="forgot-link"
                  style={{ fontSize: '0.82rem', color: '#64748b', cursor: 'pointer' }}
                  onClick={() => setIsOtpMode(false)}
                >
                  <i className="fa-solid fa-arrow-left"></i> Back to Registration
                </a>
              </div>
            </div>
          ) : isForgotMode ? (
            /* FORGOT PASSWORD FORM */
            <form className="sign-in-form" onSubmit={handleForgotSubmit}>
              <h2 className="title">Reset Password</h2>
              <p className="subtitle">
                {forgotStep === 1
                  ? 'Enter your registered email to receive an OTP'
                  : 'Enter the OTP and your new password'}
              </p>

              {forgotStep === 1 ? (
                <div className="input-field">
                  <i className="fa-solid fa-envelope"></i>
                  <input
                    type="email"
                    placeholder="Email Address"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>
              ) : (
                <>
                  <div className="input-field">
                    <i className="fa-solid fa-key"></i>
                    <input
                      type="text"
                      placeholder="6-Digit Reset Code"
                      maxLength={6}
                      required
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                    />
                  </div>
                  <div className="input-field">
                    <i className="fa-solid fa-lock"></i>
                    <input
                      type="password"
                      placeholder="New Password (min 6 chars)"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                </>
              )}

              <input
                type="submit"
                value={submittingForgot ? 'Processing...' : forgotStep === 1 ? 'Send Reset Code' : 'Change Password'}
                className="btn solid"
                disabled={submittingForgot}
              />

              <div style={{ marginTop: '14px', textAlign: 'center' }}>
                <a
                  className="forgot-link"
                  style={{ fontSize: '0.85rem', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => {
                    setIsForgotMode(false);
                    setForgotStep(1);
                  }}
                >
                  <i className="fa-solid fa-arrow-left"></i> Back to Sign In
                </a>
              </div>
            </form>
          ) : (
            <>
              {/* 1. SIGN IN FORM */}
              <form className="sign-in-form" onSubmit={handleLoginSubmit}>
                <h2 className="title">Sign in</h2>
                <p className="subtitle">Welcome back to G Lab Hardware</p>

                <div className="input-field">
                  <i className="fa-solid fa-user"></i>
                  <input
                    type="text"
                    id="username"
                    required
                    placeholder="Username or Email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>

                <div className="input-field">
                  <i className="fa-solid fa-lock"></i>
                  <input
                    type="password"
                    id="passwordIn"
                    required
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>

                <div style={{ width: '100%', maxWidth: '380px', display: 'flex', justifyContent: 'flex-end', margin: '2px 0 10px 0' }}>
                  <a
                    className="forgot-link"
                    style={{ fontSize: '0.82rem', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => setIsForgotMode(true)}
                  >
                    Forgot Password?
                  </a>
                </div>

                {/* Wrong password alert box + animation */}
                {loginError && (
                  <div id="wrongPasswordContainer" style={{ display: 'block', width: '100%', maxWidth: '440px', margin: '8px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <video autoPlay loop muted playsInline style={{ width: '140px', height: '100px', objectFit: 'contain', flexShrink: 0 }}>
                        <source src="/animation/forgot password red.webm" type="video/webm" />
                      </video>
                      <div style={{ flex: 1, background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: '16px', padding: '12px 16px', textAlign: 'left' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#dc2626', lineHeight: 1.3 }}>
                          Invalid email or password
                        </div>
                        <a
                          className="forgot-link"
                          onClick={() => setIsForgotMode(true)}
                          style={{ fontSize: '0.8rem', color: '#0284c7', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600, display: 'inline-block', marginTop: '4px' }}
                        >
                          Forgot Password?
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success login animation */}
                {loginSuccess && (
                  <div id="successLoginContainer" style={{ display: 'block', width: '100%', maxWidth: '440px', margin: '8px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <video autoPlay loop muted playsInline style={{ width: '140px', height: '100px', objectFit: 'contain', flexShrink: 0 }}>
                        <source src="/animation/correct password.webm" type="video/webm" />
                      </video>
                      <div style={{ flex: 1, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '16px', padding: '12px 16px', textAlign: 'left' }}>
                        <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#15803d', lineHeight: 1.3 }}>
                          Login Successful!
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600, marginTop: '2px' }}>
                          Redirecting to your account...
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <input
                  type="submit"
                  id="btnSubmitIn"
                  value={loggingIn ? 'Logging in...' : 'Login'}
                  className="btn solid"
                  disabled={loggingIn}
                />

                <div id="rowSignUpSwitch" style={{ marginTop: '14px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Don't have an account? </span>
                  <a
                    onClick={() => setIsSignUpMode(true)}
                    style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Sign up
                  </a>
                </div>
              </form>

              {/* 2. SIGN UP FORM */}
              <form className="sign-up-form" onSubmit={handleRegisterSubmit}>
                <h2 className="title">Sign up</h2>
                <p className="subtitle">Create your new G Lab account</p>

                <div className="input-field">
                  <i className="fa-solid fa-user"></i>
                  <input
                    type="text"
                    required
                    placeholder="First Name"
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                  />
                </div>

                <div className="input-field">
                  <i className="fa-solid fa-user-tag"></i>
                  <input
                    type="text"
                    required
                    placeholder="Last Name"
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                  />
                </div>

                <div className="input-field">
                  <i className="fa-solid fa-envelope"></i>
                  <input
                    type="email"
                    required
                    placeholder="Email Address"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                  />
                </div>

                <div className="input-field">
                  <i className="fa-solid fa-phone"></i>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    minLength={10}
                    pattern="[0-9]{10}"
                    inputMode="numeric"
                    placeholder="Mobile Number (10 digits, e.g. 0771234567)"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  />
                </div>

                {/* Password Requirements Indicator */}
                <div style={{ width: '100%', maxWidth: '380px', margin: '4px 0 8px 0' }}>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.74rem', fontWeight: 700, padding: '2px 7px', borderRadius: '12px', background: reqLength ? '#dcfce7' : '#fef2f2', color: reqLength ? '#15803d' : '#dc2626', border: `1px solid ${reqLength ? '#86efac' : '#fca5a5'}` }}>
                      {reqLength ? '🟢' : '🔴'} 8+
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.74rem', fontWeight: 700, padding: '2px 7px', borderRadius: '12px', background: reqUpper ? '#dcfce7' : '#fef2f2', color: reqUpper ? '#15803d' : '#dc2626', border: `1px solid ${reqUpper ? '#86efac' : '#fca5a5'}` }}>
                      {reqUpper ? '🟢' : '🔴'} A-Z
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.74rem', fontWeight: 700, padding: '2px 7px', borderRadius: '12px', background: reqLower ? '#dcfce7' : '#fef2f2', color: reqLower ? '#15803d' : '#dc2626', border: `1px solid ${reqLower ? '#86efac' : '#fca5a5'}` }}>
                      {reqLower ? '🟢' : '🔴'} a-z
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.74rem', fontWeight: 700, padding: '2px 7px', borderRadius: '12px', background: reqNumber ? '#dcfce7' : '#fef2f2', color: reqNumber ? '#15803d' : '#dc2626', border: `1px solid ${reqNumber ? '#86efac' : '#fca5a5'}` }}>
                      {reqNumber ? '🟢' : '🔴'} 0-9
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '0.74rem', fontWeight: 700, padding: '2px 7px', borderRadius: '12px', background: reqSpecial ? '#dcfce7' : '#fef2f2', color: reqSpecial ? '#15803d' : '#dc2626', border: `1px solid ${reqSpecial ? '#86efac' : '#fca5a5'}` }}>
                      {reqSpecial ? '🟢' : '🔴'} !@#
                    </span>
                  </div>
                </div>

                <div className="input-field">
                  <i className="fa-solid fa-lock"></i>
                  <input
                    type="password"
                    required
                    placeholder="Password"
                    value={regPassword}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                  />
                </div>

                <div className="input-field">
                  <i className="fa-solid fa-shield-halved"></i>
                  <input
                    type="password"
                    required
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <input
                  type="submit"
                  value={registering ? 'Creating Account...' : 'Sign up'}
                  className="btn solid"
                  disabled={registering}
                />

                <div id="rowSignInSwitch" style={{ marginTop: '14px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Already have an account? </span>
                  <a
                    onClick={() => setIsSignUpMode(false)}
                    style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Sign in
                  </a>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {/* PANELS CONTAINER WITH VIDEOS & SLIDING CONTROLS */}
      <div className="panels-container">
        {/* Left Panel (shown when in Sign In view) */}
        <div className="panel left-panel">
          <div className="content">
            <h3>New here ?</h3>
            <p>
              Create an account to explore high-performance PC hardware, custom gaming rigs, and exclusive deals.
            </p>
            <button
              type="button"
              className="btn transparent"
              id="sign-up-btn"
              onClick={() => {
                setIsSignUpMode(true);
                setIsOtpMode(false);
                setIsForgotMode(false);
              }}
            >
              Sign up
            </button>
          </div>
          <video
            autoPlay
            loop
            muted
            playsInline
            className="image"
            style={{ borderRadius: '16px', objectFit: 'cover', maxHeight: '280px' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          >
            <source src="/animation/Login.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Right Panel (shown when in Sign Up view) */}
        <div className="panel right-panel">
          <div className="content">
            <h3>One of us ?</h3>
            <p>
              Sign in with your credentials to access your cart, track orders, and manage your hardware profile.
            </p>
            <button
              type="button"
              className="btn transparent"
              id="sign-in-btn"
              onClick={() => {
                setIsSignUpMode(false);
                setIsOtpMode(false);
                setIsForgotMode(false);
              }}
            >
              Sign in
            </button>
          </div>
          <video
            autoPlay
            loop
            muted
            playsInline
            className="image"
            style={{ borderRadius: '16px', objectFit: 'cover', maxHeight: '280px' }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          >
            <source src="/animation/sign up.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </div>
  </div>
);
}
