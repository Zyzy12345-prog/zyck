# 客户拓展模块开发文档

## 📋 模块概述

**版本**: v1.0  
**开发日期**: 2026年2月18日  
**模块名称**: 客户拓展模块 (Customer Expansion Module)

本模块为税务CRM系统新增了强大的客户拓展功能，包括客户线索管理、客户公海池、客户标签系统等核心功能。

---

## 🎯 核心功能

### 1. 客户线索管理 (Customer Leads)

**功能描述**: 管理潜在客户线索，追踪从线索到客户的转化过程。

**主要特性**:
- ✅ 线索创建、编辑、删除
- ✅ 线索状态管理（新线索、已联系、已验证、洽谈中、已转化、已丢失）
- ✅ 优先级管理（低、中、高、紧急）
- ✅ 线索来源追踪（官网、推荐、陌拜、展会、社交媒体等）
- ✅ 线索评分系统（0-100分）
- ✅ 线索分配功能
- ✅ 批量分配线索
- ✅ 线索转化为正式客户
- ✅ 线索统计分析（总数、转化率、按状态/来源统计）
- ✅ 标签关联

**数据库表**: `customer_leads`

**API接口**:
```
GET    /api/leads              - 获取线索列表
POST   /api/leads              - 创建线索
GET    /api/leads/:id          - 获取线索详情
PUT    /api/leads/:id          - 更新线索
DELETE /api/leads/:id          - 删除线索
POST   /api/leads/:id/assign   - 分配线索
POST   /api/leads/:id/convert  - 转化线索为客户
POST   /api/leads/batch-assign - 批量分配
POST   /api/leads/batch-update-status - 批量更新状态
GET    /api/leads/statistics   - 获取统计数据
```

### 2. 客户公海池 (Customer Pool)

**功能描述**: 管理未分配或退回的客户资源，实现客户资源的高效流转。

**主要特性**:
- ✅ 客户进入公海池（未分配、长期未跟进、主动退回、转移）
- ✅ 客户领取功能
- ✅ 批量领取客户
- ✅ 优先级管理（0-10级）
- ✅ 客户状态管理（可领取、已领取、已锁定）
- ✅ 在池天数统计
- ✅ 高优先级客户标识
- ✅ 公海池统计（可领取数、已领取数、高优先级数）
- ✅ 按优先级或时间排序

**数据库表**: `customer_pool`

**API接口**:
```
GET    /api/customer-pool              - 获取公海池列表
POST   /api/customer-pool/add          - 添加客户到公海池
POST   /api/customer-pool/:id/claim    - 领取客户
POST   /api/customer-pool/batch-claim  - 批量领取
PUT    /api/customer-pool/:id/priority - 更新优先级
GET    /api/customer-pool/statistics   - 获取统计数据
```

### 3. 客户标签系统 (Customer Tags)

**功能描述**: 为客户和线索添加标签，实现灵活的分类和筛选。

**主要特性**:
- ✅ 标签创建、编辑、删除
- ✅ 标签分类（行业、规模、状态、行为、自定义）
- ✅ 标签颜色自定义
- ✅ 系统标签保护
- ✅ 为客户添加/移除标签
- ✅ 批量添加标签
- ✅ 按标签搜索客户
- ✅ 标签统计（使用次数）
- ✅ 标签排序

**数据库表**: `customer_tags`, `client_tag_relations`, `lead_tag_relations`

**API接口**:
```
GET    /api/customer-tags                - 获取标签列表
POST   /api/customer-tags                - 创建标签
PUT    /api/customer-tags/:id            - 更新标签
DELETE /api/customer-tags/:id            - 删除标签
POST   /api/customer-tags/client-tags    - 为客户添加标签
DELETE /api/customer-tags/client-tags    - 移除客户标签
POST   /api/customer-tags/batch-add      - 批量添加标签
GET    /api/customer-tags/clients/:id    - 获取客户标签
GET    /api/customer-tags/statistics     - 标签统计
GET    /api/customer-tags/search-clients - 按标签搜索客户
```

---

## 📊 数据库设计

