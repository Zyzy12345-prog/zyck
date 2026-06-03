# 更新日志 (CHANGELOG)

本文档记录税务CRM系统的所有重要更新和变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.1.0] - 2026-02-19

### 新增 ✨

#### 客户拓展模块
- **客户线索管理系统**
  - 线索列表展示（分页、搜索、筛选）
  - 新增/编辑/删除线索
  - 线索分配（单个/批量）
  - 线索状态更新（批量）
  - 线索转化为客户
  - 线索统计数据展示
  - 支持按状态、优先级、来源筛选

- **客户公海池**
  - 公海池客户列表
  - 客户认领（单个/批量）
  - 添加客户到公海池
  - 优先级调整
  - 公海池统计数据
  - 按优先级排序

- **转化漏斗可视化**
  - ECharts转化漏斗图
  - 转化趋势折线图
  - 各阶段详情统计
  - 优先级分布展示
  - 日期范围筛选
  - 数据刷新功能

#### 数据模型
- 新增 `CustomerLead` 模型（客户线索）
- 新增 `CustomerPool` 模型（客户公海池）
- 新增数据库表 `customer_leads`
- 新增数据库表 `customer_pool`

#### API接口
- `GET /api/leads` - 获取线索列表
- `POST /api/leads` - 创建线索
- `GET /api/leads/:id` - 获取线索详情
- `PUT /api/leads/:id` - 更新线索
- `DELETE /api/leads/:id` - 删除线索
- `POST /api/leads/:id/assign` - 分配线索
- `POST /api/leads/:id/convert` - 转化线索
- `POST /api/leads/batch-assign` - 批量分配
- `POST /api/leads/batch-update-status` - 批量更新状态
- `GET /api/leads/statistics` - 获取统计数据
- `GET /api/customer-pool` - 获取公海池列表
- `POST /api/customer-pool/add` - 添加到公海池
- `POST /api/customer-pool/:id/claim` - 认领客户
- `POST /api/customer-pool/batch-claim` - 批量认领
- `PUT /api/customer-pool/:id/priority` - 更新优先级
- `GET /api/customer-pool/statistics` - 获取统计数据

#### 前端页面
- 新增 `CustomerLeads.jsx` - 客户线索管理页面
- 新增 `CustomerPool.jsx` - 客户公海池页面
- 新增 `ConversionFunnel.jsx` - 转化漏斗页面

#### 导航菜单
- 侧边栏新增"客户线索"菜单项
- 侧边栏新增"客户公海池"菜单项
- 侧边栏新增"转化漏斗"菜单项
- 新菜单标记"NEW"徽章

#### 文档
- 新增 `CUSTOMER_EXPANSION_PROGRESS.md` - 开发进度文档
- 新增 `CUSTOMER_EXPANSION_QUICK_START.md` - 快速开始指南
- 新增 `CUSTOMER_EXPANSION_COMPLETION_REPORT.md` - 完成报告
- 更新 `README.md` - 添加客户拓展模块说明

### 修复 🐛

- 修复 `/api/leads` 接口500错误
  - 移除不存在的 `CustomerTag` 关联
  - 所有关联设置为 `required: false`
  
- 修复 `/api/customer-pool` 接口500错误
  - 移除嵌套的 `User` 关联
  - 简化查询逻辑

- 修复 Sequelize 关联配置错误
  - 优化模型关联定义
  - 避免循环依赖

### 优化 ⚡

- 优化线索列表查询性能
- 优化公海池数据加载速度
- 改进前端组件渲染效率
- 统一错误处理机制

### 文档 📚

- 完善API文档
- 添加使用指南
- 更新开发路线图
- 编写快速开始教程

---

## [1.0.0] - 2026-02-18

### 新增 ✨

#### Phase 3: 数据分析模块
- **销售分析**
  - 销售趋势图（折线图）
  - 客户来源分布（饼图）
  - 销售人员排行（柱状图）
  - 关键指标统计
  - 数据导出（CSV/Excel）

- **客户分析**
  - 客户等级分布（饼图）
  - 客户来源分布（饼图）
  - 客户增长趋势（折线图）
  - 数据筛选与导出

- **跟进分析**
  - 跟进方式分布（饼图）
  - 跟进结果分布（饼图）
  - 跟进趋势（折线图）
  - 销售人员跟进排行（柱状图）

