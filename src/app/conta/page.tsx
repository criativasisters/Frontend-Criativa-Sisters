"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { User, Heart, Package, LogOut } from 'lucide-react';

export default function Conta() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'perfil' | 'favoritos' | 'compras'>('compras');
  
  // Profile edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ full_name: '', phone: '', rua: '', numero: '', cidade: '', estado: '', cep: '' });

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      setUser(session.user);

      // Puxar Perfil
      const { data: pData } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (pData) {
        setProfile(pData);
        setEditData({
          full_name: pData.full_name || '',
          phone: pData.phone || '',
          rua: pData.shipping_address?.rua || '',
          numero: pData.shipping_address?.numero || '',
          cidade: pData.shipping_address?.cidade || '',
          estado: pData.shipping_address?.estado || '',
          cep: pData.shipping_address?.cep || ''
        });
      }

      // Puxar Compras (Orders)
      const { data: oData } = await supabase.from('orders').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
      if (oData) setOrders(oData);

      // Puxar Favoritos
      const { data: fData } = await supabase.from('favorites').select('*, products(*)').eq('user_id', session.user.id).order('created_at', { ascending: false });
      if (fData) setFavorites(fData.map((f: any) => f.products));
    }
    loadData();
  }, [router]);

  const handleSaveProfile = async () => {
    try {
      const shipping_address = {
        rua: editData.rua, numero: editData.numero, cidade: editData.cidade, estado: editData.estado, cep: editData.cep
      };
      await supabase.from('profiles').update({
        full_name: editData.full_name,
        phone: editData.phone,
        shipping_address
      }).eq('id', user.id);
      
      setProfile({ ...profile, full_name: editData.full_name, phone: editData.phone, shipping_address });
      setIsEditing(false);
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      alert('Erro ao atualizar perfil.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-[#050505] pt-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-2">
          <div className="glass-panel p-6 mb-6 text-center border-white/5">
            <div className="w-20 h-20 bg-gradient-to-tr from-[#FF3366] to-[#8A2BE2] rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold text-white">
              {profile?.full_name?.charAt(0) || user.email?.charAt(0)}
            </div>
            <h3 className="font-bold truncate">{profile?.full_name || 'Usuário'}</h3>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>

          <button onClick={() => setActiveTab('compras')} className={`w-full flex items-center gap-3 p-4 rounded-lg transition-colors ${activeTab === 'compras' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
            <Package size={20} /> Minhas Compras
          </button>
          <button onClick={() => setActiveTab('favoritos')} className={`w-full flex items-center gap-3 p-4 rounded-lg transition-colors ${activeTab === 'favoritos' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
            <Heart size={20} /> Favoritos
          </button>
          <button onClick={() => setActiveTab('perfil')} className={`w-full flex items-center gap-3 p-4 rounded-lg transition-colors ${activeTab === 'perfil' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
            <User size={20} /> Meu Perfil
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-4 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors mt-8">
            <LogOut size={20} /> Sair da Conta
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1">
          <div className="glass-panel border-white/5 p-8 min-h-[500px]">
            
            {activeTab === 'compras' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Minhas Compras</h2>
                {orders.length === 0 ? (
                  <p className="text-gray-500">Você ainda não gerou nenhuma peça 3D.</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map(order => (
                      <div key={order.id} className="bg-white/5 border border-white/10 p-6 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-lg mb-1">Pedido <span className="text-[#8A2BE2] text-sm font-mono">#{order.id.split('-')[0]}</span></p>
                          <p className="text-sm text-gray-400">Gerado em: {new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                          <p className="text-sm text-gray-400">Qtd: {order.quantity} | Escala: {order.scale_percent}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-[#FF3366] mb-2">R$ {order.total_price}</p>
                          <span className={`px-3 py-1 text-xs rounded-full ${order.status.includes('Pago') ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'favoritos' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Meus Favoritos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.length === 0 ? (
                    <p className="text-gray-500 col-span-3">Nenhum produto favoritado.</p>
                  ) : (
                    favorites.map((prod: any) => (
                      <div key={prod.id} className="bg-[#111] border border-white/10 rounded-lg overflow-hidden group">
                        <div className="h-48 relative">
                          {prod.image_url ? (
                            <Image src={prod.image_url} alt={prod.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Package size={48} className="text-gray-600" /></div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold mb-1">{prod.name}</h3>
                          <p className="text-[#E0829D] font-black">R$ {prod.price}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'perfil' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Dados do Perfil</h2>
                  {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="text-sm text-[#FF3366] hover:underline">Editar Dados</button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Nome Completo</label>
                    <input disabled={!isEditing} type="text" value={editData.full_name} onChange={e => setEditData({...editData, full_name: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-3 text-white disabled:opacity-50 outline-none focus:border-[#FF3366]" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">WhatsApp / Telefone</label>
                    <input disabled={!isEditing} type="text" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-3 text-white disabled:opacity-50 outline-none focus:border-[#FF3366]" />
                  </div>
                  <div className="md:col-span-2 mt-4 border-t border-white/5 pt-6">
                    <h3 className="text-lg font-bold mb-4">Endereço de Entrega</h3>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Rua</label>
                    <input disabled={!isEditing} type="text" value={editData.rua} onChange={e => setEditData({...editData, rua: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-3 text-white disabled:opacity-50 outline-none focus:border-[#FF3366]" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Número</label>
                    <input disabled={!isEditing} type="text" value={editData.numero} onChange={e => setEditData({...editData, numero: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-3 text-white disabled:opacity-50 outline-none focus:border-[#FF3366]" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">CEP</label>
                    <input disabled={!isEditing} type="text" value={editData.cep} onChange={e => setEditData({...editData, cep: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-3 text-white disabled:opacity-50 outline-none focus:border-[#FF3366]" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Cidade</label>
                    <input disabled={!isEditing} type="text" value={editData.cidade} onChange={e => setEditData({...editData, cidade: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-3 text-white disabled:opacity-50 outline-none focus:border-[#FF3366]" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Estado (UF)</label>
                    <input disabled={!isEditing} type="text" value={editData.estado} onChange={e => setEditData({...editData, estado: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-3 text-white disabled:opacity-50 outline-none focus:border-[#FF3366]" />
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-8 flex gap-4">
                    <button onClick={handleSaveProfile} className="btn-primary">Salvar Alterações</button>
                    <button onClick={() => setIsEditing(false)} className="btn-secondary">Cancelar</button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
