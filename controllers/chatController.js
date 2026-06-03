const { ChatRoom, ChatMessage, ChatParticipant, User, Client } = require('../models');
const { Op } = require('sequelize');

// 创建或获取聊天室
exports.getOrCreateRoom = async (req, res, next) => {
  try {
    const { clientId, leadId, roomType = 'client' } = req.body;
    const userId = req.user.id;

    // 查找是否已存在聊天室
    let room = await ChatRoom.findOne({
      where: {
        ...(clientId && { clientId }),
        ...(leadId && { leadId }),
        status: 'active'
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'email']
        },
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'companyName', 'contactPerson', 'phone', 'email']
        }
      ]
    });

    // 如果不存在，创建新聊天室
    if (!room) {
      const roomName = clientId 
        ? `客户聊天-${clientId}`
        : leadId 
        ? `线索聊天-${leadId}`
        : `聊天室-${Date.now()}`;

      room = await ChatRoom.create({
        roomName,
        roomType,
        clientId: clientId || null,
        leadId: leadId || null,
        createdBy: userId,
        status: 'active'
      });

      // 添加创建者为参与者
      await ChatParticipant.create({
        roomId: room.id,
        userId: userId,
        role: 'owner'
      });

      // 重新查询以包含关联数据
      room = await ChatRoom.findByPk(room.id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'email']
          },
          {
            model: Client,
            as: 'client',
            attributes: ['id', 'companyName', 'contactPerson', 'phone', 'email']
          }
        ]
      });
    } else {
      // 检查用户是否已是参与者
      const participant = await ChatParticipant.findOne({
        where: { roomId: room.id, userId }
      });

      if (!participant) {
        await ChatParticipant.create({
          roomId: room.id,
          userId: userId,
          role: 'member'
        });
      }
    }

    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户的聊天室列表
exports.getUserRooms = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status = 'active' } = req.query;

    const participants = await ChatParticipant.findAll({
      where: { userId },
      include: [
        {
          model: ChatRoom,
          as: 'room',
          where: { status },
          include: [
            {
              model: Client,
              as: 'client',
              attributes: ['id', 'companyName', 'contactPerson', 'phone']
            },
            {
              model: ChatMessage,
              as: 'messages',
              limit: 1,
              order: [['createdAt', 'DESC']],
              include: [
                {
                  model: User,
                  as: 'sender',
                  attributes: ['id', 'username']
                }
              ]
            }
          ]
        }
      ],
      order: [[{ model: ChatRoom, as: 'room' }, 'lastMessageAt', 'DESC NULLS LAST']]
    });

    const rooms = participants.map(p => ({
      ...p.room.toJSON(),
      unreadCount: p.unreadCount,
      lastSeenAt: p.lastSeenAt
    }));

    res.json({
      success: true,
      data: rooms
    });
  } catch (error) {
    next(error);
  }
};

// 获取聊天室消息
exports.getRoomMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await ChatMessage.findAndCountAll({
      where: { roomId },
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'email']
        },
        {
          model: require('../models').FileUpload,
          as: 'file',
          attributes: ['id', 'fileName', 'fileUrl', 'fileType', 'mimeType']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        messages: rows.reverse(), // 反转以时间正序显示
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 发送消息（HTTP接口，用于文件上传等）
exports.sendMessage = async (req, res, next) => {
  try {
    const { roomId, content, messageType = 'text', fileId } = req.body;
    const userId = req.user.id;

    // 验证用户是否在聊天室中
    const participant = await ChatParticipant.findOne({
      where: { roomId, userId }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: '您不在此聊天室中'
      });
    }

    // 创建消息
    const message = await ChatMessage.create({
      roomId,
      senderId: userId,
      senderType: 'user',
      messageType,
      content,
      fileId: fileId || null
    });

    // 加载关联数据
    const fullMessage = await ChatMessage.findByPk(message.id, {
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'email']
        },
        {
          model: require('../models').FileUpload,
          as: 'file',
          attributes: ['id', 'fileName', 'fileUrl', 'fileType', 'mimeType']
        }
      ]
    });

    // 更新其他参与者的未读计数
    await ChatParticipant.increment('unreadCount', {
      where: {
        roomId,
        userId: { [Op.ne]: userId }
      }
    });

    res.json({
      success: true,
      data: fullMessage
    });
  } catch (error) {
    next(error);
  }
};

// 标记消息为已读
exports.markAsRead = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // 更新参与者的未读计数和最后查看时间
    await ChatParticipant.update(
      {
        unreadCount: 0,
        lastSeenAt: new Date()
      },
      {
        where: { roomId, userId }
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
          senderId: { [Op.ne]: userId },
          isRead: false
        }
      }
    );

    res.json({
      success: true,
      message: '已标记为已读'
    });
  } catch (error) {
    next(error);
  }
};

// 关闭聊天室
exports.closeRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;

    // 检查权限
    const participant = await ChatParticipant.findOne({
      where: { roomId, userId, role: ['owner', 'admin'] }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: '无权限关闭此聊天室'
      });
    }

    await ChatRoom.update(
      { status: 'closed' },
      { where: { id: roomId } }
    );

    res.json({
      success: true,
      message: '聊天室已关闭'
    });
  } catch (error) {
    next(error);
  }
};

// 获取聊天室详情
exports.getRoomDetail = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const room = await ChatRoom.findByPk(roomId, {
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'companyName', 'contactPerson', 'phone', 'email']
        },
        {
          model: ChatParticipant,
          as: 'roomParticipants',  // 改名避免冲突
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'username', 'email']
            }
          ]
        }
      ]
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: '聊天室不存在'
      });
    }

    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    next(error);
  }
};

