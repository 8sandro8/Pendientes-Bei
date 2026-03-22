#!/bin/bash
# Harmony Clay - Daily Backup Cron Script
# Run daily at 2:00 AM

# Configuration
SCRIPT_DIR="/volume1/Compartida/Comun/Pendientes Bei/backend"
LOG_DIR="/volume1/Compartida/Comun/Pendientes Bei/backend/logs"
BACKUP_LOG="$LOG_DIR/backup.log"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Change to backend directory
cd "$SCRIPT_DIR" || exit 1

# Run backup and log output
echo "=== Backup started at $(date) ===" >> "$BACKUP_LOG" 2>&1
node scripts/backup.js >> "$BACKUP_LOG" 2>&1
EXIT_CODE=$?
echo "=== Backup finished at $(date) with exit code $EXIT_CODE ===" >> "$BACKUP_LOG" 2>&1

exit $EXIT_CODE