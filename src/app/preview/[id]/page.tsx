"use client";

import React, { Suspense, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, Float } from '@react-three/drei';
import { MessageCircle, CheckCircle, Package, Plus, Minus, Tag } from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';

function MockModel({ mainColor, scaleMultiplier }: { mainColor: string, scaleMultiplier: number }) {
  return (
    <Float speed={1.5} rotationIntensity={1} floatIntensity={2}>
      <mesh scale={[scaleMultiplier, scaleMultiplier, scaleMultiplier]}>
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
  const baseX = parseFloat(searchParams.get('x') || '15.2');
  const baseY = parseFloat(searchParams.get('y') || '21.0');
  const baseZ = parseFloat(searchParams.get('z') || '14.8');
  
  const rawColors = searchParams.get('colors');
  const colors = rawColors ? rawColors.split(',') : ['#8A2BE2'];
  const mainColor = colors[0];

  // Pegando o número de WhatsApp configurado pelo Admin
  const [adminPhone, setAdminPhone] = useState('5511999999999');

  React.useEffect(() => {
    const savedWa = localStorage.getItem('criativa_whatsapp');
    if (savedWa) setAdminPhone(savedWa);
  }, []);

  // Estados de Personalização do Usuário
  const [scalePercent, setScalePercent] = useState<number>(100);
  const [quantity, setQuantity] = useState<number>(1);

  // Cálculos Dinâmicos
  const scaleMultiplier = scalePercent / 100;
  const currentX = (baseX * scaleMultiplier).toFixed(1);
  const currentY = (baseY * scaleMultiplier).toFixed(1);
  const currentZ = (baseZ * scaleMultiplier).toFixed(1);

  // Matemática de Precificação
  const pricing = useMemo(() => {
    // 1. Volume aparente em cm³
    const volumeBox = (baseX * scaleMultiplier) * (baseY * scaleMultiplier) * (baseZ * scaleMultiplier);
    
    // 2. Volume real estimado (assumindo 20% de preenchimento/infill para uma estátua média)
    const volumeReal = volumeBox * 0.20;
    
    // 3. Peso estimado (Densidade do PLA = 1.24 g/cm³)
    const pesoGramas = volumeReal * 1.24;
    
    // 4. Custos Base
    const custoMaterial = pesoGramas * 0.12; // R$ 120 por KG (R$ 0.12 por grama)
    const custoFixo = 5.00; // Energia, desgaste, setup
    const custoTotalBase = custoMaterial + custoFixo;
    
    // 5. Lógica de Margem por Quantidade
    let margem = 3.0; // 300% padrão
    if (quantity >= 10) margem = 2.0; // 200% para atacado
    else if (quantity >= 5) margem = 2.5; // 250% intermediário

    // 6. Preço Final
    const precoUnitario = custoTotalBase * margem;
    const precoTotal = precoUnitario * quantity;

    return {
      peso: pesoGramas.toFixed(0),
      precoTotal: precoTotal.toFixed(2).replace('.', ',')
    };
  }, [baseX, baseY, baseZ, scaleMultiplier, quantity]);

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-[#050505] text-white">
      {/* 3D Viewer Section */}
      <section className="flex-1 relative h-[60vh] md:h-screen overflow-hidden">
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
              <MockModel mainColor={mainColor} scaleMultiplier={scaleMultiplier} />
            </Stage>
            <OrbitControls autoRotate autoRotateSpeed={2} enableZoom={true} makeDefault />
          </Suspense>
        </Canvas>
      </section>

      {/* Side Panel Sections */}
      <section className="w-full md:w-[450px] border-t md:border-t-0 md:border-l border-white/10 flex flex-col bg-[#080808] z-20 h-screen overflow-y-auto custom-scrollbar">
        
        <div className="flex-1 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Package className="text-[#FF3366]" size={28} />
            <h2 className="text-xl font-bold">Personalização</h2>
          </div>

          {/* Sliders e Inputs de Personalização */}
          <div className="glass-panel p-5 mb-6 space-y-6">
            {/* Tamanho */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-300">Escala da Peça</label>
                <span className="text-sm font-bold text-[#E0829D]">{scalePercent}%</span>
              </div>
              <input 
                type="range" 
                min="30" 
                max="100" 
                value={scalePercent} 
                onChange={(e) => setScalePercent(parseInt(e.target.value))}
                className="w-full accent-[#FF3366] h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-2">Reduza a escala para diminuir o custo de produção.</p>
            </div>

            {/* Quantidade */}
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-2">Quantidade</label>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
                >
                  <Minus size={16} />
                </button>
                <span className="text-lg font-bold w-8 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition"
                >
                  <Plus size={16} />
                </button>
                <span className="text-xs text-green-400 ml-auto">
                  {quantity >= 10 ? 'Desconto Atacado (Máx)' : quantity >= 5 ? 'Desconto Progressivo' : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Métricas e Fatiamento Dinâmico */}
          <div className="bg-[#121212] p-5 rounded-xl border border-white/5 mb-6 space-y-3">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Métricas de Fatiamento (Tempo Real)</h3>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Largura (L / X)</span>
              <span className="font-mono text-sm">{currentX} cm</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Altura (A / Y)</span>
              <span className="font-mono text-sm">{currentY} cm</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Profundidade (P / Z)</span>
              <span className="font-mono text-sm">{currentZ} cm</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Peso Estimado (Material)</span>
              <span className="font-mono text-sm">{pricing.peso}g</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Cores Extraídas (AMS)</span>
              <div className="flex gap-2">
                {colors.map((c, i) => (
                  <div key={i} className="w-5 h-5 rounded-full border border-white/20 shadow-md" style={{ backgroundColor: c }}></div>
                ))}
              </div>
            </div>
          </div>
          
        </div>

        {/* Rodapé de Check-out e CTA Fixo */}
        <div className="p-6 bg-[#0a0a0a] border-t border-white/10 mt-auto">
          <div className="flex justify-between items-end mb-6">
            <div>
              <span className="block text-sm text-gray-400">Valor Total</span>
              <span className="block text-xs text-gray-600">Calculado por IA Generativa</span>
            </div>
            <span className="text-3xl font-bold gradient-text">R$ {pricing.precoTotal}</span>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-sm font-bold text-gray-300">Dados para Envio & Aprovação</p>
            <input type="text" placeholder="Seu WhatsApp (Ex: 11 99999-9999)" className="w-full bg-[#121212] border border-white/10 p-3 rounded text-white text-sm focus:border-[#FF3366] transition outline-none" required />
            <input type="email" placeholder="Seu E-mail" className="w-full bg-[#121212] border border-white/10 p-3 rounded text-white text-sm focus:border-[#FF3366] transition outline-none" required />
            <textarea placeholder="Detalhes opcionais (Se preenchido, passa por revisão humana antes de imprimir)" className="w-full bg-[#121212] border border-white/10 p-3 rounded text-white text-sm focus:border-[#FF3366] transition outline-none h-20 resize-none"></textarea>
          </div>

          <button className="w-full btn-primary flex items-center justify-center gap-2 mb-3 shadow-[0_0_20px_rgba(255,51,102,0.3)]">
            <Tag size={20} />
            Finalizar Compra
          </button>
          
          <button 
            className="w-full btn-secondary flex items-center justify-center gap-2 border border-[#8A2BE2]/30 hover:border-[#8A2BE2]"
            onClick={() => window.open(`https://wa.me/${adminPhone}?text=Olá, tenho dúvidas sobre o orçamento de R$${pricing.precoTotal} do projeto %23${id}.`, '_blank')}
          >
            <MessageCircle size={20} className="text-[#8A2BE2]" />
            <span className="text-sm">Falar com Especialista</span>
          </button>
        </div>
      </section>
    </main>
  );
}
