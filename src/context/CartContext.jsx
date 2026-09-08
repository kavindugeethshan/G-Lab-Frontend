import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(null);
      localStorage.removeItem('cartCount');
      return;
    }

    setLoading(true);
    try {
      const data = await cartService.getCart();
      setCart(data.cart || data);

      // Calculate item count
      const items = data.cart?.items || data.items || [];
      const count = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
      localStorage.setItem('cartCount', String(count));
      localStorage.setItem('cartUpdated', String(Date.now()));
    } catch (err) {
      console.warn('Error fetching cart:', err?.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Cross-tab sync
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'cartUpdated' || e.key === 'cartCount') {
        if (isAuthenticated) fetchCart();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [isAuthenticated, fetchCart]);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      showToast('Please sign in to add items to your cart.', 'error');
      return false;
    }

    try {
      await cartService.addToCart(productId, quantity);
      showToast('Item added to cart!', 'success');
      await fetchCart();
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add item to cart';
      showToast(msg, 'error');
      return false;
    }
  }, [isAuthenticated, fetchCart, showToast]);

  const updateQuantity = useCallback(async (productId, quantity) => {
    try {
      await cartService.updateQuantity(productId, quantity);
      await fetchCart();
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update quantity';
      showToast(msg, 'error');
      return false;
    }
  }, [fetchCart, showToast]);

  const removeFromCart = useCallback(async (productId) => {
    try {
      await cartService.removeFromCart(productId);
      showToast('Item removed from cart', 'info');
      await fetchCart();
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to remove item';
      showToast(msg, 'error');
      return false;
    }
  }, [fetchCart, showToast]);

  const clearCart = useCallback(async () => {
    try {
      await cartService.clearCart();
      setCart({ items: [] });
      localStorage.setItem('cartCount', '0');
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to clear cart';
      showToast(msg, 'error');
      return false;
    }
  }, [showToast]);

  const cartItems = cart?.items || [];
  const cartCount = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const cartTotal = cartItems.reduce((sum, item) => {
    const price = Number(item.product?.price || item.price || 0);
    const discount = Number(item.product?.discount || item.discount || 0);
    const effectivePrice = discount > 0 ? price * (1 - discount / 100) : price;
    return sum + effectivePrice * (Number(item.quantity) || 1);
  }, 0);

  const value = {
    cart,
    cartItems,
    cartCount,
    cartTotal,
    loading,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
