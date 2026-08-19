import express from "express";
import {
  initDb,
  getPrizes,
  addPrize,
  updatePrize,
  deletePrize,
  getOtps,
  addOtp,
  deleteOtp,
  updateOtpUsage,
  getUsers,
  upsertUser,
} from "./lib/db";

const app = express();
app.use(express.json());

// Server-side active session state
let currentEmail: string | null = null;
let adminLoggedIn = false;

// Initialize database tables
initDb().then(() => {
  console.log("Express background database integration successfully initialized.");
});

// GET complete state for frontend sync
app.get("/api/state", async (req, res) => {
  try {
    const prizes = await getPrizes();
    const otps = await getOtps();
    const users = await getUsers();

    res.json({
      prizes,
      otps,
      users,
      currentEmail,
      adminLoggedIn,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch state" });
  }
});

// Admin Login
app.post("/api/auth/admin-login", (req, res) => {
  const { username, password } = req.body;
  const expectedAdminEmail = process.env.ADMIN_EMAIL || "admin";
  const expectedAdminPassword = process.env.ADMIN_PASSWORD || "admin123";

  const normalizedUsername = username?.trim();

  if (normalizedUsername === expectedAdminEmail && password === expectedAdminPassword) {
    adminLoggedIn = true;
    currentEmail = null;
    res.json({ ok: true, isAdmin: true });
  } else {
    res.status(401).json({ error: "Kredensial admin tidak valid" });
  }
});

// Admin Logout
app.post("/api/auth/admin-logout", (req, res) => {
  adminLoggedIn = false;
  res.json({ ok: true });
});

// User Login / Registration
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password wajib diisi" });
  }

  const normalizedEmail = email.trim();
  const normalizedPassword = password;

  const expectedAdminEmail = process.env.ADMIN_EMAIL || "admin";
  const expectedAdminPassword = process.env.ADMIN_PASSWORD || "admin123";

  try {
    // 1. Check if the login matches the ADMIN credentials from .env
    if (normalizedEmail === expectedAdminEmail && normalizedPassword === expectedAdminPassword) {
      adminLoggedIn = true;
      currentEmail = null;
      return res.json({ ok: true, isAdmin: true });
    }

    // 2. Regular user - ANYONE can login with any email/password, credentials are saved
    const users = await getUsers();
    const existing = users.find((u) => u.email === normalizedEmail);

    if (existing) {
      await upsertUser(
        normalizedEmail,
        normalizedPassword,
        existing.otpCode,
        existing.prizesWon,
        existing.spins,
      );
    } else {
      await upsertUser(normalizedEmail, normalizedPassword, null, [], 0);
    }

    currentEmail = normalizedEmail;
    adminLoggedIn = false;
    res.json({ ok: true, isAdmin: false, email: normalizedEmail });
  } catch (err) {
    console.error("Login process error:", err);
    res.status(500).json({ error: "Proses login gagal" });
  }
});

// User Logout
app.post("/api/auth/user-logout", (req, res) => {
  currentEmail = null;
  res.json({ ok: true });
});

// CRUD Prizes
app.post("/api/prizes", async (req, res) => {
  const { name, icon } = req.body;
  if (!name) return res.status(400).json({ error: "Nama hadiah wajib diisi" });
  const id = "p_" + Math.random().toString(36).slice(2, 10);
  try {
    await addPrize(id, name, icon || "🎁");
    res.json({ ok: true, prize: { id, name, icon } });
  } catch (err) {
    res.status(500).json({ error: "Gagal menyimpan hadiah" });
  }
});

app.put("/api/prizes/:id", async (req, res) => {
  const { id } = req.params;
  const { name, icon } = req.body;
  try {
    await updatePrize(id!, name, icon);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Gagal memperbarui hadiah" });
  }
});

app.delete("/api/prizes/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await deletePrize(id!);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Gagal menghapus hadiah" });
  }
});

// CRUD OTPs
app.post("/api/otps", async (req, res) => {
  const { code, prizeIds, winningPrizeId, limit } = req.body;
  if (!code || !prizeIds) return res.status(400).json({ error: "Data OTP tidak lengkap" });

  try {
    const otps = await getOtps();
    if (otps.some((o) => o.code === code)) {
      return res.status(400).json({ error: "Kode OTP sudah digunakan, gunakan kode lain." });
    }
    await addOtp(code, prizeIds, winningPrizeId || null, Number(limit) || 1);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Gagal menyimpan OTP" });
  }
});

app.delete("/api/otps/:code", async (req, res) => {
  const { code } = req.params;
  try {
    await deleteOtp(code!);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Gagal menghapus OTP" });
  }
});

// Submit OTP
app.post("/api/auth/submit-otp", async (req, res) => {
  const { code } = req.body;
  if (!currentEmail) return res.status(401).json({ error: "Silakan login terlebih dahulu" });
  if (!code) return res.status(400).json({ error: "Kode OTP harus diisi" });

  try {
    const otps = await getOtps();
    const otp = otps.find((o) => o.code === code.trim());

    if (!otp) return res.status(404).json({ error: "Kode OTP tidak valid" });
    if (otp.usedBy && otp.usedBy !== currentEmail) {
      return res.status(400).json({ error: "Kode OTP ini sudah digunakan oleh user lain" });
    }
    if (otp.used >= otp.limit) {
      return res.status(400).json({ error: "Kuota spin untuk kode OTP ini sudah habis" });
    }

    // Link OTP with user
    const users = await getUsers();
    const user = users.find((u) => u.email === currentEmail);
    if (user) {
      await updateOtpUsage(otp.code, otp.used, currentEmail);
      await upsertUser(currentEmail, user.password, otp.code, user.prizesWon, user.spins);
    }

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Gagal mengirimkan OTP" });
  }
});

// Spin the wheel
app.post("/api/spin", async (req, res) => {
  if (!currentEmail) return res.status(401).json({ error: "Silakan login terlebih dahulu" });

  try {
    const users = await getUsers();
    const user = users.find((u) => u.email === currentEmail);
    if (!user || !user.otpCode) {
      return res.status(400).json({ error: "Silakan submit kode OTP Anda terlebih dahulu" });
    }

    const otps = await getOtps();
    const otp = otps.find((o) => o.code === user.otpCode);
    if (!otp) return res.status(400).json({ error: "Kode OTP tidak ditemukan" });
    if (otp.used >= otp.limit) {
      return res.status(400).json({ error: "Kuota spin sudah habis" });
    }

    const prizes = await getPrizes();
    const prize =
      prizes.find((p) => p.id === otp.winningPrizeId) ??
      prizes.find((p) => p.id === otp.prizeIds[0]);

    if (!prize) {
      return res.status(400).json({ error: "Hadiah belum dikonfigurasi oleh admin" });
    }

    // Increment OTP usage and award user the prize
    await updateOtpUsage(otp.code, otp.used + 1, currentEmail);
    await upsertUser(
      currentEmail,
      user.password,
      user.otpCode,
      [...user.prizesWon, prize.name],
      user.spins + 1,
    );

    res.json({ ok: true, prize });
  } catch (err) {
    res.status(500).json({ error: "Gagal memutar roda hadiah" });
  }
});

const PORT = 3002;
export function startExpressServer() {
  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Backend ExpressJS server successfully listening on http://127.0.0.1:${PORT}`);
  });
}
