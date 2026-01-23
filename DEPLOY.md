# 星澜 (XingLan) 私有化部署指南

本文档详细说明了如何基于当前源码，使用 Docker 和 Nginx 进行高性能的私有化部署。该方案专为内网环境和生产环境设计，确保了品牌定制化（"星澜"）的完整保留，并优化了前端资源加载速度。

## 1. 部署架构说明

本方案采用**全源码构建**与**单容器全栈部署**相结合的架构：

*   **构建阶段**：使用 Docker 多阶段构建，从当前源码编译前端（Nuxt 3）和后端（Node.js）。
*   **运行阶段**：
    *   **Nginx**：作为高性能 Web 服务器，直接托管前端静态资源（HTML/CSS/JS），并负责 API 反向代理。
    *   **Node.js**：运行后端 API 服务。
    *   **Supervisord**：进程管理器，确保 Nginx 和 Node.js 在同一个容器内稳定运行。
*   **数据库**：支持连接外部 MySQL 数据库（推荐生产环境使用）。

## 2. 环境要求

*   **操作系统**：Linux (推荐), Windows, macOS
*   **软件依赖**：
    *   Docker Engine (20.10+)
    *   Docker Compose (2.0+)

## 3. 快速部署

### 3.1 修改配置

打开根目录下的 `docker-compose.yml` 文件，根据您的实际环境修改以下环境变量：

```yaml
environment:
  # [必填] 数据库连接字符串
  # 格式: mysql2://用户名:密码@主机地址:端口/数据库名
  NC_DB: "mysql2://root:password@192.168.1.100:3306?u=root&p=password&d=nocodb"

  # [必填] 平台访问地址 (用于生成邮件链接、附件链接等)
  # 如果是内网 IP 访问，请填写 http://192.168.x.x
  # 如果是域名访问，请填写 http://your-domain.com
  NC_PUBLIC_URL: "http://localhost"
  
  # [可选] 禁用遥测 (内网环境建议开启)
  NC_DISABLE_TELE: "true"
```

### 3.2 启动服务

在项目根目录下执行以下命令：

```bash
# 构建镜像并启动服务 (-d 表示后台运行)
docker-compose up -d --build
```

首次构建需要下载依赖并编译源码，可能需要几分钟时间。

### 3.3 验证部署

访问浏览器：`http://localhost` (或您服务器的 IP)。

如果看到"星澜"登录界面，且没有加载错误，即表示部署成功。

## 4. 运维管理

### 查看日志

```bash
# 查看实时日志
docker-compose logs -f

# 查看 Nginx 特定日志 (进入容器内部)
docker exec -it xinglan-app tail -f /var/log/nginx.err.log
docker exec -it xinglan-app tail -f /var/log/nocodb.out.log
```

### 更新部署

当源码发生变更（如修改了代码或更新了版本）时，请执行：

```bash
# 1. 拉取最新代码 (如果是 git 项目)
git pull

# 2. 重新构建并重启容器
docker-compose up -d --build
```

### 数据备份

所有上传的文件和部分运行时数据存储在 Docker 卷 `xinglan_data` 中。建议定期备份外部 MySQL 数据库以及该 Docker 卷的数据。

## 5. 文件结构说明

*   `Dockerfile`: 定义了从源码到最终运行镜像的完整构建流程。
*   `docker-compose.yml`: 定义了服务运行参数、端口映射和环境变量。
*   `nginx.conf`: Nginx 配置文件，处理静态资源分发和 API 转发规则。
*   `supervisord.conf`: 进程管理配置，确保双进程（Nginx + Node）高可用。
