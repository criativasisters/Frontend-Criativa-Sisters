"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Layers, Settings, Phone, Save, Edit, Plus, Package, DollarSign, Download, Image as ImageIcon, Video, Trash, TrendingUp, AlertCircle, LogOut, RefreshCw, ExternalLink, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import * as XLSX from 'xlsx';
import Image from 'next/image';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'financeiro' | 'vitrine' | 'landing' | 'stories' | 'automacoes' | 'lucro'>('financeiro');
  
  // Supabase States
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [landingContent, setLandingContent] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [whatsapp, setWhatsapp] = useState('');
  
  // Form States
  const [showProductForm, setShowProductForm] = useState(false);
  const [prodForm, setProdForm] = useState({ name: '', price: '', stock: '', category: '', description: '', image_url: '', video_url: '' });
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const [showBannerForm, setShowBannerForm] = useState(false);
  const [bannerForm, setBannerForm] = useState({ type: 'loop', image_url: '', display_order: '0' });

  const [showStoryForm, setShowStoryForm] = useState(false);
  const [storyForm, setStoryForm] = useState({ video_url: '', thumbnail_url: '', cta_text: 'Comprar', product_id: '' });

  // Tripo3D Balance State
  
  const [categories, setCategories] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, folder: string, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadProgress('Fazendo upload...');
    
    try {
      const fileName = `${folder}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data, error } = await supabase.storage.from('media').upload(fileName, file);
      
      if (error) throw error;
      
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(fileName);
      callback(urlData.publicUrl);
    } catch (err: any) {
      alert('Erro no upload: ' + err.message);
    } finally {
      setIsUploading(false);
      setUploadProgress('');
    }
  };

  const [tripoBalance, setTripoBalance] = useState<{
    balance: number;
    frozen: number;
    mode: 'live' | 'mock' | 'error';
    loading: boolean;
    error?: string;
    lastUpdated?: string;
  }>({
    balance: 0,
    frozen: 0,
    mode: 'mock',
    loading: false
  });

  const fetchTripoBalance = async () => {
    setTripoBalance(prev => ({ ...prev, loading: true }));
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/admin/tripo-balance`);
      const data = await res.json();
      if (data.success) {
        setTripoBalance({
          balance: Number(data.balance ?? 0),
          frozen: Number(data.frozen ?? 0),
          mode: data.mode || 'live',
          loading: false,
          lastUpdated: new Date().toLocaleTimeString('pt-BR')
        });
      } else {
        setTripoBalance({
          balance: 0,
          frozen: 0,
          mode: 'error',
          error: data.error || 'Falha ao consultar Tripo3D',
          loading: false,
          lastUpdated: new Date().toLocaleTimeString('pt-BR')
        });
      }
    } catch (err: any) {
      setTripoBalance({
        balance: 0,
        frozen: 0,
        mode: 'error',
        error: 'Backend offline',
        loading: false,
        lastUpdated: new Date().toLocaleTimeString('pt-BR')
      });
    }
  };

  useEffect(() => {
    // Auth Check resiliente (Cookie e/ou LocalStorage)
    const authCookie = document.cookie.split('; ').find(row => row.startsWith('admin_auth='));
    const isCookieAuth = authCookie && authCookie.split('=')[1] === 'true';
    const isLocalAuth = typeof window !== 'undefined' && localStorage.getItem('criativa_admin_auth') === 'true';

    if (!isCookieAuth && !isLocalAuth) {
      router.replace('/admin');
      return;
    }

    if (isLocalAuth && !isCookieAuth) {
      document.cookie = 'admin_auth=true; path=/; max-age=86400; SameSite=Lax';
    }

    fetchData();
    fetchTripoBalance();
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

    const { data: costs } = await supabase.from('cost_parameters').select('*');
    const { data: cats } = await supabase.from('categories').select('*').order('name');
    if (cats) setCategories(cats);
    if (costs && costs.length > 0) {
      const configMap: any = {};
      costs.forEach(c => { configMap[c.id] = Number(c.value); });
      setCustoConfig(prev => ({ ...prev, ...configMap }));
    }
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
  const handleGenerateAI = async () => {
    if (!prodForm.name) {
      alert("Preencha o Nome do Produto primeiro.");
      return;
    }
    setIsGeneratingAI(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/admin/generate-copy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: prodForm.name, category: prodForm.category })
      });
      const data = await res.json();
      if (data.success && data.text) {
        setProdForm(prev => ({ ...prev, description: data.text }));
      } else {
        alert("Falha ao gerar texto: " + (data.error || 'Erro desconhecido'));
      }
    } catch (e) {
      alert("Erro de conexão ao gerar texto via IA.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProdId) {
      await supabase.from('products').update(prodForm).eq('id', editingProdId);
    } else {
      await supabase.from('products').insert(prodForm);
    }
    setProdForm({ name: '', price: '', stock: '', category: '', description: '', image_url: '', video_url: '' });
    setEditingProdId(null);
    setShowProductForm(false);
    fetchData();
  };

  const openEditProduct = (prod: any) => {
    setProdForm({ 
      name: prod.name, 
      price: prod.price, 
      stock: prod.stock, 
      category: prod.category || '',
      description: prod.description || '',
      image_url: prod.image_url || '',
      video_url: prod.video_url || ''
    });
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

  // ---------------- CALCULADORA DE LUCRO ---------------- //
  const [custoConfig, setCustoConfig] = useState({
    pla_por_grama: 0.12,
    energia_por_hora: 0.80,
    horas_por_100g: 2.5,
    mao_de_obra_por_pedido: 5.00,
    taxa_stripe_pct: 3.99,
    taxa_stripe_fixo: 0.39,
    frete_responsabilidade_pct: 0,
    tripo3d_cost_per_gen: 0.50,
    server_cost_monthly: 40.00
  });

  const saveCosts = async () => {
    const updates = Object.keys(custoConfig).map(key => ({
      id: key,
      name: key, // Nome genérico para fallback se for novo
      value: (custoConfig as any)[key]
    }));
    
    // Faz upsert no Supabase
    for (const item of updates) {
      await supabase.from('cost_parameters').update({ value: item.value }).eq('id', item.id);
    }
    alert('Parâmetros de Custo salvos no Banco de Dados com sucesso!');
  };

  const calcularLucro = (order: any) => {
    const receita = Number(order.total_price || 0);
    const weightG = Number(order.estimated_weight_g || 200);

    const custoMaterial = weightG * custoConfig.pla_por_grama;
    const custoEnergia = (weightG / 100) * custoConfig.horas_por_100g * custoConfig.energia_por_hora;
    const custoMaoDeObra = custoConfig.mao_de_obra_por_pedido;
    const custoIA = custoConfig.tripo3d_cost_per_gen; // Custo API Tripo3D gerando o modelo
    const taxaStripe = (receita * (custoConfig.taxa_stripe_pct / 100)) + custoConfig.taxa_stripe_fixo;
    const custoTotal = custoMaterial + custoEnergia + custoMaoDeObra + custoIA + taxaStripe;
    const lucroLiquido = receita - custoTotal;
    const margemPct = receita > 0 ? (lucroLiquido / receita) * 100 : 0;

    return { receita, custoMaterial, custoEnergia, custoMaoDeObra, custoIA, taxaStripe, custoTotal, lucroLiquido, margemPct };
  };

  const lucroGlobal = orders.reduce((acc, o) => {
    const l = calcularLucro(o);
    return { receita: acc.receita + l.receita, custo: acc.custo + l.custoTotal, lucro: acc.lucro + l.lucroLiquido };
  }, { receita: 0, custo: 0, lucro: 0 });

  const handleLogout = () => {
    document.cookie = 'admin_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    localStorage.removeItem('criativa_admin_auth');
    router.replace('/admin');
  };

  return (
    <div className="min-h-screen bg-[#050505] flex">
      <aside className="w-64 bg-[#0a0a0a] border-r border-white/5 p-6 flex flex-col gap-2 shrink-0 h-screen sticky top-0 overflow-y-auto custom-scrollbar">
        <div className="mb-6 font-bold text-xl gradient-text tracking-wider">CRIATIVA SISTERS<br/>ADMIN</div>
        <button onClick={() => setActiveTab('financeiro')} className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-colors ${activeTab === 'financeiro' ? 'bg-[#FF3366]/10 text-[#FF3366]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><DollarSign size={18}/> Financeiro & Pedidos</button>
        <button onClick={() => setActiveTab('lucro')} className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-colors ${activeTab === 'lucro' ? 'bg-green-500/10 text-green-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><TrendingUp size={18}/> Lucro Real</button>
        <button onClick={() => setActiveTab('landing')} className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-colors ${activeTab === 'landing' ? 'bg-[#FF3366]/10 text-[#FF3366]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><ImageIcon size={18}/> Banners e Textos</button>
        <button onClick={() => setActiveTab('stories')} className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-colors ${activeTab === 'stories' ? 'bg-[#FF3366]/10 text-[#FF3366]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><Video size={18}/> Criativa Stories</button>
        <button onClick={() => setActiveTab('vitrine')} className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-colors ${activeTab === 'vitrine' ? 'bg-[#FF3366]/10 text-[#FF3366]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><Package size={18}/> Produtos Vitrine</button>
        <button onClick={() => setActiveTab('automacoes')} className={`flex items-center gap-3 p-3 rounded-lg text-sm transition-colors ${activeTab === 'automacoes' ? 'bg-[#FF3366]/10 text-[#FF3366]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}><Settings size={18}/> Configurações</button>
        
        {/* Widget Tripo3D no Menu Lateral */}
        <div className="mt-auto mb-3 glass-panel p-3 border border-white/10 rounded-xl bg-white/[0.03]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold flex items-center gap-1.5">
              <Zap size={14} className={tripoBalance.mode === 'live' && tripoBalance.balance > 50 ? 'text-emerald-400' : tripoBalance.mode === 'live' && tripoBalance.balance > 0 ? 'text-amber-400' : 'text-[#FF3366]'} />
              Tripo3D IA
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={fetchTripoBalance}
                disabled={tripoBalance.loading}
                title={`Atualizar saldo${tripoBalance.lastUpdated ? ` (${tripoBalance.lastUpdated})` : ''}`}
                className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition disabled:opacity-50"
              >
                <RefreshCw size={12} className={tripoBalance.loading ? 'animate-spin text-[#FF3366]' : ''} />
              </button>
              <a
                href="https://platform.tripo3d.ai/"
                target="_blank"
                rel="noreferrer"
                title="Recarregar créditos na Tripo3D"
                className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-[#FF3366] transition"
              >
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-base font-bold text-white">
              {tripoBalance.loading ? (
                <span className="text-xs text-gray-400 animate-pulse">Consultando...</span>
              ) : (
                `${tripoBalance.balance.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} pts`
              )}
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
              tripoBalance.mode === 'mock'
                ? 'bg-purple-500/20 text-purple-300'
                : tripoBalance.mode === 'live' && tripoBalance.balance > 50
                ? 'bg-emerald-500/20 text-emerald-400'
                : tripoBalance.mode === 'live' && tripoBalance.balance > 0
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {tripoBalance.mode === 'mock' ? 'MOCK' : tripoBalance.balance > 50 ? 'OK' : tripoBalance.balance > 0 ? 'BAIXO' : 'ZERADO'}
            </span>
          </div>
        </div>

        <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors cursor-pointer border border-red-500/20">
          <LogOut size={18}/> Sair do Admin
        </button>
      </aside>

      <main className="flex-1 p-8 md:p-10 overflow-y-auto min-w-0">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold gradient-text uppercase tracking-wider">
            {activeTab === 'financeiro' && 'Painel Financeiro'}
            {activeTab === 'lucro' && 'Calculadora de Lucro Real'}
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

        {/* LUCRO REAL */}
        {activeTab === 'lucro' && (
          <div className="space-y-8 max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 border-l-4 border-blue-500">
                <p className="text-gray-400 text-sm mb-1">Total Faturado (todos os pedidos)</p>
                <h3 className="text-3xl font-bold text-blue-400">R$ {lucroGlobal.receita.toFixed(2).replace('.', ',')}</h3>
              </div>
              <div className="glass-panel p-6 border-l-4 border-red-500">
                <p className="text-gray-400 text-sm mb-1">Custo Total Estimado</p>
                <h3 className="text-3xl font-bold text-red-400">R$ {lucroGlobal.custo.toFixed(2).replace('.', ',')}</h3>
              </div>
              <div className={`glass-panel p-6 border-l-4 ${lucroGlobal.lucro >= 0 ? 'border-green-500' : 'border-red-500'}`}>
                <p className="text-gray-400 text-sm mb-1">Lucro Líquido Estimado</p>
                <h3 className={`text-3xl font-bold ${lucroGlobal.lucro >= 0 ? 'text-green-400' : 'text-red-400'}`}>R$ {lucroGlobal.lucro.toFixed(2).replace('.', ',')}</h3>
                <p className="text-xs text-gray-500 mt-1">Margem: {lucroGlobal.receita > 0 ? ((lucroGlobal.lucro / lucroGlobal.receita) * 100).toFixed(1) : 0}%</p>
              </div>
            </div>
            <div className="glass-panel p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2"><Settings size={18} className="text-[#FF3366]"/> Configurar Parâmetros de Custo Real</h3>
                <button onClick={saveCosts} className="btn-primary py-2 px-4 text-sm flex items-center gap-2"><Save size={16}/> Salvar no Banco</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'pla_por_grama', label: 'PLA (R$/grama)', step: '0.01' },
                  { key: 'energia_por_hora', label: 'Energia (R$/hora imp.)', step: '0.01' },
                  { key: 'horas_por_100g', label: 'Horas / 100g', step: '0.1' },
                  { key: 'mao_de_obra_por_pedido', label: 'Mão de Obra (R$/pedido)', step: '0.5' },
                  { key: 'taxa_stripe_pct', label: 'Taxa Stripe (%)', step: '0.01' },
                  { key: 'taxa_stripe_fixo', label: 'Taxa Stripe Fixa (R$)', step: '0.01' },
                  { key: 'tripo3d_cost_per_gen', label: 'Custo Tripo3D (R$/gen)', step: '0.05' },
                  { key: 'server_cost_monthly', label: 'Servidor Render/Mês (R$)', step: '1.00' },
                ].map(({ key, label, step }) => (
                  <div key={key}>
                    <label className="text-xs text-gray-400 block mb-1">{label}</label>
                    <input type="number" step={step} min="0" value={(custoConfig as any)[key]}
                      onChange={e => setCustoConfig({ ...custoConfig, [key]: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-black/50 border border-white/10 rounded p-2 text-sm text-white focus:border-green-500 outline-none" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-4 flex items-center gap-1"><AlertCircle size={12}/> A calculadora ajusta em tempo real. Clique em "Salvar no Banco" para persistir.</p>
            </div>
            <div className="glass-panel overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[1000px]">
                <thead className="bg-white/5 text-gray-400">
                  <tr>
                    <th className="p-3">ID / Cliente</th>
                    <th className="p-3 text-right">Receita</th>
                    <th className="p-3 text-right">Material</th>
                    <th className="p-3 text-right">Energia</th>
                    <th className="p-3 text-right">Mão de Obra</th>
                    <th className="p-3 text-right">IA Tripo3D</th>
                    <th className="p-3 text-right">Stripe</th>
                    <th className="p-3 text-right">Custo Total</th>
                    <th className="p-3 text-right font-bold">Lucro</th>
                    <th className="p-3 text-right">Margem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.length === 0 && <tr><td colSpan={10} className="p-8 text-center text-gray-500">Nenhum pedido calculado.</td></tr>}
                  {orders.map(o => {
                    const l = calcularLucro(o);
                    return (
                      <tr key={o.id} className="hover:bg-white/5 transition">
                        <td className="p-3 truncate max-w-[150px]"><span className="text-gray-500 text-[10px] block">{o.id.split('-')[0]}</span> {o.customer_name}</td>
                        <td className="p-3 text-right text-blue-400 font-bold">R$ {l.receita.toFixed(2)}</td>
                        <td className="p-3 text-right text-red-300">R$ {l.custoMaterial.toFixed(2)}</td>
                        <td className="p-3 text-right text-red-300">R$ {l.custoEnergia.toFixed(2)}</td>
                        <td className="p-3 text-right text-red-300">R$ {l.custoMaoDeObra.toFixed(2)}</td>
                        <td className="p-3 text-right text-red-300">R$ {l.custoIA.toFixed(2)}</td>
                        <td className="p-3 text-right text-red-300">R$ {l.taxaStripe.toFixed(2)}</td>
                        <td className="p-3 text-right text-red-500 font-bold">R$ {l.custoTotal.toFixed(2)}</td>
                        <td className={`p-3 text-right font-bold ${l.lucroLiquido >= 0 ? 'text-green-400' : 'text-red-400'}`}>R$ {l.lucroLiquido.toFixed(2)}</td>
                        <td className={`p-3 text-right ${l.margemPct >= 20 ? 'text-green-400' : 'text-red-400'}`}>{l.margemPct.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
                    <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'banners', url => setBannerForm({...bannerForm, image_url: url}))} className="w-full bg-[#121212] border border-white/10 p-2 rounded text-white outline-none" />
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
                {[...landingContent].sort((a, b) => {
                  const order = ['hero_section', 'creation_section', 'vitrine_section', 'about_section', 'stories_section', 'contact_section'];
                  const idxA = order.indexOf(a.id) === -1 ? 99 : order.indexOf(a.id);
                  const idxB = order.indexOf(b.id) === -1 ? 99 : order.indexOf(b.id);
                  return idxA - idxB;
                }).map((section) => (
                  <div key={section.id} className="bg-white/5 p-6 rounded-lg border border-white/10 hover:border-[#FF3366]/40 transition-colors shadow-lg">
                    <h3 className="font-bold text-sm text-[#FF3366] uppercase tracking-widest mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#8A2BE2]"></span>
                      {section.id.replace('_', ' ')}
                    </h3>
                    <div className="grid gap-4">
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Título Principal</label>
                        <input type="text" defaultValue={section.title} onBlur={(e) => saveLandingContent(section.id, 'title', e.target.value)} className="w-full bg-[#121212] border border-white/10 p-2 text-sm text-white focus:border-[#FF3366] rounded outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Subtítulo / Texto de Apoio</label>
                        <textarea defaultValue={section.subtitle} onBlur={(e) => saveLandingContent(section.id, 'subtitle', e.target.value)} className="w-full bg-[#121212] border border-white/10 p-2 text-sm text-white h-20 resize-none focus:border-[#FF3366] rounded outline-none" />
                      </div>
                      {['hero_section', 'creation_section', 'vitrine_section', 'about_section', 'stories_section', 'contact_section'].includes(section.id) && (
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">Texto do Botão (CTA)</label>
                          <input type="text" defaultValue={section.cta_text || ''} onBlur={(e) => saveLandingContent(section.id, 'cta_text', e.target.value)} className="w-full bg-[#121212] border border-white/10 p-2 text-sm text-white focus:border-[#FF3366] rounded outline-none placeholder-gray-600" placeholder="Ex: Ver Loja" />
                        </div>
                      )}
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
                    <input required={false} type="file" accept="video/*" onChange={e => handleFileUpload(e, 'stories', url => setStoryForm({...storyForm, video_url: url}))} className="w-full bg-[#121212] border border-white/10 p-2 rounded text-white outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">URL da Capa (Thumbnail Opcional)</label>
                    <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'stories', url => setStoryForm({...storyForm, thumbnail_url: url}))} className="w-full bg-[#121212] border border-white/10 p-2 rounded text-white outline-none" />
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
              <button onClick={() => { setEditingProdId(null); setProdForm({name:'',price:'',stock:'',category:'',description:'',image_url:'',video_url:''}); setShowProductForm(!showProductForm); }} className="btn-primary py-2 px-4 flex items-center gap-2 text-sm">
                {showProductForm ? 'Cancelar' : <><Plus size={16}/> Novo Produto</>}
              </button>
            </div>

            {showProductForm && (
              <form onSubmit={saveProduct} className="glass-panel p-6 grid grid-cols-2 gap-4">
                <div className="col-span-2 md:col-span-1"><label className="text-sm text-gray-400 block mb-1">Nome</label><input required type="text" value={prodForm.name} onChange={e=>setProdForm({...prodForm, name: e.target.value})} className="w-full bg-[#121212] border border-white/10 p-2 rounded text-white outline-none focus:border-[#FF3366]" /></div>
                <div className="col-span-2 md:col-span-1"><label className="text-sm text-gray-400 block mb-1">Categoria</label>
<div className="flex gap-2">
  <select value={prodForm.category} onChange={e=>setProdForm({...prodForm, category: e.target.value})} className="w-full bg-[#121212] border border-white/10 p-2 rounded text-white outline-none focus:border-[#FF3366]">
    <option value="">Selecione...</option>
    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
  </select>
  <button type="button" onClick={async () => {
    const newCat = prompt('Nova categoria:');
    if (newCat) {
      await supabase.from('categories').insert({name: newCat});
      fetchData();
      setProdForm({...prodForm, category: newCat});
    }
  }} className="btn-secondary px-3" title="Nova Categoria">+</button>
</div>
</div>
                
                <div className="col-span-2 md:col-span-1"><label className="text-sm text-gray-400 block mb-1">Preço (R$)</label><input required type="number" step="0.01" value={prodForm.price} onChange={e=>setProdForm({...prodForm, price: e.target.value})} className="w-full bg-[#121212] border border-white/10 p-2 rounded text-white outline-none focus:border-[#FF3366]" /></div>
                <div className="col-span-2 md:col-span-1"><label className="text-sm text-gray-400 block mb-1">Estoque</label><input required type="number" value={prodForm.stock} onChange={e=>setProdForm({...prodForm, stock: e.target.value})} className="w-full bg-[#121212] border border-white/10 p-2 rounded text-white outline-none focus:border-[#FF3366]" /></div>
                
                <div className="col-span-2">
                  <label className="text-sm text-gray-400 block mb-1">URL da Imagem (Principal)</label>
                  <div className="flex gap-2 items-center"><input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'products', (url) => setProdForm({...prodForm, image_url: url}))} className="w-full bg-[#121212] border border-white/10 p-1.5 rounded text-white text-sm" />{prodForm.image_url && <img src={prodForm.image_url} className="h-8 w-8 object-cover rounded" />}</div>
                </div>
                
                <div className="col-span-2">
                  <label className="text-sm text-gray-400 block mb-1">URL do Vídeo (Opcional - Ex: Demo 360º)</label>
                  <input type="url" value={prodForm.video_url} onChange={e=>setProdForm({...prodForm, video_url: e.target.value})} className="w-full bg-[#121212] border border-white/10 p-2 rounded text-white outline-none focus:border-[#FF3366]" placeholder="https://..." />
                </div>

                <div className="col-span-2">
                  <div className="flex justify-between items-end mb-1">
                    <label className="text-sm text-gray-400 block">Descrição do Produto</label>
                    <button type="button" onClick={handleGenerateAI} disabled={isGeneratingAI} className="text-[#8A2BE2] hover:text-[#FF3366] text-xs flex items-center gap-1 transition-colors">
                      {isGeneratingAI ? 'Gerando...' : '✨ Ajuda com IA'}
                    </button>
                  </div>
                  <textarea value={prodForm.description} onChange={e=>setProdForm({...prodForm, description: e.target.value})} className="w-full bg-[#121212] border border-white/10 p-2 rounded text-white outline-none focus:border-[#FF3366] h-32 resize-none" placeholder="Descreva os diferenciais, material e benefícios da peça..." />
                </div>

                <div className="col-span-2 mt-2"><button type="submit" disabled={isUploading} className="w-full btn-secondary py-3">{isUploading ? uploadProgress : 'Salvar Produto na Vitrine'}</button></div>
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
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {prod.image_url ? (
                            <img src={prod.image_url} alt={prod.name} className="w-10 h-10 object-cover rounded border border-white/10" />
                          ) : (
                            <div className="w-10 h-10 bg-black rounded border border-white/10 flex items-center justify-center text-gray-700"><Package size={16}/></div>
                          )}
                          <div>
                            <p className="font-bold">{prod.name}</p>
                            <p className="text-xs text-gray-500">{prod.category || 'Geral'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-green-400 font-bold">R$ {prod.price}</td>
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

        {/* AUTOMAÇÕES & INTEGRAÇÕES */}
        {activeTab === 'automacoes' && (
          <div className="max-w-4xl space-y-8">
            {/* Card Saldo Tripo3D Detalhado */}
            <div className="glass-panel p-6 border-l-4 border-[#FF3366]">
              <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div>
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    <Zap size={20} className="text-[#FF3366]"/> Motor de Inteligência Artificial 3D (Tripo3D API)
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Monitoramento em tempo real da cota e créditos para geração de modelos 3D na Criativa Sisters.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchTripoBalance}
                    disabled={tripoBalance.loading}
                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                  >
                    <RefreshCw size={13} className={tripoBalance.loading ? 'animate-spin text-[#FF3366]' : ''}/>
                    {tripoBalance.loading ? 'Sincronizando...' : 'Atualizar Saldo'}
                  </button>
                  <a
                    href="https://platform.tripo3d.ai/"
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
                  >
                    Comprar Créditos <ExternalLink size={13}/>
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <span className="text-xs text-gray-400 block mb-1">Créditos Disponíveis</span>
                  <div className="text-2xl font-bold text-white flex items-baseline gap-1">
                    {tripoBalance.loading ? '...' : tripoBalance.balance.toLocaleString('pt-BR')}
                    <span className="text-xs text-gray-400 font-normal">pts</span>
                  </div>
                  <span className={`text-[10px] mt-1 inline-block font-semibold ${
                    tripoBalance.balance > 50 ? 'text-emerald-400' : tripoBalance.balance > 0 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {tripoBalance.mode === 'mock' ? '● Modo Contingência / Mock' : tripoBalance.balance > 50 ? '● Saldo Saudável' : tripoBalance.balance > 0 ? '▲ Atenção: Saldo Baixo' : '■ Bloqueado: Recarga Obrigatória'}
                  </span>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <span className="text-xs text-gray-400 block mb-1">Modelos Estimados Restantes</span>
                  <div className="text-2xl font-bold text-blue-400 flex items-baseline gap-1">
                    {tripoBalance.loading ? '...' : Math.floor(tripoBalance.balance / 20)}
                    <span className="text-xs text-gray-400 font-normal">gerações (~20 pts/cada)</span>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block">Modelo Tripo v3.1 / P1</span>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <span className="text-xs text-gray-400 block mb-1">Créditos Bloqueados / Fila</span>
                  <div className="text-2xl font-bold text-purple-400 flex items-baseline gap-1">
                    {tripoBalance.loading ? '...' : tripoBalance.frozen}
                    <span className="text-xs text-gray-400 font-normal">pts reservados</span>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block">Tarefas sendo esculpidas</span>
                </div>
              </div>

              {tripoBalance.balance <= 0 && tripoBalance.mode === 'live' && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-400 shrink-0"/>
                    <span><strong>Atenção:</strong> Seus créditos da Tripo3D esgotaram (Código 2010). Novos uploads acionarão o modo comercial de contingência até a recarga.</span>
                  </div>
                  <a
                    href="https://platform.tripo3d.ai/"
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 underline font-bold hover:text-white"
                  >
                    Recarregar Agora →
                  </a>
                </div>
              )}
            </div>

            {/* WhatsApp e Outras Automações */}
            <div className="glass-panel p-6 max-w-md space-y-6">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Settings size={18} className="text-[#FF3366]"/> Canais & Atendimento
              </h3>
              <div>
                <label className="text-sm text-gray-300 flex items-center gap-2 mb-2"><Phone size={16} className="text-green-400"/> WhatsApp do Especialista</label>
                <input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="Ex: 5511999999999" className="w-full bg-[#121212] border border-white/10 rounded-lg p-3 text-white focus:border-[#8A2BE2]" />
                <p className="text-[11px] text-gray-500 mt-1">Utilizado pelo botão de contingência e atendimento comercial 1-a-1.</p>
              </div>
              <button onClick={handleSaveAutomations} className="w-full btn-secondary"><Save size={18} className="inline mr-2"/> Salvar Configurações</button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
