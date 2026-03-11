import { useState, useEffect, useRef } from "react";

// Deep Ocean tokens
const C = {
  bgDeep: "#060d14", bgBody: "#0c1520", bgCard: "#111c2a", bgInset: "#0e1824", bgMuted: "#182838",
  pri: "#2ec4b6", priDim: "#1a9a8e", priLight: "#50dace",
  priBg: "rgba(46,196,182,.07)", priBorder: "rgba(46,196,182,.2)", priGlow: "rgba(46,196,182,.12)",
  ok: "#64b5cf", okDim: "#3a8eaa",
  warn: "#e0a850", warnDim: "#b88030",
  fail: "#d06060",
  muted: "#4a6070",
  t900: "#e0e8f0", t700: "#b0c0d0", t500: "#708090", t400: "#506070", t300: "#384858",
  tw90: "rgba(255,255,255,.88)", tw60: "rgba(255,255,255,.55)", tw40: "rgba(255,255,255,.35)",
  tw20: "rgba(255,255,255,.15)", tw10: "rgba(255,255,255,.08)",
  border: "#1e2e3e",
  mono: "'JetBrains Mono','SF Mono',monospace",
  sans: "'Inter',-apple-system,sans-serif",
};

// Icons
const Ic = {
  plane: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>,
  target: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  radar: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4"/></svg>,
  layers: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>,
  shield: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  zap: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  doc: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  gauge: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round"><path d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10z"/><path d="M12 6v6l4 2"/></svg>,
  check: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  arrow: (s, c) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
};

// Radar Canvas
const Radar = () => {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    const W = 440, H = 440; cv.width = W; cv.height = H;
    let a = 0;
    const blips = Array.from({ length: 9 }, () => ({ a: Math.random() * Math.PI * 2, r: 35 + Math.random() * 150, s: .5 + Math.random() * .5 }));
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      [55, 105, 155, 200].forEach(r => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.strokeStyle = "rgba(46,196,182,.06)"; ctx.lineWidth = 1; ctx.stroke(); });
      ctx.beginPath(); ctx.moveTo(cx, cy - 200); ctx.lineTo(cx, cy + 200); ctx.moveTo(cx - 200, cy); ctx.lineTo(cx + 200, cy); ctx.strokeStyle = "rgba(46,196,182,.04)"; ctx.lineWidth = 1; ctx.stroke();
      // Sweep
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 200, a - .5, a); ctx.closePath();
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 200); g.addColorStop(0, "rgba(46,196,182,.1)"); g.addColorStop(1, "rgba(46,196,182,.01)"); ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * 200, cy + Math.sin(a) * 200); ctx.strokeStyle = "rgba(46,196,182,.35)"; ctx.lineWidth = 1.5; ctx.stroke();
      // Blips
      blips.forEach(b => {
        let d = ((a - b.a) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        let o = d < 1 ? (1 - d) * b.s : 0;
        if (o > 0) {
          const bx = cx + Math.cos(b.a) * b.r, by = cy + Math.sin(b.a) * b.r;
          ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI * 2); ctx.fillStyle = `rgba(46,196,182,${o * .8})`; ctx.fill();
          ctx.beginPath(); ctx.arc(bx, by, 7, 0, Math.PI * 2); ctx.fillStyle = `rgba(46,196,182,${o * .15})`; ctx.fill();
        }
      });
      ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fillStyle = C.pri; ctx.fill();
      a += .012;
      requestAnimationFrame(draw);
    };
    const id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, []);
  return <canvas ref={ref} style={{ width: 440, height: 440, opacity: .6 }} />;
};

// Animate on scroll hook
const useReveal = () => {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); obs.disconnect(); } }, { threshold: .15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, vis];
};

const Reveal = ({ children, delay = 0, style = {} }) => {
  const [ref, vis] = useReveal();
  return <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(24px)", transition: `opacity .7s ease ${delay}s, transform .7s ease ${delay}s`, ...style }}>{children}</div>;
};

