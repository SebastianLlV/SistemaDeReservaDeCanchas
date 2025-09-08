function revealCardsSequentially(cards, order = null, delay = 600) {
  if (!cards.length) return; // seguridad

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        let items = order 
          ? order.map(index => cards[index]) 
          : Array.from(cards);

        items.forEach((card, index) => {
          setTimeout(() => {
            card.classList.add("active");
          }, index * delay);
        });

        // dejar de observar para no gastar recursos
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  observer.observe(cards[0].parentElement);
}

// ---- Aplicar en secciones ----
const caracteristicasCards = document.querySelectorAll(".caracteristicas__cards.reveal");
revealCardsSequentially(caracteristicasCards);

const preciosCards = document.querySelectorAll(".precios__card.reveal");
revealCardsSequentially(preciosCards);