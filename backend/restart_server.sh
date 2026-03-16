#!/bin/bash
echo "--- REINICIANDO SERVIDOR PENDIENTES BEI ---"

PORT=5017
APP_NAME="pendientes-app"
PM2_PATH="/volume1/Compartida/Comun/Pendientes Bei/node_modules/pm2/bin/pm2"

echo "[1/5] Deteniendo proceso anterior..."
$PM2_PATH stop $APP_NAME 2>/dev/null || true
$PM2_PATH delete $APP_NAME 2>/dev/null || true

echo "[2/5] Esperando a que libere el puerto..."
sleep 2

echo "[3/5] Arrancando servidor en puerto $PORT..."
cd /volume1/Compartida/Comun/Pendientes\ Bei/backend
node index.js &

echo "[4/5] Guardando configuración..."
$PM2_PATH save 2>/dev/null || true

echo "[5/5] Verificando estado..."
$PM2_PATH list

echo "--- ¡LISTO! ---"
