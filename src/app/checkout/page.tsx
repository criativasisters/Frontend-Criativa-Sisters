"use client";

import React, { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/lib/supabase';
import { Truck, Tag, CreditCard, Lock, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { items, cartTotal, cartWeight, clearCart } = useCart();
  const router = useRouter();

  const [cep, setCep] = useState('');
  const [address, setAddress] = useState({ logradouro: '', numero: '', complemento: '', bairro: '', localidade: '', uf: '' });
  
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<any>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');

  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', whatsapp: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // Auto-complete via ViaCEP
  useEffect(() => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        .then(res => res.json())
        .then(data => {
          if (!data.erro) {
            setAddress(prev => ({ ...prev, logradouro: data.logradouro, bairro: data.bairro, localidade: data.localidade, uf: data.uf }));
            fetchShippingOptions(cleanCep);
          }
        });
    }
  }, [cep]);

  const fetchShippingOptions = async (validCep: string) => {
    setLoadingShipping(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/shipping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cep: validCep, weightGrams: cartWeight })
      });
      const data = await res.json();
      if (data.success && data.options.length > 0) {
        setShippingOptions(data.options);
        setSelectedShipping(data.options[0]); // Seleciona o mais barato por padrão
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingShipping(false);
    }
  };

  const applyCoupon = async () => {
    setCouponError('');
    if (!couponCode) return;
    
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (!coupon) {
      setCouponError('Cupom inválido ou expirado.');
      return;
    }

    if (cartTotal < coupon.min_purchase) {
      setCouponError(`Este cupom exige uma compra mínima de R$ ${coupon.min_purchase.toFixed(2).replace('.', ',')}.`);
      return;
    }

    setAppliedCoupon(coupon);
  };

  // Cálculos Finais
  const shippingCost = selectedShipping ? parseFloat(selectedShipping.price) : 0;
  
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      discount = cartTotal * (appliedCoupon.discount_value / 100);
    } else if (appliedCoupon.discount_type === 'fixed') {
      discount = appliedCoupon.discount_value;
    } else if (appliedCoupon.discount_type === 'free_shipping') {
      discount = shippingCost; // Abate o valor do frete
    }
  }

  const finalTotal = Math.max(0, cartTotal + shippingCost - discount);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipping) {
      alert("Selecione um método de envio.");
      return;
    }

    setIsProcessing(true);
    
    // Injetar Stripe aqui no futuro!
    // Simulando delay de gateway...
    await new Promise(r => setTimeout(r, 1500));

    const { data: { session } } = await supabase.auth.getSession();
    
    const orderItems = items.map(i => `${i.quantity}x ${i.name}`).join(' | ');

    // Salvar pedido no Supabase
    const { error } = await supabase.from('orders').insert({
      user_id: session?.user?.id || null,
      customer_name: customerInfo.name,
      customer_whatsapp: customerInfo.whatsapp,
      customer_email: customerInfo.email,
      customer_details: `[CARRINHO] Itens: ${orderItems}. Frete: ${selectedShipping.name} (R$ ${shippingCost}). Endereço: ${address.logradouro}, ${address.numero} - ${address.localidade}/${address.uf}`,
      total_price: finalTotal,
      status: 'Aguardando Pagamento' // Mudar para 'Pago' quando tiver Stripe real
    });

    setIsProcessing(false);

    if (error) {
      alert("Erro ao salvar pedido.");
    } else {
      setOrderComplete(true);
      clearCart();
    }
  };

  if (items.length === 0 && !orderComplete) {
    router.push('/carrinho');
    return null;
  }

  if (orderComplete) {
    return (
      <main className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-center">
        <div className="glass-panel p-12 border-green-500/30 max-w-lg">
          <CheckCircle size={64} className="text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Pedido Realizado!</h1>
          <p className="text-gray-400 mb-8">Recebemos o seu pedido. No MVP ele entra como "Aguardando Pagamento" e você deve combinar o PIX no WhatsApp.</p>
          <button onClick={() => router.push('/')} className="btn-primary w-full">Voltar para Loja</button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>
        
        <form onSubmit={handleCheckout} className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          <div className="space-y-8">
            {/* Contato */}
            <section className="glass-panel p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><User size={20} className="text-[#FF3366]"/> Dados de Contato</h2>
              <div className="grid grid-cols-1 gap-4">
                <input type="text" placeholder="Nome Completo" required value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} className="bg-black/50 border border-white/10 rounded p-3 text-sm focus:border-[#FF3366] outline-none" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="email" placeholder="E-mail" required value={customerInfo.email} onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})} className="bg-black/50 border border-white/10 rounded p-3 text-sm focus:border-[#FF3366] outline-none" />
                  <input type="text" placeholder="WhatsApp" required value={customerInfo.whatsapp} onChange={e => setCustomerInfo({...customerInfo, whatsapp: e.target.value})} className="bg-black/50 border border-white/10 rounded p-3 text-sm focus:border-[#FF3366] outline-none" />
                </div>
              </div>
            </section>

            {/* Endereço */}
            <section className="glass-panel p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Truck size={20} className="text-[#8A2BE2]"/> Entrega</h2>
              <div className="grid grid-cols-1 gap-4">
                <input type="text" placeholder="CEP (Apenas números)" maxLength={8} required value={cep} onChange={e => setCep(e.target.value)} className="bg-black/50 border border-white/10 rounded p-3 text-sm focus:border-[#8A2BE2] outline-none w-1/2" />
                
                <div className="grid grid-cols-4 gap-4">
                  <input type="text" placeholder="Rua" required value={address.logradouro} onChange={e => setAddress({...address, logradouro: e.target.value})} className="col-span-3 bg-black/50 border border-white/10 rounded p-3 text-sm outline-none" />
                  <input type="text" placeholder="Nº" required value={address.numero} onChange={e => setAddress({...address, numero: e.target.value})} className="col-span-1 bg-black/50 border border-white/10 rounded p-3 text-sm outline-none" />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <input type="text" placeholder="Bairro" required value={address.bairro} onChange={e => setAddress({...address, bairro: e.target.value})} className="col-span-1 bg-black/50 border border-white/10 rounded p-3 text-sm outline-none" />
                  <input type="text" placeholder="Cidade" required value={address.localidade} onChange={e => setAddress({...address, localidade: e.target.value})} className="col-span-1 bg-black/50 border border-white/10 rounded p-3 text-sm outline-none" />
                  <input type="text" placeholder="UF" required value={address.uf} onChange={e => setAddress({...address, uf: e.target.value})} className="col-span-1 bg-black/50 border border-white/10 rounded p-3 text-sm outline-none" />
                </div>
              </div>

              {loadingShipping && <p className="text-[#8A2BE2] text-sm mt-4 animate-pulse">Calculando opções de frete (Melhor Envio)...</p>}
              
              {shippingOptions.length > 0 && (
                <div className="mt-6 space-y-3">
                  <p className="font-bold text-sm text-gray-300">Selecione o frete:</p>
                  {shippingOptions.map(opt => (
                    <label key={opt.id} className={`flex items-center justify-between p-3 rounded border cursor-pointer transition ${selectedShipping?.id === opt.id ? 'border-[#8A2BE2] bg-[#8A2BE2]/10' : 'border-white/10 bg-black/30 hover:border-white/30'}`}>
                      <div className="flex items-center gap-3">
                        <input type="radio" name="shipping" checked={selectedShipping?.id === opt.id} onChange={() => setSelectedShipping(opt)} className="accent-[#8A2BE2]" />
                        <div>
                          <p className="font-bold text-sm">{opt.name}</p>
                          <p className="text-xs text-gray-400">Em até {opt.delivery_time} dias úteis</p>
                        </div>
                      </div>
                      <span className="font-bold">R$ {parseFloat(opt.price).toFixed(2).replace('.', ',')}</span>
                    </label>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-8">
            {/* Resumo e Pagamento */}
            <section className="glass-panel p-6 sticky top-24">
              <h3 className="text-xl font-bold border-b border-white/10 pb-4 mb-6">Resumo do Pedido</h3>
              
              {/* Cupom */}
              <div className="flex gap-2 mb-6">
                <input type="text" placeholder="Cupom de Desconto" value={couponCode} onChange={e => setCouponCode(e.target.value)} className="flex-1 bg-black/50 border border-white/10 rounded p-3 text-sm outline-none uppercase" />
                <button type="button" onClick={applyCoupon} className="bg-white/10 hover:bg-white/20 px-4 rounded transition text-sm font-bold"><Tag size={16}/></button>
              </div>
              {couponError && <p className="text-red-400 text-xs -mt-4 mb-4">{couponError}</p>}
              {appliedCoupon && <p className="text-green-400 text-xs -mt-4 mb-4">Cupom {appliedCoupon.code} aplicado com sucesso!</p>}

              {/* Totais */}
              <div className="space-y-3 text-gray-300 mb-6 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal ({items.length} itens)</span>
                  <span>R$ {cartTotal.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete</span>
                  <span>{shippingCost > 0 ? `R$ ${shippingCost.toFixed(2).replace('.', ',')}` : '---'}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-400 font-bold">
                    <span>Desconto ({appliedCoupon?.code})</span>
                    <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center border-t border-white/10 pt-4 mb-8">
                <span className="font-bold text-lg">Total</span>
                <span className="font-black text-3xl text-[#E0829D]">R$ {finalTotal.toFixed(2).replace('.', ',')}</span>
              </div>

              {/* Fake Stripe Placeholder */}
              <div className="bg-black/30 border border-dashed border-white/20 rounded p-4 mb-6 text-center">
                <Lock size={20} className="mx-auto text-gray-500 mb-2" />
                <p className="text-xs text-gray-400 mb-3">O pagamento seguro via Stripe será integrado nesta seção.</p>
                <div className="h-10 bg-white/5 rounded w-full flex items-center px-3 text-gray-600 text-sm">
                   Número do Cartão
                </div>
              </div>

              <button type="submit" disabled={isProcessing} className="w-full btn-primary flex items-center justify-center gap-2">
                {isProcessing ? 'Processando Segurança...' : 'Concluir Compra'}
              </button>
            </section>
          </div>

        </form>
      </div>
    </main>
  );
}
