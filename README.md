# 财税CRM系统

一个现代化的客户关系管理系统，专为财税服务行业设计。

## ✨ 特性

- 🎨 **现代化UI设计** - 深色主题，赛博朋克风格，流畅动画
- 📊 **数据可视化** - 实时统计图表和数据分析
- 👥 **客户管理** - 完整的客户信息管理系统
- 📞 **外呼记录** - 通话记录追踪和统计
- 🎯 **客户拓展** - 线索管理、公海池、转化漏斗（NEW）
- 🏷️ **标签系统** - 客户标签分类和智能筛选
- 📈 **销售漏斗** - 商机管理和阶段追踪
- 🎓 **客户分级** - 智能评分和价值分析
- 👤 **员工管理** - 用户和权限管理
- 🔐 **权限控制** - 基于角色的访问控制（RBAC）
- 📱 **响应式设计** - 完美适配各种设备

## 🛠️ 技术栈

### 后端
- **Node.js** - JavaScript运行环境
- **Express** - Web应用框架
- **PostgreSQL** - 关系型数据库
- **Sequelize** - ORM框架
- **JWT** - 身份认证
- **Bcrypt** - 密码加密

### 前端
- **React 18** - UI框架
- **Vite** - 构建工具
- **React Router** - 路由管理
- **Axios** - HTTP客户端
- **Recharts** - 图表库
- **Lucide React** - 图标库

## 📦 安装

### 1. 克隆项目
```bash
git clone <repository-url>
cd tax-crm-system
```

### 2. 安装后端依赖
```bash
npm install
```

### 3. 安装前端依赖
```bash
cd client
npm install
cd ..
```

### 4. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tax_crm
DB_USER=postgres
DB_PASSWORD=your_password

# JWT配置
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d

