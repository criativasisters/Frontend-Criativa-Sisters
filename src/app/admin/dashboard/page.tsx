"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Layers, Settings, Phone, Save, Edit, Plus, Package, DollarSign, Download, Image as ImageIcon, Video, Trash } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import Image from 'next/image';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'financeiro' | 'vitrine' | 'landing' | 'stories' | 'automacoes'>('financeiro');
  
  // Supabase States
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [landingContent, setLandingContent] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [whatsapp, setWhatsapp] = useState('');
  
  // Form States
  const [showProductForm, setShowProductForm] = useState(false);
  const [prodForm, setProdForm] = useState({ name: '', price: '', stock: '', category: '' });
  const [editingProdId, setEditingProdId] = useState<string | null>(null);

  const [showBannerForm, setShowBannerForm] = useState(false);
  const [bannerForm, setBannerForm] = useState({ type: 'loop', image_url: '', display_order: '0' });

  const [showStoryForm, setShowStoryForm] = useState(false);
  const [storyForm, setStoryForm] = useState({ video_url: '', thumbnail_url: '', cta_text: 'Comprar', product_id: '' });

  useEffect(() => {
    // Basic Auth Check for MVP
    const authCookie = document.cookie.split('; ').find(row => row.startsWith('admin_auth='));
    if (!authCookie || authCookie.split('=')[1] !== 'true') {
      router.push('/admin');
      return;
    }
    fetchData();
    const wa = localStorage.getItem('cs_whatsapp');
    if (wa) setWhatsapp(wa);
  }, [router]);

  const fetchData = async () => {
    const { data: ords } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (ords) setOrders(ords);

    const { data: prods } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (prods) setProducts(prods);

    const { data: texts } = await supabase.from('landing_content').select('*').order('id');
    if (texts) setLandingContent(texts);

    const { data: bans } = await supabase.from('banners').select('*').order('display_order');
    if (bans) setBanners(bans);

    const { data: stors } = await supabase.from('stories').select('*, products(*)').order('created_at', { ascending: false });
    if (stors) setStories(stors);
  };

  // ---------------- FINANCEIRO (XLSX) ---------------- //
  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(orders.map(o => ({
      'ID Pedido': o.id,
      'Cliente': o.customer_name || 'Desconhecido',
      'Contato (WA)': o.whatsapp || '-',
      'Email': o.email || '-',
      'Endereço de Entrega': o.shipping_address ? `${o.shipping_address.rua}, ${o.shipping_address.numero} - ${o.shipping_address.cidade}/${o.shipping_address.estado} (CEP: ${o.shipping_address.cep})` : 'Não informado',
      'Status': o.status,
      'Revisão Manual': o.requires_human_review ? 'SIM' : 'NÃO',
      'Detalhes': o.details || '',
      'Escala (%)': o.scale_percent,
      'Quantidade': o.quantity,
      'Valor Total (R$)': o.total_price,
      'Data de Criação': new Date(o.created_at).toLocaleString('pt-BR')
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendas");
    XLSX.writeFile(wb, "Relatorio_Financeiro_CriativaSisters.xlsx");
  };

  const totalReceita = orders.filter(o => o.status.includes('Pago')).reduce((acc, curr) => acc + Number(curr.total_price), 0);
  const pedidosPendentes = orders.filter(o => !o.status.includes('Pago')).length;

  // ---------------- BANNERS ---------------- //
  const saveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('banners').insert({
      type: bannerForm.type,
      image_url: bannerForm.image_url,
      display_order: parseInt(bannerForm.display_order)
    });
    setBannerForm({ type: 'loop', image_url: '', display_order: '0' });
    setShowBannerForm(false);
    fetchData();
  };

  const deleteBanner = async (id: string) => {
    if(confirm('Apagar este banner?')) {
      await supabase.from('banners').delete().eq('id', id);
      fetchData();
    }
  };

  // ---------------- STORIES ---------------- //
  const saveStory = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('stories').insert({
      video_url: storyForm.video_url,
      thumbnail_url: storyForm.thumbnail_url || null,
      cta_text: storyForm.cta_text,
      product_id: storyForm.product_id || null
    });
    setStoryForm({ video_url: '', thumbnail_url: '', cta_text: 'Comprar', product_id: '' });
    setShowStoryForm(false);
    fetchData();
  };

  const deleteStory = async (id: string) => {
    if(confirm('Apagar este story?')) {
      await supabase.from('stories').delete().eq('id', id);
      fetchData();
    }
  };

  // ---------------- VITRINE ---------------- //
  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProdId) {
      await supabase.from('products').update(prodForm).eq('id', editingProdId);
    } else {
      await supabase.from('products').insert(prodForm);
    }
    setProdForm({ name: '', price: '', stock: '', category: '' });
    setEditingProdId(null);
    setShowProductForm(false);
    fetchData();
  };

  const openEditProduct = (prod: any) => {
    setProdForm({ name: prod.name, price: prod.price, stock: prod.stock, category: prod.category || '' });
    setEditingProdId(prod.id);
    setShowProductForm(true);
  };

  // ---------------- AUTOMAÇÕES ---------------- //
  const handleSaveAutomations = () => {
    localStorage.setItem('cs_whatsapp', whatsapp);
    alert('Configurações salvas!');
  };

  // ---------------- CONTENT ---------------- //
  const saveLandingContent = async (id: string, field: string, value: string) => {
    await supabase.from('landing_content').update({ [field]: value }).eq('id', id);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex">
      <aside className="w-64 bg-[#0a0a0a] border-r border-white/5 p-6 flex flex-col gap-2">
        <div className="mb-8 font-bold text-xl gradient-text tracking-wider">CRIATIVA SISTERS<br/>ADMIN</div>
        <button onClick={() => setActiveTab('financeiro')} className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-colors ${activeTab === 'financeiro' ? 'bg-[#FF3366]/10 text-[#FF3366]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><DollarSign size={18}/> Financeiro & Pedidos</button>
        <button onClick={() => setActiveTab('landing')} className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-colors ${activeTab === 'landing' ? 'bg-[#FF3366]/10 text-[#FF3366]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><ImageIcon size={18}/> Banners e Textos</button>
        <button onClick={() => setActiveTab('stories')} className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-colors ${activeTab === 'stories' ? 'bg-[#FF3366]/10 text-[#FF3366]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><Video size={18}/> Criativa Stories</button>
        <button onClick={() => setActiveTab('vitrine')} className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-colors ${activeTab === 'vitrine' ? 'bg-[#FF3366]/10 text-[#FF3366]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><Package size={18}/> Produtos Vitrine</button>
        <button onClick={() => setActiveTab('automacoes')} className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-colors ${activeTab === 'automacoes' ? 'bg-[#FF3366]/10 text-[#FF3366]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><Settings size={18}/> Configurações</button>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        <header className="mb-10 flex justify-between items-end">
          <h1 className="text-3xl font-bold gradient-text uppercase tracking-wider">
            {activeTab === 'financeiro' && 'Painel Financeiro'}
            {activeTab === 'landing' && 'Gerenciador do Site (Banners & Textos)'}
            {activeTab === 'stories' && 'Painel Criativa Stories'}
            {activeTab === 'vitrine' && 'Gestão de Estoque'}
            {activeTab === 'automacoes' && 'Configurações Globais'}
          </h1>
          {activeTab === 'financeiro' && (
            <button onClick={handleExport} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
              <Download size={16} /> Exportar Relatório (XLSX)
            </button>
          )}
        </header>

        {/* FINANCEIRO */}
        {activeTab === 'financeiro' && (
          <div className="space-y-6 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="glass-panel p-6 border-l-4 border-green-500">
                <p className="text-gray-400 text-sm mb-1">Receita Confirmada</p>
                <h3 className="text-3xl font-bold text-green-400">R$ {totalReceita.toFixed(2).replace('.', ',')}</h3>
              </div>
              <div className="glass-panel p-6 border-l-4 border-yellow-500">
                <p className="text-gray-400 text-sm mb-1">Pedidos Pendentes</p>
                <h3 className="text-3xl font-bold text-yellow-400">{pedidosPendentes}</h3>
              </div>
              <div className="glass-panel p-6 border-l-4 border-purple-500">
                <p className="text-gray-400 text-sm mb-1">Total de Orçamentos 3D</p>
                <h3 className="text-3xl font-bold text-purple-400">{orders.length}</h3>
              </div>
            </div>

            <div className="glass-panel overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-gray-400">
                  <tr><th className="p-4">Cliente / ID</th><th className="p-4">Contato</th><th className="p-4">Status</th><th className="p-4">Detalhes</th><th className="p-4">Preço</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-500">Nenhum pedido ainda.</td></tr>}
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-white/5">
                      <td className="p-4">
                        <p className="font-bold text-white">{order.customer_name || 'Desconhecido'}</p>
                        <p className="font-mono text-xs text-[#8A2BE2]">{order.id.split('-')[0]}</p>
                      </td>
                      <td className="p-4">
                        <p>{order.whatsapp || '-'}</p>
                        <p className="text-xs text-gray-500">{order.email}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2 py-1 rounded text-xs ${order.status.includes('Pago') ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                            {order.status}
                          </span>
                          {order.requires_human_review && (
                            <span className="px-2 py-1 rounded text-xs bg-red-500/20 text-red-300">Revisão Manual</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-gray-300 max-w-xs truncate" title={order.details}>
                        {order.details || 'Sem detalhes opcionais'}
                      </td>
                      <td className="p-4 font-bold text-green-400">R$ {order.total_price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BANNERS E TEXTOS (LANDING) */}
        {activeTab === 'landing' && (
          <div className="max-w-4xl space-y-10">
            <div className="glass-panel p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2"><ImageIcon className="text-[#FF3366]"/> Gerenciador de Banners</h2>
                <button onClick={() => setShowBannerForm(!showBannerForm)} className="btn-secondary py-1 px-3 text-sm">
                  {showBannerForm ? 'Cancelar' : '+ Novo Banner'}
                </button>
              </div>

              {showBannerForm && (
                <form onSubmit={saveBanner} className="bg-white/5 p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 border border-white/10">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Tipo de Banner</label>
                    <select value={bannerForm.type} onChange={e=>setBannerForm({...bannerForm, type: e.target.value})} className="w-full bg-[#121212] border border-white/10 p-2 rounded text-white outline-none">
                      <option value="loop">Carrossel Infinito (Marquee)</option>
                      <option value="flash">Destaque Topo (Flash)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Ordem (ex: 1, 2, 3)</label>
                    <input type="number" required value={bannerForm.display_order} onChange={e=>setBannerForm({...bannerForm, display_order: e.target.value})} className="w-full bg-[#121212] border border-white/10 p-2 rounded text-white outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-gray-400 block mb-1">URL Pública da Imagem (Suba no Storage do Supabase e cole o link aqui)</label>
                    <input type="url" required value={bannerForm.image_url} onChange={e=>setBannerForm({...bannerForm, image_url: e.target.value})} placeholder="https://..." className="w-full bg-[#121212] border border-white/10 p-2 rounded text-white outline-none" />
                  </div>
                  <div className="md:col-span-2"><button type="submit" className="w-full btn-primary py-2 text-sm">Salvar Banner</button></div>
                </form>
              )}

              <div className="space-y-2">
                {banners.map(b => (
                  <div key={b.id} className="flex items-center justify-between bg-black/40 p-3 rounded border border-white/5 hover:border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-8 relative rounded overflow-hidden">
                        <Image src={b.image_url} alt="Banner" fill className="object-cover" />
                      </div>
                      <div>
                        <p className="font-bold text-sm">Ordem: {b.display_order}</p>
                        <p className="text-xs text-gray-500 uppercase">{b.type}</p>
                      </div>
                    </div>
                    <button onClick={() => deleteBanner(b.id)} className="text-red-400 p-2 hover:bg-red-500/10 rounded"><Trash size={16}/></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-panel p-8">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6"><Layers className="text-[#8A2BE2]"/> Ordem e Textos das Sessões</h2>
              <div className="space-y-6">
                {landingContent.map((section) => (
                  <div key={section.id} className="bg-white/5 p-4 rounded-lg border border-white/5">
                    <h3 className="font-bold text-sm text-[#E0829D] uppercase tracking-widest mb-3">{section.id.replace('_', ' ')}</h3>
                    <div className="grid gap-3">
                      <div>
                        <label className="text-xs text-gray-500 block">Título Principal</label>
                        <input type="text" defaultValue={section.title} onBlur={(e) => saveLandingContent(section.id, 'title', e.target.value)} className="w-full bg-black/30 border border-transparent p-2 text-sm text-white focus:border-[#FF3366] transition outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block">Subtítulo / Texto de Apoio</label>
                        <textarea defaultValue={section.subtitle} onBlur={(e) => saveLandingContent(section.id, 'subtitle', e.target.value)} className="w-full bg-black/30 border border-transparent p-2 text-sm text-white h-20 resize-none focus:border-[#FF3366] transition outline-none" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STORIES */}
        {activeTab === 'stories' && (
          <div className="max-w-4xl space-y-6">
             <div className="flex justify-end">
                <button onClick={() => setShowStoryForm(!showStoryForm)} className="btn-primary py-2 px-4 flex items-center gap-2 text-sm">
                  {showStoryForm ? 'Cancelar' : <><Plus size={16}/> Novo Story</>}
                </button>
              </div>

              {showStoryForm && (
                <form onSubmit={saveStory} className="glass-panel p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs text-gray-400 block mb-1">URL Pública do Vídeo MP4 (Suba no Storage do Supabase e cole aqui)</label>
                    <input required type="url" value={storyForm.video_url} onChange={e=>setStoryForm({...storyForm, video_url: e.target.value})} placeholder="https://..." className="w-full bg-[#121212] border border-white/10 p-2 rounded text-white outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">URL da Capa (Thumbnail Opcional)</label>
                    <input type="url" value={storyForm.thumbnail_url} onChange={e=>setStoryForm({...storyForm, thumbnail_url: e.target.value})} className="w-full bg-[#121212] border border-white/10 p-2 rounded text-white outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Texto do Botão (CTA)</label>
                    <input type="text" value={storyForm.cta_text} onChange={e=>setStoryForm({...storyForm, cta_text: e.target.value})} className="w-full bg-[#121212] border border-white/10 p-2 rounded text-white outline-none" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-gray-400 block mb-1">Vincular Produto da Vitrine (Faz o CTA levar ao produto)</label>
                    <select value={storyForm.product_id} onChange={e=>setStoryForm({...storyForm, product_id: e.target.value})} className="w-full bg-[#121212] border border-white/10 p-2 rounded text-white outline-none">
                      <option value="">Selecione um Produto...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} - R$ {p.price}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2"><button type="submit" className="w-full btn-secondary py-3">Publicar Story</button></div>
                </form>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {stories.map(story => (
                  <div key={story.id} className="relative w-full aspect-[9/16] bg-black rounded-xl overflow-hidden group border border-white/10">
                    <video src={story.video_url} className="w-full h-full object-cover opacity-50" />
                    <button onClick={() => deleteStory(story.id)} className="absolute top-2 right-2 bg-red-500/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition"><Trash size={14}/></button>
                    <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black to-transparent">
                      <p className="text-xs text-[#FF3366] font-bold truncate">{story.cta_text}</p>
                      {story.products && <p className="text-[10px] text-gray-300 truncate">{story.products.name}</p>}
                    </div>
                  </div>
                ))}
                {stories.length === 0 && <div className="col-span-4 p-8 text-center text-gray-500 glass-panel">Nenhum Story publicado ainda.</div>}
              </div>
          </div>
        )}

        {/* VITRINE */}
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

        {/* AUTOMAÇÕES */}
        {activeTab === 'automacoes' && (
          <div className="glass-panel p-6 max-w-md space-y-6">
            <div>
              <label className="text-sm text-gray-300 flex items-center gap-2 mb-2"><Phone size={16} className="text-green-400"/> WhatsApp do Especialista</label>
              <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white focus:border-[#8A2BE2]" />
            </div>
            <button onClick={handleSaveAutomations} className="w-full btn-secondary"><Save size={18} className="inline mr-2"/> Salvar</button>
          </div>
        )}

      </main>
    </div>
  );
}
