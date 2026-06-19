#!/bin/bash

# Ice Snow City - 部署脚本
# 使用方式: ./deploy.sh <environment> <version>

set -e

# 配置
ENVIRONMENT="${1:-staging}"
VERSION="${2:-latest}"
REGISTRY="${DOCKER_REGISTRY:-docker.io}"
IMAGE_NAME="ice-snow-city"
NAMESPACE="${KUBERNETES_NAMESPACE:-default}"
LOG_FILE="/var/log/ice-snow-city-deploy.log"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# 错误处理
error_exit() {
    log "ERROR: $1"
    exit 1
}

log "Starting deployment to $ENVIRONMENT environment..."
log "Image: $REGISTRY/$IMAGE_NAME:$VERSION"

# 验证环境
if [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    error_exit "Invalid environment: $ENVIRONMENT (must be staging or production)"
fi

# 构建 Docker 镜像
log "Building Docker image..."
docker build -t $REGISTRY/$IMAGE_NAME:$VERSION .
if [ $? -ne 0 ]; then
    error_exit "Docker build failed"
fi

log "Docker image built successfully"

# 推送镜像到仓库
log "Pushing image to registry..."
docker push $REGISTRY/$IMAGE_NAME:$VERSION
if [ $? -ne 0 ]; then
    error_exit "Docker push failed"
fi

log "Image pushed successfully"

# 部署到 Kubernetes
if command -v kubectl &> /dev/null; then
    log "Deploying to Kubernetes ($ENVIRONMENT)..."
    
    # 更新镜像
    kubectl set image deployment/ice-snow-city-$ENVIRONMENT \
        ice-snow-city=$REGISTRY/$IMAGE_NAME:$VERSION \
        -n $NAMESPACE
    
    if [ $? -ne 0 ]; then
        error_exit "Kubernetes deployment failed"
    fi
    
    # 等待部署完成
    log "Waiting for deployment to complete..."
    kubectl rollout status deployment/ice-snow-city-$ENVIRONMENT -n $NAMESPACE --timeout=5m
    
    if [ $? -ne 0 ]; then
        error_exit "Deployment rollout failed"
    fi
    
    log "Kubernetes deployment completed successfully"
else
    log "Kubernetes not available, skipping K8s deployment"
fi

# 运行烟雾测试
log "Running smoke tests..."
HEALTH_CHECK_URL="http://ice-snow-city-$ENVIRONMENT.example.com/health"
HEALTH_CHECK_RETRIES=5
HEALTH_CHECK_DELAY=10

for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
    if curl -f $HEALTH_CHECK_URL > /dev/null 2>&1; then
        log "Health check passed"
        break
    fi
    
    if [ $i -lt $HEALTH_CHECK_RETRIES ]; then
        log "Health check failed, retrying in ${HEALTH_CHECK_DELAY}s..."
        sleep $HEALTH_CHECK_DELAY
    else
        error_exit "Health check failed after $HEALTH_CHECK_RETRIES attempts"
    fi
done

# 运行集成测试
if [ "$ENVIRONMENT" = "staging" ]; then
    log "Running integration tests..."
    # 添加集成测试命令
    # pnpm run test:integration
fi

# 通知部署完成
log "Deployment completed successfully"
log "Version: $VERSION"
log "Environment: $ENVIRONMENT"

# 发送通知
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST $SLACK_WEBHOOK_URL \
        -H 'Content-Type: application/json' \
        -d "{\"text\": \"Deployment completed: $IMAGE_NAME:$VERSION to $ENVIRONMENT\"}"
fi

log "Deployment finished"
