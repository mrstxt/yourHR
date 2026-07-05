import { parseLocalDate } from "@/lib/datetime";

export function formatUZS(n: number) {
  return new Intl.NumberFormat("uz-UZ").format(n) + " so'm";
}

export function formatDate(d: string) {
  try { return parseLocalDate(d).toLocaleDateString("uz-UZ", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
}

export function isOverdue(deadline: string) {
  const today = new Date();
  return parseLocalDate(deadline) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
}
