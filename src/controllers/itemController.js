const itemService = require('../services/itemService');

async function listItems(req, res, next) {
  try {
    const items = await itemService.getAllItems();
    res.status(200).json(items);
  } catch (error) {
    next(error);
  }
}

async function createItem(req, res, next) {
  try {
    const { name, room, container } = req.body;

    if (!name || !room || !container) {
      return res.status(400).json({
        message: 'I campi name, room e container sono obbligatori.',
      });
    }

    const item = await itemService.addItem({ name, room, container });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listItems,
  createItem,
};
