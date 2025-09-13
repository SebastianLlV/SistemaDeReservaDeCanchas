// js/pago.js
import { getDate, formatDateLabel } from "./modules/dateHandler.js";
import { START_HOUR, END_HOUR } from "./modules/scheduleStore.js";

/* ------------ DOM Helpers ------------ */
function setInputValue(sel, value) {
  const el = document.querySelector(sel);
  if (el) el.value = value;
}
function setSelectValue(sel, value) {
  const el = document.querySelector(sel);
  if (!el) return;
  el.value = String(value);
}

/* Select first non-disabled, non-empty option (for placeholders) */
function selectFirstUsableOption(selectEl) {
  if (!selectEl) return false;
  for (const opt of selectEl.options) {
    if (!opt.disabled && opt.value !== "") {
      selectEl.value = opt.value;
      return true;
    }
  }
  return false;
}

/* ------------ Date Helpers ------------ */
function isoToDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function isPastISO(iso, todayIso = getDate().iso) {
  const a = isoToDate(iso); a.setHours(0, 0, 0, 0);
  const b = isoToDate(todayIso); b.setHours(0, 0, 0, 0);
  return a.getTime() < b.getTime();
}

/* ------------ Error UI ------------ */
function showPayDateError(msg) {
  const el = document.getElementById('pago-error');
  if (!el) { alert(msg); return; }

  el.textContent = msg;

  // restart animation every time
  el.hidden = true;
  el.classList.remove('is-visible');
  void el.offsetWidth;          // force reflow to reset animations
  el.hidden = false;
  el.classList.add('is-visible');
}

function clearPayDateError() {
  const el = document.getElementById('pago-error');
  if (el) {
    el.hidden = true;
    el.classList.remove('is-visible');
    el.textContent = '';
  }
}

