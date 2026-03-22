# Harmony Clay - Architecture Document (SDD)
**Versión**: 3.0 | **Última actualización**: 2026-03-21
**URL**: https://www.harmonyclay.es

---

## 1. Visión General

**Harmony Clay** es una aplicación web de e-commerce especializada en la venta de pendientes artesanales hechos con arcilla polimérica. El sistema ofrece dos vistas principales:

- **Vista Cliente**: Catálogo de productos, carrito de compras, favoritos, contacto
- **Vista Admin**: Gestión de productos, categorías, pedidos y estadísticas

El proyecto está desplegado en un NAS Synology DS723+ y utiliza una arquitectura monolítica con servidor Express sirviendo archivos estáticos del frontend.

---

## 2. Tech Stack

| Capa | Tecnología | Versión Real | Notas |
|------|------------|--------------|-------|
| Frontend | React | **19.2.4** | Actualizado vs doc anterior (18.x) |
| Build Tool | Vite | **8.x** | Actualizado vs doc anterior (6.x) |
| Estilos | Tailwind CSS | **4.2.1** | Actualizado vs doc anterior (3.x) |
| Backend | Express.js | **4.19.2** | - |
| Base de Datos | **JSON Files** | N/A | ⚠️ MariaDB en Docker configurado PERO no usado |
| Autenticación | JWT (jsonwebtoken) | 9.x | Token expira en 2h |
| Email | Nodemailer | 8.x | Cola con retry (3 intentos) |
| Seguridad | helmet | 8.x | Security headers |
| Rate Limiting | express-rate-limit | 8.x | 100 req/15min general, 5/15min login |
| Despliegue | Docker Compose | - | NAS Synology DS723+ |

---

## 3. Arquitectura del Proyecto

```
Pendientes Bei/                          # Raíz del proyecto (SynologyDrive)
├── backend/                             # Servidor Express + datos
│   ├── index.js                         # Servidor principal (1238 líneas)
│   ├── package.json                     
│   ├── Dockerfile                       # Imagen Docker multi-stage
│   ├── ecosystem.config.js              # PM2 config (legacy, no usado)
│   ├── .env                             # Variables de producción
│   ├── public/images/                   # Imágenes subidas
│   ├── data/                            # Base de datos JSON
│   │   ├── pendientes.json              # ~280 productos
│   │   ├── orders.json                  # ~137 pedidos
│   │   ├── categories.json              # 4 categorías
│   │   ├── requests.json                # Solicitudes disponibilidad
│   │   ├── email_queue.json             # Cola de emails
│   │   └── email_templates/             # Plantillas (embebidas en index.js)
│   ├── frontend-react/dist/             # Build de producción (copia)
│   ├── scripts/                         # Utilidades
│   │   ├── backup.js                    # Script de backup
│   │   ├── generate-sitemap.js
│   │   └── test_email.js
│   ├── backups/                        # Backups automáticos
│   ├── logs/                           # Logs del servidor
│   └── sql/                            # Schemas SQL (no usado)
│
├── frontend-react/                     # Código fuente frontend
│   ├── src/
│   │   ├── App.jsx                     # Componente principal
│   │   ├── main.jsx                    # Entry point
│   │   ├── index.css                   # Estilos globales + Tailwind
│   │   ├── context/                    # Estado global (React Context)
│   │   │   ├── AdminContext.jsx        # Autenticación JWT
│   │   │   ├── CartContext.jsx         # Carrito de compras
│   │   │   ├── ConfigContext.jsx       # Config pública (WhatsApp, OG)
│   │   │   └── FavoritesContext.jsx    # Favoritos
│   │   ├── components/                 # Componentes React
│   │   │   ├── Header.jsx              # Navegación + login admin
│   │   │   ├── Hero.jsx                # Banner principal
│   │   │   ├── SeasonalBanner.jsx      # Banner dinámico
│   │   │   ├── ProductGrid.jsx         # Grid de productos
│   │   │   ├── ProductCard.jsx         # Tarjeta producto
│   │   │   ├── ProductModal.jsx        # Modal detalle producto
│   │   │   ├── AdminProductModal.jsx   # Modal CRUD productos
│   │   │   ├── CartDrawer.jsx          # Panel carrito
│   │   │   ├── Footer.jsx              # Pie de página
│   │   │   ├── AdminOrdersPanel.jsx    # Panel gestión pedidos
│   │   │   ├── ContactPage.jsx         # Página contacto
│   │   │   ├── FavoritesPage.jsx      # Página favoritos
│   │   │   ├── TrustBadges.jsx        # Badges de confianza
│   │   │   ├── ImageUploader.jsx       # Upload drag & drop
│   │   │   └── Toast.jsx              # Notificaciones
│   │   └── data/
│   │       └── products.json           # Cache local (no usado activamente)
│   ├── public/images/                  # Assets estáticos
│   ├── dist/                          # Build de producción
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── eslint.config.js
│   └── package.json
│
├── scripts/                           # Scripts de gestión (root)
│   ├── setup.sh                       # Configuración inicial
│   ├── manage.sh                      # Menú interactivo Docker
│   └── deploy.sh                      # Despliegue automatizado
│
├── docker-compose.yml                 # Orquestación Docker
├── Dockerfile (en backend/)           # Imagen del backend
├── .env                               # Variables producción
├── .env.docker                        # Template variables
├── PRD.md                             # Requisitos del producto
├── SDD.md                             # Este documento
├── SPEC.md                            # Especificación técnica
├── README.md                          # Documentación general
├── CLAUDE.md                          # Personalidad del agente
├── agents.md                          # Instrucciones de identidad
└── .clinerules                        # Reglas de desarrollo
```

