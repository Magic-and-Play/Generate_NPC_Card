export const calcAbilityModifier = score => Math.floor((score - 10) / 2);

// --- helpers: CR formatting & proficiency ---
export function parseCR(raw) {
  // Принимает число (0.125) или строку ("1/8", "2")
  if (raw == null) return null;
  if (typeof raw === "number") return raw;

  const s = String(raw).trim();
  if (s.includes("/")) {
    const [n, d] = s.split("/").map(Number);
    if (!isNaN(n) && !isNaN(d) && d !== 0) return n / d;
    return null;
  }
  const num = Number(s.replace(",", ".")); // на всякий случай
  return isNaN(num) ? null : num;
}

export function formatCR(value) {
  if (value == null) return null;
  const v = Number(value);

  // Почти-равенства для дробей
  const eq = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

  if (eq(v, 0)) return "0";
  if (eq(v, 0.125)) return "1/8";
  if (eq(v, 0.25)) return "1/4";
  if (eq(v, 0.5)) return "1/2";

  // Целые красиво без .0
  if (Number.isInteger(v)) return String(v);

  // На всякий случай: показать до 2 знаков
  return v.toFixed(2).replace(/\.00$/, "");
}

export function proficiencyByCR(rawCR) {
  const cr = parseCR(rawCR);
  if (cr == null) return null;

  if (cr <= 4) return 2; // включает 0, 1/8, 1/4, 1/2, 1..4
  if (cr <= 8) return 3;
  if (cr <= 12) return 4;
  if (cr <= 16) return 5;
  if (cr <= 20) return 6;
  if (cr <= 24) return 7;
  if (cr <= 28) return 8;
  return 9; // 29–30
}

export function extractFirstParagraph(html) {
  const match = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  if (!match) return null;
  return match[1].replace(/<\/?[^>]+(>|$)/g, "").trim();
}
