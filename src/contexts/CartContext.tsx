"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

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

  // Sync to local storage & Supabase (Abandoned Carts Insight)
  useEffect(() => {
    localStorage.setItem('cs_cart', JSON.stringify(items));
    
    // Sincronizar com banco de dados para rastreio de Carrinho Abandonado
    const syncCart = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return; // Só rastreia logados

      const totalValue = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
      
      if (items.length > 0) {
        await supabase.from('analytics_carts').upsert({
          user_id: session.user.id,
          items: items,
          total_value: totalValue,
          status: 'abandoned', // Fica como abandonado até ele finalizar a compra no checkout
          last_updated: new Date().toISOString()
        }, { onConflict: 'user_id' });
      } else {
        // Se esvaziou, podemos deletar ou marcar como limpo.
        await supabase.from('analytics_carts').delete().eq('user_id', session.user.id);
      }
    };
    
    // Debounce leve para não sobrecarregar
    const timeout = setTimeout(syncCart, 1000);
    return () => clearTimeout(timeout);
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
