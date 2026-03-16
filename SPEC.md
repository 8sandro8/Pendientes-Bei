# SPEC.md - Harmony Clay E-commerce

## 1. Visión General

- **Nombre**: Harmony Clay - Tienda de Pendientes
- **Tipo**: E-commerce de catálogo con carrito
- **Stack**: React 18 + Vite + Tailwind CSS
- **Objetivo**: Catálogo visual de pendientes artesanales con carrito en LocalStorage

---

## 2. Estructura del Proyecto

```
/frontend-react
├── public/
│   └── images/          # Copiar desde frontend/images/
├── src/
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── Hero.jsx
│   │   ├── ProductGrid.jsx
│   │   ├── ProductCard.jsx
│   │   ├── ProductModal.jsx    # Modal detalle producto
│   │   ├── CartDrawer.jsx
│   │   ├── CartItem.jsx
│   │   └── Footer.jsx
│   ├── context/
│   │   └── CartContext.jsx
│   ├── data/
│   │   └── products.json
│   ├── hooks/
│   │   └── useLocalStorage.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 3. Modelo de Datos

### Product
```typescript
interface Product {
  id: string | number;
  nombre: string;
  precio: number;
  stock: number;
  categoria: string;
  imagen: string;
  descripcion?: string;
  colors?: string[];
  photos?: string[];
}
```

### CartItem
```typescript
interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}
```

---

## 4. Componentes UI

### Header
- Logo "HARMONY CLAY" (Izquierda)
- Botón carrito con badge contador (Derecha)
- Fondo: blanco/transparente con shadow en scroll

### Hero
- Imagen de fondo o color degradado elegante
- Título: "Colección Exclusiva"
- Subtítulo: "Pendientes artesanales hechos a mano"
- Botón CTA: "Ver Colección" (scroll a productos)

### ProductGrid
- Grid responsivo: 1 col (mobile) → 2 col (tablet) → 3-4 col (desktop)
- Gap: 24px
- Productos filtrados por categoría (opcional)

### ProductCard
- Imagen cuadrada aspect-ratio 1:1
- Hover: zoom sutil en imagen
- Título producto
- Precio
- Badge de stock (verde=disponible, rojo=sin stock)
- Botón "Añadir al carrito"

### ProductModal (al hacer click en tarjeta)
- Imagen grande
- Título, precio, descripción
- Selector de color (si tiene colors)
- Cantidad
- Botón "Añadir al carrito"

### CartDrawer (panel lateral)
- Slide-in desde derecha
- Lista de items con:
  - Imagen miniatura
  - Nombre
  - Color seleccionado (si aplica)
  - Cantidad +/-
  - Precio unitario
  - Botón eliminar
- Total calculado
- Botón "Vaciar carrito"
- Botón "Simular compra" (muestra alerta)

### Footer
- Copyright
- Redes sociales (iconos)
- Links simples

---

## 5. Funcionalidad del Carrito

### Estado (Context API)
```javascript
{
  items: CartItem[],
  isOpen: boolean
}
```

### Operaciones
- **addToCart(product, color, quantity)**: Añade o incrementa
- **removeFromCart(productId)**: Elimina item
- **updateQuantity(productId, quantity)**: Cambia cantidad
- **clearCart()**: Vacía todo
- **toggleCart()**: Abre/cierra drawer

### Persistencia
- Sincronización automática con LocalStorage en cada cambio
- Key: `harmony_cart`
- Carga inicial desde LocalStorage

---

## 6. Diseño Visual

### Paleta de Colores
- **Primario**: `#1a1a1a` (negro/gris oscuro)
- **Secundario**: `#f5f0eb` (crema/beige)
- **Acento**: `#d4a574` (dorado suave)
- **Fondo**: `#ffffff` (blanco)
- **Texto**: `#333333` (gris medio)
- **Error/Sin stock**: `#c45c5c` (rojo suave)
- **Success**: `#5c9c6c` (verde suave)

### Tipografía
- **Headings**: "Playfair Display" (serif, elegante)
- **Body**: "Outfit" (sans-serif, moderna)

### Espaciado
- Container max-width: 1280px
- Padding mobile: 16px
- Padding desktop: 32px

### Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

---

## 7. Productos Iniciales

Cargar desde `backend/data/pendientes.json` (copiar a `src/data/products.json`)

Campos a usar:
- `id`, `nombre`, `precio`, `stock`, `categoria`, `imagen`, `colors`

---

## 8. Rendimiento

- Imágenes: Usar lazy loading con `loading="lazy"`
- Optimizar imágenes del frontend actual antes de copiar
- Componentes simples, evitar re-renders innecesarios

---

## 9. Funcionalidades Futuras (Out of Scope)

- Pasarela de pago real
- Panel de administración
- Backend API
- Autenticación
- Envío de emails

---

## 10. Flujo de Usuario

1. Llega a Landing → Ve Hero
2. Scroll a Productos → Explora Grid
3. Click en producto → Abre Modal
4. Selecciona color (opcional) → Cantidad → Añade
5. Click carrito → Ve drawer con items
6. Finaliza (simulado) → Alerta "Gracias por tu compra"
