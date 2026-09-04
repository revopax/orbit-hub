/**
 * Versión B — edición Septiembre 2026 portada a JSX desde index.html.
 *
 * El markup es el mismo (mismos estilos inline, mismos data-* que consume
 * useBoletinAnimaciones). Los tres puntos donde tuvo que cambiar, porque el original
 * asumía ser dueño del viewport y aquí vive dentro del área de contenido de Orbit:
 *   1. `src="assets/..."` -> ruta pública de la edición (BASE)
 *   2. barra de progreso: position fixed -> sticky contra el contenedor de scroll
 *   3. portada: min-height 100vh -> --boletin-vh, el alto medido del contenedor
 *
 * Ojo al mantenerlo: cada edición nueva del boletín exige repetir este port a mano.
 */
'use client';

const BASE = '/boletin/2026-09';

/** Port del componente Eyebrow del design system UiX (venía de ds/_ds_bundle.js
 *  en el export original; es lo único que el boletín usaba de ese bundle). */
function Eyebrow({ children, size = 15 }: { children: React.ReactNode; size?: number }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: size,
        fontWeight: 400,
        letterSpacing: 'var(--uix-track-eyebrow)',
        fontFamily: 'var(--uix-font-sans)',
        lineHeight: 1.3,
        background: 'var(--uix-grad-eyebrow)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
      }}
    >
      {children}
    </span>
  );
}

