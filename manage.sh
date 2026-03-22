#!/bin/bash
# ===============================================
# Harmony Clay - Script de Gestión
# ===============================================
# Gestión completa del proyecto en el NAS
# ===============================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

# ===============================================
# Funciones
# ===============================================

status() {
    echo -e "${CYAN}[STATUS]${NC} Estado de contenedores:"
    sudo docker compose -p harmony-clay ps
}

logs() {
    echo -e "${CYAN}[LOGS]${NC} Mostrando logs (Ctrl+C para salir)..."
    sudo docker compose -p harmony-clay logs -f
}

start() {
    echo -e "${GREEN}[START]${NC} Iniciando contenedores..."
    sudo docker compose -p harmony-clay up -d
    echo -e "${GREEN}✓ Contenedores iniciados${NC}"
}

stop() {
    echo -e "${YELLOW}[STOP]${NC} Deteniendo contenedores..."
    sudo docker compose -p harmony-clay down
    echo -e "${YELLOW}✓ Contenedores detenidos${NC}"
}

restart() {
    echo -e "${YELLOW}[RESTART]${NC} Reiniciando contenedores..."
    sudo docker compose -p harmony-clay restart
    echo -e "${YELLOW}✓ Contenedores reiniciados${NC}"
}

rebuild() {
    echo -e "${CYAN}[REBUILD]${NC} Reconstruyendo imagen y reiniciando..."
    sudo docker compose -p harmony-clay up -d --build
    echo -e "${GREEN}✓ Rebuild completado${NC}"
}

backup() {
    echo -e "${CYAN}[BACKUP]${NC} Ejecutando backup..."
    ./backend/scripts/backup-cron.sh
    echo -e "${GREEN}✓ Backup completado${NC}"
    ls -la backend/backups/ | tail -5
}

health() {
    echo -e "${CYAN}[HEALTH]${NC} Verificando salud de contenedores..."
    echo ""
    sudo docker compose -p harmony-clay ps
    echo ""
    echo "Healthchecks:"
    sudo docker inspect pendientes-bei-app --format='App: {{.State.Health.Status}}' 2>/dev/null || echo "App: N/A"
    sudo docker inspect pendientes-bei-db --format='DB: {{.State.Health.Status}}' 2>/dev/null || echo "DB: N/A"
}

test_api() {
    echo -e "${CYAN}[API TEST]${NC} Probando endpoints..."
    echo ""
    echo "GET /api/pendientes:"
    curl -s http://localhost:3001/api/pendientes | head -c 200
    echo "..."
    echo ""
    echo "GET /api/categories:"
    curl -s http://localhost:3001/api/categories
    echo ""
    echo "GET /api/config:"
    curl -s http://localhost:3001/api/config
    echo ""
}

menu() {
    clear
    echo -e "${CYAN}=========================================="
    echo "  Harmony Clay - Gestión de Contenedores"
    echo -e "==========================================${NC}"
    echo ""
    echo -e "${GREEN}1)${NC}  Iniciar contenedores"
    echo -e "${YELLOW}2)${NC}  Detener contenedores"
    echo -e "${CYAN}3)${NC}  Reiniciar contenedores"
    echo -e "${CYAN}4)${NC}  Rebuild (reconstruir imagen)"
    echo -e "${GREEN}5)${NC}  Ver estado"
    echo -e "${GREEN}6)${NC}  Ver logs"
    echo -e "${YELLOW}7)${NC}  Test API"
    echo -e "${GREEN}8)${NC}  Health check"
    echo -e "${GREEN}9)${NC}  Ejecutar backup"
    echo -e "${RED}0)${NC}  Salir"
    echo ""
    echo -n "Selecciona una opción: "
    read -r option
    
    case $option in
        1) start; sleep 2; menu ;;
        2) stop; sleep 2; menu ;;
        3) restart; sleep 2; menu ;;
        4) rebuild; sleep 2; menu ;;
        5) status; echo ""; read -n 1 -s -r -p "Pulsa una tecla para continuar..."; menu ;;
        6) logs ;;
        7) test_api; echo ""; read -n 1 -s -r -p "Pulsa una tecla para continuar..."; menu ;;
        8) health; echo ""; read -n 1 -s -r -p "Pulsa una tecla para continuar..."; menu ;;
        9) backup; echo ""; read -n 1 -s -r -p "Pulsa una tecla para continuar..."; menu ;;
        0) echo "¡Hasta pronto!"; exit 0 ;;
        *) echo -e "${RED}Opción inválida${NC}"; sleep 1; menu ;;
    esac
}

# Si se pasa argumento, ejecutar directamente
case "${1:-}" in
    start) start ;;
    stop) stop ;;
    restart) restart ;;
    rebuild) rebuild ;;
    status) status ;;
    logs) logs ;;
    backup) backup ;;
    health) health ;;
    test) test_api ;;
    *) menu ;;
esac
