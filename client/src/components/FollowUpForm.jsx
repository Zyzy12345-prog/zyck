import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  Button,
  Space,
  message,
  Tag
} from 'antd';
import {
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import dayjs from 'dayjs';
import api from '../services/api';
import './FollowUpForm.css';

const { Option } = Select;
const { TextArea } = Input;

const FollowUpForm = ({ visible, onClose, onSuccess, clientId, followUp = null }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(followUp?.content || '');
  const [fileList, setFileList] = useState([]);
  const [useRichText, setUseRichText] = useState(false);

  // 富文本编辑器配置
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ]
  };

  // 文件上传配置
  const uploadProps = {
    beforeUpload: (file) => {
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('文件大小不能超过10MB!');
        return false;
      }
      setFileList([...fileList, file]);
      return false; // 阻止自动上传
    },
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    fileList
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const token = localStorage.getItem('token');
      const formData = new FormData();

      // 添加表单数据
      formData.append('followType', values.followType);
      formData.append('followTime', values.followTime ? values.followTime.toISOString() : new Date().toISOString());
      formData.append('content', useRichText ? content : values.content);
      formData.append('result', values.result || '');
      formData.append('status', values.status || 'completed');
      
      if (values.nextFollowTime) {
        formData.append('nextFollowTime', values.nextFollowTime.toISOString());
      }

      // 添加文件
      fileList.forEach((file) => {
        formData.append('files', file);
      });

      let response;
      if (followUp) {
        // 更新跟进记录
        response = await api.put(
          `http://localhost:3000/api/clients/follow-ups/${followUp.id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      } else {
        // 创建跟进记录
        response = await api.post(
          `http://localhost:3000/api/clients/${clientId}/follow-ups`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }

      if (response.data.success) {
        message.success(followUp ? '跟进记录更新成功' : '跟进记录创建成功');
        form.resetFields();
        setContent('');
        setFileList([]);
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('提交失败:', error);
      message.error(error.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化表单值
  React.useEffect(() => {
    if (followUp && visible) {
      form.setFieldsValue({
        followType: followUp.followType,
        followTime: followUp.followTime ? dayjs(followUp.followTime) : dayjs(),
        content: followUp.content,
        result: followUp.result,
        status: followUp.status,
        nextFollowTime: followUp.nextFollowTime ? dayjs(followUp.nextFollowTime) : null
      });
      setContent(followUp.content);
    } else if (visible) {
      form.resetFields();
      setContent('');
      setFileList([]);
    }
  }, [followUp, visible, form]);

  return (
    <Modal
      title={followUp ? '编辑跟进记录' : '新增跟进记录'}
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      width={800}
      confirmLoading={loading}
      okText="提交"
      cancelText="取消"
      className="follow-up-form-modal"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          followType: 'phone',
          followTime: dayjs(),
          status: 'completed'
        }}
      >
        <Form.Item
          name="followType"
          label="跟进方式"
          rules={[{ required: true, message: '请选择跟进方式' }]}
        >
          <Select placeholder="请选择跟进方式">
            <Option value="phone">
              <Space>
                <span>📞</span>
                <span>电话</span>
              </Space>
            </Option>
            <Option value="visit">
              <Space>
                <span>🚶</span>
                <span>拜访</span>
              </Space>
            </Option>
            <Option value="email">
              <Space>
                <span>📧</span>
                <span>邮件</span>
              </Space>
            </Option>
            <Option value="wechat">
              <Space>
                <span>💬</span>
                <span>微信</span>
              </Space>
            </Option>
            <Option value="meeting">
              <Space>
                <span>👥</span>
                <span>会议</span>
              </Space>
            </Option>
            <Option value="other">
              <Space>
                <span>📝</span>
                <span>其他</span>
              </Space>
            </Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="followTime"
          label="跟进时间"
          rules={[{ required: true, message: '请选择跟进时间' }]}
        >
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="跟进内容">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space>
              <Button
                size="small"
                type={!useRichText ? 'primary' : 'default'}
                onClick={() => setUseRichText(false)}
              >
                纯文本
              </Button>
              <Button
                size="small"
                type={useRichText ? 'primary' : 'default'}
                onClick={() => setUseRichText(true)}
              >
                富文本
              </Button>
            </Space>

            {useRichText ? (
              <ReactQuill
                theme="snow"
                value={content}
                onChange={setContent}
                modules={quillModules}
                placeholder="请输入跟进内容..."
                style={{ height: '200px', marginBottom: '50px' }}
              />
            ) : (
              <Form.Item
                name="content"
                rules={[{ required: true, message: '请输入跟进内容' }]}
                noStyle
              >
                <TextArea
                  rows={6}
                  placeholder="请输入跟进内容..."
                  maxLength={2000}
                  showCount
                />
              </Form.Item>
            )}
          </Space>
        </Form.Item>

        <Form.Item name="result" label="跟进结果">
          <Select placeholder="请选择跟进结果" allowClear>
            <Option value="success">
              <Tag color="success">成功</Tag>
            </Option>
            <Option value="next_stage">
              <Tag color="processing">推动到下一阶段</Tag>
            </Option>
            <Option value="need_follow">
              <Tag color="warning">需要再次跟进</Tag>
            </Option>
            <Option value="pending">
              <Tag color="default">待定</Tag>
            </Option>
            <Option value="failed">
              <Tag color="error">失败</Tag>
            </Option>
            <Option value="no_answer">
              <Tag color="default">未接通</Tag>
            </Option>
          </Select>
        </Form.Item>

        <Form.Item name="nextFollowTime" label="下次跟进时间">
          <DatePicker
            showTime
            style={{ width: '100%' }}
            placeholder="选择下次跟进时间（可选）"
          />
        </Form.Item>

        <Form.Item label="相关文件">
          <Upload {...uploadProps} multiple>
            <Button icon={<UploadOutlined />}>选择文件</Button>
          </Upload>
          <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
            支持上传图片、PDF、Word、Excel等文件，单个文件不超过10MB
          </div>
        </Form.Item>

        <Form.Item name="status" label="状态" hidden>
          <Select>
            <Option value="pending">待跟进</Option>
            <Option value="completed">已完成</Option>
            <Option value="cancelled">已取消</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FollowUpForm;














