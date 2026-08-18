import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Prize = { id: string; name: string; icon: string };
export type Otp = {
  code: string;
  prizeIds: string[];
  winningPrizeId: string | null;
  limit: number;
  used: number;
  usedBy: string | null;
};
export type AppUser = {
  email: string;
  password: string;
  otpCode: string | null;
  prizesWon: string[];
  spins: number;
  createdAt: number;
};

type State = {
  prizes: Prize[];
  otps: Otp[];
  users: AppUser[];
  currentEmail: string | null;
  adminLoggedIn: boolean;
};

export const DEMO_USER = { email: "user@demo.com", password: "user123" };
export const DEMO_ADMIN = { username: "admin", password: "admin123" };

const defaultState: State = {
  prizes: [],
  otps: [],
  users: [],
  currentEmail: null,
  adminLoggedIn: false,
};

type Ctx = {
  state: State;
  addPrize: (name: string, icon: string) => Promise<void>;
  updatePrize: (id: string, name: string, icon: string) => Promise<void>;
  deletePrize: (id: string) => Promise<void>;
  createOtp: (
    code: string,
    prizeIds: string[],
    winningPrizeId: string | null,
    limit: number,
  ) => Promise<void>;
  deleteOtp: (code: string) => Promise<void>;
  loginUser: (email: string, password: string) => Promise<boolean>;
  logoutUser: () => Promise<void>;
  submitOtp: (code: string) => Promise<{ ok: boolean; error?: string }>;
  spin: () => Promise<{ ok: boolean; prize?: Prize; error?: string }>;
  setAdmin: (v: boolean) => Promise<void>;
  currentUser: AppUser | null;
  currentOtp: Otp | null;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(defaultState);

  const syncState = async () => {
    try {
      const res = await fetch("/api/state");
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (err) {
      console.error("Failed to sync store state with Express backend:", err);
    }
  };

  useEffect(() => {
    syncState();
  }, []);

  const value = useMemo<Ctx>(() => {
    const currentUser = state.users.find((u) => u.email === state.currentEmail) ?? null;
    const currentOtp = state.otps.find((o) => o.code === currentUser?.otpCode) ?? null;

    return {
      state,
      currentUser,
      currentOtp,
      setAdmin: async (v) => {
        const endpoint = v ? "/api/auth/admin-login" : "/api/auth/admin-logout";
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: "admin", password: "admin123" }),
          });
          if (res.ok) {
            await syncState();
          }
        } catch (err) {
          console.error(err);
        }
      },
      addPrize: async (name, icon) => {
        try {
          const res = await fetch("/api/prizes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, icon }),
          });
          if (res.ok) {
            await syncState();
          }
        } catch (err) {
          console.error(err);
        }
      },
      updatePrize: async (id, name, icon) => {
        try {
          const res = await fetch(`/api/prizes/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, icon }),
          });
          if (res.ok) {
            await syncState();
          }
        } catch (err) {
          console.error(err);
        }
      },
      deletePrize: async (id) => {
        try {
          const res = await fetch(`/api/prizes/${id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            await syncState();
          }
        } catch (err) {
          console.error(err);
        }
      },
      createOtp: async (code, prizeIds, winningPrizeId, limit) => {
        try {
          const res = await fetch("/api/otps", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, prizeIds, winningPrizeId, limit }),
          });
          if (res.ok) {
            await syncState();
          }
        } catch (err) {
          console.error(err);
        }
      },
      deleteOtp: async (code) => {
        try {
          const res = await fetch(`/api/otps/${code}`, {
            method: "DELETE",
          });
          if (res.ok) {
            await syncState();
          }
        } catch (err) {
          console.error(err);
        }
      },
      loginUser: async (email, password) => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          if (res.ok) {
            await syncState();
            return true;
          }
        } catch (err) {
          console.error(err);
        }
        return false;
      },
      logoutUser: async () => {
        try {
          const res = await fetch("/api/auth/user-logout", {
            method: "POST",
          });
          if (res.ok) {
            await syncState();
          }
        } catch (err) {
          console.error(err);
        }
      },
      submitOtp: async (code) => {
        try {
          const res = await fetch("/api/auth/submit-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          });
          const data = await res.json();
          if (res.ok) {
            await syncState();
            return { ok: true };
          }
          return { ok: false, error: data.error || "Gagal verifikasi OTP" };
        } catch (err) {
          return { ok: false, error: "Gagal menghubungkan ke server" };
        }
      },
      spin: async () => {
        try {
          const res = await fetch("/api/spin", {
            method: "POST",
          });
          const data = await res.json();
          if (res.ok) {
            await syncState();
            return { ok: true, prize: data.prize };
          }
          return { ok: false, error: data.error || "Gagal spin" };
        } catch (err) {
          return { ok: false, error: "Gagal menghubungkan ke server" };
        }
      },
    };
  }, [state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function randomOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