# 服务器配置
PORT=3000
NODE_ENV=development
```

### 5. 创建数据库
```bash
psql -U postgres -c "CREATE DATABASE tax_crm;"
```

### 6. 运行数据库迁移
```bash
npm run db:migrate
```

## 🚀 启动

### 开发模式

**启动后端服务器：**
```bash
npm run dev
```
后端将在 http://localhost:3000 运行

**启动前端应用（新终端）：**
```bash
cd client
npm run dev
```
前端将在 http://localhost:5173 运行

### 生产模式

**构建前端：**
```bash
cd client
npm run build
```

**启动后端：**
```bash
npm start
```

## 📖 使用指南

### 首次使用

1. 访问 http://localhost:5173
2. 点击"立即注册"创建账户
3. 选择合适的角色（建议首次使用选择"管理员"）
4. 登录系统开始使用

### 角色权限

- **管理员（admin）** - 完全访问权限，可管理所有模块
- **经理（manager）** - 可管理客户、员工和查看所有数据
- **销售（sales）** - 可管理客户和创建外呼记录
- **操作员（operator）** - 只能创建和查看自己的外呼记录

### 主要功能

#### 仪表板
- 查看关键业务指标
- 数据可视化图表
- 最近外呼记录
- 业务趋势分析

#### 客户管理
- 添加、编辑、删除客户
- 搜索和筛选客户
- 查看客户详情
- 客户分配管理
- Excel批量导入

#### 客户拓展（NEW）
- **客户线索管理**
  - 线索全生命周期管理
  - 线索分配和转化
  - 批量操作支持
  - 线索评分系统
- **客户公海池**
  - 共享客户资源
  - 智能认领机制
  - 优先级管理
  - 自动回收规则
- **转化漏斗**
  - 可视化转化流程
  - 转化率分析
  - 趋势图表
  - 数据导出

#### 销售漏斗
- 商机管理
- 阶段流转
- 赢单/输单分析
- 销售预测

#### 客户分级
- 智能评分算法
- 价值分析
- 高价值客户识别
- 流失预警

#### 外呼记录
- 记录通话信息
- 查看通话历史
- 统计分析
- 录音管理

#### 数据分析
- 销售数据分析
- 客户分析
- 跟进效率分析
- 外呼数据分析

#### 员工管理
- 用户账户管理
- 角色权限分配
- 员工业绩查看

## 📁 项目结构

```
tax-crm-system/
├── client/                    # 前端应用
│   ├── src/
│   │   ├── components/       # React组件
│   │   │   ├── Layout.jsx    # 主布局
│   │   │   └── PrivateRoute.jsx  # 路由守卫
│   │   ├── pages/            # 页面组件
│   │   │   ├── Login.jsx     # 登录页
│   │   │   ├── Register.jsx  # 注册页
│   │   │   ├── Dashboard.jsx # 仪表板
│   │   │   └── Clients.jsx   # 客户管理
│   │   ├── contexts/         # React Context
│   │   │   └── AuthContext.jsx  # 认证上下文
│   │   ├── services/         # API服务
│   │   │   └── api.js        # API封装
│   │   ├── utils/            # 工具函数
│   │   │   └── helpers.js    # 辅助函数
│   │   ├── App.jsx           # 主应用
│   │   ├── main.jsx          # 入口文件
│   │   └── index.css         # 全局样式
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── config/                   # 配置文件
│   └── database.js          # 数据库配置
├── controllers/             # 控制器
│   ├── authController.js
│   ├── clientController.js
│   ├── callRecordController.js
│   └── userController.js
├── middleware/              # 中间件
│   ├── auth.js             # 认证中间件
│   ├── errorHandler.js     # 错误处理
│   └── validator.js        # 数据验证
├── models/                  # 数据模型
│   ├── User.js
│   ├── Client.js
│   ├── CallRecord.js
│   ├── Assignment.js
│   └── Role.js
├── routes/                  # 路由
│   ├── auth.js
│   ├── clients.js
│   ├── calls.js
│   └── users.js
├── migrations/              # 数据库迁移
├── scripts/                 # 脚本
├── uploads/                 # 上传文件
├── app.js                   # Express应用
├── server.js                # 服务器入口
├── package.json
└── README.md
```

## 🎨 设计特色

### 视觉风格
- **配色方案**: 深色背景 + 青蓝渐变色
- **字体**: Outfit（界面）+ JetBrains Mono（代码）
- **动画**: 流畅的过渡和微交互
- **图标**: Lucide React 现代图标集

### UI组件
- 渐变色按钮和卡片
- 悬浮效果和阴影
- 响应式表格和表单
- 自定义滚动条
- 加载动画和骨架屏

## 🔧 开发

### 可用脚本

**后端：**
```bash
npm run dev          # 开发模式（nodemon）
npm start            # 生产模式
npm run db:migrate   # 运行迁移
npm run db:seed      # 填充数据
npm run check        # 环境检查
npm run init         # 初始化项目
```

**前端：**
```bash
npm run dev          # 开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览构建结果
```

### API文档

详细的API文档请参考 [API.md](./API.md)

主要端点：
- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册
- `GET /api/clients` - 获取客户列表
- `POST /api/clients` - 创建客户
- `GET /api/calls` - 获取外呼记录
- `GET /api/users` - 获取用户列表

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查PostgreSQL服务状态
   - 验证.env配置
   - 确认数据库已创建

2. **前端无法连接后端**
   - 确保后端服务运行在3000端口
   - 检查CORS配置
   - 查看浏览器控制台错误

3. **依赖安装失败**
   - 清除缓存：`npm cache clean --force`
   - 删除node_modules重新安装
   - 使用国内镜像源

详细故障排除指南请参考 [故障排除.md](./故障排除.md)

## 📝 待办事项

### Phase 4: 客户拓展模块
- [x] 客户线索管理
- [x] 客户公海池
- [x] 转化漏斗可视化
- [ ] 线索标签系统
- [ ] 线索跟进记录
- [ ] 线索评分优化
- [ ] 公海池自动回收规则
- [ ] 线索导入导出
- [ ] 重复检测

### 其他待办
- [ ] 完善外呼记录管理页面
- [ ] 完善员工管理页面
- [ ] 添加客户详情页面
- [ ] 实现Excel导入导出
- [ ] 添加数据统计报表
- [ ] 实现实时通知
- [ ] 添加用户设置页面
- [ ] 移动端优化
- [ ] 单元测试
- [ ] E2E测试

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

ISC

## 👨‍💻 作者

财税CRM系统开发团队

---

**如有问题，请查看文档或提交Issue** 🚀
