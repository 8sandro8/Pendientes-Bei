const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fsOriginal = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

const morgan = require('morgan');

app.use(morgan('dev'));
app.use(express.json());
app.use(cors());

// --- CONFIGURATION ---


const SECRET_KEY = process.env.SECRET_KEY || 'tu_clave_secreta_aqui';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.error('[CRITICAL] ADMIN_PASSWORD is missing in .env');
  process.exit(1);
}

const frontendPath = path.join(__dirname, '../frontend-react/dist');
console.log('[STARTUP] Serving static from:', frontendPath);

// ... (middleware content) ...

// --- EMAIL NOTIFICATIONS ---
const nodemailer = require('nodemailer');

// LOGGING TO FILE HANDLER
async function logToFile(msg) {
  const logFile = path.join(__dirname, 'email_debug.log');
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${msg}\n`;
  try {
    await fs.appendFile(logFile, logLine);
  } catch (e) {
    console.error('Failed to write to log file:', e);
  }
}

// Email Configuration with Singleton Pattern
let emailTransporter = null;

function getTransporter() {
  if (emailTransporter) return emailTransporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.error('[CRITICAL] EMAIL_USER or EMAIL_PASS not configured');
    return null;
  }

  try {
    logToFile(`Initializing detailed transporter for: ${user}`);

    emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      auth: { user, pass }
    });

    return emailTransporter;
  } catch (error) {
    console.error('CRITICAL: Failed to create transporter:', error);
    logToFile(`CRITICAL: Failed to create transporter: ${error.message}`);
    throw error;
  }
}

// --- GLOBAL ERROR HANDLERS ---
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
  logToFile(`CRITICAL UNCAUGHT EXCEPTION: ${err.message} \nStack: ${err.stack}`).catch(e => console.error(e));

  // If port is in use, we MUST exit to avoid orphan workers
  if (err.code === 'EADDRINUSE') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
  logToFile(`CRITICAL UNHANDLED REJECTION: ${reason}`).catch(e => console.error(e));
});

async function sendEmailNotification(subject, text, toAddress = null, html = null, attachments = []) {
  const user = process.env.EMAIL_USER || 'harmonyyclay@gmail.com';
  const recipient = toAddress || user;

  console.log(`[EMAIL-DEBUG] Sending to: ${recipient}, Subject: ${subject}`);
  logToFile(`Attempting to send email to ${recipient}: ${subject} (HTML: ${!!html}, Attachments: ${attachments.length})`);

  try {
    const transporter = getTransporter();

    const mailOptions = {
      from: user,
      to: recipient,
      subject: subject,
      text: text,
      html: html,
      attachments: attachments
    };

    const start = Date.now();

    // Add Timeout Race
    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Email send timeout (30s)')), 30000)
    );

    const info = await Promise.race([sendPromise, timeoutPromise]);
    const duration = Date.now() - start;

    logToFile(`EMAIL SENT SUCCESS: ${info.messageId} in ${duration}ms`);
    console.log(`[EMAIL-SUCCESS] MessageID: ${info.messageId} (${duration}ms)`);
    return true;
  } catch (error) {
    logToFile(`EMAIL ERROR: ${error.message} \nStack: ${error.stack}`);
    console.error('[EMAIL ERROR]', error);
    return false;
  }
}

// --- DATA MANAGEMENT ---
const DATA_DIR = path.join(__dirname, 'data');
const EMAIL_QUEUE_FILE = path.join(DATA_DIR, 'email_queue.json');
const PRODUCTS_FILE = path.join(DATA_DIR, 'pendientes.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const REQUESTS_FILE = path.join(DATA_DIR, 'requests.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');

// Helper to read queue
async function readQueue() {
  try {
    const data = await fs.readFile(EMAIL_QUEUE_FILE, 'utf8');
    if (!data || data.trim() === '') return [];
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    console.error(`[QUEUE-READ-ERROR] ${err.message}`);
    return []; // Return empty array on corruption to allow recovery
  }
}

// --- EMAIL TEMPLATES ---

function getEmailStyles() {
  return `
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #444; line-height: 1.6; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 20px auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
      .header { background: linear-gradient(135deg, #fef1f2 0%, #fae8e8 100%); padding: 30px; text-align: center; border-bottom: 2px solid #fce4ec; }
      .header h1 { color: #d81b60; font-family: 'Playfair Display', serif; margin: 0; letter-spacing: 2px; text-transform: uppercase; font-size: 24px; }
      .content { padding: 30px; background: #fff; }
      .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      .order-table th { text-align: left; border-bottom: 2px solid #fce4ec; padding: 10px; color: #888; font-size: 12px; text-transform: uppercase; }
      .order-table td { padding: 15px 10px; border-bottom: 1px solid #fdf2f2; }
      .product-img { width: 50px; height: 50px; border-radius: 5px; object-fit: cover; background: #f9f9f9; }
      .total-row { font-size: 18px; font-weight: bold; color: #d81b60; text-align: right; padding: 20px 10px; }
      .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
      .button { display: inline-block; padding: 12px 25px; background: #d81b60; color: #fff !important; text-decoration: none; border-radius: 25px; margin-top: 20px; font-weight: bold; }
    </style>
  `;
}

function generateOrderHTMLEmail(order) {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td>
        ${item.imagen ? `<img src="cid:prod-${item.id}" class="product-img" alt="${item.nombre}">` : '<div class="product-img"></div>'}
      </td>
      <td>
        <strong>${item.nombre}</strong><br>
        <span style="font-size: 12px; color: #888;">${item.qty} x ${item.precio}€</span>
      </td>
      <td style="text-align: right;">${(item.qty * item.precio).toFixed(2)}€</td>
    </tr>
  `).join('');

  return `
    <html>
      <head>${getEmailStyles()}</head>
      <body>
        <div class="container">
          <div class="header">
            <h1>HARMONY CLAY</h1>
            <p style="color: #888; margin-top: 5px; font-size: 14px;">Confirmación de Pedido #${order.id}</p>
          </div>
          <div class="content">
            <h2 style="color: #333; margin-top: 0;">¡Hola ${order.customer.nombre}!</h2>
            <p>Gracias por tu pedido en <strong>Harmony Clay</strong>. Estamos preparando tus piezas con todo el cariño del mundo.</p>
            
            <table class="order-table">
              <thead>
                <tr>
                  <th width="60"></th>
                  <th>Producto</th>
                  <th style="text-align: right;">Precio</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div class="total-row">Total: ${order.total}€</div>
            
            <div style="margin-top: 30px; padding: 20px; background: #fffcfc; border-radius: 8px; border-left: 4px solid #d81b60;">
              <p style="margin: 0; font-size: 14px;"><strong>Información de entrega:</strong><br>
              ${order.customer.direccion || 'Recogida/A convenir'}<br>
              Tel: ${order.customer.telefono}</p>
            </div>
            
            <p style="margin-top: 30px;">Recibirás otro correo cuando tu pedido esté listo para ser entregado o enviado.</p>
          </div>
          <div class="footer">
            <p>Harmony Clay &copy; 2026<br>Zaragoza, España</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateAdminHTMLEmail(order) {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td>
        ${item.imagen ? `<img src="cid:prod-${item.id}" class="product-img" alt="${item.nombre}">` : '<div class="product-img"></div>'}
      </td>
      <td>
        <strong>${item.nombre}</strong><br>
        <span style="font-size: 12px; color: #888;">${item.qty} x ${item.precio}€</span>
      </td>
      <td style="text-align: right;">${(item.qty * item.precio).toFixed(2)}€</td>
    </tr>
  `).join('');

  return `
    <html>
      <head>${getEmailStyles()}</head>
      <body>
        <div class="container" style="border-color: #d1d5db;">
          <div class="header" style="background: #f3f4f6; border-bottom-color: #e5e7eb;">
            <h1 style="color: #374151;">NUEVO PEDIDO</h1>
            <p style="color: #6b7280;">ID: ${order.id}</p>
          </div>
          <div class="content">
            <h3>Datos del Cliente:</h3>
            <p>
              <strong>Nombre:</strong> ${order.customer.nombre} ${order.customer.apellidos || ''}<br>
              <strong>Email:</strong> ${order.customer.email}<br>
              <strong>Teléfono:</strong> ${order.customer.telefono}<br>
              <strong>Dirección:</strong> ${order.customer.direccion || 'No especificada'}
            </p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <h3>Resumen:</h3>
            <table class="order-table">
              <thead>
                <tr>
                  <th width="60"></th>
                  <th>Producto</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <div class="total-row">Total a cobrar: ${order.total}€</div>
          </div>
          <div class="footer">
            <p>Sistema de Gestión Harmony Clay</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateRequestHTMLEmail(req) {
  return `
    <html>
      <head>${getEmailStyles()}</head>
      <body>
        <div class="container" style="border-color: #fce4ec;">
          <div class="header" style="background: #fffafa; border-bottom: 2px solid #fce4ec;">
            <h1 style="color: #d81b60;">NUEVA SOLICITUD</h1>
            <p style="color: #888;">Producto: ${req.productName}</p>
          </div>
          <div class="content">
            <p><strong>${req.name}</strong> ha enviado una solicitud de disponibilidad.</p>
            <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Contacto:</strong> ${req.contact}</p>
              <p><strong>Mensaje:</strong><br>${req.message || 'Sin mensaje adicional'}</p>
            </div>
            <p style="font-size: 14px; color: #666;">ID del Producto: ${req.productId}</p>
          </div>
          <div class="footer">
            <p>Sistema de Gestión Harmony Clay</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

// ... existing queue logic helpers ...

app.use(express.static(frontendPath));

// --- QUEUE LOGIC ---

// Helper to write queue
async function writeQueue(queue) {
  await fs.writeFile(EMAIL_QUEUE_FILE, JSON.stringify(queue, null, 2));
}

// Add to Queue
async function addToQueue(recipient, subject, text, html = null, attachments = []) {
  try {
    let queue = await readQueue();
    if (!Array.isArray(queue)) queue = [];

    queue.push({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      recipient,
      subject,
      text,
      html,
      attachments,
      attempts: 0,
      createdAt: new Date().toISOString()
    });
    await writeQueue(queue);
    logToFile(`[QUEUE] Added email for ${recipient}: ${subject}`);
  } catch (err) {
    console.error('CRITICAL: Failed to add to email queue', err);
    logToFile(`[QUEUE-ERROR] Failed to add: ${err.message}`);
  }
}

// Process Queue (Background Worker)
let isProcessingQueue = false;
async function processQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  try {
    let queue = await readQueue();
    if (!Array.isArray(queue) || queue.length === 0) {
      isProcessingQueue = false;
      return;
    }

    // Take ONE item that is NOT already processing
    const item = queue.find(q => !q.processing);
    if (!item) {
      isProcessingQueue = false;
      return;
    }

    // Check max attempts
    if (item.attempts >= 3) {
      logToFile(`[QUEUE-DROP] Dropping email ${item.id} after 3 failed attempts.`);
      queue = await readQueue();
      queue = queue.filter(q => q.id !== item.id);
      await writeQueue(queue);
      isProcessingQueue = false;
      return;
    }

    // Mark as processing persistent
    item.processing = true;
    await writeQueue(queue);

    logToFile(`[QUEUE-PROCESS] Processing ${item.id} for ${item.recipient}`);

    // Try Send
    const success = await sendEmailNotification(item.subject, item.text, item.recipient, item.html, item.attachments);

    // Refresh queue to apply changes
    queue = await readQueue();
    const index = queue.findIndex(q => q.id === item.id);

    if (success) {
      logToFile(`[QUEUE-SUCCESS] Finished ${item.id}`);
      if (index !== -1) {
        queue.splice(index, 1);
      }
    } else {
      logToFile(`[QUEUE-RETRY] Failed ${item.id}, incrementing attempts.`);
      if (index !== -1) {
        queue[index].attempts = (queue[index].attempts || 0) + 1;
        queue[index].processing = false;
      }
    }
    await writeQueue(queue);

  } catch (err) {
    console.error('Queue Processor Error:', err);
  } finally {
    isProcessingQueue = false;
  }
}

// Start Background Worker
setInterval(processQueue, 10000);
logToFile('[SYSTEM] Email Queue Processor started (10s interval)');




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
    if (!data || data.trim() === '') return [];
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    console.error(`[JSON-READ-ERROR] for ${file}: ${err.message}`);
    return []; // Defensive
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
        res.status(403).json({ message: 'Token inválido o expirado' });
      } else {
        req.authData = authData;
        next();
      }
    });
  } else {
    res.status(403).json({ message: 'Token no proporcionado' });
  }
}

// --- ROUTES ---

// LOGIN
app.post('/api/login', (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    jwt.sign({ user: 'admin' }, SECRET_KEY, { expiresIn: '2h' }, (err, token) => {
      if (err) return res.status(500).json({ message: 'Error al generar token' });
      res.json({ token });
    });
  } else {
    res.status(401).json({ message: 'Contraseña incorrecta' });
  }
});

// GET PRODUCTS (desde JSON)
app.get('/api/pendientes', async (req, res) => {
  try {
    const products = await readJSON(PRODUCTS_FILE);
    // Transformar para compatibilidad con frontend
    const transformed = products.map(p => ({
      ...p,
      imagen_principal: p.imagen_principal || p.imagen || null,
      fotos: p.fotos || p.photos || []
    }));
    res.json(transformed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al leer productos' });
  }
});

// CREATE PRODUCT (JSON)
app.post('/api/pendientes', verifyToken, async (req, res) => {
  try {
    const products = await readJSON(PRODUCTS_FILE);
    const newProduct = { 
      id: Date.now(), 
      ...req.body,
      imagen_principal: req.body.imagen_principal || req.body.imagen,
      fotos: req.body.fotos || req.body.photos || []
    };
    if (!newProduct.stock) newProduct.stock = 0;

    products.push(newProduct);
    await writeJSON(PRODUCTS_FILE, products);
    res.json(newProduct);
  } catch (err) {
    res.status(500).json({ message: 'Error saving product' });
  }
});

// UPDATE PRODUCT (JSON)
app.put('/api/pendientes/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    let products = await readJSON(PRODUCTS_FILE);
    const index = products.findIndex(p => String(p.id) === id);

    if (index !== -1) {
      products[index] = { 
        ...products[index], 
        ...req.body, 
        id: products[index].id,
        imagen_principal: req.body.imagen_principal || req.body.imagen,
        fotos: req.body.fotos || req.body.photos || []
      };
      await writeJSON(PRODUCTS_FILE, products);
      res.json(products[index]);
    } else {
      res.status(404).json({ message: 'Producto no encontrado' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error updating product' });
  }
});

// DELETE PRODUCT (JSON)
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

// STATS (para admin)
app.get('/api/stats', verifyToken, async (req, res) => {
  try {
    const orders = await readJSON(ORDERS_FILE);
    const products = await readJSON(PRODUCTS_FILE);
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const pedidosHoy = orders.filter(o => new Date(o.date) >= hoy);
    const ingresosHoy = pedidosHoy.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
    const ingresosTotales = orders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
    
    const pendientes = products.reduce((sum, p) => sum + (parseInt(p.stock) || 0), 0);
    
    res.json({
      totalPedidos: orders.length,
      pedidosHoy: pedidosHoy.length,
      ingresosHoy: ingresosHoy.toFixed(2),
      ingresosTotales: ingresosTotales.toFixed(2),
      totalProductos: products.length,
      stockTotal: pendientes,
      pedidosPendientes: orders.filter(o => o.status === 'Pendiente').length
    });
  } catch (err) {
    res.status(500).json({ message: 'Error loading stats' });
  }
});

// GET ALL ORDERS
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await readJSON(ORDERS_FILE);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error loading orders' });
  }
});

