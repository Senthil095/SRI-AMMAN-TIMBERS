import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used within CartProvider');
    return context;
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState(() => {
        try {
            const saved = localStorage.getItem('paintpro_cart');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    const [savedItems, setSavedItems] = useState(() => {
        try {
            const saved = localStorage.getItem('paintpro_saved');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('paintpro_cart', JSON.stringify(cartItems));
    }, [cartItems]);

    useEffect(() => {
        localStorage.setItem('paintpro_saved', JSON.stringify(savedItems));
    }, [savedItems]);

    const addToCart = (product, selectedSize = null) => {
        setCartItems((prev) => {
            const cartKey = selectedSize ? `${product.id}_${selectedSize.label}` : product.id;
            const existing = prev.find((item) => item.cartKey === cartKey);
            if (existing) {
                toast.success('Quantity updated!');
                return prev.map((item) =>
                    item.cartKey === cartKey ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            toast.success('Added to cart!');
            return [...prev, { ...product, quantity: 1, selectedSize, cartKey }];
        });
    };

    const removeFromCart = (cartKey) => {
        setCartItems((prev) => prev.filter((item) => item.cartKey !== cartKey));
        toast.success('Removed from cart');
    };

    const updateQuantity = (cartKey, qty) => {
        if (qty < 1) { removeFromCart(cartKey); return; }
        setCartItems((prev) =>
            prev.map((item) => (item.cartKey === cartKey ? { ...item, quantity: qty } : item))
        );
    };

    const saveForLater = (cartKey) => {
        const item = cartItems.find(i => i.cartKey === cartKey);
        if (!item) return;
        setSavedItems(prev => {
            const exists = prev.find(i => i.cartKey === cartKey);
            return exists ? prev : [...prev, { ...item, quantity: 1 }];
        });
        removeFromCart(cartKey);
        toast.success('Saved for later');
    };

    const moveToCart = (cartKey) => {
        const item = savedItems.find(i => i.cartKey === cartKey);
        if (!item) return;
        setSavedItems(prev => prev.filter(i => i.cartKey !== cartKey));
        addToCart(item, item.selectedSize);
        toast.success('Moved to cart');
    };

    const removeSaved = (cartKey) => {
        setSavedItems(prev => prev.filter(i => i.cartKey !== cartKey));
    };

    const clearCart = () => setCartItems([]);

    const cartTotal = cartItems.reduce(
        (sum, item) => {
            const price = item.selectedSize ? item.selectedSize.price : (item.discountPrice || item.price);
            return sum + price * item.quantity;
        }, 0
    );
    const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    const value = {
        cartItems, savedItems,
        cartTotal, cartCount,
        isCartOpen, setIsCartOpen,
        addToCart, removeFromCart, updateQuantity,
        saveForLater, moveToCart, removeSaved,
        clearCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
