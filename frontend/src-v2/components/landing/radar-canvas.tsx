import { useEffect, useRef } from "react";

const W = 440;
const H = 440;
const PRI = "46,196,182";

export function RadarCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    cv.width = W;
    cv.height = H;

    let angle = 0;
    let animId: number;

    const blips = Array.from({ length: 9 }, () => ({
      a: Math.random() * Math.PI * 2,
      r: 35 + Math.random() * 150,
      s: 0.5 + Math.random() * 0.5,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H / 2;

      // Concentric rings
      for (const r of [55, 105, 155, 200]) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${PRI},.06)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Cross-hairs
      ctx.beginPath();
      ctx.moveTo(cx, cy - 200);
      ctx.lineTo(cx, cy + 200);
      ctx.moveTo(cx - 200, cy);
      ctx.lineTo(cx + 200, cy);
      ctx.strokeStyle = `rgba(${PRI},.04)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Sweep arc
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, 200, angle - 0.5, angle);
      ctx.closePath();
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200);
      g.addColorStop(0, `rgba(${PRI},.1)`);
      g.addColorStop(1, `rgba(${PRI},.01)`);
      ctx.fillStyle = g;
      ctx.fill();

      // Sweep line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * 200, cy + Math.sin(angle) * 200);
      ctx.strokeStyle = `rgba(${PRI},.35)`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Blips
      for (const b of blips) {
        let d = ((angle - b.a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        let o = d < 1 ? (1 - d) * b.s : 0;
        if (o > 0) {
          const bx = cx + Math.cos(b.a) * b.r;
          const by = cy + Math.sin(b.a) * b.r;
          ctx.beginPath();
          ctx.arc(bx, by, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${PRI},${o * 0.8})`;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(bx, by, 7, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${PRI},${o * 0.15})`;
          ctx.fill();
        }
      }

      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#2ec4b6";
      ctx.fill();

      angle += 0.012;
      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={ref} className="opacity-60" style={{ width: W, height: H }} />;
}
