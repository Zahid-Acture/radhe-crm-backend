// seed.js — Run once after schema.sql to insert hashed passwords
require("dotenv").config();
const bcrypt = require("bcryptjs");
const db     = require("./db");

async function seed() {
  console.log("🌱 Seeding Radhe CRM database...\n");

  const users = [
    { id: "admin1", username: "bharat",  password: "radhe@admin", name: "Bharat Bhanushali", role: "admin", territory: null,          phone: null },
    { id: "mr1",    username: "mr1",     password: "mr1@radhe",   name: "MR 1",              role: "mr",    territory: "Territory A",  phone: null },
    { id: "mr2",    username: "mr2",     password: "mr2@radhe",   name: "MR 2",              role: "mr",    territory: "Territory B",  phone: null },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await db.query(
      `INSERT INTO users (id, username, password_hash, name, role, territory, phone, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), name = VALUES(name)`,
      [u.id, u.username, hash, u.name, u.role, u.territory, u.phone]
    );
    console.log(`  ✅ User: ${u.username} / ${u.password}`);
  }

  const products = [
    { id: "p1", name: "MCR Chappal",           category: "Diabetic",    price: 850 },
    { id: "p2", name: "Ortho Sandal - Men",    category: "Orthopedic",  price: 1200 },
    { id: "p3", name: "Ortho Sandal - Women",  category: "Orthopedic",  price: 1100 },
    { id: "p4", name: "Diabetic Shoe - Men",   category: "Diabetic",    price: 2200 },
    { id: "p5", name: "Diabetic Shoe - Women", category: "Diabetic",    price: 2000 },
    { id: "p6", name: "Arch Support Insole",   category: "Insoles",     price: 650  },
    { id: "p7", name: "Silicon Heel Pad",      category: "Accessories", price: 350  },
    { id: "p8", name: "Knee Brace Support",    category: "Supports",    price: 950  },
  ];

  for (const p of products) {
    await db.query(
      `INSERT INTO products (id, name, category, price) VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), category = VALUES(category), price = VALUES(price)`,
      [p.id, p.name, p.category, p.price]
    );
    console.log(`  ✅ Product: ${p.name}`);
  }

  console.log("\n✨ Seed complete!");
  process.exit(0);
}

seed().catch(e => { console.error("Seed failed:", e.message); process.exit(1); });
