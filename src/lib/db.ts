import pg from "pg";

const { Pool } = pg;

const hasPostgres = !!(process.env.DATABASE_URL || process.env.PGHOST);

let pool: pg.Pool | null = null;

if (hasPostgres) {
  console.log("PostgreSQL connection configuration found. Initializing Pool...");
  const isLocal =
    process.env.DATABASE_URL?.includes("localhost") ||
    process.env.DATABASE_URL?.includes("127.0.0.1");

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
    query_timeout: 5000,
    ssl: isLocal ? undefined : { rejectUnauthorized: false },
  });
} else {
  console.log("No PostgreSQL credentials or DATABASE_URL found. Using local server fallback.");
}

// In-memory or file-based fallback state
interface LocalState {
  prizes: Array<{ id: string; name: string; icon: string }>;
  otps: Array<{
    code: string;
    prizeIds: string[];
    winningPrizeId: string | null;
    limit: number;
    used: number;
    usedBy: string | null;
  }>;
  users: Array<{
    email: string;
    password: string;
    otpCode: string | null;
    prizesWon: string[];
    spins: number;
    createdAt: number;
  }>;
}

const localState: LocalState = {
  prizes: [
    { id: "p1", name: "Bonus $10", icon: "💵" },
    { id: "p2", name: "Free Stock", icon: "📈" },
    { id: "p3", name: "Voucher 50%", icon: "🎟️" },
    { id: "p4", name: "Zonk", icon: "🎈" },
  ],
  otps: [],
  users: [],
};

