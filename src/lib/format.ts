export function formatUZS(n: number) {
  return new Intl.NumberFormat("uz-UZ").format(n) + " so'm";
}

export function formatDate(d: string) {
  try { return new Date(d).toLocaleDateString("uz-UZ", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
}

export function isOverdue(deadline: string) {
  return new Date(deadline) < new Date(new Date().toDateString());
}
