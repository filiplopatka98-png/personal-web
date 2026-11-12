/**
 * Poradie projektov v zoznamoch a pri „ďalší projekt“: najnovší rok prvý,
 * v rámci roka podľa `order` (ručné poradie). Rok sa berie z `year`.
 */
export function compareProjects(
  a: { data: { year: string; order: number } },
  b: { data: { year: string; order: number } },
): number {
  const ya = parseInt(a.data.year, 10) || 0;
  const yb = parseInt(b.data.year, 10) || 0;
  if (ya !== yb) return yb - ya;
  return a.data.order - b.data.order;
}
