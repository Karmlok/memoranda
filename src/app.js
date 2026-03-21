const express = require('express');
const path = require('path');

const itemRoutes = require('./routes/itemRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/items', itemRoutes);

app.use(errorHandler);

module.exports = app;
