"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Package, Users, LogOut, Phone, Save, Store, Plus, Edit, Type } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

// Tipagens
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image_url: string;
}

interface LandingContent {
  id: string;
  title: string;
  subtitle: string;
  cta_text: string;
}

const mockOrders = [
  { id: 'proj_2035', status: 'Aguardando Pagamento', scale: '100%', qty: 1, price: '86,40', date: 'Hoje, 11:30' },
  { id: 'proj_8842', status: 'Pago - Na Fila', scale: '50%', qty: 5, price: '124,50', date: 'Ontem, 15:20' }
];

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'projetos' | 'vitrine' | 'automacoes' | 'landing'>('projetos');
  
  // Estados Supabase
  const [products, setProducts] = useState<Product[]>([]);
  const [landingContent, setLandingContent] = useState<LandingContent[]>([]);
  const [whatsapp, setWhatsapp] = useState('');
  const [saved, setSaved] = useState(false);

  // Estado do Form de Produto
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [prodForm, setProdForm] = useState({ name: '', price: '', stock: '', category: '' });

  // Autenticação e Fetch Inicial
  useEffect(() => {
    const auth = localStorage.getItem('criativa_admin_auth');
    if (auth !== 'true') router.push('/admin');

    const savedWa = localStorage.getItem('criativa_whatsapp');
    if (savedWa) setWhatsapp(savedWa);

    fetchData();
  }, [router]);

  const fetchData = async () => {
    const { data: prods } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (prods) setProducts(prods);

    const { data: texts } = await supabase.from('landing_content').select('*');
    if (texts) setLandingContent(texts);
  };

  // Funções de Produto
  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: prodForm.name,
      price: parseFloat(prodForm.price),
      stock: parseInt(prodForm.stock),
      category: prodForm.category
    };

    if (editingProdId) {
      await supabase.from('products').update(payload).eq('id', editingProdId);
    } else {
      await supabase.from('products').insert([payload]);
    }

    setShowProductForm(false);
    setProdForm({ name: '', price: '', stock: '', category: '' });
    setEditingProdId(null);
    fetchData();
  };

  const openEditProduct = (prod: Product) => {
    setProdForm({ name: prod.name, price: prod.price.toString(), stock: prod.stock.toString(), category: prod.category || 'Geral' });
    setEditingProdId(prod.id);
    setShowProductForm(true);
  };

  // Funções de Landing Page
  const saveLandingContent = async (id: string, field: string, value: string) => {
    await supabase.from('landing_content').update({ [field]: value }).eq('id', id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    fetchData();
  };

  const handleSaveAutomations = () => {
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
      <aside className="w-full md:w-64 glass-panel border-r border-white/5 p-6 flex flex-col gap-6 rounded-none">
        <div className="flex items-center gap-3 border-b border-white/10 pb-6">
          <Image src="/logos/logo-white.jpg" alt="Logo" width={40} height={40} className="rounded-full" />
          <h2 className="font-bold text-lg">Painel Admin</h2>
        </div>

        <nav className="flex-1 space-y-2">
          <button onClick={() => setActiveTab('projetos')} className={`w-full flex items-center gap-3 p-3 rounded-lg ${activeTab === 'projetos' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
            <Package size={18} className={activeTab === 'projetos' ? 'text-[#FF3366]' : ''} /> Pedidos I.A.
          </button>
          <button onClick={() => setActiveTab('vitrine')} className={`w-full flex items-center gap-3 p-3 rounded-lg ${activeTab === 'vitrine' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
            <Store size={18} className={activeTab === 'vitrine' ? 'text-[#E0829D]' : ''} /> Loja / Estoque
          </button>
          <button onClick={() => setActiveTab('landing')} className={`w-full flex items-center gap-3 p-3 rounded-lg ${activeTab === 'landing' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
            <Type size={18} className={activeTab === 'landing' ? 'text-[#FF3366]' : ''} /> Site / Textos
          </button>
          <button onClick={() => setActiveTab('automacoes')} className={`w-full flex items-center gap-3 p-3 rounded-lg ${activeTab === 'automacoes' ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5'}`}>
            <Settings size={18} className={activeTab === 'automacoes' ? 'text-[#8A2BE2]' : ''} /> Automações
          </button>
        </nav>

        <button onClick={logout} className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-500/10 rounded-lg transition mt-auto">
          <LogOut size={18} /> Sair
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 h-screen overflow-y-auto custom-scrollbar">
        <header className="mb-10">
          <h1 className="text-3xl font-bold gradient-text uppercase tracking-wider">
            {activeTab === 'projetos' && 'Orçamentos Personalizados'}
            {activeTab === 'vitrine' && 'Gestão de Estoque da Vitrine'}
            {activeTab === 'landing' && 'Editor do Site (Landing Page)'}
            {activeTab === 'automacoes' && 'Motor de Automação'}
          </h1>
        </header>

        {/* TAB: PROJETOS (Apenas Mock visual por enquanto) */}
        {activeTab === 'projetos' && (
          <div className="glass-panel overflow-hidden max-w-4xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-gray-400">
                <tr><th className="p-4">ID</th><th className="p-4">Status</th><th className="p-4">Preço</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {mockOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-white/5"><td className="p-4 font-mono text-[#8A2BE2]">{order.id}</td><td className="p-4">{order.status}</td><td className="p-4 font-bold">{order.price}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB: VITRINE (Supabase Real) */}
        {activeTab === 'vitrine' && (
          <div className="max-w-4xl space-y-6">
            <div className="flex justify-end">
              <button onClick={() => { setEditingProdId(null); setProdForm({name:'',price:'',stock:'',category:''}); setShowProductForm(!showProductForm); }} className="btn-primary py-2 px-4 flex items-center gap-2 text-sm">
                {showProductForm ? 'Cancelar' : <><Plus size={16}/> Novo Produto</>}
              </button>
            </div>

            {showProductForm && (
              <form onSubmit={saveProduct} className="glass-panel p-6 grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className="text-sm text-gray-400 block mb-1">Nome</label><input required type="text" value={prodForm.name} onChange={e=>setProdForm({...prodForm, name: e.target.value})} className="w-full bg-[#121212] border border-white/10 p-2 rounded text-white" /></div>
                <div><label className="text-sm text-gray-400 block mb-1">Preço (R$)</label><input required type="number" step="0.01" value={prodForm.price} onChange={e=>setProdForm({...prodForm, price: e.target.value})} className="w-full bg-[#121212] border border-white/10 p-2 rounded text-white" /></div>
                <div><label className="text-sm text-gray-400 block mb-1">Estoque</label><input required type="number" value={prodForm.stock} onChange={e=>setProdForm({...prodForm, stock: e.target.value})} className="w-full bg-[#121212] border border-white/10 p-2 rounded text-white" /></div>
                <div className="col-span-2"><button type="submit" className="w-full btn-secondary">Salvar Produto</button></div>
              </form>
            )}

            <div className="glass-panel overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-gray-400">
                  <tr><th className="p-4">Produto</th><th className="p-4">Preço</th><th className="p-4">Estoque</th><th className="p-4"></th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {products.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-500">Nenhum produto cadastrado.</td></tr>}
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-white/5 transition">
                      <td className="p-4 font-bold">{prod.name}</td>
                      <td className="p-4 text-green-400">R$ {prod.price}</td>
                      <td className="p-4">{prod.stock} un.</td>
                      <td className="p-4 text-right">
                        <button onClick={() => openEditProduct(prod)} className="text-blue-400 hover:text-white p-2"><Edit size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: LANDING PAGE EDITOR (Supabase Real) */}
        {activeTab === 'landing' && (
          <div className="max-w-4xl space-y-8">
            {landingContent.map((section) => (
              <div key={section.id} className="glass-panel p-6 space-y-4">
                <h3 className="font-bold text-lg text-[#E0829D] capitalize border-b border-white/10 pb-2">{section.id.replace('_', ' ')}</h3>
                
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Título Principal</label>
                  <input type="text" defaultValue={section.title} onBlur={(e) => saveLandingContent(section.id, 'title', e.target.value)} className="w-full bg-[#121212] border border-white/10 p-3 rounded text-white focus:border-[#FF3366] transition" />
                </div>
                
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Subtítulo (Texto de apoio)</label>
                  <textarea defaultValue={section.subtitle} onBlur={(e) => saveLandingContent(section.id, 'subtitle', e.target.value)} className="w-full bg-[#121212] border border-white/10 p-3 rounded text-white h-24 focus:border-[#FF3366] transition" />
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Texto do Botão (CTA)</label>
                  <input type="text" defaultValue={section.cta_text} onBlur={(e) => saveLandingContent(section.id, 'cta_text', e.target.value)} className="w-full bg-[#121212] border border-white/10 p-3 rounded text-white focus:border-[#FF3366] transition" />
                </div>
              </div>
            ))}
            {saved && <p className="text-green-400 fixed bottom-6 right-6 glass-panel p-4 animate-bounce">Site atualizado ao vivo!</p>}
          </div>
        )}

        {/* TAB: AUTOMAÇÕES */}
        {activeTab === 'automacoes' && (
          <div className="glass-panel p-6 max-w-md space-y-6">
            <div>
              <label className="text-sm text-gray-300 flex items-center gap-2 mb-2"><Phone size={16} className="text-green-400"/> WhatsApp do Especialista</label>
              <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white focus:border-[#8A2BE2]" />
            </div>
            <button onClick={handleSaveAutomations} className="w-full btn-secondary"><Save size={18} className="inline mr-2"/> {saved ? 'Salvo!' : 'Salvar'}</button>
          </div>
        )}

      </main>
    </div>
  );
}