// CREATE ORDER
app.post('/api/orders', async (req, res) => {
  try {
    const orders = await readJSON(ORDERS_FILE);
    
    const newOrder = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      status: 'Pendiente',
      items: req.body.items || [],
      customer: req.body.customer || {},
      shippingMethod: req.body.shippingMethod || 'recogida',
      shippingCost: req.body.shippingCost || 0,
      subtotal: req.body.subtotal || 0,
      total: req.body.total || 0
    };
    
    orders.push(newOrder);
    await writeJSON(ORDERS_FILE, orders);
    
    // Send email notification
    try {
      await sendEmailNotification(
        `Nuevo pedido #${newOrder.id.slice(-6)}`,
        `Nuevo pedido de ${newOrder.customer.nombre} - Total: ${newOrder.total}€`,
        null,
        null,
        []
      );
    } catch (emailErr) {
      console.error('Error sending email:', emailErr);
    }
    
    res.json(newOrder);
  } catch (err) {
    res.status(500).json({ message: 'Error creating order' });
  }
});

// UPDATE ORDER
app.put('/api/orders/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    let orders = await readJSON(ORDERS_FILE);
    const index = orders.findIndex(o => String(o.id) === id);
    
    if (index !== -1) {
      orders[index] = { ...orders[index], ...req.body };
      await writeJSON(ORDERS_FILE, orders);
      res.json(orders[index]);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error updating order' });
  }
});

