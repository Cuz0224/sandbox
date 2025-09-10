# 多阶段构建 Dockerfile - 生产环境优化版本
FROM node:18-alpine AS base

# 安装必要的系统依赖
RUN apk add --no-cache \
    libc6-compat \
    curl \
    openssl \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=2048"

# 配置 npm
ENV NPM_CONFIG_LOGLEVEL=warn
ENV NPM_CONFIG_PROGRESS=false
ENV NPM_CONFIG_AUDIT=false
ENV NPM_CONFIG_FUND=false

# ===== 依赖安装阶段 =====
FROM base AS deps

# 复制包管理文件
COPY package.json package-lock.json* ./

# 清理 npm 缓存并安装生产依赖
RUN npm cache clean --force \
    && npm config set registry https://registry.npmjs.org/ \
    && npm ci --only=production --frozen-lockfile --no-audit --no-fund \
    && npm cache clean --force \
    && rm -rf /tmp/* /root/.npm

# ===== 构建阶段 =====
FROM base AS builder

# 复制包管理文件
COPY package.json package-lock.json* ./

# 安装所有依赖（包括开发依赖）
RUN npm cache clean --force \
    && npm config set registry https://registry.npmjs.org/ \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-retries 5 \
    && npm install --frozen-lockfile --no-audit --no-fund \
    && npm cache clean --force \
    && rm -rf /tmp/* /root/.npm

# 复制源代码
COPY . .

# 生成 Prisma 客户端
RUN npx prisma generate

# 构建 Next.js 应用
RUN npm run build

# ===== 生产运行阶段 =====
FROM base AS runner

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# 设置工作目录权限
WORKDIR /app

# 复制构建产物
COPY --from=builder /app/public ./public

# 复制 Next.js 独立构建产物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 复制 Prisma 相关文件
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# 复制必要的运行时文件
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# 创建必要的目录
RUN mkdir -p /app/data /app/logs /app/sandbox-projects \
    && chown -R nextjs:nodejs /app/data /app/logs /app/sandbox-projects

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# 启动命令
CMD ["node", "server.js"]
