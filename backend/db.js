const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "XXXXXXXXXXXXXX",
  database: "praveen_db"
});

module.exports = db;