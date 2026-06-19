#!/bin/bash

# Ice Snow City - 数据库和配置备份脚本
# 使用方式: ./backup.sh [full|incremental]

set -e

# 配置
BACKUP_DIR="/backup/ice-snow-city"
DB_NAME="ice_snow_city"
DB_USER="${DB_USER:-admin}"
DB_PASSWORD="${DB_PASSWORD:-password}"
DB_HOST="${DB_HOST:-localhost}"
BACKUP_TYPE="${1:-full}"
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/ice-snow-city-backup.log"

# 创建备份目录
mkdir -p $BACKUP_DIR/{database,config,logs}

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# 错误处理
error_exit() {
    log "ERROR: $1"
    exit 1
}

log "Starting $BACKUP_TYPE backup..."

# 数据库备份
log "Backing up database..."
if ! mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/database/${DB_NAME}_$DATE.sql; then
    error_exit "Database backup failed"
fi

# 压缩数据库备份
gzip $BACKUP_DIR/database/${DB_NAME}_$DATE.sql
log "Database backup completed: $BACKUP_DIR/database/${DB_NAME}_$DATE.sql.gz"

# 配置文件备份
log "Backing up configuration files..."
tar -czf $BACKUP_DIR/config/config_$DATE.tar.gz \
    /app/config \
    /app/.env \
    2>/dev/null || true
log "Configuration backup completed: $BACKUP_DIR/config/config_$DATE.tar.gz"

# 应用日志备份
log "Backing up application logs..."
tar -czf $BACKUP_DIR/logs/logs_$DATE.tar.gz \
    /var/log/ice-snow-city \
    2>/dev/null || true
log "Logs backup completed: $BACKUP_DIR/logs/logs_$DATE.tar.gz"

# 上传到云存储（如果配置了）
if [ -n "$AWS_S3_BUCKET" ]; then
    log "Uploading backups to AWS S3..."
    aws s3 cp $BACKUP_DIR/database/${DB_NAME}_$DATE.sql.gz s3://$AWS_S3_BUCKET/backups/database/ || true
    aws s3 cp $BACKUP_DIR/config/config_$DATE.tar.gz s3://$AWS_S3_BUCKET/backups/config/ || true
    aws s3 cp $BACKUP_DIR/logs/logs_$DATE.tar.gz s3://$AWS_S3_BUCKET/backups/logs/ || true
    log "Backups uploaded to S3"
fi

# 清理旧备份（保留 4 周）
log "Cleaning up old backups..."
find $BACKUP_DIR/database -name "*.sql.gz" -mtime +28 -delete
find $BACKUP_DIR/config -name "*.tar.gz" -mtime +28 -delete
find $BACKUP_DIR/logs -name "*.tar.gz" -mtime +28 -delete
log "Old backups cleaned up"

# 验证备份
log "Verifying backup integrity..."
if gzip -t $BACKUP_DIR/database/${DB_NAME}_$DATE.sql.gz; then
    log "Backup verification passed"
else
    error_exit "Backup verification failed"
fi

log "$BACKUP_TYPE backup completed successfully"
