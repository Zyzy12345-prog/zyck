import React, { useState } from 'react';
import {
  Modal,
  Tabs,
  Form,
  Input,
  Button,
  Upload,
  message,
  Space,
  DatePicker,
  Select,
  InputNumber
} from 'antd';
import {
  PhoneOutlined,
  MessageOutlined,
  MailOutlined,
  WechatOutlined,
  CommentOutlined,
  UploadOutlined,
  AudioOutlined
} from '@ant-design/icons';
import { communicationAPI, fileUploadAPI } from '../services/api';
import './CommunicationPanel.css';


const { TextArea } = Input;
const { Option } = Select;

const CommunicationPanel = ({ visible, onClose, onSuccess, clientId, leadId, clientInfo }) => {
  const [activeTab, setActiveTab] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // 上传附件（截图/邮件附件等；电话录音不再要求手工上传）
      let uploadedFiles = [];
      if (fileList.length > 0) {
        const formData = new FormData();
        fileList.forEach(file => {
          formData.append('files', file.originFileObj);
        });
        formData.append('category', activeTab === 'email' ? 'email' : 'screenshot');
        formData.append('relatedType', 'communication_record');

        const uploadResponse = await fileUploadAPI.uploadMultiple(formData);
        if (uploadResponse.success) {
          uploadedFiles = Array.isArray(uploadResponse.data) ? uploadResponse.data : [uploadResponse.data];
        }
      }

      // 通过 Mock 通讯 API：系统内“直接联系”并自动保存记录
      const base = {
        clientId: clientId || null,
        leadId: leadId || null,
        notes: values.notes,
      };

      if (activeTab === 'phone') {
        await communicationAPI.mockCall({
          ...base,
          phoneNumber: values.phoneNumber || clientInfo?.phone,
          contactPerson: values.contactPerson || clientInfo?.contactPerson,
          content: values.content,
          duration: values.duration || 10
        });
        message.success('拨打成功（模拟），已自动保存通话记录与录音');
      } else if (activeTab === 'sms') {
        await communicationAPI.mockSms({
          ...base,
          phoneNumber: values.phoneNumber || clientInfo?.phone,
          content: values.originalContent
        });
        message.success('短信发送成功（模拟），已自动保存记录');
      } else if (activeTab === 'email') {
        await communicationAPI.mockEmail({
          ...base,
          to: values.phoneNumber || clientInfo?.email,
          subject: values.subject,
          content: values.originalContent,
          cc: null,
          // 附件先仍走 fileUpload，后端 mock 暂不处理附件转存；前端保存到 notes 里便于追溯
        });
        message.success('邮件发送成功（模拟），已自动保存记录');
      } else if (activeTab === 'wechat') {
        await communicationAPI.mockWechat({
          ...base,
          wechatMsgType: 'text',
          content: values.originalContent
        });
        message.success('微信发送成功（模拟），已自动保存记录');
      } else if (activeTab === 'chat') {
        await communicationAPI.mockChat({
          ...base,
          content: values.originalContent
        });
        message.success('消息发送成功（模拟），已自动保存记录');
      } else {
        message.warning('未知通讯类型');
      }

      if (typeof onSuccess === 'function') {
        await onSuccess();
      }

      form.resetFields();
      setFileList([]);
      onClose();
    } catch (error) {
      const serverMsg = error?.response?.data?.message || error?.response?.data?.detail || '';
      const fullMsg = serverMsg ? `保存失败：${serverMsg}` : `保存失败：${error.message || '未知错误'}`;
      message.error(fullMsg);
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    fileList,
    beforeUpload: (file) => {
      setFileList([...fileList, file]);
      return false;
    },
    onRemove: (file) => {
      setFileList(fileList.filter(f => f.uid !== file.uid));
    }
  };

  const renderPhoneTab = () => (
    <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{
      phoneNumber: clientInfo?.phone,
      contactPerson: clientInfo?.contactPerson
    }}>
      <Form.Item
        name="phoneNumber"
        label="电话号码"
        rules={[{ required: true, message: '请输入电话号码' }]}
      >
        <Input prefix={<PhoneOutlined />} placeholder="请输入电话号码" />
      </Form.Item>

      <Form.Item
        name="contactPerson"
        label="联系人"
      >
        <Input placeholder="请输入联系人" />
      </Form.Item>

      <Form.Item
        name="callStatus"
        label="通话状态"
        initialValue="connected"
        rules={[{ required: true, message: '请选择通话状态' }]}
      >
        <Select>
          <Option value="connected">已接通</Option>
          <Option value="no_answer">未接听</Option>
          <Option value="busy">忙线</Option>
          <Option value="rejected">拒接</Option>
          <Option value="voicemail">语音留言</Option>
        </Select>
      </Form.Item>

      <Form.Item name="callResult" label="通话结果">
        <Select placeholder="选择通话结果">
          <Option value="success">成功</Option>
          <Option value="follow_up_needed">需跟进</Option>
          <Option value="not_interested">不感兴趣</Option>
          <Option value="callback_requested">请求回拨</Option>
        </Select>
      </Form.Item>

      <Form.Item name="duration" label="通话时长（秒）">
        <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入通话时长" />
      </Form.Item>

      <Form.Item name="content" label="通话内容">
        <TextArea rows={4} placeholder="请输入通话内容" />
      </Form.Item>

      <Form.Item name="notes" label="备注">
        <TextArea rows={2} placeholder="请输入备注" />
      </Form.Item>

      <Form.Item label="录音文件">
        <div style={{ color: '#666' }}>
          系统将自动生成并保存通话录音（模拟），正式上线后可替换为真实通话供应商录音。
        </div>
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            拨打并保存（模拟）
          </Button>
          <Button onClick={onClose}>取消</Button>
        </Space>
      </Form.Item>
    </Form>
  );

  const renderSMSTab = () => (
    <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{
      phoneNumber: clientInfo?.phone
    }}>
      <Form.Item
        name="phoneNumber"
        label="手机号码"
        rules={[{ required: true, message: '请输入手机号码' }]}
      >
        <Input prefix={<MessageOutlined />} placeholder="请输入手机号码" />
      </Form.Item>

      <Form.Item
        name="subject"
        label="短信主题"
      >
        <Input placeholder="请输入短信主题" />
      </Form.Item>

      <Form.Item
        name="originalContent"
        label="短信内容"
        rules={[{ required: true, message: '请输入短信内容' }]}
      >
        <TextArea rows={6} placeholder="请输入短信内容" maxLength={500} showCount />
      </Form.Item>

      <Form.Item name="notes" label="备注">
        <TextArea rows={2} placeholder="请输入备注" />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            发送并保存（模拟）
          </Button>
          <Button onClick={onClose}>取消</Button>
        </Space>
      </Form.Item>
    </Form>
  );

  const renderEmailTab = () => (
    <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{
      phoneNumber: clientInfo?.email
    }}>
      <Form.Item
        name="phoneNumber"
        label="邮箱地址"
        rules={[
          { required: true, message: '请输入邮箱地址' },
          { type: 'email', message: '请输入正确的邮箱格式' }
        ]}
      >
        <Input prefix={<MailOutlined />} placeholder="请输入邮箱地址" />
      </Form.Item>

      <Form.Item
        name="subject"
        label="邮件主题"
        rules={[{ required: true, message: '请输入邮件主题' }]}
      >
        <Input placeholder="请输入邮件主题" />
      </Form.Item>

      <Form.Item
        name="originalContent"
        label="邮件内容"
        rules={[{ required: true, message: '请输入邮件内容' }]}
      >
        <TextArea rows={8} placeholder="请输入邮件内容" />
      </Form.Item>

      <Form.Item label="附件">
        <Upload {...uploadProps} multiple>
          <Button icon={<UploadOutlined />}>上传附件</Button>
        </Upload>
      </Form.Item>

      <Form.Item name="notes" label="备注">
        <TextArea rows={2} placeholder="请输入备注" />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            发送并保存（模拟）
          </Button>
          <Button onClick={onClose}>取消</Button>
        </Space>
      </Form.Item>
    </Form>
  );

  const renderWeChatTab = () => (
    <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{
      contactPerson: clientInfo?.contactPerson
    }}>
      <Form.Item
        name="contactPerson"
        label="微信昵称"
      >
        <Input prefix={<WechatOutlined />} placeholder="请输入微信昵称" />
      </Form.Item>

      <Form.Item
        name="originalContent"
        label="聊天内容"
        rules={[{ required: true, message: '请输入聊天内容' }]}
      >
        <TextArea rows={6} placeholder="请输入聊天内容或粘贴聊天记录" />
      </Form.Item>

      <Form.Item label="聊天截图">
        <Upload {...uploadProps} accept="image/*" multiple listType="picture">
          <Button icon={<UploadOutlined />}>上传截图</Button>
        </Upload>
      </Form.Item>

      <Form.Item name="notes" label="备注">
        <TextArea rows={2} placeholder="请输入备注" />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            发送并保存（模拟）
          </Button>
          <Button onClick={onClose}>取消</Button>
        </Space>
      </Form.Item>
    </Form>
  );

  const renderChatTab = () => (
    <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{
      contactPerson: clientInfo?.contactPerson
    }}>
      <Form.Item
        name="contactPerson"
        label="联系人"
      >
        <Input prefix={<CommentOutlined />} placeholder="请输入联系人" />
      </Form.Item>

      <Form.Item
        name="subject"
        label="会话主题"
      >
        <Input placeholder="请输入会话主题" />
      </Form.Item>

      <Form.Item
        name="originalContent"
        label="聊天内容"
        rules={[{ required: true, message: '请输入聊天内容' }]}
      >
        <TextArea rows={6} placeholder="请输入聊天内容" />
      </Form.Item>

      <Form.Item label="聊天截图">
        <Upload {...uploadProps} accept="image/*" multiple listType="picture">
          <Button icon={<UploadOutlined />}>上传截图</Button>
        </Upload>
      </Form.Item>

      <Form.Item name="notes" label="备注">
        <TextArea rows={2} placeholder="请输入备注" />
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>
            发送并保存（模拟）
          </Button>
          <Button onClick={onClose}>取消</Button>
        </Space>
      </Form.Item>
    </Form>
  );

  return (
    <Modal
      title="联系客户"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnHidden
    >
      <div className="communication-panel">
        {clientInfo && (
          <div className="client-info">
            <h4>{clientInfo.companyName || clientInfo.contactPerson}</h4>
            <Space>
              {clientInfo.phone && <span>📞 {clientInfo.phone}</span>}
              {clientInfo.email && <span>📧 {clientInfo.email}</span>}
            </Space>
          </div>
        )}

        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          items={[
            {
              key: 'phone',
              label: (
                <span>
                  <PhoneOutlined />
                  电话
                </span>
              ),
              children: renderPhoneTab()
            },
            {
              key: 'sms',
              label: (
                <span>
                  <MessageOutlined />
                  短信
                </span>
              ),
              children: renderSMSTab()
            },
            {
              key: 'email',
              label: (
                <span>
                  <MailOutlined />
                  邮件
                </span>
              ),
              children: renderEmailTab()
            },
            {
              key: 'wechat',
              label: (
                <span>
                  <WechatOutlined />
                  微信
                </span>
              ),
              children: renderWeChatTab()
            },
            {
              key: 'chat',
              label: (
                <span>
                  <CommentOutlined />
                  在线聊天
                </span>
              ),
              children: renderChatTab()
            }
          ]}
        />
      </div>
    </Modal>
  );
};

export default CommunicationPanel;






