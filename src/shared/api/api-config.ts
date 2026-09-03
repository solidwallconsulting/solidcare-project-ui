/**
 * Centralized API configuration.
 * The base URL always comes from the environment — never hardcode it in features.
 */
export const apiConfig = {
  baseUrl: (import.meta.env["VITE_API_URL"] as string | undefined) ?? "",
  /** When no backend is configured the app runs on the mock API layer. */
  get useMocks(): boolean {
    return !this.baseUrl;
  },
  timeoutMs: 15000,
  /** Simulated latency for the mock layer, keeps loading states honest. */
  mockLatencyMs: 220,
} as const;
