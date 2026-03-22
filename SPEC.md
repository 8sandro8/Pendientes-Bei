# SPEC.md - Harmony Clay E-commerce
**Versión**: 2.0 | **Última actualización**: 2026-03-21
**URL**: https://www.harmonyclay.es

---

## 1. Visión General

- **Nombre**: Harmony Clay - Tienda de Pendientes Artesanales
- **Tipo**: E-commerce de catálogo con carrito de compras
- **Stack**: React 19.2.4 + Vite 8 + Tailwind CSS 4.2.1
- **Objetivo**: Catálogo visual de pendientes artesanales con carrito en LocalStorage + panel admin para gestión

---

## 2. Estructura del Proyecto

```
Pendientes Bei/                          # Raíz del proyecto
├── backend/                             # Servidor Express
│   ├── index.js                         # Servidor principal (1238 líneas)
│   ├── Dockerfile                       # Imagen Docker multi-stage
│   ├── package.json
│   ├── .env                             # Variables de producción
│   ├── public/images/                  # Imágenes subidas por admin
│   ├── data/                            # Base de datos JSON
│   │   ├── pendientes.json              # ~280 productos
│   │   ├── orders.json                  # ~137 pedidos
│   │   ├── categories.json              # 4 categorías
│   │   ├── requests.json
│   │   └── email_queue.json
│   ├── frontend-react/dist/             # Build de producción
│   ├── scripts/
│   │   ├── backup.js
│   │   └── test_email.js
│   ├── backups/                         # Backups automáticos
│   └── logs/                            # Logs del servidor
│
├── frontend-react/                      # Código fuente frontend
│   ├── src/
│   │   ├── App.jsx                     # Componente principal (SPA routing)
│   │   ├── main.jsx                     # Entry point
│   │   ├── index.css                    # Tailwind + estilos
│   │   ├── context/
│   │   │   ├── AdminContext.jsx        # Autenticación JWT
│   │   │   ├── CartContext.jsx         # Carrito de compras
│   │   │   ├── ConfigContext.jsx       # Config pública
│   │   │   └── FavoritesContext.jsx    # Favoritos
│   │   └── components/
│   │       ├── Header.jsx              # Navegación + login admin
│   │       ├── Hero.jsx                # Banner principal
│   │       ├── SeasonalBanner.jsx      # Banner dinámico
│   │       ├── ProductGrid.jsx         # Grid de productos
│   │       ├── ProductCard.jsx         # Tarjeta producto
│   │       ├── ProductModal.jsx        # Modal detalle producto
│   │       ├── AdminProductModal.jsx   # Modal CRUD admin
│   │       ├── CartDrawer.jsx          # Panel carrito lateral
│   │       ├── Footer.jsx              # Pie de página
│   │       ├── AdminOrdersPanel.jsx    # Panel gestión pedidos
│   │       ├── ContactPage.jsx         # Página contacto
│   │       ├── FavoritesPage.jsx      # Página favoritos
│   │       ├── TrustBadges.jsx        # Badges de confianza
│   │       ├── ImageUploader.jsx       # Upload drag & drop
│   │       └── Toast.jsx              # Notificaciones
│   ├── public/images/                  # Assets estáticos
│   ├── dist/                          # Build de producción
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── docker-compose.yml                   # Orquestación Docker
├── deploy.sh                           # Script de despliegue
├── manage.sh                           # Menú interactivo
└── setup.sh                            # Configuración inicial
```

---

## 3. Modelo de Datos

### Product (backend/data/pendientes.json)
```typescript
interface Product {
  id: number;                    // Timestamp ID
  nombre: string;                 // Nombre del producto
  precio: number;                // Precio en euros
  stock: number;                 // Cantidad disponible
  categoria: string;             // Categoría (Aros, Otros, Charms, Minis)
  colores: string[];             // Colores disponibles
  descripcion: string;           // Descripción del producto
  imagen_principal: string;      // Imagen principal (/images/...)
  fotos: string[];              // Galería adicional
}
```

### Order (backend/data/orders.json)
```typescript
interface Order {
  id: string;                    // Timestamp ID
  date: string;                  // ISO Date
  status: 'Pendiente' | 'En Preparación' | 'Enviado' | 'Entregado' | 'Cancelado';
  items: OrderItem[];
  customer: Customer;
  shippingMethod: 'recogida' | 'mano' | 'domicilio';
  shippingCost: number;
  subtotal: number;
  total: number;
}

interface OrderItem {
  id: number;
  nombre: string;
  qty: number;
  precio: number;
  color?: string;
  imagen: string;
}

interface Customer {
  nombre: string;
  apellidos?: string;
  email: string;
  telefono: string;
  direccion?: string;
}
```

