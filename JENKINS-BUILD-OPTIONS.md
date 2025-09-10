# Jenkins 构建选项指南

## 🚨 当前问题

Jenkins 构建失败，npm 安装依赖时出现错误：
```
ERROR: failed to build: failed to solve: process "/bin/sh -c npm cache clean --force" did not complete successfully: exit code: 1
```

## 🔧 解决方案

我已经创建了多个 Dockerfile 版本来解决这个问题：

### 1. Dockerfile.simple (推荐)
**最简单的解决方案，分步执行便于调试**

```bash
docker build -t nexus3.aigcode.net:32443/ss/component-factory:5805-09101724 -f Dockerfile.simple .
```

**特点：**
- 单阶段构建，减少复杂性
- 分步执行 npm 命令，便于定位问题
- 包含重试机制
- 详细的错误处理

### 2. Dockerfile.yarn (备选方案)
**使用 Yarn 作为包管理器，通常更稳定**

```bash
docker build -t nexus3.aigcode.net:32443/ss/component-factory:5805-09101724 -f Dockerfile.yarn .
```

**特点：**
- 使用 Yarn 替代 npm
- 更好的缓存机制
- 更稳定的依赖解析
- 自动生成 yarn.lock

### 3. Dockerfile.jenkins (优化版)
**针对 Jenkins 环境优化的多阶段构建**

```bash
docker build -t nexus3.aigcode.net:32443/ss/component-factory:5805-09101724 -f Dockerfile.jenkins .
```

**特点：**
- 多阶段构建优化
- 使用 npm install 替代 npm ci
- 添加重试配置
- 更好的网络处理

## 🛠️ 调试工具

### 使用诊断脚本
```bash
# 在构建前运行诊断
./debug-npm.sh
```

**诊断脚本功能：**
- 检查 Node.js 和 npm 版本
- 测试网络连接
- 检查 npm 配置
- 清理缓存
- 尝试不同的安装策略

## 📋 Jenkins 构建配置建议

### 方案 1: 使用 Dockerfile.simple
```bash
#!/bin/bash
set -e

echo "使用简化版 Dockerfile 构建..."
docker build \
  --no-cache \
  --progress=plain \
  -t nexus3.aigcode.net:32443/ss/component-factory:5805-09101724 \
  -f Dockerfile.simple .
```

### 方案 2: 使用 Dockerfile.yarn
```bash
#!/bin/bash
set -e

echo "使用 Yarn 版 Dockerfile 构建..."
docker build \
  --no-cache \
  --progress=plain \
  -t nexus3.aigcode.net:32443/ss/component-factory:5805-09101724 \
  -f Dockerfile.yarn .
```

### 方案 3: 带调试的构建
```bash
#!/bin/bash
set -e

echo "开始调试构建..."

# 先运行诊断
echo "运行 npm 诊断..."
docker run --rm -v $(pwd):/app -w /app node:18-alpine sh -c "
  apk add --no-cache curl &&
  ./debug-npm.sh
"

# 然后构建
echo "开始构建..."
docker build \
  --no-cache \
  --progress=plain \
  -t nexus3.aigcode.net:32443/ss/component-factory:5805-09101724 \
  -f Dockerfile.simple .
```

## 🔍 故障排除步骤

### 1. 检查网络连接
```bash
# 在 Jenkins 中测试网络
curl -I https://registry.npmjs.org/ --connect-timeout 10
```

### 2. 检查 Docker 环境
```bash
# 检查 Docker 版本
docker --version

# 检查可用空间
df -h

# 检查内存
free -h
```

### 3. 清理 Docker 缓存
```bash
# 清理 Docker 系统
docker system prune -f

# 清理构建缓存
docker builder prune -f
```

### 4. 使用详细日志
```bash
# 启用详细构建日志
export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

docker build --progress=plain -f Dockerfile.simple .
```

## 🎯 推荐构建顺序

1. **首先尝试**: `Dockerfile.simple`
2. **如果失败**: `Dockerfile.yarn`
3. **最后选择**: `Dockerfile.jenkins`

## 📊 构建性能对比

| Dockerfile | 构建时间 | 镜像大小 | 稳定性 | 推荐度 |
|------------|----------|----------|--------|--------|
| Dockerfile.simple | 中等 | 中等 | 高 | ⭐⭐⭐⭐⭐ |
| Dockerfile.yarn | 快 | 小 | 高 | ⭐⭐⭐⭐ |
| Dockerfile.jenkins | 慢 | 小 | 中 | ⭐⭐⭐ |
| Dockerfile | 慢 | 最小 | 低 | ⭐⭐ |

## 🚀 快速修复命令

```bash
# 一键修复和构建
docker system prune -f && \
docker build --no-cache --progress=plain \
  -t nexus3.aigcode.net:32443/ss/component-factory:5805-09101724 \
  -f Dockerfile.simple .
```

## 📞 如果问题仍然存在

1. **检查 Jenkins 日志** - 查看详细的错误信息
2. **运行诊断脚本** - 使用 `debug-npm.sh` 分析问题
3. **尝试不同版本** - 使用不同的 Dockerfile 变体
4. **检查网络** - 确保 Jenkins 可以访问 npm registry
5. **联系支持** - 提供完整的错误日志

---

**最后更新**: 2025-09-10  
**版本**: 2.0.0
