// routes/leads.js
const router = require("express").Router();
const db     = require("../db");
const { authenticate } = require("../middleware/auth");
const { nanoid } = { nanoid: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7) };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// All routes require auth
router.use(authenticate);

// GET /api/leads
router.get("/", async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const [rows] = isAdmin
      ? await db.query("SELECT l.*, u.name AS mr_name FROM leads l LEFT JOIN users u ON u.id = l.mr_id ORDER BY l.created_at DESC")
      : await db.query("SELECT l.*, u.name AS mr_name FROM leads l LEFT JOIN users u ON u.id = l.mr_id WHERE l.mr_id = ? ORDER BY l.created_at DESC", [req.user.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/leads
router.post("/", async (req, res) => {
  const { name, phone, city, source, stage, mr_id, follow_up, notes } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  const assignedMr = req.user.role === "admin" ? (mr_id || null) : req.user.id;
  const id = uid();
  try {
    await db.query(
      "INSERT INTO leads (id, name, phone, city, source, stage, mr_id, follow_up, notes) VALUES (?,?,?,?,?,?,?,?,?)",
      [id, name, phone||null, city||null, source||"Doctor Referral", stage||"New", assignedMr, follow_up||null, notes||null]
    );
    const [rows] = await db.query("SELECT l.*, u.name AS mr_name FROM leads l LEFT JOIN users u ON u.id = l.mr_id WHERE l.id = ?", [id]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PUT /api/leads/:id
router.put("/:id", async (req, res) => {
  const { name, phone, city, source, stage, mr_id, follow_up, notes } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  const assignedMr = req.user.role === "admin" ? (mr_id || null) : req.user.id;
  try {
    await db.query(
      "UPDATE leads SET name=?, phone=?, city=?, source=?, stage=?, mr_id=?, follow_up=?, notes=?, updated_at=NOW() WHERE id=?",
      [name, phone||null, city||null, source, stage, assignedMr, follow_up||null, notes||null, req.params.id]
    );
    const [rows] = await db.query("SELECT l.*, u.name AS mr_name FROM leads l LEFT JOIN users u ON u.id = l.mr_id WHERE l.id = ?", [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/leads/:id  (admin only)
router.delete("/:id", async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  try {
    await db.query("DELETE FROM leads WHERE id = ?", [req.params.id]);
    res.json({ deleted: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
