const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const db = require("./db");

// Function to upload CSV into one table (csv_data)
function uploadCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => results.push(data))
      .on("end", async () => {
        if (results.length === 0) {
          return reject("❌ CSV is empty");
        }

        const tableName = "voter_data";
        const uniqueCols = ["voterid"]; // Use "voter_id' as unique key

        try {
          // 1. Ensure base table exists (only id column first time)
          let createTableQuery = `
            CREATE TABLE IF NOT EXISTS ${tableName} (
              id INT AUTO_INCREMENT PRIMARY KEY
            )
          `;
          await runQuery(createTableQuery);

          // 2. Check existing columns in table
          let existingCols = await getExistingColumns(tableName);

          // 3. Normalize columns: map all variations of 'name' to 'name'
          const columnMap = {};
          let allCsvCols = new Set();
          results.forEach(row => {
            Object.keys(row).forEach(col => {
              let normalized = col.toLowerCase();
              if (normalized === "name") {
                columnMap[col] = "name";
                allCsvCols.add("name");
              } else {
                columnMap[col] = col.toLowerCase();
                allCsvCols.add(col.toLowerCase());
              }
            });
          });

          // Only add missing columns (skip duplicate 'name' variations)
          for (let col of allCsvCols) {
            if (!existingCols.map(c => c.toLowerCase()).includes(col.toLowerCase())) {
              let alterQuery = `ALTER TABLE ${tableName} ADD COLUMN \`${col}\` VARCHAR(255)`;
              await runQuery(alterQuery);
              console.log(`✅ Added new column: ${col}`);
            }
          }

          // Refresh columns after adding new ones
          existingCols = await getExistingColumns(tableName);

          // 4. Insert or update CSV data row by row
          for (let row of results) {
            // Normalize row keys using columnMap
            const normalizedRow = {};
            Object.keys(row).forEach(key => {
              const mappedKey = columnMap[key];
              normalizedRow[mappedKey] = row[key];
            });

            // Skip if voterid is missing
            if (!normalizedRow.voterid) continue;

            // Build WHERE clause for unique columns
            const uniqueValues = uniqueCols.map(col => normalizedRow[col]);
            const whereClause = uniqueCols.map(col => `\`${col}\` = ?`).join(" AND ");

            // Check if row exists
            const [existing] = await db.query(
              `SELECT * FROM ${tableName} WHERE ${whereClause}`,
              uniqueValues
            );

            // Prepare values for all columns (fill missing with empty string)
            const insertCols = existingCols.filter(col => col !== "id");
            const insertColNames = insertCols.map(col => `\`${col}\``).join(",");
            const insertValues = insertCols.map(col => normalizedRow[col] !== undefined ? normalizedRow[col] : "");

            const placeholders = insertValues.map(() => "?").join(",");

            if (existing.length > 0) {
              // Row exists, update it with new column values
              const updateCols = insertCols
                .filter(col => !uniqueCols.includes(col) && normalizedRow[col] !== undefined)
                .map(col => `\`${col}\` = ?`)
                .join(", ");
              const updateValues = insertCols
                .filter(col => !uniqueCols.includes(col) && normalizedRow[col] !== undefined)
                .map(col => normalizedRow[col]);
              if (updateCols.length > 0) {
                await db.query(
                  `UPDATE ${tableName} SET ${updateCols} WHERE ${whereClause}`,
                  [...updateValues, ...uniqueValues]
                );
              }
            } else {
              // Row does not exist, insert it
              let insertQuery = `INSERT INTO ${tableName} (${insertColNames}) VALUES (${placeholders})`;
              await runQuery(insertQuery, insertValues);
            }
          }

          resolve("✅ CSV uploaded successfully!");
        } catch (err) {
          reject(err);
        }
      });
  });
}

// Helper: run query (promise-based)
async function runQuery(query, params = []) {
  const [results] = await db.query(query, params);
  return results;
}

// Helper: get existing columns in table (promise-based)
async function getExistingColumns(tableName) {
  const [results] = await db.query(`SHOW COLUMNS FROM ${tableName}`);
  const cols = results.map((r) => r.Field);
  return cols;
}

module.exports = uploadCSV;
