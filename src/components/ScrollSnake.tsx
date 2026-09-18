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
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const sparks: Spark[] = [];
    const maxSparks = 60;

    // Rastreamento suave de scroll
    let targetScrollY = window.scrollY;
    let currentScrollY = window.scrollY;
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let time = 0;

    // Gera o traçado orgânico (curvas)
    // Uma ondulação MUITO suave na margem direita
    const buildPath = (): PathNode[] => {
      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        window.innerHeight * 4
      );

      // Margens na direita - Amplitude bem menor para ser sutil
      const rightOuter = width - Math.min(50, width * 0.05);
      const rightInner = width - Math.min(100, width * 0.10);

      // Waypoints descendo a cada 400px (curvas bem longas)
      const waypoints: PathNode[] = [];
      const step = 450;
      let y = 140;
      let isOuter = false;

      // Início no topo direito
      waypoints.push({ x: rightOuter, y: -50 });

      while (y < docHeight + 200) {
        waypoints.push({
          x: isOuter ? rightOuter : rightInner,
          y: y
        });
        y += step;
        isOuter = !isOuter;
      }

      // Interpolação de curva suave (Catmull-Rom)
      const densePath: PathNode[] = [];
      const samplesPerSegment = 24;

      for (let i = 0; i < waypoints.length - 1; i++) {
        const p0 = waypoints[Math.max(0, i - 1)];
        const p1 = waypoints[i];
        const p2 = waypoints[i + 1];
        const p3 = waypoints[Math.min(waypoints.length - 1, i + 2)];

        for (let t = 0; t < samplesPerSegment; t++) {
          const u = t / samplesPerSegment;
          const u2 = u * u;
          const u3 = u2 * u;

          const x =
            0.5 *
            (2 * p1.x +
              (-p0.x + p2.x) * u +
              (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 +
              (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3);

          const y =
            0.5 *
            (2 * p1.y +
              (-p0.y + p2.y) * u +
              (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 +
              (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3);

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

    // Trazendo de volta as faíscas de forma mais sutil
    const spawnSparks = (x: number, y: number, count: number) => {
      const palette = ["rgba(255, 51, 102, ", "rgba(138, 43, 226, ", "rgba(255, 255, 255, "];
      for (let i = 0; i < count; i++) {
        if (sparks.length >= maxSparks) break;
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.5;
        sparks.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.4,
          size: 1 + Math.random() * 1.5,
          alpha: 0.7,
          decay: 0.03 + Math.random() * 0.02,
          color: palette[Math.floor(Math.random() * palette.length)]
        });
      }
    };

    const render = () => {
      time += 0.015; // Velocidade do tempo (respiração) muito mais lenta

      // Suavização do scroll com lerp
      currentScrollY += (targetScrollY - currentScrollY) * 0.12;
      scrollVelocity *= 0.9;

      ctx.clearRect(0, 0, width, height);

      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        window.innerHeight
      );
      
      const maxScroll = Math.max(1, docHeight - window.innerHeight);
      const scrollProgress = Math.max(0, Math.min(1, currentScrollY / maxScroll));
      let headIndex = Math.floor(scrollProgress * (densePath.length - 1));
      headIndex = Math.max(1, headIndex);

      if (headIndex > 1) {
        ctx.save();

        // 1. Camada de Brilho Neon
        for (let i = 0; i < headIndex - 1; i += 2) {
          const pt1 = densePath[i];
          const pt2 = densePath[Math.min(i + 2, headIndex)];

          const sY1 = pt1.y - currentScrollY;
          const sY2 = pt2.y - currentScrollY;

          if (sY1 < -100 && sY2 < -100) continue;
          if (sY1 > height + 100 && sY2 > height + 100) continue;

          // Balanço (sway) MUITO sutil e orgânico (movimenta só 1 pixel)
          const sway1 = Math.sin(time + i * 0.05) * 1;
          const sway2 = Math.sin(time + (i + 2) * 0.05) * 1;

          const prog = i / headIndex;
          const colorGrad = (i / 4) % 2 === 0 ? "#FF3366" : "#8A2BE2";

          ctx.beginPath();
          ctx.moveTo(pt1.x + sway1, sY1);
          ctx.lineTo(pt2.x + sway2, sY2);
          ctx.strokeStyle = colorGrad;
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
          ctx.shadowBlur = 12;
          ctx.shadowColor = colorGrad;
          ctx.globalAlpha = 0.2 + prog * 0.15; 
          ctx.stroke();
        }

        // 2. Núcleo Incandescente
        ctx.shadowBlur = 4;
        ctx.shadowColor = "#FFFFFF";
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i <= headIndex; i += 2) {
          const pt = densePath[i];
          const sY = pt.y - currentScrollY;
          if (sY < -120 || sY > height + 120) {
            started = false;
            continue;
          }
          const sway = Math.sin(time + i * 0.05) * 1;
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

      // O Cometa Luminoso de Fundo
      const headPt = densePath[headIndex];
      const headScreenY = headPt.y - currentScrollY;
      const headSway = Math.sin(time + headIndex * 0.05) * 1;
      const headScreenX = headPt.x + headSway;

      if (headScreenY >= -50 && headScreenY <= height + 50) {
        ctx.save();
        const pulse = 1 + Math.sin(time * 2) * 0.1; // Pulsação mais suave

        const grad = ctx.createRadialGradient(
          headScreenX, headScreenY, 0,
          headScreenX, headScreenY, 70 * pulse
        );
        grad.addColorStop(0, "rgba(255, 255, 255, 0.7)");
        grad.addColorStop(0.1, "rgba(255, 51, 102, 0.5)");
        grad.addColorStop(0.4, "rgba(138, 43, 226, 0.2)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.beginPath();
        ctx.arc(headScreenX, headScreenY, 70 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(headScreenX, headScreenY, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#FF3366";
        ctx.fill();
        ctx.restore();
        
        // Spawn de faíscas minimalistas
        if (scrollVelocity > 1) {
          spawnSparks(headScreenX, headScreenY, Math.min(2, Math.ceil(scrollVelocity * 0.1)));
        } else if (Math.random() < 0.05) {
          spawnSparks(headScreenX, headScreenY, 1);
        }
      }

      // ATUALIZA E DESENHA AS FAÍSCAS (Sparks)
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
        ctx.fillStyle = `${s.color}${s.alpha * 0.6})`;
        ctx.shadowBlur = 4;
        ctx.shadowColor = "rgba(255, 51, 102, 0.5)";
        ctx.fill();
      }

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
      style={{ mixBlendMode: "screen", opacity: 0.6 }}
    />
  );
}
