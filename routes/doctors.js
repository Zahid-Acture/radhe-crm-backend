// routes/doctors.js
const router = require("express").Router();
const db = require("../db");
const { authenticate } = require("../middleware/auth");
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
router.use(authenticate);

router.get("/", async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const [rows] = isAdmin
      ? await db.query("SELECT d.*, u.name AS mr_name FROM doctors d LEFT JOIN users u ON u.id = d.mr_id ORDER BY d.created_at DESC")
      : await db.query("SELECT d.*, u.name AS mr_name FROM doctors d LEFT JOIN users u ON u.id = d.mr_id WHERE d.mr_id = ? ORDER BY d.created_at DESC", [req.user.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/", async (req, res) => {
  const { name, specialty, hospital, city, phone, mr_id, notes } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  const assignedMr = req.user.role === "admin" ? (mr_id || null) : req.user.id;
  const id = uid();
  try {
    await db.query("INSERT INTO doctors (id, name, specialty, hospital, city, phone, mr_id, notes) VALUES (?,?,?,?,?,?,?,?)",
      [id, name, specialty||"Orthopedic", hospital||null, city||null, phone||null, assignedMr, notes||null]);
    const [rows] = await db.query("SELECT d.*, u.name AS mr_name FROM doctors d LEFT JOIN users u ON u.id = d.mr_id WHERE d.id = ?", [id]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put("/:id", async (req, res) => {
  const { name, specialty, hospital, city, phone, mr_id, notes } = req.body;
  const assignedMr = req.user.role === "admin" ? (mr_id || null) : req.user.id;
  try {
    await db.query("UPDATE doctors SET name=?, specialty=?, hospital=?, city=?, phone=?, mr_id=?, notes=?, updated_at=NOW() WHERE id=?",
      [name, specialty, hospital||null, city||null, phone||null, assignedMr, notes||null, req.params.id]);
    const [rows] = await db.query("SELECT d.*, u.name AS mr_name FROM doctors d LEFT JOIN users u ON u.id = d.mr_id WHERE d.id = ?", [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete("/:id", async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  try { await db.query("DELETE FROM doctors WHERE id = ?", [req.params.id]); res.json({ deleted: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
