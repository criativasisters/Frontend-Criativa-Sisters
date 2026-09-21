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

interface PathNode {
  x: number;
  y: number;
}

export function ScrollSnake() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const sparks: Spark[] = [];
    const maxSparks = 80;

    let targetScrollY = window.scrollY;
    let currentScrollY = window.scrollY;
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let time = 0;

    const buildPath = (): PathNode[] => {
      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        window.innerHeight * 4
      );

      // Amplitude entrelaçando a tela inteira (ZigZag suave)
      const leftBound = width * 0.15;
      const rightBound = width * 0.85;
      const center = width * 0.5;

      const waypoints: PathNode[] = [];
      const step = 600; // Curvas mais abertas e orgânicas
      let y = 0;
      let side = 0; // 0 = centro, 1 = direita, 2 = esquerda

      // Início no centro (topo)
      waypoints.push({ x: center, y: -100 });

      while (y < docHeight + 400) {
        let xPos = center;
        // Alternar direção de forma orgânica
        if (side === 1) xPos = rightBound + (Math.random() * 50 - 25);
        else if (side === 2) xPos = leftBound + (Math.random() * 50 - 25);
        else xPos = center + (Math.random() * 200 - 100);

        waypoints.push({ x: xPos, y: y });
        y += step;
        
        // Regra do zigzag orgânico: centro -> direita -> esquerda -> direita -> centro
        side = side === 0 ? (Math.random() > 0.5 ? 1 : 2) : (side === 1 ? 2 : 1);
        if (Math.random() > 0.7) side = 0; // chance de voltar pro centro
      }

      // Catmull-Rom para curva super suave
      const densePath: PathNode[] = [];
      const samplesPerSegment = 40;

      for (let i = 0; i < waypoints.length - 1; i++) {
        const p0 = waypoints[Math.max(0, i - 1)];
        const p1 = waypoints[i];
        const p2 = waypoints[i + 1];
        const p3 = waypoints[Math.min(waypoints.length - 1, i + 2)];

        for (let t = 0; t < samplesPerSegment; t++) {
          const u = t / samplesPerSegment;
          const u2 = u * u;
          const u3 = u2 * u;

          const x = 0.5 * (2 * p1.x + (-p0.x + p2.x) * u + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3);
          const y = 0.5 * (2 * p1.y + (-p0.y + p2.y) * u + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3);

          densePath.push({ x, y });
        }
      }
      densePath.push(waypoints[waypoints.length - 1]);
      return densePath;
    };

    let densePath = buildPath();

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      densePath = buildPath();
    };

    const handleScroll = () => {
      targetScrollY = window.scrollY;
      scrollVelocity = Math.abs(window.scrollY - lastScrollY);
      lastScrollY = window.scrollY;
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    const spawnSparks = (x: number, y: number, count: number) => {
      const palette = ["rgba(255, 51, 102, ", "rgba(138, 43, 226, ", "rgba(255, 255, 255, "];
      for (let i = 0; i < count; i++) {
        if (sparks.length >= maxSparks) break;
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 2;
        sparks.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.5,
          size: 1.5 + Math.random() * 2,
          alpha: 0.6,
          decay: 0.02 + Math.random() * 0.02,
          color: palette[Math.floor(Math.random() * palette.length)]
        });
      }
    };

    const render = () => {
      time += 0.015;
      currentScrollY += (targetScrollY - currentScrollY) * 0.12;
      scrollVelocity *= 0.9;

      // Controle de Opacidade Global (Esconde na primeira sessão)
      // Fade in de Y=300 até Y=800
      let globalOpacity = (currentScrollY - 20) / 100;
      globalOpacity = Math.max(0, Math.min(1, globalOpacity));

      ctx.clearRect(0, 0, width, height);

      // Se estiver no topo (Hero section), não desenha para economizar CPU
      if (globalOpacity <= 0.01) {
        animId = requestAnimationFrame(render);
        return;
      }

      const docHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, window.innerHeight);
      const maxScroll = Math.max(1, docHeight - window.innerHeight);
      const scrollProgress = Math.max(0, Math.min(1, currentScrollY / maxScroll));
      let headIndex = Math.floor(scrollProgress * (densePath.length - 1));
      headIndex = Math.max(1, headIndex);

      if (headIndex > 1) {
        ctx.save();
        ctx.globalAlpha = globalOpacity;

        // Trilha Base Subjacente (Rastro Fantasma)
        ctx.beginPath();
        for (let i = 0; i < densePath.length; i += 5) {
          const pt = densePath[i];
          const sY = pt.y - currentScrollY;
          if (sY < -100 || sY > height + 100) continue;
          if (i === 0) ctx.moveTo(pt.x, sY);
          else ctx.lineTo(pt.x, sY);
        }
        ctx.strokeStyle = "rgba(255,255,255,0.02)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // 1. Camada de Brilho Neon Fluído (Rastro por onde já passou)
        for (let i = 0; i < headIndex - 1; i += 3) {
          const pt1 = densePath[i];
          const pt2 = densePath[Math.min(i + 3, headIndex)];

          const sY1 = pt1.y - currentScrollY;
          const sY2 = pt2.y - currentScrollY;

          if (sY1 < -200 && sY2 < -200) continue;
          if (sY1 > height + 200 && sY2 > height + 200) continue;

          // Movimento respiratório orgânico mais amplo
          const sway1 = Math.sin(time * 0.5 + i * 0.02) * 8;
          const sway2 = Math.sin(time * 0.5 + (i + 3) * 0.02) * 8;

          // Gradiente muda ao longo da linha
          const prog = i / headIndex;
          const colorGrad = (i / 10) % 2 === 0 ? "#FF3366" : "#8A2BE2";

          ctx.beginPath();
          ctx.moveTo(pt1.x + sway1, sY1);
          ctx.lineTo(pt2.x + sway2, sY2);
          ctx.strokeStyle = colorGrad;
          ctx.lineWidth = 5 + Math.sin(time + i * 0.05) * 2;
          ctx.lineCap = "round";
          ctx.shadowBlur = 15;
          ctx.shadowColor = colorGrad;
          ctx.globalAlpha = (0.1 + prog * 0.3) * globalOpacity; 
          ctx.stroke();
        }

        // 2. Núcleo Incandescente
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FFFFFF";
        ctx.globalAlpha = 0.4 * globalOpacity;
        ctx.lineWidth = 2;
        ctx.beginPath();
        let started = false;
        for (let i = Math.max(0, headIndex - 200); i <= headIndex; i += 2) {
          const pt = densePath[i];
          const sY = pt.y - currentScrollY;
          if (sY < -200 || sY > height + 200) {
            started = false;
            continue;
          }
          const sway = Math.sin(time * 0.5 + i * 0.02) * 8;
          if (!started) {
            ctx.moveTo(pt.x + sway, sY);
            started = true;
          } else {
            ctx.lineTo(pt.x + sway, sY);
          }
        }
        ctx.strokeStyle = "#FFF2F6";
        ctx.stroke();
        ctx.restore();
      }

      // O Cometa Luminoso de Fundo (A Cabeça)
      const headPt = densePath[headIndex];
      const headScreenY = headPt.y - currentScrollY;
      const headSway = Math.sin(time * 0.5 + headIndex * 0.02) * 8;
      const headScreenX = headPt.x + headSway;

      if (headScreenY >= -100 && headScreenY <= height + 100) {
        ctx.save();
        ctx.globalAlpha = globalOpacity;
        const pulse = 1 + Math.sin(time * 3) * 0.15;

        // Halo de textura ampla e suave no fundo
        const grad = ctx.createRadialGradient(
          headScreenX, headScreenY, 0,
          headScreenX, headScreenY, 150 * pulse
        );
        grad.addColorStop(0, "rgba(255, 255, 255, 0.4)");
        grad.addColorStop(0.15, "rgba(255, 51, 102, 0.3)");
        grad.addColorStop(0.5, "rgba(138, 43, 226, 0.1)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.beginPath();
        ctx.arc(headScreenX, headScreenY, 150 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Ponto quente interno
        ctx.beginPath();
        ctx.arc(headScreenX, headScreenY, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#FF3366";
        ctx.fill();
        ctx.restore();
        
        // Spawn de faíscas que caem com textura
        if (scrollVelocity > 1) {
          spawnSparks(headScreenX, headScreenY, Math.min(4, Math.ceil(scrollVelocity * 0.15)));
        } else if (Math.random() < 0.1) {
          spawnSparks(headScreenX, headScreenY, 1);
        }
      }

      // FAÍSCAS (Sparks) - Efeito de Textura Particulada
      ctx.save();
      ctx.globalAlpha = globalOpacity;
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
        ctx.fillStyle = `${s.color}${s.alpha * 0.7})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "rgba(138, 43, 226, 0.4)";
        ctx.fill();
      }
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
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ mixBlendMode: "screen", opacity: 0.55 }}
    />
  );
}
