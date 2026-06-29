import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { Card, Form, Input, Button, message, Divider, Descriptions, Tag, Modal } from 'antd';
import {
  UserOutlined, LockOutlined, MailOutlined, PhoneOutlined,
  ClockCircleOutlined, SafetyOutlined, SaveOutlined
} from '@ant-design/icons';
import './Settings.css';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [passwordForm] = Form.useForm();
  const [profileForm] = Form.useForm();

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role,
      });
    }
  }, [user]);

  const handleUpdateProfile = async (values) => {
    try {
      setLoading(true);
      // Profile update uses authAPI
      const response = await authAPI.updateProfile(values);
      if (response.success) {
        message.success('个人资料已更新');
      } else {
        message.error(response.message || '更新失败');
      }
    } catch (error) {
      message.error('更新个人资料失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values) => {
    try {
      setLoading(true);
      const response = await authAPI.updatePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      if (response.success) {
        message.success('密码修改成功，请重新登录');
        passwordForm.resetFields();
        setTimeout(() => logout(), 1500);
      } else {
        message.error(response.message || '修改失败');
      }
    } catch (error) {
      message.error('修改密码失败');
    } finally {
      setLoading(false);
    }
  };

  const roleMap = {
    admin: { label: '管理员', color: 'red' },
    manager: { label: '经理', color: 'blue' },
    sales: { label: '销售', color: 'green' },
    operator: { label: '操作员', color: 'default' },
  };

  return (
    <div className="settings-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">账户设置</h1>
          <p className="page-subtitle">管理您的个人信息和安全设置</p>
        </div>
      </div>

      <div className="settings-content">
        {/* 基本信息卡片 */}
        <Card
          title={<span><UserOutlined style={{ marginRight: 8 }} />基本信息</span>}
          className="settings-card"
        >
          <Descriptions column={{ xs: 1, sm: 2 }} bordered size="middle">
            <Descriptions.Item label="用户名">{user?.username}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{user?.email || '未设置'}</Descriptions.Item>
            <Descriptions.Item label="手机号">{user?.phone || '未设置'}</Descriptions.Item>
            <Descriptions.Item label="角色">
              <Tag color={roleMap[user?.role]?.color || 'default'}>
                {roleMap[user?.role]?.label || user?.role}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="注册时间">
              <span><ClockCircleOutlined style={{ marginRight: 4 }} />{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : '-'}</span>
            </Descriptions.Item>
            <Descriptions.Item label="最后登录">
              {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('zh-CN') : '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 修改个人资料 */}
        <Card
          title={<span><SafetyOutlined style={{ marginRight: 8 }} />修改个人资料</span>}
          className="settings-card"
        >
          <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleUpdateProfile}
            style={{ maxWidth: 480 }}
          >
            <Form.Item
              name="email"
              label="邮箱"
              rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
            >
              <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
            </Form.Item>
            <Form.Item
              name="phone"
              label="手机号"
              rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
                保存修改
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* 修改密码 */}
        <Card
          title={<span><LockOutlined style={{ marginRight: 8 }} />修改密码</span>}
          className="settings-card"
        >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleChangePassword}
            style={{ maxWidth: 480 }}
          >
            <Form.Item
              name="oldPassword"
              label="当前密码"
              rules={[{ required: true, message: '请输入当前密码' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入当前密码" />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码至少6位' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码（至少6位）" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="确认新密码"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '请确认新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请再次输入新密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} danger icon={<LockOutlined />}>
                修改密码
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