// Nav
const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => { const fn = () => setScrolled(window.scrollY > 30); window.addEventListener("scroll", fn); return () => window.removeEventListener("scroll", fn); }, []);
  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, transition: "all .3s",
      padding: "0 48px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
      background: scrolled ? "rgba(6,13,20,.92)" : "transparent",
      borderBottom: scrolled ? `1px solid ${C.tw10}` : "1px solid transparent",
      backdropFilter: scrolled ? "blur(16px)" : "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 28, height: 28, background: C.pri, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>{Ic.plane(13, C.bgDeep)}</div>
        <span style={{ fontFamily: C.mono, fontSize: 14, fontWeight: 700, color: C.tw90 }}>APPLY<span style={{ color: C.pri }}>PILOT</span></span>
      </div>
      <div style={{ display: "flex", gap: 32 }}>
        {["Features", "How It Works", "Pricing"].map(l => (
          <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: C.tw40, textDecoration: "none", transition: "color .2s" }}
            onMouseEnter={e => e.target.style.color = C.pri} onMouseLeave={e => e.target.style.color = C.tw40}>{l}</a>
        ))}
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <a href="#" style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 600, letterSpacing: ".06em", color: C.tw40, textDecoration: "none" }}>LOG IN</a>
        <button style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", padding: "9px 20px", background: C.pri, color: C.bgDeep, border: "none", borderRadius: 6, cursor: "pointer", transition: "all .2s" }}
          onMouseEnter={e => e.target.style.boxShadow = `0 0 24px ${C.priGlow}`} onMouseLeave={e => e.target.style.boxShadow = "none"}>
          Get Started
        </button>
      </div>
    </nav>
  );
};

