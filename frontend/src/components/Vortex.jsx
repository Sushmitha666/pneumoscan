import { useEffect, useRef } from "react";

// Smooth pseudo-noise (no external library needed)
function noise(x, y, z) {
  return (
    Math.sin(x * 1.7 + z) * Math.cos(y * 1.3 - z) +
    Math.sin((x + y) * 0.9 + z * 1.3) * 0.6 +
    Math.cos(x * 2.3 - y * 1.1 + z * 0.7) * 0.4
  ) / 2;
}

export default function Vortex({
  children,
  className = "",
  particleCount = 520,
  rangeY = 140,
  baseHue = 180,
  baseSpeed = 0.4,
  rangeSpeed = 1.4,
  baseRadius = 1,
  rangeRadius = 2,
  backgroundColor = "#020617",
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const TAU = Math.PI * 2;
    const rand = (n) => Math.random() * n;
    let W = 0, H = 0, tick = 0, raf;
    const particles = [];

    const resize = () => {
      const r = canvas.parentElement.getBoundingClientRect();
      const d = window.devicePixelRatio || 1;
      W = r.width; H = r.height;
      canvas.width = W * d; canvas.height = H * d;
      ctx.setTransform(d, 0, 0, d, 0, 0);
    };

    const spawn = (p) => {
      p.x = rand(W);
      p.y = H / 2 + (rand(rangeY * 2) - rangeY);
      p.vx = 0; p.vy = 0; p.life = 0;
      p.ttl = 200 + rand(200);
      p.speed = baseSpeed + rand(rangeSpeed);
      p.radius = baseRadius + rand(rangeRadius);
      p.hue = baseHue + rand(70) - 35;
    };

    const fade = (life, ttl) => {
      const half = ttl / 2;
      return Math.abs(((life + half) % ttl) - half) / half;
    };

    resize();
    for (let i = 0; i < particleCount; i++) {
      const p = {}; spawn(p); p.life = rand(p.ttl); particles.push(p);
    }

    const frame = () => {
      tick++;
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, W, H);

      for (const p of particles) {
        const n = noise(p.x * 0.0025, p.y * 0.0025, tick * 0.0012) * 3 * TAU;
        const nx = p.x + p.vx * p.speed * 2;
        const ny = p.y + p.vy * p.speed * 2;
        p.vx += (Math.cos(n) - p.vx) * 0.5;
        p.vy += (Math.sin(n) - p.vy) * 0.5;

        ctx.save();
        ctx.lineCap = "round";
        ctx.lineWidth = p.radius;
        ctx.strokeStyle = `hsla(${p.hue},100%,60%,${fade(p.life, p.ttl)})`;
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(nx, ny); ctx.stroke();
        ctx.restore();

        p.x = nx; p.y = ny; p.life++;
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H || p.life > p.ttl) spawn(p);
      }

      // glow pass
      ctx.save();
      ctx.filter = "blur(6px) brightness(170%)";
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(canvas, 0, 0, W, H);
      ctx.restore();

      raf = requestAnimationFrame(frame);
    };
    frame();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [particleCount, rangeY, baseHue, baseSpeed, rangeSpeed, baseRadius, rangeRadius, backgroundColor]);

  return (
    <div className="vortex">
      <canvas ref={canvasRef} />
      <div className={`vortex-content ${className}`}>{children}</div>
    </div>
  );
}
