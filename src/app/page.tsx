"use client";

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, CheckCircle, Star, MessageCircle, Printer, ShieldCheck, Zap } from 'lucide-react';

export default function LandingPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const createSectionRef = useRef<HTMLElement>(null);

  // Lógica da Animação do Logo
  const [animStage, setAnimStage] = useState(0); // 0: Imprimindo, 1: Fixo grande, 2: Encolhido no topo

  useEffect(() => {
    // Stage 0 (Imprimindo) dura 3 segundos
    const t1 = setTimeout(() => {
      setAnimStage(1);
      // Stage 1 (Grande) dura 5 segundos
      const t2 = setTimeout(() => {
        setAnimStage(2);
      }, 5000);
      return () => clearTimeout(t2);
    }, 3000);
    return () => clearTimeout(t1);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatusText("Analisando imagem com IA...");

    const formData = new FormData();
    formData.append('image', file);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      const res = await fetch(`${backendUrl}/api/generate`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error("Falha ao gerar o modelo 3D.");

      setStatusText("Calculando Bounding Box...");
      const data = await res.json();
      
      if (data.success && data.projectId) {
        const queryParams = new URLSearchParams({
          x: data.data.dimensions.x,
          y: data.data.dimensions.y,
          z: data.data.dimensions.z,
          colors: data.data.colors.join(','),
          modelUrl: data.data.modelUrl
        }).toString();
        
        router.push(`/preview/${data.projectId}?${queryParams}`);
      }
    } catch (error) {
      console.error(error);
      alert("Houve um erro no processamento. Verifique se o Backend está rodando.");
      setIsUploading(false);
    }
  };

  const scrollToCreation = () => {
    createSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans">
      
      {/* SESSÃO 1: HERO & ANIMAÇÃO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center p-8 border-b border-white/5">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF3366] opacity-5 blur-[120px] rounded-full pointer-events-none" />

        {/* Animação do Logo */}
        <div className={`relative transition-all duration-1000 ease-in-out z-20 ${
          animStage === 2 ? 'absolute top-8 scale-50 md:scale-75' : 'scale-100 mb-8'
        }`}>
          <div className="relative w-64 h-64 md:w-80 md:h-80 drop-shadow-[0_0_30px_rgba(255,51,102,0.3)]">
            {/* O Logo com máscara de revelação (de cima pra baixo) */}
            <div className={`w-full h-full absolute ${animStage === 0 ? 'animate-reveal' : ''}`}>
              <Image 
                src="/logos/logo-3d-metallic.jpg" 
                alt="Criativa Sisters Logo" 
                fill
                className="object-contain rounded-full border border-white/10"
                priority
              />
            </div>
            
            {/* O Bico da Impressora 3D (só aparece no estágio 0) */}
            {animStage === 0 && (
              <div className="absolute w-8 h-8 -ml-4 -mt-4 animate-zigzag z-30 flex flex-col items-center drop-shadow-lg">
                <div className="w-1 h-8 bg-gray-300"></div>
                <div className="w-4 h-4 bg-gray-400 rounded-b-full border-b-2 border-[#FF3366]"></div>
              </div>
            )}
          </div>
        </div>

        {/* Textos e CTA (Aparecem suavemente após a animação de imprimir, ou ficam fixos) */}
        <div className={`z-10 max-w-4xl w-full flex flex-col items-center justify-center gap-6 mt-4 transition-opacity duration-1000 ${animStage > 0 ? 'opacity-100' : 'opacity-0'}`}>
          <h1 className="text-4xl md:text-6xl font-bold text-center leading-tight">
            Transforme suas Ideias em <span className="gradient-text">Realidade Volumétrica</span>
          </h1>
          <p className="text-xl text-gray-400 text-center max-w-2xl font-light">
            A primeira fábrica digital impulsionada por IA. Envie uma foto e receba uma estátua física de altíssima precisão na sua casa.
          </p>
          
          <button onClick={scrollToCreation} className="btn-primary flex items-center gap-2 text-lg px-8 py-4 mt-4 animate-bounce shadow-[0_0_20px_rgba(255,51,102,0.5)]">
            Iniciar Meu Projeto <ArrowDown size={20} />
          </button>
          
          {/* Mini imagens de artes */}
          <div className="flex gap-4 mt-8 opacity-70">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-16 h-16 md:w-24 md:h-24 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center">
                <Package className="text-gray-500" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SESSÃO 2: CRIAÇÃO (Onde faz o Upload) */}
      <section ref={createSectionRef} className="py-24 px-6 relative bg-gradient-to-b from-[#050505] to-[#0a0a0a]">
        <div className="max-w-4xl mx-auto glass-panel p-10 md:p-16 text-center border-[#8A2BE2]/20 shadow-[0_0_50px_rgba(138,43,226,0.1)]">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Crie Sua Peça Agora</h2>
          <p className="text-gray-400 mb-10 text-lg">Nossa Inteligência Artificial calculará o volume, extrairá as cores e te dará o orçamento instantâneo.</p>
          
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleUpload} />
          
          <button 
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()} 
            className="w-full md:w-auto mx-auto btn-primary flex items-center justify-center gap-3 text-xl px-12 py-5"
          >
            {isUploading ? (
              <span className="animate-pulse">{statusText}</span>
            ) : (
              <>Subir Imagem e Ver Mágica <Printer size={24} /></>
            )}
          </button>
          <p className="text-xs text-gray-500 mt-4">Formatos aceitos: JPG, PNG, WEBP. Tamanho max: 10MB.</p>
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
            {[
              { name: 'Busto Heroico', price: 'R$ 149,90', img: 'hero' },
              { name: 'Luminária Geométrica', price: 'R$ 89,90', img: 'lamp' },
              { name: 'Mascote Corporativo', price: 'R$ 199,00', img: 'pet' }
            ].map((prod, idx) => (
              <div key={idx} className="glass-panel group overflow-hidden border-white/5 hover:border-[#FF3366]/50 transition-colors">
                <div className="h-64 bg-[#111] flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                  <Package size={64} className="text-gray-600 group-hover:text-[#FF3366] transition-colors z-0" />
                </div>
                <div className="p-6 relative z-20 -mt-12">
                  <h3 className="text-xl font-bold mb-1">{prod.name}</h3>
                  <p className="text-2xl font-black text-[#E0829D] mb-4">{prod.price}</p>
                  <button className="w-full btn-secondary">Comprar Agora</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SESSÃO 4: POR QUE ESCOLHER (Gatilhos Mentais) */}
      <section className="py-24 px-6 bg-[#080808] border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">O Padrão <span className="gradient-text">Criativa Sisters</span></h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-[#FF3366]/10 flex items-center justify-center border border-[#FF3366]/30">
                <Zap size={32} className="text-[#FF3366]" />
              </div>
              <h3 className="text-xl font-bold">IA de Ponta</h3>
              <p className="text-gray-400 text-sm">Convertemos sua foto 2D em malha tridimensional complexa em menos de 10 segundos.</p>
            </div>
            
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-[#8A2BE2]/10 flex items-center justify-center border border-[#8A2BE2]/30">
                <Printer size={32} className="text-[#8A2BE2]" />
              </div>
              <h3 className="text-xl font-bold">Precisão Bambu Lab</h3>
              <p className="text-gray-400 text-sm">Impressão multicor com o sistema AMS Lite. Sua arte não é pintada, ela nasce colorida.</p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-[#E0829D]/10 flex items-center justify-center border border-[#E0829D]/30">
                <ShieldCheck size={32} className="text-[#E0829D]" />
              </div>
              <h3 className="text-xl font-bold">Custo Transparente</h3>
              <p className="text-gray-400 text-sm">Você paga pelo grama exato do filamento calculado antes mesmo da impressão começar.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SESSÃO 5: PROVAS SOCIAIS */}
      <section className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Quem Compra, Se Apaixona.</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 text-left border-white/5 flex gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-700 shrink-0" />
              <div>
                <div className="flex text-yellow-400 mb-2"><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/></div>
                <p className="text-gray-300 text-sm italic">"Eu mandei um logo da minha empresa e achei que ia ficar reto, mas a IA gerou um volume perfeito. A cor ficou idêntica!"</p>
                <p className="text-xs text-gray-500 mt-2">- Marcos T.</p>
              </div>
            </div>
            <div className="glass-panel p-6 text-left border-white/5 flex gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-700 shrink-0" />
              <div>
                <div className="flex text-yellow-400 mb-2"><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/><Star size={14} fill="currentColor"/></div>
                <p className="text-gray-300 text-sm italic">"Atendimento surreal. Cliquei no botão do Whatsapp no preview e a equipe melhorou os detalhes do rosto pra mim."</p>
                <p className="text-xs text-gray-500 mt-2">- Ana Julia</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SESSÃO 6: CONTATO E FOOTER */}
      <section className="pt-24 pb-8 px-6 bg-[#020202] text-center border-t border-white/5">
        <div className="max-w-2xl mx-auto mb-20">
          <h2 className="text-3xl font-bold mb-4">Ainda tem dúvidas?</h2>
          <p className="text-gray-400 mb-8">Nossa equipe de especialistas em modelagem está pronta para transformar seu projeto.</p>
          <button className="mx-auto btn-secondary border border-[#FF3366]/30 flex items-center gap-2 hover:border-[#FF3366]">
            <MessageCircle size={20} className="text-[#FF3366]" /> Falar com Atendimento
          </button>
        </div>
        
        <div className="text-xs text-gray-600 flex flex-col md:flex-row justify-between items-center gap-4 border-t border-white/5 pt-8 max-w-6xl mx-auto">
          <p>© 2026 Criativa Sisters. Todos os direitos reservados.</p>
          <p>Plataforma Desenvolvida por Wancora & Antigravity</p>
        </div>
      </section>

    </main>
  );
}
