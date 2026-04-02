// routes/orders.js
const router = require("express").Router();
const db = require("../db");
const { authenticate } = require("../middleware/auth");
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
router.use(authenticate);

router.get("/", async (req, res) => {
  try {
    const isAdmin = req.user.role === "admin";
    const [rows] = isAdmin
      ? await db.query("SELECT o.*, u.name AS mr_name FROM orders o LEFT JOIN users u ON u.id = o.mr_id ORDER BY o.order_date DESC, o.created_at DESC")
      : await db.query("SELECT o.*, u.name AS mr_name FROM orders o LEFT JOIN users u ON u.id = o.mr_id WHERE o.mr_id = ? ORDER BY o.order_date DESC", [req.user.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/", async (req, res) => {
  const { date, customerName, product, qty, amount, mr_id, status, doctorRef, notes } = req.body;
  if (!customerName) return res.status(400).json({ error: "Customer name required" });
  const assignedMr = req.user.role === "admin" ? (mr_id || null) : req.user.id;
  const id = uid();
  try {
    await db.query(
      "INSERT INTO orders (id, order_date, customer_name, product, qty, amount, mr_id, status, doctor_ref, notes) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [id, date||new Date().toISOString().split("T")[0], customerName, product||"", parseInt(qty)||1, parseFloat(amount)||0, assignedMr, status||"Pending", doctorRef||null, notes||null]
    );
    const [rows] = await db.query("SELECT o.*, u.name AS mr_name FROM orders o LEFT JOIN users u ON u.id = o.mr_id WHERE o.id = ?", [id]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put("/:id", async (req, res) => {
  const { date, customerName, product, qty, amount, mr_id, status, doctorRef, notes } = req.body;
  const assignedMr = req.user.role === "admin" ? (mr_id || null) : req.user.id;
  try {
    await db.query(
      "UPDATE orders SET order_date=?, customer_name=?, product=?, qty=?, amount=?, mr_id=?, status=?, doctor_ref=?, notes=?, updated_at=NOW() WHERE id=?",
      [date, customerName, product, parseInt(qty)||1, parseFloat(amount)||0, assignedMr, status, doctorRef||null, notes||null, req.params.id]
    );
    const [rows] = await db.query("SELECT o.*, u.name AS mr_name FROM orders o LEFT JOIN users u ON u.id = o.mr_id WHERE o.id = ?", [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete("/:id", async (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
  try { await db.query("DELETE FROM orders WHERE id = ?", [req.params.id]); res.json({ deleted: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
