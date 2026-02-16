#!/bin/bash
echo "--- REINICIANDO SERVIDOR PENDIENTES BEI ---"

# 1. Parar PM2
echo "[1/4] Deteniendo PM2..."
pm2 stop all
pm2 delete all
export PORT=3000

# 2. Matar cualquier proceso que ocupe el puerto 3000 (Safety check)
echo "Liberando puerto $PORT..."
fuser -k $PORT/tcp 2>/dev/null
# Mata cualquier node residual
killall -9 node > /dev/null 2>&1

# Esperar un momento
sleep 2

# 3. Arrancar Servidor
echo "[3/4] Arrancando servidor..."
pm2 start ecosystem.config.js --update-env

# 4. Guardar configuración
echo "[4/4] Guardando configuración de arranque..."
pm2 save

echo "--- ¡LISTO! Servidor reiniciado correctamente ---"
pm2 list