---

## 4. Arquitectura de Capas

### 4.1 Frontend Architecture

**Patrón de Estado:**
- React Context API para estado global (Admin, Cart, Config, Favorites)
- `localStorage` para persistencia de sesión y carrito
- Fetch API para comunicación con backend

**Routing:**
- SPA (Single Page Application) sin react-router
- Las "rutas" son estados booleanos en App.jsx (`showOrdersPanel`, `showContact`, `showFavorites`)
- Catch-all route en backend sirve index.html para rutas del cliente

**Flujo de Datos:**
```
┌─────────────┐     fetch('/api/...')     ┌─────────────┐
│   React     │ ─────────────────────────► │   Express   │
│   Frontend  │                           │   Backend   │
│   (Puerto   │ ◄──────────────────────── │   (:3001)   │
│   Proxy)    │        JSON               │             │
└─────────────┘                           └─────────────┘
                                                │
                                        ┌───────┴───────┐
                                        ▼               ▼
                                  ┌──────────┐   ┌──────────┐
                                  │   JSON   │   │  Nodemailer
                                  │  Files   │   │  (Gmail) │
                                  └──────────┘   └──────────┘
```

### 4.2 Backend Architecture

**Middlewares activos:**
| Middleware | Descripción |
|------------|-------------|
| helmet | Security headers (XSS, clickjacking, etc.) |
| express-rate-limit | 100 req/15min general, 5 attempts/15min for login |
| cors | Habilita CORS |
| express.json() | Parseo JSON |
| morgan | Logging HTTP |
| express.static() | Archivos estáticos del frontend e imágenes |
| multer | File upload handling (imágenes) |

**Lógica embebida en index.js:**
- Autenticación JWT (`verifyToken`)
- Sistema de cola de emails con retry
- Plantillas HTML para emails transaccionales
- Validación de datos de entrada
- Sanitización de strings

### 4.3 Data Layer

**Sistema de archivos JSON** con helpers de lectura/escritura:

```javascript
// Helpers en backend/index.js
async function readJSON(file)     // Lee y parsea JSON (con fallback defensivo)
async function writeJSON(file, data)  // Escribe JSON con formatting
```

**Archivos de datos:**
| Archivo | Contenido | Líneas aprox. |
|---------|-----------|---------------|
| pendientes.json | Catálogo de productos | ~280 |
| orders.json | Pedidos realizados | ~137 |
| categories.json | Categorías disponibles | 4 items |
| requests.json | Solicitudes de disponibilidad | - |
| email_queue.json | Cola de envío de emails | - |

**Storage Paths:**
- `backend/frontend-react/public/images/` → `backend/public/images/` → servidas en `/images/`

---

## 5. API Design

### 5.1 Endpoints