// DELETE ORDER
app.delete('/api/orders/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    let orders = await readJSON(ORDERS_FILE);
    const initialLen = orders.length;
    orders = orders.filter(o => String(o.id) !== id);
    
    if (orders.length < initialLen) {
      await writeJSON(ORDERS_FILE, orders);
      res.json({ message: 'Order deleted' });
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error deleting order' });
  }
});

// CONTACT FORM
app.post('/api/contact', async (req, res) => {
  try {
    const { nombre, email, telefono, mensaje } = req.body;
    
    if (!nombre || !email || !mensaje) {
      return res.status(400).json({ message: 'Faltan datos requeridos' });
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #d4a5a5, #9b6b6b); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">Nuevo mensaje de contacto</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <p><strong>Nombre:</strong> ${nombre}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Teléfono:</strong> ${telefono || 'No proporcionado'}</p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p><strong>Mensaje:</strong></p>
          <p style="background: white; padding: 15px; border-radius: 5px;">${mensaje}</p>
        </div>
      </div>
    `;

    await sendEmailNotification(
      `Nuevo contacto de ${nombre}`,
      `De: ${email} - ${mensaje}`,
      null,
      emailHtml,
      []
    );

    res.json({ message: 'Mensaje enviado correctamente' });
  } catch (err) {
    console.error('Error en contacto:', err);
    res.status(500).json({ message: 'Error al enviar mensaje' });
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

// MULTI-IDIDIOMA - Traducciones
const I18N_FILE = path.join(__dirname, 'data/i18n/config.json');

// Cargar config de idioma
async function loadI18nConfig() {
  try {
    const configPath = path.join(__dirname, 'data/i18n/config.json');
    if (fsOriginal.existsSync(configPath)) {
      return await readJSON(configPath);
    }
    return { idioma: 'es', disponibles: ['es', 'en', 'ca'] };
  } catch (e) {
    return { idioma: 'es', disponibles: ['es', 'en', 'ca'] };
  }
}

// GET traducciones
app.get('/api/i18n/:idioma', async (req, res) => {
  try {
    const { idioma } = req.params;
    const validIds = ['es', 'en', 'ca'];
    if (!validIds.includes(idioma)) {
      return res.status(400).json({ message: 'Idioma no válido' });
    }
    const i18nPath = path.join(__dirname, `data/i18n/${idioma}.json`);
    if (fsOriginal.existsSync(i18nPath)) {
      const translations = await readJSON(i18nPath);
      res.json(translations);
    } else {
      res.status(404).json({ message: 'Traducciones no encontradas' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Error cargando traducciones' });
  }
});

// GET idioma actual
app.get('/api/i18n', async (req, res) => {
  try {
    const config = await loadI18nConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: 'Error cargando configuración' });
  }
});

// PUT cambiar idioma
app.put('/api/i18n', verifyToken, async (req, res) => {
  try {
    const { idioma } = req.body;
    const validIds = ['es', 'en', 'ca'];
    if (!validIds.includes(idioma)) {
      return res.status(400).json({ message: 'Idioma no válido' });
    }
    const configPath = path.join(__dirname, 'data/i18n/config.json');
    const config = { idioma, disponibles: ['es', 'en', 'ca'] };
    await writeJSON(configPath, config);
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: 'Error guardando configuración' });
  }
});

// START SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en http://0.0.0.0:${PORT}`);
});