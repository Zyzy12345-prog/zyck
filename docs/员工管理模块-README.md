# 员工管理模块 - 数据库设计文档

## 📋 概述

员工管理模块提供完整的企业人员管理功能，包括：
- 🏢 **部门管理**：支持树形结构的部门组织
- 👥 **员工管理**：完整的员工信息和账户管理
- 🔐 **角色权限**：基于角色的访问控制（RBAC）
- 🔗 **关联管理**：员工与部门、角色的灵活关联

## 📊 数据库表结构

### 1. 部门表 (departments)

**功能：** 支持树形结构的部门管理

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | INTEGER | 部门ID | 主键，自增 |
| name | VARCHAR(100) | 部门名称 | 非空 |
| code | VARCHAR(50) | 部门编码 | 非空，唯一 |
| parent_id | INTEGER | 父部门ID | 外键 → departments.id |
| manager_id | INTEGER | 部门经理ID | 外键 → employees.id |
| level | INTEGER | 部门层级 | 非空，默认1 |
| sort_order | INTEGER | 排序顺序 | 非空，默认0 |
| description | TEXT | 部门描述 | 可空 |
| status | ENUM | 状态 | active/inactive/deleted |
| created_at | TIMESTAMP | 创建时间 | 非空 |
| updated_at | TIMESTAMP | 更新时间 | 非空 |

**索引：**
- `idx_departments_code`: 部门编码（唯一）
- `idx_departments_parent_id`: 父部门ID
- `idx_departments_status`: 状态

**特性：**
- ✅ 支持无限层级的树形结构
- ✅ 自动计算部门层级
- ✅ 软删除支持（status字段）
- ✅ 部门经理关联

---

### 2. 员工表 (employees)

**功能：** 完整的员工信息和登录认证

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | INTEGER | 员工ID | 主键，自增 |
| employee_no | VARCHAR(50) | 员工工号 | 非空，唯一 |
| name | VARCHAR(100) | 员工姓名 | 非空 |
| username | VARCHAR(50) | 登录用户名 | 非空，唯一 |
| password | VARCHAR(255) | 登录密码 | 非空，加密存储 |
| email | VARCHAR(100) | 邮箱 | 唯一 |
| phone | VARCHAR(20) | 手机号码 | - |
| avatar | VARCHAR(255) | 头像URL | - |
| gender | ENUM | 性别 | male/female/other |
| birth_date | DATE | 出生日期 | - |
| id_card | VARCHAR(18) | 身份证号 | - |
| department_id | INTEGER | 所属部门ID | 外键 → departments.id |
| position | VARCHAR(100) | 职位 | - |
| level | VARCHAR(50) | 职级 | - |
| hire_date | DATE | 入职日期 | - |
| resign_date | DATE | 离职日期 | - |
| status | ENUM | 状态 | active/inactive/resigned/deleted |
| is_admin | BOOLEAN | 是否管理员 | 默认false |
| last_login_at | TIMESTAMP | 最后登录时间 | - |
| last_login_ip | VARCHAR(50) | 最后登录IP | - |
| remarks | TEXT | 备注 | - |
| created_by | INTEGER | 创建人ID | - |
| updated_by | INTEGER | 更新人ID | - |
| created_at | TIMESTAMP | 创建时间 | 非空 |
| updated_at | TIMESTAMP | 更新时间 | 非空 |

**索引：**
- `idx_employees_employee_no`: 员工工号（唯一）
- `idx_employees_username`: 用户名（唯一）
- `idx_employees_email`: 邮箱（唯一）
- `idx_employees_department_id`: 部门ID
- `idx_employees_status`: 状态
- `idx_employees_phone`: 手机号码

**特性：**
- ✅ 密码自动加密（bcrypt）
- ✅ 自动生成员工工号（格式：YYYYMM0001）
- ✅ 支持多角色分配
- ✅ 登录信息追踪
- ✅ 软删除支持

---

### 3. 角色表 (roles)

**功能：** 基于角色的权限管理

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | INTEGER | 角色ID | 主键，自增 |
| name | VARCHAR(50) | 角色名称 | 非空，唯一 |
| code | VARCHAR(50) | 角色编码 | 非空，唯一 |
| description | TEXT | 角色描述 | - |
| permissions | JSONB | 权限配置 | JSON格式 |
| is_system | BOOLEAN | 是否系统角色 | 默认false |
| status | ENUM | 状态 | active/inactive/deleted |
| sort_order | INTEGER | 排序顺序 | 默认0 |
| created_by | INTEGER | 创建人ID | - |
| updated_by | INTEGER | 更新人ID | - |
| created_at | TIMESTAMP | 创建时间 | 非空 |
| updated_at | TIMESTAMP | 更新时间 | 非空 |

**索引：**
- `idx_roles_code`: 角色编码（唯一）
- `idx_roles_status`: 状态

**系统预定义角色：**

| 角色名称 | 角色编码 | 说明 |
|---------|---------|------|
| 超级管理员 | SUPER_ADMIN | 拥有所有权限 |
| 管理员 | ADMIN | 管理系统配置和用户 |
| 部门经理 | MANAGER | 管理部门员工和客户 |
| 销售人员 | SALES | 管理客户和外呼记录 |
| 普通员工 | EMPLOYEE | 基本查看权限 |