### CartItem (localStorage)
```typescript
interface CartItem {
  id: number;
  nombre: string;
  precio: number;
  imagen: string;
  cantidad: number;
  color?: string;
}
```

---

## 4. Componentes UI

### Header
- Logo "HARMONY CLAY" centrado
- Imagen circular del logo (click → scroll to top)
- Botones: Admin (login/logout), Pedidos (admin), Carrito
- Fondo: transparente → blanco al hacer scroll
- Carrito con badge contador

### Hero
- Imagen de fondo con overlay degradado
- Título: "Colección Exclusiva"
- Subtítulo: "Pendientes artesanales hechos a mano con arcilla polimérica"
- Botón CTA: "Ver Colección" (scroll a productos)

### SeasonalBanner
- Banner dinámico según época del año
- Mensajes personalizables

### ProductGrid
- Grid responsivo: 1 col (mobile) → 2 col (tablet) → 3-4 col (desktop)
- Búsqueda en tiempo real
- Filtro por categorías
- Lazy loading de imágenes

### ProductCard
- Imagen cuadrada aspect-ratio 1:1
- Hover: zoom sutil en imagen
- Título producto (truncado)
- Precio
- Badge de stock (verde=disponible)
- Botón favorito (corazón)
- Botón "Añadir al carrito"

### ProductModal
- Imagen grande con galería
- Título, precio, descripción
- Selector de color (chips)
- Selector de cantidad (+/-)
- Productos relacionados
- Botón "Añadir al carrito"
- Botón "Ver en favoritos"

### AdminProductModal
- Formulario CRUD completo
- ImageUploader con drag & drop
- Editor de descripción
- Gestión de stock y precios

### CartDrawer (panel lateral derecho)
- Slide-in desde derecha
- Lista de items con:
  - Imagen miniatura
  - Nombre
  - Color seleccionado
  - Cantidad +/-
  - Precio unitario
  - Botón eliminar
- Total calculado
- Métodos de envío (Recogida, Mano, Domicilio)
- Botón "Finalizar Pedido"
- Trust badges

### AdminOrdersPanel
- Split view: lista + detalle
- Estadísticas: Pedidos hoy, Ingresos hoy, Total pedidos, Stock
- Filtro por estado
- Cambio de estado con botones
- Ver datos cliente
- Eliminar pedido

### Footer
- Copyright "© 2026 Harmony Clay. Zaragoza, España"
- Redes sociales (Instagram)
- Enlaces: Contacto, Favoritos

### TrustBadges
- Pago seguro (SVG candado)
- Envío gratuito (SVG regalo)
- 100% Artesanal (SVG mano)
- 2x2 grid mobile, flex desktop

### WhatsAppFloat
- Botón flotante verde (bottom-right)
- Enlace a WhatsApp con número configurado

### Toast
- Notificaciones temporales (éxito, error, info)
- Posición: bottom-right
- Auto-dismiss: 3 segundos

---

## 5. Funcionalidades Core

### Cliente
| # | Funcionalidad | Descripción |
|---|--------------|-------------|
| 1 | Catálogo | Grid responsivo con todos los productos |
| 2 | Búsqueda | Filtrado en tiempo real por nombre |
| 3 | Categorías | Filtro por: Aros, Otros, Charms, Minis |
| 4 | Favoritos | Guardar productos sin comprar (localStorage) |
| 5 | Carrito | Añadir, modificar, eliminar items (localStorage) |
| 6 | Producto detalle | Modal con galería, color, cantidad |
| 7 | Contacto | Formulario envía email a admin |
| 8 | WhatsApp | Botón flotante para atención directa |
| 9 | Trust badges | Señales visuales de confianza |
| 10 | Responsive | Móvil, tablet, escritorio |
| 11 | Productos relacionados | Sugerencias en modal |

### Administrador
| # | Funcionalidad | Descripción |
|---|--------------|-------------|
| 1 | Login | Password → JWT (expira 2h) |
| 2 | CRUD Productos | Crear, editar, eliminar |
| 3 | CRUD Categorías | Crear, eliminar |
| 4 | Upload imágenes | Drag & drop, múltiples archivos |
| 5 | Gestión pedidos | Ver, cambiar estado, eliminar |
| 6 | Estadísticas | Pedidos hoy, ingresos, stock |

