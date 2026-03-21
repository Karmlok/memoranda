const crypto = require('crypto');
const { readJsonFile, writeJsonFile } = require('../utils/jsonStore');

const ITEMS_FILE = 'src/data/items.json';

async function getAllItems() {
  const items = await readJsonFile(ITEMS_FILE);
  return items;
}

async function addItem({ name, location }) {
  const items = await readJsonFile(ITEMS_FILE);

  const newItem = {
    id: crypto.randomUUID(),
    name: name.trim(),
    location: location.trim(),
    createdAt: new Date().toISOString(),
  };

  items.push(newItem);
  await writeJsonFile(ITEMS_FILE, items);

  return newItem;
}

module.exports = {
  getAllItems,
  addItem,
};
