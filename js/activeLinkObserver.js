document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".header");
  const sections = Array.from(document.querySelectorAll("section[id]"));
  const navLinks = Array.from(
    document.querySelectorAll('.header__ul a[href^="#"]')
  );

  // Limpia estado inicial: que lo controle el observer
  navLinks.forEach((l) => l.classList.remove("onscreen"));

  function setActiveLink(id) {
    navLinks.forEach((link) => {
      link.classList.toggle("onscreen", link.getAttribute("href") === `#${id}`);
    });
  }

  // ---- Lee/actualiza altura del header en una CSS var (para CSS y para IO)
  function headerH() {
    return header ? Math.round(header.getBoundingClientRect().height) : 0;
  }
  function putHeaderVar(px) {
    document.documentElement.style.setProperty("--header-h", `${px}px`);
  }

  let observer;
  function setupObserver() {
    if (observer) observer.disconnect();
    const h = headerH();
    putHeaderVar(h);

    observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) {
          visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          setActiveLink(visible[0].target.id);
        } else {
          // Fallback por si en un frame no hay intersecciones
          let best = null,
            bestArea = 0;
          sections.forEach((s) => {
            const r = s.getBoundingClientRect();
            const vh = window.innerHeight;
            const area = Math.max(
              0,
              Math.min(r.bottom, vh) - Math.max(r.top, 0)
            );
            if (area > bestArea) {
              bestArea = area;
              best = s;
            }
          });
          if (best) setActiveLink(best.id);
        }
      },
      {
        root: null,
        // Compensa justo el header arriba, y deja 40% abajo para evitar “saltos”
        rootMargin: `-${h}px 0px -40% 0px`,
        threshold: [0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    sections.forEach((s) => observer.observe(s));
  }

  // Inicial
  setupObserver();

  // Cuando cargan fuentes (Inter/Open Sans/Montserrat), recalcula
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(setupObserver);
  }

  // Si cambia el tamaño del header (responsive), recalcula
  if (window.ResizeObserver && header) {
    const ro = new ResizeObserver(setupObserver);
    ro.observe(header);
  } else {
    window.addEventListener("resize", setupObserver);
  }
});
