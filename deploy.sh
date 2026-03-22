#!/bin/bash
# ===============================================
# Harmony Clay - Script de Despliegue Docker
# ===============================================
# Usage: ./deploy.sh
# ===============================================

set -e

echo "=========================================="
echo "  Harmony Clay - Despliegue Docker"
echo "=========================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Directorio del proyecto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Verificar que existe docker-compose
if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}Error: docker compose no está instalado${NC}"
    exit 1
fi

# Verificar que existe .env
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: No se encuentra el archivo .env${NC}"
    echo "Copia .env.docker como .env y ajusta los valores"
    exit 1
fi

echo -e "${GREEN}[1/4]${NC} Parando contenedores existentes..."
docker compose down --remove-orphans 2>/dev/null || true

echo -e "${GREEN}[2/4]${NC} Verificando volumen de MariaDB..."
# Intentar preservar datos existentes
if docker volume inspect pendientes-bei-mariadb-data &>/dev/null; then
    echo -e "${YELLOW}  Volumen existente encontrado, se preservarán los datos${NC}"
else
    echo -e "${YELLOW}  No se encontró volumen anterior, se creará nuevo${NC}"
fi

echo -e "${GREEN}[3/4]${NC} Construyendo imagen del backend..."
docker compose build --no-cache app

echo -e "${GREEN}[4/4]${NC} Iniciando servicios..."
docker compose up -d

echo ""
echo -e "${GREEN}=========================================="
echo "  Despliegue completado!"
echo -e "==========================================${NC}"
echo ""
echo "Comandos útiles:"
echo "  docker compose logs -f app      # Ver logs del app"
echo "  docker compose logs -f db      # Ver logs de la DB"
echo "  docker compose logs -f tunnel   # Ver logs del tunnel"
echo "  docker compose ps              # Estado de servicios"
echo "  docker compose down            # Detener servicios"
echo "  docker compose restart app     # Reiniciar app"
echo ""
