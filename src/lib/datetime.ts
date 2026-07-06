const TIME_ZONE = "Asia/Tashkent";

export function localDate(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const year = parts.find((part) => part.type === "year")?.value || String(value.getFullYear());
  const month = parts.find((part) => part.type === "month")?.value || String(value.getMonth() + 1).padStart(2, "0");
  const day = parts.find((part) => part.type === "day")?.value || String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function localTime(value = new Date()) {
  return value.toLocaleTimeString("uz-UZ", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return new Date(value);
  return new Date(year, month - 1, day);
}
