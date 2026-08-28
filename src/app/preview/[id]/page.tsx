"use client";

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Float } from '@react-three/drei';
import { MessageCircle, CheckCircle, Package } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';

function MockModel({ mainColor }: { mainColor: string }) {
  return (
    <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
      <mesh>
        <torusKnotGeometry args={[1, 0.3, 128, 32]} />
        <meshStandardMaterial color={mainColor} roughness={0.1} metalness={0.8} />
      </mesh>
    </Float>
  );
}

export default function PreviewPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  
  // Pegando os dados gerados pelo Backend (passados na URL)
  const x = searchParams.get('x') || '15.2';
  const y = searchParams.get('y') || '21.0';
  const z = searchParams.get('z') || '14.8';
  const rawColors = searchParams.get('colors');
  const colors = rawColors ? rawColors.split(',') : ['#8A2BE2'];
  const mainColor = colors[0];

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-[#050505] text-white">
      {/* 3D Viewer Section */}
      <section className="flex-1 relative h-[60vh] md:h-screen">
        <div className="absolute top-6 left-6 z-10 glass-panel p-4 flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/10 shadow-[0_0_10px_rgba(255,51,102,0.2)]">
            <Image 
              src="/logos/logo-color-dark.jpg" 
              alt="Logo Criativa Sisters" 
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold gradient-text mb-0.5 leading-none">Criativa Sisters</h1>
            <p className="text-xs text-gray-400">Inspeção 360º - Projeto #{id}</p>
          </div>
        </div>
        
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 0, 5], fov: 45 }}>
          <Suspense fallback={null}>
            <Stage environment="city" intensity={0.5}>
              <MockModel mainColor={mainColor} />
            </Stage>
            <OrbitControls autoRotate autoRotateSpeed={2} enableZoom={true} makeDefault />
          </Suspense>
        </Canvas>
      </section>

      {/* Side Panel Sections */}
      <section className="w-full md:w-[400px] border-t md:border-t-0 md:border-l border-white/10 p-6 flex flex-col bg-[#080808] z-20">
        
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-6">
            <Package className="text-[#FF3366]" size={28} />
            <h2 className="text-xl font-bold">Métricas do Modelo</h2>
          </div>

          <div className="glass-panel p-5 mb-8 space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="text-gray-400">Largura (X)</span>
              <span className="font-mono font-medium">{x} cm</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="text-gray-400">Altura (Y)</span>
              <span className="font-mono font-medium">{y} cm</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="text-gray-400">Profundidade (Z)</span>
              <span className="font-mono font-medium">{z} cm</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-gray-400">Cores Extraídas (AMS)</span>
              <div className="flex gap-2">
                {colors.map((c, i) => (
                  <div key={i} className="w-6 h-6 rounded-full border border-white/20 shadow-md" style={{ backgroundColor: c }} title={c}></div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-[#121212] p-4 rounded-lg border border-[#FF3366]/30 mb-8">
            <p className="text-sm text-gray-300 text-center">
              O modelo atende aos limites da caixa de impressão (25.6cm³).
            </p>
          </div>
        </div>

        <div className="space-y-4 pb-8 md:pb-0">
          <button className="w-full btn-primary flex items-center justify-center gap-2">
            <CheckCircle size={20} />
            Aprovar Arte e Ver Preço
          </button>
          
          <button 
            className="w-full btn-secondary flex items-center justify-center gap-2 border border-[#8A2BE2]/50 hover:border-[#8A2BE2]"
            onClick={() => window.open(`https://wa.me/5511999999999?text=Olá, sou o dono do projeto %23${id}, preciso melhorar minha arte com um especialista.`, '_blank')}
          >
            <MessageCircle size={20} className="text-[#8A2BE2]" />
            <span className="text-sm">Falar com Especialista</span>
          </button>
        </div>
      </section>
    </main>
  );
}
