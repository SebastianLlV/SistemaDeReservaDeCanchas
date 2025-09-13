//CURRENT DATE
const days = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado"
];
const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function getDate(day, month, year) {
  //Fallback
  const now = new Date();

  // 1) Cases: all or none
  const nonePassed =
    day === undefined && month === undefined && year === undefined;
  const allPassed =
    day !== undefined && month !== undefined && year !== undefined;

  if (!nonePassed && !allPassed) {
    throw new Error("Debes pasar día, mes y año, o ninguno.");
  }

  // 2) Human values (1–31, 1–12, 4 digits)
  const yearHuman = allPassed ? Number(year) : now.getFullYear();
  const monthHuman = allPassed ? Number(month) : now.getMonth() + 1; // 1–12
  const dayHuman = allPassed ? Number(day) : now.getDate(); // 1–31

  // 3) Validations
  if (!Number.isInteger(yearHuman) || yearHuman < 1000 || yearHuman > 9999)
    throw new Error("El año debe ser un entero de 4 dígitos.");
  if (!Number.isInteger(monthHuman) || monthHuman < 1 || monthHuman > 12)
    throw new Error("El mes debe estar entre 1 y 12.");
  if (!Number.isInteger(dayHuman) || dayHuman < 1 || dayHuman > 31)
    throw new Error("El día debe estar entre 1 y 31.");

  if (yearHuman !== now.getFullYear()) {
    throw new Error("El año debe ser el actual.");
  }

  const monthIdx = monthHuman - 1; // 0–11
  const d = new Date(yearHuman, monthIdx, dayHuman);

  const isValid =
    d.getFullYear() === yearHuman &&
    d.getMonth() === monthIdx &&
    d.getDate() === dayHuman;

  if (!isValid) throw new Error("Fecha inválida (p. ej., 31/02 no existe).");

  const iso = `${yearHuman}-${String(monthIdx + 1).padStart(2, "0")}-${String(
    dayHuman
  ).padStart(2, "0")}`;
  return { date: d, dayHuman, monthHuman, yearHuman, iso }; //ISO FOR BACKEND
}

export function formatDateLabel(date) {
  const dayName = days[date.getDay()];
  const dayNumber = date.getDate();
  const monthName = months[date.getMonth()];
  const yearNum = date.getFullYear();
  return `${dayName}, ${dayNumber} de ${monthName} de ${yearNum}`;
}
