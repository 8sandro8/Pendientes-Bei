# 🎯 Documento de Requisitos del Producto (PRD)
# Proyecto: Harmony Clay
**Versión**: 2.0 | **Última actualización**: 2026-03-21
**URL**: https://www.harmonyclay.es

---

## 1. Visión General

**Harmony Clay** es una tienda online de e-commerce para la venta de **pendientes artesanales hechos a mano con arcilla polimérica**. El sistema está optimizado para la experiencia de la artesana (Bea) como administradora y para clientes que buscan piezas únicas y personalizadas.

La web ofrece un catálogo visual atractivo, gestión de pedidos por email y un panel de administración completo para gestionar productos, categorías e inventario.

---

## 2. Público Objetivo

| Segmento | Descripción |
|----------|-------------|
| **Cliente principal** | Mujeres de 20-50 años interesadas en bisutería artesanal y accesorios únicos |
| **Cliente secundario** | Personas buscando regalos originales y personalizados |
| **Administradora** | Bea (artesana) - gestiona productos, pedidos e inventario desde el panel admin |

---

## 3. Funcionalidades Core (IMPLEMENTADAS ✅)

### 3.1 Vista Cliente

| # | Funcionalidad | Estado | Descripción |
|---|--------------|--------|-------------|
| 1 | Catálogo de productos | ✅ | Grid responsivo con todos los pendientes |
| 2 | Búsqueda en tiempo real | ✅ | Filtrado por nombre de producto |
| 3 | Filtro por categorías | ✅ | Aros, Otros, Charms, Minis |
| 4 | Favoritos | ✅ | Guardar productos sin comprar (localStorage) |
| 5 | Carrito de compras | ✅ | Añadir, modificar cantidades, eliminar (localStorage) |
| 6 | Modal de producto | ✅ | Detalle con selección de color y cantidad |
| 7 | Formulario de contacto | ✅ | Envío de mensaje por email a admin |
| 8 | WhatsApp flotante | ✅ | Enlace directo para atención rápida |
| 9 | Trust badges | ✅ | Pago seguro, envío gratis, artesanal |
| 10 | Banner seasonal | ✅ | Banner dinámico según época del año |
| 11 | Open Graph | ✅ | Meta tags optimizados para redes sociales |
| 12 | Diseño responsive | ✅ | Móvil, tablet y escritorio |
| 13 | Selector de color | ✅ | Colores disponibles por producto |
| 14 | Productos relacionados | ✅ | Sugerencias en modal de producto |

### 3.2 Vista Administrador

| # | Funcionalidad | Estado | Descripción |
|---|--------------|--------|-------------|
| 1 | Login seguro | ✅ | Password → JWT (expira 2h) |
| 2 | Panel de pedidos | ✅ | Ver, editar estado, eliminar pedidos |
| 3 | Estadísticas | ✅ | Pedidos hoy, ingresos, total, stock |
| 4 | CRUD productos | ✅ | Crear, editar, eliminar productos |
| 5 | CRUD categorías | ✅ | Crear, eliminar categorías |
| 6 | Subida de imágenes | ✅ | Drag & drop, múltiples archivos |
| 7 | Galería de producto | ✅ | Múltiples fotos por producto |
| 8 | Notificaciones email | ✅ | Email a admin y cliente al crear pedido |
| 9 | Cola de emails | ✅ | Sistema robusto con retry (3 intentos) |
| 10 | Test de email | ✅ | Endpoint para verificar configuración |

### 3.3 Sistema de Pedidos

| # | Funcionalidad | Estado | Descripción |
|---|--------------|--------|-------------|
| 1 | Crear pedido | ✅ | Formulario con datos cliente + items |
| 2 | Estados de pedido | ✅ | Pendiente, En Preparación, Enviado, Entregado, Cancelado |
| 3 | Email a admin | ✅ | Notificación con detalles del pedido |
| 4 | Email a cliente | ✅ | Confirmación de pedido |
| 5 | Métodos de envío | ✅ | Recogida, Entrega en mano, Envío a domicilio |
| 6 | Validación | ✅ | Email válido, al menos 1 producto |

---

## 4. Funcionalidades Futuras (Para la Fase 2)

### 4.1 Funcionalidades Pendientes

| # | Funcionalidad | Prioridad | Notas |
|---|--------------|-----------|-------|
| 1 | Cuenta de cliente | Alta | Login para ver historial de pedidos |
| 2 | Pasarela de pago real | Alta | Stripe/MercadoPago integrado |
| 3 | Validación de stock | Media | Evitar pedidos de productos sin stock |
| 4 | Migración a MariaDB | Baja | Sistema JSON actual funciona bien |
| 5 | Tests automatizados | Baja |覆盖率 actual: 0% |

### 4.2 Mejoras Técnicas

| # | Mejora | Prioridad | Notas |
|---|--------|-----------|-------|
| 1 | Resolver Cloudflare Tunnel | Alta | Estado "unhealthy" |
| 2 | Refresh token JWT | Media | Evitar logout cada 2h |
| 3 | Logging estructurado | Baja | Winston o similar |
| 4 | Caching de productos | Baja | Redis para mejorar rendimiento |

