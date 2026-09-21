'use client';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function BackgroundScrollGlow() {
  const { scrollYProgress } = useScroll();
  const [pageHeight, setPageHeight] = useState(6000);

  useEffect(() => {
    const updateHeight = () => {
      setPageHeight(document.documentElement.scrollHeight);
    };
    // Executar após um pequeno delay para garantir que imagens carregaram
    setTimeout(updateHeight, 500);
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Opacidade começa no 0 e acende após 5% de scroll
  const pathLength = useTransform(scrollYProgress, [0, 0.05, 1], [0, 0, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.05, 0.1], [0, 0, 0.6]);

  // Caminho responsivo em formato zig-zag muito suave e largo para entrelaçar os conteúdos.
  // 1000 de largura (viewBox)
  // 10000 de altura
  const svgPath = `
    M 100 0 
    C 200 800, 900 1200, 850 2000 
    C 800 2800, 100 3200, 150 4000 
    C 200 4800, 900 5200, 850 6000 
    C 800 6800, 100 7200, 150 8000
    C 200 8800, 900 9200, 850 10000
  `;

  return (
    <div className="absolute top-0 left-0 w-full overflow-hidden pointer-events-none z-[0]" style={{ height: pageHeight }}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 1000 10000" 
        preserveAspectRatio="none"
        className="absolute top-0 left-0 opacity-70"
      >
        <defs>
          <linearGradient id="glowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF3366" />
            <stop offset="50%" stopColor="#8A2BE2" />
            <stop offset="100%" stopColor="#E0829D" />
          </linearGradient>
          <filter id="glowBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="25" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Trilho base super suave */}
        <path 
          d={svgPath}
          fill="none"
          stroke="rgba(255, 255, 255, 0.02)"
          strokeWidth="3"
        />

        {/* Linha Iluminada e Mágica */}
        <motion.path 
          d={svgPath}
          fill="none"
          stroke="url(#glowGradient)"
          strokeWidth="8"
          filter="url(#glowBlur)"
          style={{
            pathLength: pathLength,
            opacity: opacity
          }}
        />
      </svg>
    </div>
  );
}
