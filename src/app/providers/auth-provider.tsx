import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { setAuthTokenProvider } from "@/shared/api/api-client";
import type { AppRole } from "@/features/administration/types/role";

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AppRole;
}

interface Session {
  user: CurrentUser;
  /** Placeholder for a real JWT issued by the backend. */
  accessToken: string;
}

interface AuthContextValue {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  signIn: (email: string) => Promise<CurrentUser>;
  signOut: () => void;
}

const STORAGE_KEY = "solidcare-session";
const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Session container. Today the session is mocked locally; swapping `signIn`
 * for a real `POST /auth/login` call is the only change required later.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setSession(JSON.parse(raw) as Session);
      } catch {
        window.sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    setAuthTokenProvider(() => session?.accessToken ?? null);
  }, [session]);

  const signIn = useCallback(async (email: string) => {
    const local = email.split("@")[0] ?? "user";
    const [first = "Clinic", last = "Manager"] = local.split(/[._-]/);
    const user: CurrentUser = {
      id: "usr-current",
      firstName: first.charAt(0).toUpperCase() + first.slice(1),
      lastName: last.charAt(0).toUpperCase() + last.slice(1),
      email,
      role: "admin",
    };
    const next: Session = { user, accessToken: "mock-session-token" };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
    return user;
  }, []);

  const signOut = useCallback(() => {
    window.sessionStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: Boolean(session),
      isReady,
      signIn,
      signOut,
    }),
    [session, isReady, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
