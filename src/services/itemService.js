const crypto = require('crypto');
const { all, initializeDatabase, run } = require('../utils/sqliteStore');

async function getAllItems() {
  const db = await initializeDatabase();

  const rows = await all(
    db,
    `
      SELECT id, name, room, container, created_at
      FROM items
      ORDER BY datetime(created_at) DESC
    `,
  );

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    room: row.room,
    container: row.container,
    createdAt: row.created_at,
  }));
}

async function addItem({ name, room, container }) {
  const db = await initializeDatabase();

  const newItem = {
    id: crypto.randomUUID(),
    name: name.trim(),
    room: room.trim(),
    container: container.trim(),
    createdAt: new Date().toISOString(),
  };

  await run(
    db,
    `
      INSERT INTO items (id, name, room, container, created_at)
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      newItem.id,
      newItem.name,
      newItem.room,
      newItem.container,
      newItem.createdAt,
    ],
  );

  return newItem;
}

module.exports = {
  getAllItems,
  addItem,
};
