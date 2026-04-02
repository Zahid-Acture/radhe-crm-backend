// db.js — MySQL connection pool
require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || "43.239.92.177",
  port:     parseInt(process.env.DB_PORT || "3306"),
  user:     process.env.DB_USER     || "astha",
  password: process.env.DB_PASSWORD || "Astha@123",
  database: process.env.DB_NAME     || "astha",
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           "+05:30",   // IST
  charset:            "utf8mb4",
});

module.exports = pool;
