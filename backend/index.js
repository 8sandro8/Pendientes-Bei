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


const SECRET_KEY = process.env.SECRET_KEY || 'tu_clave_secreta_aqui';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; // Force config from .env
if (!ADMIN_PASSWORD) {
  console.error('[CRITICAL] ADMIN_PASSWORD is missing in .env');
  process.exit(1);
}
console.log('[STARTUP] Admin Password Configured:', ADMIN_PASSWORD === 'coquito.2025' ? 'CORRECT (coquito.2025)' : 'WRONG (' + ADMIN_PASSWORD + ')');

const frontendPath = path.join(__dirname, '../frontend');
console.log('[STARTUP] Serving static from:', frontendPath);

// DIAGNOSTIC: Check if files actually exist
const fsOriginal = require('fs'); // Need sync verify for startup
try {
  const stylePath = path.join(frontendPath, 'style.css');
  const indexPath = path.join(frontendPath, 'index.html');
  console.log('[DIAGNOSTIC] Checking frontend files...');
  console.log(`[DIAGNOSTIC] style.css exists? ${fsOriginal.existsSync(stylePath)} (${stylePath})`);
  console.log(`[DIAGNOSTIC] index.html exists? ${fsOriginal.existsSync(indexPath)} (${indexPath})`);

  // List files in frontend directory to be sure
  if (fsOriginal.existsSync(frontendPath)) {
    const files = fsOriginal.readdirSync(frontendPath);
    console.log('[DIAGNOSTIC] Files in frontend dir:', files.join(', '));
  } else {
    console.error('[DIAGNOSTIC] FATAL: Frontend directory does not exist!');
  }
} catch (err) {
  console.error('[DIAGNOSTIC] Error checking files:', err);
}

// ... (middleware content) ...

// --- EMAIL NOTIFICATIONS ---
const nodemailer = require('nodemailer');

