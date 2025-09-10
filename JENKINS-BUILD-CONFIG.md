# Jenkins 构建配置指南

## 🔧 问题解决方案

### 原始问题
Jenkins 构建失败，错误信息：
```
ERROR: failed to build: failed to solve: process "/bin/sh -c npm ci --frozen-lockfile" did not complete successfully: exit code: 1
```

### 根本原因
1. **npm 认证问题**: 容器内 npm 缓存或认证状态异常
2. **网络问题**: npm registry 访问不稳定
3. **依赖冲突**: 多阶段构建中依赖安装冲突
4. **构建环境**: 缺少必要的构建工具

## ✅ 解决方案

### 1. 优化后的 Dockerfile

已创建两个版本的 Dockerfile：

- **`Dockerfile`**: 完整的多阶段构建版本
- **`Dockerfile.jenkins`**: 简化的 Jenkins 专用版本

### 2. 关键修复

#### npm 配置优化
```dockerfile
# 配置 npm
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_PROGRESS=false
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false
ENV NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
```

#### 依赖安装优化
```dockerfile
# 清理缓存并安装依赖
RUN npm cache clean --force \
    && npm config set registry https://registry.npmjs.org/ \
    && npm ci --frozen-lockfile --no-audit --no-fund \
    && npm cache clean --force \
    && rm -rf /tmp/* /root/.npm
```

#### 构建工具添加
```dockerfile
# 安装必要的系统依赖
RUN apk add --no-cache \
    libc6-compat \
    curl \
    openssl \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*
```

## 🚀 Jenkins 构建配置

### 推荐构建命令

```bash
# 使用优化的 Dockerfile
docker build -t nexus3.aigcode.net:32443/ss/component-factory:5805-09101724 -f Dockerfile.jenkins .
```

### 环境变量设置

在 Jenkins 构建环境中设置：

```bash
# Docker 构建参数
DOCKER_BUILDKIT=1
DOCKER_CLI_EXPERIMENTAL=enabled

# npm 配置
NPM_CONFIG_REGISTRY=https://registry.npmjs.org/
NPM_CONFIG_LOGLEVEL=warn
NPM_CONFIG_AUDIT=false
NPM_CONFIG_FUND=false
```

### 构建脚本示例

```bash
#!/bin/bash
set -e

# 设置变量
IMAGE_NAME="nexus3.aigcode.net:32443/ss/component-factory"
TAG="5805-09101724"
DOCKERFILE="Dockerfile.jenkins"

echo "开始构建 Docker 镜像..."

# 清理 Docker 缓存
docker system prune -f

# 构建镜像
docker build \
  --no-cache \
  --build-arg NPM_CONFIG_REGISTRY=https://registry.npmjs.org/ \
  --build-arg NPM_CONFIG_AUDIT=false \
  --build-arg NPM_CONFIG_FUND=false \
  -t ${IMAGE_NAME}:${TAG} \
  -f ${DOCKERFILE} .

echo "镜像构建完成: ${IMAGE_NAME}:${TAG}"

# 推送镜像
docker push ${IMAGE_NAME}:${TAG}

echo "镜像推送完成"
```

## 🔍 故障排除

### 常见问题及解决方案

#### 1. npm 安装失败

**问题**: `npm ci` 命令失败
**解决方案**:
```bash
# 清理 npm 缓存
npm cache clean --force

# 删除 node_modules 和 package-lock.json
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

#### 2. 网络连接问题

**问题**: 无法访问 npm registry
**解决方案**:
```bash
# 设置 npm registry
npm config set registry https://registry.npmjs.org/

# 或使用国内镜像
npm config set registry https://registry.npmmirror.com/
```

#### 3. 权限问题

**问题**: Docker 构建权限不足
**解决方案**:
```bash
# 确保 Jenkins 用户有 Docker 权限
sudo usermod -aG docker jenkins

# 重启 Jenkins 服务
sudo systemctl restart jenkins
```

#### 4. 内存不足

**问题**: 构建过程中内存不足
**解决方案**:
```bash
# 增加 Docker 内存限制
docker build --memory=4g -t image:tag .

# 或在 Jenkins 中设置
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain
```

## 📊 构建优化建议

### 1. 使用构建缓存

```bash
# 启用 BuildKit
export DOCKER_BUILDKIT=1

# 使用构建缓存
docker build --cache-from=image:latest -t image:new .
```

### 2. 并行构建

```bash
# 使用多阶段并行构建
docker build --target=builder -t temp:builder .
docker build --target=runner --from=temp:builder -t final:image .
```

### 3. 镜像大小优化

```bash
# 使用 .dockerignore 排除不必要文件
# 多阶段构建减少最终镜像大小
# 清理构建缓存和临时文件
```

## 🔄 持续集成配置

### Jenkins Pipeline 示例

```groovy
pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'nexus3.aigcode.net:32443'
        IMAGE_NAME = 'ss/component-factory'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Build') {
            steps {
                script {
                    def image = docker.build("${DOCKER_REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}", "-f Dockerfile.jenkins .")
                    docker.withRegistry("https://${DOCKER_REGISTRY}", 'docker-registry-credentials') {
                        image.push()
                        image.push('latest')
                    }
                }
            }
        }
    }
    
    post {
        always {
            sh 'docker system prune -f'
        }
    }
}
```

## 📝 监控和日志

### 构建日志分析

```bash
# 查看详细构建日志
docker build --progress=plain --no-cache -t image:tag .

# 分析构建时间
time docker build -t image:tag .
```

### 镜像分析

```bash
# 分析镜像大小
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# 分析镜像层
docker history image:tag
```

## 🎯 最佳实践

1. **使用 .dockerignore**: 排除不必要的文件
2. **多阶段构建**: 减少最终镜像大小
3. **缓存优化**: 合理使用 Docker 层缓存
4. **安全扫描**: 定期扫描镜像漏洞
5. **版本管理**: 使用语义化版本标签

## 📞 支持

如果遇到其他问题，请：

1. 检查 Jenkins 构建日志
2. 验证 Docker 环境配置
3. 确认网络连接状态
4. 查看项目依赖配置

---

**最后更新**: 2025-09-10
**版本**: 1.0.0
