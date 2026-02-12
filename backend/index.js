const express = require('express');
const fs = require('fs').promises; // Usamos la version de promesas de fs
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer'); // Importar multer
require('dotenv').config();

const app = express();

const morgan = require('morgan');

app.use(morgan('dev'));
app.use(express.json()); // Permite recibir JSON en el body
app.use(cors()); // Permite peticiones desde otros dominios (útil para desarrollo)

const dbPath = path.join(__dirname, 'db.json');
const SECRET_KEY = process.env.SECRET_KEY || 'mi_secreto_super_seguro'; // En prod usar .env!
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Sirve archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de Multer para subir imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public/images')); // Guardar en public/images
  },
  filename: function (req, file, cb) {
    // Usar fecha actual + nombre original para evitar duplicados
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Endpoint de Login
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: 'admin' }, SECRET_KEY, { expiresIn: '2h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Contraseña incorrecta' });
  }
});

// Endpoint PROTEGIDO para subir imágenes
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se subió ninguna imagen' });
  }
  // Devolver la ruta relativa de la imagen para guardarla en la BD
  res.json({ imageUrl: `/images/${req.file.filename}` });
});

// Endpoint público para obtener todos los pendientes
app.get('/api/pendientes', async (req, res) => {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    const pendientes = JSON.parse(data);
    res.json(pendientes);
  } catch (err) {
    console.error('Error al leer la base de datos:', err);
    res.status(500).json({ message: 'Error interno del servidor al obtener datos.' });
  }
});

// Endpoint PROTEGIDO para agregar un pendiente
app.post('/api/pendientes', authenticateToken, async (req, res) => {
  try {
    const newPendiente = req.body;
    // Validación básica mejorada
    if (!newPendiente.nombre || !newPendiente.precio) {
      return res.status(400).json({ message: 'Nombre y precio son obligatorios' });
    }

    const data = await fs.readFile(dbPath, 'utf8');
    const pendientes = JSON.parse(data);

    // Generar ID simple
    newPendiente.id = Date.now().toString();

    // Asegurar campos nuevos si no vienen
    newPendiente.stock = newPendiente.stock ? parseInt(newPendiente.stock) : 1;
    newPendiente.comprador = newPendiente.comprador || ""; // Nuevo campo comprador

    pendientes.push(newPendiente);

    await fs.writeFile(dbPath, JSON.stringify(pendientes, null, 2));
    res.status(201).json(newPendiente);
  } catch (err) {
    console.error('Error al guardar:', err);
    res.status(500).json({ message: 'Error al guardar el pendiente' });
  }
});

// Endpoint PROTEGIDO para actualizar un pendiente
app.put('/api/pendientes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const data = await fs.readFile(dbPath, 'utf8');
    let pendientes = JSON.parse(data);

    const index = pendientes.findIndex(p => String(p.id) === String(id));
    if (index === -1) {
      return res.status(404).json({ message: 'Pendiente no encontrado' });
    }

    // Mantener ID original y actualizar datos
    pendientes[index] = { ...pendientes[index], ...updatedData };

    await fs.writeFile(dbPath, JSON.stringify(pendientes, null, 2));
    res.json(pendientes[index]);
  } catch (err) {
    console.error('Error al actualizar:', err);
    res.status(500).json({ message: 'Error al actualizar el pendiente' });
  }
});

// Endpoint PROTEGIDO para eliminar un pendiente
app.delete('/api/pendientes/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const data = await fs.readFile(dbPath, 'utf8');
    let pendientes = JSON.parse(data);

    // Filtrar usando comparación de strings para soportar IDs numéricos antiguos
    const newPendientes = pendientes.filter(p => String(p.id) !== String(id));

    if (pendientes.length === newPendientes.length) {
      return res.status(404).json({ message: 'Pendiente no encontrado' });
    }

    // Opcional: Podríamos borrar la imagen asociada aquí también si quisiéramos ser muy limpios

    await fs.writeFile(dbPath, JSON.stringify(newPendientes, null, 2));
    res.json({ message: 'Pendiente eliminado correctamente' });
  } catch (err) {
    console.error('Error al eliminar:', err);
    res.status(500).json({ message: 'Error al eliminar el pendiente' });
  }
});

const portArgIndex = process.argv.indexOf('--port');
const PORT = portArgIndex !== -1 ? process.argv[portArgIndex + 1] : process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