// LOGGING TO FILE HANDLER
async function logToFile(msg) {
  const logFile = path.join(__dirname, 'email_debug.log');
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${msg}\n`;
  try {
    await fsOriginal.promises.appendFile(logFile, logLine);
  } catch (e) {
    console.error('Failed to write to log file:', e);
  }
}

// Helper to get fresh transporter
function getTransporter() {
  // FALLBACK CREDENTIALS (DEBUGGING)
  const user = process.env.EMAIL_USER || 'harmonyyclay@gmail.com';
  const pass = process.env.EMAIL_PASS || 'ngkbkfahmqvvjjqb';

  logToFile(`Creating transporter with user: ${user}`);

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass
    }
  });
}

async function sendEmailNotification(subject, text, toAddress = null) {
  const user = process.env.EMAIL_USER || 'harmonyyclay@gmail.com';
  const recipient = toAddress || user; // Default to admin if no address provided

  logToFile(`Attempting to send email to ${recipient}: ${subject}`);

  const mailOptions = {
    from: user,
    to: recipient,
    subject: subject,
    text: text
  };

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail(mailOptions);
    logToFile(`EMAIL SENT SUCCESS: ${info.messageId}`);
    return true;
  } catch (error) {
    logToFile(`EMAIL ERROR: ${error.message}`);
    console.error('[EMAIL ERROR]', error);
    return false;
  }
}

// REQUEST LOGGER
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

// FORCE STATIC SERVING (Debug)
app.get('/style.css', (req, res) => {
  const file = path.join(frontendPath, 'style.css');
  console.log('[DEBUG] Serving style.css form:', file);
  res.sendFile(file, (err) => {
    if (err) console.error('[ERROR] style.css not found:', err);
  });
});

app.get('/app.js', (req, res) => {
  const file = path.join(frontendPath, 'app.js');
  console.log('[DEBUG] Serving app.js form:', file);
  res.sendFile(file, (err) => {
    if (err) console.error('[ERROR] app.js not found:', err);
  });
});

app.use(express.static(frontendPath));

// --- DATA MANAGEMENT ---
const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'pendientes.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const REQUESTS_FILE = path.join(DATA_DIR, 'requests.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');

// Initialize Categories if not exists
(async () => {
  try {
    await fs.access(CATEGORIES_FILE);
  } catch {
    const defaults = ['Aros', 'Largos', 'Elegantes', 'De Diario', 'Otros'];
    await writeJSON(CATEGORIES_FILE, defaults);
  }
})();

// Ensure data dir exists
if (!fsOriginal.existsSync(DATA_DIR)) fsOriginal.mkdirSync(DATA_DIR, { recursive: true });

// Helpers
async function readJSON(file) {
  try {
    const data = await fs.readFile(file, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeJSON(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

// --- AUTH MIDDLEWARE ---
function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];
  if (typeof bearerHeader !== 'undefined') {
    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];
    req.token = bearerToken;

    jwt.verify(req.token, SECRET_KEY, (err, authData) => {
      if (err) {
        res.sendStatus(403);
      } else {
        req.authData = authData;
        next();
      }
    });
  } else {
    res.sendStatus(403);
  }
}

// --- ROUTES ---

// LOGIN
app.post('/api/login', (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    jwt.sign({ user: 'admin' }, SECRET_KEY, { expiresIn: '2h' }, (err, token) => {
      if (err) return res.sendStatus(500);
      res.json({ token });
    });
  } else {
    res.status(401).json({ message: 'Contraseña incorrecta' });
  }
});

// GET PRODUCTS
app.get('/api/pendientes', async (req, res) => {
  try {
    const products = await readJSON(PRODUCTS_FILE);
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al leer productos' });
  }
});

// CREATE/UPDATE PRODUCT
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(frontendPath, 'images');
    if (!fsOriginal.existsSync(uploadDir)) fsOriginal.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'upload-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

app.post('/api/upload', verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  // Return relative path for frontend
  res.json({ imageUrl: `/images/${req.file.filename}` });
});

app.post('/api/pendientes', verifyToken, async (req, res) => {
  try {
    const products = await readJSON(PRODUCTS_FILE);
    const newProduct = { id: Date.now(), ...req.body }; // Simple ID gen
    if (!newProduct.stock) newProduct.stock = 0;

    products.push(newProduct);
    await writeJSON(PRODUCTS_FILE, products);
    res.json(newProduct);
  } catch (err) {
    res.status(500).json({ message: 'Error saving product' });
  }
});

app.put('/api/pendientes/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    let products = await readJSON(PRODUCTS_FILE);
    const index = products.findIndex(p => String(p.id) === id);

    if (index !== -1) {
      // Merge existing with update, keeping ID
      products[index] = { ...products[index], ...req.body, id: products[index].id };
      await writeJSON(PRODUCTS_FILE, products);
      res.json(products[index]);
    } else {
      res.status(404).json({ message: 'Producto no encontrado' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error updating product' });
  }
});

app.delete('/api/pendientes/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    let products = await readJSON(PRODUCTS_FILE);
    const initialLen = products.length;
    products = products.filter(p => String(p.id) !== id);

    if (products.length < initialLen) {
      await writeJSON(PRODUCTS_FILE, products);
      res.json({ message: 'Producto eliminado' });
    } else {
      res.status(404).json({ message: 'Producto no encontrado' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product' });
  }
});

// ORDERS
app.get('/api/orders', verifyToken, async (req, res) => {
  try {
    const orders = await readJSON(ORDERS_FILE);
    // Sort logic handled in frontend or here? Let's sort by date desc
    orders.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error reading orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { items, customer } = req.body;
    let products = await readJSON(PRODUCTS_FILE);
    let orders = await readJSON(ORDERS_FILE);

    // Validate Stock
    for (const item of items) {
      const product = products.find(p => String(p.id) === String(item.id));
      if (!product) return res.status(400).json({ message: `Producto ${item.id} no existe` });
      if (product.stock < item.qty) return res.status(400).json({ message: `Stock insuficiente para ${product.nombre}` });
    }

    // Deduct Stock
    for (const item of items) {
      const product = products.find(p => String(p.id) === String(item.id));
      product.stock -= item.qty;
    }
    await writeJSON(PRODUCTS_FILE, products);

    // Create Order
    const newOrder = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: items.map(i => {
        const p = products.find(prod => String(prod.id) === String(i.id));
        return { ...i, nombre: p.nombre, precio: p.precio }; // Snapshot details
      }),
      customer,
      status: 'Pendiente',
      total: items.reduce((sum, i) => {
        const p = products.find(prod => String(prod.id) === String(i.id));
        return sum + (p.precio * i.qty);
      }, 0)
    };

    orders.push(newOrder);
    await writeJSON(ORDERS_FILE, orders);

    // Send Email (Async)
    // Send Email to Admin
    const emailBodyAdmin = `Nuevo pedido de ${customer.nombre}!\nTotal: ${newOrder.total}€\nVer en panel de admin.`;
    sendEmailNotification('Nuevo Pedido - Harmony Clay', emailBodyAdmin);

    // Send Email to Client
    if (customer.email) {
      const emailBodyClient = `¡Hola ${customer.nombre}!\n\nHemos recibido tu pedido en Harmony Clay.\n\nResumen:\n${items.map(i => `- ${i.nombre} (${i.qty}x) - ${i.precio}€`).join('\n')}\n\nTotal: ${newOrder.total}€\n\nNos pondremos en contacto contigo pronto cuando el pedido esté listo o enviado.\n\nGracias,\nEl equipo de Harmony Clay`;
      sendEmailNotification('Confirmación de Pedido - Harmony Clay', emailBodyClient, customer.email);
    }

    res.json(newOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error processing order' });
  }
});

app.put('/api/orders/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const orders = await readJSON(ORDERS_FILE);
    const order = orders.find(o => String(o.id) === id);
    if (order) {
      order.status = status;
      await writeJSON(ORDERS_FILE, orders);
      res.json(order);
    } else {
      res.status(404).json({ message: 'Orden no encontrada' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error updating order' });
  }
});

app.delete('/api/orders/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    let orders = await readJSON(ORDERS_FILE);
    const initialLen = orders.length;
    orders = orders.filter(o => String(o.id) !== id);

    if (orders.length < initialLen) {
      await writeJSON(ORDERS_FILE, orders);
      res.json({ message: 'Orden eliminada' });
    } else {
      res.status(404).json({ message: 'Orden no encontrada' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error deleting order' });
  }
});

// REQUESTS
app.get('/api/requests', verifyToken, async (req, res) => {
  try {
    const reqs = await readJSON(REQUESTS_FILE);
    reqs.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(reqs);
  } catch (err) {
    res.status(500).json({ message: 'Error reading requests' });
  }
});

app.post('/api/requests', async (req, res) => {
  try {
    const { name, contact, message, productId, productName } = req.body;
    let reqs = await readJSON(REQUESTS_FILE);

    const newReq = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      name, contact, message, productId, productName
    };

    reqs.push(newReq);
    await writeJSON(REQUESTS_FILE, reqs);

    sendEmailNotification('Nueva Solicitud - Harmony Clay', `Solicitud de ${name} para ${productName}.\nContacto: ${contact}`);

    res.json(newReq);
  } catch (err) {
    res.status(500).json({ message: 'Error submitting request' });
  }
});

app.delete('/api/requests/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    let reqs = await readJSON(REQUESTS_FILE);
    const initialLen = reqs.length;
    reqs = reqs.filter(r => String(r.id) !== id);

    if (reqs.length < initialLen) {
      await writeJSON(REQUESTS_FILE, reqs);
      res.json({ message: 'Solicitud eliminada' });
    } else {
      res.status(404).json({ message: 'Solicitud no encontrada' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error deleting request' });
  }
});

// BACKUP
app.get('/api/backup', verifyToken, async (req, res) => {
  try {
    const p = await readJSON(PRODUCTS_FILE);
    const o = await readJSON(ORDERS_FILE);
    const r = await readJSON(REQUESTS_FILE);
    res.json({
      message: 'Backup generated',
      data: { products: p, orders: o, requests: r }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error generating backup' });
  }
});

// CATEGORIES
app.get('/api/categories', async (req, res) => {
  try {
    const cats = await readJSON(CATEGORIES_FILE);
    res.json(cats);
  } catch (err) {
    res.status(500).json({ message: 'Error loading categories' });
  }
});

app.post('/api/categories', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Nombre requerido' });

    let cats = await readJSON(CATEGORIES_FILE);
    if (!cats.includes(name)) {
      cats.push(name);
      await writeJSON(CATEGORIES_FILE, cats);
    }
    res.json(cats);
  } catch (err) {
    res.status(500).json({ message: 'Error adding category' });
  }
});

app.delete('/api/categories/:name', verifyToken, async (req, res) => {
  try {
    const { name } = req.params;
    let cats = await readJSON(CATEGORIES_FILE);
    const initialLen = cats.length;
    cats = cats.filter(c => c !== name);

    if (cats.length < initialLen) {
      await writeJSON(CATEGORIES_FILE, cats);
      res.json({ message: 'Categoría eliminada' });
    } else {
      res.status(404).json({ message: 'Categoría no encontrada' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error deleting category' });
  }
});

// --- CATCH-ALL ROUTE (MUST BE LAST) ---
// Fix for "Cannot GET /" and SPA routing
app.get('*', (req, res) => {
  const fullPath = path.join(frontendPath, 'index.html');
  console.log('[ROUTE-FALLBACK] Serving index.html from:', fullPath);
  res.sendFile(fullPath, (err) => {
    if (err) {
      console.error('[ERROR] Catch-all sending file:', err);
      res.status(500).send('Error loading frontend');
    }
  });
});

// TEST EMAIL ROUTE
app.post('/api/test-email', verifyToken, async (req, res) => {
  try {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
      return res.status(400).json({ message: 'Credenciales de correo no configuradas en .env' });
    }

    const transporter = getTransporter();

    // Verify connection configuration
    await transporter.verify();

    // Send Test
    const info = await transporter.sendMail({
      from: user,
      to: user, // Send to self
      subject: 'Test Email - Harmony Clay',
      text: 'Si lees esto, el correo funciona perfectamente. ¡Enhorabuena!'
    });

    logToFile(`TEST EMAIL SUCCESS: ${info.messageId}`);
    res.json({ message: 'Correo enviado con éxito', info });

  } catch (error) {
    logToFile(`TEST EMAIL ERROR: ${error.message}`);
    console.error('Test Email Error:', error);
    res.status(500).json({
      message: 'Error al enviar correo',
      error: error.message,
      stack: error.stack
    });
  }
});

// START SERVER
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en http://0.0.0.0:${PORT}`);
});
