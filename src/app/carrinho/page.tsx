"use client";

import React from 'react';
import { useCart } from '@/contexts/CartContext';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, cartTotal } = useCart();

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
        <ShoppingBag size={64} className="text-gray-600 mb-6" />
        <h1 className="text-2xl font-bold mb-2">Seu Carrinho está Vazio</h1>
        <p className="text-gray-400 mb-8">Parece que você ainda não adicionou nenhum modelo 3D mágico.</p>
        <Link href="/" className="btn-primary">Explorar Produtos</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Carrinho de Compras</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="glass-panel p-4 flex gap-4 items-center">
                <div className="w-20 h-20 relative bg-black rounded-lg overflow-hidden shrink-0 border border-white/5">
                  <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-lg leading-tight mb-1">{item.name}</h3>
                  {item.type === 'ai_model' && item.scale_percent && (
                    <span className="text-xs bg-[#8A2BE2]/20 text-[#8A2BE2] px-2 py-1 rounded">Personalizado ({item.scale_percent}%)</span>
                  )}
                  <div className="text-[#FF3366] font-bold mt-2">R$ {item.price.toFixed(2).replace('.', ',')}</div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-red-500 transition">
                    <Trash2 size={18} />
                  </button>
                  <div className="flex items-center gap-2 bg-black/50 rounded-lg p-1 border border-white/10">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 hover:text-[#FF3366]"><Minus size={14}/></button>
                    <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 hover:text-[#FF3366]"><Plus size={14}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="md:col-span-1">
            <div className="glass-panel p-6 sticky top-24">
              <h3 className="text-lg font-bold border-b border-white/10 pb-4 mb-4">Resumo</h3>
              
              <div className="flex justify-between mb-2 text-gray-400">
                <span>Subtotal</span>
                <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between mb-4 text-gray-400 text-sm">
                <span>Frete & Cupons</span>
                <span>Calculados no Próximo Passo</span>
              </div>
              
              <div className="flex justify-between items-center border-t border-white/10 pt-4 mb-6">
                <span className="font-bold text-lg">Total Previsto</span>
                <span className="font-bold text-2xl text-[#E0829D]">R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
              </div>

              <Link href="/checkout" className="w-full btn-primary flex justify-center items-center gap-2">
                Continuar para Pagamento <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
