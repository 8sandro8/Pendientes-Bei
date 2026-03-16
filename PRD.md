# Product Requirements Document (PRD): Evolución Harmony Clay

## 1. Contexto y Estado Actual (CRÍTICO)
El proyecto "Pendientes Bei" (harmonyclay.es) ya es una aplicación full-stack en producción alojada en un Synology NAS. 
- **Backend existente:** Node.js gestionado con PM2 (puerto 3017).
- **Infraestructura:** Cloudflare Tunnels (Zero Trust) para enrutamiento seguro sin CG-NAT.
- **Lógica actual:** Sistema robusto de colas de emails HTML premium, protección contra duplicados y gestión de solicitudes.

## 2. Objetivo de esta Iteración
No queremos reescribir el backend ni la infraestructura de red. El objetivo es modernizar exclusivamente la capa de presentación (Frontend) para conectarla con nuestro backend existente en Node.js, mejorando la experiencia de usuario (UI/UX) del catálogo y el carrito de compras.

## 3. Alcance (In Scope)
- **Refactorización Frontend:** Migrar la interfaz visual a un stack moderno (preferiblemente React + Tailwind CSS) que consuma los endpoints de nuestro backend Node.js en el puerto 3017.
- **Catálogo y Carrito:** Implementar un grid visual de productos y un carrito lateral que guarde el estado localmente antes de enviar la solicitud final a nuestra cola de Node.js.
- **Integración fluida:** El nuevo frontend debe compilarse y servirse de manera que sea compatible con nuestro ecosistema PM2 + Cloudflare Tunnels actual.

## 4. Fuera de Alcance (Out of Scope)
- Modificar el sistema de túneles `cloudflared` o el script `install_cloudflared.sh`.
- Alterar la lógica central de la cola de emails asíncrona del backend.