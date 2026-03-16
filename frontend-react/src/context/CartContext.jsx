import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

const STORAGE_KEY = 'harmony_cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (product, selectedColor = null, quantity = 1) => {
    setItems(prev => {
      const existingIndex = prev.findIndex(
        item => item.product.id === product.id && item.selectedColor === selectedColor
      );
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      }
      
      return [...prev, { product, quantity, selectedColor }];
    });
    setIsOpen(true);
  };

  const removeFromCart = (productId, selectedColor) => {
    setItems(prev => prev.filter(
      item => !(item.product.id === productId && item.selectedColor === selectedColor)
    ));
  };

  const updateQuantity = (productId, selectedColor, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedColor);
      return;
    }
    setItems(prev => prev.map(item => 
      item.product.id === productId && item.selectedColor === selectedColor
        ? { ...item, quantity }
        : item
    ));
  };

  const clearCart = () => setItems([]);

  const toggleCart = () => setIsOpen(prev => !prev);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.product.precio * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items,
      isOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      toggleCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