| Método | Path | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/login` | No | Login admin (password → JWT) |
| GET | `/api/pendientes` | No | Listar productos |
| POST | `/api/pendientes` | JWT | Crear producto |
| PUT | `/api/pendientes/:id` | JWT | Actualizar producto |
| DELETE | `/api/pendientes/:id` | JWT | Eliminar producto |
| GET | `/api/categories` | No | Listar categorías |
| POST | `/api/categories` | JWT | Crear categoría |
| DELETE | `/api/categories/:name` | JWT | Eliminar categoría |
| GET | `/api/orders` | No | Listar pedidos |
| POST | `/api/orders` | No | Crear pedido |
| PUT | `/api/orders/:id` | JWT | Actualizar pedido |
| DELETE | `/api/orders/:id` | JWT | Eliminar pedido |
| GET | `/api/stats` | JWT | Estadísticas (admin) |
| POST | `/api/contact` | No | Enviar mensaje de contacto |
| POST | `/api/test-email` | JWT | Probar configuración email |
| POST | `/api/upload` | JWT | Subir imágenes |
| DELETE | `/api/images/:filename` | JWT | Eliminar imagen |
| GET | `/api/config` | No | Configuración pública (WhatsApp) |

### 5.2 Security

| Middleware | Configuración |
|------------|---------------|
| helmet | Security headers completos + CSP personalizado |
| rate-limit | 100 req/15min general, 5 attempts/15min for login |
| JWT expiry | 2 horas |

### 5.3 Request/Response Shapes

**Producto (pendientes.json):**
```json
{
  "id": 1771064722405,
  "nombre": "Margaritas",
  "precio": 7,
  "stock": 3,
  "categoria": "Aros",
  "colores": ["blanco", "rosa"],
  "descripcion": "Pendientes de arcilla...",
  "imagen_principal": "/images/1771064720916-766826731.jpg",
  "fotos": []
}
```

**Pedido (orders.json):**
```json
{
  "id": "1771441846180",
  "date": "2026-02-18T19:10:46.180Z",
  "status": "Pendiente",
  "items": [
    {
      "id": "1771065675993",
      "qty": 1,
      "color": null,
      "nombre": "Pentaflowers",
      "precio": 7,
      "imagen": "/images/..."
    }
  ],
  "customer": {
    "nombre": "María",
    "apellidos": "",
    "email": "maria@ejemplo.com",
    "telefono": "600123456",
    "direccion": "Calle Ejemplo 123"
  },
  "shippingMethod": "recogida",
  "shippingCost": 0,
  "subtotal": 7,
  "total": 7
}
```

**Login Request:**
```json
{ "password": "coquito.2025" }
```

**Login Response:**
```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

---

## 6. Data Models

### 6.1 User
No existe modelo de usuario. La autenticación es single-admin:
- **Admin**: Contraseña almacenada en `.env` (`ADMIN_PASSWORD`)
- **Cliente**: Sin login, compra como invitado

### 6.2 Product (Producto)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | Number | ID único (timestamp) |
| nombre | String | Nombre del producto |
| precio | Number | Precio en euros |
| stock | Number | Cantidad disponible |
| categoria | String | Categoría del producto |
| colores | Array | Colores disponibles |
| descripcion | String | Descripción del producto |
| imagen_principal | String | Ruta a imagen principal |
| fotos | Array | Galería de imágenes adicionales |

### 6.3 Category (Categoría)
Simple array de strings en `categories.json`:
```json
["Aros", "Otros", "Charms", "Minis"]
```

### 6.4 Order (Pedido)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | String | ID único (timestamp) |
| date | ISO Date | Fecha de creación |
| status | String | Estado: Pendiente, En Preparación, Enviado, Entregado, Cancelado |
| items | Array | Array de items con producto y cantidad |
| customer | Object | Datos del cliente |
| shippingMethod | String | Método: "recogida", "mano", "domicilio" |
| shippingCost | Number | Coste de envío |
| subtotal | Number | Subtotal sin envío |
| total | Number | Total con envío |

---

## 7. Authentication

**Flujo JWT:**
1. Admin envía POST a `/api/login` con password
2. Backend verifica contra `ADMIN_PASSWORD` (`.env`)
3. Si correcto, genera JWT con expiry **2 horas**
4. Admin guarda token en localStorage
5. Requests a rutas protegidas incluyen `Authorization: Bearer <token>`

