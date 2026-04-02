// routes/users.js — MR team management (admin only)
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const db = require("../db");
const { authenticate, adminOnly } = require("../middleware/auth");
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

router.use(authenticate, adminOnly);

// GET /api/users  — list all MRs
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, username, name, role, territory, phone, active, created_at FROM users WHERE role = 'mr' ORDER BY name"
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/users  — create new MR
router.post("/", async (req, res) => {
  const { name, username, password, phone, territory } = req.body;
  if (!name || !username || !password) return res.status(400).json({ error: "Name, username, and password are required" });
  const uname = username.toLowerCase().trim();
  try {
    const [existing] = await db.query("SELECT id FROM users WHERE username = ?", [uname]);
    if (existing.length) return res.status(409).json({ error: "Username already taken" });
    const hash = await bcrypt.hash(password, 10);
    const id   = uid();
    await db.query(
      "INSERT INTO users (id, username, password_hash, name, role, territory, phone, active) VALUES (?,?,?,?,?,?,?,?)",
      [id, uname, hash, name, "mr", territory||null, phone||null, 1]
    );
    const [rows] = await db.query("SELECT id, username, name, role, territory, phone, active FROM users WHERE id = ?", [id]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/users/:id  — update MR
router.put("/:id", async (req, res) => {
  const { name, username, password, phone, territory, active } = req.body;
  const uname = username?.toLowerCase().trim();
  try {
    if (uname) {
      const [dup] = await db.query("SELECT id FROM users WHERE username = ? AND id != ?", [uname, req.params.id]);
      if (dup.length) return res.status(409).json({ error: "Username already taken" });
    }
    let q = "UPDATE users SET name=?, territory=?, phone=?, active=?, updated_at=NOW()";
    const params = [name, territory||null, phone||null, active !== undefined ? (active ? 1 : 0) : 1];
    if (uname) { q += ", username=?"; params.push(uname); }
    if (password) { const hash = await bcrypt.hash(password, 10); q += ", password_hash=?"; params.push(hash); }
    q += " WHERE id=?"; params.push(req.params.id);
    await db.query(q, params);
    const [rows] = await db.query("SELECT id, username, name, role, territory, phone, active FROM users WHERE id = ?", [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
