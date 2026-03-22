#!/bin/bash
# ===============================================
# Harmony Clay - Script de Configuración Inicial
# ===============================================
# Ejecutar UNA VEZ tras clonar/reiniciar el NAS
# ===============================================

set -e

echo "=========================================="
echo "  Harmony Clay - Setup Inicial"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Directorio del proyecto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# ===============================================
# 1. Hacer ejecutables los scripts
# ===============================================
echo -e "${YELLOW}[1/4]${NC} Configurando permisos de scripts..."

chmod +x backend/scripts/backup-cron.sh 2>/dev/null || true
chmod +x deploy.sh 2>/dev/null || true
chmod +x setup.sh 2>/dev/null || true

echo -e "${GREEN}  ✓ Permisos configurados${NC}"

# ===============================================
# 2. Configurar Backup Automático (Cron)
# ===============================================
echo -e "${YELLOW}[2/4]${NC} Configurando backup automático..."

CRON_JOB="0 2 * * * /bin/sh \"$PROJECT_DIR/backend/scripts/backup-cron.sh\" >> \"$PROJECT_DIR/backend/logs/backup.log\" 2>&1"

# Crear directorio de logs si no existe
mkdir -p backend/logs

# Añadir al crontab si no existe
(crontab -l 2>/dev/null | grep -v "backup-cron.sh"; echo "$CRON_JOB") | crontab -

echo -e "${GREEN}  ✓ Cron configurado (backup diario a las 2:00 AM)${NC}"

# ===============================================
# 3. Verificar Docker Compose
# ===============================================
echo -e "${YELLOW}[3/4]${NC} Verificando Docker Compose..."

if command -v docker &> /dev/null; then
    echo -e "${GREEN}  ✓ Docker disponible${NC}"
else
    echo -e "${RED}  ✗ Docker no encontrado${NC}"
fi

# ===============================================
# 4. Mostrar información
# ===============================================
echo ""
echo -e "${GREEN}=========================================="
echo "  Setup Completado!"
echo -e "==========================================${NC}"
echo ""
echo "Próximos pasos:"
echo ""
echo "1. Verificar contenedores:"
echo "   docker compose -p harmony-clay ps"
echo ""
echo "2. Iniciar contenedores:"
echo "   docker compose -p harmony-clay up -d"
echo ""
echo "3. Ver logs:"
echo "   docker compose -p harmony-clay logs -f"
echo ""
echo "4. Test de backup manual:"
echo "   ./backend/scripts/backup-cron.sh"
echo ""
echo "5. Ver crontab configurado:"
echo "   crontab -l"
echo ""
echo "6. Para añadir auto-start tras reinicio del NAS:"
echo "   Ir a: Control Panel → Task Scheduler → Create"
echo "   Tipo: User-defined script"
echo "   Event: Boot-up"
echo "   Script: cd \"$PROJECT_DIR\" && docker compose -p harmony-clay up -d"
echo ""
