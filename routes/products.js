// routes/products.js
const router = require("express").Router();
const db = require("../db");
const { authenticate, adminOnly } = require("../middleware/auth");
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
router.use(authenticate);

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM products WHERE active = 1 ORDER BY category, name");
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post("/", adminOnly, async (req, res) => {
  const { name, category, price } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });
  const id = uid();
  try {
    await db.query("INSERT INTO products (id, name, category, price) VALUES (?,?,?,?)",
      [id, name, category||"Other", parseFloat(price)||0]);
    const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [id]);
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put("/:id", adminOnly, async (req, res) => {
  const { name, category, price } = req.body;
  try {
    await db.query("UPDATE products SET name=?, category=?, price=?, updated_at=NOW() WHERE id=?",
      [name, category, parseFloat(price)||0, req.params.id]);
    const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [req.params.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete("/:id", adminOnly, async (req, res) => {
  try {
    await db.query("UPDATE products SET active = 0 WHERE id = ?", [req.params.id]);
    res.json({ deleted: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
