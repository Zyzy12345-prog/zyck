# 快速启动指南

## 前置要求

1. Node.js (v14 或更高版本)
2. PostgreSQL (v12 或更高版本)
3. npm 或 yarn

## 安装步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接信息：

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tax_crm
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key
```

### 3. 创建数据库

在PostgreSQL中创建数据库：

```sql
CREATE DATABASE tax_crm;
```

### 4. 初始化项目目录

```bash
npm run init
```

### 5. 运行数据库迁移

```bash
npm run db:migrate
```

### 6. 启动服务器

开发环境：
```bash
npm run dev
```

生产环境：
```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

## 测试API

### 1. 注册管理员账户

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@example.com",
    "password": "admin123",
    "role": "admin"
  }'
```

### 2. 登录获取Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'
```

### 3. 使用Token访问API

将返回的token替换到以下命令中：

```bash
curl -X GET http://localhost:3000/api/clients \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 常见问题

### 数据库连接失败

- 检查PostgreSQL服务是否运行
- 确认 `.env` 中的数据库配置正确
- 检查数据库用户权限

### 端口被占用

修改 `.env` 中的 `PORT` 配置

### 迁移失败

确保数据库已创建，并且用户有足够的权限
