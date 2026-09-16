"use client";

import { useEffect, useRef } from "react";

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  decay: number;
  color: string;
}

interface TrailNode {
  x: number;
  y: number;
  alpha: number;
  width: number;
}

export function ScrollSnake() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const sparks: Spark[] = [];
    const trail: TrailNode[] = [];
    const maxTrailNodes = 45;

    let targetProgress = 0;
    let currentProgress = 0;
    let scrollVelocity = 0;
    let lastScrollY = window.scrollY;
    let idleTimer = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      targetProgress = Math.min(1, Math.max(0, scrollY / maxScroll));
      scrollVelocity = Math.abs(scrollY - lastScrollY);
      lastScrollY = scrollY;
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Ponto no caminho em ziguezague (margens esquerda e direita para não sobrepor o centro)
    const getFilamentPosition = (prog: number, time: number) => {
      // 5 ciclos completos de zigzag ao longo da página inteira
      const wave = Math.sin(prog * Math.PI * 8 + time * 0.8);
      
      // Margens dinâmicas: fica nos terços laterais
      const sideMargin = Math.min(140, width * 0.08);
      const isRight = wave > 0;
      const edge = isRight ? width - sideMargin : sideMargin;
      const x = edge + Math.sin(prog * 20 + time * 1.5) * (sideMargin * 0.45);
      
      // Y mapeado verticalmente na tela com leve onda
      const baseScreenY = 100 + prog * (height - 200);
      const y = Math.min(height - 40, Math.max(40, baseScreenY + Math.cos(prog * 12 + time) * 35));

      return { x, y };
    };

    const spawnSparks = (x: number, y: number, count: number, intensity: number) => {
      const palette = [
        "rgba(255, 51, 102, ",  // Magenta Shock
        "rgba(138, 43, 226, ", // Violeta Cósmico
        "rgba(224, 130, 157, ", // Rosa Metálico
        "rgba(255, 255, 255, "  // Branco Luz
      ];

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.6 + Math.random() * 2.2) * (1 + intensity * 0.05);
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - (0.4 + Math.random() * 0.8), // sobe levemente
          size: 1 + Math.random() * 2.8,
          alpha: 0.8 + Math.random() * 0.2,
          decay: 0.015 + Math.random() * 0.025,
          color: palette[Math.floor(Math.random() * palette.length)]
        });
      }
    };

    let time = 0;

    const render = () => {
      time += 0.02;
      idleTimer += 0.016;

      // Amortecimento suave na posição (lerp)
      currentProgress += (targetProgress - currentProgress) * 0.08;
      scrollVelocity *= 0.92;

      ctx.clearRect(0, 0, width, height);

      const headPos = getFilamentPosition(currentProgress, time);

      // Atualiza trail da extrusão
      trail.unshift({
        x: headPos.x,
        y: headPos.y,
        alpha: 1,
        width: 3.5 + Math.min(scrollVelocity * 0.2, 5)
      });

      if (trail.length > maxTrailNodes) {
        trail.pop();
      }

      // Desenha o filamento extrudado (trail luminoso em curvas Bézier)
      if (trail.length > 2) {
        ctx.save();
        for (let i = 0; i < trail.length - 1; i++) {
          const p1 = trail[i];
          const p2 = trail[i + 1];
          const tAlpha = (1 - i / trail.length);

          // Brilho externo neon (Magenta -> Violeta)
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = i % 2 === 0 
            ? `rgba(255, 51, 102, ${tAlpha * 0.45})` 
            : `rgba(138, 43, 226, ${tAlpha * 0.45})`;
          ctx.lineWidth = p1.width * 2.5;
          ctx.lineCap = "round";
          ctx.shadowBlur = 18;
          ctx.shadowColor = "#FF3366";
          ctx.stroke();

          // Núcleo brilhante fino
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(255, 230, 245, ${tAlpha * 0.85})`;
          ctx.lineWidth = p1.width * 0.7;
          ctx.shadowBlur = 6;
          ctx.shadowColor = "#FFF";
          ctx.stroke();
        }
        ctx.restore();
      }

      // Spawn de partículas quando rola ou em idle suave
      if (scrollVelocity > 0.5) {
        spawnSparks(headPos.x, headPos.y, Math.min(4, Math.ceil(scrollVelocity * 0.4)), scrollVelocity);
      } else if (Math.random() < 0.25) {
        spawnSparks(headPos.x, headPos.y, 1, 0.2);
      }

      // Desenha e atualiza as partículas de faísca
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.alpha, 0, Math.PI * 2);
        ctx.fillStyle = `${s.color}${s.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FF3366";
        ctx.fill();
      }

      // Bico Extrusor / Cabeça Luminosa 3D
      ctx.save();
      const pulse = 1 + Math.sin(time * 6) * 0.18;
      const headGlow = ctx.createRadialGradient(headPos.x, headPos.y, 0, headPos.x, headPos.y, 28 * pulse);
      headGlow.addColorStop(0, "rgba(255, 255, 255, 0.95)");
      headGlow.addColorStop(0.25, "rgba(255, 51, 102, 0.75)");
      headGlow.addColorStop(0.6, "rgba(138, 43, 226, 0.35)");
      headGlow.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.beginPath();
      ctx.arc(headPos.x, headPos.y, 28 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = headGlow;
      ctx.fill();

      // Centro brilhante
      ctx.beginPath();
      ctx.arc(headPos.x, headPos.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#FF3366";
      ctx.fill();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[8]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
