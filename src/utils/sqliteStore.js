const fs = require('fs/promises');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DB_FILE = path.join(process.cwd(), 'src/data/items.db');
const LEGACY_JSON_FILE = path.join(process.cwd(), 'src/data/items.json');

let database;

function all(db, sql, params = []) {
  const statement = db.prepare(sql);
  return statement.all(...params);
}

function run(db, sql, params = []) {
  const statement = db.prepare(sql);
  return statement.run(...params);
}

async function migrateLegacyJson(db) {
  try {
    const fileContent = await fs.readFile(LEGACY_JSON_FILE, 'utf8');
    const legacyItems = JSON.parse(fileContent || '[]');

    if (!Array.isArray(legacyItems) || legacyItems.length === 0) {
      return;
    }

    for (const item of legacyItems) {
      run(
        db,
        `
          INSERT OR IGNORE INTO items (id, name, room, container, created_at)
          VALUES (?, ?, ?, ?, ?)
        `,
        [
          item.id,
          item.name,
          item.room,
          item.container,
          item.createdAt || new Date().toISOString(),
        ],
      );
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function initializeDatabase() {
  if (database) {
    return database;
  }

  await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
  const db = new DatabaseSync(DB_FILE);

  run(
    db,
    `
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        room TEXT NOT NULL,
        container TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `,
  );

  await migrateLegacyJson(db);

  database = db;
  return db;
}

module.exports = {
  all,
  initializeDatabase,
  run,
};
