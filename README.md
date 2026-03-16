# Harmony Clay - Pendientes Artesanales

¡Bienvenido al proyecto **Harmony Clay**! 🌸

Tienda online de **pendientes artesanales** hechos a mano.

## 🚀 Características

### Cliente
- Catálogo de productos con fotos y categorías
- Buscador en tiempo real
- Ordenar por nombre, precio o más reciente
- Favoritos (guardar productos sin comprar)
- Carrito de compra
- Formulario de contacto
- WhatsApp flotante para atención directa
- Diseño 100% responsive (móvil y escritorio)

### Administrador
- Panel de gestión con contraseña
- CRUD completo de productos
- Gestión de categorías
- Galería de fotos por producto
- Panel de pedidos con estados
- Estadísticas (pedidos hoy, ingresos, stock)
- Notificaciones email automáticas

## 🛠️ Tecnología

- **Backend:** Node.js + Express
- **Frontend:** React + Tailwind CSS
- **Datos:** JSON files (sin base de datos)
- **Email:** Nodemailer con cola de procesamiento
- **Despliegue:** PM2 + Cloudflare Tunnel

## 📦 Instalación

```bash
# Instalar dependencias
cd backend && npm install
cd ../frontend-react && npm install

# Configurar variables de entorno
cp .env.example .env
# Edita .env con tus valores

# Desarrollo
cd backend && npm start
cd frontend-react && npm run dev

# Producción
npm run build
```

## 🔧 Configuración

Crea un archivo `.env` en la raíz con:

```env
PORT=5017
SECRET_KEY=tu_clave_secreta
ADMIN_PASSWORD=tu_contraseña
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password_gmail
```

## 📁 Estructura

```
├── backend/
│   ├── index.js          # Servidor principal
│   ├── data/             # JSON files (productos, pedidos, etc.)
│   └── ecosystem.config.js
├── frontend-react/
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── context/     # Estados globales
│   │   └── App.jsx
│   └── dist/            # Build de producción
├── .env                 # NO subir a GitHub
└── .gitignore
```

## 📝 Notas

- El archivo `.env` contiene credenciales sensibles y está en `.gitignore`
- Los datos se almacenan en archivos JSON en `backend/data/`
- El proyecto está configurado para Synology NAS con PM2

---

*Hecho con ❤️ para Harmony Clay*