**Rutas protegidas (requieren JWT):**
- POST /api/pendientes (crear)
- PUT /api/pendientes/:id (actualizar)
- DELETE /api/pendientes/:id (eliminar)
- POST /api/categories (crear)
- DELETE /api/categories/:name (eliminar)
- PUT /api/orders/:id (actualizar)
- DELETE /api/orders/:id (eliminar)
- GET /api/stats (estadísticas)
- POST /api/test-email (probar email)
- POST /api/upload (subir imágenes)
- DELETE /api/images/:filename (eliminar imagen)

**Middleware verifyToken (backend/index.js:556-574):**
```javascript
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
```

---

## 8. Email System

### 8.1 Sistema de Cola

**Arquitectura:**
- Background worker cada 10 segundos
- Retry hasta 3 intentos por email
- Logging en `email_debug.log`
- Templates HTML embebidos en index.js

**Flujo:**
```
Pedido creado → addToQueue() → EmailQueueProcessor 
                                         ↓
                              ┌──────────┴──────────┐
                              ↓                      ↓
                         Éxito                   Fallo
                      (remove from               (incrementa 
                       queue)                     attempts)
```

### 8.2 Email Templates

| Template | Destinatario | Trigger |
|----------|--------------|---------|
| order_confirmation.html | Cliente | Nuevo pedido |
| order_status.html | Cliente | Cambio de estado |
| availability_request.html | Admin | Solicitud disponibilidad |
| admin_notification.html | Admin | Nuevo pedido |

### 8.3 Configuración

```env
EMAIL_USER=harmonyyclay@gmail.com
EMAIL_PASS=app_password_gmail
```

---

## 9. Despliegue

### 9.1 Arquitectura Docker

```
┌─────────────────────────────────────────────────────────┐
│              NAS Synology DS723+                         │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │         Docker Network: harmony-network            │  │
│  │                                                     │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌───────────┐  │  │
│  │  │    app      │  │     db      │  │  tunnel   │  │  │
│  │  │  puerto    │  │   :3306     │  │  :5053    │  │  │
│  │  │  3001→ext  │  │  MariaDB    │  │  cloudfl  │  │  │
│  │  │  Express   │  │  (NO USADO) │  │   ared    │  │  │
│  │  │  + React   │  │             │  │  (⚠️ un-  │  │  │
│  │  │            │  │             │  │  healthy) │  │  │
│  │  └─────────────┘  └─────────────┘  └───────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 9.2 Servicios Docker

| Servicio | Imagen | Puerto | Propósito | Estado |
|----------|--------|--------|-----------|--------|
| app | Custom (Dockerfile) | 3001 | Backend API + Frontend estático | ✅ Healthy |
| db | lscr.io/linuxserver/mariadb | 3306 | MariaDB | ⚠️ Configurado pero NO usado |
| tunnel | crazymax/cloudflared | 5053/udp | Tunnel Cloudflare | ⚠️ Unhealthy |

### 9.3 Scripts de Gestión

| Script | Uso | Descripción |
|--------|-----|-------------|
| `setup.sh` | Una vez | Configura permisos, backup automático |
| `manage.sh` | Diario | Menú interactivo (start, stop, restart, logs, etc.) |
| `deploy.sh` | Deploy | Construye y despliega toda la aplicación |
| `backend/scripts/backup-cron.sh` | Automático | Backup de datos (usado por cron) |

**Comandos directos:**
```bash
./manage.sh start    # Iniciar
./manage.sh stop     # Detener
./manage.sh restart  # Reiniciar
./manage.sh rebuild  # Rebuild completo
./manage.sh status   # Ver estado
./manage.sh logs     # Ver logs
./manage.sh backup   # Hacer backup
./manage.sh health   # Health check
./manage.sh test     # Test API
```

### 9.4 Environment Variables

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| PORT | Puerto del servidor | 3001 |
| SECRET_KEY | Clave para JWT | tu_clave_secreta |
| ADMIN_PASSWORD | Contraseña admin | coquito.2025 |
| EMAIL_USER | Gmail para nodemailer | harmonyyclay@gmail.com |
| EMAIL_PASS | App password de Gmail | xxxxxxxxxxxxxxxx |
| WHATSAPP_NUMBER | Número WhatsApp | +34645599038 |
| CLOUDFLARE_TUNNEL_TOKEN | Token del tunnel | - |

---

## 10. Patterns & Conventions

### 10.1 Estado Global (React Context)
```javascript
// AdminContext: JWT token en localStorage
const [token, setToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY));

