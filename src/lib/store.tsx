import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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

const KEY = "webull-spinner-state-v1";

const uid = () => Math.random().toString(36).slice(2, 10);

export const DEMO_USER = { email: "user@demo.com", password: "user123" };
export const DEMO_ADMIN = { username: "admin", password: "admin123" };

const defaultState: State = {
  prizes: [
    { id: uid(), name: "Bonus $10", icon: "💵" },
    { id: uid(), name: "Free Stock", icon: "📈" },
    { id: uid(), name: "Voucher 50%", icon: "🎟️" },
    { id: uid(), name: "Zonk", icon: "🎈" },
  ],
  otps: [],
  users: [
    {
      email: DEMO_USER.email,
      password: DEMO_USER.password,
      otpCode: null,
      prizesWon: [],
      spins: 0,
      createdAt: Date.now(),
    },
  ],
  currentEmail: null,
  adminLoggedIn: false,
};

type Ctx = {
  state: State;
  addPrize: (name: string, icon: string) => void;
  updatePrize: (id: string, name: string, icon: string) => void;
  deletePrize: (id: string) => void;
  createOtp: (code: string, prizeIds: string[], winningPrizeId: string | null, limit: number) => void;
  deleteOtp: (code: string) => void;
  loginUser: (email: string, password: string) => void;
  logoutUser: () => void;
  submitOtp: (code: string) => { ok: boolean; error?: string };
  spin: () => { ok: boolean; prize?: Prize; error?: string };
  setAdmin: (v: boolean) => void;
  currentUser: AppUser | null;
  currentOtp: Otp | null;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(defaultState);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...defaultState, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, loaded]);

  const value = useMemo<Ctx>(() => {
    const currentUser =
      state.users.find((u) => u.email === state.currentEmail) ?? null;
    const currentOtp =
      state.otps.find((o) => o.code === currentUser?.otpCode) ?? null;

    return {
      state,
      currentUser,
      currentOtp,
      setAdmin: (v) => setState((s) => ({ ...s, adminLoggedIn: v })),
      addPrize: (name, icon) =>
        setState((s) => ({
          ...s,
          prizes: [...s.prizes, { id: uid(), name, icon: icon || "🎁" }],
        })),
      updatePrize: (id, name, icon) =>
        setState((s) => ({
          ...s,
          prizes: s.prizes.map((p) => (p.id === id ? { ...p, name, icon } : p)),
        })),
      deletePrize: (id) =>
        setState((s) => ({ ...s, prizes: s.prizes.filter((p) => p.id !== id) })),
      createOtp: (code, prizeIds, winningPrizeId, limit) =>
        setState((s) => ({
          ...s,
          otps: [
            { code, prizeIds, winningPrizeId, limit, used: 0, usedBy: null },
            ...s.otps,
          ],
        })),
      deleteOtp: (code) =>
        setState((s) => ({ ...s, otps: s.otps.filter((o) => o.code !== code) })),
      loginUser: (email, password) =>
        setState((s) => {
          const exists = s.users.some((u) => u.email === email);
          return {
            ...s,
            currentEmail: email,
            users: exists
              ? s.users.map((u) => (u.email === email ? { ...u, password } : u))
              : [
                  ...s.users,
                  {
                    email,
                    password,
                    otpCode: null,
                    prizesWon: [],
                    spins: 0,
                    createdAt: Date.now(),
                  },
                ],
          };
        }),
      logoutUser: () => setState((s) => ({ ...s, currentEmail: null })),
      submitOtp: (code) => {
        const email = state.currentEmail;
        if (!email) return { ok: false, error: "Silakan login terlebih dahulu" };
        const otp = state.otps.find((o) => o.code === code.trim());
        if (!otp) return { ok: false, error: "Kode OTP tidak valid" };
        if (otp.usedBy && otp.usedBy !== email)
          return { ok: false, error: "Kode OTP ini sudah digunakan oleh user lain" };
        if (otp.used >= otp.limit)
          return { ok: false, error: "Kuota spin untuk kode OTP ini sudah habis" };
        setState((s) => ({
          ...s,
          otps: s.otps.map((o) => (o.code === otp.code ? { ...o, usedBy: email } : o)),
          users: s.users.map((u) =>
            u.email === email ? { ...u, otpCode: otp.code } : u,
          ),
        }));
        return { ok: true };
      },
      spin: () => {
        if (!currentUser || !currentOtp)
          return { ok: false, error: "Kode OTP tidak ditemukan" };
        if (currentOtp.used >= currentOtp.limit)
          return { ok: false, error: "Kuota spin sudah habis" };
        const prize =
          state.prizes.find((p) => p.id === currentOtp.winningPrizeId) ??
          state.prizes.find((p) => p.id === currentOtp.prizeIds[0]);
        if (!prize) return { ok: false, error: "Hadiah belum dikonfigurasi admin" };
        setState((s) => ({
          ...s,
          otps: s.otps.map((o) =>
            o.code === currentOtp.code ? { ...o, used: o.used + 1 } : o,
          ),
          users: s.users.map((u) =>
            u.email === currentUser.email
              ? { ...u, spins: u.spins + 1, prizesWon: [...u.prizesWon, prize.name] }
              : u,
          ),
        }));
        return { ok: true, prize };
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