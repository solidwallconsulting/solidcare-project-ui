/** Simple demo reference generator for mock creates. */
export function nextReference(prefix: string): string {
  const year = new Date().getFullYear();
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${year}-${suffix}`;
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function toggleSort(
  current: { sortBy?: string; sortDir: "asc" | "desc" },
  by: string,
): { sortBy: string; sortDir: "asc" | "desc" } {
  if (current.sortBy === by) {
    return { sortBy: by, sortDir: current.sortDir === "asc" ? "desc" : "asc" };
  }
  return { sortBy: by, sortDir: "asc" };
}
