"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type CartItem = {
  id: string; // ID do produto ou taskId da IA
  name: string;
  price: number;
  quantity: number;
  image_url: string;
  weight_g?: number; // Peso em gramas para frete
  type: 'product' | 'ai_model';
  // Atributos específicos da IA
  scale_percent?: number;
  dimensions?: { x: number, y: number, z: number };
  colors?: string[];
  details?: string;
};

interface CartContextProps {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartWeight: number;
}

const CartContext = createContext<CartContextProps>({} as CartContextProps);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('cs_cart');
    if (saved) setItems(JSON.parse(saved));
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('cs_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (newItem: CartItem) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === newItem.id);
      if (exists && exists.type === 'product') {
        // Se já tem, só aumenta a qtd (se for produto normal)
        return prev.map(i => i.id === newItem.id ? { ...i, quantity: i.quantity + newItem.quantity } : i);
      }
      return [...prev, newItem];
    });
  };

  const removeFromCart = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    if(qty < 1) return;
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => setItems([]);

  const cartTotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const cartWeight = items.reduce((acc, item) => acc + ((item.weight_g || 200) * item.quantity), 0); // fallback de 200g

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartWeight }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
