import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  // Add a ref to track last notification
  const lastNotificationRef = useRef({ key: '', time: 0 });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(
      cart));
  }, [cart]);

  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.productId === product._id);
      const now = Date.now();
      const updateKey = `${product._id}-update`;
      const addKey = `${product._id}-add`;
      const notificationWindow = 500; // ms
      if (existingItem) {
        // Update quantity if item already exists
        const updatedCart = prevCart.map(item =>
          item.productId === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        // Only show update notification if not duplicate within window
        if (
          lastNotificationRef.current.key !== updateKey ||
          now - lastNotificationRef.current.time > notificationWindow
        ) {
          toast.success(`Updated ${product.name} quantity in cart`);
          lastNotificationRef.current = { key: updateKey, time: now };
        }
        return updatedCart;
      } else {
        // Add new item to cart
        const newItem = {
          productId: product._id,
          name: product.name,
          price: product.mode === 'auction' ? product.auction.currentBid : product.price,
          image: product.images[0],
          mode: product.mode,
          quantity,
          seller: product.seller
        };
        // Only show add notification if not duplicate within window
        if (
          lastNotificationRef.current.key !== addKey ||
          now - lastNotificationRef.current.time > notificationWindow
        ) {
          toast.success(`Added ${product.name} to cart`);
          lastNotificationRef.current = { key: addKey, time: now };
        }
        return [...prevCart, newItem];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => {
      const item = prevCart.find(item => item.productId === productId);
      if (item) {
        toast.success(`Removed ${item.name} from cart`);
      }
      return prevCart.filter(item => item.productId !== productId);
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.productId === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    toast.success('Cart cleared');
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const getCartItem = (productId) => {
    return cart.find(item => item.productId === productId);
  };

  const isInCart = (productId) => {
    return cart.some(item => item.productId === productId);
  };

  const value = {
    cart,
    loading,
    setLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    getCartItem,
    isInCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}; 