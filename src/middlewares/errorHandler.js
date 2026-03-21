function errorHandler(err, req, res, next) {
  console.error(err);

  res.status(500).json({
    message: 'Errore interno del server',
  });
}

module.exports = errorHandler;
