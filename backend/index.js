const express = require('express');
const fs = require('fs').promises; // Usamos la version de promesas de fs
const path = require('path');
const app = express();

const dbPath = path.join(__dirname, 'db.json');

// Sirve archivos estáticos desde la carpeta '../frontend'
app.use(express.static(path.join(__dirname, '../frontend')));

// Endpoint de la API para obtener todos los pendientes
app.get('/api/pendientes', async (req, res) => {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    const pendientes = JSON.parse(data);
    res.json(pendientes);
  } catch (err) {
    res.status(500).json({ message: 'Error al leer la base de datos' });
  }
});

const portArgIndex = process.argv.indexOf('--port');
const PORT = portArgIndex !== -1 ? process.argv[portArgIndex + 1] : process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
