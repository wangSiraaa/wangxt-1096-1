# ============================================
# 书法考级报名系统 - Dockerfile
# 多阶段构建：构建静态站点
# ============================================

# ---------- 阶段1：构建阶段 ----------
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./

# 使用淘宝镜像加速（可选，容器内可配置
RUN npm config set registry https://registry.npmmirror.com || true

# 安装依赖
RUN npm install

# 复制源码
COPY . .

# 构建生产版本
RUN npm run build

# ---------- 阶段2：运行阶段 ----------
FROM nginx:alpine AS runner

# 维护者信息
LABEL maintainer="calligraphy-exam-system"
LABEL description="书法考级报名系统 - 考点/考生/评委三端前端应用"
LABEL version="1.0.0"

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制Nginx配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost/ || exit 1

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]
