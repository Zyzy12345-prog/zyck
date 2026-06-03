import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, Tag, Space, Button, Modal, message, Tooltip } from 'antd';
import {
  DollarOutlined,
  CalendarOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  HolderOutlined
} from '@ant-design/icons';
import { salesFunnelAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import './OpportunityCard.css';

const OpportunityCard = ({ opportunity, isDragging, onRefresh }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ 
    id: opportunity.id,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.4 : 1,
    cursor: isSortableDragging ? 'grabbing' : 'grab',
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleMarkWon = () => {
    Modal.confirm({
      title: '确认成交',
      content: `确定将商机"${opportunity.title}"标记为成交吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        setLoading(true);
        try {
          await salesFunnelAPI.markOpportunityWon(opportunity.id, {
            actualCloseDate: dayjs().format('YYYY-MM-DD')
          });
          message.success('已标记为成交');
          onRefresh && onRefresh();
        } catch (error) {
          message.error('操作失败：' + (error.message || '未知错误'));
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleMarkLost = () => {
    Modal.confirm({
      title: '确认流失',
      content: `确定将商机"${opportunity.title}"标记为流失吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        setLoading(true);
        try {
          await salesFunnelAPI.markOpportunityLost(opportunity.id, {
            lostReason: '客户流失'
          });
          message.success('已标记为流失');
          onRefresh && onRefresh();
        } catch (error) {
          message.error('操作失败：' + (error.message || '未知错误'));
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleViewClient = (e) => {
    e.stopPropagation();
    if (opportunity.client?.id) {
      navigate(`/customers/${opportunity.client.id}`);
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      'A': '#f5222d',
      'B': '#faad14',
      'C': '#1890ff',
      'D': '#8c8c8c'
    };
    return colors[level] || '#8c8c8c';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="opportunity-card"
    >
      <Card
        size="small"
        hoverable
        loading={loading}
        className="opp-card-inner"
      >
        <div className="opp-drag-handle" {...attributes} {...listeners}>
          <HolderOutlined style={{ fontSize: 16, color: '#999' }} />
        </div>
        
        <div className="opp-header">
          <div className="opp-title">{opportunity.title}</div>
          {opportunity.client?.customerLevel && (
            <Tag color={getLevelColor(opportunity.client.customerLevel)}>
              {opportunity.client.customerLevel}级
            </Tag>
          )}
        </div>

        <div className="opp-client" onClick={handleViewClient}>
          <UserOutlined /> {opportunity.client?.companyName}
        </div>

        <div className="opp-info">
          <div className="opp-amount">
            <DollarOutlined /> {formatCurrency(opportunity.expectedAmount)}
          </div>
          <div className="opp-probability">
            <Tag color="blue">{opportunity.probability}%</Tag>
          </div>
        </div>

        {opportunity.expectedCloseDate && (
          <div className="opp-date">
            <CalendarOutlined /> {dayjs(opportunity.expectedCloseDate).format('YYYY-MM-DD')}
          </div>
        )}

        {opportunity.assignedUser && (
          <div className="opp-assigned">
            负责人: {opportunity.assignedUser.username}
          </div>
        )}

        <div className="opp-actions">
          <Space size="small">
            <Tooltip title="查看客户">
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={handleViewClient}
              />
            </Tooltip>
            <Tooltip title="标记成交">
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={handleMarkWon}
                style={{ color: '#52c41a' }}
              />
            </Tooltip>
            <Tooltip title="标记流失">
              <Button
                type="link"
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={handleMarkLost}
                danger
              />
            </Tooltip>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default OpportunityCard;

