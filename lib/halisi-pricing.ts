export function convertMawimbiToHalisiPrice(rawPrice: number | string): number {
  const numeric = typeof rawPrice === "number" ? rawPrice : parseFloat(String(rawPrice));
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;

  let discount = 250;
  if (numeric <= 1000) discount = 50;
  else if (numeric <= 3000) discount = 150;
  else if (numeric <= 5000) discount = 200;

  return Math.max(0, Math.round((numeric - discount) * 100) / 100);
}
