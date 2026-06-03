-- ========================================
-- 员工管理模块 - 数据库表结构
-- ========================================
-- 创建时间: 2026-02-02
-- 数据库: PostgreSQL
-- 说明: 包含部门、员工、角色和关联表
-- ========================================

-- ========================================
-- 1. 部门表 (departments)
-- ========================================
-- 支持树形结构的部门管理
-- ========================================

CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY COMMENT '部门ID',
    name VARCHAR(100) NOT NULL COMMENT '部门名称',
    code VARCHAR(50) NOT NULL UNIQUE COMMENT '部门编码',
    parent_id INTEGER REFERENCES departments(id) ON UPDATE CASCADE ON DELETE SET NULL COMMENT '父部门ID',
    manager_id INTEGER COMMENT '部门经理ID（关联员工表）',
    level INTEGER NOT NULL DEFAULT 1 COMMENT '部门层级（1-一级部门，2-二级部门...）',
    sort_order INTEGER NOT NULL DEFAULT 0 COMMENT '排序顺序',
    description TEXT COMMENT '部门描述',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')) COMMENT '状态',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间'
);

-- 索引
CREATE UNIQUE INDEX idx_departments_code ON departments(code);
CREATE INDEX idx_departments_parent_id ON departments(parent_id);
CREATE INDEX idx_departments_status ON departments(status);

-- 表注释
COMMENT ON TABLE departments IS '部门表';

-- ========================================
-- 2. 员工表 (employees)
-- ========================================
-- 包含完整的员工信息和登录认证
-- ========================================

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY COMMENT '员工ID',
    employee_no VARCHAR(50) NOT NULL UNIQUE COMMENT '员工工号',
    name VARCHAR(100) NOT NULL COMMENT '员工姓名',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '登录用户名',
    password VARCHAR(255) NOT NULL COMMENT '登录密码（加密）',
    email VARCHAR(100) UNIQUE COMMENT '邮箱',
    phone VARCHAR(20) COMMENT '手机号码',
    avatar VARCHAR(255) COMMENT '头像URL',
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')) COMMENT '性别',
    birth_date DATE COMMENT '出生日期',
    id_card VARCHAR(18) COMMENT '身份证号',
    department_id INTEGER REFERENCES departments(id) ON UPDATE CASCADE ON DELETE SET NULL COMMENT '所属部门ID',
    position VARCHAR(100) COMMENT '职位',
    level VARCHAR(50) COMMENT '职级',
    hire_date DATE COMMENT '入职日期',
    resign_date DATE COMMENT '离职日期',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'resigned', 'deleted')) COMMENT '状态',
    is_admin BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否管理员',
    last_login_at TIMESTAMP COMMENT '最后登录时间',
    last_login_ip VARCHAR(50) COMMENT '最后登录IP',
    remarks TEXT COMMENT '备注',
    created_by INTEGER COMMENT '创建人ID',
    updated_by INTEGER COMMENT '更新人ID',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间'
);

-- 索引
CREATE UNIQUE INDEX idx_employees_employee_no ON employees(employee_no);
CREATE UNIQUE INDEX idx_employees_username ON employees(username);
CREATE UNIQUE INDEX idx_employees_email ON employees(email) WHERE email IS NOT NULL;
CREATE INDEX idx_employees_department_id ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_phone ON employees(phone);

-- 表注释
COMMENT ON TABLE employees IS '员工表';

-- ========================================
-- 3. 角色表 (roles)
-- ========================================
-- 基于角色的权限管理
-- ========================================

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY COMMENT '角色ID',
    name VARCHAR(50) NOT NULL UNIQUE COMMENT '角色名称',
    code VARCHAR(50) NOT NULL UNIQUE COMMENT '角色编码',
    description TEXT COMMENT '角色描述',
    permissions JSONB DEFAULT '{}' COMMENT '权限配置（JSON格式）',
    is_system BOOLEAN NOT NULL DEFAULT FALSE COMMENT '是否系统角色（系统角色不可删除）',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')) COMMENT '状态',
    sort_order INTEGER NOT NULL DEFAULT 0 COMMENT '排序顺序',
    created_by INTEGER COMMENT '创建人ID',
    updated_by INTEGER COMMENT '更新人ID',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间'
);

