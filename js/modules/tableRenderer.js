import { formatRange } from "./slotsBuilder.js";

export function renderSlots({
  dateISO,
  slots,
  tbodySelector = "#slots-tbody",
}) {
  const tbody = document.querySelector(tbodySelector);
  if (!tbody)
    throw new Error(
      `No se encontró el elemento tbody con selector ${tbodySelector}`
    );

  tbody.innerHTML = "";
  const frag = document.createDocumentFragment();

  slots.forEach((s, i) => {
    const tr = document.createElement("tr");

    tr.style.setProperty("--i", i);

    tr.dataset.date = dateISO;
    tr.dataset.start = String(s.startHour);
    tr.dataset.end = String(s.endHour);

    const tdHorario = document.createElement("td");
    tdHorario.textContent = formatRange(s.startHour, s.endHour);

    const tdEstado = document.createElement("td");
    const btn = document.createElement("button");
    btn.type = "button";

    if (s.available) {
      btn.className = "estado_disponible";
      btn.textContent = "Disponible";
      btn.setAttribute(
        "aria-label",
        `Reservar franja ${formatRange(s.startHour, s.endHour)}`
      );
      btn.value = String(s.startHour);
    } else {
      btn.className = "estado_reservado";
      btn.textContent = "Reservado";
      btn.disabled = true;
      btn.setAttribute("aria-disabled", "true");
      btn.setAttribute(
        "aria-label",
        `Franja ${formatRange(s.startHour, s.endHour)} reservada`
      );
    }

    tdEstado.appendChild(btn);
    tr.appendChild(tdHorario);
    tr.appendChild(tdEstado);
    frag.appendChild(tr);
  });

  tbody.appendChild(frag);
}
