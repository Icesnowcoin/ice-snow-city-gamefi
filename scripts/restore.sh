#!/bin/bash

# Ice Snow City - 灾难恢复脚本
# 使用方式: ./restore.sh <backup_file>

set -e

# 配置
BACKUP_FILE="${1}"
DB_NAME="ice_snow_city"
DB_USER="${DB_USER:-admin}"
DB_PASSWORD="${DB_PASSWORD:-password}"
DB_HOST="${DB_HOST:-localhost}"
LOG_FILE="/var/log/ice-snow-city-restore.log"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# 错误处理
error_exit() {
    log "ERROR: $1"
    exit 1
}

# 验证输入
if [ -z "$BACKUP_FILE" ]; then
    error_exit "Usage: $0 <backup_file>"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    error_exit "Backup file not found: $BACKUP_FILE"
fi

log "Starting disaster recovery from: $BACKUP_FILE"

# 验证备份文件完整性
log "Verifying backup file integrity..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
    if ! gzip -t "$BACKUP_FILE"; then
        error_exit "Backup file is corrupted"
    fi
fi

# 创建恢复前的备份
log "Creating pre-recovery backup..."
RECOVERY_BACKUP="/backup/ice-snow-city/pre-recovery_$(date +%Y%m%d_%H%M%S).sql.gz"
mkdir -p $(dirname $RECOVERY_BACKUP)
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME | gzip > $RECOVERY_BACKUP
log "Pre-recovery backup created: $RECOVERY_BACKUP"

# 恢复数据库
log "Restoring database from backup..."
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME
else
    mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < "$BACKUP_FILE"
fi

if [ $? -ne 0 ]; then
    error_exit "Database restore failed"
fi

log "Database restored successfully"

# 验证恢复
log "Verifying restored database..."
RECORD_COUNT=$(mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -N -e "SELECT COUNT(*) FROM $DB_NAME.users;" 2>/dev/null || echo "0")
if [ "$RECORD_COUNT" -gt 0 ]; then
    log "Database verification passed (found $RECORD_COUNT user records)"
else
    log "WARNING: No user records found in restored database"
fi

# 恢复配置文件
if [ -f "${BACKUP_FILE%.sql.gz}_config.tar.gz" ]; then
    log "Restoring configuration files..."
    tar -xzf "${BACKUP_FILE%.sql.gz}_config.tar.gz" -C / 2>/dev/null || true
    log "Configuration files restored"
fi

# 重启应用
log "Restarting application services..."
systemctl restart ice-snow-city || true
sleep 5

# 验证应用状态
log "Verifying application status..."
if systemctl is-active --quiet ice-snow-city; then
    log "Application is running"
else
    error_exit "Application failed to start after recovery"
fi

log "Disaster recovery completed successfully"
log "Pre-recovery backup saved at: $RECOVERY_BACKUP"