// CartContext: Carrito en localStorage
const [items, setItems] = useState(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
});
```

### 10.2 API Calls
- Fetch API con headers JSON
- JWT en header `Authorization: Bearer <token>`
- Manejo de errores con try/catch

### 10.3 SPA Routing
- No usa react-router
- Estados booleanos en App.jsx: `showOrdersPanel`, `showContact`, `showFavorites`
- Backend catch-all route: `app.get('*')` → serve index.html

### 10.4 Image Upload System
- Multer configurado con diskStorage a `public/images/`
- Batch upload con drag & drop UI
- Automatic cleanup of orphaned images on product delete
- Tipos permitidos: jpeg, png, webp, gif
- Límite: 5MB por archivo

---

## 11. Feature Status

### 11.1 Completed Features

| Feature | Status | Implementado |
|---------|--------|-------------|
| Trust Badges | ✅ | Visual trust signals |
| Open Graph | ✅ | Meta tags para redes sociales |
| Security Headers | ✅ | helmet.js + express-rate-limit |
| i18n | ✅ REMOVED | Eliminada complejidad no usada |
| Backup Automation | ✅ | backup.js + cron setup |
| Image Upload | ✅ | Multer + drag & drop |
| JWT Auth | ✅ | Login + token refresh manual |
| Email Queue | ✅ | Sistema robusto con retry |
| Seasonal Banner | ✅ | Banner dinámico |
| Product CRUD | ✅ | AdminProductModal |
| Order Management | ✅ | AdminOrdersPanel |
| Favorites | ✅ | FavoritesContext + localStorage |

### 11.2 Issues Conocidos

| Issue | Prioridad | Estado |
|-------|-----------|--------|
| Cloudflare Tunnel unhealthy | Alta | ⚠️ Pendiente resolver |
| JWT expira en 2h | Media | Conocido - causa re-login |
| MariaDB configurado pero no usado | Baja | No afecta funcionamiento |

---

## 12. Mejoras Recomendadas

| # | Mejora | Prioridad | Esfuerzo |
|---|--------|-----------|----------|
| 1 | Resolver Cloudflare Tunnel unhealthy | Alta | Bajo |
| 2 | Implementar refresh token JWT | Media | Medio |
| 3 | Migrar a MariaDB (usar la BD) | Baja | Alto |
| 4 | Tests automatizados | Baja | Alto |
| 5 | Logging estructurado (Winston) | Baja | Medio |
| 6 | Sistema de cuentas de cliente | Media | Alto |
| 7 | Pasarela de pago real | Alta | Alto |

---

## 13. Incidentes y Resoluciones

### 13.1 Caída de contenedores post-reinicio NAS (2026-03-20)

**Problema:**
- Reinicio automático del NAS por actualización
- Contenedor `pendientes-bei-app` caído (crash loop)
- Contenedor `pendientes-bei-db` muerto
- Contenedor `pendientes-bei-tunnel` en unhealthy state

**Causa raíz:**
- Los bind mounts no incluían `node_modules`
- La imagen Docker no tenía dependencias preinstaladas

**Solución implementada:**
1. Creación de `Dockerfile` multi-stage para el backend con dependencias bundladas
2. Creación de `docker-compose.yml` con todos los servicios (app, db, tunnel)
3. Migración de configuración manual a infraestructura como código (IaC)
4. Script `deploy.sh` para despliegue reproducible

### 13.2 Upload infinito por JWT expirado (2026-03-20)

**Problema:**
- Bea no podía subir imágenes (loading infinito)
- El servidor devolvía 403 "Token inválido" silenciosamente

**Causa raíz:**
- JWT expira en 2 horas
- Bea tenía la sesión abierta desde hacía tiempo

**Solución:**
- Educar a Bea sobre re-login periódico
- Considerar implementar refresh token (pendiente)

---

**Documento generado**: 2026-03-19
**Última actualización**: 2026-03-21
**Próxima revisión**: Cuando se implementen funcionalidades Fase 2
