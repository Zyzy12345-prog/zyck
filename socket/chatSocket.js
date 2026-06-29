const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const { ChatRoom, ChatMessage, ChatParticipant, User, Employee } = require('../models');

let io;

// 初始化 Socket.io
const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket.io 认证中间件
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('认证失败：缺少token'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const userId = decoded.userId || decoded.employeeId || decoded.id;

      // 尝试从 User 表查找
      let user = await User.findByPk(userId, {
        attributes: ['id', 'username', 'email', 'role']
      }).catch(() => null);

      // 如果 User 表中没有，尝试从 Employee 表查找
      if (!user) {
        const employee = await Employee.findByPk(userId, {
          attributes: ['id', 'name', 'email', 'position']
        }).catch(() => null);
        
        if (employee) {
          // 将 Employee 转换为 User 格式
          user = {
            id: employee.id,
            username: employee.name,
            email: employee.email,
            role: employee.position || 'employee'
          };
        }
      }

      if (!user) {
        console.error('认证失败：用户ID', decoded.id, '不存在');
        return next(new Error('认证失败：用户不存在'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket认证错误:', error.message);
      next(new Error('认证失败：' + error.message));
    }
  });

  // 连接处理
  io.on('connection', (socket) => {
    console.log(`用户连接: ${socket.user.username} (${socket.user.id})`);

    // 加入聊天室
    socket.on('join_room', async (roomId) => {
      try {
        // 验证用户是否在聊天室中
        const participant = await ChatParticipant.findOne({
          where: { roomId, userId: socket.user.id }
        });

        if (!participant) {
          socket.emit('error', { message: '您不在此聊天室中' });
          return;
        }

        socket.join(`room_${roomId}`);
        console.log(`用户 ${socket.user.username} 加入聊天室 ${roomId}`);

        // 通知其他用户
        socket.to(`room_${roomId}`).emit('user_joined', {
          userId: socket.user.id,
          username: socket.user.username
        });

        // 更新最后查看时间
        await ChatParticipant.update(
          { lastSeenAt: new Date() },
          { where: { roomId, userId: socket.user.id } }
        );
      } catch (error) {
        console.error('加入聊天室失败:', error);
        socket.emit('error', { message: '加入聊天室失败' });
      }
    });

    // 离开聊天室
    socket.on('leave_room', (roomId) => {
      socket.leave(`room_${roomId}`);
      console.log(`用户 ${socket.user.username} 离开聊天室 ${roomId}`);

      // 通知其他用户
      socket.to(`room_${roomId}`).emit('user_left', {
        userId: socket.user.id,
        username: socket.user.username
      });
    });

    // 发送消息
    socket.on('send_message', async (data) => {
      try {
        const { roomId, content, messageType = 'text', fileId } = data;

        // 验证用户是否在聊天室中
        const participant = await ChatParticipant.findOne({
          where: { roomId, userId: socket.user.id }
        });

        if (!participant) {
          socket.emit('error', { message: '您不在此聊天室中' });
          return;
        }

        // 创建消息
        const message = await ChatMessage.create({
          roomId,
          senderId: socket.user.id,
          senderType: 'user',
          messageType,
          content,
          fileId: fileId || null
        });

        // 加载完整消息数据
        const fullMessage = await ChatMessage.findByPk(message.id, {
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'username', 'email'],
              required: false
            },
            {
              model: require('../models').FileUpload,
              as: 'file',
              attributes: ['id', 'fileName', 'fileUrl', 'fileType', 'mimeType'],
              required: false
            }
          ]
        });

        // 如果没有找到 User，手动添加发送者信息
        if (!fullMessage.sender) {
          fullMessage.sender = {
            id: socket.user.id,
            username: socket.user.username,
            email: socket.user.email
          };
        }

        // 广播消息到聊天室
        io.to(`room_${roomId}`).emit('new_message', fullMessage);

        // 更新其他参与者的未读计数
        await ChatParticipant.increment('unreadCount', {
          where: {
            roomId,
            userId: { [require('sequelize').Op.ne]: socket.user.id }
          }
        });

        // 通知其他参与者有新消息
        const otherParticipants = await ChatParticipant.findAll({
          where: {
            roomId,
            userId: { [require('sequelize').Op.ne]: socket.user.id }
          }
        });

        otherParticipants.forEach(p => {
          io.to(`user_${p.userId}`).emit('unread_count_update', {
            roomId,
            unreadCount: p.unreadCount + 1
          });
        });

      } catch (error) {
        console.error('发送消息失败:', error);
        socket.emit('error', { message: '发送消息失败' });
      }
    });

    // 正在输入
    socket.on('typing', (data) => {
      const { roomId } = data;
      socket.to(`room_${roomId}`).emit('user_typing', {
        userId: socket.user.id,
        username: socket.user.username
      });
    });

    // 停止输入
    socket.on('stop_typing', (data) => {
      const { roomId } = data;
      socket.to(`room_${roomId}`).emit('user_stop_typing', {
        userId: socket.user.id
      });
    });

    // 标记消息为已读
    socket.on('mark_as_read', async (data) => {
      try {
        const { roomId } = data;

        // 更新参与者的未读计数
        await ChatParticipant.update(
          {
            unreadCount: 0,
            lastSeenAt: new Date()
          },
          {
            where: { roomId, userId: socket.user.id }
          }
        );

        // 标记消息为已读
        await ChatMessage.update(
          {
            isRead: true,
            readAt: new Date()
          },
          {
            where: {
              roomId,
              senderId: { [require('sequelize').Op.ne]: socket.user.id },
              isRead: false
            }
          }
        );

        // 通知发送者消息已读
        socket.to(`room_${roomId}`).emit('messages_read', {
          userId: socket.user.id,
          roomId
        });

      } catch (error) {
        console.error('标记已读失败:', error);
      }
    });

    // 断开连接
    socket.on('disconnect', () => {
      console.log(`用户断开连接: ${socket.user.username} (${socket.user.id})`);
    });
  });

  return io;
};

// 获取 io 实例
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io 未初始化');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO
};
