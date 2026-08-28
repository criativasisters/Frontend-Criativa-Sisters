"use client";

import Image from 'next/image';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isUploading, setIsUploading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatusText("Analisando imagem com IA...");

    const formData = new FormData();
    formData.append('image', file);

    try {
      // Chama o nosso backend real (rodando na porta 3001 localmente, ou no Render em prod)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
      
      const res = await fetch(`${backendUrl}/api/generate`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error("Falha ao gerar o modelo 3D.");

      setStatusText("Calculando Bounding Box...");
      const data = await res.json();
      
      if (data.success && data.projectId) {
        // Redireciona para a tela de Preview passando os dados (em um cenário real, usaremos Zustand/Context ou puxaremos do Supabase usando o projectId)
        // Para o teste Mock, vamos passar os parametros pela URL
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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 md:p-24 bg-[#050505] text-white overflow-hidden relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#8A2BE2] opacity-5 blur-[120px] rounded-full pointer-events-none" />

      <div className="z-10 max-w-5xl w-full flex flex-col items-center justify-center gap-8">
        <div className="relative w-64 h-64 md:w-80 md:h-80 mb-4 drop-shadow-[0_0_25px_rgba(224,130,157,0.3)]">
          <Image 
            src="/logos/logo-3d-metallic.jpg" 
            alt="Criativa Sisters Logo 3D Premium" 
            fill
            className="object-contain rounded-full border border-white/5"
            priority
          />
        </div>

        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold gradient-text pb-2">
            Criativa Sisters
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light leading-relaxed">
            Fábrica Volumétrica 3D. Faça o upload de uma imagem e veja a mágica do fatiamento em tempo real.
          </p>
        </div>

        <div className="mt-8 flex gap-4 flex-col items-center">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleUpload} 
          />
          
          <button 
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()} 
            className="btn-primary group flex items-center justify-center gap-2 text-lg px-8 py-4 min-w-[280px]"
          >
            {isUploading ? (
              <span className="animate-pulse">{statusText}</span>
            ) : (
              <>
                Gerar Estátua 3D
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-y-[-2px]"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
