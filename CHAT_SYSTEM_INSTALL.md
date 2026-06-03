# 在线聊天系统安装说明

## 后端依赖安装

```bash
# 安装 Socket.io
npm install socket.io

# 如果还没安装 multer（文件上传）
npm install multer
```

## 前端依赖安装

```bash
cd client

# 安装 Socket.io 客户端
npm install socket.io-client
```

## 数据库迁移

```bash
# 运行聊天系统数据库迁移
psql -U postgres -d tax_crm -f migrations/create_chat_system.sql
```

## 启动服务

```bash
# 后端
npm start

# 前端（新终端）
cd client
npm run dev
```

## 测试聊天功能

1. 登录系统
2. 进入任意客户详情页
3. 点击右上角"在线聊天"按钮
4. 开始实时聊天！

## 功能特性

✅ 实时消息推送（WebSocket）
✅ 消息自动保存到数据库
✅ 支持文本、图片、文件发送
✅ 正在输入提示
✅ 消息已读状态
✅ 聊天历史记录
✅ 在线状态显示
✅ 多人聊天支持
✅ 消息时间戳
✅ 响应式设计








