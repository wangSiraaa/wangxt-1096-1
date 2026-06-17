#!/usr/bin/env bash
# ============================================
# 书法考级报名系统 - 容器化验证脚本
# 功能：
#   1. 构建Docker镜像
#   2. 启动容器
#   3. 验证HTTP服务可访问
#   4. 验证关键页面加载
#   5. 清理环境
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 配置
IMAGE_NAME="calligraphy-exam:1.0.0"
CONTAINER_NAME="calligraphy-exam-test"
HOST_PORT="8888"

# 打印函数
print_step() {
    echo -e "\n${YELLOW}>>> ${1}${NC}"
}

print_success() {
    echo -e "${GREEN}✓ ${1}${NC}"
}

print_error() {
    echo -e "${RED}✗ ${1}${NC}"
}

# 检查Docker是否安装
check_docker() {
    print_step "检查Docker环境"
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    print_success "Docker 环境正常"
}

# 清理旧资源
cleanup() {
    print_step "清理旧的测试资源"
    if [ "$(docker ps -aq -f name=${CONTAINER_NAME})" ]; then
        docker rm -f ${CONTAINER_NAME} > /dev/null 2>&1 || true
        print_success "已删除旧容器"
    fi
    if [ "$(docker images -q ${IMAGE_NAME})" ]; then
        docker rmi -f ${IMAGE_NAME} > /dev/null 2>&1 || true
        print_success "已删除旧镜像"
    fi
}

# 构建镜像
build_image() {
    print_step "开始构建Docker镜像"
    docker build -t ${IMAGE_NAME} .
    print_success "镜像构建完成: ${IMAGE_NAME}"
}

# 启动容器
start_container() {
    print_step "启动测试容器"
    docker run -d \
        --name ${CONTAINER_NAME} \
        -p ${HOST_PORT}:80 \
        --health-cmd="wget -q --spider http://localhost/" \
        --health-interval=5s \
        --health-timeout=3s \
        --health-retries=5 \
        ${IMAGE_NAME}
    print_success "容器已启动"
}

# 等待容器健康
wait_for_health() {
    print_step "等待容器健康检查通过"
    for i in {1..15}; do
        status=$(docker inspect --format='{{.State.Health.Status}}' ${CONTAINER_NAME} 2>/dev/null || echo "starting")
        if [ "$status" = "healthy" ]; then
            print_success "容器健康检查通过"
            return 0
        fi
        echo "  等待中... ($i/15) 当前状态: $status"
        sleep 3
    done
    print_error "容器健康检查超时"
    docker logs ${CONTAINER_NAME}
    exit 1
}

# 验证HTTP访问
verify_http() {
    print_step "验证HTTP访问"
    
    # 测试首页
    echo "  测试首页..."
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${HOST_PORT}/")
    if [ "$response" = "200" ]; then
        print_success "首页返回 200 OK"
    else
        print_error "首页返回 $response，期望 200"
        exit 1
    fi

    # 测试静态资源
    echo "  测试静态资源..."
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${HOST_PORT}/favicon.svg")
    if [ "$response" = "200" ]; then
        print_success "favicon 返回 200 OK"
    else
        print_error "favicon 返回 $response，期望 200"
        exit 1
    fi

    # 测试SPA路由（返回index.html）
    echo "  测试SPA路由 fallback..."
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${HOST_PORT}/candidate")
    if [ "$response" = "200" ]; then
        print_success "SPA路由 fallback 返回 200 OK"
    else
        print_error "SPA路由返回 $response，期望 200"
        exit 1
    fi

    # 检查响应头
    echo "  检查响应头..."
    headers=$(curl -s -I "http://localhost:${HOST_PORT}/")
    if echo "$headers" | grep -q "X-Content-Type-Options: nosniff"; then
        print_success "安全头 X-Content-Type-Options 正确设置"
    else
        print_error "安全头 X-Content-Type-Options 缺失"
    fi
}

# 验证HTML内容
verify_content() {
    print_step "验证页面内容"
    html=$(curl -s "http://localhost:${HOST_PORT}/")
    
    if echo "$html" | grep -q "书法考级"; then
        print_success "页面包含'书法考级'标题"
    else
        print_error "页面标题不匹配"
        exit 1
    fi
    
    if echo "$html" | grep -q "<div id=\"root\"></div>"; then
        print_success "存在 React 挂载点"
    else
        print_error "React 挂载点缺失"
        exit 1
    fi
    
    if echo "$html" | grep -q "<script.*\.js"; then
        print_success "JS 脚本已注入"
    else
        print_error "JS 脚本缺失"
        exit 1
    fi
}

# 验证容器文件
verify_container_files() {
    print_step "验证容器内文件"
    
    # 检查index.html存在
    if docker exec ${CONTAINER_NAME} test -f /usr/share/nginx/html/index.html; then
        print_success "index.html 存在于容器内"
    else
        print_error "index.html 不存在"
        exit 1
    fi

    # 检查nginx配置
    if docker exec ${CONTAINER_NAME} test -f /etc/nginx/conf.d/default.conf; then
        print_success "Nginx 配置存在"
    else
        print_error "Nginx 配置不存在"
        exit 1
    fi

    # 检查nginx正在运行
    if docker exec ${CONTAINER_NAME} pgrep nginx > /dev/null; then
        print_success "Nginx 进程正在运行"
    else
        print_error "Nginx 进程未运行"
        exit 1
    fi
}

# 验证Docker Compose
verify_compose() {
    print_step "验证 docker-compose.yml 格式"
    
    if command -v docker-compose &> /dev/null; then
        docker-compose config > /dev/null
    else
        docker compose config > /dev/null
    fi
    print_success "docker-compose.yml 格式正确"
}

# 主流程
main() {
    echo "============================================"
    echo "  书法考级报名系统 - 容器化验证"
    echo "============================================"

    check_docker
    verify_compose
    cleanup
    build_image
    start_container
    wait_for_health
    verify_http
    verify_content
    verify_container_files

    echo ""
    echo "============================================"
    echo -e "  ${GREEN}所有验证通过！${NC}"
    echo "============================================"
    echo ""
    echo "  访问地址: http://localhost:${HOST_PORT}"
    echo "  容器名称: ${CONTAINER_NAME}"
    echo "  镜像名称: ${IMAGE_NAME}"
    echo ""
    echo "  快速命令："
    echo "    启动: docker compose up -d"
    echo "    停止: docker compose down"
    echo "    日志: docker logs -f ${CONTAINER_NAME}"
    echo ""

    # 询问是否保留容器
    read -p "是否保留测试容器? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        cleanup
        print_success "已清理测试资源"
    fi
}

# 捕获异常
trap 'print_error "验证失败，请检查日志"; [ -n "$(docker ps -aq -f name=${CONTAINER_NAME})" ] && docker rm -f ${CONTAINER_NAME} > /dev/null 2>&1 || true; exit 1' ERR

main "$@"
