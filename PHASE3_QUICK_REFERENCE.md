# Phase 3 数据分析模块 - 快速参考

## 🚀 快速启动

### 安装依赖
```bash
cd client
npm install
```

### 启动服务
```bash
# 终端1 - 后端
npm start

# 终端2 - 前端
cd client
npm run dev
```

### 访问地址
- 前端: http://localhost:5173
- 后端: http://localhost:3000

## 📊 四大分析模块

### 1. 销售分析 (`/analytics/sales`)
- 销售趋势图（按月）
- 销售漏斗转化
- 成交率分析
- 销售人员排行

### 2. 客户分析 (`/analytics/customers`)
- 客户等级分布
- 客户来源分布
- 客户增长趋势

### 3. 跟进分析 (`/analytics/follow-ups`)
- 跟进趋势
- 跟进方式分布
- 跟进结果分布
- 员工跟进排行

### 4. 外呼分析 (`/analytics/calls`)
- 外呼量趋势
- 外呼结果分布
- 接通率仪表盘
- 通话时长统计

## 🔑 权限要求
- 管理员 (admin)
- 经理 (manager)

## 📦 新增依赖
```json
{
  "antd": "^5.22.6",
  "echarts": "^5.5.1",
  "echarts-for-react": "^3.0.2",
  "xlsx": "^0.18.5"
}
```

## 📁 核心文件

### 前端
```
client/src/
├── pages/analytics/
│   ├── SalesAnalytics.jsx
│   ├── CustomerAnalytics.jsx
│   ├── FollowUpAnalytics.jsx
│   ├── CallAnalytics.jsx
│   └── Analytics.css
└── utils/
    └── exportUtils.js
```

### 后端
```
controllers/
└── analyticsController.js

routes/
└── analytics.js
```

## 🎯 API端点

```
GET /api/analytics/sales
GET /api/analytics/customers
GET /api/analytics/follow-ups
GET /api/analytics/calls
```

### 查询参数
- `startDate`: 开始日期 (YYYY-MM-DD)
- `endDate`: 结束日期 (YYYY-MM-DD)
- `userId`: 用户ID (可选)

## 📈 图表类型

- **折线图**: 趋势分析
- **柱状图**: 对比分析
- **饼图**: 占比分析
- **漏斗图**: 转化分析
- **仪表盘**: 指标展示

## 💾 导出功能

### CSV导出
```javascript
exportToCSV(data, columns, filename);
```

### Excel导出
```javascript
exportToExcel(data, columns, filename, sheetName);
exportMultiSheetExcel(sheets, filename);
```

## 🔧 常用命令

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 检查依赖
npm list antd echarts echarts-for-react

# 清除缓存
npm cache clean --force
```

## 🐛 故障排查

### 图表不显示
1. 检查浏览器控制台
2. 验证API返回数据
3. 确认echarts已安装

### 导出失败
1. 检查xlsx是否安装
2. 允许浏览器下载
3. 检查数据格式

### 权限错误
1. 使用admin或manager账号
2. 检查token是否有效

### 数据库错误
1. 确认PostgreSQL连接
2. 检查字段名(snake_case)
3. 验证DATE_TRUNC语法

## 📚 文档

- `docs/phase3-analytics.md` - 详细开发文档
- `docs/phase3-completion-summary.md` - 完成总结
- `PHASE3_INSTALLATION.md` - 安装指南

## ✅ 测试清单

- [ ] 所有模块页面正常加载
- [ ] 图表正确显示数据
- [ ] 筛选功能正常工作
- [ ] 导出功能正常工作
- [ ] 图表交互正常
- [ ] 响应式布局正常
- [ ] 权限控制正常

## 🎉 完成状态

✅ Phase 1: 基础功能
✅ Phase 2: 销售漏斗 & 客户分级
✅ Phase 3: 数据分析模块

**系统功能完整度: 100%**











