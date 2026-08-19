import React, { createContext, useContext, useState, useEffect } from 'react';
import { getProductById } from '../services/productService';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('ryanz_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const { showToast } = useToast();

  useEffect(() => {
    try {
      localStorage.setItem('ryanz_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error("Failed to save cart to localStorage:", e);
    }
  }, [cartItems]);

  const addToCart = (product, selectedSize, selectedColor, quantity = 1, variant = null) => {
    if (!product || !product.id) return;

    const size = selectedSize || variant?.size || (product.sizes && product.sizes[0]) || 'M';
    const color = selectedColor || variant?.color || (product.colors && product.colors[0]) || 'Default';
    const variantPrice = variant?.price ? Number(variant.price) : null;
    const basePrice = Number(product.price) || 0;
    const hasDiscount = Boolean(product.discountPrice && Number(product.discountPrice) > 0 && Number(product.discountPrice) < basePrice);
    const activePrice = variantPrice || (hasDiscount ? Number(product.discountPrice) : basePrice);

    const itemImage = variant?.image || (Array.isArray(product.images) && product.images[0]) || '';
    const itemStock = variant?.stock !== undefined ? variant.stock : (product.stock !== undefined ? product.stock : 99);
    const itemSku = variant?.sku || product.cjpSku || '';

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productId === product.id && item.selectedSize === size && item.selectedColor === color
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantity;
        
        // Stock check
        if (itemStock && newQty > itemStock) {
          showToast(`Only ${itemStock} items available in stock.`, 'error');
          updated[existingIndex].quantity = itemStock;
        } else {
          updated[existingIndex].quantity = newQty;
          showToast(`Updated "${product.name}" quantity in cart.`, 'success');
        }
        return updated;
      } else {
        showToast(`Added "${product.name}" (${color} / ${size}) to cart!`, 'success');
        return [
          ...prev,
          {
            productId: product.id,
            name: product.name,
            price: basePrice,
            discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
            activePrice: activePrice,
            image: itemImage,
            selectedSize: size,
            selectedColor: color,
            quantity: quantity,
            stock: itemStock,
            sku: itemSku,
            variantId: variant?.id || null
          }
        ];
      }
    });
  };

  const removeFromCart = (productId, selectedSize, selectedColor) => {
    setCartItems((prev) =>
      prev.filter(
        (item) =>
          !(item.productId === productId && item.selectedSize === selectedSize && item.selectedColor === selectedColor)
      )
    );
    showToast("Item removed from cart.", "info");
  };

  const updateQuantity = (productId, selectedSize, selectedColor, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId, selectedSize, selectedColor);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId && item.selectedSize === selectedSize && item.selectedColor === selectedColor) {
          if (item.stock && newQuantity > item.stock) {
            showToast(`Max stock reached (${item.stock}).`, 'error');
            return { ...item, quantity: item.stock };
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Re-verify current live prices and stock against Firestore before checkout
  const syncWithFirestore = async () => {
    if (cartItems.length === 0) return { valid: true, items: [] };

    const updatedItems = [];
    let hasChanges = false;

    for (const item of cartItems) {
      try {
        const liveDoc = await getProductById(item.productId);
        if (!liveDoc || liveDoc.isActive === false) {
          hasChanges = true;
          continue; // Item dropped if deleted or inactive
        }

        const liveActivePrice = liveDoc.discountPrice && Number(liveDoc.discountPrice) > 0
          ? Number(liveDoc.discountPrice)
          : Number(liveDoc.price);

        if (liveActivePrice !== item.activePrice || liveDoc.name !== item.name) {
          hasChanges = true;
        }

        updatedItems.push({
          ...item,
          name: liveDoc.name,
          price: Number(liveDoc.price),
          discountPrice: liveDoc.discountPrice ? Number(liveDoc.discountPrice) : null,
          activePrice: liveActivePrice,
          image: (liveDoc.images && liveDoc.images[0]) || item.image,
          stock: liveDoc.stock
        });
      } catch (err) {
        console.error("Error verifying cart item with Firestore:", err);
        updatedItems.push(item);
      }
    }

    if (hasChanges) {
      setCartItems(updatedItems);
      showToast("Cart prices updated with latest store values.", "info");
    }

    return { valid: true, items: updatedItems };
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.activePrice * item.quantity), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        totalItems,
        syncWithFirestore
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
