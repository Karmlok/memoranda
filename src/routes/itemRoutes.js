const express = require('express');
const {
  createItem,
  listItems,
} = require('../controllers/itemController');

const router = express.Router();

router.get('/', listItems);
router.post('/', createItem);

module.exports = router;
