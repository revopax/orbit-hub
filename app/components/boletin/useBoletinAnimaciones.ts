'use client';
import { useEffect, RefObject } from 'react';

/**
 * Port del motor de animación del boletín (la clase `DCLogic` que vive en el
 * <script type="text/x-dc"> de index.html) a un hook de React.
 *
 * La diferencia de fondo con el original: allá el scroll ocurría en `window` y las
 * medidas se tomaban con `window.innerHeight` / `document.scrollingElement`. Dentro de
 * Orbit el boletín vive en un contenedor con overflow propio, así que todo se recalcula
 * contra ese contenedor (`scroller`) y los rects se vuelven relativos a él.
 *
 * Cubre: reveal on-scroll, parallax, barra de progreso, hovers, confeti (cumpleaños),
 * fuegos artificiales (reconocimiento) y el fondo de llamas de la portada.
 */
export function useBoletinAnimaciones(
  scrollerRef: RefObject<HTMLDivElement | null>,
  revealStyle: 'Subir' | 'Aparecer' | 'Escala' = 'Subir',
  parallax = true,
) {
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const root = scroller;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const from =
      { Subir: 'translateY(34px)', Aparecer: 'none', Escala: 'scale(.97)' }[revealStyle] ||
      'translateY(34px)';

    // Alto visible y rects relativos al contenedor de scroll, no al viewport.
    const vh = () => scroller.clientHeight;
    const topRel = (el: Element) =>
      el.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    const rectRel = (el: Element) => {
      const r = el.getBoundingClientRect();
      const s = scroller.getBoundingClientRect();
      return { top: r.top - s.top, bottom: r.bottom - s.top, height: r.height, width: r.width };
    };

    const cleanups: Array<() => void> = [];

    /* ---------------------------------------------------------------- reveal */
    const els = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    const show = (el: HTMLElement) => {
      el.style.opacity = '1';
      el.style.transform = 'none';
    };
    const revealInView = () => {
      const limit = vh() * 0.94;
      els.forEach((el) => {
        if (el.style.opacity === '1') return;
        const r = rectRel(el);
        if (r.height === 0 || r.top < limit) show(el);
      });
    };

    if (reduce) {
      els.forEach(show);
    } else {
      els.forEach((el) => {
        if (el.getBoundingClientRect().height === 0) {
          show(el);
          return;
        }
        el.style.opacity = '0';
        el.style.transform = from;
        el.style.transition =
          'opacity .8s cubic-bezier(.2,.7,.2,1), transform .9s cubic-bezier(.2,.7,.2,1)';
        el.style.transitionDelay = `${parseInt(el.dataset.delay || '0', 10)}ms`;
      });
      const io = new IntersectionObserver(
        (es) =>
          es.forEach((e) => {
            if (e.isIntersecting) {
              show(e.target as HTMLElement);
              io.unobserve(e.target);
            }
          }),
        { root: scroller, threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
      );
      els.forEach((el) => {
        if (el.getBoundingClientRect().height > 0) io.observe(el);
      });
      revealInView();
      const fallback = setTimeout(() => els.forEach(show), 2500);
      cleanups.push(() => {
        io.disconnect();
        clearTimeout(fallback);
      });
    }

    /* ----------------------------------------------------------------- hovers */
    const hover = (sel: string, enter: string, leave: string) => {
      root.querySelectorAll<HTMLElement>(sel).forEach((el) => {
        const onEnter = () => {
          el.style.background = enter;
        };
        const onLeave = () => {
          el.style.background = leave;
        };
        el.addEventListener('mouseenter', onEnter);
        el.addEventListener('mouseleave', onLeave);
        cleanups.push(() => {
          el.removeEventListener('mouseenter', onEnter);
          el.removeEventListener('mouseleave', onLeave);
        });
      });
    };
    hover('[data-cell]', 'rgba(255,255,255,.1)', 'rgba(255,255,255,.04)');
    hover('[data-nominate]', '#000', '#1e1e1e');
    hover('[data-row]', '#EBEBEF', '#F4F4F6');
    root.querySelectorAll<HTMLElement>('[data-link]').forEach((el) => {
      const base = el.style.background;
      const onEnter = () => {
        el.style.background = base.replace('.1)', '.22)');
      };
      const onLeave = () => {
        el.style.background = base;
      };
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        el.removeEventListener('mouseenter', onEnter);
        el.removeEventListener('mouseleave', onLeave);
      });
    });

    /* --------------------------------------------------------------- confeti */
    let confettiRunning = false;
    let confettiRaf = 0;
    const confettiSection = root.querySelector('#cumpleanos');
    const confettiCanvas = root.querySelector<HTMLCanvasElement>('[data-confetti]');
    const startConfetti = () => {
      if (!confettiCanvas || reduce || confettiRunning) return;
      confettiRunning = true;
      const ctx = confettiCanvas.getContext('2d');
      if (!ctx) return;
      const colors = ['#E34714', '#D72A5A', '#AB3C83', '#5367E1', '#0079E3'];
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      let CW = 0;
      let CH = 0;
      const resize = () => {
        const r = confettiCanvas.getBoundingClientRect();
        CW = Math.max(1, r.width);
        CH = Math.max(1, r.height);
        confettiCanvas.width = Math.round(CW * dpr);
        confettiCanvas.height = Math.round(CH * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      window.addEventListener('resize', resize);
      cleanups.push(() => window.removeEventListener('resize', resize));

      const make = () => ({
        x: Math.random() * CW,
        y: -20 - Math.random() * 130,
        w: 6 + Math.random() * 6,
        h: 10 + Math.random() * 11,
        vy: 190 + Math.random() * 210,
        vx: (Math.random() - 0.5) * 60,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 7,
        color: colors[(Math.random() * colors.length) | 0],
        sway: 0.8 + Math.random() * 1.8,
        phase: Math.random() * Math.PI * 2,
      });
      const pieces: ReturnType<typeof make>[] = [];
      const TOTAL = 170;
      const EMIT_UNTIL = 2.6;
      const DURATION = 7.5;
      const FADE_FROM = 5.4;
      let emitted = 0;
      const t0 = performance.now();
      let last = t0;

      const tick = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const elapsed = (now - t0) / 1000;
        const want = Math.min(TOTAL, Math.round(TOTAL * Math.min(1, elapsed / EMIT_UNTIL)) + 26);
        while (emitted < want) {
          pieces.push(make());
          emitted++;
        }

        ctx.clearRect(0, 0, CW, CH);
        const fade = elapsed > FADE_FROM ? Math.max(0, 1 - (elapsed - FADE_FROM) / 2.1) : 1;
        pieces.forEach((p) => {
          p.y += p.vy * dt;
          p.x += (p.vx + Math.sin(elapsed * p.sway + p.phase) * 34) * dt;
          p.rot += p.vr * dt;
          if (p.y > CH + 60) {
            const n = make();
            if (elapsed < FADE_FROM) Object.assign(p, n);
          }
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.globalAlpha = fade;
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * (0.45 + Math.abs(Math.cos(p.rot)) * 0.55));
          ctx.restore();
        });
        if (elapsed < DURATION) confettiRaf = requestAnimationFrame(tick);
        else ctx.clearRect(0, 0, CW, CH);
      };
      confettiRaf = requestAnimationFrame(tick);
    };

    let watchRaf = 0;
    if (confettiSection && confettiCanvas && !reduce) {
      const watch = () => {
        if (confettiRunning) return;
        const r = rectRel(confettiSection);
        if (r.top < vh() * 0.8 && r.bottom > 0) {
          startConfetti();
          return;
        }
        watchRaf = requestAnimationFrame(watch);
      };
      watchRaf = requestAnimationFrame(watch);
    }
    cleanups.push(() => {
      cancelAnimationFrame(watchRaf);
      cancelAnimationFrame(confettiRaf);
    });

    /* ------------------------------------------------- fondo de llamas (hero) */
    const flameCanvas = root.querySelector<HTMLCanvasElement>('[data-flames]');
    let flameRaf = 0;
    if (flameCanvas && !reduce) {
      const ctx = flameCanvas.getContext('2d', { alpha: true });
      if (ctx) {
        const SCALE = 0.16; // se dibuja a baja resolución y el navegador lo escala
        let W = 0;
        let H = 0;
        const resize = () => {
          const r = flameCanvas.getBoundingClientRect();
          W = Math.max(1, Math.round(r.width * SCALE));
          H = Math.max(1, Math.round(r.height * SCALE));
          flameCanvas.width = W;
          flameCanvas.height = H;
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        };
        resize();
        window.addEventListener('resize', resize);
        cleanups.push(() => window.removeEventListener('resize', resize));

        const palette = [
          [227, 71, 20],
          [215, 42, 90],
          [171, 60, 131],
          [83, 103, 225],
          [0, 121, 227],
        ];
        const N = 9;
        const tongues = Array.from({ length: N }, (_, i) => ({
          cx: (i + 0.5) / N + (Math.random() - 0.5) * 0.06,
          color: palette[Math.floor((i / N) * palette.length) % palette.length],
          speed: 0.055 + Math.random() * 0.075,
          phase: Math.random() * Math.PI * 2,
          sway: 0.16 + Math.random() * 0.3,
          swayFreq: 0.25 + Math.random() * 0.5,
          w: 0.16 + Math.random() * 0.16,
          h: 0.6 + Math.random() * 0.7,
          breathe: 0.5 + Math.random() * 0.9,
          alpha: 0.3 + Math.random() * 0.28,
          y: Math.random(),
        }));

        let lastFrame = 0;
        const draw = (now: number) => {
          flameRaf = requestAnimationFrame(draw);
          if (now - lastFrame < 40) return; // ~25 fps, suficiente para un fondo suave
          lastFrame = now;
          if (rectRel(flameCanvas).bottom < 0) return; // pausa fuera de vista
          const t = now / 1000;
          ctx.clearRect(0, 0, W, H);
          ctx.globalCompositeOperation = 'lighter';
          tongues.forEach((f) => {
            const prog = (f.y + t * f.speed) % 1.35;
            const x = (f.cx + Math.sin(t * f.swayFreq + f.phase) * f.sway * 0.12) * W;
            const y = H * (1.18 - prog);
            const pulse = 0.78 + Math.sin(t * f.breathe + f.phase) * 0.24;
            const rx = f.w * W * 0.5 * pulse;
            const ry = f.h * H * 0.5 * pulse;
            const fade =
              Math.min(1, prog / 0.22) * Math.max(0, 1 - Math.max(0, prog - 0.72) / 0.6);
            const [r, g, b] = f.color;
            const grad = ctx.createRadialGradient(x, y, 0, x, y, Math.max(rx, ry));
            grad.addColorStop(0, `rgba(${r},${g},${b},${(f.alpha * fade).toFixed(3)})`);
            grad.addColorStop(0.55, `rgba(${r},${g},${b},${(f.alpha * fade * 0.42).toFixed(3)})`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
            ctx.fill();
          });
          ctx.globalCompositeOperation = 'source-over';
        };
        flameRaf = requestAnimationFrame(draw);
      }
    }
    cleanups.push(() => cancelAnimationFrame(flameRaf));

    /* --------------------------------------------------- fuegos artificiales */
    let fwRunning = false;
    let fwRaf = 0;
    const fwSection = root.querySelector('#reconocimiento');
    const fwCanvas = root.querySelector<HTMLCanvasElement>('[data-fireworks]');
    const startFireworks = () => {
      if (!fwCanvas || reduce || fwRunning) return;
      fwRunning = true;
      const ctx = fwCanvas.getContext('2d');
      if (!ctx) return;
      const colors = ['#E34714', '#D72A5A', '#AB3C83', '#FFFFFF', '#FFD166', '#7FE7FF'];
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      let W = 0;
      let H = 0;
      const resize = () => {
        const r = fwCanvas.getBoundingClientRect();
        W = Math.max(1, r.width);
        H = Math.max(1, r.height);
        fwCanvas.width = Math.round(W * dpr);
        fwCanvas.height = Math.round(H * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      window.addEventListener('resize', resize);
      cleanups.push(() => window.removeEventListener('resize', resize));

      type Rocket = { x: number; y: number; tx: number; ty: number; color: string; vy: number };
      type Spark = {
        x: number; y: number; vx: number; vy: number;
        life: number; age: number; color: string; r: number;
      };
      const rockets: Rocket[] = [];
      const sparks: Spark[] = [];
      const launch = () => {
        const tx = W * (0.12 + Math.random() * 0.76);
        const ty = H * (0.14 + Math.random() * 0.34);
        rockets.push({
          x: tx + (Math.random() - 0.5) * 60,
          y: H + 10,
          tx,
          ty,
          color: colors[(Math.random() * colors.length) | 0],
          vy: -(H - ty) / (0.85 + Math.random() * 0.25),
        });
      };
      const burst = (x: number, y: number, color: string) => {
        const n = 46 + ((Math.random() * 24) | 0);
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + Math.random() * 0.14;
          const sp = 90 + Math.random() * 190;
          sparks.push({
            x, y,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life: 0.85 + Math.random() * 0.75,
            age: 0,
            color: Math.random() < 0.22 ? '#FFFFFF' : color,
            r: 1.4 + Math.random() * 1.8,
          });
        }
      };

      const t0 = performance.now();
      let last = t0;
      let nextLaunch = 0;
      const DURATION = 8.4;
      const LAUNCH_UNTIL = 6;
      const tick = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        const elapsed = (now - t0) / 1000;
        if (elapsed < LAUNCH_UNTIL && elapsed >= nextLaunch) {
          launch();
          if (Math.random() < 0.45) launch();
          nextLaunch = elapsed + 0.38 + Math.random() * 0.42;
        }
        ctx.clearRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter';

        for (let i = rockets.length - 1; i >= 0; i--) {
          const r = rockets[i];
          r.y += r.vy * dt;
          r.x += (r.tx - r.x) * Math.min(1, dt * 3.2);
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = r.color;
          ctx.beginPath();
          ctx.arc(r.x, r.y, 2.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.arc(r.x, r.y + 8, 1.6, 0, Math.PI * 2);
          ctx.fill();
          if (r.y <= r.ty) {
            burst(r.x, r.y, r.color);
            rockets.splice(i, 1);
          }
        }

        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          s.age += dt;
          if (s.age >= s.life) {
            sparks.splice(i, 1);
            continue;
          }
          s.vy += 190 * dt;
          s.vx *= 0.985;
          s.vy *= 0.985;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          ctx.globalAlpha = Math.max(0, 1 - s.age / s.life);
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        if (elapsed < DURATION || sparks.length) fwRaf = requestAnimationFrame(tick);
        else ctx.clearRect(0, 0, W, H);
      };
      fwRaf = requestAnimationFrame(tick);
    };
    cleanups.push(() => cancelAnimationFrame(fwRaf));

    /* ---------------------------------------------- scroll: progreso/parallax */
    const maybeFireworks = () => {
      if (!fwSection || reduce || fwRunning) return;
      const r = rectRel(fwSection);
      if (r.top < vh() * 0.78 && r.bottom > 0) startFireworks();
    };
    const maybeConfetti = () => {
      if (!confettiSection || reduce || confettiRunning) return;
      const r = rectRel(confettiSection);
      if (r.top < vh() * 0.75 && r.bottom > 0) startConfetti();
    };

    let pxEls: HTMLElement[] | null = null;
    const onScroll = () => {
      revealInView();
      maybeConfetti();
      maybeFireworks();
      const bar = root.querySelector<HTMLElement>('[data-progress]');
      if (bar) {
        const max = scroller.scrollHeight - scroller.clientHeight;
        bar.style.width = `${max > 0 ? Math.min(100, Math.max(0, (scroller.scrollTop / max) * 100)) : 0}%`;
      }
      if (!parallax || reduce) return;
      if (!pxEls) pxEls = Array.from(root.querySelectorAll<HTMLElement>('[data-parallax]'));
      pxEls.forEach((el) => {
        if (!el.parentElement) return;
        const top = topRel(el.parentElement);
        el.style.transform = `translate3d(0,${(-top * (parseFloat(el.dataset.parallax || '0') || 0.15)).toFixed(1)}px,0)`;
      });
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    const firstFrame = requestAnimationFrame(onScroll);
    cleanups.push(() => {
      scroller.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(firstFrame);
    });

    return () => cleanups.forEach((fn) => fn());
  }, [scrollerRef, revealStyle, parallax]);
}