**特性：**
- ✅ 系统角色不可删除
- ✅ JSONB存储权限配置
- ✅ 灵活的权限控制

---

### 4. 员工角色关联表 (employee_roles)

**功能：** 员工与角色的多对多关联

| 字段名 | 类型 | 说明 | 约束 |
|--------|------|------|------|
| id | INTEGER | 关联ID | 主键，自增 |
| employee_id | INTEGER | 员工ID | 外键 → employees.id |
| role_id | INTEGER | 角色ID | 外键 → roles.id |
| assigned_by | INTEGER | 分配人ID | - |
| assigned_at | TIMESTAMP | 分配时间 | 非空 |
| created_at | TIMESTAMP | 创建时间 | 非空 |
| updated_at | TIMESTAMP | 更新时间 | 非空 |

**索引：**
- `idx_employee_roles_unique`: (employee_id, role_id) 唯一索引
- `idx_employee_roles_employee_id`: 员工ID
- `idx_employee_roles_role_id`: 角色ID

**特性：**
- ✅ 一个员工可以拥有多个角色
- ✅ 防止重复分配
- ✅ 记录分配人和分配时间

---

## 🔐 权限系统

### 权限列表

| 权限代码 | 说明 |
|---------|------|
| `*` | 所有权限（超级管理员） |
| `system.manage` | 系统管理 |
| `employee.manage` | 员工管理 |
| `employee.view` | 查看员工 |
| `department.manage` | 部门管理 |
| `role.manage` | 角色管理 |
| `client.manage` | 客户管理 |
| `client.view` | 查看客户 |
| `client.create` | 创建客户 |
| `client.edit` | 编辑客户 |
| `client.delete` | 删除客户 |
| `client.assign` | 分配客户 |
| `call.manage` | 外呼管理 |
| `call.view` | 查看外呼记录 |
| `call.create` | 创建外呼记录 |
| `call.edit` | 编辑外呼记录 |
| `report.view` | 查看报表 |

### 权限配置示例

```json
{
  "client.view": true,
  "client.create": true,
  "client.edit": true,
  "call.view": true,
  "call.create": true
}
```

---

## 🚀 快速开始

### 1. 运行数据库迁移

```bash
# 进入项目目录
cd d:/tax-crm-system

# 运行迁移
npx sequelize-cli db:migrate
```

### 2. 初始化数据

```bash
# 运行初始化脚本
node scripts/init-employee-data.js
```

### 3. 默认账户

**管理员账户：**
- 用户名：`admin`
- 密码：`admin123456`
- 角色：超级管理员

**测试账户：**
- 经理账户：`zhangmanager` / `password123`
- 销售账户：`lisales` / `password123`

---

## 📝 使用示例

### 创建部门

```javascript
const department = await Department.create({
  name: '研发部',
  code: 'RD_DEPT',
  parentId: null, // 一级部门
  level: 1,
  description: '产品研发部门',
  status: 'active'
});
```

### 创建员工

```javascript
const employee = await Employee.create({
  name: '张三',
  username: 'zhangsan',
  password: 'password123', // 会自动加密
  email: 'zhangsan@example.com',
  phone: '13800138000',
  departmentId: department.id,
  position: '高级工程师',
  level: 'P7',
  hireDate: new Date(),
  status: 'active'
});
```

### 分配角色

```javascript
// 查找角色
const role = await Role.findOne({ where: { code: 'SALES' } });

// 分配角色
await EmployeeRole.create({
  employeeId: employee.id,
  roleId: role.id,
  assignedBy: adminId,
  assignedAt: new Date()
});
```

### 检查权限

```javascript
// 检查员工是否有某个权限
const hasPermission = await employee.hasPermission('client.create');

// 获取员工所有权限
const permissions = await employee.getAllPermissions();
```

---

## 🔄 数据关系图

```
departments (部门)
    ↓ 1:N
employees (员工)
    ↓ N:M
employee_roles (关联)
    ↓ N:M
roles (角色)
```

---

## ⚠️ 注意事项

1. **密码安全**
   - 密码使用 bcrypt 加密存储
   - 默认密码强度：10轮加盐

2. **软删除**
   - 使用 `status` 字段标记删除状态
   - 不进行物理删除，保留历史数据

3. **工号生成**
   - 格式：YYYYMM0001
   - 自动递增，按月重置

4. **系统角色**
   - 系统角色不可删除
   - 系统角色编码不可修改

5. **部门层级**
   - 建议不超过5级
   - 自动计算层级深度

---

## 📚 相关文档

- [数据库设计SQL](./员工管理模块-数据库设计.sql)
- [API接口文档](./员工管理模块-API文档.md)
- [前端开发指南](./员工管理模块-前端开发.md)

---

## 🔧 维护命令

```bash
# 查看迁移状态
npx sequelize-cli db:migrate:status

# 回滚最后一次迁移
npx sequelize-cli db:migrate:undo

# 回滚所有迁移
npx sequelize-cli db:migrate:undo:all

# 重新初始化数据
node scripts/init-employee-data.js
```

---

**创建时间：** 2026-02-02  
**版本：** v1.0.0  
**维护人：** 开发团队