/* ------------ Formatting ------------ */
const COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});
function to12h(h24) {
  const isPM = h24 >= 12;
  let h = h24 % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:00 ${isPM ? "PM" : "AM"}`;
}

/* ------------ Pricing config ------------ */
const PRICE_PER_HOUR = 120_000;
const PACKAGE_PRICES = { medio_dia: 400_000, dia_completo: 650_000 };
const SERVICE_PRICES = { rentar_equipamiento: 80_000, agua_extra: 10_000, petos: 20_000, comida: 50_000 };
const DUR_FOR_PACKAGE = {
  medio_dia:    { value: "5",  label: "5 Horas (Medio Día)" },
  dia_completo: { value: "10", label: "10 Horas (Día Completo)" },
};

let BASE_DURATION_OPTIONS = [];

function readOptions(selectEl) {
  return Array.from(selectEl.options).map(opt => ({ value: opt.value, label: opt.text }));
}
function setOptions(selectEl, options) {
  selectEl.innerHTML = "";
  for (const { value, label } of options) selectEl.add(new Option(label, value));
}
function applyPackageDuration(pkgId, durSel) {
  if (!durSel) return;
  if (pkgId in DUR_FOR_PACKAGE) {
    const cfg = DUR_FOR_PACKAGE[pkgId];
    setOptions(durSel, [cfg]);
    durSel.value = cfg.value;
    durSel.disabled = true;
  } else {
    setOptions(durSel, BASE_DURATION_OPTIONS);
    durSel.disabled = false;
    if (!durSel.value && BASE_DURATION_OPTIONS.length) {
      durSel.value = BASE_DURATION_OPTIONS[0].value;
    }
  }
}

/* ------------ Validation ------------ */
function validateRangeOrDisableSubmit(start, dur) {
  const s = Number(start);
  const d = Number(dur || 1);
  const ok = s >= START_HOUR && s + d <= END_HOUR;

  const submit =
    document.querySelector(".formulario__boton") ||
    document.querySelector('button[type="submit"]');

  if (!ok) {
    showPayDateError(
      `La reserva (${to12h(s)}–${to12h(s + d)}) se sale del horario permitido ` +
      `(${to12h(START_HOUR)}–${to12h(END_HOUR)}).`
    );
    if (submit) submit.disabled = true;
  } else {
    clearPayDateError();
    if (submit) submit.disabled = false;
  }
  return ok;
}

/* ------------ Resumen + Price ------------ */
function getSelectedServicios(selectEl) {
  if (!selectEl) return [];
  return Array.from(selectEl.selectedOptions).map(opt => opt.value);
}
function getSelectedServiciosLabels(selectEl) {
  if (!selectEl) return [];
  return Array.from(selectEl.selectedOptions).map(opt => opt.text);
}
function computePrice({ pkg, duration, servicios }) {
  if (pkg && PACKAGE_PRICES[pkg]) {
    const base = PACKAGE_PRICES[pkg];
    const extras = (servicios || []).reduce((sum, key) => sum + (SERVICE_PRICES[key] || 0), 0);
    return base + extras;
  }
  const hours = Number(duration || 1);
  const base = PRICE_PER_HOUR * hours;
  const extras = (servicios || []).reduce((sum, key) => sum + (SERVICE_PRICES[key] || 0), 0);
  return base + extras;
}

function updateResumenAndPrice({ fechaInput, horaSel, durSel, pkgSel, serviciosSel, jugadoresSel }) {
  const dateISO = fechaInput?.value || getDate().iso;
  const start   = Number(horaSel?.value || START_HOUR);
  const dur     = Number(durSel?.value || 1);
  const end     = start + dur;

  const pkgVal   = pkgSel?.value || "no_aplica";
  const pkgLabel = pkgSel?.selectedOptions?.[0]?.text || "No Aplica";

  const serviciosValues = getSelectedServicios(serviciosSel);
  const serviciosLabels = getSelectedServiciosLabels(serviciosSel);

  const fechaEl     = document.getElementById("resumen-fecha");
  const horarioEl   = document.getElementById("resumen-horario");
  const jugadoresEl = document.getElementById("resumen-jugadores");
  const duracionEl  = document.getElementById("resumen-duracion");
  const precioEl    = document.getElementById("resumen-precio");
  const paqueteEl   = document.getElementById("resumen-paquete");
  const serviciosEl = document.getElementById("resumen-servicios");

  if (fechaEl)   fechaEl.textContent = formatDateLabel(isoToDate(dateISO));
  if (horarioEl) horarioEl.textContent = `${to12h(start)} - ${to12h(end)}`;
  if (duracionEl) duracionEl.textContent = `${dur} ${dur === 1 ? "hora" : "horas"}`;
  if (paqueteEl)  paqueteEl.textContent = pkgLabel;
  if (serviciosEl) serviciosEl.textContent = serviciosLabels.length ? serviciosLabels.join(", ") : "Ninguno";

  // Ensure there's a visible label for "Jugadores"
  let jugadoresLabel = jugadoresSel?.selectedOptions?.[0]?.text?.trim() || "";
  if (!jugadoresLabel && jugadoresSel) {
    // If placeholder was selected, try to pick first usable option as fallback
    if (selectFirstUsableOption(jugadoresSel)) {
      jugadoresLabel = jugadoresSel.selectedOptions?.[0]?.text || "";
    }
  }
  if (jugadoresEl) jugadoresEl.textContent = jugadoresLabel;

  const total = computePrice({ pkg: pkgVal, duration: dur, servicios: serviciosValues });
  if (precioEl) precioEl.textContent = COP.format(total);
}

document.addEventListener("DOMContentLoaded", () => {
  const params   = new URLSearchParams(window.location.search);
  const todayISO = getDate().iso;

  let   dateISO   = params.get("date") || todayISO;
  const startHour = params.get("start");
  const pkg       = params.get("package");
  let   duration  = params.get("duration");

  const fechaInput   = document.querySelector("#fecha");
  const horaSel      = document.querySelector("#hora_inicio");
  const durSel       = document.querySelector("#duracion");
  const pkgSel       = document.querySelector("#paquete");
  const serviciosSel = document.querySelector("#servicios_opcionales");
  const jugadoresSel = document.querySelector("#numero_jugadores");

  if (fechaInput) fechaInput.min = todayISO;

  if (isPastISO(dateISO, todayISO)) {
    dateISO = todayISO;
    showPayDateError("La fecha seleccionada era pasada. Se ajustó a hoy.");
    params.set("date", dateISO);
    window.history.replaceState({}, "", `${location.pathname}?${params.toString()}`);
  }

  if (durSel && BASE_DURATION_OPTIONS.length === 0) {
    BASE_DURATION_OPTIONS = readOptions(durSel);
  }

  setInputValue("#fecha", dateISO);
  if (startHour) setSelectValue("#hora_inicio", startHour);
  if (pkg)       setSelectValue("#paquete",    pkg);

  if (pkg) {
    applyPackageDuration(pkg, durSel);
    duration = durSel?.value || duration || "1";
  } else if (duration && durSel) {
    const exists = Array.from(durSel.options).some(opt => opt.value === String(duration));
    if (exists) durSel.value = String(duration);
  }

  // NEW: if "Jugadores" is on placeholder, pick first usable option as default
  if (jugadoresSel && (!jugadoresSel.value || jugadoresSel.value === "")) {
    selectFirstUsableOption(jugadoresSel);
  }

  validateRangeOrDisableSubmit(horaSel?.value ?? START_HOUR, durSel?.value ?? duration ?? "1");
  updateResumenAndPrice({ fechaInput, horaSel, durSel, pkgSel, serviciosSel, jugadoresSel });

  fechaInput?.addEventListener("change", () => {
    updateResumenAndPrice({ fechaInput, horaSel, durSel, pkgSel, serviciosSel, jugadoresSel });
  });
  horaSel?.addEventListener("change", () => {
    validateRangeOrDisableSubmit(horaSel.value, durSel?.value || "1");
    updateResumenAndPrice({ fechaInput, horaSel, durSel, pkgSel, serviciosSel, jugadoresSel });
  });
  durSel?.addEventListener("change", () => {
    validateRangeOrDisableSubmit(horaSel?.value ?? START_HOUR, durSel.value);
    updateResumenAndPrice({ fechaInput, horaSel, durSel, pkgSel, serviciosSel, jugadoresSel });
  });
  pkgSel?.addEventListener("change", (e) => {
    const newPkg = e.target.value;
    applyPackageDuration(newPkg, durSel);
    validateRangeOrDisableSubmit(horaSel?.value ?? START_HOUR, durSel?.value || "1");
    updateResumenAndPrice({ fechaInput, horaSel, durSel, pkgSel, serviciosSel, jugadoresSel });
  });
  serviciosSel?.addEventListener("change", () => {
    updateResumenAndPrice({ fechaInput, horaSel, durSel, pkgSel, serviciosSel, jugadoresSel });
  });
  jugadoresSel?.addEventListener("change", () => {
    updateResumenAndPrice({ fechaInput, horaSel, durSel, pkgSel, serviciosSel, jugadoresSel });
  });

  document.querySelector("#hora_inicio")?.focus();
});