export async function initDb() {
  if (!pool) return;

  try {
    const client = await pool.connect();
    console.log("Successfully connected to PostgreSQL!");

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS prizes (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        icon VARCHAR(50) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS otps (
        code VARCHAR(50) PRIMARY KEY,
        prize_ids TEXT[] NOT NULL,
        winning_prize_id VARCHAR(50),
        limit_count INTEGER NOT NULL DEFAULT 1,
        used INTEGER NOT NULL DEFAULT 0,
        used_by VARCHAR(100)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        email VARCHAR(100) PRIMARY KEY,
        password VARCHAR(100) NOT NULL,
        otp_code VARCHAR(50),
        prizes_won TEXT[] NOT NULL DEFAULT '{}',
        spins INTEGER NOT NULL DEFAULT 0,
        created_at BIGINT NOT NULL
      );
    `);

    // Seed default prizes if empty
    const prizeCheck = await client.query("SELECT COUNT(*) FROM prizes");
    if (parseInt(prizeCheck.rows[0].count, 10) === 0) {
      console.log("Seeding default prizes in PostgreSQL...");
      for (const p of localState.prizes) {
        await client.query("INSERT INTO prizes (id, name, icon) VALUES ($1, $2, $3)", [
          p.id,
          p.name,
          p.icon,
        ]);
      }
    }

    // Seed default user if empty and defined
    const userCheck = await client.query("SELECT COUNT(*) FROM users");
    if (parseInt(userCheck.rows[0].count, 10) === 0 && localState.users.length > 0) {
      console.log("Seeding default user in PostgreSQL...");
      const u = localState.users[0]!;
      await client.query(
        "INSERT INTO users (email, password, otp_code, prizes_won, spins, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
        [u.email, u.password, u.otpCode, u.prizesWon, u.spins, u.createdAt],
      );
    }

    client.release();
    console.log("PostgreSQL database tables verified and seeded.");
  } catch (err) {
    console.error("Failed to initialize PostgreSQL tables, falling back to local storage:", err);
    pool = null; // Force fallback on query failure
  }
}

// DB helper functions supporting both modes
export async function getPrizes() {
  if (pool) {
    try {
      const res = await pool.query("SELECT * FROM prizes");
      return res.rows.map((r) => ({ id: r.id, name: r.name, icon: r.icon }));
    } catch (err) {
      console.error("DB Error in getPrizes, falling back:", err);
      pool = null;
    }
  }
  return localState.prizes;
}

export async function addPrize(id: string, name: string, icon: string) {
  if (pool) {
    try {
      await pool.query("INSERT INTO prizes (id, name, icon) VALUES ($1, $2, $3)", [id, name, icon]);
      return;
    } catch (err) {
      console.error("DB Error in addPrize, falling back:", err);
      pool = null;
    }
  }
  localState.prizes.push({ id, name, icon });
}

export async function updatePrize(id: string, name: string, icon: string) {
  if (pool) {
    try {
      await pool.query("UPDATE prizes SET name = $2, icon = $3 WHERE id = $1", [id, name, icon]);
      return;
    } catch (err) {
      console.error("DB Error in updatePrize, falling back:", err);
      pool = null;
    }
  }
  localState.prizes = localState.prizes.map((p) => (p.id === id ? { id, name, icon } : p));
}

export async function deletePrize(id: string) {
  if (pool) {
    try {
      await pool.query("DELETE FROM prizes WHERE id = $1", [id]);
      return;
    } catch (err) {
      console.error("DB Error in deletePrize, falling back:", err);
      pool = null;
    }
  }
  localState.prizes = localState.prizes.filter((p) => p.id !== id);
}

export async function getOtps() {
  if (pool) {
    try {
      const res = await pool.query("SELECT * FROM otps");
      return res.rows.map((r) => ({
        code: r.code,
        prizeIds: r.prize_ids,
        winningPrizeId: r.winning_prize_id,
        limit: r.limit_count,
        used: r.used,
        usedBy: r.used_by,
      }));
    } catch (err) {
      console.error("DB Error in getOtps, falling back:", err);
      pool = null;
    }
  }
  return localState.otps;
}

export async function addOtp(
  code: string,
  prizeIds: string[],
  winningPrizeId: string | null,
  limit: number,
) {
  if (pool) {
    try {
      await pool.query(
        "INSERT INTO otps (code, prize_ids, winning_prize_id, limit_count, used, used_by) VALUES ($1, $2, $3, $4, $5, $6)",
        [code, prizeIds, winningPrizeId, limit, 0, null],
      );
      return;
    } catch (err) {
      console.error("DB Error in addOtp, falling back:", err);
      pool = null;
    }
  }
  localState.otps.unshift({ code, prizeIds, winningPrizeId, limit, used: 0, usedBy: null });
}

export async function deleteOtp(code: string) {
  if (pool) {
    try {
      await pool.query("DELETE FROM otps WHERE code = $1", [code]);
      return;
    } catch (err) {
      console.error("DB Error in deleteOtp, falling back:", err);
      pool = null;
    }
  }
  localState.otps = localState.otps.filter((o) => o.code !== code);
}

export async function updateOtpUsage(code: string, used: number, usedBy: string | null) {
  if (pool) {
    try {
      await pool.query("UPDATE otps SET used = $2, used_by = $3 WHERE code = $1", [
        code,
        used,
        usedBy,
      ]);
      return;
    } catch (err) {
      console.error("DB Error in updateOtpUsage, falling back:", err);
      pool = null;
    }
  }
  localState.otps = localState.otps.map((o) => (o.code === code ? { ...o, used, usedBy } : o));
}

export async function getUsers() {
  if (pool) {
    try {
      const res = await pool.query("SELECT * FROM users");
      return res.rows.map((r) => ({
        email: r.email,
        password: r.password,
        otpCode: r.otp_code,
        prizesWon: r.prizes_won || [],
        spins: r.spins,
        createdAt: Number(r.created_at),
      }));
    } catch (err) {
      console.error("DB Error in getUsers, falling back:", err);
      pool = null;
    }
  }
  return localState.users;
}

export async function upsertUser(
  email: string,
  password: string,
  otpCode: string | null,
  prizesWon: string[],
  spins: number,
) {
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO users (email, password, otp_code, prizes_won, spins, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE
         SET password = EXCLUDED.password, otp_code = EXCLUDED.otp_code, prizes_won = EXCLUDED.prizes_won, spins = EXCLUDED.spins`,
        [email, password, otpCode, prizesWon, spins, Date.now()],
      );
      return;
    } catch (err) {
      console.error("DB Error in upsertUser, falling back:", err);
      pool = null;
    }
  }

  const exists = localState.users.some((u) => u.email === email);
  if (exists) {
    localState.users = localState.users.map((u) =>
      u.email === email ? { ...u, password, otpCode, prizesWon, spins } : u,
    );
  } else {
    localState.users.push({
      email,
      password,
      otpCode,
      prizesWon,
      spins,
      createdAt: Date.now(),
    });
  }
}
