import React, { useState, useEffect } from 'react';
import { Calendar, Badge, Modal, Card, Space, Tag, Button, message } from 'antd';
import {
  PhoneOutlined,
  UserOutlined,
  MailOutlined,
  CommentOutlined,
  CalendarOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';
import './FollowUpCalendar.css';

const FollowUpCalendar = ({ userId }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // 跟进方式图标映射
  const followTypeIcons = {
    phone: <PhoneOutlined />,
    visit: <UserOutlined />,
    email: <MailOutlined />,
    wechat: <CommentOutlined />,
    meeting: <CalendarOutlined />,
    other: <FileTextOutlined />
  };

  // 跟进方式文本映射
  const followTypeText = {
    phone: '电话',
    visit: '拜访',
    email: '邮件',
    wechat: '微信',
    meeting: '会议',
    other: '其他'
  };

  // 获取日历数据
  const fetchCalendarData = async (date) => {
    try {
      setLoading(true);
      const startDate = date.startOf('month').format('YYYY-MM-DD');
      const endDate = date.endOf('month').format('YYYY-MM-DD');

      const token = localStorage.getItem('token');
      const params = { startDate, endDate };
      if (userId) {
        params.userId = userId;
      }

      const response = await axios.get('http://localhost:3000/api/clients/calendar/events', {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      if (response.data.success) {
        setEvents(response.data.data);
      }
    } catch (error) {
      console.error('获取日历数据失败:', error);
      message.error('获取日历数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData(selectedDate);
  }, [selectedDate, userId]);

  // 获取指定日期的事件
  const getEventsForDate = (date) => {
    return events.filter(event => 
      dayjs(event.start).format('YYYY-MM-DD') === date.format('YYYY-MM-DD')
    );
  };

  // 日期单元格渲染
  const dateCellRender = (value) => {
    const dayEvents = getEventsForDate(value);
    
    return (
      <ul className="events">
        {dayEvents.slice(0, 3).map((event, index) => (
          <li key={index}>
            <Badge
              status={getEventStatus(event)}
              text={
                <span className="event-text">
                  {followTypeIcons[event.type]} {event.clientName}
                </span>
              }
            />
          </li>
        ))}
        {dayEvents.length > 3 && (
          <li className="more-events">
            还有 {dayEvents.length - 3} 个跟进...
          </li>
        )}
      </ul>
    );
  };

  // 获取事件状态
  const getEventStatus = (event) => {
    const now = dayjs();
    const eventTime = dayjs(event.start);
    
    if (eventTime.isBefore(now, 'day')) {
      return 'error'; // 已过期
    } else if (eventTime.isSame(now, 'day')) {
      return 'processing'; // 今天
    } else {
      return 'success'; // 未来
    }
  };

  // 选择日期
  const onSelect = (date) => {
    setSelectedDate(date);
    const dayEvents = getEventsForDate(date);
    if (dayEvents.length > 0) {
      setSelectedEvents(dayEvents);
      setDetailModalVisible(true);
    }
  };

  // 月份改变
  const onPanelChange = (date) => {
    setSelectedDate(date);
    fetchCalendarData(date);
  };

  // 跳转到客户详情
  const goToCustomerDetail = (clientId) => {
    window.location.href = `/customers/${clientId}`;
  };

  return (
    <div className="follow-up-calendar">
      <Card
        title={
          <Space>
            <CalendarOutlined />
            <span>跟进日历</span>
          </Space>
        }
        extra={
          <Space>
            <Button onClick={() => setSelectedDate(dayjs())}>今天</Button>
            <Button onClick={() => fetchCalendarData(selectedDate)}>刷新</Button>
          </Space>
        }
      >
        <Calendar
          value={selectedDate}
          onSelect={onSelect}
          onPanelChange={onPanelChange}
          dateCellRender={dateCellRender}
          loading={loading}
        />
      </Card>

      {/* 事件详情模态框 */}
      <Modal
        title={`${selectedDate.format('YYYY年MM月DD日')} 的跟进计划`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        <div className="event-details">
          {selectedEvents.map((event, index) => (
            <Card
              key={index}
              size="small"
              className="event-card"
              style={{ marginBottom: 16 }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <div className="event-header">
                  <Space>
                    {followTypeIcons[event.type]}
                    <Tag color="blue">{followTypeText[event.type]}</Tag>
                    <span className="event-time">
                      {dayjs(event.start).format('HH:mm')}
                    </span>
                  </Space>
                </div>
                
                <div className="event-client">
                  <strong>客户：</strong>
                  <a onClick={() => goToCustomerDetail(event.clientId)}>
                    {event.clientName}
                  </a>
                </div>

                {event.contactPerson && (
                  <div>
                    <strong>联系人：</strong>
                    {event.contactPerson}
                  </div>
                )}

                {event.phone && (
                  <div>
                    <strong>电话：</strong>
                    {event.phone}
                  </div>
                )}

                <div>
                  <strong>负责人：</strong>
                  {event.assignedTo}
                </div>

                {event.description && (
                  <div className="event-description">
                    <strong>备注：</strong>
                    {event.description}
                  </div>
                )}

                <div className="event-actions">
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => goToCustomerDetail(event.clientId)}
                  >
                    查看详情
                  </Button>
                </div>
              </Space>
            </Card>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default FollowUpCalendar;














