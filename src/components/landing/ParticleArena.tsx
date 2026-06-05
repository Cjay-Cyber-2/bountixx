"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  color: string; radius: number;
}

const COLORS = [
  "rgba(255,107,26,0.8)",
  "rgba(155,107,255,0.6)",
  "rgba(240,165,0,0.6)",
];

export function ParticleArena() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0, height = 0;
    let particles: Particle[] = [];
    let rafId: number;

    function resize() {
      width = canvas!.width  = canvas!.offsetWidth;
      height = canvas!.height = canvas!.offsetHeight;
    }

    function init() {
      resize();
      particles = Array.from({ length: 80 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        radius: Math.random() * 1.8 + 0.8,
      }));
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);

      /* Draw connection lines */
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx!.beginPath();
            ctx!.strokeStyle = `rgba(155,107,255,${(1 - dist / 100) * 0.18})`;
            ctx!.lineWidth = 0.5;
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.stroke();
          }
        }
      }

      /* Draw particles */
      particles.forEach((p) => {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx!.fillStyle = p.color;
        ctx!.fill();

        /* Gentle mouse-based parallax */
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        const dx = (mx - width / 2) / width;
        const dy = (my - height / 2) / height;
        p.x += p.vx + dx * 0.06;
        p.y += p.vy + dy * 0.06;

        /* Wrap edges */
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      });

      rafId = requestAnimationFrame(draw);
    }

    function onMouse(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }

    init();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouse);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
