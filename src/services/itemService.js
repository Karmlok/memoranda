const crypto = require('crypto');
const { all, initializeDatabase, run } = require('../utils/sqliteStore');

function mapRow(row) {
  return {
    id: row.id,
    name: row.name,
    room: row.room,
    container: row.container,
    imagePath: row.image_path || null,
    createdAt: row.created_at,
  };
}

async function getAllItems() {
  const db = await initializeDatabase();

  const rows = await all(
    db,
    `
      SELECT id, name, room, container, image_path, created_at
      FROM items
      ORDER BY datetime(created_at) DESC
    `,
  );

  return rows.map(mapRow);
}

async function addItem({ name, room, container, imagePath = null }) {
  const db = await initializeDatabase();

  const newItem = {
    id: crypto.randomUUID(),
    name: name.trim(),
    room: room.trim(),
    container: container.trim(),
    imagePath,
    createdAt: new Date().toISOString(),
  };

  await run(
    db,
    `
      INSERT INTO items (id, name, room, container, image_path, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      newItem.id,
      newItem.name,
      newItem.room,
      newItem.container,
      newItem.imagePath,
      newItem.createdAt,
    ],
  );

  return newItem;
}

async function updateItem(id, { name, room, container, imagePath = null }) {
  const db = await initializeDatabase();
  const existingRows = await all(
    db,
    `
      SELECT id, name, room, container, image_path, created_at
      FROM items
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );
  const existingItem = existingRows[0];

  if (!existingItem) {
    return null;
  }

  const updatedItem = {
    id,
    name: name.trim(),
    room: room.trim(),
    container: container.trim(),
    imagePath: imagePath || existingItem.image_path || null,
    createdAt: existingItem.created_at,
  };

  await run(
    db,
    `
      UPDATE items
      SET name = ?, room = ?, container = ?, image_path = ?
      WHERE id = ?
    `,
    [
      updatedItem.name,
      updatedItem.room,
      updatedItem.container,
      updatedItem.imagePath,
      updatedItem.id,
    ],
  );

  return updatedItem;
}

async function deleteItem(id) {
  const db = await initializeDatabase();

  const result = await run(
    db,
    `
      DELETE FROM items
      WHERE id = ?
    `,
    [id],
  );

  return Boolean(result.changes);
}

async function replaceAllItems(items) {
  const db = await initializeDatabase();

  run(db, 'BEGIN TRANSACTION');

  try {
    run(db, 'DELETE FROM items');

    items.forEach((item) => {
      const normalizedItem = {
        id: item.id || crypto.randomUUID(),
        name: item.name.trim(),
        room: item.room.trim(),
        container: item.container.trim(),
        imagePath: item.imagePath || null,
        createdAt: item.createdAt || new Date().toISOString(),
      };

      run(
        db,
        `
          INSERT INTO items (id, name, room, container, image_path, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          normalizedItem.id,
          normalizedItem.name,
          normalizedItem.room,
          normalizedItem.container,
          normalizedItem.imagePath,
          normalizedItem.createdAt,
        ],
      );
    });

    run(db, 'COMMIT');
    return items.length;
  } catch (error) {
    run(db, 'ROLLBACK');
    throw error;
  }
}

module.exports = {
  getAllItems,
  addItem,
  updateItem,
  deleteItem,
  replaceAllItems,
};
