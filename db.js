// db.js — MySQL connection pool
require("dotenv").config();
const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || "localhost",
  port:     parseInt(process.env.DB_PORT || "3306"),
  user:     process.env.DB_USER     || "U574372436_astha",
  password: process.env.DB_PASSWORD || "Astha@123@Acture",
  database: process.env.DB_NAME     || "U574372436_astha",
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           "+05:30",   // IST
  charset:            "utf8mb4",
});

module.exports = pool;
