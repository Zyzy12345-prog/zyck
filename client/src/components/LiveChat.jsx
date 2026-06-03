import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Input,
  Button,
  List,
  Avatar,
  Space,
  Upload,
  message,
  Spin,
  Empty,
  Badge,
  Tooltip
} from 'antd';
import {
  SendOutlined,
  PictureOutlined,
  FileOutlined,
  SmileOutlined,
  CloseOutlined,
  UserOutlined
} from '@ant-design/icons';
import { io } from 'socket.io-client';
import { chatAPI, fileUploadAPI } from '../services/api';
import './LiveChat.css';

const { TextArea } = Input;

const LiveChat = ({ visible, onClose, clientId, leadId, clientInfo }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // 获取当前用户ID（只获取一次，避免重复解析）
  const currentUserId = useRef(null);
  if (!currentUserId.current) {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      currentUserId.current = user?.id;
    } catch (error) {
      console.error('解析用户信息失败:', error);
    }
  }

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 初始化聊天室
  useEffect(() => {
    if (visible && (clientId || leadId)) {
      initializeChat();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [visible, clientId, leadId]);

  const initializeChat = async () => {
    try {
      setLoading(true);

      // 获取或创建聊天室
      const roomResponse = await chatAPI.getOrCreateRoom({
        clientId: clientId || null,
        leadId: leadId || null,
        roomType: clientId ? 'client' : 'lead'
      });

      if (roomResponse.success) {
        setRoom(roomResponse.data);

        // 加载历史消息
        const messagesResponse = await chatAPI.getRoomMessages(roomResponse.data.id, {
          limit: 50
        });

        if (messagesResponse.success) {
          setMessages(messagesResponse.data.messages);
        }

        // 连接 Socket.io
        connectSocket(roomResponse.data.id);
      }
    } catch (error) {
      message.error('初始化聊天失败：' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const connectSocket = (roomId) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      message.error('未找到登录凭证，请重新登录');
      return;
    }

    const socketInstance = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketInstance.on('connect', () => {
      console.log('Socket 连接成功');
      setConnected(true);
      socketInstance.emit('join_room', roomId);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket 连接错误:', error.message);
      setConnected(false);
      message.error('连接失败：' + error.message);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket 断开连接:', reason);
      setConnected(false);
    });

    socketInstance.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    socketInstance.on('user_typing', (data) => {
      setTypingUser(data.username);
      setTyping(true);
    });

    socketInstance.on('user_stop_typing', () => {
      setTyping(false);
      setTypingUser(null);
    });

    socketInstance.on('error', (error) => {
      message.error(error.message || '发生错误');
    });

    setSocket(socketInstance);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !socket || !room) return;

    try {
      setSending(true);

      // 通过 Socket.io 发送消息
      socket.emit('send_message', {
        roomId: room.id,
        content: inputMessage.trim(),
        messageType: 'text'
      });

      setInputMessage('');
      
      // 停止输入状态
      socket.emit('stop_typing', { roomId: room.id });
    } catch (error) {
      message.error('发送失败：' + (error.message || '未知错误'));
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    // 发送正在输入状态
    if (socket && room) {
      socket.emit('typing', { roomId: room.id });

      // 清除之前的定时器
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // 3秒后停止输入状态
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', { roomId: room.id });
      }, 3000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (file) => {
    try {
      // 上传文件
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'document');
      formData.append('relatedType', 'chat_message');

      const uploadResponse = await fileUploadAPI.uploadFile(formData);

      if (uploadResponse.success) {
        // 发送文件消息
        socket.emit('send_message', {
          roomId: room.id,
          content: `发送了文件: ${file.name}`,
          messageType: 'file',
          fileId: uploadResponse.data.id
        });

        message.success('文件发送成功');
      }
    } catch (error) {
      message.error('文件上传失败');
    }

    return false; // 阻止默认上传行为
  };

  const handleImageUpload = async (file) => {
    try {
      // 上传图片
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'image');
      formData.append('relatedType', 'chat_message');

      const uploadResponse = await fileUploadAPI.uploadFile(formData);

      if (uploadResponse.success) {
        // 发送图片消息
        socket.emit('send_message', {
          roomId: room.id,
          content: `发送了图片: ${file.name}`,
          messageType: 'image',
          fileId: uploadResponse.data.id
        });

        message.success('图片发送成功');
      }
    } catch (error) {
      message.error('图片上传失败');
    }

    return false;
  };

  const renderMessage = (msg) => {
    const isOwn = msg.sender?.id === currentUserId.current;

    return (
      <div key={msg.id} className={`message-item ${isOwn ? 'message-own' : 'message-other'}`}>
        {!isOwn && (
          <Avatar size="small" icon={<UserOutlined />} className="message-avatar" />
        )}
        <div className="message-content-wrapper">
          {!isOwn && (
            <div className="message-sender">{msg.sender?.username}</div>
          )}
          <div className={`message-bubble ${isOwn ? 'message-bubble-own' : 'message-bubble-other'}`}>
            {msg.messageType === 'text' && (
              <div className="message-text">{msg.content}</div>
            )}
            {msg.messageType === 'image' && msg.file && (
              <div className="message-image">
                <img src={msg.file.fileUrl} alt={msg.file.fileName} />
              </div>
            )}
            {msg.messageType === 'file' && msg.file && (
              <div className="message-file">
                <FileOutlined /> {msg.file.fileName}
              </div>
            )}
          </div>
          <div className="message-time">
            {new Date(msg.createdAt).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
        {isOwn && (
          <Avatar size="small" icon={<UserOutlined />} className="message-avatar" />
        )}
      </div>
    );
  };

  return (
    <Modal
      title={
        <div className="chat-header">
          <Space>
            <Badge status={connected ? 'success' : 'default'} />
            <span>{clientInfo?.companyName || clientInfo?.contactPerson || '在线聊天'}</span>
          </Space>
          {clientInfo?.phone && (
            <span className="chat-header-info">📞 {clientInfo.phone}</span>
          )}
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={600}
      className="live-chat-modal"
      destroyOnHidden
    >
      <div className="live-chat-container">
        {loading ? (
          <div className="chat-loading">
            <Spin size="large">
              <div style={{ marginTop: 8 }}>正在连接...</div>
            </Spin>
          </div>
        ) : (
          <>
            {/* 消息列表 */}
            <div className="messages-container">
              {messages.length === 0 ? (
                <Empty
                  description="暂无消息，开始聊天吧"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <List
                  dataSource={messages}
                  renderItem={renderMessage}
                  className="messages-list"
                />
              )}
              
              {/* 正在输入提示 */}
              {typing && typingUser && (
                <div className="typing-indicator">
                  <span>{typingUser} 正在输入...</span>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div className="input-container">
              <div className="input-toolbar">
                <Space>
                  <Upload
                    beforeUpload={handleImageUpload}
                    showUploadList={false}
                    accept="image/*"
                  >
                    <Tooltip title="发送图片">
                      <Button type="text" icon={<PictureOutlined />} />
                    </Tooltip>
                  </Upload>
                  <Upload
                    beforeUpload={handleFileUpload}
                    showUploadList={false}
                  >
                    <Tooltip title="发送文件">
                      <Button type="text" icon={<FileOutlined />} />
                    </Tooltip>
                  </Upload>
                </Space>
              </div>
              
              <div className="input-area">
                <TextArea
                  value={inputMessage}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="输入消息... (Enter发送，Shift+Enter换行)"
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  disabled={!connected}
                />
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  loading={sending}
                  disabled={!connected || !inputMessage.trim()}
                  className="send-button"
                >
                  发送
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default LiveChat;

