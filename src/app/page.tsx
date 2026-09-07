"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Printer, Package, Zap, ShieldCheck, Star, MessageCircle, Play, X, ShoppingBag } from 'lucide-react';
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createSectionRef = useRef<HTMLElement>(null);

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
    async function fetchData() {
      // Puxando Banners
      const { data: bData } = await supabase.from('banners').select('*').eq('is_active', true).order('display_order');
      if (bData) setBanners(bData);

      // Puxando Stories
      const { data: sData } = await supabase.from('stories').select('*, products(*)').eq('is_active', true).order('created_at', { ascending: false });
      if (sData) setStories(sData);

      // Puxando Textos
      const { data } = await supabase.from('landing_content').select('*');
      if (data) {
        const mapped: any = {};
        data.forEach(item => { mapped[item.id] = item; });
        setSections(mapped);
      }
      
      // Puxando Produtos da Vitrine
      const { data: pData } = await supabase.from('products').select('*').limit(6);
      if (pData) setProducts(pData);
    }
    fetchData();
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

      if (!res.ok) throw new Error("Falha ao enviar a imagem para a IA.");

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
                  modelUrl: statusData.modelUrl
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
        throw new Error("Resposta inválida da API.");
      }
    } catch (error) {
      console.error(error);
      alert("Houve um erro no processamento. Verifique se o Backend está rodando.");
      setIsUploading(false);
    }
  };

  const flashBanners = banners.filter(b => b.type === 'flash');
  const loopBanners = banners.filter(b => b.type === 'loop');

  return (
    <main className="min-h-screen w-full overflow-x-hidden">
      
      {/* SESSÃO 1: BANNERS (Flash e Loop) */}
      <section className="relative w-full bg-[#020202]">
        {/* Flash Banner (Topo) */}
        {flashBanners.length > 0 && (
          <div className="w-full h-[400px] relative flex items-center justify-center overflow-hidden border-b border-white/5">
             {/* Exibindo o primeiro apenas no MVP (pode evoluir para fade) */}
             <Image src={flashBanners[0].image_url} alt="Destaque" fill className="object-cover opacity-80" />
             <div className="absolute inset-0 bg-gradient-to-t from-[#020202] to-transparent" />
             <div className="relative z-10 text-center">
               <h1 className="text-4xl md:text-6xl font-black mb-4 drop-shadow-2xl">
                 Bem-vindo à <span className="gradient-text">Criativa Sisters</span>
               </h1>
             </div>
          </div>
        )}

        {/* Marquee Banners (Loop Infinito) */}
        {loopBanners.length > 0 && (
          <div className="w-full bg-[#111] border-b border-white/5 overflow-hidden py-4">
            <div className="flex gap-4 animate-marquee whitespace-nowrap">
              {/* Duplicado para efeito infinito */}
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
        <section className="py-8 px-6 bg-[#050505] border-b border-white/5">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Play size={20} className="text-[#FF3366]"/> Criativa Shorts</h3>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {stories.map(story => (
                <button 
                  key={story.id} 
                  onClick={() => setActiveStory(story)}
                  className="relative w-28 h-40 shrink-0 rounded-xl overflow-hidden border-2 border-transparent hover:border-[#FF3366] transition group"
                >
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition z-10" />
                  {story.thumbnail_url ? (
                    <Image src={story.thumbnail_url} alt="Story" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#111] flex items-center justify-center"><Play className="text-white/30"/></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* SESSÃO 2: CRIAÇÃO (Onde faz o Upload) */}
      <section ref={createSectionRef} className="py-24 px-6 relative bg-gradient-to-b from-[#050505] to-[#0a0a0a]">
        <div className="max-w-4xl mx-auto glass-panel p-10 md:p-16 text-center border-[#8A2BE2]/20 shadow-[0_0_50px_rgba(138,43,226,0.1)]">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{sections['creation_section']?.title || 'Crie Sua Peça Agora'}</h2>
          <p className="text-gray-400 mb-10 text-lg">{sections['creation_section']?.subtitle || 'Nossa IA vai transformar sua imagem.'}</p>
          
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleUpload} />
          
          <button 
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()} 
            className="w-full md:w-auto mx-auto btn-primary flex items-center justify-center gap-3 text-xl px-12 py-5"
          >
            {isUploading ? (
              <span className="animate-pulse">{statusText}</span>
            ) : (
              <>{sections['creation_section']?.cta_text || 'Subir Imagem e Ver Mágica'} <Printer size={24} /></>
            )}
          </button>
        </div>
      </section>

      {/* SESSÃO 3: VITRINE DE PROJETOS PRONTOS (E-commerce Mock) */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Vitrine <span className="gradient-text">Premium</span></h2>
            <p className="text-gray-400">Artes já modeladas e prontas para envio imediato.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.length === 0 ? (
              <p className="col-span-3 text-center text-gray-500">Nenhum produto cadastrado na vitrine ainda.</p>
            ) : (
              products.map((prod) => (
                <div key={prod.id} className="glass-panel group overflow-hidden border-white/5 hover:border-[#FF3366]/50 transition-colors">
                  <div className="h-64 bg-[#111] flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                    {prod.image_url ? (
                      <Image src={prod.image_url} alt={prod.name} fill className="object-cover z-0" />
                    ) : (
                      <Package size={64} className="text-gray-600 group-hover:text-[#FF3366] transition-colors z-0" />
                    )}
                  </div>
                  <div className="p-6 relative z-20 -mt-12">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-xl font-bold">{prod.name}</h3>
                      <button onClick={async () => {
                        const { data: { session } } = await supabase.auth.getSession();
                        if(!session) { alert('Faça login para favoritar!'); return; }
                        await supabase.from('favorites').insert({ user_id: session.user.id, product_id: prod.id });
                        alert('Adicionado aos favoritos!');
                      }} className="text-gray-400 hover:text-[#FF3366] transition">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                      </button>
                    </div>
                    <p className="text-2xl font-black text-[#E0829D] mb-4">R$ {prod.price.toString().replace('.', ',')}</p>
                    <button className="w-full btn-secondary">Comprar Agora</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* MODAL DO STORY (Fundo Borrado) */}
      {activeStory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl">
          <button onClick={() => setActiveStory(null)} className="absolute top-6 right-6 text-white hover:text-[#FF3366] z-50">
            <X size={32} />
          </button>
          
          <div className="w-full max-w-[400px] h-[80vh] bg-black rounded-xl overflow-hidden relative shadow-[0_0_50px_rgba(255,51,102,0.2)]">
            <video src={activeStory.video_url} autoPlay loop playsInline className="w-full h-full object-cover" />
            
            {/* CTA do Produto Linkado */}
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

      {/* FOOTER */}
      <section className="pt-24 pb-8 px-6 bg-[#020202] text-center border-t border-white/5">
        <p className="text-xs text-gray-600">© 2026 Criativa Sisters. Todos os direitos reservados.</p>
      </section>

    </main>
  );
}