- **外呼分析**
  - 外呼趋势（折线图）
  - 外呼结果分布（饼图）
  - 接通率仪表盘（仪表图）
  - 通话时长统计

#### 分析工具
- 日期范围筛选
- 用户筛选
- 数据刷新
- 统一错误处理
- 加载状态组件

### 修复 🐛

- 修复外呼记录搜索功能
  - 空搜索参数导致SQL错误
  - 添加搜索内容验证

- 修复Dashboard外呼API错误
  - 字段映射问题
  - 从 `callTime` 改为正确的数据库字段

- 修复客户分析显示问题
  - Space组件未定义错误
  - 导入缺失的Ant Design组件

### 优化 ⚡

- 优化数据查询性能
- 改进图表渲染速度
- 统一API响应格式
- 完善错误提示信息

---

## [0.2.0] - 2026-02-15

### 新增 ✨

#### Phase 2: 业务核心功能
- **销售漏斗**
  - 商机管理
  - 阶段流转
  - 赢单/输单分析
  - 销售预测

- **客户标签系统**
  - 标签分类管理
  - 客户打标签
  - 按标签筛选
  - 标签统计

- **客户分级**
  - 智能评分算法
  - 价值分析
  - 高价值客户识别
  - 流失预警

#### 跟进记录管理
- 创建/编辑/删除跟进记录
- 跟进方式（电话/邮件/拜访/微信）
- 跟进结果追踪
- 下次跟进提醒

#### 外呼记录管理
- 通话记录CRUD
- 通话时长统计
- 通话状态追踪
- 电话号码管理

#### 客户详情增强
- 跟进记录时间线
- 外呼记录列表
- 客户状态流转

### 优化 ⚡

- 优化客户列表加载速度
- 改进搜索功能
- 完善表单验证
- 统一UI风格

---

## [0.1.0] - 2026-02-10

### 新增 ✨

#### Phase 1: 核心基础功能
- **用户认证系统**
  - 用户注册
  - 用户登录
  - JWT身份验证
  - 密码加密（Bcrypt）

- **权限管理**
  - 基于角色的访问控制（RBAC）
  - 四种角色：admin/manager/sales/operator
  - 路由权限保护

- **客户信息管理**
  - 客户CRUD操作
  - 客户列表与搜索
  - 客户详情页面
  - 客户分配功能

- **基础布局**
  - 侧边栏导航
  - 顶部导航栏
  - 响应式设计
  - 深色主题

#### 数据模型
- User（用户）
- Client（客户）
- CallRecord（外呼记录）
- Assignment（分配关系）
- Role（角色）

#### 技术栈
- 后端：Node.js + Express + PostgreSQL + Sequelize
- 前端：React 18 + Vite + React Router
- UI：自定义CSS + Lucide图标

### 安全 🔒

- JWT令牌认证
- 密码加密存储
- SQL注入防护
- XSS防护
- CORS配置

---

## 版本说明

### 版本号规则
- **主版本号（Major）**: 重大功能更新或不兼容的API变更
- **次版本号（Minor）**: 新增功能，向下兼容
- **修订号（Patch）**: Bug修复和小优化

### 更新类型
- ✨ **新增**: 新功能
- 🐛 **修复**: Bug修复
- ⚡ **优化**: 性能优化
- 📚 **文档**: 文档更新
- 🔒 **安全**: 安全相关
- 💄 **样式**: UI/样式更新
- ♻️ **重构**: 代码重构
- 🗑️ **移除**: 移除功能

---

## 即将发布

### [1.2.0] - 计划中

#### 客户拓展模块增强
- [ ] 线索标签系统
- [ ] 线索跟进记录
- [ ] 线索评分算法优化
- [ ] 公海池自动回收规则
- [ ] 线索导入导出
- [ ] 重复检测功能

#### 系统优化
- [ ] 数据库索引优化
- [ ] Redis缓存实现
- [ ] API响应压缩
- [ ] 前端性能优化

#### 用户体验
- [ ] 操作引导
- [ ] 快捷键支持
- [ ] 批量操作增强
- [ ] 移动端优化

---

## 贡献指南

如果你想为项目做出贡献，请：

1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

---

## 联系方式

- 项目主页: [GitHub Repository]
- 问题反馈: [GitHub Issues]
- 邮箱: dev@example.com

---

**感谢使用税务CRM系统！** 🎉










