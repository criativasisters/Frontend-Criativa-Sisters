"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Printer, Package, Zap, ShieldCheck, Star, MessageCircle, Play, X, ShoppingBag } from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { useCart } from '@/contexts/CartContext';
import { motion } from "framer-motion";
import { ScrollSnake } from "@/components/ScrollSnake";

export default function Home() {
  const { addToCart } = useCart();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createSectionRef = useRef<HTMLElement>(null);

  // Intro Animation State
  const [showIntro, setShowIntro] = useState(true);

  // Estados Dinâmicos do Supabase (CMS Headless)
  const [sections, setSections] = useState<any>({});
  const [products, setProducts] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  
  // States Modal Stories
  const [activeStory, setActiveStory] = useState<any>(null);

  // States Upload IA
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    // Timer da animação de Intro
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 3000);

    async function fetchData() {
      const { data: bData } = await supabase.from('banners').select('*').eq('is_active', true).order('display_order');
      if (bData) setBanners(bData);

      const { data: sData } = await supabase.from('stories').select('*, products(*)').eq('is_active', true).order('created_at', { ascending: false });
      if (sData) setStories(sData);

      const { data } = await supabase.from('landing_content').select('*');
      if (data) {
        const mapped: any = {};
        data.forEach(item => { mapped[item.id] = item; });
        setSections(mapped);
      }
      
      const { data: pData } = await supabase.from('products').select('*').limit(6);
      if (pData) setProducts(pData);
    }
    fetchData();

    return () => clearTimeout(timer);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setIsUploading(true);
    setStatusText("Iniciando motor de IA...");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/generate`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Erro no servidor (${res.status})`);
      }

      const data = await res.json();
      
      if (data.success && data.taskId) {
        setStatusText("Modelando a malha 3D... Isso pode levar 2 minutos.");
        
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch(`${backendUrl}/api/status/${data.taskId}`);
            const statusData = await statusRes.json();
            
            if (statusData.success) {
              if (statusData.status === 'success') {
                clearInterval(pollInterval);
                setStatusText("Geometria finalizada! Abrindo preview...");
                
                const queryParams = new URLSearchParams({
                  x: "15.0",
                  y: "15.0",
                  z: "12.0",
                  colors: data.colors.join(','),
                  modelUrl: statusData.modelUrl || 'mock'
                }).toString();
                
                router.push(`/preview/${data.taskId}?${queryParams}`);
              } else if (statusData.status === 'failed' || statusData.status === 'cancelled') {
                clearInterval(pollInterval);
                alert("A IA encontrou um erro e falhou ao gerar o modelo.");
                setIsUploading(false);
              } else {
                setStatusText(`Esculpindo... ${statusData.progress}%`);
              }
            }
          } catch (e) {
            console.error("Erro no polling:", e);
          }
        }, 3000);
      } else {
        throw new Error(data.error || "Resposta inválida da API.");
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Houve um erro no processamento. Verifique se o Backend está rodando.");
      setIsUploading(false);
    }
  };

  const flashBanners = banners.filter(b => b.type === 'flash');
  const loopBanners = banners.filter(b => b.type === 'loop');

  return (
    <>
      {/* 3D INTRO ANIMATION */}
      <div className={`fixed inset-0 z-[999] bg-[#050505] flex items-center justify-center transition-all duration-1000 ${showIntro ? 'opacity-100 visible' : 'opacity-0 invisible -translate-y-full'}`}>
        <div className="relative text-center">
          {/* Logo que simula estar sendo impressa em 3D */}
          <div className="w-32 h-32 relative mx-auto mb-6 animate-pulse">
             <div className="absolute inset-0 rounded-full border-t-4 border-[#FF3366] animate-spin"></div>
             <div className="absolute inset-2 rounded-full border-r-4 border-[#E0829D] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
             <div className="absolute inset-4 rounded-full border-b-4 border-[#8A2BE2] animate-spin" style={{ animationDuration: '3s' }}></div>
             <Image src="/logos/logo-3d-metallic.jpg" alt="Logo" fill className="object-cover rounded-full p-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black gradient-text tracking-widest uppercase">Fabricando Criativa Sisters...</h1>
          <div className="mt-4 w-48 h-1 bg-white/10 mx-auto rounded overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#FF3366] to-[#8A2BE2] animate-[revealDown_2.5s_linear_forwards]" style={{ clipPath: 'inset(0 100% 0 0)' }}></div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT SITE */}
      <ScrollSnake />
      <main className={`min-h-screen w-full overflow-x-hidden transition-all duration-1000 ${showIntro ? 'translate-y-20 opacity-0' : 'translate-y-0 opacity-100'}`}>
        
        {/* SESSÃO 1: BANNERS (Flash e Loop) */}
        <section className="relative w-full bg-[#020202] overflow-hidden">
          {/* Glow ambient de fundo */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#FF3366]/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#8A2BE2]/10 rounded-full blur-[120px] pointer-events-none" />

          {/* Flash Banner (Topo) - sem Flash Banner usa Hero padrão */}
          {flashBanners.length > 0 ? (
            <div className="w-full h-[500px] relative flex items-center justify-center overflow-hidden border-b border-white/5">
               <Image src={flashBanners[0].image_url} alt="Destaque" fill className="object-cover opacity-60" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-black/40 to-transparent" />
               <div className="relative z-10 text-center px-6">
                 <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: "easeOut" }}
                   className="text-5xl md:text-7xl font-black mb-4 drop-shadow-2xl leading-tight">
                   {sections['hero_section']?.title || 'Bem-vindo à'}{' '}
                   <span className="gradient-text relative">
                     Criativa Sisters
                     <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-[#FF3366] to-[#8A2BE2] rounded-full opacity-80" />
                   </span>
                 </motion.h1>
                 <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2 }}
                   className="text-gray-300 text-xl">{sections['hero_section']?.subtitle}</motion.p>
               </div>
            </div>
          ) : (
            /* Hero fallback quando não há flash banner */
            <div className="w-full h-[500px] flex items-center justify-center">
              <div className="relative z-10 text-center px-6">
                <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9 }}
                  className="text-5xl md:text-7xl font-black mb-4 leading-tight">
                  Transforme ideias em{' '}
                  <span className="gradient-text relative">
                    Arte 3D Real
                    <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-[#FF3366] to-[#8A2BE2] rounded-full" />
                  </span>
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.8 }}
                  className="text-gray-400 text-xl max-w-lg mx-auto">
                  IA de ponta + Impressão Bambu Lab multicor. Do upload à sua porta.
                </motion.p>
              </div>
            </div>
          )}

          {/* Marquee Banners (Loop Infinito) */}
          {loopBanners.length > 0 && (
            <div className="w-full bg-[#111] border-b border-white/5 overflow-hidden py-4">
              <div className="flex gap-4 animate-marquee whitespace-nowrap">
                {[...loopBanners, ...loopBanners].map((banner, i) => (
                  <div key={i} className="inline-block relative w-[280px] h-[160px] rounded-lg overflow-hidden shrink-0 border border-white/10 hover:border-[#FF3366] transition">
                    <Image src={banner.image_url} alt="Banner" fill className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* SESSÃO STORIES */}
        {stories.length > 0 && (
          <section className="py-12 px-6 bg-[#050505] border-b border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-1/3 w-72 h-32 bg-[#FF3366]/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="max-w-6xl mx-auto relative z-10">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="flex items-center gap-3 mb-6"
              >
                <div className="p-2 rounded-xl bg-gradient-to-br from-[#FF3366]/20 to-[#8A2BE2]/20 border border-[#FF3366]/30">
                  <Play size={20} className="text-[#FF3366] fill-[#FF3366]" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">Criativa Shorts</h3>
                  <p className="text-xs text-gray-400">Vídeos reais das nossas impressões em ação</p>
                </div>
              </motion.div>

              <div className="flex gap-5 overflow-x-auto pb-6 scrollbar-hide perspective-[1000px]">
                {stories.map((story, index) => (
                  <motion.button 
                    key={story.id} 
                    initial={{ opacity: 0, scale: 0.8, y: 40, rotateY: -15 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0, rotateY: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.08, type: "spring", stiffness: 120 }}
                    whileHover={{ y: -8, scale: 1.05 }}
                    onClick={() => setActiveStory(story)}
                    className="relative w-32 h-48 shrink-0 rounded-2xl overflow-hidden border border-white/10 hover:border-[#FF3366] transition-all group shadow-[0_0_20px_rgba(255,51,102,0.15)] cursor-pointer"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent group-hover:from-black/60 transition z-10" />
                    {story.thumbnail_url ? (
                      <Image src={story.thumbnail_url} alt="Story" fill className="object-cover group-hover:scale-110 transition duration-500" />
                    ) : (
                      <div className="w-full h-full bg-[#111] flex items-center justify-center"><Play className="text-white/40"/></div>
                    )}
                    <div className="absolute bottom-3 left-3 right-3 z-20 text-left">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#FF3366] bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-md">
                        <Play size={10} fill="currentColor"/> Ver
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* SESSÃO 2: CRIAÇÃO IA (Câmara de Impressão 3D) */}
        <section ref={createSectionRef} className="py-28 px-6 relative bg-gradient-to-b from-[#050505] via-[#090909] to-[#050505] overflow-hidden">
          {/* Luzes Ambientais Criativa Sisters */}
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-[#FF3366]/15 rounded-full blur-[150px] pointer-events-none" />
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-[#8A2BE2]/15 rounded-full blur-[150px] pointer-events-none" />

          {/* Divisor Luminoso Superior com feixe cósmico */}
          <motion.div 
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="max-w-4xl mx-auto h-px bg-gradient-to-r from-transparent via-[#FF3366] to-transparent mb-16 shadow-[0_0_15px_#FF3366]"
          />

          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.2 }}
            className="max-w-4xl mx-auto glass-panel p-10 md:p-16 text-center border-[#8A2BE2]/40 shadow-[0_0_70px_rgba(138,43,226,0.18)] relative z-10 overflow-hidden"
          >
            {/* Feixe laser horizontal de escaneamento */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF3366] to-transparent animate-pulse" />

            <motion.span 
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-[#FF3366]/15 text-[#FF3366] border border-[#FF3366]/40 mb-6 shadow-[0_0_20px_rgba(255,51,102,0.25)]"
            >
              ✨ IA Generativa Multicor
            </motion.span>
            
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
              {sections['creation_section']?.title || 'Crie Sua Peça'} <span className="gradient-text">Em Segundos</span>
            </h2>
            <p className="text-gray-400 mb-10 text-lg max-w-2xl mx-auto leading-relaxed">
              {sections['creation_section']?.subtitle || 'Nossa IA converte sua imagem 2D em malha tridimensional paramétrica com densidade calculada para impressão na Bambu Lab.'}
            </p>
            
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleUpload} />
            
            <div className="relative inline-block group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#FF3366] to-[#8A2BE2] opacity-75 blur-xl group-hover:opacity-100 transition duration-500 animate-pulse" />
              <motion.button 
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()} 
                className="relative w-full md:w-auto btn-primary flex items-center justify-center gap-3 text-xl px-14 py-5 font-black shadow-[0_0_35px_rgba(255,51,102,0.5)] cursor-pointer"
              >
                {isUploading ? (
                  <span className="animate-pulse">{statusText}</span>
                ) : (
                  <>
                    <span>{sections['creation_section']?.cta_text || 'Subir Imagem e Ver Mágica'}</span>
                    <Printer size={24} className="group-hover:rotate-12 transition-transform duration-300" />
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </section>

        {/* SESSÃO 3: VITRINE DE PROJETOS PRONTOS */}
        <section className="py-28 px-6 relative overflow-hidden">
          {/* Luz Ambiente Cósmica */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-[#8A2BE2]/12 rounded-full blur-[180px] pointer-events-none" />

          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-center mb-16"
            >
              <span className="inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full bg-[#8A2BE2]/15 text-[#E0829D] border border-[#8A2BE2]/40 mb-4 shadow-[0_0_15px_rgba(138,43,226,0.2)]">
                Pronto para Entrega
              </span>
              <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Vitrine <span className="gradient-text">Premium</span></h2>
              <p className="text-gray-400 text-lg">Artes exclusivas já modeladas e prontas para envio imediato.</p>
              <div className="w-24 h-1 bg-gradient-to-r from-[#FF3366] to-[#8A2BE2] mx-auto mt-4 rounded-full" />
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 perspective-[1000px]">
              {products.length === 0 ? (
                <p className="col-span-3 text-center text-gray-500 py-12">Nenhum produto cadastrado na vitrine ainda.</p>
              ) : (
                products.map((prod, index) => (
                  <motion.div 
                    key={prod.id} 
                    initial={{ opacity: 0, y: 60, scale: 0.9, rotateX: 12 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.6, delay: index * 0.12, ease: "easeOut" }}
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="glass-panel group overflow-hidden border-white/5 hover:border-[#FF3366]/60 hover:shadow-[0_0_40px_rgba(255,51,102,0.25)] transition-all duration-300"
                  >
                    <div className="h-64 bg-[#111] flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent z-10" />
                      {prod.image_url ? (
                        <Image src={prod.image_url} alt={prod.name} fill className="object-cover z-0 group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <Package size={64} className="text-gray-600 group-hover:text-[#FF3366] transition-colors z-0" />
                      )}
                      <span className="absolute top-3 right-3 z-20 text-[10px] font-bold uppercase tracking-wider bg-black/70 text-[#E0829D] border border-white/10 px-2.5 py-1 rounded-full backdrop-blur-md">
                        3D Físico
                      </span>
                    </div>
                    <div className="p-6 relative z-20 -mt-10">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold group-hover:text-white transition-colors leading-tight">{prod.name}</h3>
                        <button onClick={async () => {
                          const { data: { session } } = await supabase.auth.getSession();
                          if(!session) { alert('Faça login para favoritar!'); return; }
                          await supabase.from('favorites').insert({ user_id: session.user.id, product_id: prod.id });
                          alert('Adicionado aos favoritos!');
                        }} className="text-gray-400 hover:text-[#FF3366] transition cursor-pointer p-1.5 rounded-full hover:bg-white/5">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                        </button>
                      </div>
                      <p className="text-2xl font-black text-[#E0829D] mb-4">R$ {prod.price.toString().replace('.', ',')}</p>
                      <button onClick={() => {
                        addToCart({
                          id: prod.id,
                          name: prod.name,
                          price: prod.price,
                          quantity: 1,
                          image_url: prod.image_url || '',
                          type: 'product',
                          weight_g: 250
                        });
                        alert('Adicionado ao carrinho!');
                      }} className="w-full btn-secondary group-hover:border-[#FF3366] group-hover:bg-[#FF3366]/10 transition-all cursor-pointer font-bold py-3">Adicionar ao Carrinho</button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* SESSÃO 4: POR QUE ESCOLHER (Montagem de Engenharia / Blueprint) */}
        <section className="py-28 px-6 bg-[#080808] border-y border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#FF3366]/10 rounded-full blur-[160px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#8A2BE2]/10 rounded-full blur-[160px] pointer-events-none" />

          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">O Padrão <span className="gradient-text">Criativa Sisters</span></h2>
              <p className="text-gray-400 text-lg">Tecnologia, precisão mecânica e precificação honesta.</p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {/* Card 1: Desliza da esquerda */}
              <motion.div 
                initial={{ opacity: 0, x: -60, rotateY: -10 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, type: "spring", bounce: 0.2 }}
                whileHover={{ y: -8 }}
                className="text-center space-y-4 glass-panel p-8 border-white/5 hover:border-[#FF3366]/40 hover:shadow-[0_0_35px_rgba(255,51,102,0.2)] transition-all"
              >
                <motion.div 
                  initial={{ rotate: -180, scale: 0 }}
                  whileInView={{ rotate: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 150, delay: 0.2 }}
                  className="w-20 h-20 mx-auto rounded-2xl bg-[#FF3366]/10 flex items-center justify-center border border-[#FF3366]/30 shadow-[0_0_25px_rgba(255,51,102,0.25)]"
                >
                  <Zap size={36} className="text-[#FF3366]" />
                </motion.div>
                <h3 className="text-2xl font-bold">IA de Ponta</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Convertemos sua foto 2D em malha tridimensional complexa em menos de 10 segundos com cálculo paramétrico exato.</p>
              </motion.div>
              
              {/* Card 2: Emerge do fundo com escala */}
              <motion.div 
                initial={{ opacity: 0, y: 70, scale: 0.88 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.15, type: "spring", bounce: 0.2 }}
                whileHover={{ y: -8 }}
                className="text-center space-y-4 glass-panel p-8 border-white/5 hover:border-[#8A2BE2]/40 hover:shadow-[0_0_35px_rgba(138,43,226,0.2)] transition-all"
              >
                <motion.div 
                  initial={{ rotate: -180, scale: 0 }}
                  whileInView={{ rotate: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 150, delay: 0.35 }}
                  className="w-20 h-20 mx-auto rounded-2xl bg-[#8A2BE2]/10 flex items-center justify-center border border-[#8A2BE2]/30 shadow-[0_0_25px_rgba(138,43,226,0.25)]"
                >
                  <Printer size={36} className="text-[#8A2BE2]" />
                </motion.div>
                <h3 className="text-2xl font-bold">Precisão Bambu Lab</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Impressão multicor com sistema AMS Lite. Sua arte nasce colorida diretamente de filamentos de alta densidade sem pintura posterior.</p>
              </motion.div>

              {/* Card 3: Desliza da direita */}
              <motion.div 
                initial={{ opacity: 0, x: 60, rotateY: 10 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.3, type: "spring", bounce: 0.2 }}
                whileHover={{ y: -8 }}
                className="text-center space-y-4 glass-panel p-8 border-white/5 hover:border-[#E0829D]/40 hover:shadow-[0_0_35px_rgba(224,130,157,0.2)] transition-all"
              >
                <motion.div 
                  initial={{ rotate: -180, scale: 0 }}
                  whileInView={{ rotate: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 150, delay: 0.5 }}
                  className="w-20 h-20 mx-auto rounded-2xl bg-[#E0829D]/10 flex items-center justify-center border border-[#E0829D]/30 shadow-[0_0_25px_rgba(224,130,157,0.25)]"
                >
                  <ShieldCheck size={36} className="text-[#E0829D]" />
                </motion.div>
                <h3 className="text-2xl font-bold">Custo Transparente</h3>
                <p className="text-gray-400 text-sm leading-relaxed">Você paga pelo grama exato do filamento calculado antes mesmo da impressão física começar. Zero custos ocultos.</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SESSÃO 5: PROVAS SOCIAIS (Com efeito de montagem inclinada) */}
        <section className="py-28 px-6 relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Quem Compra, <span className="gradient-text">Se Apaixona</span></h2>
              <p className="text-gray-400 mb-14 text-lg">Histórias reais de clientes que materializaram suas ideias.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Depoimento 1: Inclinação dinâmica */}
              <motion.div 
                initial={{ opacity: 0, x: -40, rotate: -3 }}
                whileInView={{ opacity: 1, x: 0, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="glass-panel p-8 text-left border-white/5 hover:border-[#FF3366]/30 flex gap-5 transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)]"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF3366] to-[#8A2BE2] shrink-0 flex items-center justify-center font-black text-white text-xl shadow-[0_0_20px_rgba(255,51,102,0.4)]">
                  M
                </div>
                <div>
                  <div className="flex text-yellow-400 mb-3 gap-1">
                    {[0, 1, 2, 3, 4].map(s => (
                      <motion.div 
                        key={s} 
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + s * 0.08 }}
                      >
                        <Star size={16} fill="currentColor"/>
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-gray-300 text-sm italic leading-relaxed">
                    "Eu mandei um logo da minha empresa e achei que ia ficar reto, mas a IA gerou um volume perfeito. A cor ficou idêntica ao arquivo original!"
                  </p>
                  <p className="text-xs text-[#E0829D] font-bold mt-3">- Marcos T. (São Paulo, SP)</p>
                </div>
              </motion.div>

              {/* Depoimento 2: Inclinação oposta */}
              <motion.div 
                initial={{ opacity: 0, x: 40, rotate: 3 }}
                whileInView={{ opacity: 1, x: 0, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15, type: "spring", bounce: 0.3 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="glass-panel p-8 text-left border-white/5 hover:border-[#8A2BE2]/30 flex gap-5 transition-all shadow-[0_0_30px_rgba(0,0,0,0.5)]"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8A2BE2] to-[#E0829D] shrink-0 flex items-center justify-center font-black text-white text-xl shadow-[0_0_20px_rgba(138,43,226,0.4)]">
                  A
                </div>
                <div>
                  <div className="flex text-yellow-400 mb-3 gap-1">
                    {[0, 1, 2, 3, 4].map(s => (
                      <motion.div 
                        key={s} 
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.45 + s * 0.08 }}
                      >
                        <Star size={16} fill="currentColor"/>
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-gray-300 text-sm italic leading-relaxed">
                    "Atendimento surreal. Cliquei no botão do WhatsApp no preview 3D e a equipe melhorou os detalhes da peça pra mim antes de imprimir!"
                  </p>
                  <p className="text-xs text-[#E0829D] font-bold mt-3">- Ana Julia (Curitiba, PR)</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* SESSÃO 6: CONTATO E FOOTER */}
        <section className="pt-28 pb-10 px-6 bg-[#020202] text-center border-t border-white/5 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-[#FF3366]/10 rounded-full blur-[140px] pointer-events-none" />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl mx-auto mb-20 relative z-10"
          >
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Ainda tem dúvidas?</h2>
            <p className="text-gray-400 mb-8 text-lg">Nossa equipe de especialistas em modelagem está pronta para transformar qualquer projeto em realidade.</p>
            
            <div className="relative inline-block group">
              <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#FF3366] to-[#8A2BE2] opacity-60 blur-md group-hover:opacity-100 transition duration-300" />
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.open(`https://wa.me/5511999999999?text=Olá, quero tirar dúvidas sobre um projeto 3D na Criativa Sisters!`, '_blank')}
                className="relative mx-auto btn-secondary border border-[#FF3366]/50 flex items-center gap-3 px-8 py-4 font-bold text-lg hover:border-[#FF3366] transition-all cursor-pointer bg-black/80"
              >
                <MessageCircle size={22} className="text-[#FF3366]" /> 
                <span>Falar com Atendimento Especializado</span>
              </motion.button>
            </div>
          </motion.div>
          
          <div className="text-xs text-gray-600 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-white/5 pt-8 max-w-6xl mx-auto relative z-10">
            <p>© 2026 Criativa Sisters. Todos os direitos reservados.</p>
            <p>Plataforma Desenvolvida por Wancora & Antigravity</p>
          </div>
        </section>

      </main>

      {/* MODAL DO STORY (Fundo Borrado) */}
      {activeStory && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-xl">
          <button onClick={() => setActiveStory(null)} className="absolute top-6 right-6 text-white hover:text-[#FF3366] z-50">
            <X size={32} />
          </button>
          
          <div className="w-full max-w-[400px] h-[80vh] bg-black rounded-xl overflow-hidden relative shadow-[0_0_50px_rgba(255,51,102,0.2)]">
            <video src={activeStory.video_url} autoPlay loop playsInline className="w-full h-full object-cover" />
            
            {activeStory.products && (
              <div className="absolute bottom-6 left-6 right-6 p-4 glass-panel flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Produto em Destaque</p>
                  <p className="font-bold text-sm truncate w-32">{activeStory.products.name}</p>
                </div>
                <button className="btn-primary px-4 py-2 text-xs flex gap-2">
                  <ShoppingBag size={14} /> {activeStory.cta_text}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
