# V0 Sandbox 安全部署指南

## 🚨 高危安全警告

**此项目包含动态代码执行功能，属于高安全风险应用！**

### 风险说明
- ✨ 用户可以运行任意 JavaScript/TypeScript 代码
- 🐳 应用需要访问 Docker Socket (`/var/run/docker.sock`)
- 📦 动态创建和管理 Docker 容器
- 🌐 容器可能访问网络资源
- 💾 可能访问主机文件系统

## 🛡️ 强制安全要求

### 1. 环境隔离（必须）
```bash
# 建议部署在以下环境之一：
✅ 独立的虚拟机
✅ 容器化的沙箱环境  
✅ 内网隔离区域
❌ 不要部署在生产服务器上
❌ 不要与其他重要服务混合部署
```

### 2. 网络安全配置
```bash
# 防火墙规则（仅开放必要端口）
ufw deny incoming
ufw allow outgoing
ufw allow 22/tcp      # SSH（限制来源IP）
ufw allow 80/tcp      # HTTP（内网访问）
ufw allow 443/tcp     # HTTPS（内网访问）
ufw allow from 内网IP段 to any port 3000   # 主应用
ufw --force enable

# 禁止沙箱容器访问敏感端口
iptables -A DOCKER-USER -d 172.17.0.0/16 -p tcp --dport 22 -j DROP
iptables -A DOCKER-USER -d 172.17.0.0/16 -p tcp --dport 3306 -j DROP
iptables -A DOCKER-USER -d 172.17.0.0/16 -p tcp --dport 5432 -j DROP
```

### 3. Docker 安全加固
```bash
# Docker daemon 安全配置
sudo tee /etc/docker/daemon.json << 'EOF'
{
  "userns-remap": "default",
  "live-restore": true,
  "userland-proxy": false,
  "no-new-privileges": true,
  "seccomp-profile": "/etc/docker/seccomp.json",
  "default-runtime": "runc",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

# 创建 Docker 专用网络（隔离）
docker network create \
  --driver bridge \
  --subnet=172.30.0.0/16 \
  --ip-range=172.30.240.0/20 \
  sandbox-network

# 重启 Docker 服务
sudo systemctl restart docker
```

### 4. 容器安全限制
```bash
# 已在代码中实现的安全措施：
- 内存限制：512MB/容器
- CPU限制：0.5核心/容器  
- 磁盘配额：1GB/项目
- 网络隔离：独立Docker网络
- 自动清理：闲置容器自动删除
- 资源监控：超限自动终止
```

### 5. 文件系统保护
```bash
# 创建受限的沙箱目录
sudo mkdir -p /var/sandbox-projects
sudo chown app:app /var/sandbox-projects
sudo chmod 750 /var/sandbox-projects

# 设置 AppArmor 配置（Ubuntu）
sudo tee /etc/apparmor.d/docker-sandbox << 'EOF'
#include <tunables/global>

profile docker-sandbox flags=(attach_disconnected,mediate_deleted) {
  #include <abstractions/base>
  
  deny @{PROC}/sys/kernel/** wklx,
  deny @{PROC}/sysrq-trigger rwklx,
  deny @{PROC}/mem rwklx,
  deny @{PROC}/kmem rwklx,
  
  deny mount,
  deny pivot_root,
}
EOF

sudo apparmor_parser -r /etc/apparmor.d/docker-sandbox
```

## 📊 监控和审计

### 1. 必须监控的指标
```bash
# 容器监控
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# 监控异常活动
tail -f /var/log/auth.log | grep docker
journalctl -u docker.service -f

# 监控网络连接
netstat -tulpn | grep :3000
ss -tulpn | grep docker-proxy
```

### 2. 告警配置
```bash
# 设置以下告警：
- 容器数量超过 20 个
- 单个容器内存使用超过 512MB
- 单个容器CPU使用超过 50%
- Docker Socket异常访问
- 可疑网络连接
```

### 3. 日志审计
```bash
# 启用 Docker 审计日志
echo 'DOCKER_OPTS="--log-driver=syslog --log-opt syslog-facility=daemon"' >> /etc/default/docker

# 配置 auditd 监控
echo '-w /var/run/docker.sock -p wa -k docker_socket' >> /etc/audit/rules.d/docker.rules
echo '-a exit,always -F path=/usr/bin/docker -F perm=x -k docker_command' >> /etc/audit/rules.d/docker.rules

service auditd restart
```

## 🔒 用户权限管理

### 应用用户配置
```bash
# 创建专用用户
sudo useradd -r -s /bin/false v0sandbox
sudo usermod -aG docker v0sandbox

# 限制 sudo 权限
echo 'v0sandbox ALL=(ALL) NOPASSWD: /usr/bin/docker' >> /etc/sudoers.d/v0sandbox
```

## 🚨 应急响应

### 发现异常时的处理步骤
```bash
# 1. 立即停止所有沙箱容器
docker stop $(docker ps -q --filter "label=sandbox=true")

# 2. 检查可疑活动
docker logs container_name
journalctl -u docker.service --since "1 hour ago"

# 3. 网络连接检查
netstat -tulpn | grep ESTABLISHED

# 4. 文件完整性检查
find /var/sandbox-projects -type f -newer /tmp/marker -ls

# 5. 必要时隔离服务器
ufw deny incoming
```

## ✅ 部署前检查清单

### 安全检查项
- [ ] **环境隔离**: 确认部署在隔离环境
- [ ] **防火墙配置**: 仅开放必要端口
- [ ] **Docker安全**: 应用安全配置
- [ ] **用户权限**: 最小权限原则
- [ ] **监控告警**: 配置完整监控
- [ ] **应急预案**: 准备应急处理流程
- [ ] **备份策略**: 配置数据备份
- [ ] **日志审计**: 启用完整日志

### 网络检查
- [ ] **内网部署**: 不对公网开放
- [ ] **VPN访问**: 通过VPN访问管理
- [ ] **SSL证书**: 启用HTTPS（如果需要）
- [ ] **域名限制**: 限制访问域名

## 📋 运维责任清单

### 运维团队需要承担
1. **定期检查**容器数量和资源使用
2. **监控异常**网络连接和文件访问
3. **定期更新**Docker和系统安全补丁
4. **备份重要**配置和数据
5. **应急响应**安全事件处理

### 开发团队责任
1. **代码审核**动态执行的代码
2. **安全测试**新功能的安全影响
3. **漏洞修复**发现的安全问题
4. **文档更新**安全配置变更

## 🔗 相关资源

- [Docker 安全最佳实践](https://docs.docker.com/engine/security/)
- [容器安全指南](https://kubernetes.io/docs/concepts/security/)
- [AppArmor 配置](https://wiki.ubuntu.com/AppArmor)
- [审计系统配置](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/7/html/security_guide/chap-system_auditing)

---

**⚠️ 重要提醒**: 此应用不适合部署在生产环境的重要服务器上。建议使用专门的沙箱服务器或容器化环境。
