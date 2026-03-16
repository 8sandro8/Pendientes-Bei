#!/bin/bash
echo "--- INSTALANDO CLOUDFLARED EN SYNOLOGY NAS ---"

# 1. Detectar arquitectura
ARCH=$(uname -m)
echo "Arquitectura detectada: $ARCH"

if [ "$ARCH" = "x86_64" ]; then
    URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
elif [ "$ARCH" = "aarch64" ]; then
    URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64"
elif [[ "$ARCH" == *"arm"* ]]; then
    URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm"
else
    echo "Arquitectura no soportada o desconocida: $ARCH. Usa el foro de Synology para compilar."
    exit 1
fi

# 2. Descargar el archivo binario
echo "Descargando cloudflared..."
curl -L -k $URL -o cloudflared

# 3. Dar permisos de ejecución
echo "Dando permisos de ejecución..."
chmod +x cloudflared

# 4. Iniciar mediante PM2 (El mismo programa que mantiene tu tienda online encendida)
echo "Deteniendo túnel anterior (si existe)..."
pm2 stop cloudflare-tunnel 2>/dev/null
pm2 delete cloudflare-tunnel 2>/dev/null

echo "Iniciando nuevo túnel con PM2..."
# Arrancamos cloudflared y le pasamos los parámetros de tu túnel
pm2 start ./cloudflared --name "cloudflare-tunnel" -- tunnel --no-autoupdate run --token eyJhIjoiYmMyMjE5ODIyY2IyNjdkMzFjOWQwNjU2YzdmMDgwZGIiLCJ0IjoiYjU5NDQ3ZjMtMWQ5OS00ZDI4LWIzNTYtNDMzNmVkMzVjMmJmIiwicyI6IlpUazRNVEZtWkdVdE0yRXlOeTAwTVRVNExXSTRabU10WldJNVl6UmlObUkyTkRVMSJ9

# 5. Guardar la configuración de PM2 para que arranque solo si se reinicia el NAS
echo "Guardando configuración en PM2..."
pm2 save

echo "--- ¡CLOUDFLARE TUNNEL INSTALADO Y CORRIENDO! ---"
echo "Ve a tu panel de Cloudflare. El estado debería haber cambiado a 'Connected'."
pm2 list
