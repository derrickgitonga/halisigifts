export function formatCurrency(amount: number | string): string {
  const numeric = typeof amount === "number" ? amount : parseFloat(String(amount)) || 0;
  return `KSh ${numeric.toLocaleString("en-KE")}`;
}
