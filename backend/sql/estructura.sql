-- Base de datos Pendientes Bei - Estructura para MariaDB

CREATE DATABASE IF NOT EXISTS pendientes_bei;
USE pendientes_bei;

-- Tabla de productos
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    precio DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock INT NOT NULL DEFAULT 0,
    categoria VARCHAR(100) DEFAULT 'General',
    descripcion TEXT,
    imagen_principal VARCHAR(500) DEFAULT NULL,  -- Foto principal
    fotos JSON DEFAULT NULL,                      -- Array de fotos adicionales
    colors JSON DEFAULT NULL,                      -- Colores disponibles
    idioma_default VARCHAR(10) DEFAULT 'es',      -- Idioma principal del producto
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_nombre VARCHAR(255),
    cliente_email VARCHAR(255),
    cliente_telefono VARCHAR(50),
    productos JSON NOT NULL,  -- Array de productos pedidos
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de configuración global
CREATE TABLE IF NOT EXISTS config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar configuración inicial
INSERT INTO config (clave, valor) VALUES 
    ('idioma_default', 'es'),
    ('titulo_web', 'Harmony Clay - Pendientes Artesanales'),
    ('moneda', 'EUR'),
    ('iva', '21')
ON DUPLICATE KEY UPDATE valor = VALUES(valor);

-- Migrar datos existentes de JSON (ejemplo)
-- INSERT INTO productos (nombre, precio, stock, categoria, descripcion, imagen_principal, fotos, colors)
-- SELECT 
--     nombre,
--     precio,
--     stock,
--     categoria,
--     COALESCE(descripcion, ''),
--     imagen,
--     fotos,
--     colors
-- FROM ...;