### Sistema
| # | Funcionalidad | Descripción |
|---|--------------|-------------|
| 1 | Email automático | Notificación a admin + cliente |
| 2 | Cola de emails | Retry 3 veces, logging |
| 3 | Rate limiting | 100 req/15min, 5 login/15min |
| 4 | Security headers | helmet.js |
| 5 | Validación | Email, productos, pedidos |

---

## 6. Diseño Visual

### Paleta de Colores
| Rol | Color | Uso |
|-----|-------|-----|
| Primario | `#d81b60` | Botones, enlaces, acentos (rosa) |
| Secundario | `#f5f0eb` | Fondos suaves (crema) |
| Acento | `#d4a574` | Precios, highlights (dorado) |
| Fondo | `#ffffff` | Fondo principal |
| Texto | `#333333` | Texto principal |
| Success | `#5c9c6c` | Stock disponible (verde) |
| Error | `#c45c5c` | Sin stock, errores (rojo) |

### Tipografía
| Uso | Font | Estilo |
|-----|------|--------|
| Headings | Playfair Display | Serif, elegante |
| Body | Outfit | Sans-serif, moderna |
| Fallback | system-ui | - |

### Espaciado
| Breakpoint | Max-width | Padding |
|------------|-----------|---------|
| Mobile | 100% | 16px |
| Desktop | 1024px | 24px |

### Responsive Breakpoints
| Dispositivo | Ancho |
|-------------|-------|
| Mobile | < 640px |
| Tablet | 640px - 1024px |
| Desktop | > 1024px |

---

## 7. API Endpoints

### Públicos
```
GET  /api/pendientes      → Listar productos
GET  /api/categories      → Listar categorías
GET  /api/orders          → Listar pedidos
POST /api/orders          → Crear pedido
POST /api/contact         → Enviar contacto
GET  /api/config          → Config pública (WhatsApp)
```

### Protegidos (JWT)
```
POST /api/login           → Login admin
POST /api/pendientes      → Crear producto
PUT  /api/pendientes/:id  → Actualizar producto
DELETE /api/pendientes/:id → Eliminar producto
POST /api/categories      → Crear categoría
DELETE /api/categories/:name → Eliminar categoría
PUT  /api/orders/:id      → Actualizar pedido
DELETE /api/orders/:id    → Eliminar pedido
GET  /api/stats           → Estadísticas
POST /api/upload          → Subir imágenes
DELETE /api/images/:filename → Eliminar imagen
POST /api/test-email      → Probar email
```

---

## 8. Estados de Pedido

| Estado | Color | Descripción |
|--------|-------|-------------|
| Pendiente | 🟡 Amarillo | Nuevo pedido recibido |
| En Preparación | 🔵 Azul | Bea está preparando |
| Enviado | 🟣 Púrpura | Enviado/En camino |
| Entregado | 🟢 Verde | Completado |
| Cancelado | 🔴 Rojo | Cancelado |

---

## 9. Flujo de Usuario

### Cliente
1. Llega a landing → Ve Hero + SeasonalBanner
2. Scroll a Productos → Explora Grid
3. Usa búsqueda/filtros → Encuentra producto
4. Click en producto → Abre Modal
5. Selecciona color + cantidad → Añade al carrito
6. Click carrito → Ve drawer con items
7. Selecciona método envío → Finaliza pedido
8. Recibe email confirmación

### Admin
1. Click en candado → Abre login
2. Ingresa password → Obtiene JWT
3. Ve botón Pedidos → Abre AdminOrdersPanel
4. Cambia estado, elimina, ve detalles
5. Click en producto → Abre AdminProductModal
6. CRUD productos y categorías
7. Sube imágenes con drag & drop

---

## 10. Funcionalidades Futuras (Fase 2)

| # | Funcionalidad | Prioridad |
|---|--------------|-----------|
| 1 | Cuenta de cliente | Alta |
| 2 | Pasarela de pago real (Stripe/MercadoPago) | Alta |
| 3 | Validación de stock en tiempo real | Media |
| 4 | Migración a MariaDB | Baja |
| 5 | Tests automatizados | Baja |
| 6 | Refresh token JWT | Media |
| 7 | App notifications push | Baja |

---

## 11. Rendimiento

- Imágenes: lazy loading nativo
- Carrito: localStorage (sin requests)
- Productos: fetch con cache local
- Rate limiting: protege contra abuse
- Build: Vite optimizado para producción

---

*Documento generado*: 2026-03-19
*Última actualización*: 2026-03-21
