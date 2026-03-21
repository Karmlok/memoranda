const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Memoranda server in ascolto su http://localhost:${PORT}`);
});
