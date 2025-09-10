#!/bin/bash

# npm 安装问题诊断脚本

echo "=== npm 安装问题诊断 ==="
echo "时间: $(date)"
echo ""

# 检查 Node.js 和 npm 版本
echo "=== 环境信息 ==="
echo "Node.js 版本: $(node --version)"
echo "npm 版本: $(npm --version)"
echo ""

# 检查网络连接
echo "=== 网络连接测试 ==="
echo "测试 npm registry 连接..."
curl -I https://registry.npmjs.org/ --connect-timeout 10 || echo "npm registry 连接失败"
echo ""

# 检查 npm 配置
echo "=== npm 配置 ==="
npm config list
echo ""

# 清理缓存
echo "=== 清理缓存 ==="
npm cache clean --force
echo "缓存已清理"
echo ""

# 检查 package.json
echo "=== package.json 检查 ==="
if [ -f package.json ]; then
    echo "package.json 存在"
    echo "依赖数量: $(cat package.json | grep -c '"')"
else
    echo "package.json 不存在"
    exit 1
fi
echo ""

# 检查 package-lock.json
echo "=== package-lock.json 检查 ==="
if [ -f package-lock.json ]; then
    echo "package-lock.json 存在"
    echo "文件大小: $(ls -lh package-lock.json | awk '{print $5}')"
else
    echo "package-lock.json 不存在"
fi
echo ""

# 尝试不同的安装策略
echo "=== 安装策略测试 ==="

echo "1. 尝试 npm ci..."
if npm ci --frozen-lockfile --no-audit --no-fund; then
    echo "npm ci 成功"
else
    echo "npm ci 失败，尝试 npm install..."
    
    echo "2. 尝试 npm install..."
    if npm install --no-audit --no-fund; then
        echo "npm install 成功"
    else
        echo "npm install 也失败了"
        
        echo "3. 尝试删除 node_modules 后重新安装..."
        rm -rf node_modules package-lock.json
        if npm install --no-audit --no-fund; then
            echo "重新安装成功"
        else
            echo "所有安装方法都失败了"
            exit 1
        fi
    fi
fi

echo ""
echo "=== 诊断完成 ==="
