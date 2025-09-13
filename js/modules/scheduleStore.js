export const START_HOUR = 8; // 8 AM
export const END_HOUR = 21; // 9 PM

// State by day ISO -> { available: number[], reserved: number[] }
const daysState = new Map();

const inRange = (n) => Number.isInteger(n) && n >= START_HOUR && n < END_HOUR;

function normalizeHours(arr) {
  return Array.from(new Set(arr.map(Number).filter(inRange))).sort(
    (a, b) => a - b
  );
}

function fullRange() {
  const out = [];
  for (let h = START_HOUR; h < END_HOUR; h++) out.push(h);
  return out;
}

export function getDayState(isoDate) {
  const s = daysState.get(isoDate);
  if (!s) return { available: fullRange(), reserved: [] };
  return { available: [...s.available], reserved: [...s.reserved] };
}

export function initDay(isoDate, reserved = []) {
  const res = normalizeHours(reserved);
  const av = fullRange().filter((h) => !res.includes(h));
  daysState.set(isoDate, { available: av, reserved: res });
  return getDayState(isoDate);
}

export function listSlots(isoDate) {
  const s = daysState.get(isoDate);
  if (!s) return [];
  const avSet = new Set(s.available);
  const out = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    out.push({ startHour: h, endHour: h + 1, available: avSet.has(h) });
  }
  return out;
}

export function reserveHours(isoDate, hours = []) {
  const s = daysState.get(isoDate);
  if (!s) return getDayState(isoDate); // You cannot reserve in a not initialized day
  const toReserve = new Set(normalizeHours(hours));
  s.available = s.available.filter((h) => !toReserve.has(h));
  s.reserved = normalizeHours([...s.reserved, ...toReserve]);
  return getDayState(isoDate);
}

export function realeaseHours(isoDate, hours = []) {
    const s = daysState.get(isoDate);
    if (!s) return getDayState(isoDate); // You cannot release in a not initialized day
    const toRelease = new Set(normalizeHours(hours));
    s.reserved = s.reserved.filter(h => !toRelease.has(h));
    s.available = normalizeHours([...s.available, ...toRelease]);
    return getDayState(isoDate);
}

// Reset debug function
export function resetDay(isoDate) {
  const s = daysState.get(isoDate);
  if (!s) return getDayState(isoDate);
  s.available = normalizeHours([...s.available, ...s.reserved]);
  s.reserved  = [];
  return getDayState(isoDate);
}

export function hasDay(isoDate) {
    return daysState.has(isoDate);
}

export function ensureDay(isoDate) {
    if (!daysState.has(isoDate)) {
        initDay(isoDate);
    }
    return getDayState(isoDate);
}