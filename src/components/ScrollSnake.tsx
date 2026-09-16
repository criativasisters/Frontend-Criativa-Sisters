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

    // Gera o traçado em ziguezague no documento
    // O traçado fica estritamente nas margens laterais e cruza apenas nos intervalos das seções
    const buildPath = (): PathNode[] => {
      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        window.innerHeight * 4
      );

      // Margens seguras: longe do centro onde ficam os textos e cards
      const margin = Math.min(100, Math.max(30, width * 0.05));
      const leftX = margin;
      const rightX = width - margin;

      // Waypoints de ziguezague descendo pelo documento a cada ~350px
      const waypoints: PathNode[] = [];
      const step = 380;
      let y = 140;
      let isRight = false;

      waypoints.push({ x: width * 0.5, y: 40 }); // Início no topo

      while (y < docHeight) {
        waypoints.push({
          x: isRight ? rightX : leftX,
          y: y
        });
        y += step;
        isRight = !isRight;
      }
      waypoints.push({ x: width * 0.5, y: docHeight - 50 }); // Fim no rodapé

      // Interpolação de curva suave (Catmull-Rom / Bézier) gerando centenas de nós densos
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

          // Spline Catmull-Rom
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

    const spawnSparks = (x: number, y: number, count: number) => {
      const palette = [
        "rgba(255, 51, 102, ",  // Magenta Shock
        "rgba(138, 43, 226, ", // Violeta Cósmico
        "rgba(224, 130, 157, ", // Rosa Metálico
        "rgba(255, 255, 255, "  // Luz Branca
      ];

      for (let i = 0; i < count; i++) {
        if (sparks.length >= maxSparks) break;
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.8 + Math.random() * 2.5;
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.6,
          size: 1.2 + Math.random() * 2.4,
          alpha: 0.9,
          decay: 0.02 + Math.random() * 0.03,
          color: palette[Math.floor(Math.random() * palette.length)]
        });
      }
    };

    const render = () => {
      time += 0.025;

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

      // Posição alvo do bico extrusor no documento:
      // Fica visível na altura do viewport (cerca de 55% da altura da tela)
      const targetDocY = Math.min(
        docHeight - 60,
        Math.max(60, currentScrollY + window.innerHeight * 0.55)
      );

      // Encontra o índice no caminho correspondente a essa profundidade Y
      let headIndex = 0;
      for (let i = 0; i < densePath.length; i++) {
        if (densePath[i].y <= targetDocY) {
          headIndex = i;
        } else {
          break;
        }
      }

      // Se estamos no início absoluto, pelo menos 1 ponto
      headIndex = Math.max(1, headIndex);

      // DESENHA O FILAMENTO EXTRUDADO (De 0 até headIndex)
      // Conforme o scroll sobe ou desce, a linha é desenhada ou desfeita em tempo real!
      if (headIndex > 1) {
        ctx.save();

        // 1. Camada de Brilho Neon Externo (Magenta e Violeta)
        for (let i = 0; i < headIndex - 1; i += 2) {
          const pt1 = densePath[i];
          const pt2 = densePath[Math.min(i + 2, headIndex)];

          // Converte coordenada do documento para coordenada da tela (viewport)
          const sY1 = pt1.y - currentScrollY;
          const sY2 = pt2.y - currentScrollY;

          // Culling: só renderiza se estiver próximo do viewport
          if (sY1 < -100 && sY2 < -100) continue;
          if (sY1 > height + 100 && sY2 > height + 100) continue;

          // Leve balanço orgânico para parecer viva
          const sway1 = Math.sin(time * 2 + i * 0.08) * 3;
          const sway2 = Math.sin(time * 2 + (i + 2) * 0.08) * 3;

          const prog = i / headIndex;
          const colorGrad = (i / 4) % 2 === 0 ? "#FF3366" : "#8A2BE2";

          ctx.beginPath();
          ctx.moveTo(pt1.x + sway1, sY1);
          ctx.lineTo(pt2.x + sway2, sY2);
          ctx.strokeStyle = colorGrad;
          ctx.lineWidth = 4.5;
          ctx.lineCap = "round";
          ctx.shadowBlur = 16;
          ctx.shadowColor = colorGrad;
          ctx.globalAlpha = 0.55 + prog * 0.35; // Mais brilhante na ponta
          ctx.stroke();
        }

        // 2. Camada do Núcleo Incandescente (Fio de Luz Branca/Rosa)
        ctx.shadowBlur = 4;
        ctx.shadowColor = "#FFFFFF";
        ctx.globalAlpha = 0.85;
        ctx.lineWidth = 1.6;
        ctx.beginPath();

        let started = false;
        for (let i = 0; i <= headIndex; i += 2) {
          const pt = densePath[i];
          const sY = pt.y - currentScrollY;

          if (sY < -120 || sY > height + 120) {
            started = false;
            continue;
          }

          const sway = Math.sin(time * 2 + i * 0.08) * 3;

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

      // POSIÇÃO DA CABEÇA / BICO EXTRUSOR
      const headPt = densePath[headIndex];
      const headScreenY = headPt.y - currentScrollY;
      const headSway = Math.sin(time * 2 + headIndex * 0.08) * 3;
      const headScreenX = headPt.x + headSway;

      // Se a cabeça estiver na tela, desenha o bico luminoso e gera faíscas
      if (headScreenY >= -50 && headScreenY <= height + 50) {
        ctx.save();
        const pulse = 1 + Math.sin(time * 5) * 0.2;

        // Aura radial intensa
        const grad = ctx.createRadialGradient(
          headScreenX,
          headScreenY,
          0,
          headScreenX,
          headScreenY,
          32 * pulse
        );
        grad.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        grad.addColorStop(0.25, "rgba(255, 51, 102, 0.8)");
        grad.addColorStop(0.6, "rgba(138, 43, 226, 0.35)");
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.beginPath();
        ctx.arc(headScreenX, headScreenY, 32 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Ponto central branco
        ctx.beginPath();
        ctx.arc(headScreenX, headScreenY, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowBlur = 18;
        ctx.shadowColor = "#FF3366";
        ctx.fill();
        ctx.restore();

        // Geração de faíscas quando em movimento ou idle
        if (scrollVelocity > 1) {
          spawnSparks(headScreenX, headScreenY, Math.min(4, Math.ceil(scrollVelocity * 0.3)));
        } else if (Math.random() < 0.2) {
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
        ctx.fillStyle = `${s.color}${s.alpha})`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#FF3366";
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
      className="fixed inset-0 w-full h-full pointer-events-none z-[4]"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