// Hero
const Hero = () => (
  <section style={{ background: C.bgDeep, padding: "140px 48px 80px", position: "relative", overflow: "hidden", minHeight: "90vh", display: "flex", alignItems: "center" }}>
    {/* Grid */}
    <div style={{ position: "absolute", inset: 0, opacity: .25, background: `linear-gradient(rgba(46,196,182,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(46,196,182,.025) 1px, transparent 1px)`, backgroundSize: "60px 60px", pointerEvents: "none" }} />
    {/* Radial glow */}
    <div style={{ position: "absolute", top: "40%", right: "10%", width: 600, height: 600, background: `radial-gradient(circle, rgba(46,196,182,.06) 0%, transparent 60%)`, pointerEvents: "none", transform: "translate(0,-50%)" }} />
    {/* Radar */}
    <div style={{ position: "absolute", right: "4%", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><Radar /></div>

    <div style={{ position: "relative", zIndex: 1, maxWidth: 640 }}>
      <Reveal>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 16px", borderRadius: 4, background: C.tw10, border: `1px solid ${C.tw20}`, marginBottom: 28 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.pri, boxShadow: `0 0 8px ${C.pri}66` }} />
          <span style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 600, letterSpacing: ".1em", color: C.pri }}>NOW IN BETA — JOIN THE WAITLIST</span>
        </div>
      </Reveal>

      <Reveal delay={.1}>
        <h1 style={{ fontFamily: C.mono, fontSize: "clamp(36px, 5.5vw, 60px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-.03em", color: C.tw90, marginBottom: 20 }}>
          Your job applications.<br /><span style={{ color: C.pri, textShadow: `0 0 40px ${C.priGlow}` }}>Fully automated.</span>
        </h1>
      </Reveal>

      <Reveal delay={.2}>
        <p style={{ fontFamily: C.mono, fontSize: 13, lineHeight: 1.9, color: C.tw40, maxWidth: 500, marginBottom: 36 }}>
          ApplyPilot sends personalized, AI-crafted applications to hundreds of roles on your behalf — 24/7, while you sleep. Tailored resumes. Custom cover letters. Every ATS handled.
        </p>
      </Reveal>

      <Reveal delay={.3}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 56 }}>
          <button style={{
            display: "flex", alignItems: "center", gap: 9, fontFamily: C.mono, fontSize: 12, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase",
            padding: "15px 30px", background: C.pri, color: C.bgDeep, border: "none", borderRadius: 8, cursor: "pointer", transition: "all .25s",
          }} onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 30px ${C.priGlow}`; e.currentTarget.style.transform = "translateY(-2px)"; }}
             onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}>
            {Ic.plane(14, C.bgDeep)} Get Started Free
          </button>
          <button style={{
            display: "flex", alignItems: "center", gap: 8, fontFamily: C.mono, fontSize: 12, fontWeight: 600, letterSpacing: ".04em",
            padding: "15px 26px", background: "transparent", color: C.tw60, border: `1px solid ${C.tw20}`, borderRadius: 8, cursor: "pointer", transition: "all .2s",
          }}>See How It Works</button>
        </div>
      </Reveal>

      <Reveal delay={.4}>
        <div style={{ display: "flex", gap: 40 }}>
          {[{ v: "12,400+", l: "APPS SENT" }, { v: "94%", l: "ACCURACY" }, { v: "3.2×", l: "MORE INTERVIEWS" }, { v: "<45s", l: "PER APPLICATION" }].map(s => (
            <div key={s.l}>
              <div style={{ fontFamily: C.mono, fontSize: 22, fontWeight: 700, color: C.tw90, letterSpacing: "-.02em" }}>{s.v}</div>
              <div style={{ fontFamily: C.mono, fontSize: 8, fontWeight: 700, letterSpacing: ".14em", color: C.tw40, marginTop: 3 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </Reveal>
    </div>
  </section>
);

// Ticker
const Ticker = () => {
  const items = ["12,400+ APPLICATIONS SENT", "94% FORM ACCURACY", "3.2× MORE INTERVIEWS", "UNDER 45 SECONDS PER APPLICATION", "50+ ATS PLATFORMS SUPPORTED", "AI-TAILORED RESUMES FOR EVERY ROLE"];
  const d = [...items, ...items];
  return (
    <div style={{ overflow: "hidden", borderTop: `1px solid ${C.tw10}`, borderBottom: `1px solid ${C.tw10}`, background: C.bgDeep, padding: "12px 0" }}>
      <div style={{ display: "flex", gap: 56, animation: "ticker 28s linear infinite", width: "max-content" }}>
        {d.map((t, i) => (
          <span key={i} style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 600, letterSpacing: ".12em", color: C.tw40, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.pri, opacity: .5 }} />{t}
          </span>
        ))}
      </div>
    </div>
  );
};

// Social
const Social = () => (
  <section style={{ background: C.bgBody, padding: "44px 48px", textAlign: "center" }}>
    <p style={{ fontFamily: C.mono, fontSize: 9, fontWeight: 700, letterSpacing: ".16em", color: C.t400, marginBottom: 22 }}>USED BY JOB SEEKERS WHO'VE LANDED ROLES AT</p>
    <div style={{ display: "flex", justifyContent: "center", gap: 48, opacity: .25 }}>
      {["STRIPE", "VERCEL", "LINEAR", "ANTHROPIC", "FIGMA", "RAMP"].map(co => (
        <span key={co} style={{ fontFamily: C.mono, fontSize: 13, fontWeight: 700, letterSpacing: ".08em", color: C.t900 }}>{co}</span>
      ))}
    </div>
  </section>
);

// Features
const Features = () => {
  const items = [
    { icon: Ic.target, title: "SMART MATCHING", desc: "AI scores every job against your profile, skills, and experience. Only high-quality matches make the cut — no spray and pray.", accent: C.pri },
    { icon: Ic.layers, title: "EVERY ATS, HANDLED", desc: "Greenhouse, Lever, Ashby, Workday — we navigate 50+ applicant tracking systems so you never have to fight another form.", accent: C.ok },
    { icon: Ic.doc, title: "TAILORED MATERIALS", desc: "Every application gets a custom resume variant and cover letter, calibrated to the specific role's requirements and keywords.", accent: C.priLight },
    { icon: Ic.radar, title: "REAL-TIME TRACKING", desc: "See exactly where every application stands — from submitted to interview. A live dashboard for your entire job search.", accent: C.warn },
    { icon: Ic.shield, title: "UNDETECTABLE", desc: "Cloud browsers with human-like behavior, anti-fingerprinting, and CAPTCHA handling. Applications that look like you sent them yourself.", accent: C.fail },
    { icon: Ic.zap, title: "APPLY AT SCALE", desc: "Queue dozens of applications and let ApplyPilot work through them while you focus on prep, networking, or literally anything else.", accent: C.pri },
  ];
  return (
    <section id="features" style={{ background: C.bgBody, padding: "80px 48px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Reveal><div style={{ textAlign: "center", marginBottom: 56 }}>
          <span style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, letterSpacing: ".16em", color: C.priDim, display: "block", marginBottom: 10 }}>// FEATURES</span>
          <h2 style={{ fontFamily: C.mono, fontSize: 26, fontWeight: 700, letterSpacing: "-.02em", color: C.t900 }}>Everything you need to get hired faster</h2>
          <p style={{ fontFamily: C.mono, fontSize: 11, color: C.t400, marginTop: 10, lineHeight: 1.7, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>Powered by AI. Designed for humans.</p>
        </div></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {items.map((f, i) => (
            <Reveal key={i} delay={i * .08}>
              <div style={{
                background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: "28px 24px",
                transition: "all .25s", cursor: "default", position: "relative", overflow: "hidden", height: "100%",
              }} onMouseEnter={e => { e.currentTarget.style.borderColor = f.accent; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 12px 32px rgba(0,0,0,.2)`; }}
                 onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: f.accent, opacity: .5 }} />
                <div style={{ width: 36, height: 36, borderRadius: 8, background: C.bgDeep, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, border: `1px solid ${C.tw20}` }}>
                  {f.icon(16, f.accent)}
                </div>
                <h3 style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: C.t900, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontFamily: C.mono, fontSize: 11, color: C.t500, lineHeight: 1.7 }}>{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// How It Works
const HowItWorks = () => {
  const steps = [
    { n: "01", title: "UPLOAD YOUR RESUME", desc: "Drop your PDF. Our AI reads it and builds your profile automatically — experience, skills, everything.", icon: Ic.doc },
    { n: "02", title: "SET YOUR CRITERIA", desc: "Tell us what you want: job titles, locations, salary range, companies to avoid. Pick your comfort level — review each app or go fully automatic.", icon: Ic.gauge },
    { n: "03", title: "HIT LAUNCH", desc: "ApplyPilot finds matching roles, tailors your resume for each one, fills out the application, and submits. All while you do something better with your time.", icon: Ic.plane },
    { n: "04", title: "LAND INTERVIEWS", desc: "Track every application in real-time. Review AI-generated answers before they send. Watch your response rate climb.", icon: Ic.target },
  ];
  return (
    <section id="how-it-works" style={{ background: C.bgDeep, padding: "80px 48px", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, opacity: .12, background: `linear-gradient(rgba(46,196,182,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(46,196,182,.03) 1px, transparent 1px)`, backgroundSize: "40px 40px", pointerEvents: "none" }} />
      <div style={{ maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <Reveal><div style={{ textAlign: "center", marginBottom: 56 }}>
          <span style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, letterSpacing: ".16em", color: C.pri, display: "block", marginBottom: 10 }}>// HOW IT WORKS</span>
          <h2 style={{ fontFamily: C.mono, fontSize: 26, fontWeight: 700, letterSpacing: "-.02em", color: C.tw90 }}>From resume to interview in four steps</h2>
        </div></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {steps.map((s, i) => (
            <Reveal key={i} delay={i * .1}>
              <div style={{ textAlign: "center", padding: "28px 16px", borderRadius: 12, border: `1px solid ${C.tw10}`, background: C.tw10, height: "100%" }}>
                <div style={{ fontFamily: C.mono, fontSize: 28, fontWeight: 700, color: C.tw20, marginBottom: 14 }}>{s.n}</div>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: C.priBg, border: `1px solid ${C.priBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  {s.icon(18, C.pri)}
                </div>
                <h3 style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, letterSpacing: ".08em", color: C.tw90, marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontFamily: C.mono, fontSize: 10, color: C.tw40, lineHeight: 1.8 }}>{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// Pricing
const Pricing = () => {
  const plans = [
    { name: "STARTER", price: "Free", desc: "Try it out. No credit card.", features: ["5 applications / month", "Basic resume tailoring", "3 ATS platforms", "Application tracking"], cta: "Start Free", featured: false },
    { name: "PRO", price: "$49", desc: "For active job seekers.", features: ["100 applications / month", "AI resume + cover letters", "All 50+ ATS platforms", "Priority processing", "Analytics dashboard"], cta: "Get Started", featured: true },
    { name: "UNLIMITED", price: "$99", desc: "No limits. No compromises.", features: ["Unlimited applications", "Everything in Pro", "Dedicated infrastructure", "Priority support", "Early access to new features"], cta: "Go Unlimited", featured: false },
  ];
  return (
    <section id="pricing" style={{ background: C.bgBody, padding: "80px 48px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Reveal><div style={{ textAlign: "center", marginBottom: 56 }}>
          <span style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, letterSpacing: ".16em", color: C.priDim, display: "block", marginBottom: 10 }}>// PRICING</span>
          <h2 style={{ fontFamily: C.mono, fontSize: 26, fontWeight: 700, letterSpacing: "-.02em", color: C.t900 }}>Simple pricing. Cancel anytime.</h2>
        </div></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {plans.map((p, i) => (
            <Reveal key={i} delay={i * .1}>
              <div style={{
                background: C.bgCard, borderRadius: 12, padding: "32px 24px", position: "relative", height: "100%",
                display: "flex", flexDirection: "column",
                border: p.featured ? `2px solid ${C.pri}` : `1px solid ${C.border}`,
                boxShadow: p.featured ? `0 0 40px ${C.priGlow}` : "none",
              }}>
                {p.featured && <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", fontFamily: C.mono, fontSize: 9, fontWeight: 700, letterSpacing: ".12em", background: C.pri, color: C.bgDeep, padding: "3px 14px", borderRadius: 4 }}>RECOMMENDED</div>}
                <div style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, letterSpacing: ".12em", color: C.priDim, marginBottom: 8 }}>{p.name}</div>
                <div style={{ fontFamily: C.mono, fontSize: 34, fontWeight: 700, color: C.t900, marginBottom: 4 }}>
                  {p.price} {p.price !== "Free" && <span style={{ fontSize: 13, color: C.t400, fontWeight: 400 }}>/mo</span>}
                </div>
                <div style={{ fontFamily: C.mono, fontSize: 11, color: C.t400, marginBottom: 24 }}>{p.desc}</div>
                <div style={{ flex: 1, marginBottom: 24 }}>
                  {p.features.map((f, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${C.border}` }}>
                      {Ic.check(11, C.priDim)}
                      <span style={{ fontFamily: C.mono, fontSize: 11, color: C.t700 }}>{f}</span>
                    </div>
                  ))}
                </div>
                <button style={{
                  width: "100%", padding: "13px", borderRadius: 6, fontFamily: C.mono, fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", cursor: "pointer", transition: "all .2s",
                  background: p.featured ? C.pri : "transparent", color: p.featured ? C.bgDeep : C.t500, border: p.featured ? "none" : `1px solid ${C.border}`,
                }}>{p.cta}</button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

// CTA
const CTA = () => (
  <section style={{ background: C.bgDeep, padding: "80px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 50% 40% at 50% 50%, rgba(46,196,182,.06) 0%, transparent 70%)`, pointerEvents: "none" }} />
    <Reveal>
      <div style={{ position: "relative", zIndex: 1 }}>
        <h2 style={{ fontFamily: C.mono, fontSize: 30, fontWeight: 700, color: C.tw90, letterSpacing: "-.02em", marginBottom: 12 }}>The job search is broken.<br />We're fixing it.</h2>
        <p style={{ fontFamily: C.mono, fontSize: 12, color: C.tw40, marginBottom: 36, lineHeight: 1.8, maxWidth: 460, marginLeft: "auto", marginRight: "auto" }}>Stop spending hours filling out the same forms. Let AI handle the busywork while you focus on what actually matters — preparing for interviews.</p>
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 10, fontFamily: C.mono, fontSize: 13, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase",
          padding: "16px 36px", background: C.pri, color: C.bgDeep, border: "none", borderRadius: 8, cursor: "pointer", transition: "all .25s",
        }} onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 40px ${C.priGlow}`; e.currentTarget.style.transform = "translateY(-2px)"; }}
           onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}>
          Get Started Free {Ic.arrow(14, C.bgDeep)}
        </button>
      </div>
    </Reveal>
  </section>
);

// Footer
const Footer = () => (
  <footer style={{ background: C.bgDeep, borderTop: `1px solid ${C.tw10}`, padding: "32px 48px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 22, height: 22, background: C.pri, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>{Ic.plane(10, C.bgDeep)}</div>
        <span style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: C.tw40 }}>APPLYPILOT</span>
        <span style={{ fontFamily: C.mono, fontSize: 10, color: C.tw20 }}>/ Toronto, Canada / © 2026</span>
      </div>
      <div style={{ display: "flex", gap: 28 }}>
        {["Privacy", "Terms", "Status", "Docs", "Twitter"].map(l => (
          <a key={l} href="#" style={{ fontFamily: C.mono, fontSize: 10, color: C.tw20, textDecoration: "none", letterSpacing: ".06em", transition: "color .2s" }}
            onMouseEnter={e => e.target.style.color = C.pri} onMouseLeave={e => e.target.style.color = C.tw20}>{l}</a>
        ))}
      </div>
    </div>
  </footer>
);

// App
export default function App() {
  return (
    <div style={{ fontFamily: C.sans, background: C.bgDeep }}>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        @keyframes ticker { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        html { scroll-behavior: smooth; }
        body { overflow-x: hidden; }
        ::selection { background: rgba(46,196,182,.25); color: white; }
      `}</style>
      <Nav />
      <Hero />
      <Ticker />
      <Social />
      <Features />
      <HowItWorks />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}
