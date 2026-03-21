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
    const { name, location } = req.body;

    if (!name || !location) {
      return res.status(400).json({
        message: 'I campi name e location sono obbligatori.',
      });
    }

    const item = await itemService.addItem({ name, location });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listItems,
  createItem,
};
