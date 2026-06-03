import React, { useState, useEffect } from 'react';
import {
  Timeline,
  Card,
  Tag,
  Space,
  Button,
  Empty,
  Spin,
  Modal,
  Image,
  message
} from 'antd';
import {
  PhoneOutlined,
  MessageOutlined,
  MailOutlined,
  WechatOutlined,
  CommentOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FileTextOutlined,
  AudioOutlined,
  FileImageOutlined,
  DownloadOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { communicationAPI, fileUploadAPI } from '../services/api';
import './CommunicationTimeline.css';

const CommunicationTimeline = ({ clientId, leadId, refreshKey }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    fetchRecords();
  }, [clientId, leadId, refreshKey]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = {};
      if (clientId) params.clientId = clientId;
      if (leadId) params.leadId = leadId;

      const response = await communicationAPI.list(params);
      if (response.success) {
        setRecords(response.data.records || []);
      }
    } catch (error) {
      message.error('加载通讯记录失败');
    } finally {
      setLoading(false);
    }
  };

  const normalizeRecord = (record) => {
    const type = record.communicationType || record.communicationChannel || 'other';

    return {
      ...record,
      communicationChannel: type,
      // 统一展示字段
      callStatus: record.status || record.callStatus,
      duration: record.callDuration || record.duration || 0,
      subject: record.emailSubject || record.subject || null,
      originalContent:
        record.smsContent ||
        record.emailContent ||
        record.wechatContent ||
        record.originalContent ||
        null,
      // 附件/录音：后端 mock 会把录音也放到 attachments
      attachments: Array.isArray(record.attachments) ? record.attachments : []
    };
  };

  const getChannelIcon = (channel) => {
    const icons = {
      phone: <PhoneOutlined style={{ color: '#52c41a' }} />,
      sms: <MessageOutlined style={{ color: '#1890ff' }} />,
      email: <MailOutlined style={{ color: '#fa8c16' }} />,
      wechat: <WechatOutlined style={{ color: '#52c41a' }} />,
      chat: <CommentOutlined style={{ color: '#722ed1' }} />,
      other: <FileTextOutlined style={{ color: '#8c8c8c' }} />
    };
    return icons[channel] || icons.other;
  };

  const getChannelName = (channel) => {
    const names = {
      phone: '电话',
      sms: '短信',
      email: '邮件',
      wechat: '微信',
      chat: '在线聊天',
      other: '其他'
    };
    return names[channel] || '未知';
  };

  const getStatusColor = (status) => {
    const colors = {
      connected: 'success',
      no_answer: 'warning',
      busy: 'error',
      rejected: 'error',
      voicemail: 'default'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      connected: '已接通',
      no_answer: '未接听',
      busy: '忙线',
      rejected: '拒接',
      voicemail: '语音留言'
    };
    return texts[status] || status;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0秒';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`;
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await fileUploadAPI.downloadFile(fileId);
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('下载成功');
    } catch (error) {
      message.error('下载失败');
    }
  };

  const renderAttachments = (attachments) => {
    if (!attachments || attachments.length === 0) return null;

    return (
      <div className="attachments">
        <div className="attachments-title">附件：</div>
        <Space wrap>
          {attachments.map((file, index) => {
            const isImage = ['jpg', 'jpeg', 'png', 'gif'].includes(file.fileType?.toLowerCase());
            const isAudio = ['mp3', 'wav', 'ogg'].includes(file.fileType?.toLowerCase());

            return (
              <div key={index} className="attachment-item">
                {isImage ? (
                  <Image
                    width={80}
                    height={80}
                    src={file.fileUrl}
                    preview={{
                      mask: <EyeOutlined />
                    }}
                  />
                ) : isAudio ? (
                  <div className="audio-attachment">
                    <AudioOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                    <audio controls style={{ width: '200px', marginTop: 8 }}>
                      <source src={file.fileUrl} type={`audio/${file.fileType}`} />
                    </audio>
                  </div>
                ) : (
                  <Button
                    icon={<DownloadOutlined />}
                    size="small"
                    onClick={() => handleDownload(file.id, file.fileName)}
                  >
                    {file.fileName}
                  </Button>
                )}
              </div>
            );
          })}
        </Space>
      </div>
    );
  };

  const renderRecordCard = (rawRecord) => {
    const record = normalizeRecord(rawRecord);
    return (
    <Card
      size="small"
      className="timeline-card"
      hoverable
      onClick={() => {
        setSelectedRecord(record);
        setDetailVisible(true);
      }}
    >
      <div className="record-header">
        <Space>
          {getChannelIcon(record.communicationChannel)}
          <span className="channel-name">{getChannelName(record.communicationChannel)}</span>
          {record.callStatus && (
            <Tag color={getStatusColor(record.callStatus)}>
              {getStatusText(record.callStatus)}
            </Tag>
          )}
        </Space>
        <span className="record-time">
          <ClockCircleOutlined /> {new Date(record.createdAt).toLocaleString()}
        </span>
      </div>

      {record.subject && (
        <div className="record-subject">
          <strong>{record.subject}</strong>
        </div>
      )}

      {record.phoneNumber && (
        <div className="record-info">
          <PhoneOutlined /> {record.phoneNumber}
          {record.contactPerson && ` (${record.contactPerson})`}
        </div>
      )}

      {record.duration > 0 && (
        <div className="record-info">
          <ClockCircleOutlined /> 通话时长: {formatDuration(record.duration)}
        </div>
      )}

      {(record.content || record.originalContent) && (
        <div className="record-content">
          {record.content || record.originalContent}
        </div>
      )}

      {record.attachments && record.attachments.length > 0 && (
        <div className="record-attachments">
          <FileImageOutlined /> {record.attachments.length} 个附件
        </div>
      )}

      {record.creator && (
        <div className="record-footer">
          <UserOutlined /> {record.creator.username}
        </div>
      )}
    </Card>
  );
  };

  const renderDetailModal = () => {
    if (!selectedRecord) return null;

    return (
      <Modal
        title="通讯记录详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        <div className="record-detail">
          <div className="detail-row">
            <span className="detail-label">通讯方式：</span>
            <Space>
              {getChannelIcon(selectedRecord.communicationChannel)}
              {getChannelName(selectedRecord.communicationChannel)}
            </Space>
          </div>

          {selectedRecord.subject && (
            <div className="detail-row">
              <span className="detail-label">主题：</span>
              <span>{selectedRecord.subject}</span>
            </div>
          )}

          {selectedRecord.phoneNumber && (
            <div className="detail-row">
              <span className="detail-label">联系方式：</span>
              <span>{selectedRecord.phoneNumber}</span>
            </div>
          )}

          {selectedRecord.contactPerson && (
            <div className="detail-row">
              <span className="detail-label">联系人：</span>
              <span>{selectedRecord.contactPerson}</span>
            </div>
          )}

          {selectedRecord.callStatus && (
            <div className="detail-row">
              <span className="detail-label">状态：</span>
              <Tag color={getStatusColor(selectedRecord.callStatus)}>
                {getStatusText(selectedRecord.callStatus)}
              </Tag>
            </div>
          )}

          {selectedRecord.duration > 0 && (
            <div className="detail-row">
              <span className="detail-label">时长：</span>
              <span>{formatDuration(selectedRecord.duration)}</span>
            </div>
          )}

          {selectedRecord.content && (
            <div className="detail-row">
              <span className="detail-label">内容：</span>
              <div className="detail-content">{selectedRecord.content}</div>
            </div>
          )}

          {selectedRecord.originalContent && (
            <div className="detail-row">
              <span className="detail-label">原始内容：</span>
              <div className="detail-content">{selectedRecord.originalContent}</div>
            </div>
          )}

          {selectedRecord.notes && (
            <div className="detail-row">
              <span className="detail-label">备注：</span>
              <div className="detail-content">{selectedRecord.notes}</div>
            </div>
          )}

          {renderAttachments(selectedRecord.attachments)}

          <div className="detail-row">
            <span className="detail-label">创建时间：</span>
            <span>{new Date(selectedRecord.createdAt).toLocaleString()}</span>
          </div>

          {selectedRecord.creator && (
            <div className="detail-row">
              <span className="detail-label">创建人：</span>
              <span>{selectedRecord.creator.username}</span>
            </div>
          )}
        </div>
      </Modal>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (records.length === 0) {
    return <Empty description="暂无通讯记录" />;
  }

  return (
    <div className="communication-timeline">
      <Timeline mode="left">
        {records.map((record) => (
          <Timeline.Item
            key={record.id}
            dot={getChannelIcon(record.communicationChannel)}
          >
            {renderRecordCard(record)}
          </Timeline.Item>
        ))}
      </Timeline>
      {renderDetailModal()}
    </div>
  );
};

export default CommunicationTimeline;






