#!/bin/bash

# V0 Sandbox Docker 构建和部署脚本
# 使用方法: ./docker-build.sh [dev|prod|staging] [build|run|up|down|logs|clean]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目配置
PROJECT_NAME="v0-sandbox"
REGISTRY=""
IMAGE_TAG="latest"

# 函数：打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 函数：显示帮助信息
show_help() {
    echo "V0 Sandbox Docker 构建和部署脚本"
    echo ""
    echo "使用方法:"
    echo "  $0 [环境] [操作]"
    echo ""
    echo "环境:"
    echo "  dev      开发环境"
    echo "  prod     生产环境"
    echo "  staging  预发布环境"
    echo ""
    echo "操作:"
    echo "  build    构建 Docker 镜像"
    echo "  run      运行容器"
    echo "  up       启动服务栈"
    echo "  down     停止服务栈"
    echo "  logs     查看日志"
    echo "  clean    清理镜像和容器"
    echo "  push     推送镜像到仓库"
    echo "  pull     从仓库拉取镜像"
    echo ""
    echo "示例:"
    echo "  $0 dev build    # 构建开发环境镜像"
    echo "  $0 prod up      # 启动生产环境服务栈"
    echo "  $0 dev logs     # 查看开发环境日志"
}

# 函数：检查 Docker 是否运行
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_message $RED "错误: Docker 未运行或无法访问"
        exit 1
    fi
}

# 函数：构建镜像
build_image() {
    local env=$1
    local dockerfile="Dockerfile"
    local tag="${PROJECT_NAME}:${env}-${IMAGE_TAG}"
    
    if [ "$env" = "dev" ]; then
        dockerfile="Dockerfile.dev"
    fi
    
    print_message $BLUE "构建 ${env} 环境镜像..."
    print_message $YELLOW "使用 Dockerfile: ${dockerfile}"
    print_message $YELLOW "镜像标签: ${tag}"
    
    docker build -f $dockerfile -t $tag .
    
    if [ $? -eq 0 ]; then
        print_message $GREEN "镜像构建成功: ${tag}"
    else
        print_message $RED "镜像构建失败"
        exit 1
    fi
}

# 函数：运行容器
run_container() {
    local env=$1
    local tag="${PROJECT_NAME}:${env}-${IMAGE_TAG}"
    
    print_message $BLUE "运行 ${env} 环境容器..."
    
    # 停止并删除现有容器
    docker stop "${PROJECT_NAME}-${env}" 2>/dev/null || true
    docker rm "${PROJECT_NAME}-${env}" 2>/dev/null || true
    
    # 运行新容器
    docker run -d \
        --name "${PROJECT_NAME}-${env}" \
        -p 3000:3000 \
        -v "$(pwd)/data:/app/data" \
        -v "$(pwd)/logs:/app/logs" \
        -v /var/run/docker.sock:/var/run/docker.sock \
        --env-file .env.local \
        $tag
    
    if [ $? -eq 0 ]; then
        print_message $GREEN "容器启动成功"
        print_message $YELLOW "访问地址: http://localhost:3000"
    else
        print_message $RED "容器启动失败"
        exit 1
    fi
}

# 函数：启动服务栈
start_services() {
    local env=$1
    local compose_file="docker-compose.yml"
    
    if [ "$env" = "dev" ]; then
        compose_file="docker-compose.dev.yml"
    fi
    
    print_message $BLUE "启动 ${env} 环境服务栈..."
    print_message $YELLOW "使用配置文件: ${compose_file}"
    
    docker-compose -f $compose_file up -d
    
    if [ $? -eq 0 ]; then
        print_message $GREEN "服务栈启动成功"
        print_message $YELLOW "应用访问地址: http://localhost:3000"
        if [ "$env" != "dev" ]; then
            print_message $YELLOW "Grafana 访问地址: http://localhost:3001"
            print_message $YELLOW "Prometheus 访问地址: http://localhost:9090"
        fi
    else
        print_message $RED "服务栈启动失败"
        exit 1
    fi
}