-- 索引
CREATE UNIQUE INDEX idx_roles_code ON roles(code);
CREATE INDEX idx_roles_status ON roles(status);

-- 表注释
COMMENT ON TABLE roles IS '角色表';

-- ========================================
-- 4. 员工角色关联表 (employee_roles)
-- ========================================
-- 多对多关系的中间表
-- ========================================

CREATE TABLE IF NOT EXISTS employee_roles (
    id SERIAL PRIMARY KEY COMMENT '关联ID',
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON UPDATE CASCADE ON DELETE CASCADE COMMENT '员工ID',
    role_id INTEGER NOT NULL REFERENCES roles(id) ON UPDATE CASCADE ON DELETE CASCADE COMMENT '角色ID',
    assigned_by INTEGER COMMENT '分配人ID',
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '分配时间',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE(employee_id, role_id)
);

-- 索引
CREATE UNIQUE INDEX idx_employee_roles_unique ON employee_roles(employee_id, role_id);
CREATE INDEX idx_employee_roles_employee_id ON employee_roles(employee_id);
CREATE INDEX idx_employee_roles_role_id ON employee_roles(role_id);

-- 表注释
COMMENT ON TABLE employee_roles IS '员工角色关联表';

-- ========================================
-- 初始数据
-- ========================================

-- 插入系统角色
INSERT INTO roles (name, code, description, is_system, permissions, status) VALUES
('超级管理员', 'SUPER_ADMIN', '拥有系统所有权限', TRUE, '{"*": true}', 'active'),
('管理员', 'ADMIN', '管理系统配置和用户', TRUE, '{"system.manage": true, "employee.manage": true, "department.manage": true, "role.manage": true, "client.manage": true, "client.view": true, "client.create": true, "client.edit": true, "client.delete": true, "call.manage": true, "call.view": true, "report.view": true}', 'active'),
('部门经理', 'MANAGER', '管理部门员工和客户', TRUE, '{"employee.view": true, "client.manage": true, "client.view": true, "client.create": true, "client.edit": true, "client.assign": true, "call.view": true, "call.create": true, "report.view": true}', 'active'),
('销售人员', 'SALES', '管理客户和外呼记录', TRUE, '{"client.view": true, "client.create": true, "client.edit": true, "call.view": true, "call.create": true, "call.edit": true}', 'active'),
('普通员工', 'EMPLOYEE', '基本查看权限', TRUE, '{"client.view": true, "call.view": true}', 'active')
ON CONFLICT (code) DO NOTHING;

-- 插入初始部门
INSERT INTO departments (name, code, level, sort_order, description, status) VALUES
('总经办', 'CEO_OFFICE', 1, 1, '公司最高管理层', 'active'),
('技术部', 'TECH_DEPT', 1, 2, '技术研发部门', 'active'),
('销售部', 'SALES_DEPT', 1, 3, '销售业务部门', 'active'),
('市场部', 'MARKET_DEPT', 1, 4, '市场营销部门', 'active'),
('财务部', 'FINANCE_DEPT', 1, 5, '财务管理部门', 'active'),
('人力资源部', 'HR_DEPT', 1, 6, '人力资源管理', 'active')
ON CONFLICT (code) DO NOTHING;

-- ========================================
-- 权限说明
-- ========================================
/*
权限列表：
- system.manage: 系统管理
- employee.manage: 员工管理
- employee.view: 查看员工
- department.manage: 部门管理
- role.manage: 角色管理
- client.manage: 客户管理
- client.view: 查看客户
- client.create: 创建客户
- client.edit: 编辑客户
- client.delete: 删除客户
- client.assign: 分配客户
- call.manage: 外呼管理
- call.view: 查看外呼记录
- call.create: 创建外呼记录
- call.edit: 编辑外呼记录
- report.view: 查看报表
*/

-- ========================================
-- 使用说明
-- ========================================
/*
1. 运行迁移创建表：
   npx sequelize-cli db:migrate

2. 初始化数据：
   node scripts/init-employee-data.js

3. 默认管理员账户：
   用户名: admin
   密码: admin123456

4. 测试账户：
   经理: zhangmanager / password123
   销售: lisales / password123
*/