---

## 5. Restricciones y Reglas de Negocio

### 5.1 Diseño y Marca
- ✅ Mantener el diseño actual (rosa/beige artesanal)
- ✅ Tipografía: Playfair Display (headings) + Outfit (body)
- ✅ Paleta: Rosa (#d81b60), Beige (#f5f0eb), Dorado (#d4a574)

### 5.2 Operaciones
- ⚠️ **No hay pasarela de pago**: Los pedidos se confirman por email/WhatsApp
- ⚠️ **Envío manual**: La entrega se coordina directamente con el cliente
- ⚠️ **Stock manual**: Bea actualiza el stock al preparar/entregar pedidos

### 5.3 Técnicas
- ⚠️ **JSON como BD**: Datos en archivos JSON (no SQL)
- ⚠️ **JWT 2h**: El token expira, causando logout automático
- ⚠️ **Single-admin**: Solo una contraseña para acceso admin

---

## 6. Modelo de Datos

### 6.1 Producto (pendientes.json)
```json
{
  "id": 1771064722405,
  "nombre": "Margaritas",
  "precio": 7,
  "stock": 3,
  "categoria": "Aros",
  "colores": ["blanco", "rosa"],
  "descripcion": "Pendientes de arcilla polimérica...",
  "imagen_principal": "/images/1771064720916-766826731.jpg",
  "fotos": ["/images/extra1.jpg", "/images/extra2.jpg"]
}
```

### 6.2 Pedido (orders.json)
```json
{
  "id": "1773485317692",
  "date": "2026-03-14T10:48:37.692Z",
  "status": "Pendiente",
  "items": [
    { "id": 123, "nombre": "Flores", "qty": 1, "precio": 5, "color": "negro", "imagen": "/images/..." }
  ],
  "customer": {
    "nombre": "María",
    "email": "maria@ejemplo.com",
    "telefono": "600123456",
    "direccion": "Calle Ejemplo 123, Zaragoza"
  },
  "shippingMethod": "recogida",
  "subtotal": 5,
  "shippingCost": 0,
  "total": 5
}
```

### 6.3 Categoría (categories.json)
```json
["Aros", "Otros", "Charms", "Minis"]
```

---

## 7. APIs del Sistema

### 7.1 Endpoints Públicos
| Método | Path | Descripción |
|--------|------|-------------|
| GET | `/api/pendientes` | Listar todos los productos |
| GET | `/api/categories` | Listar categorías |
| GET | `/api/orders` | Listar pedidos |
| POST | `/api/orders` | Crear nuevo pedido |
| POST | `/api/contact` | Enviar mensaje de contacto |
| GET | `/api/config` | Configuración pública (WhatsApp) |

### 7.2 Endpoints Protegidos (JWT)
| Método | Path | Descripción |
|--------|------|-------------|
| POST | `/api/login` | Login admin (password → JWT) |
| POST | `/api/pendientes` | Crear producto |
| PUT | `/api/pendientes/:id` | Actualizar producto |
| DELETE | `/api/pendientes/:id` | Eliminar producto |
| POST | `/api/categories` | Crear categoría |
| DELETE | `/api/categories/:name` | Eliminar categoría |
| PUT | `/api/orders/:id` | Actualizar pedido |
| DELETE | `/api/orders/:id` | Eliminar pedido |
| GET | `/api/stats` | Estadísticas del admin |
| POST | `/api/upload` | Subir imágenes |
| DELETE | `/api/images/:filename` | Eliminar imagen |
| POST | `/api/test-email` | Probar configuración email |

---

## 8. Estados de Pedido

| Estado | Descripción | Color UI |
|--------|-------------|----------|
| Pendiente | Nuevo pedido recibido | 🟡 Amarillo |
| En Preparación | Bea está preparando el pedido | 🔵 Azul |
| Enviado | Pendiente de entrega/recogida | 🟣 Púrpura |
| Entregado | Pedido completado | 🟢 Verde |
| Cancelado | Pedido cancelado | 🔴 Rojo |

---

## 9. Métricas del Sistema (Marzo 2026)

| Métrica | Valor |
|---------|-------|
| Total productos | ~280 |
| Total pedidos | ~137 |
| Ingresos totales | [Consultar panel admin] |
| Categorías | 4 |
| Usuarios registrados | 0 (sin sistema de cuentas) |

---

## 10. Issues Conocidos

| # | Issue | Prioridad | Estado |
|---|-------|-----------|--------|
| 1 | Cloudflare Tunnel "unhealthy" | Alta | ⚠️ Pendiente |
| 2 | JWT expira en 2h | Media | Conocido, trabajar alrededor |
| 3 | MariaDB configurado pero no usado | Baja | No afecta funcionamiento |

---

*Documento generado*: 2026-03-19
*Última actualización*: 2026-03-21
*Próxima revisión*: Cuando se implementen funcionalidades Fase 2