export default function Ed202609() {
  return (
      <div style={{ position: "relative", background: "#1e1e1e", color: "#FFFFFF", overflowX: "hidden", fontFamily: "'Space Grotesk',system-ui,sans-serif" }}>
        <div style={{ position: "sticky", top: 0, height: "4px", marginBottom: "-4px", background: "rgba(255,255,255,.08)", zIndex: 80 }}>
          <div data-progress="1" style={{ height: "100%", width: "0%", background: "var(--uix-grad-brand)" }}></div>
        </div>
        <section data-screen-label="Portada" style={{ position: "relative", minHeight: "var(--boletin-vh, calc(100vh - 104px))", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "34px", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: "0", background: "linear-gradient(160deg, #2a1408 0%, #1e1e1e 42%, #14162c 100%)", pointerEvents: "none" }}></div>
          <div data-parallax="0.14" style={{ position: "absolute", inset: "-30% -14%", pointerEvents: "none" }}>
            <div style={{ position: "absolute", inset: "0", background: "radial-gradient(720px 500px at 14% 10%, rgba(227,71,20,.5), transparent 64%)", filter: "blur(54px)", animation: "v3-glow-a 28s ease-in-out infinite" }}></div>
            <div style={{ position: "absolute", inset: "0", background: "radial-gradient(680px 480px at 86% 78%, rgba(83,103,225,.46), transparent 64%)", filter: "blur(60px)", animation: "v3-glow-b 34s ease-in-out infinite" }}></div>
            <div style={{ position: "absolute", inset: "0", background: "radial-gradient(620px 460px at 52% 96%, rgba(215,42,90,.36), transparent 66%)", filter: "blur(60px)", animation: "v3-glow-a 40s ease-in-out infinite" }}></div>
          </div>
          <canvas data-flames="1" style={{ position: "absolute", inset: "0", width: "100%", height: "100%", pointerEvents: "none", mixBlendMode: "screen", filter: "blur(28px) saturate(1.1)", willChange: "opacity" }}></canvas>
          <div style={{ position: "absolute", inset: "0", background: "linear-gradient(180deg, rgba(30,30,30,.5) 0%, rgba(30,30,30,.42) 42%, rgba(30,30,30,.66) 100%)", pointerEvents: "none" }}></div>
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", flexWrap: "wrap" }}>
            <img src={`${BASE}/assets/logo-mkt-corp.png`} alt="Marketing Corporativo" style={{ height: "40px", width: "auto", display: "block" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 18px", borderRadius: "999px", border: "1px solid rgba(255,255,255,.18)", background: "rgba(255,255,255,.05)", fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.7)" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "999px", background: "#E34714", display: "block" }}></span>Edición mensual · Septiembre 2026
            </div>
          </div>
          <div style={{ position: "relative", padding: "60px 0 40px", maxWidth: "1400px" }}>
            <div data-reveal="1" style={{ marginBottom: "28px" }}><Eyebrow>Boletín interno · Marketing Corporativo</Eyebrow></div>
            <h1 style={{ margin: "0", fontSize: "clamp(42px,7.4vw,112px)", lineHeight: ".94", fontWeight: "700", letterSpacing: "-.045em" }}>
              <span data-reveal="1" data-delay="40" style={{ display: "block" }}>Grito de guerra:</span>
              <span data-reveal="1" data-delay="130" style={{ display: "block" }}><span style={{ background: "var(--uix-grad-brand)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>A romperla este mes!</span></span>
            </h1>
            <p data-reveal="1" data-delay="240" style={{ margin: "40px 0 0", fontSize: "21px", lineHeight: "1.55", fontWeight: "300", color: "rgba(255,255,255,.7)", maxWidth: "52ch", textWrap: "pretty" }}>Lo que logramos, lo que viene y las personas que lo hicieron posible este mes. Gracias por estar aquí.</p>
          </div>
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
            <a href="#cumpleanos" data-cell="1" style={{ padding: "24px 26px 28px", borderRadius: "24px", border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.04)", color: "#fff", transition: "background .3s ease, transform .3s ease" }}>
              <div style={{ fontSize: "50px", fontWeight: "600", letterSpacing: "-.03em", lineHeight: "1", color: "#E34714" }}>03</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.6)", marginTop: "12px" }}>Cumpleaños</div>
            </a>
            <a href="#reconocimiento" data-cell="1" style={{ padding: "24px 26px 28px", borderRadius: "24px", border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.04)", color: "#fff", transition: "background .3s ease, transform .3s ease" }}>
              <div style={{ fontSize: "50px", fontWeight: "600", letterSpacing: "-.03em", lineHeight: "1", color: "#D72A5A" }}>01</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.6)", marginTop: "12px" }}>Reconocimiento</div>
            </a>
            <a href="#concurso" data-cell="1" style={{ padding: "24px 26px 28px", borderRadius: "24px", border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.04)", color: "#fff", transition: "background .3s ease, transform .3s ease" }}>
              <div style={{ fontSize: "50px", fontWeight: "600", letterSpacing: "-.03em", lineHeight: "1", color: "#AB3C83" }}>01</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.6)", marginTop: "12px" }}>Concurso</div>
            </a>
            <a href="#bienvenida" data-cell="1" style={{ padding: "24px 26px 28px", borderRadius: "24px", border: "1px solid rgba(255,255,255,.14)", background: "rgba(255,255,255,.04)", color: "#fff", transition: "background .3s ease, transform .3s ease" }}>
              <div style={{ fontSize: "50px", fontWeight: "600", letterSpacing: "-.03em", lineHeight: "1", color: "#5367E1" }}>01</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.6)", marginTop: "12px" }}>Bienvenida</div>
            </a>
          </div>
        </section>
        <section style={{ padding: "0 34px 34px" }}>
          <div style={{ borderRadius: "999px", background: "#E34714", color: "#fff", padding: "16px 0", overflow: "hidden" }}>
            <div style={{ display: "flex", width: "max-content", gap: "44px", alignItems: "center", animation: "v3-marquee 30s linear infinite", fontFamily: "'DM Mono',monospace", fontSize: "14px", letterSpacing: ".16em", textTransform: "uppercase" }}>
              <span>Cumpleaños</span><span>✳</span><span>Reconocimiento</span><span>✳</span><span>Concurso de sudadera</span><span>✳</span><span>Bienvenida</span><span>✳</span><span>Noticias</span><span>✳</span><span>Eventos</span><span>✳</span>
              <span>Cumpleaños</span><span>✳</span><span>Reconocimiento</span><span>✳</span><span>Concurso de sudadera</span><span>✳</span><span>Bienvenida</span><span>✳</span><span>Noticias</span><span>✳</span><span>Eventos</span><span>✳</span>
            </div>
          </div>
        </section>
        <section data-screen-label="Nota del líder" style={{ background: "#FFFFFF", color: "#1e1e1e", borderRadius: "40px 40px 0 0", padding: "80px 34px" }}>
          <div data-reveal="1" style={{ maxWidth: "1240px", margin: "0 auto", display: "grid", gridTemplateColumns: "300px 1fr", gap: "48px", alignItems: "center" }}>
            <div style={{ borderRadius: "28px", overflow: "hidden", background: "#F0F0F0" }}>
              <img src={`${BASE}/assets/p-franco.png`} alt="Franco Cruzat" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
            </div>
            <div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".16em", textTransform: "uppercase", color: "#E34714", marginBottom: "24px" }}>Nota del líder</div>
              <p style={{ margin: "0", fontSize: "clamp(24px,3vw,40px)", lineHeight: "1.24", fontWeight: "400", letterSpacing: "-.02em", textWrap: "pretty", maxWidth: "36ch" }}>“Este mes cerramos dos proyectos que llevábamos meses cocinando. Lo que más me enorgullece no son los números, sino cómo el equipo se acompañó para llegar ahí.”</p>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "32px" }}>
                <div style={{ width: "28px", height: "2px", background: "#E34714" }}></div>
                <div style={{ fontSize: "17px", fontWeight: "500" }}>Franco Cruzat<span style={{ color: "rgba(30,30,30,.5)", fontWeight: "400" }}> · CMO</span></div>
              </div>
            </div>
          </div>
        </section>
        <section id="bienvenida" data-screen-label="Bienvenida" style={{ background: "#FFFFFF", padding: "0 34px 90px" }}>
          <div data-reveal="1" style={{ maxWidth: "1240px", margin: "0 auto", borderRadius: "40px", background: "#AB3C83", color: "#fff", overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 380px", alignItems: "center" }}>
            <div style={{ padding: "60px 48px" }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(255,255,255,.82)", marginBottom: "24px" }}>Nuevo ingreso</div>
              <h2 style={{ margin: "0", fontSize: "clamp(38px,5.4vw,74px)", fontWeight: "700", letterSpacing: "-.04em", lineHeight: ".96" }}><span aria-hidden="true" style={{ display: "inline-block", textTransform: "none", letterSpacing: "0", marginRight: ".24em", transformOrigin: "60% 90%", animation: "v3-wiggle 1.6s ease-in-out infinite" }}>👋</span>Bienvenido,<br />Otniel</h2>
              <div style={{ fontSize: "19px", color: "rgba(255,255,255,.86)", marginTop: "20px" }}>Otniel Sedano Ugalde · Sales Development Representative</div>
              <p style={{ margin: "22px 0 0", fontSize: "18px", lineHeight: "1.6", color: "rgba(255,255,255,.9)", maxWidth: "48ch", textWrap: "pretty" }}>Se suma al equipo comercial este mes. Si te lo cruzas en el piso o en una llamada, preséntate.</p>
            </div>
            <div style={{ padding: "34px 34px 34px 0" }}>
              <div style={{ borderRadius: "28px", overflow: "hidden", background: "rgba(255,255,255,.12)" }}>
                <img src={`${BASE}/assets/p-otniel.jpg`} alt="Otniel Sedano Ugalde" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
              </div>
            </div>
          </div>
        </section>
        <section id="cumpleanos" data-screen-label="Cumpleaños" style={{ position: "relative", background: "#FFFFFF", color: "#1e1e1e", padding: "20px 34px 90px", overflow: "hidden" }}>
          <canvas data-confetti="1" style={{ position: "absolute", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "2" }}></canvas>
          <div style={{ position: "relative", zIndex: "1", maxWidth: "1240px", margin: "0 auto" }}>
            <div data-reveal="1" style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".16em", textTransform: "uppercase", color: "#D72A5A", marginBottom: "20px" }}>Cumpleaños de septiembre</div>
            <h2 data-reveal="1" data-delay="70" style={{ margin: "0 0 44px", fontSize: "clamp(36px,5.6vw,76px)", fontWeight: "700", letterSpacing: "-.04em", lineHeight: ".96" }}><span aria-hidden="true" style={{ display: "inline-block", textTransform: "none", letterSpacing: "0", marginRight: ".24em", transformOrigin: "60% 90%", animation: "v3-bounce 1.8s ease-in-out infinite" }}>🎂</span>Tres razones<br />para el pastel</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "20px" }}>
              <article data-reveal="1" data-delay="0" data-card="1" style={{ borderRadius: "28px", overflow: "hidden", background: "#F4F4F6", transition: "transform .35s ease" }}>
                <div style={{ background: "linear-gradient(150deg, rgba(227,71,20,.14), rgba(215,42,90,.1))", padding: "14px" }}><img src={`${BASE}/assets/cum-arath.png`} alt="Arath Escamilla" style={{ width: "100%", aspectRatio: "1", objectFit: "contain", display: "block" }} /></div>
                <div style={{ padding: "26px 26px 30px" }}>
                  <div style={{ display: "inline-block", padding: "7px 14px", borderRadius: "999px", background: "#E34714", color: "#fff", fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".1em", marginBottom: "18px" }}>14 SEP</div>
                  <div style={{ fontSize: "24px", fontWeight: "600", letterSpacing: "-.02em" }}>Arath Escamilla</div>
                  <div style={{ fontSize: "15px", color: "rgba(30,30,30,.55)", marginTop: "6px" }}>Marketing Producer</div>
                  <div style={{ marginTop: "20px", paddingTop: "18px", borderTop: "1px solid rgba(30,30,30,.1)", fontSize: "15px", color: "rgba(30,30,30,.7)" }}><span style={{ fontFamily: "'DM Mono',monospace", fontSize: "11px", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(30,30,30,.45)", display: "block", marginBottom: "6px" }}>Pastel favorito</span>Tarta de fruta, conejito de garabato</div>
                </div>
              </article>
              <article data-reveal="1" data-delay="110" data-card="1" style={{ borderRadius: "28px", overflow: "hidden", background: "#F4F4F6", transition: "transform .35s ease" }}>
                <div style={{ background: "linear-gradient(150deg, rgba(215,42,90,.14), rgba(171,60,131,.1))", padding: "14px" }}><img src={`${BASE}/assets/cum-marco.png`} alt="Marco Antonio Juárez" style={{ width: "100%", aspectRatio: "1", objectFit: "contain", display: "block" }} /></div>
                <div style={{ padding: "26px 26px 30px" }}>
                  <div style={{ display: "inline-block", padding: "7px 14px", borderRadius: "999px", background: "#D72A5A", color: "#fff", fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".1em", marginBottom: "18px" }}>24 SEP</div>
                  <div style={{ fontSize: "24px", fontWeight: "600", letterSpacing: "-.02em" }}>Marco Antonio Juárez</div>
                  <div style={{ fontSize: "15px", color: "rgba(30,30,30,.55)", marginTop: "6px" }}>Web Developer · Marketing Dep.</div>
                  <div style={{ marginTop: "20px", paddingTop: "18px", borderTop: "1px solid rgba(30,30,30,.1)", fontSize: "15px", color: "rgba(30,30,30,.7)" }}><span style={{ fontFamily: "'DM Mono',monospace", fontSize: "11px", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(30,30,30,.45)", display: "block", marginBottom: "6px" }}>Pastel favorito</span>Chocolate</div>
                </div>
              </article>
              <article data-reveal="1" data-delay="220" data-card="1" style={{ borderRadius: "28px", overflow: "hidden", background: "#F4F4F6", transition: "transform .35s ease" }}>
                <div style={{ background: "linear-gradient(150deg, rgba(171,60,131,.14), rgba(83,103,225,.1))", padding: "14px" }}><img src={`${BASE}/assets/cum-edna.png`} alt="Edna González" style={{ width: "100%", aspectRatio: "1", objectFit: "contain", display: "block" }} /></div>
                <div style={{ padding: "26px 26px 30px" }}>
                  <div style={{ display: "inline-block", padding: "7px 14px", borderRadius: "999px", background: "#AB3C83", color: "#fff", fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".1em", marginBottom: "18px" }}>26 SEP</div>
                  <div style={{ fontSize: "24px", fontWeight: "600", letterSpacing: "-.02em" }}>Edna González</div>
                  <div style={{ fontSize: "15px", color: "rgba(30,30,30,.55)", marginTop: "6px" }}>Sales Development Representative</div>
                  <div style={{ marginTop: "20px", paddingTop: "18px", borderTop: "1px solid rgba(30,30,30,.1)", fontSize: "15px", color: "rgba(30,30,30,.7)" }}><span style={{ fontFamily: "'DM Mono',monospace", fontSize: "11px", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(30,30,30,.45)", display: "block", marginBottom: "6px" }}>Pastel favorito</span>Chocolate</div>
                </div>
              </article>
            </div>
          </div>
        </section>
        <section id="reconocimiento" data-screen-label="Reconocimiento" style={{ background: "#FFFFFF", padding: "0 34px 90px" }}>
          <div data-reveal="1" style={{ position: "relative", maxWidth: "1240px", margin: "0 auto", borderRadius: "40px", background: "#5367E1", color: "#fff", overflow: "hidden", display: "grid", gridTemplateColumns: "1fr 400px" }}>
            <canvas data-fireworks="1" style={{ position: "absolute", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "3" }}></canvas>
            <div style={{ padding: "60px 48px" }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(255,255,255,.82)", marginBottom: "24px" }}>Reconocimiento del mes</div>
              <h2 style={{ margin: "0", fontSize: "clamp(40px,6vw,84px)", fontWeight: "700", letterSpacing: "-.04em", lineHeight: ".94" }}><span aria-hidden="true" style={{ display: "inline-block", textTransform: "none", letterSpacing: "0", marginRight: ".24em", transformOrigin: "60% 90%", animation: "v3-pop 2s ease-in-out infinite" }}>🏆</span>Diego Luna</h2>
              <div style={{ fontSize: "17px", color: "rgba(255,255,255,.8)", marginTop: "12px" }}>BI Specialist</div>
              <p style={{ margin: "28px 0 0", fontSize: "19px", lineHeight: "1.6", color: "rgba(255,255,255,.9)", maxWidth: "46ch", textWrap: "pretty" }}>Construyó Orbit, la plataforma que reúne en un solo lugar lo que antes vivía en diez archivos distintos. Hoy el departamento consulta ahí sus números todos los días.</p>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", marginTop: "36px" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "16px", padding: "18px 26px", borderRadius: "20px", background: "#fff" }}>
                  <img src={`${BASE}/assets/logo-orbit.png`} alt="Orbit Marketing Hub" style={{ height: "34px", width: "auto", display: "block" }} />
                </div>
                <a href="https://forms.gle/aAhUsiDRMkudzEf47" target="_blank" rel="noopener" data-nominate="1" style={{ display: "inline-flex", alignItems: "center", gap: "12px", padding: "18px 28px", borderRadius: "999px", background: "#1e1e1e", color: "#fff", fontFamily: "'DM Mono',monospace", fontSize: "13px", letterSpacing: ".12em", textTransform: "uppercase", transition: "background .3s ease" }}>
                  <span aria-hidden="true" style={{ display: "inline-block", fontSize: "22px", lineHeight: "1", transformOrigin: "60% 90%", animation: "v3-pop 1.9s ease-in-out infinite" }}>🌟</span>
                  Nómina al próximo empleado del mes
                </a>
              </div>
            </div>
            <div style={{ minHeight: "460px", background: "rgba(255,255,255,.1)" }}>
              <img src={`${BASE}/assets/p-diego-marco.png`} alt="Diego Luna, empleado del mes" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </div>
          </div>
        </section>
        <section id="concurso" data-screen-label="Concurso" style={{ background: "#FFFFFF", padding: "0 34px 90px", borderRadius: "0 0 40px 40px" }}>
          <div data-reveal="1" style={{ maxWidth: "1240px", margin: "0 auto", borderRadius: "40px", background: "#D72A5A", color: "#fff", overflow: "hidden", display: "grid", gridTemplateColumns: "460px 1fr", alignItems: "center" }}>
            <div style={{ padding: "34px" }}>
              <div style={{ borderRadius: "28px", overflow: "hidden", background: "#FFFFFF" }}>
                <img src={`${BASE}/assets/concurso-sudadera-2.png`} alt="Sudadera Marketing Corporativo" style={{ width: "100%", aspectRatio: "1", objectFit: "contain", display: "block" }} />
              </div>
            </div>
            <div style={{ padding: "60px 48px" }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".16em", textTransform: "uppercase", color: "rgba(255,255,255,.82)", marginBottom: "24px" }}>Concurso interno · Edición 2026</div>
              <h2 style={{ margin: "0", fontSize: "clamp(36px,5vw,68px)", fontWeight: "700", letterSpacing: "-.04em", lineHeight: ".96" }}><span aria-hidden="true" style={{ display: "inline-block", textTransform: "none", letterSpacing: "0", marginRight: ".24em", transformOrigin: "60% 90%", animation: "v3-swing 2.4s ease-in-out infinite" }}>👕</span>Diseña lo que somos</h2>
              <p style={{ margin: "26px 0 0", fontSize: "19px", lineHeight: "1.6", color: "rgba(255,255,255,.92)", maxWidth: "52ch", textWrap: "pretty" }}>Tu idea. Nuestra sudadera. Una pieza para llevar el talento de MKT Corp puesto. Sube tu propuesta antes del 7 de septiembre: vale un diseño terminado o un concepto, y si gana un boceto te ayudamos a rematarlo.</p>
              <p style={{ margin: "18px 0 0", fontSize: "17px", lineHeight: "1.6", color: "rgba(255,255,255,.82)", maxWidth: "52ch", textWrap: "pretty" }}>Del 7 al 8 se publican todas a la vez, sin firma, y cada persona tiene un voto: lo decide el equipo, sin jurado. La revelación es el 9 de septiembre a las 15 h en Sky Lobby, Sala 2.</p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "32px" }}>
                <span style={{ padding: "11px 20px", borderRadius: "999px", background: "#1e1e1e", color: "#fff", fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".12em", textTransform: "uppercase" }}>Pase doble Arena CDMX</span>
                <span style={{ padding: "11px 20px", borderRadius: "999px", border: "1px solid rgba(255,255,255,.55)", fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".12em", textTransform: "uppercase" }}>Gift card $1,000 MXN</span>
                <span style={{ padding: "11px 20px", borderRadius: "999px", border: "1px solid rgba(255,255,255,.55)", fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".12em", textTransform: "uppercase" }}>+ 1 día adicional</span>
              </div>
              <a href="https://mktcorp-upax.vercel.app/concurso" target="_blank" rel="noopener" style={{ display: "inline-block", marginTop: "34px", padding: "18px 30px", borderRadius: "999px", background: "#fff", color: "#D72A5A", fontFamily: "'DM Mono',monospace", fontSize: "13px", letterSpacing: ".14em", textTransform: "uppercase" }}>¡Concursa ahora!</a>
            </div>
          </div>
        </section>
        <section id="noticias" data-screen-label="Noticias" style={{ padding: "90px 34px" }}>
          <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "24px", flexWrap: "wrap", marginBottom: "44px" }}>
              <div>
                <div data-reveal="1" style={{ marginBottom: "20px" }}><Eyebrow>Noticias y anuncios</Eyebrow></div>
                <h2 data-reveal="1" data-delay="70" style={{ margin: "0", fontSize: "clamp(36px,5.6vw,76px)", fontWeight: "700", letterSpacing: "-.04em", lineHeight: ".96" }}><span aria-hidden="true" style={{ display: "inline-block", textTransform: "none", letterSpacing: "0", marginRight: ".24em", transformOrigin: "60% 90%", animation: "v3-wiggle 1.9s ease-in-out infinite" }}>📣</span>Se cocina algo<br />en el área</h2>
              </div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.5)" }}>2 anuncios</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <article data-reveal="1" data-delay="0" data-card="1" style={{ borderRadius: "28px", overflow: "hidden", border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.03)", transition: "background .35s ease" }}>
                <div style={{ aspectRatio: "4/3", overflow: "hidden", background: "#000" }}><img src={`${BASE}/assets/n-fire-experiences.png`} alt="Fire Experiences" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>
                <div style={{ padding: "30px 30px 36px" }}>
                  <div style={{ display: "inline-block", padding: "6px 14px", borderRadius: "999px", background: "rgba(227,71,20,.16)", color: "#F0723F", fontFamily: "'DM Mono',monospace", fontSize: "11px", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: "18px" }}>Evento</div>
                  <h3 style={{ margin: "0 0 14px", fontSize: "26px", fontWeight: "600", lineHeight: "1.2", letterSpacing: "-.02em" }}>Fire Experiences ya tiene cara</h3>
                  <p style={{ margin: "0", fontSize: "16px", lineHeight: "1.65", color: "rgba(255,255,255,.68)", textWrap: "pretty" }}>Detrás de esta presentación hay horas de dedicación, ideas brillantes y una creatividad increíble por parte del equipo. Gracias por meterle tanto empeño y pasión; el esfuerzo de cada uno se nota en el resultado final.</p>
                  <p style={{ margin: "14px 0 0", fontSize: "16px", lineHeight: "1.65", color: "rgba(255,255,255,.68)", textWrap: "pretty" }}>Se viene un proyecto enorme y muy emocionante. ¡Felicidades a todos por este merecido éxito!</p>
                  <div style={{ marginTop: "22px", padding: "18px 20px", borderRadius: "20px", background: "rgba(227,71,20,.1)", border: "1px solid rgba(227,71,20,.3)" }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "11px", letterSpacing: ".14em", textTransform: "uppercase", color: "#F0723F", marginBottom: "8px" }}>Mención honorífica</div>
                    <div style={{ fontSize: "17px", fontWeight: "600" }}>Santiago Arango y Sergio Franco</div>
                    <div style={{ fontSize: "15px", color: "rgba(255,255,255,.65)", marginTop: "4px" }}>Por desarrollar la imagen gráfica del evento.</div>
                  </div>
                </div>
              </article>
              <article data-reveal="1" data-delay="110" data-card="1" style={{ borderRadius: "28px", overflow: "hidden", border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.03)", transition: "background .35s ease" }}>
                <div style={{ aspectRatio: "4/3", overflow: "hidden", background: "#fff" }}><img src={`${BASE}/assets/n-linkedin-learning.png`} alt="LinkedIn Learning" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></div>
                <div style={{ padding: "30px 30px 36px" }}>
                  <div style={{ display: "inline-block", padding: "6px 14px", borderRadius: "999px", background: "rgba(0,121,227,.2)", color: "#5AAEF5", fontFamily: "'DM Mono',monospace", fontSize: "11px", letterSpacing: ".12em", textTransform: "uppercase", marginBottom: "18px" }}>Formación</div>
                  <h3 style={{ margin: "0 0 14px", fontSize: "26px", fontWeight: "600", lineHeight: "1.2", letterSpacing: "-.02em" }}>¡Desarrolla las habilidades que hoy importan!</h3>
                  <p style={{ margin: "0", fontSize: "16px", lineHeight: "1.65", color: "rgba(255,255,255,.68)", textWrap: "pretty" }}>Aún estás a tiempo de adquirir tu certificación con LinkedIn Learning y fortalecer tus habilidades en:</p>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", margin: "18px 0 0" }}>
                    <span style={{ padding: "9px 16px", borderRadius: "999px", background: "rgba(0,121,227,.14)", border: "1px solid rgba(0,121,227,.34)", fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".1em", textTransform: "uppercase" }}>IA</span>
                    <span style={{ padding: "9px 16px", borderRadius: "999px", background: "rgba(0,121,227,.14)", border: "1px solid rgba(0,121,227,.34)", fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".1em", textTransform: "uppercase" }}>Gestión de Proyectos</span>
                    <span style={{ padding: "9px 16px", borderRadius: "999px", background: "rgba(0,121,227,.14)", border: "1px solid rgba(0,121,227,.34)", fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".1em", textTransform: "uppercase" }}>Análisis de Datos</span>
                    <span style={{ padding: "9px 16px", borderRadius: "999px", background: "rgba(0,121,227,.14)", border: "1px solid rgba(0,121,227,.34)", fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".1em", textTransform: "uppercase" }}>UX</span>
                  </div>
                  <p style={{ margin: "20px 0 0", fontSize: "16px", lineHeight: "1.65", color: "rgba(255,255,255,.68)", textWrap: "pretty" }}>Estos programas están diseñados para desarrollar o refuerzar tus habilidades clave para tu crecimiento profesional.</p>
                  <p style={{ margin: "16px 0 0", fontSize: "16px", lineHeight: "1.65", color: "#5AAEF5" }}>Acércate con tu formador para registrarte.</p>
                </div>
              </article>
            </div>
          </div>
        </section>
        <section id="aniversarios" data-screen-label="Aniversarios" style={{ display: "none", padding: "0 34px 90px" }}>
          <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
            <div data-reveal="1" style={{ marginBottom: "20px" }}><Eyebrow>Aniversarios en la empresa</Eyebrow></div>
            <h2 data-reveal="1" data-delay="70" style={{ margin: "0 0 44px", fontSize: "clamp(36px,5.6vw,76px)", fontWeight: "700", letterSpacing: "-.04em", lineHeight: ".96" }}><span aria-hidden="true" style={{ display: "inline-block", textTransform: "none", letterSpacing: "0", marginRight: ".24em", transformOrigin: "60% 90%", animation: "v3-pop 1.7s ease-in-out infinite" }}>🎉</span>Gracias<br />por quedarse</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div data-reveal="1" data-delay="0" data-card="1" style={{ display: "grid", gridTemplateColumns: "72px 1fr 300px 160px", gap: "24px", alignItems: "center", padding: "20px 26px", borderRadius: "24px", border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.03)", transition: "background .35s ease" }}>
                <div style={{ width: "72px", height: "72px", borderRadius: "999px", background: "rgba(255,255,255,.08)" }}></div>
                <div style={{ fontSize: "23px", fontWeight: "500", letterSpacing: "-.015em" }}>Paola Sandoval</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.5)" }}>Gerente de Marca · desde 2016</div>
                <div style={{ textAlign: "right" }}><span style={{ display: "inline-block", padding: "10px 20px", borderRadius: "999px", background: "#E34714", color: "#fff", fontSize: "15px", fontWeight: "500" }}>10 años</span></div>
              </div>
              <div data-reveal="1" data-delay="70" data-card="1" style={{ display: "grid", gridTemplateColumns: "72px 1fr 300px 160px", gap: "24px", alignItems: "center", padding: "20px 26px", borderRadius: "24px", border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.03)", transition: "background .35s ease" }}>
                <div style={{ width: "72px", height: "72px", borderRadius: "999px", background: "rgba(255,255,255,.08)" }}></div>
                <div style={{ fontSize: "23px", fontWeight: "500", letterSpacing: "-.015em" }}>Iván Ledezma</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.5)" }}>Especialista en Medios · desde 2019</div>
                <div style={{ textAlign: "right" }}><span style={{ display: "inline-block", padding: "10px 20px", borderRadius: "999px", background: "#D72A5A", color: "#fff", fontSize: "15px", fontWeight: "500" }}>7 años</span></div>
              </div>
              <div data-reveal="1" data-delay="140" data-card="1" style={{ display: "grid", gridTemplateColumns: "72px 1fr 300px 160px", gap: "24px", alignItems: "center", padding: "20px 26px", borderRadius: "24px", border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.03)", transition: "background .35s ease" }}>
                <div style={{ width: "72px", height: "72px", borderRadius: "999px", background: "rgba(255,255,255,.08)" }}></div>
                <div style={{ fontSize: "23px", fontWeight: "500", letterSpacing: "-.015em" }}>Verónica Islas</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.5)" }}>Coordinadora de Eventos · desde 2021</div>
                <div style={{ textAlign: "right" }}><span style={{ display: "inline-block", padding: "10px 20px", borderRadius: "999px", background: "#AB3C83", color: "#fff", fontSize: "15px", fontWeight: "500" }}>5 años</span></div>
              </div>
              <div data-reveal="1" data-delay="210" data-card="1" style={{ display: "grid", gridTemplateColumns: "72px 1fr 300px 160px", gap: "24px", alignItems: "center", padding: "20px 26px", borderRadius: "24px", border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.03)", transition: "background .35s ease" }}>
                <div style={{ width: "72px", height: "72px", borderRadius: "999px", background: "rgba(255,255,255,.08)" }}></div>
                <div style={{ fontSize: "23px", fontWeight: "500", letterSpacing: "-.015em" }}>Héctor Ramos</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.5)" }}>Analista de Datos · desde 2023</div>
                <div style={{ textAlign: "right" }}><span style={{ display: "inline-block", padding: "10px 20px", borderRadius: "999px", background: "#5367E1", color: "#fff", fontSize: "15px", fontWeight: "500" }}>3 años</span></div>
              </div>
            </div>
          </div>
        </section>
        <section id="eventos" data-screen-label="Eventos" style={{ display: "none", background: "#FFFFFF", color: "#1e1e1e", borderRadius: "40px 40px 0 0", padding: "80px 34px 90px" }}>
          <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
            <div data-reveal="1" style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".16em", textTransform: "uppercase", color: "#0079E3", marginBottom: "20px" }}>Próximos eventos</div>
            <h2 data-reveal="1" data-delay="70" style={{ margin: "0 0 44px", fontSize: "clamp(36px,5.6vw,76px)", fontWeight: "700", letterSpacing: "-.04em", lineHeight: ".96" }}><span aria-hidden="true" style={{ display: "inline-block", textTransform: "none", letterSpacing: "0", marginRight: ".24em", transformOrigin: "60% 90%", animation: "v3-swing 2.2s ease-in-out infinite" }}>📅</span>Agenda<br />de septiembre</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <a href="#eventos" data-reveal="1" data-delay="0" data-row="1" style={{ display: "grid", gridTemplateColumns: "130px 1fr 320px 40px", gap: "24px", alignItems: "center", padding: "24px 30px", borderRadius: "24px", background: "#F4F4F6", color: "#1e1e1e", transition: "background .35s ease" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}><span style={{ fontSize: "46px", fontWeight: "600", letterSpacing: "-.04em", lineHeight: "1" }}>04</span><span style={{ fontFamily: "'DM Mono',monospace", fontSize: "13px", letterSpacing: ".14em", textTransform: "uppercase", color: "#E34714" }}>sep</span></div>
                <div style={{ fontSize: "24px", fontWeight: "500", letterSpacing: "-.015em" }}>Junta general de Marketing</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(30,30,30,.5)" }}>10:00 h · Auditorio Piso 4</div>
                <div style={{ textAlign: "right", fontSize: "22px", color: "#E34714" }}>→</div>
              </a>
              <a href="#eventos" data-reveal="1" data-delay="70" data-row="1" style={{ display: "grid", gridTemplateColumns: "130px 1fr 320px 40px", gap: "24px", alignItems: "center", padding: "24px 30px", borderRadius: "24px", background: "#F4F4F6", color: "#1e1e1e", transition: "background .35s ease" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}><span style={{ fontSize: "46px", fontWeight: "600", letterSpacing: "-.04em", lineHeight: "1" }}>12</span><span style={{ fontFamily: "'DM Mono',monospace", fontSize: "13px", letterSpacing: ".14em", textTransform: "uppercase", color: "#D72A5A" }}>sep</span></div>
                <div style={{ fontSize: "24px", fontWeight: "500", letterSpacing: "-.015em" }}>Taller de storytelling de marca</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(30,30,30,.5)" }}>16:00 h · Sala Monterrey / híbrido</div>
                <div style={{ textAlign: "right", fontSize: "22px", color: "#D72A5A" }}>→</div>
              </a>
              <a href="#eventos" data-reveal="1" data-delay="140" data-row="1" style={{ display: "grid", gridTemplateColumns: "130px 1fr 320px 40px", gap: "24px", alignItems: "center", padding: "24px 30px", borderRadius: "24px", background: "#F4F4F6", color: "#1e1e1e", transition: "background .35s ease" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}><span style={{ fontSize: "46px", fontWeight: "600", letterSpacing: "-.04em", lineHeight: "1" }}>19</span><span style={{ fontFamily: "'DM Mono',monospace", fontSize: "13px", letterSpacing: ".14em", textTransform: "uppercase", color: "#AB3C83" }}>sep</span></div>
                <div style={{ fontSize: "24px", fontWeight: "500", letterSpacing: "-.015em" }}>Festejo de cumpleaños del mes</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(30,30,30,.5)" }}>13:30 h · Terraza</div>
                <div style={{ textAlign: "right", fontSize: "22px", color: "#AB3C83" }}>→</div>
              </a>
              <a href="#eventos" data-reveal="1" data-delay="210" data-row="1" style={{ display: "grid", gridTemplateColumns: "130px 1fr 320px 40px", gap: "24px", alignItems: "center", padding: "24px 30px", borderRadius: "24px", background: "#F4F4F6", color: "#1e1e1e", transition: "background .35s ease" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}><span style={{ fontSize: "46px", fontWeight: "600", letterSpacing: "-.04em", lineHeight: "1" }}>26</span><span style={{ fontFamily: "'DM Mono',monospace", fontSize: "13px", letterSpacing: ".14em", textTransform: "uppercase", color: "#0079E3" }}>sep</span></div>
                <div style={{ fontSize: "24px", fontWeight: "500", letterSpacing: "-.015em" }}>Demo interno: Orbit para todo el equipo</div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "12px", letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(30,30,30,.5)" }}>11:00 h · Teams</div>
                <div style={{ textAlign: "right", fontSize: "22px", color: "#0079E3" }}>→</div>
              </a>
            </div>
          </div>
        </section>
        <footer style={{ position: "relative", overflow: "hidden", padding: "90px 34px 40px" }}>
          <div data-parallax="0.1" style={{ position: "absolute", inset: "-40% -10%", background: "var(--uix-atmosphere)", pointerEvents: "none" }}></div>
          <div style={{ position: "relative", maxWidth: "1240px", margin: "0 auto" }}>
            <div data-reveal="1">
              <h2 style={{ margin: "0", fontSize: "clamp(36px,5.6vw,76px)", fontWeight: "700", letterSpacing: "-.04em", lineHeight: ".98", maxWidth: "24ch" }}><span aria-hidden="true" style={{ display: "inline-block", textTransform: "none", letterSpacing: "0", marginRight: ".24em", transformOrigin: "60% 90%", animation: "v3-pop 2s ease-in-out infinite" }}>🧰</span>Marketing Tools</h2>
              <p style={{ margin: "24px 0 0", fontSize: "19px", lineHeight: "1.6", color: "rgba(255,255,255,.68)", maxWidth: "56ch", textWrap: "pretty" }}>Aquí encontraras las herramientas que podrás usar en tu día a día.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginTop: "36px" }}>
                <a href="https://upax-dashboard-monday.vercel.app/" target="_blank" rel="noopener" data-link="1" style={{ display: "flex", alignItems: "center", gap: "20px", padding: "28px 30px", borderRadius: "24px", border: "1px solid rgba(227,71,20,.4)", background: "rgba(227,71,20,.1)", color: "#fff", transition: "background .3s ease" }}>
                  <span style={{ flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "center", width: "56px", height: "56px", borderRadius: "16px", background: "rgba(227,71,20,.2)" }}><span aria-hidden="true" style={{ fontSize: "26px", lineHeight: "1" }}>🗓️</span></span>
                  <span style={{ flex: "1 1 auto" }}>
                    <span style={{ display: "block", fontSize: "21px", fontWeight: "600" }}>Acuerdos weeklys</span>
                    <span style={{ display: "block", fontFamily: "'DM Mono',monospace", fontSize: "11px", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.55)", marginTop: "7px" }}>Lo que acordamos cada semana</span>
                  </span>
                  <span style={{ flex: "0 0 auto", fontSize: "22px", color: "#E34714" }}>→</span>
                </a>
                <a href="https://orbit-hub-fgap.vercel.app/" target="_blank" rel="noopener" data-link="1" style={{ display: "flex", alignItems: "center", gap: "20px", padding: "28px 30px", borderRadius: "24px", border: "1px solid rgba(215,42,90,.4)", background: "rgba(215,42,90,.1)", color: "#fff", transition: "background .3s ease" }}>
                  <span style={{ flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "center", width: "56px", height: "56px", borderRadius: "16px", background: "rgba(215,42,90,.2)" }}><img src={`${BASE}/assets/icono-orbit.png`} alt="Orbit" style={{ width: "44px", height: "44px", objectFit: "contain", display: "block" }} /></span>
                  <span style={{ flex: "1 1 auto" }}>
                    <span style={{ display: "block", fontSize: "21px", fontWeight: "600" }}>Orbit</span>
                    <span style={{ display: "block", fontFamily: "'DM Mono',monospace", fontSize: "11px", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.55)", marginTop: "7px" }}>Tus números en un solo lugar</span>
                  </span>
                  <span style={{ flex: "0 0 auto", fontSize: "22px", color: "#D72A5A" }}>→</span>
                </a>
                <a href="https://mktcorp-upax.vercel.app/" target="_blank" rel="noopener" data-link="1" style={{ display: "flex", alignItems: "center", gap: "20px", padding: "28px 30px", borderRadius: "24px", border: "1px solid rgba(83,103,225,.4)", background: "rgba(83,103,225,.1)", color: "#fff", transition: "background .3s ease" }}>
                  <span style={{ flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "center", width: "56px", height: "56px", borderRadius: "16px", background: "rgba(83,103,225,.2)" }}><span aria-hidden="true" style={{ fontSize: "26px", lineHeight: "1" }}>🚀</span></span>
                  <span style={{ flex: "1 1 auto" }}>
                    <span style={{ display: "block", fontSize: "21px", fontWeight: "600" }}>Marketing Hub</span>
                    <span style={{ display: "block", fontFamily: "'DM Mono',monospace", fontSize: "11px", letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,.55)", marginTop: "7px" }}>El centro del equipo</span>
                  </span>
                  <span style={{ flex: "0 0 auto", fontSize: "22px", color: "#5367E1" }}>→</span>
                </a>
              </div>
            </div>
            <div data-reveal="1" data-delay="120" style={{ marginTop: "96px" }}>
              <h2 style={{ margin: "0", fontSize: "clamp(36px,5.6vw,76px)", fontWeight: "700", letterSpacing: "-.04em", lineHeight: ".98", maxWidth: "24ch" }}><span aria-hidden="true" style={{ display: "inline-block", textTransform: "none", letterSpacing: "0", marginRight: ".24em", transformOrigin: "60% 90%", animation: "v3-wiggle 1.8s ease-in-out infinite" }}>💬</span>Dudas, quejas o sugerencias sobre la edición manda correo a:</h2>
              <div style={{ marginTop: "40px" }}><a href="mailto:marketing@upax.com.mx" style={{ display: "inline-flex", alignItems: "center", gap: "12px", padding: "18px 30px", borderRadius: "999px", background: "#E34714", color: "#fff", fontFamily: "'DM Mono',monospace", fontSize: "14px", letterSpacing: ".12em", textTransform: "uppercase", transition: "filter .3s ease" }}>marketing@upax.com.mx</a></div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "24px", flexWrap: "wrap", marginTop: "80px", paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,.14)", fontFamily: "'DM Mono',monospace", fontSize: "11px", letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.42)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
                <img src={`${BASE}/assets/logo-mkt-corp.png`} alt="Marketing Corporativo" style={{ height: "32px", width: "auto", display: "block" }} />
                <span style={{ width: "1px", height: "26px", background: "rgba(255,255,255,.18)", display: "block" }}></span>
                <img src={`${BASE}/assets/upax-mark.png`} alt="UPAX" style={{ height: "26px", width: "auto", display: "block" }} />
              </div>
              <div>Boletín interno · Marketing Corporativo · Septiembre 2026</div>
              <div>UPAX · Ciudad de México</div>
            </div>
          </div>
        </footer>
      </div>
  );
}
