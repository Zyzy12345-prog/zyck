# 线索跟进记录系统 - 部署指南

## 📋 部署步骤

### 1. 数据库迁移

运行SQL脚本创建 `lead_follow_ups` 表：

```bash
# 方式1：使用psql命令
psql -U postgres -d tax_crm -f migrations/create_lead_follow_ups_table.sql

# 方式2：在PostgreSQL客户端中执行
# 打开 migrations/create_lead_follow_ups_table.sql 文件
# 复制内容并在数据库客户端中执行
```

### 2. 重启后端服务

```bash
# 进入项目根目录
cd d:/tax-crm-system

# 重启服务
npm start
```

### 3. 刷新前端

```bash
# 如果前端正在运行，直接刷新浏览器即可
# 如果需要重启前端：
cd client
npm run dev
```

---

## ✅ 验证部署

### 1. 检查数据库表

```sql
-- 检查表是否创建成功
SELECT * FROM information_schema.tables 
WHERE table_name = 'lead_follow_ups';

-- 检查表结构
\d lead_follow_ups

-- 检查索引
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'lead_follow_ups';
```

### 2. 测试API接口

使用Postman或curl测试：

```bash
# 获取线索的跟进记录（需要先有线索数据）
curl -X GET http://localhost:3000/api/leads/1/follow-ups \
  -H "Authorization: Bearer YOUR_TOKEN"

# 创建跟进记录
curl -X POST http://localhost:3000/api/leads/1/follow-ups \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "followUpType": "phone",
    "followUpDate": "2026-02-19T10:00:00Z",
    "content": "首次电话沟通，客户表示有兴趣",
    "result": "positive"
  }'
```

### 3. 测试前端功能

1. 登录系统
2. 进入"客户线索"页面
3. 点击任意线索的"跟进"按钮
4. 应该能看到跟进记录模态框
5. 尝试创建一条跟进记录
6. 检查是否能正常保存和显示

---

## 🔧 故障排除

### 问题1：数据库表创建失败

**可能原因**:
- PostgreSQL服务未启动
- 数据库不存在
- 权限不足

**解决方案**:
```bash
# 检查PostgreSQL服务状态
pg_ctl status

# 启动PostgreSQL服务
pg_ctl start

# 检查数据库是否存在
psql -U postgres -l | grep tax_crm

# 如果不存在，创建数据库
psql -U postgres -c "CREATE DATABASE tax_crm;"
```

### 问题2：API返回404

**可能原因**:
- 路由未正确注册
- 后端服务未重启

**解决方案**:
```bash
# 检查app.js中是否添加了路由
grep "leadFollowUpRoutes" app.js

# 重启后端服务
npm start
```

### 问题3：前端组件未显示

**可能原因**:
- 组件导入路径错误
- 前端未刷新

**解决方案**:
```bash
# 检查导入路径
# 确保 LeadFollowUp.jsx 在 client/src/components/ 目录下

# 清除缓存并重启
cd client
rm -rf node_modules/.vite
npm run dev
```

### 问题4：跟进记录创建失败

**可能原因**:
- 线索不存在
- 必填字段缺失
- 权限不足

**解决方案**:
- 检查线索ID是否正确
- 确保填写了所有必填字段
- 检查用户是否已登录

---

## 📊 数据初始化（可选）

如果需要测试数据，可以运行以下SQL：

```sql
-- 插入测试跟进记录
INSERT INTO lead_follow_ups (
  lead_id, 
  follow_up_type, 
  follow_up_date,
  content, 
  result, 
  created_by
) VALUES 
  (1, 'phone', NOW(), '首次电话沟通，客户表示有兴趣', 'positive', 1),
  (1, 'email', NOW() - INTERVAL '1 day', '发送产品资料', 'neutral', 1),
  (2, 'visit', NOW() - INTERVAL '2 days', '上门拜访，详细介绍产品', 'positive', 1),
  (2, 'phone', NOW() - INTERVAL '3 days', '电话跟进，客户考虑中', 'neutral', 1);
```

---

## 🎯 功能测试清单

### 基础功能
- [ ] 查看跟进记录列表
- [ ] 创建新跟进记录
- [ ] 编辑跟进记录
- [ ] 删除跟进记录
- [ ] 查看跟进统计

### 筛选功能
- [ ] 按跟进方式筛选
- [ ] 按跟进结果筛选
- [ ] 分页功能

### 权限测试
- [ ] 普通用户只能编辑自己的记录
- [ ] 管理员可以编辑所有记录
- [ ] 删除权限正确

### 数据验证
- [ ] 必填字段验证
- [ ] 日期格式验证
- [ ] 枚举值验证

---

## 📈 性能优化建议

### 数据库优化
```sql
-- 如果数据量大，可以添加更多索引
CREATE INDEX idx_lead_follow_ups_composite 
ON lead_follow_ups(lead_id, follow_up_date DESC);

-- 定期清理旧数据（可选）
DELETE FROM lead_follow_ups 
WHERE created_at < NOW() - INTERVAL '2 years';
```

### 前端优化
- 使用虚拟滚动处理大量数据
- 实现懒加载
- 添加缓存机制

---

## 🔐 安全建议

### 1. 数据权限
- 确保用户只能访问自己负责的线索的跟进记录
- 管理员权限严格控制

### 2. 输入验证
- 后端验证所有输入数据
- 防止SQL注入
- 防止XSS攻击

### 3. 敏感信息
- 跟进内容可能包含敏感信息
- 考虑加密存储
- 严格控制访问权限

---

## 📞 技术支持

如遇到问题：
1. 查看后端日志
2. 查看浏览器控制台
3. 检查数据库日志
4. 联系开发团队

---

**部署日期**: 2026年2月19日  
**版本**: v1.0










