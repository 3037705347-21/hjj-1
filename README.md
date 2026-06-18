# 生物实验室试剂耗材管理系统

面向生物实验室的试剂与耗材管理系统，旨在解决实验室试剂批次追踪、库存管理、效期预警等核心痛点，提升实验室运营效率与合规性。

## 项目结构

```
.
├── README.md                    # 项目说明文档
├── .gitignore                   # Git 忽略配置
└── frontend-admin/              # 前端管理系统
    ├── public/                  # 静态资源
    ├── src/                     # 源代码
    ├── .env                     # 环境变量（开发环境）
    ├── .env.production          # 环境变量（生产环境）
    ├── .eslintrc.cjs            # ESLint 配置
    ├── .eslintignore            # ESLint 忽略
    ├── package.json             # 项目依赖配置
    ├── tsconfig.json            # TypeScript 配置
    ├── tailwind.config.js       # Tailwind CSS 配置
    ├── postcss.config.js        # PostCSS 配置
    └── vite.config.ts           # Vite 配置
```

## 技术栈

- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite 5
- **路由**: Vue Router 4
- **样式**: Tailwind CSS 3
- **状态管理**: 原生响应式 (Vue Composition API)
- **代码规范**: ESLint + TypeScript
- **图标**: Lucide Vue Next

## 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- 推荐使用 `npm@10.2.4` (packageManager 已锁定)

## 安装

```bash
# 进入前端目录
cd frontend-admin

# 安装依赖
npm install
```

## 环境变量配置

### 环境变量文件

| 文件名 | 说明 | 生效时机 |
|--------|------|----------|
| `.env` | 开发环境默认配置 | `npm run dev` |
| `.env.production` | 生产环境配置 | `npm run build` |
| `.env.local` | 本地覆盖配置（不提交到 Git） | 所有环境，优先级最高 |

### 可用环境变量

```env
# 应用标题
VITE_APP_TITLE=生物实验室试剂耗材管理系统

# 运行环境: development | production
VITE_APP_ENV=development

# API 基础路径
VITE_API_BASE_URL=/api

# 是否启用 Mock 数据: true | false
VITE_MOCK_ENABLED=true

# Source Map 配置: inline | hidden | true | false
VITE_SOURCE_MAP=inline

# 是否启用开发工具: true | false
VITE_DEVTOOLS_ENABLED=true

# 开发服务器端口
VITE_PORT=5173
```

### 开发环境示例 (.env)

```env
VITE_APP_TITLE=生物实验室试剂耗材管理系统
VITE_APP_ENV=development
VITE_API_BASE_URL=/api
VITE_MOCK_ENABLED=true
VITE_SOURCE_MAP=inline
VITE_DEVTOOLS_ENABLED=true
VITE_PORT=5173
```

### 生产环境示例 (.env.production)

```env
VITE_APP_TITLE=生物实验室试剂耗材管理系统
VITE_APP_ENV=production
VITE_API_BASE_URL=/api
VITE_MOCK_ENABLED=false
VITE_SOURCE_MAP=hidden
VITE_DEVTOOLS_ENABLED=false
```

## 开发

```bash
# 启动开发服务器
cd frontend-admin
npm run dev
```

开发服务器默认运行在 `http://localhost:5173`，可通过 `VITE_PORT` 环境变量修改端口。

## 构建

```bash
# 进入前端目录
cd frontend-admin

# TypeScript 类型检查 + 生产构建
npm run build

# 仅类型检查
npm run check
```

构建产物将输出到 `frontend-admin/dist` 目录。

构建配置通过环境变量驱动：
- `VITE_SOURCE_MAP` 控制 sourcemap 生成策略
- `VITE_MOCK_ENABLED` 控制是否启用 mock 数据
- `VITE_DEVTOOLS_ENABLED` 控制是否启用开发工具

## 预览

```bash
# 预览生产构建结果
cd frontend-admin
npm run preview
```

预览服务器将在本地启动，用于验证生产构建产物。

## 代码规范

```bash
# ESLint 代码检查（不允许警告）
npm run lint

# ESLint 自动修复
npm run lint:fix
```

ESLint 配置详见 [frontend-admin/.eslintrc.cjs](file:///d:/project/hjj-1/frontend-admin/.eslintrc.cjs)。

## 部署

### 1. 构建产物

```bash
cd frontend-admin
npm install
npm run build
```

### 2. 静态资源部署

将 `frontend-admin/dist` 目录下的所有文件部署到静态服务器（Nginx、Apache、OSS 等）。

### 3. Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/frontend-admin/dist;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA 路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理（如需要）
    location /api {
        proxy_pass http://backend-server:port;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 4. Docker 部署示例

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY frontend-admin/package*.json ./
RUN npm ci
COPY frontend-admin/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 生产/开发差异

本项目通过环境变量驱动生产与开发环境的差异，详见 [frontend-admin/vite.config.ts](file:///d:/project/hjj-1/frontend-admin/vite.config.ts)：

| 特性 | 开发环境 | 生产环境 | 控制变量 |
|------|----------|----------|----------|
| Source Map | `inline` | `hidden` | `VITE_SOURCE_MAP` |
| Vue Dev Locator | 启用 | 禁用 | `VITE_DEVTOOLS_ENABLED` |
| Mock 数据 | 启用 | 禁用 | `VITE_MOCK_ENABLED` |
| HMR 热更新 | 启用 | 禁用 | - |
| 代码压缩 | 禁用 | 启用 | - |
| Trae Badge | 显示 | 显示 | `prodOnly: true` |

## 核心功能

- **登录页面**：用户认证、密码校验、登录状态保持
- **仪表盘**：数据概览、库存预警、效期提醒、统计图表
- **试剂管理**：试剂信息CRUD、分类管理、规格配置
- **试剂批管理**：批次录入、批次追踪、效期管理、入库出库记录
- **耗材管理**：耗材信息CRUD、库存管理、领用记录

## 开发文档

- [Vue 3 文档](https://vuejs.org/)
- [Vite 文档](https://vitejs.dev/)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [Vue Router 文档](https://router.vuejs.org/)
