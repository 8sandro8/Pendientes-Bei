# Harmony Clay - Pendientes Artesanales

¡Bienvenido al proyecto **Harmony Clay**! 🌸

Tienda online de **pendientes artesanales** hechos a mano.  
🔗 **Live:** https://www.harmonyclay.es

---

## 🚀 Características

### Cliente
- Catálogo de productos con fotos y categorías
- Buscador en tiempo real
- Ordenar por nombre, precio o más reciente
- Favoritos (guardar productos sin comprar)
- Carrito de compra
- Modal detalle de producto
- Formulario de contacto
- WhatsApp flotante para atención directa
- Trust badges (garantías de confianza)
- Diseño 100% responsive (móvil y escritorio)

### Administrador
- Login con autenticación JWT
- CRUD completo de productos
- CRUD de categorías
- Upload de imágenes por producto
- Gestión de pedidos con estados
- Panel de estadísticas (pedidos, ingresos, stock)
- Notificaciones email automáticas al cliente

---

## 🛠️ Tecnología

### Stack
- **Backend:** Node.js + Express 4.19.2
- **Frontend:** React 19.2.4 + Vite 8 + Tailwind CSS 4.2.1
- **Datos:** Archivos JSON (sin base de datos)
- **Email:** Nodemailer con cola de procesamiento
- **Despliegue:** Docker Compose + Cloudflare Tunnel
- **Servidor:** NAS Synology DS723+

---

## 📊 Sistema

- **~280 productos** en catálogo
- **~137 pedidos** registrados
- **4 categorías:** Aros, Otros, Charms, Minis

---

## 📦 Instalación

```bash
# Clonar repositorio
git clone <repo-url>
cd harmony-clay

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend-react
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Desarrollo
cd backend && npm start
cd frontend-react && npm run dev

# Producción
cd frontend-react && npm run build
```

---

## 🔧 Configuración

Crea un archivo `.env` en la raíz del proyecto:

```env
PORT=5017
SECRET_KEY=tu_clave_secreta_aqui
ADMIN_PASSWORD=tu_contraseña_admin
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password_gmail
```

### Variables requeridas

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servidor Express |
| `SECRET_KEY` | Clave para firmar tokens JWT |
| `ADMIN_PASSWORD` | Contraseña de acceso al panel admin |
| `EMAIL_USER` | Gmail para enviar notificaciones |
| `EMAIL_PASS` | App Password de Gmail |

---

## 📁 Estructura del Proyecto

```
├── backend/
│   ├── index.js              # Servidor principal Express
│   ├── data/                 # Archivos JSON (productos, pedidos, categorías)
│   ├── ecosystem.config.js   # Config PM2/Docker
│   └── Dockerfile            # Imagen Docker backend
├── frontend-react/
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── context/          # Context API (carrito, favoritos, auth)
│   │   ├── pages/            # Vistas (Home, Admin, Contacto)
│   │   └── App.jsx
│   ├── dist/                 # Build de producción
│   └── Dockerfile            # Imagen Docker frontend
├── docker-compose.yml        # Orquestación de contenedores
├── .env                      # NO subir a GitHub
└── .gitignore
```

---

## 🚢 Despliegue

### Docker Compose

```bash
# Construir e iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

### Synology NAS (DS723+)

1. Instalar Docker en el NAS
2. Configurar Cloudflare Tunnel para acceso público
3. Usar `ecosystem.config.js` con PM2 o Docker Compose
4. El túnel de Cloudflare permite acceso sin necesidad de configuración de puertos

---

## 📝 Notas Importantes

- ⚠️ El archivo `.env` contiene credenciales sensibles y está en `.gitignore`
- 📁 Los datos se almacenan en archivos JSON en `backend/data/`
- 🖼️ Las imágenes de productos se guardan en `backend/data/uploads/`
- 🔐 El panel admin requiere autenticación JWT (token expira en 7 días)
- 📧 Las notificaciones email se procesan en cola (no bloquean peticiones)
- 🐳 Docker Compose configura automáticamente la red entre frontend y backend

---

## 🔐 Seguridad

- Contraseñas hasheadas con bcrypt
- Tokens JWT para autenticación admin
- Variables de entorno para secrets
- CORS configurado para dominios específicos
- Rate limiting en endpoints sensibles

---

*Hecho con ❤️ para Harmony Clay*