# 函数：停止服务栈
stop_services() {
    local env=$1
    local compose_file="docker-compose.yml"
    
    if [ "$env" = "dev" ]; then
        compose_file="docker-compose.dev.yml"
    fi
    
    print_message $BLUE "停止 ${env} 环境服务栈..."
    
    docker-compose -f $compose_file down
    
    if [ $? -eq 0 ]; then
        print_message $GREEN "服务栈停止成功"
    else
        print_message $RED "服务栈停止失败"
        exit 1
    fi
}

# 函数：查看日志
show_logs() {
    local env=$1
    local compose_file="docker-compose.yml"
    
    if [ "$env" = "dev" ]; then
        compose_file="docker-compose.dev.yml"
    fi
    
    print_message $BLUE "查看 ${env} 环境日志..."
    
    docker-compose -f $compose_file logs -f
}

# 函数：清理资源
clean_resources() {
    local env=$1
    
    print_message $BLUE "清理 ${env} 环境资源..."
    
    # 停止并删除容器
    docker stop "${PROJECT_NAME}-${env}" 2>/dev/null || true
    docker rm "${PROJECT_NAME}-${env}" 2>/dev/null || true
    
    # 删除镜像
    docker rmi "${PROJECT_NAME}:${env}-${IMAGE_TAG}" 2>/dev/null || true
    
    # 清理悬空镜像
    docker image prune -f
    
    print_message $GREEN "清理完成"
}

# 函数：推送镜像
push_image() {
    local env=$1
    local tag="${PROJECT_NAME}:${env}-${IMAGE_TAG}"
    
    if [ -z "$REGISTRY" ]; then
        print_message $RED "错误: 未设置镜像仓库地址"
        exit 1
    fi
    
    print_message $BLUE "推送镜像到仓库..."
    
    docker tag $tag "${REGISTRY}/${tag}"
    docker push "${REGISTRY}/${tag}"
    
    if [ $? -eq 0 ]; then
        print_message $GREEN "镜像推送成功"
    else
        print_message $RED "镜像推送失败"
        exit 1
    fi
}

# 函数：拉取镜像
pull_image() {
    local env=$1
    local tag="${PROJECT_NAME}:${env}-${IMAGE_TAG}"
    
    if [ -z "$REGISTRY" ]; then
        print_message $RED "错误: 未设置镜像仓库地址"
        exit 1
    fi
    
    print_message $BLUE "从仓库拉取镜像..."
    
    docker pull "${REGISTRY}/${tag}"
    docker tag "${REGISTRY}/${tag}" $tag
    
    if [ $? -eq 0 ]; then
        print_message $GREEN "镜像拉取成功"
    else
        print_message $RED "镜像拉取失败"
        exit 1
    fi
}

# 主函数
main() {
    # 检查参数
    if [ $# -lt 2 ]; then
        show_help
        exit 1
    fi
    
    local env=$1
    local action=$2
    
    # 验证环境参数
    if [[ ! "$env" =~ ^(dev|prod|staging)$ ]]; then
        print_message $RED "错误: 无效的环境参数 '$env'"
        show_help
        exit 1
    fi
    
    # 验证操作参数
    if [[ ! "$action" =~ ^(build|run|up|down|logs|clean|push|pull)$ ]]; then
        print_message $RED "错误: 无效的操作参数 '$action'"
        show_help
        exit 1
    fi
    
    # 检查 Docker
    check_docker
    
    # 执行操作
    case $action in
        "build")
            build_image $env
            ;;
        "run")
            run_container $env
            ;;
        "up")
            start_services $env
            ;;
        "down")
            stop_services $env
            ;;
        "logs")
            show_logs $env
            ;;
        "clean")
            clean_resources $env
            ;;
        "push")
            push_image $env
            ;;
        "pull")
            pull_image $env
            ;;
    esac
}

# 执行主函数
main "$@"
