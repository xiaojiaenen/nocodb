# syntax=docker/dockerfile:1

################
# 1. 构建阶段 (Builder)
################
FROM node:22-slim AS builder
WORKDIR /usr/src/app

# 安装构建依赖
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libssl-dev \
    git \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# 复制整个工作区源码
COPY . .

# 配置 pnpm 
RUN echo "node-linker=hoisted" > .npmrc

# 安装所有依赖
RUN pnpm install

# 构建所有项目 (包括 SDK, Integrations, Backend)
RUN pnpm run bootstrap

# 显式构建前端静态文件 (Nuxt generate)
# 星澜 (XingLan) 作为一个无代码平台，前端是核心交互界面
RUN pnpm --filter=nc-gui run generate

# 额外构建后端 Docker 特定产物
WORKDIR /usr/src/app/packages/nocodb
RUN pnpm run docker:build

################
# 2. 运行阶段 (Runner with Nginx)
################
FROM node:22-slim

# 安装 Nginx 和 Supervisord (用于同时管理 Node 和 Nginx 进程)
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    dumb-init \
    curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# 运行环境变量
ENV NC_DOCKER=0.6 \
    NC_TOOL_DIR=/usr/app/data/ \
    NODE_ENV=production \
    PORT=8080 \
    NC_DISABLE_TELE=true

# ----------------------------------------------------
# A. 部署后端 (Node.js)
# ----------------------------------------------------
# 复制后端构建产物
COPY --from=builder /usr/src/app/packages/nocodb/docker/ /usr/src/app/
# 复制启动脚本 (使用 start-local.sh 兼容源码运行模式)
COPY --from=builder /usr/src/app/packages/nocodb/docker/start-local.sh /usr/src/appEntry/start.sh
RUN chmod +x /usr/src/appEntry/start.sh

# ----------------------------------------------------
# B. 部署前端 (Nginx)
# ----------------------------------------------------
# 复制前端静态文件到 Nginx 目录
# 优先从 dist 复制，如果不存在则从 .output/public 复制 (Nuxt 3 默认)
COPY --from=builder /usr/src/app/packages/nc-gui/dist/ /var/www/html/dashboard/

# 复制 Nginx 配置文件
COPY nginx.conf /etc/nginx/sites-available/default

# ----------------------------------------------------
# C. 配置进程管理 (Supervisord)
# ----------------------------------------------------
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# 暴露 Nginx 默认端口
EXPOSE 80

# 使用 Supervisord 启动所有服务
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
