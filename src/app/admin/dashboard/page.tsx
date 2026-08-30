"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Package, Users, LogOut, Phone, Save, Store, Plus } from 'lucide-react';
import Image from 'next/image';

// Dados Fakes para o MVP (Futuramente vira do Supabase)
const mockOrders = [
  { id: 'proj_2035', status: 'Aguardando Pagamento', scale: '100%', qty: 1, price: '86,40', date: 'Hoje, 11:30' },
  { id: 'proj_8842', status: 'Pago - Na Fila (BambuLab)', scale: '50%', qty: 5, price: '124,50', date: 'Ontem, 15:20' },
  { id: 'proj_1193', status: 'Cancelado (Falta de suporte)', scale: '100%', qty: 1, price: '92,00', date: '28/08/2026' }
];

const mockProducts = [
  { id: 'prod_1', name: 'Busto Heroico', price: '149,90', stock: 12 },
  { id: 'prod_2', name: 'Luminária Geométrica', price: '89,90', stock: 5 },
  { id: 'prod_3', name: 'Mascote Corporativo', price: '199,00', stock: 2 }
];

export default function AdminDashboard() {
  const router = useRouter();
  const [whatsapp, setWhatsapp] = useState('');
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'projetos' | 'vitrine' | 'automacoes'>('projetos');

  useEffect(() => {
    const auth = localStorage.getItem('criativa_admin_auth');
    if (auth !== 'true') {
      router.push('/admin');
    }

    const savedWa = localStorage.getItem('criativa_whatsapp');
    if (savedWa) setWhatsapp(savedWa);
  }, [router]);

  const handleSaveSettings = () => {
    localStorage.setItem('criativa_whatsapp', whatsapp);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const logout = () => {
    localStorage.removeItem('criativa_admin_auth');
    router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 glass-panel border-r border-white/5 p-6 flex flex-col gap-6 md:min-h-screen rounded-none">
        <div className="flex items-center gap-3 border-b border-white/10 pb-6">
          <Image src="/logos/logo-white.jpg" alt="Logo" width={40} height={40} className="rounded-full" />
          <h2 className="font-bold text-lg tracking-wide">Admin</h2>
        </div>

        <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab('projetos')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'projetos' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
            <Package size={18} className={activeTab === 'projetos' ? 'text-[#FF3366]' : ''} /> Pedidos Personalizados
          </button>
          <button onClick={() => setActiveTab('vitrine')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'vitrine' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
            <Store size={18} className={activeTab === 'vitrine' ? 'text-[#E0829D]' : ''} /> Vitrine E-commerce
          </button>
          <button onClick={() => setActiveTab('automacoes')} className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${activeTab === 'automacoes' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
            <Settings size={18} className={activeTab === 'automacoes' ? 'text-[#8A2BE2]' : ''} /> Automações
          </button>
        </nav>

        <button onClick={logout} className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-500/10 rounded-lg transition mt-auto">
          <LogOut size={18} /> Sair do Painel
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen custom-scrollbar">
        <header className="mb-10">
          <h1 className="text-3xl font-bold gradient-text">
            {activeTab === 'projetos' && 'Gestão de Projetos I.A.'}
            {activeTab === 'vitrine' && 'Estoque da Vitrine'}
            {activeTab === 'automacoes' && 'Configurações de Automação'}
          </h1>
          <p className="text-gray-400 mt-2">Controle total da sua fábrica digital.</p>
        </header>

        {/* TAB: PROJETOS */}
        {activeTab === 'projetos' && (
          <div className="space-y-4 max-w-4xl">
            <h3 className="text-xl font-bold flex items-center gap-2 border-b border-white/10 pb-3">
              <Package size={20} className="text-[#FF3366]"/> Últimos Orçamentos Gerados
            </h3>
            
            <div className="glass-panel overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-gray-400">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Escala / Qtd</th>
                    <th className="p-4">Preço (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {mockOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/5 transition">
                      <td className="p-4 font-mono text-[#8A2BE2]">{order.id}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${order.status.includes('Pago') ? 'bg-green-500/20 text-green-300' : order.status.includes('Cancelado') ? 'bg-red-500/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 text-gray-300">{order.scale} | {order.qty}x</td>
                      <td className="p-4 font-bold text-white">{order.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: VITRINE ECOMMERCE */}
        {activeTab === 'vitrine' && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Store size={20} className="text-[#E0829D]"/> Produtos Prontos
              </h3>
              <button className="btn-primary py-2 px-4 text-sm flex items-center gap-2">
                <Plus size={16} /> Novo Produto
              </button>
            </div>
            
            <div className="glass-panel overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-gray-400">
                  <tr>
                    <th className="p-4">Produto</th>
                    <th className="p-4">Preço de Venda</th>
                    <th className="p-4">Estoque Físico</th>
                    <th className="p-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {mockProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-white/5 transition">
                      <td className="p-4 font-bold">{prod.name}</td>
                      <td className="p-4 text-green-400">R$ {prod.price}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${prod.stock > 5 ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'}`}>
                          {prod.stock} un.
                        </span>
                      </td>
                      <td className="p-4">
                        <button className="text-gray-400 hover:text-white text-xs underline">Editar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: AUTOMAÇÕES */}
        {activeTab === 'automacoes' && (
          <div className="space-y-4 max-w-md">
             <h3 className="text-xl font-bold flex items-center gap-2 border-b border-white/10 pb-3">
              <Settings size={20} className="text-[#8A2BE2]"/> Motor de Automação
            </h3>

            <div className="glass-panel p-6 space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-2">
                  <Phone size={16} className="text-green-400"/> WhatsApp do Especialista
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Número que receberá clientes da sala 360º.
                </p>
                <input 
                  type="text" 
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="5511999999999"
                  className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-[#8A2BE2] font-mono text-sm"
                />
              </div>

              <button 
                onClick={handleSaveSettings}
                className="w-full btn-secondary border border-[#8A2BE2]/50 flex justify-center items-center gap-2 hover:bg-[#8A2BE2]/20"
              >
                <Save size={18} /> {saved ? 'Salvo com sucesso!' : 'Salvar'}
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
