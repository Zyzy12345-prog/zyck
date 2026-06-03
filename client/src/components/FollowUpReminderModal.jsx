import React, { useState, useEffect } from 'react';
import {
  Modal,
  List,
  Badge,
  Tag,
  Button,
  Space,
  Empty,
  Spin,
  Tabs,
  Tooltip,
  message,
  Popconfirm
} from 'antd';
import {
  BellOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  FireOutlined
} from '@ant-design/icons';
import { followUpReminderAPI } from '../services/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import './FollowUpReminderModal.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');



const FollowUpReminderModal = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [reminders, setReminders] = useState([]);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    if (visible) {
      fetchData();
    }
  }, [visible, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      
      if (activeTab === 'unread') {
        params.status = 'unread';
      } else if (activeTab === 'pending') {
        params.status = 'pending';
      } else if (activeTab === 'completed') {
        params.status = 'completed';
      }

      const [remindersRes, statsRes] = await Promise.all([
        followUpReminderAPI.getReminders(params),
        followUpReminderAPI.getReminderStatistics()
      ]);

      if (remindersRes.success) {
        setReminders(remindersRes.data.reminders);
      }

      if (statsRes.success) {
        setStatistics(statsRes.data);
      }
    } catch (error) {
      message.error('获取提醒失败：' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await followUpReminderAPI.markAsRead(id);
      message.success('已标记为已读');
      fetchData();
    } catch (error) {
      message.error('操作失败：' + (error.message || '未知错误'));
    }
  };

  const handleMarkAsCompleted = async (id) => {
    try {
      await followUpReminderAPI.markAsCompleted(id);
      message.success('已标记为已完成');
      fetchData();
    } catch (error) {
      message.error('操作失败：' + (error.message || '未知错误'));
    }
  };

  const handleDelete = async (id) => {
    try {
      await followUpReminderAPI.deleteReminder(id);
      message.success('提醒已删除');
      fetchData();
    } catch (error) {
      message.error('删除失败：' + (error.message || '未知错误'));
    }
  };

  const handleBatchMarkAsRead = async () => {
    try {
      const unreadIds = reminders
        .filter(r => !r.isRead && !r.isCompleted)
        .map(r => r.id);
      
      if (unreadIds.length === 0) {
        message.info('没有未读提醒');
        return;
      }

      await followUpReminderAPI.batchMarkAsRead(unreadIds);
      message.success(`已标记${unreadIds.length}条提醒为已读`);
      fetchData();
    } catch (error) {
      message.error('操作失败：' + (error.message || '未知错误'));
    }
  };

  const getPriorityConfig = (priority) => {
    const config = {
      urgent: { color: 'red', icon: <FireOutlined />, text: '紧急' },
      high: { color: 'orange', icon: <ExclamationCircleOutlined />, text: '高' },
      normal: { color: 'blue', icon: <ClockCircleOutlined />, text: '普通' },
      low: { color: 'default', icon: <ClockCircleOutlined />, text: '低' }
    };
    return config[priority] || config.normal;
  };

  const getTypeConfig = (type) => {
    const config = {
      scheduled: { color: 'blue', text: '计划中' },
      overdue: { color: 'red', text: '已逾期' },
      urgent: { color: 'orange', text: '紧急' }
    };
    return config[type] || config.scheduled;
  };

  const isOverdue = (reminderTime) => {
    return dayjs(reminderTime).isBefore(dayjs());
  };

  const renderReminderItem = (item) => {
    const priorityConfig = getPriorityConfig(item.priority);
    const typeConfig = getTypeConfig(item.reminderType);
    const overdue = isOverdue(item.reminderTime);

    return (
      <List.Item
        key={item.id}
        className={`reminder-item ${!item.isRead ? 'unread' : ''} ${item.isCompleted ? 'completed' : ''}`}
        actions={[
          !item.isCompleted && !item.isRead && (
            <Button
              type="link"
              size="small"
              onClick={() => handleMarkAsRead(item.id)}
            >
              标记已读
            </Button>
          ),
          !item.isCompleted && (
            <Button
              type="link"
              size="small"
              onClick={() => handleMarkAsCompleted(item.id)}
            >
              完成
            </Button>
          ),
          <Popconfirm
            title="确定要删除这条提醒吗？"
            onConfirm={() => handleDelete(item.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        ]}
      >
        <List.Item.Meta
          avatar={
            <div className="reminder-icon">
              {priorityConfig.icon}
            </div>
          }
          title={
            <Space>
              {!item.isRead && <Badge status="processing" />}
              <span className="reminder-title">{item.title}</span>
              <Tag color={priorityConfig.color}>{priorityConfig.text}</Tag>
              <Tag color={typeConfig.color}>{typeConfig.text}</Tag>
              {overdue && !item.isCompleted && (
                <Tag color="red">逾期</Tag>
              )}
            </Space>
          }
          description={
            <div className="reminder-description">
              <div className="reminder-content">{item.content}</div>
              <Space className="reminder-meta">
                <span>
                  <ClockCircleOutlined /> 提醒时间: {dayjs(item.reminderTime).format('YYYY-MM-DD HH:mm')}
                </span>
                {item.lead && (
                  <span>
                    线索: {item.lead.companyName} - {item.lead.contactPerson}
                  </span>
                )}
                <span className="reminder-relative-time">
                  {dayjs(item.reminderTime).fromNow()}
                </span>
              </Space>
            </div>
          }
        />
      </List.Item>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <BellOutlined />
          <span>跟进提醒</span>
          {statistics && statistics.unread > 0 && (
            <Badge count={statistics.unread} />
          )}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="batch-read" onClick={handleBatchMarkAsRead}>
          全部标记为已读
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          关闭
        </Button>
      ]}
    >
      {statistics && (
        <div className="reminder-statistics">
          <Space size="large">
            <div className="stat-item">
              <span className="stat-label">总提醒:</span>
              <span className="stat-value">{statistics.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">未读:</span>
              <span className="stat-value text-primary">{statistics.unread}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">待处理:</span>
              <span className="stat-value text-warning">{statistics.pending}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">已完成:</span>
              <span className="stat-value text-success">{statistics.completed}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">逾期:</span>
              <span className="stat-value text-danger">{statistics.overdue}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">今日:</span>
              <span className="stat-value">{statistics.today}</span>
            </div>
          </Space>
        </div>
      )}

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab} 
        className="reminder-tabs"
        items={[
          {
            key: 'all',
            label: `全部 (${statistics?.total || 0})`
          },
          {
            key: 'unread',
            label: `未读 (${statistics?.unread || 0})`
          },
          {
            key: 'pending',
            label: `待处理 (${statistics?.pending || 0})`
          },
          {
            key: 'completed',
            label: `已完成 (${statistics?.completed || 0})`
          }
        ]}
      />

      <Spin spinning={loading}>
        {reminders.length > 0 ? (
          <List
            className="reminder-list"
            dataSource={reminders}
            renderItem={renderReminderItem}
          />
        ) : (
          <Empty description="暂无提醒" />
        )}
      </Spin>
    </Modal>
  );
};

export default FollowUpReminderModal;








