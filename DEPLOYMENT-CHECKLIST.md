# V0 Sandbox 部署检查清单

## ⚠️ 发现的问题及解决方案

### 🔴 严重问题

1. **构建内存不足问题**
   - **问题**: 项目构建时出现 JavaScript heap out of memory 错误
   - **影响**: 无法在低内存服务器上正常构建
   - **解决方案**:
     ```bash
     # 增加 Node.js 内存限制
     export NODE_OPTIONS="--max-old-space-size=8192"
     
     # 或在部署脚本中添加
     NODE_OPTIONS="--max-old-space-size=8192" npm run build
     ```
   - **推荐**: 部署服务器至少需要 8GB 内存

2. **依赖包网络问题**
   - **问题**: `@next/swc` 包下载失败 (401 错误)
   - **解决方案**: 
     ```bash
     # 清理并重新安装依赖
     rm -rf node_modules package-lock.json
     npm cache clean --force
     npm install
     ```

### 🟡 已修复问题

1. ✅ **Next.js 配置修复**
   - 修复了 `experimental.serverComponentsExternalPackages` 配置
   - 添加了 `output: 'standalone'` 支持 Docker 部署

2. ✅ **环境变量模板**
   - 创建了 `env.template` 文件
   - 包含所有必需的环境变量说明

## 📋 部署前检查清单

### 🔧 系统要求
- [ ] **服务器规格**: 至少 4 核 8GB 内存（推荐 8 核 16GB）
- [ ] **磁盘空间**: 至少 50GB 可用空间
- [ ] **操作系统**: Ubuntu 20.04+ 或 CentOS 7+

### 📦 依赖环境
- [ ] **Node.js**: 版本 18.0+
- [ ] **Docker**: 版本 20.0+
- [ ] **Docker Compose**: V2 (docker compose) 或 V1 (docker-compose)
- [ ] **Git**: 用于代码拉取
- [ ] **Nginx**: 用于反向代理（可选）

### 🔐 环境变量配置
- [ ] 复制 `env.template` 为 `.env.local`
- [ ] 配置必需变量:
  ```bash
  NODE_ENV=production
  NEXTAUTH_SECRET=your_32_character_secret
  NEXTAUTH_URL=https://your-domain.com
  DATABASE_URL="file:./data/prod.db"
  ```
- [ ] 配置 AI 服务（至少一个）:
  - [ ] Dify API: `DIFY_API_KEY`, `DIFY_API_ENDPOINT`
  - [ ] OpenAI: `OPENAI_API_KEY`
  - [ ] Azure OpenAI: `AZURE_OPENAI_*` 变量

### 🗄️ 数据库配置
- [ ] 确保数据目录可写: `mkdir -p data && chown app:app data`
- [ ] 运行数据库迁移: `npx prisma db push`
- [ ] 填充种子数据: `npm run db:seed`

### 🐳 Docker 配置
- [ ] 确认 Dockerfile.prod 正确
- [ ] 确认 docker-compose.yml 配置
- [ ] 测试镜像构建:
  ```bash
  docker build -f Dockerfile.prod -t v0-sandbox:prod .
  ```

## 🚀 部署步骤

### 1. 服务器准备
```bash
# 运行系统要求检查
./check-requirements.sh

# 如果检查通过，继续部署
sudo ./deploy.sh production
```

### 2. 手动部署（如果自动脚本失败）

#### 2.1 环境安装
```bash
# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2.2 项目部署
```bash
# 创建项目目录
sudo mkdir -p /opt/v0-sandbox
cd /opt/v0-sandbox

# 克隆项目
git clone <your-repo-url> .

# 配置环境变量
cp env.template .env.local
nano .env.local

# 安装依赖
npm install

# 构建项目（高内存限制）
NODE_OPTIONS="--max-old-space-size=8192" npm run build

# 数据库初始化
npx prisma generate
npx prisma db push
npm run db:seed
```

#### 2.3 启动服务
```bash
# 使用 Docker Compose
docker-compose up -d

# 或使用 PM2 (开发模式)
pm2 start npm --name "v0-sandbox" -- run dev
pm2 save
pm2 startup
```

### 3. 配置反向代理（可选）
```bash
# 安装 Nginx
sudo apt install nginx -y

# 使用提供的配置
sudo cp nginx.conf /etc/nginx/sites-available/v0-sandbox
sudo ln -s /etc/nginx/sites-available/v0-sandbox /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔍 部署后验证

### 健康检查
- [ ] 访问主应用: `http://your-server-ip:3000`
- [ ] 健康检查API: `http://your-server-ip:3000/api/health`
- [ ] 检查响应状态为 200

### 服务检查
```bash
# 检查应用状态
docker-compose ps

# 检查日志
docker-compose logs -f app

# 检查系统资源
htop
df -h
free -h
```

### 功能测试
- [ ] 创建新的沙箱项目
- [ ] 测试代码生成功能
- [ ] 测试文件上传下载
- [ ] 测试AI服务集成

## 🚨 常见问题及解决方案

### 1. 内存不足
```bash
# 增加交换空间
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2. 端口冲突
```bash
# 查看端口占用
sudo netstat -tlnp | grep :3000
sudo lsof -i :3000

# 停止占用进程
sudo kill -9 <PID>
```

### 3. Docker 权限问题
```bash
# 添加用户到 docker 组
sudo usermod -aG docker $USER
newgrp docker
```

### 4. 数据库连接问题
```bash
# 检查数据目录权限
ls -la data/
sudo chown -R app:app data/

# 重新运行数据库迁移
npx prisma db push --force-reset
npm run db:seed
```

## 📊 监控和维护

### 应用监控
- **Grafana**: `http://your-server-ip:3001` (admin/admin123)
- **Prometheus**: `http://your-server-ip:9090`

### 日志位置
- **应用日志**: `logs/`
- **Nginx日志**: `/var/log/nginx/`
- **系统日志**: `journalctl -u docker`

### 定期维护
```bash
# 清理 Docker 资源
docker system prune -a

# 更新应用
git pull origin main
NODE_OPTIONS="--max-old-space-size=8192" npm run build
docker-compose up -d --build

# 数据库备份
cp data/prod.db data/backup-$(date +%Y%m%d).db
```

## 📞 技术支持

如遇问题，请检查：
1. 系统要求是否满足
2. 环境变量是否正确配置
3. 日志中的错误信息
4. 网络连接是否正常

**重要提醒**: 生产环境部署前，建议先在测试环境完整验证所有功能。
