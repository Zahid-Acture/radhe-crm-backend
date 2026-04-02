// routes/visits.js
const router = require("express").Router();
const db = require("../db");
const { authenticate } = require("../middleware/auth");
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
router.use(authenticate);

router.get("/", async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const [rows] = isAdmin
      ? await db.query("SELECT v.*, u.name AS mr_name FROM visits v LEFT JOIN users u ON u.id = v.mr_id ORDER BY v.visit_date DESC, v.created_at DESC")
      : await db.query("SELECT v.*, u.name AS mr_name FROM visits v LEFT JOIN users u ON u.id = v.mr_id WHERE v.mr_id = ? ORDER BY v.visit_date DESC", [req.user.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/", async (req, res) => {
  const { date, mr_id, type, doctorName, location, productsDiscussed, outcome, nextAction, notes } = req.body;
  if (!date) return res.status(400).json({ error: "Date is required" });
  const assignedMr = req.user.role === "admin" ? (mr_id || req.user.id) : req.user.id;
  const id = uid();
  try {
    await db.query(
      "INSERT INTO visits (id, visit_date, mr_id, type, doctor_name, location, products_discussed, outcome, next_action, notes) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [id, date, assignedMr, type||"Doctor Visit", doctorName||null, location||null, productsDiscussed||null, outcome||null, nextAction||null, notes||null]
    );
    const [rows] = await db.query("SELECT v.*, u.name AS mr_name FROM visits v LEFT JOIN users u ON u.id = v.mr_id WHERE v.id = ?", [id]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put("/:id", async (req, res) => {
  const { date, mr_id, type, doctorName, location, productsDiscussed, outcome, nextAction, notes } = req.body;
  const assignedMr = req.user.role === "admin" ? (mr_id || req.user.id) : req.user.id;
  try {
    await db.query(
      "UPDATE visits SET visit_date=?, mr_id=?, type=?, doctor_name=?, location=?, products_discussed=?, outcome=?, next_action=?, notes=?, updated_at=NOW() WHERE id=?",
      [date, assignedMr, type, doctorName||null, location||null, productsDiscussed||null, outcome||null, nextAction||null, notes||null, req.params.id]
    );
    const [rows] = await db.query("SELECT v.*, u.name AS mr_name FROM visits v LEFT JOIN users u ON u.id = v.mr_id WHERE v.id = ?", [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete("/:id", async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  try { await db.query("DELETE FROM visits WHERE id = ?", [req.params.id]); res.json({ deleted: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
