import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sendAiMessage } from '../../services/aiService';
import { useCart } from '../../context/CartContext';
import { calculateDiscountPrice } from '../../utils/formatters';
import './AiAssistantWidget.css';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500';

const INITIAL_GREETING = "Hi! I'm G-Lab AI. I can help you find products, compare options, and discover hardware that matches your needs.";

const QUICK_SUGGESTIONS = [
  'Find gaming laptops',
  'Find ASUS products',
  'Show laptops under Rs. 200,000',
  'Find GPUs',
];

export default function AiAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'initial-greeting',
      role: 'assistant',
      content: INITIAL_GREETING,
      products: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      showSuggestions: true,
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { addToCart } = useCart();

  // Scroll to bottom when messages update or loading state changes
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Focus input when chat window opens
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = (typeof textToSend === 'string' ? textToSend : inputMessage).trim();
    if (!text || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Append user message immediately
    const updatedMessages = [
      ...messages,
      {
        id: userMsgId,
        role: 'user',
        content: text,
        timestamp: userTimestamp,
      },
    ];

    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Call backend POST /ai/chat
      const data = await sendAiMessage(text);

      const aiMsgId = `ai-${Date.now()}`;
      const aiTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      let replyMessage = data?.message?.trim();
      const returnedProducts = Array.isArray(data?.products) ? data.products : [];

      if (!replyMessage || replyMessage === "No response generated.") {
        if (returnedProducts.length > 0) {
          replyMessage = `I found ${returnedProducts.length} product${returnedProducts.length > 1 ? 's' : ''} matching your request.`;
        } else {
          replyMessage = "I couldn't find any products matching your request. Try searching with different keywords, brand names, or price ranges.";
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          role: 'assistant',
          content: replyMessage,
          products: returnedProducts,
          timestamp: aiTimestamp,
        },
      ]);

      if (!isOpen) {
        setHasUnread(true);
      }
    } catch (err) {
      console.error('AI chat request failed:', err.message || err);
      const errorMsgId = `err-${Date.now()}`;
      const errorTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setMessages((prev) => [
        ...prev,
        {
          id: errorMsgId,
          role: 'assistant',
          content: "Sorry, I'm having trouble connecting right now. Please try again.",
          products: [],
          isError: true,
          timestamp: errorTimestamp,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `initial-${Date.now()}`,
        role: 'assistant',
        content: INITIAL_GREETING,
        products: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        showSuggestions: true,
      },
    ]);
  };

  return (
    <div className="ai-widget-wrapper">
      {/* FLOATING AI TRIGGER BUTTON */}
      <button
        type="button"
        className={`ai-floating-btn ${isOpen ? 'active' : ''} ${hasUnread ? 'pulse' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close G-Lab AI Assistant' : 'Open G-Lab AI Assistant'}
        title="G-Lab AI Assistant"
      >
        <div className="ai-btn-glow-ring"></div>
        <div className="ai-btn-inner">
          {isOpen ? (
            <i className="fa-solid fa-xmark ai-btn-icon"></i>
          ) : (
            <>
              <i className="fa-solid fa-robot ai-btn-icon"></i>
              <span className="ai-sparkle-dot"></span>
            </>
          )}
        </div>
      </button>

      {/* CHAT WINDOW */}
      {isOpen && (
        <aside
          className="ai-chat-window"
          role="dialog"
          aria-labelledby="ai-chat-title"
          aria-modal="true"
        >
          {/* HEADER */}
          <header className="ai-chat-header">
            <div className="ai-header-left">
              <div className="ai-avatar">
                <i className="fa-solid fa-microchip"></i>
                <span className="ai-status-pulse" title="AI Agent Online"></span>
              </div>
              <div className="ai-header-info">
                <div className="ai-header-title-row">
                  <h3 id="ai-chat-title" className="ai-header-title">G-Lab AI</h3>
                  <span className="ai-badge-live">Agent 3.6</span>
                </div>
                <p className="ai-header-subtitle">Your intelligent shopping assistant</p>
              </div>
            </div>

            <div className="ai-header-actions">
              <button
                type="button"
                className="ai-action-btn"
                onClick={handleClearHistory}
                title="Restart conversation"
                aria-label="Restart conversation"
              >
                <i className="fa-solid fa-rotate-right"></i>
              </button>
              <button
                type="button"
                className="ai-action-btn ai-close-btn"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                aria-label="Close G-Lab AI Assistant"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </header>

          {/* CHAT BODY / MESSAGES */}
          <div className="ai-chat-body">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`ai-message-row ${msg.role === 'user' ? 'ai-user-row' : 'ai-assistant-row'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="ai-msg-avatar" aria-hidden="true">
                    <i className="fa-solid fa-robot"></i>
                  </div>
                )}

                <div className={`ai-message-bubble ${msg.role === 'user' ? 'ai-user-bubble' : 'ai-assistant-bubble'} ${msg.isError ? 'ai-error-bubble' : ''}`}>
                  <div className="ai-bubble-text">{msg.content}</div>

                  {/* QUICK SUGGESTIONS (SHOW WITH INITIAL GREETING) */}
                  {msg.showSuggestions && (
                    <div className="ai-suggestions-container">
                      <div className="ai-suggestions-label">
                        <i className="fa-solid fa-bolt-lightning"></i> Suggested queries:
                      </div>
                      <div className="ai-suggestions-list">
                        {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="ai-suggestion-chip"
                            onClick={() => handleSendMessage(suggestion)}
                            disabled={isLoading}
                          >
                            <span>{suggestion}</span>
                            <i className="fa-solid fa-arrow-right"></i>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PRODUCT CARDS LIST */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="ai-products-section">
                      <div className="ai-products-header">
                        <span className="ai-products-count">
                          <i className="fa-solid fa-bag-shopping"></i> Found {msg.products.length} {msg.products.length === 1 ? 'Product' : 'Products'}
                        </span>
                      </div>

                      <div className="ai-products-grid">
                        {msg.products.map((prod) => {
                          const price = Number(prod.price || 0);
                          const discount = Number(prod.discount || 0);
                          const finalPrice = calculateDiscountPrice(price, discount);
                          const isOutOfStock = Number(prod.stock || 0) <= 0;
                          const imageUrl = (prod.images && prod.images.length > 0)
                            ? prod.images[0]
                            : (prod.Image || prod.image || DEFAULT_IMAGE);

                          return (
                            <div key={prod._id || prod.id} className="ai-product-card">
                              <div className="ai-product-image-wrap">
                                <img
                                  src={imageUrl}
                                  alt={prod.name || 'Component'}
                                  loading="lazy"
                                  onError={(e) => {
                                    e.currentTarget.src = DEFAULT_IMAGE;
                                  }}
                                />
                                {discount > 0 && (
                                  <span className="ai-product-badge-discount">-{discount}% OFF</span>
                                )}
                              </div>

                              <div className="ai-product-content">
                                <div className="ai-product-meta">
                                  <span className="ai-product-category">{prod.category || 'Hardware'}</span>
                                  {prod.brand && (
                                    <span className="ai-product-brand">{prod.brand}</span>
                                  )}
                                </div>

                                <h4 className="ai-product-title" title={prod.name}>
                                  <Link
                                    to={`/products/${prod._id || prod.id}`}
                                    onClick={() => {
                                      // Optional: keep widget open or allow seamless browsing
                                    }}
                                  >
                                    {prod.name || 'Hardware Component'}
                                  </Link>
                                </h4>

                                <div className="ai-product-pricing">
                                  <span className="ai-product-price">
                                    Rs. {finalPrice.toLocaleString('en-US')}
                                  </span>
                                  {discount > 0 && (
                                    <span className="ai-product-original-price">
                                      Rs. {price.toLocaleString('en-US')}
                                    </span>
                                  )}
                                </div>

                                <div className="ai-product-stock-row">
                                  <span className={`ai-stock-tag ${isOutOfStock ? 'out' : 'in'}`}>
                                    <i className={`fa-solid ${isOutOfStock ? 'fa-circle-xmark' : 'fa-circle-check'}`}></i>
                                    {isOutOfStock ? 'Out of Stock' : 'In Stock'}
                                  </span>
                                </div>

                                <div className="ai-product-card-actions">
                                  <Link
                                    to={`/products/${prod._id || prod.id}`}
                                    className="ai-card-btn ai-card-btn-view"
                                  >
                                    <span>View Product</span>
                                    <i className="fa-solid fa-arrow-up-right-from-square"></i>
                                  </Link>

                                  <button
                                    type="button"
                                    className="ai-card-btn ai-card-btn-add"
                                    onClick={() => addToCart(prod._id || prod.id, 1)}
                                    disabled={isOutOfStock}
                                    title={isOutOfStock ? 'Out of stock' : 'Add to Cart'}
                                  >
                                    <i className="fa-solid fa-cart-plus"></i>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="ai-msg-timestamp">{msg.timestamp}</div>
                </div>
              </div>
            ))}

            {/* LOADING STATE */}
            {isLoading && (
              <div className="ai-message-row ai-assistant-row">
                <div className="ai-msg-avatar" aria-hidden="true">
                  <i className="fa-solid fa-robot"></i>
                </div>
                <div className="ai-message-bubble ai-assistant-bubble ai-loading-bubble">
                  <div className="ai-loading-content">
                    <span className="ai-loading-text">G-Lab AI is thinking</span>
                    <div className="ai-typing-dots">
                      <span className="dot"></span>
                      <span className="dot"></span>
                      <span className="dot"></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT FORM */}
          <footer className="ai-chat-footer">
            <form onSubmit={handleSubmit} className="ai-chat-form">
              <input
                ref={inputRef}
                type="text"
                className="ai-chat-input"
                placeholder="Ask about products, specs, budget..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                maxLength={300}
                aria-label="Message to G-Lab AI Assistant"
              />
              <button
                type="submit"
                className="ai-send-btn"
                disabled={!inputMessage.trim() || isLoading}
                aria-label="Send message"
                title="Send message"
              >
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </form>
            <div className="ai-footer-note">
              <span>Powered by G-Lab AI Agent</span>
            </div>
          </footer>
        </aside>
      )}
    </div>
  );
}
