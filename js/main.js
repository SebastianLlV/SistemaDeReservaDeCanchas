import { getDate, formatDateLabel } from "./modules/dateHandler.js";
import {
  START_HOUR,
  END_HOUR,
  ensureDay,
  getDayState,
  hasDay,
  initDay,
} from "./modules/scheduleStore.js";
import { buildHourlySlotsTable } from "./modules/slotsBuilder.js";
import { renderSlots } from "./modules/tableRenderer.js";
import { forEachReservation, getReservedHours } from "./modules/storage.js";

function firstAvailableHour(iso) {
  // Return the first available hour for the provided ISO date (fallback to START_HOUR)
  const { available } = getDayState(iso);
  return available && available.length ? available[0] : START_HOUR;
}

function showDateError(msg) {
  // Show the error near the date picker, fallback to alert if the element doesn't exist
  const el = document.getElementById('selector-dia-error');
  if (!el) { alert(msg); return; }
  el.hidden = true;          // reset visibility
  void el.offsetWidth;       // reflow to restart CSS animation
  el.textContent = msg;
  el.hidden = false;
}

function clearDateError() {
  // Hide and clear the date error message
  const el = document.getElementById('selector-dia-error');
  if (el) { el.textContent = ''; el.hidden = true; }
}

function isoToDate(iso) {
  // Convert YYYY-MM-DD to a Date object (local timezone)
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function isPastISO(iso, todayIso = getDate().iso) {
  // Compare only the calendar date (ignore time of day)
  const a = isoToDate(iso); a.setHours(0,0,0,0);
  const b = isoToDate(todayIso); b.setHours(0,0,0,0);
  return a.getTime() < b.getTime();
}

// -- RENDER: subtitle/table --
function renderSubtitle(meta) {
  // Render the human-readable date subtitle from a full meta object
  const subtitle = document.getElementById("dia-legible");
  if (subtitle) subtitle.textContent = formatDateLabel(meta.date);
}
function renderSubtitleFromISO(iso) {
  // Render the human-readable date subtitle from an ISO date string
  const el = document.getElementById("dia-legible");
  if (el) el.textContent = formatDateLabel(isoToDate(iso));
}
function renderDay(iso) {
  // 1) Read the state for the day
  const { available, reserved } = getDayState(iso);
  // 2) Build the slots array to feed the UI
  const slots = buildHourlySlotsTable({
    startHour: START_HOUR,
    endHour: END_HOUR,
    available,
    reserved,
  });
  // 3) Render the table rows
  renderSlots({ dateISO: iso, slots });
}

document.addEventListener("DOMContentLoaded", () => {
  // If coming back from payments with ?date=..., use that date
  const qsIso = new URLSearchParams(location.search).get("date");
  const meta = getDate();
  let currentIso = qsIso || meta.iso;

  // Hydrate store from localStorage (all persisted dates)
  forEachReservation((iso, hours) => { initDay(iso, hours); });

  // Initialize the current day if missing, using persisted hours if any
  if (!hasDay(currentIso)) initDay(currentIso, getReservedHours(currentIso));
  renderSubtitleFromISO(currentIso);
  renderDay(currentIso);

  // -- Date picker behavior --
  const picker = document.getElementById("selector-dia");
  if (picker) {
    picker.value = currentIso;
    picker.min   = meta.iso; // today as minimum

    picker.addEventListener("change", (e) => {
      const newISO = e.target.value;
      if (!newISO) return;

      if (isPastISO(newISO)) {
        showDateError("Reservas en días pasados no están permitidas.");
        picker.value = currentIso;
        return;
      }
      clearDateError();

      // Initialize day if it wasn't in memory (load from persistence if exists)
      if (!hasDay(newISO)) initDay(newISO, getReservedHours(newISO));

      renderDay(newISO);
      renderSubtitleFromISO(newISO);
      currentIso = newISO;
    });
  }

  // -- Click on a slot in the table -> navigate to payments with date & start hour
  document.getElementById("slots-tbody")?.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn || btn.disabled) return;

    const tr = btn.closest("tr");
    if (!tr) return;

    const dateISO   = tr.dataset.date;
    const startHour = tr.dataset.start;

    if (isPastISO(dateISO)) {
      showDateError("Reservas en días pasados no están permitidas.");
      return;
    }

    const payUrl = new URL("pagos.html", window.location.href);
    payUrl.searchParams.set("date",  dateISO);
    payUrl.searchParams.set("start", startHour);
    window.location.assign(payUrl.href);
  });

  // ============================================================
  // -- PACKAGE BUTTONS (cards) --
  // Delegated click handler to read data-* and navigate to payments
  // ============================================================
  const paquetesContainer = document.querySelector(
    "#precios_paquetes .precios__card_container"
  );

  paquetesContainer?.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-paquete");
    if (!btn) return;

    // Read data attributes from the clicked button
    const pkgId    = btn.dataset.pkgId;      // "medio_dia" | "dia_completo"
    const duration = btn.dataset.duration;   // "5" | "10"
    if (!pkgId || !duration) return;

    if (isPastISO(currentIso)) {
      showDateError("Reservas en días pasados no están permitidas.");
      return;
    }

    ensureDay(currentIso);
    const startHour = String(firstAvailableHour(currentIso));

    if (getDayState(currentIso).available.length === 0) {
      showDateError("No hay horas disponibles para este día.");
      return;
    }

    const payUrl = new URL("pagos.html", window.location.href);
    payUrl.searchParams.set("date",     currentIso);
    payUrl.searchParams.set("start",    startHour);
    payUrl.searchParams.set("package",  pkgId);
    payUrl.searchParams.set("duration", String(duration));
    window.location.assign(payUrl.href);
  });

  // ------------------------------------------------------------
  // -- NO PACKAGE: "Pay per Hour" button
  //    Requires a button with class .btn-sin-paquete inside the cards container
  // ------------------------------------------------------------
  paquetesContainer?.addEventListener("click", (e) => {
    const simpleBtn = e.target.closest(".btn-sin-paquete");
    if (!simpleBtn) return;

    if (isPastISO(currentIso)) {
      showDateError("Reservas en días pasados no están permitidas.");
      return;
    }

    ensureDay(currentIso);
    const startHour = String(firstAvailableHour(currentIso));

    if (getDayState(currentIso).available.length === 0) {
      showDateError("No hay horas disponibles para este día.");
      return;
    }

    const payUrl = new URL("pagos.html", window.location.href);
    payUrl.searchParams.set("date",  currentIso);
    payUrl.searchParams.set("start", startHour);
    window.location.assign(payUrl.href);
  });
});
