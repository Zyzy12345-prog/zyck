# 员工管理API文档

## 📋 概述

员工管理API提供完整的员工账号管理、权限管理、工作统计和认证功能。

**基础URL**：`/api/employees`  
**认证方式**：JWT Bearer Token  
**创建时间**：2026-01-23

---

## 🔐 认证说明

### 请求头格式
```
Authorization: Bearer <token>
```

### Token获取
通过登录接口获取token：
```bash
POST /api/employees/login
```

---

## 📚 API接口列表

### 1. 员工账号管理

#### 1.1 创建员工账号
```
POST /api/employees
```

**权限要求**：`employee:create`

**请求体**：
```json
{
  "employeeId": "EMP001",
  "username": "zhangsan",
  "password": "password123",
  "fullName": "张三",
  "email": "zhangsan@example.com",
  "phone": "13800138000",
  "department": "销售部",
  "position": "销售经理",
  "avatar": "https://example.com/avatar.jpg",
  "hireDate": "2024-01-15",
  "roleId": 2,
  "permissions": ["client:read", "client:write"],
  "accessLevel": 5
}
```

**必填字段**：
- `employeeId` - 员工工号
- `username` - 用户名
- `password` - 密码
- `fullName` - 姓名
- `email` - 邮箱

**响应示例**：
```json
{
  "success": true,
  "message": "员工创建成功",
  "data": {
    "id": 1,
    "employeeId": "EMP001",
    "username": "zhangsan",
    "fullName": "张三",
    "email": "zhangsan@example.com",
    "phone": "13800138000",
    "department": "销售部",
    "position": "销售经理",
    "status": "active",
    "role": {
      "id": 2,
      "name": "销售经理",
      "code": "SALES_MANAGER"
    },
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

#### 1.2 获取员工列表
```
GET /api/employees
```

**权限要求**：`employee:read`

**查询参数**：
- `page` - 页码（默认：1）
- `limit` - 每页数量（默认：10）
- `search` - 搜索关键词（工号、姓名、邮箱、电话）
- `department` - 部门筛选
- `position` - 职位筛选
- `status` - 状态筛选（active/inactive/suspended）
- `roleId` - 角色筛选
- `sortBy` - 排序字段（默认：createdAt）
- `sortOrder` - 排序方向（ASC/DESC，默认：DESC）

**请求示例**：
```bash
GET /api/employees?page=1&limit=10&department=销售部&status=active
```

**响应示例**：
```json
{
  "success": true,
  "message": "获取员工列表成功",
  "data": {
    "employees": [
      {
        "id": 1,
        "employeeId": "EMP001",
        "username": "zhangsan",
        "fullName": "张三",
        "email": "zhangsan@example.com",
        "department": "销售部",
        "position": "销售经理",
        "status": "active",
        "role": {
          "id": 2,
          "name": "销售经理",
          "code": "SALES_MANAGER",
          "level": 60
        }
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

---

#### 1.3 获取员工详情
```
GET /api/employees/:id
```

**权限要求**：`employee:read`

**响应示例**：
```json
{
  "success": true,
  "message": "获取员工详情成功",
  "data": {
    "id": 1,
    "employeeId": "EMP001",
    "username": "zhangsan",
    "fullName": "张三",
    "email": "zhangsan@example.com",
    "phone": "13800138000",
    "department": "销售部",
    "position": "销售经理",
    "avatar": "https://example.com/avatar.jpg",
    "status": "active",
    "hireDate": "2024-01-15",
    "lastLogin": "2024-01-20T10:00:00.000Z",
    "loginIp": "192.168.1.100",
    "role": {
      "id": 2,
      "name": "销售经理",
      "code": "SALES_MANAGER",
      "level": 60,
      "permissions": ["client:read", "client:write", "call:read"],
      "permissionDetails": [...]
    },
    "permissions": ["client:read", "client:write"],
    "accessLevel": 5,
    "totalClients": 50,
    "activeClients": 30,
    "completedCalls": 200,
    "successRate": 75.5,
    "createdAt": "2024-01-15T10:00:00.000Z",
    "updatedAt": "2024-01-20T10:00:00.000Z"
  }
}
```

---

#### 1.4 更新员工信息
```
PUT /api/employees/:id
```

**权限要求**：`employee:update`

**请求体**：
```json
{
  "fullName": "张三",
  "email": "zhangsan@example.com",
  "phone": "13800138001",
  "department": "市场部",
  "position": "市场总监",
  "avatar": "https://example.com/new-avatar.jpg",
  "hireDate": "2024-01-15",
  "roleId": 3,
  "permissions": ["client:read", "client:write", "report:view"],
  "accessLevel": 7
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "员工信息更新成功",
  "data": {
    "id": 1,
    "fullName": "张三",
    "department": "市场部",
    "position": "市场总监",
    ...
  }
}
```

---

#### 1.5 删除员工账号
```
DELETE /api/employees/:id
```

**权限要求**：`employee:delete`

**说明**：软删除，将员工状态改为`inactive`

**响应示例**：
```json
{
  "success": true,
  "message": "员工账号已停用"
}
```

---

#### 1.6 修改员工状态
```
PATCH /api/employees/:id/status
```

**权限要求**：`employee:update`

**请求体**：
```json
{
  "status": "active"
}
```

**状态值**：
- `active` - 在职
- `inactive` - 离职
- `suspended` - 停用

**响应示例**：
```json
{
  "success": true,
  "message": "员工状态更新成功",
  "data": {
    "status": "active"
  }
}
```

---

### 2. 权限管理

#### 2.1 分配角色
```
POST /api/employees/:id/role
```

**权限要求**：`role:update`

**请求体**：
```json
{
  "roleId": 2
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "角色分配成功",
  "data": {
    "id": 1,
    "fullName": "张三",
    "role": {
      "id": 2,
      "name": "销售经理",
      "code": "SALES_MANAGER"
    }
  }
}
```

---

#### 2.2 更新员工权限
```
PUT /api/employees/:id/permissions
```

**权限要求**：`permission:manage`

**请求体**：
```json
{
  "permissions": [
    "client:read",
    "client:write",
    "call:read",
    "call:create",
    "report:view"
  ]
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "权限更新成功",
  "data": {
    "permissions": ["client:read", "client:write", ...]
  }
}
```

---

#### 2.3 获取员工权限列表
```
GET /api/employees/:id/permissions
```

**权限要求**：`employee:read`

**响应示例**：
```json
{
  "success": true,
  "message": "获取权限列表成功",
  "data": {
    "permissions": ["client:read", "client:write", "call:read"],
    "permissionDetails": [
      {
        "id": 1,
        "code": "client:read",
        "name": "查看客户",
        "module": "client",
        "action": "read"
      }
    ],
    "groupedPermissions": {
      "client": [...],
      "call": [...]
    },
    "role": {
      "id": 2,
      "name": "销售经理"
    }
  }
}
```

---

### 3. 员工工作统计

#### 3.1 获取员工工作统计
```
GET /api/employees/:id/stats
```

**权限要求**：`employee:read`

**响应示例**：
```json
{
  "success": true,
  "message": "获取工作统计成功",
  "data": {
    "totalClients": 50,
    "activeClients": 30,
    "totalCalls": 200,
    "completedCalls": 180,
    "monthCalls": 45,
    "successRate": 90.0,
    "workDays": 365,
    "hireDate": "2024-01-15",
    "lastLogin": "2024-01-20T10:00:00.000Z"
  }
}
```

---

#### 3.2 获取员工负责的客户
```
GET /api/employees/:id/clients
```

**权限要求**：`employee:read`

**查询参数**：
- `page` - 页码（默认：1）
- `limit` - 每页数量（默认：10）
- `status` - 状态筛选（默认：active）

**响应示例**：
```json
{
  "success": true,
  "message": "获取客户列表成功",
  "data": {
    "assignments": [
      {
        "id": 1,
        "userId": 1,
        "clientId": 10,
        "status": "active",
        "assignedAt": "2024-01-15T10:00:00.000Z",
        "client": {
          "id": 10,
          "companyName": "ABC公司",
          "contactPerson": "李四",
          "phone": "13900139000"
        }
      }
    ],
    "pagination": {
      "total": 30,
      "page": 1,
      "limit": 10,
      "totalPages": 3
    }
  }
}
```

---

#### 3.3 获取员工的通话记录
```
GET /api/employees/:id/calls
```

**权限要求**：`employee:read`

**查询参数**：
- `page` - 页码
- `limit` - 每页数量
- `status` - 状态筛选
- `startDate` - 开始日期
- `endDate` - 结束日期

**响应示例**：
```json
{
  "success": true,
  "message": "获取通话记录成功",
  "data": {
    "calls": [
      {
        "id": 1,
        "clientId": 10,
        "userId": 1,
        "phoneNumber": "13900139000",
        "callType": "outbound",
        "callTime": "2024-01-20T10:00:00.000Z",
        "duration": 300,
        "status": "completed",
        "summary": "讨论合作事宜",
        "Client": {
          "id": 10,
          "companyName": "ABC公司",
          "contactPerson": "李四"
        }
      }
    ],
    "pagination": {
      "total": 200,
      "page": 1,
      "limit": 10,
      "totalPages": 20
    }
  }
}
```

---

### 4. 登录和认证

#### 4.1 员工登录
```
POST /api/employees/login
```

**权限要求**：无（公开接口）

**请求体**：
```json
{
  "username": "zhangsan",
  "password": "password123"
}
```

**说明**：支持用户名或邮箱登录

**响应示例**：
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "employee": {
      "id": 1,
      "employeeId": "EMP001",
      "username": "zhangsan",
      "fullName": "张三",
      "email": "zhangsan@example.com",
      "department": "销售部",
      "position": "销售经理",
      "role": {
        "id": 2,
        "name": "销售经理",
        "code": "SALES_MANAGER"
      }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

#### 4.2 员工登出
```
POST /api/employees/logout
```

**权限要求**：已认证

**响应示例**：
```json
{
  "success": true,
  "message": "登出成功"
}
```

---

#### 4.3 修改密码
```
PUT /api/employees/change-password
```

**权限要求**：已认证

**请求体**：
```json
{
  "oldPassword": "password123",
  "newPassword": "newpassword456"
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "密码修改成功"
}
```

---

#### 4.4 重置密码（管理员）
```
PUT /api/employees/:id/reset-password
```

**权限要求**：`employee:update`

**请求体**：
```json
{
  "newPassword": "newpassword123"
}
```

**响应示例**：
```json
{
  "success": true,
  "message": "密码重置成功"
}
```

---

### 5. 员工自助

#### 5.1 获取个人信息
```
GET /api/employees/profile
```

**权限要求**：已认证

**响应示例**：
```json
{
  "success": true,
  "message": "获取个人信息成功",
  "data": {
    "id": 1,
    "employeeId": "EMP001",
    "username": "zhangsan",
    "fullName": "张三",
    "email": "zhangsan@example.com",
    "phone": "13800138000",
    "department": "销售部",
    "position": "销售经理",
    "avatar": "https://example.com/avatar.jpg",
    "role": {...},
    "permissions": [...]
  }
}
```

---

#### 5.2 更新个人信息
```
PUT /api/employees/profile
```

**权限要求**：已认证

**请求体**：
```json
{
  "fullName": "张三",
  "email": "zhangsan@example.com",
  "phone": "13800138001",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**说明**：只能更新基本信息，不能修改角色、权限等

**响应示例**：
```json
{
  "success": true,
  "message": "个人信息更新成功",
  "data": {
    "id": 1,
    "fullName": "张三",
    "email": "zhangsan@example.com",
    ...
  }
}
```

---

## 🔒 权限说明

### 权限代码列表

| 权限代码 | 说明 | 所需角色 |
|---------|------|---------|
| `employee:read` | 查看员工 | 管理员、经理 |
| `employee:create` | 创建员工 | 管理员 |
| `employee:update` | 更新员工 | 管理员 |
| `employee:delete` | 删除员工 | 管理员 |
| `role:update` | 分配角色 | 管理员 |
| `permission:manage` | 管理权限 | 超级管理员 |

---

## 📝 错误响应

### 错误格式
```json
{
  "success": false,
  "message": "错误描述"
}
```

### 常见错误码

| 状态码 | 说明 |
|--------|------|
| 400 | 请求参数错误 |
| 401 | 未认证或token无效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如用户名已存在）|
| 500 | 服务器内部错误 |

---

## 💡 使用示例

### 示例1：创建员工并分配角色

```bash
# 1. 登录获取token
curl -X POST http://localhost:3000/api/employees/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123"
  }'

# 2. 创建员工
curl -X POST http://localhost:3000/api/employees \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP002",
    "username": "lisi",
    "password": "password123",
    "fullName": "李四",
    "email": "lisi@example.com",
    "department": "销售部",
    "position": "销售专员",
    "roleId": 5
  }'
```

### 示例2：查询员工列表

```bash
curl -X GET "http://localhost:3000/api/employees?page=1&limit=10&department=销售部&status=active" \
  -H "Authorization: Bearer <token>"
```

### 示例3：更新员工权限

```bash
curl -X PUT http://localhost:3000/api/employees/1/permissions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": [
      "client:read",
      "client:write",
      "call:read",
      "call:create"
    ]
  }'
```

---

## 📚 相关文档

- [员工管理模块数据模型文档](./员工管理模块数据模型文档.md)
- [角色和权限管理系统文档](./角色和权限管理系统文档.md)
- [员工模型快速参考](./员工模型快速参考.md)

---

**创建时间**：2026-01-23  
**版本**：v1.0.0