### 1. customer_leads (客户线索表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| company_name | VARCHAR(200) | 公司名称 |
| contact_person | VARCHAR(100) | 联系人 |
| phone | VARCHAR(20) | 电话 |
| email | VARCHAR(100) | 邮箱 |
| wechat | VARCHAR(100) | 微信号 |
| source | ENUM | 来源 |
| source_detail | VARCHAR(200) | 来源详情 |
| industry_id | INTEGER | 行业ID |
| company_scale | ENUM | 公司规模 |
| estimated_value | DECIMAL(15,2) | 预估价值 |
| priority | ENUM | 优先级 |
| status | ENUM | 状态 |
| assigned_to | INTEGER | 负责人ID |
| assigned_at | TIMESTAMP | 分配时间 |
| converted_client_id | INTEGER | 转化后的客户ID |
| converted_at | TIMESTAMP | 转化时间 |
| lost_reason | TEXT | 丢失原因 |
| notes | TEXT | 备注 |
| score | INTEGER | 评分(0-100) |
| created_by | INTEGER | 创建人ID |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 2. customer_pool (客户公海池表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| client_id | INTEGER | 客户ID |
| entered_at | TIMESTAMP | 进入时间 |
| entered_reason | ENUM | 进入原因 |
| previous_owner_id | INTEGER | 之前负责人ID |
| claimed_by | INTEGER | 领取人ID |
| claimed_at | TIMESTAMP | 领取时间 |
| status | ENUM | 状态 |
| priority | INTEGER | 优先级(0-10) |
| notes | TEXT | 备注 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 3. customer_tags (客户标签表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| name | VARCHAR(50) | 标签名称 |
| color | VARCHAR(20) | 标签颜色 |
| category | ENUM | 标签分类 |
| description | VARCHAR(200) | 描述 |
| is_system | BOOLEAN | 是否系统标签 |
| sort_order | INTEGER | 排序 |
| created_by | INTEGER | 创建人ID |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 4. client_tag_relations (客户标签关系表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| client_id | INTEGER | 客户ID |
| tag_id | INTEGER | 标签ID |
| created_by | INTEGER | 创建人ID |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

### 5. lead_tag_relations (线索标签关系表)

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| lead_id | INTEGER | 线索ID |
| tag_id | INTEGER | 标签ID |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

---

## 🗂️ 文件结构

```
tax-crm-system/
├── models/
│   ├── CustomerLead.js           # 客户线索模型
│   ├── CustomerPool.js           # 客户公海池模型
│   ├── CustomerTag.js            # 客户标签模型
│   └── ClientTagRelation.js      # 客户标签关系模型
├── controllers/
│   ├── customerLeadController.js # 线索控制器
│   ├── customerPoolController.js # 公海池控制器
│   └── customerTagController.js  # 标签控制器
├── routes/
│   ├── customerLeads.js          # 线索路由
│   ├── customerPool.js           # 公海池路由
│   └── customerTags.js           # 标签路由
├── migrations/
│   └── 20260218154528-create-customer-expansion-tables.js
└── client/src/
    └── pages/
        ├── CustomerLeads.jsx     # 客户线索页面
        ├── CustomerLeads.css
        ├── CustomerPool.jsx      # 客户公海池页面
        └── CustomerPool.css
```

---

## 🚀 安装与部署

### 1. 运行数据库迁移

```bash
cd d:/tax-crm-system
npx sequelize-cli db:migrate
```

### 2. 重启后端服务器

```bash
npm start
```

### 3. 前端无需额外操作

路由和导航已自动配置完成。

---

## 📱 前端页面

### 1. 客户线索页面 (`/leads`)

**功能**:
- 线索列表展示（表格形式）
- 统计卡片（总线索数、已转化、转化率、待跟进）
- 搜索和筛选（状态、优先级、来源）
- 新增线索（模态框）
- 编辑线索
- 转化为客户
- 批量分配
- 多选操作

**权限**: admin, manager, sales

### 2. 客户公海池页面 (`/customer-pool`)

**功能**:
- 公海池客户列表
- 统计卡片（可领取、已领取、已锁定、高优先级）
- 优先级显示（火焰图标）
- 在池天数标识
- 领取客户按钮
- 批量领取
- 优先级调整（下拉选择）
- 搜索和筛选

**权限**: admin, manager, sales

---

## 🎨 UI设计特点

### 颜色方案

**线索状态**:
- 新线索: 蓝色 (#1890ff)
- 已联系: 青色 (#13c2c2)
- 已验证: 绿色 (#52c41a)
- 洽谈中: 橙色 (#fa8c16)
- 已转化: 成功绿 (#52c41a)
- 已丢失: 灰色 (#d9d9d9)

**优先级**:
- 低: 灰色
- 中: 蓝色
- 高: 橙色
- 紧急: 红色

**公海池优先级**:
- 高优先级(≥5): 火焰图标 🔥 红色
- 中优先级(3-4): 星星图标 ⭐ 橙色
- 低优先级(<3): 星星图标 ⭐ 灰色

### 动画效果

- 领取按钮脉冲动画
- 菜单展开/收起动画
- 表格加载动画

---

## 🔧 技术实现

### 后端技术栈

- **框架**: Express.js
- **ORM**: Sequelize
- **数据库**: PostgreSQL
- **认证**: JWT

### 前端技术栈

- **框架**: React 18
- **UI库**: Ant Design 5
- **路由**: React Router v6
- **HTTP客户端**: Axios
- **图标**: Ant Design Icons

### 关键技术点

1. **Sequelize关联**:
   - belongsTo: 线索→用户、线索→行业
   - belongsToMany: 客户↔标签（多对多）
   - hasMany: 客户→公海池记录

2. **批量操作**:
   - 使用 `bulkCreate` 提升性能
   - 事务处理保证数据一致性

3. **状态管理**:
   - React Hooks (useState, useEffect)
   - 本地状态管理

4. **权限控制**:
   - 路由级权限验证
   - API级权限验证

---

## 📈 业务流程

### 线索转化流程

```
新线索 → 已联系 → 已验证 → 洽谈中 → 已转化(成为客户)
                                    ↓
                                  已丢失
```

### 公海池流程

```
客户 → 进入公海池(未分配/长期未跟进/退回) → 销售领取 → 分配成功
```

### 标签使用流程

```
创建标签 → 为客户/线索添加标签 → 按标签筛选 → 批量操作
```

---

## 🔍 使用示例

### 1. 创建线索

```javascript
POST /api/leads
{
  "companyName": "测试公司",
  "contactPerson": "张三",
  "phone": "13800138000",
  "email": "test@example.com",
  "source": "website",
  "priority": "high",
  "notes": "来自官网咨询"
}
```

### 2. 转化线索为客户

```javascript
POST /api/leads/1/convert
// 自动创建客户记录，复制线索信息和标签
```

### 3. 领取公海池客户

```javascript
POST /api/customer-pool/1/claim
// 自动创建分配记录，更新公海池状态
```

### 4. 批量添加标签

```javascript
POST /api/customer-tags/batch-add
{
  "clientIds": [1, 2, 3],
  "tagIds": [10, 11]
}
```

---

## 📊 统计指标

### 线索统计

- 总线索数
- 已转化数
- 转化率 = (已转化数 / 总线索数) × 100%
- 按状态分布
- 按优先级分布
- 按来源分布

### 公海池统计

- 可领取客户数
- 已领取客户数
- 已锁定客户数
- 高优先级客户数
- 按进入原因分布

### 标签统计

- 标签总数
- 每个标签的使用次数
- 最常用标签排行

---

## 🐛 已知问题

暂无

---

## 🔮 未来规划

### Phase 5: 高级功能

1. **线索评分算法**
   - 基于行为的自动评分
   - 机器学习预测转化率

2. **智能分配**
   - 根据销售人员负载自动分配
   - 根据地域/行业匹配

3. **公海池规则引擎**
   - 自动回收长期未跟进客户
   - 自动调整优先级

4. **标签推荐**
   - 基于客户特征自动推荐标签
   - 标签关联分析

5. **线索去重**
   - 自动检测重复线索
   - 合并重复记录

---

## 📞 技术支持

如有问题，请联系开发团队。

---

**文档版本**: v1.0  
**最后更新**: 2026年2月18日  
**维护者**: 开发团队











