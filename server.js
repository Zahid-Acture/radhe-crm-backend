// server.js — Radhe Healthcare CRM Express Server
require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const bcrypt   = require("bcryptjs"); // npm i bcryptjs  (if not already installed)
const db       = require("./db");

const authRouter     = require("./routes/auth");
const leadsRouter    = require("./routes/leads");
const doctorsRouter  = require("./routes/doctors");
const visitsRouter   = require("./routes/visits");
const ordersRouter   = require("./routes/orders");
const productsRouter = require("./routes/products");
const usersRouter    = require("./routes/users");

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json());

// ── Health check ────────────────────────────────────────────
app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ status: "ok", db: "connected", time: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ status: "error", message: e.message });
  }
});

// ── Change Password ─────────────────────────────────────────
app.post("/api/auth/change-password", async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  if (!username || !currentPassword || !newPassword)
    return res.status(400).json({ message: "All fields are required" });

  if (newPassword.length < 6)
    return res.status(400).json({ message: "New password must be at least 6 characters" });

  try {
    const [rows] = await db.promise().query(
      "SELECT id, password FROM users WHERE username = ? LIMIT 1",
      [username]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "User not found" });

    const user = rows[0];

    // ── If your passwords are stored as PLAIN TEXT (not hashed): ──
    // const match = currentPassword === user.password;
    // ── If your passwords are stored as BCRYPT HASH (recommended): ──
    const match = await bcrypt.compare(currentPassword, user.password);

    if (!match)
      return res.status(401).json({ message: "Current password is incorrect" });

    // ── Hash and save new password ──
    // ── Plain text version: await db.promise().query("UPDATE users SET password = ? WHERE id = ?", [newPassword, user.id]); ──
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.promise().query(
      "UPDATE users SET password = ? WHERE id = ?",
      [hashed, user.id]
    );

    return res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
});

// ── Routes ──────────────────────────────────────────────────
app.use("/api/auth",     authRouter);
app.use("/api/leads",    leadsRouter);
app.use("/api/doctors",  doctorsRouter);
app.use("/api/visits",   visitsRouter);
app.use("/api/orders",   ordersRouter);
app.use("/api/products", productsRouter);
app.use("/api/users",    usersRouter);

// ── 404 ─────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// ── Error handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// ── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`\n🏥 Radhe Healthcare CRM API`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`   DB: ${process.env.DB_NAME}@${process.env.DB_HOST}\n`);
});