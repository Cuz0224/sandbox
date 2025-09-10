# V0 Sandbox Docker 部署指南

本文档介绍如何使用 Docker 部署 V0 Sandbox 项目。

## 📋 目录

- [快速开始](#快速开始)
- [环境要求](#环境要求)
- [Docker 文件说明](#docker-文件说明)
- [构建和运行](#构建和运行)
- [环境配置](#环境配置)
- [监控和日志](#监控和日志)
- [故障排除](#故障排除)

## 🚀 快速开始

### 1. 环境准备

确保已安装以下软件：
- Docker 20.10+
- Docker Compose 2.0+
- Git

### 2. 克隆项目

```bash
git clone <repository-url>
cd sandbox
```

### 3. 环境配置

```bash
# 复制环境变量模板
cp env.template .env.local

# 编辑环境变量
nano .env.local
```

### 4. 快速启动

```bash
# 开发环境
npm run docker:up:dev

# 生产环境
npm run docker:up
```

## 🔧 环境要求

### 系统要求

- **CPU**: 2 核心以上
- **内存**: 4GB 以上
- **存储**: 10GB 以上可用空间
- **网络**: 稳定的互联网连接

### 软件要求

- **Docker**: 20.10.0+
- **Docker Compose**: 2.0.0+
- **Node.js**: 18+ (仅开发环境需要)

## 📁 Docker 文件说明

### 主要文件

| 文件 | 用途 | 环境 |
|------|------|------|
| `Dockerfile` | 生产环境镜像 | 生产 |
| `Dockerfile.dev` | 开发环境镜像 | 开发 |
| `docker-compose.yml` | 生产环境编排 | 生产 |
| `docker-compose.dev.yml` | 开发环境编排 | 开发 |
| `.dockerignore` | 构建忽略文件 | 通用 |
| `docker-build.sh` | 构建脚本 | 通用 |

### 多阶段构建

生产环境 Dockerfile 采用多阶段构建：

1. **base**: 基础镜像，安装系统依赖
2. **deps**: 安装生产依赖
3. **dev-deps**: 安装开发依赖
4. **builder**: 构建应用
5. **runner**: 运行环境

## 🏗️ 构建和运行

### 使用脚本（推荐）

```bash
# 构建镜像
./docker-build.sh prod build
./docker-build.sh dev build

# 运行容器
./docker-build.sh prod run
./docker-build.sh dev run

# 启动服务栈
./docker-build.sh prod up
./docker-build.sh dev up

# 查看日志
./docker-build.sh prod logs
./docker-build.sh dev logs

# 停止服务
./docker-build.sh prod down
./docker-build.sh dev down

# 清理资源
./docker-build.sh prod clean
./docker-build.sh dev clean
```

### 使用 npm 脚本

```bash
# 构建
npm run docker:build        # 生产环境
npm run docker:build:dev    # 开发环境

# 运行
npm run docker:run          # 生产环境
npm run docker:run:dev      # 开发环境

# 服务栈
npm run docker:up           # 生产环境
npm run docker:up:dev       # 开发环境

# 日志
npm run docker:logs         # 生产环境
npm run docker:logs:dev     # 开发环境

# 清理
npm run docker:clean        # 生产环境
npm run docker:clean:dev    # 开发环境
```

### 手动 Docker 命令

```bash
# 构建镜像
docker build -f Dockerfile -t v0-sandbox:prod .
docker build -f Dockerfile.dev -t v0-sandbox:dev .

# 运行容器
docker run -d \
  --name v0-sandbox-prod \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  --env-file .env.local \
  v0-sandbox:prod

# 使用 Docker Compose
docker-compose up -d
docker-compose -f docker-compose.dev.yml up -d
```

## ⚙️ 环境配置

### 必需环境变量

```bash
# 基本配置
NODE_ENV=production
NEXTAUTH_SECRET=your_secret_key_here
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 数据库配置
DATABASE_URL=file:./data/prod.db

# AI 服务配置
DIFY_API_KEY=your_dify_api_key
DIFY_API_ENDPOINT=https://api.dify.ai/v1
```

### 可选环境变量

```bash
# OpenAI 配置
OPENAI_API_KEY=your_openai_api_key

# Azure OpenAI 配置
AZURE_OPENAI_API_KEY=your_azure_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_VERSION=2024-02-01

# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 监控配置
GF_SECURITY_ADMIN_PASSWORD=admin123
REDIS_URL=redis://localhost:6379
```

## 📊 监控和日志

### 服务访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 应用 | http://localhost:3000 | 主应用 |
| Grafana | http://localhost:3001 | 监控面板 |
| Prometheus | http://localhost:9090 | 指标收集 |
| Redis | localhost:6379 | 缓存服务 |

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f app
docker-compose logs -f redis

# 查看容器日志
docker logs -f v0-sandbox-app
```

### 健康检查

```bash
# 应用健康检查
curl http://localhost:3000/api/health

# 使用脚本检查
npm run health
```

## 🔍 故障排除

### 常见问题

#### 1. 容器启动失败

```bash
# 检查容器状态
docker ps -a

# 查看容器日志
docker logs v0-sandbox-app

# 检查端口占用
netstat -tulpn | grep :3000
```

#### 2. 数据库连接问题

```bash
# 检查数据库文件权限
ls -la data/

# 重新生成 Prisma 客户端
docker exec v0-sandbox-app npx prisma generate

# 运行数据库迁移
docker exec v0-sandbox-app npx prisma migrate deploy
```

#### 3. 内存不足

```bash
# 检查内存使用
docker stats

# 清理未使用的镜像
docker system prune -a

# 限制容器内存使用
docker run -m 2g v0-sandbox:prod
```

#### 4. 网络问题

```bash
# 检查网络配置
docker network ls
docker network inspect v0-sandbox_v0-sandbox-network

# 重启网络
docker-compose down
docker-compose up -d
```

### 调试模式

```bash
# 进入容器调试
docker exec -it v0-sandbox-app sh

# 查看环境变量
docker exec v0-sandbox-app env

# 检查文件系统
docker exec v0-sandbox-app ls -la /app
```

### 性能优化

#### 1. 镜像优化

- 使用多阶段构建减少镜像大小
- 使用 .dockerignore 排除不必要文件
- 使用 Alpine Linux 基础镜像

#### 2. 容器优化

- 设置合适的内存限制
- 使用健康检查
- 配置重启策略

#### 3. 网络优化

- 使用自定义网络
- 配置 DNS 解析
- 优化端口映射

## 📚 更多资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Prisma 部署指南](https://www.prisma.io/docs/guides/deployment)

## 🤝 贡献

如果您发现问题或有改进建议，请：

1. 创建 Issue 描述问题
2. 提交 Pull Request 修复问题
3. 更新相关文档

## 📄 许可证

本项目采用 MIT 许可证。详情请参阅 [LICENSE](LICENSE) 文件。
