// routes/auth.js
const router  = require("express").Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const db      = require("../db");
const { authenticate } = require("../middleware/auth");

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });

  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE username = ? LIMIT 1",
      [username.toLowerCase().trim()]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "Invalid username or password" });
    if (user.role === "mr" && !user.active)
      return res.status(403).json({ error: "Account deactivated. Contact admin." });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: "Invalid username or password" });

    const payload = { id: user.id, username: user.username, name: user.name, role: user.role, territory: user.territory };
    const token   = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "8h" });

    const { password_hash, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/auth/me  — validate token & return current user
router.get("/me", authenticate, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, username, name, role, territory, phone, active FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
