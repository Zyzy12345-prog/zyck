import React, { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Space,
  Tag,
  Badge,
  message,
  Modal,
  Spin
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  LockOutlined,
  DeleteOutlined,
  UnlockOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { employeeAPI } from '../../services/api';
import './EmployeeDetail.css';

const EmployeeDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [employee, setEmployee] = useState(null);

  useEffect(() => {
    fetchEmployeeDetail();
  }, [id]);

  // 获取员工详情
  const fetchEmployeeDetail = async () => {
    setLoading(true);
    try {
      const response = await employeeAPI.getEmployee(id);

      if (response.success) {
        setEmployee(response.data);
      }
    } catch (error) {
      message.error(error.response?.data?.message || '获取员工信息失败');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  // 重置密码
  const handleResetPassword = () => {
    Modal.confirm({
      title: '确认重置密码',
      content: `确定要重置员工 ${employee.name} 的密码吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await employeeAPI.resetPassword(id);

          if (response.success) {
            Modal.info({
              title: '密码重置成功',
              content: (
                <div>
                  <p>新密码：<strong style={{ color: '#1890ff', fontSize: '16px' }}>{response.data.data.newPassword}</strong></p>
                  <p style={{ color: '#999', fontSize: '12px', marginTop: '10px' }}>
                    请妥善保管并告知员工，建议首次登录后修改密码。
                  </p>
                </div>
              )
            });
          }
        } catch (error) {
          message.error(error.response?.data?.message || '重置失败');
        }
      }
    });
  };

  // 修改状态
  const handleChangeStatus = (newStatus) => {
    const statusText = {
      active: '激活',
      inactive: '停用',
      suspended: '暂停'
    };

    Modal.confirm({
      title: `确认${statusText[newStatus]}员工`,
      content: `确定要${statusText[newStatus]}员工 ${employee.name} 吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await employeeAPI.updateEmployeeStatus(id, newStatus);

          if (response.success) {
            message.success(`员工已${statusText[newStatus]}`);
            fetchEmployeeDetail();
          }
        } catch (error) {
          message.error(error.response?.data?.message || '操作失败');
        }
      }
    });
  };

  // 删除员工
  const handleDelete = () => {
    Modal.confirm({
      title: '确认停用员工',
      content: `确定要停用员工 ${employee.name} 吗？停用后该员工将无法登录系统。`,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await employeeAPI.deleteEmployee(id);

          if (response.success) {
            message.success('员工已停用');
            navigate('/employees');
          }
        } catch (error) {
          message.error(error.response?.data?.message || '停用失败');
        }
      }
    });
  };

  // 获取状态标签
  const getStatusBadge = (status) => {
    const statusMap = {
      active: { status: 'success', text: '在职' },
      inactive: { status: 'default', text: '离职' },
      suspended: { status: 'warning', text: '停用' }
    };
    const config = statusMap[status] || { status: 'default', text: status };
    return <Badge status={config.status} text={config.text} />;
  };

  // 获取性别文本
  const getGenderText = (gender) => {
    const genderMap = {
      male: '男',
      female: '女',
      other: '其他'
    };
    return genderMap[gender] || '-';
  };

  // 获取学历文本
  const getEducationText = (education) => {
    const educationMap = {
      primary: '小学',
      junior: '初中',
      senior: '高中',
      associate: '大专',
      bachelor: '本科',
      master: '硕士',
      doctor: '博士'
    };
    return educationMap[education] || '-';
  };

  // 格式化日期
  const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString('zh-CN') : '-';
  };

  // 格式化日期时间
  const formatDateTime = (date) => {
    return date ? new Date(date).toLocaleString('zh-CN') : '-';
  };

  if (loading) {
    return (
      <div className="employee-detail-container" style={{ textAlign: 'center', padding: '100px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <div className="employee-detail-container">
      <Card
        title={
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/employees')}
            />
            <span>员工详情</span>
          </Space>
        }
        extra={
          <Space>
            {employee.status === 'active' && (
              <Button
                icon={<LockOutlined />}
                onClick={() => handleChangeStatus('suspended')}
              >
                暂停账号
              </Button>
            )}
            {employee.status === 'suspended' && (
              <Button
                icon={<UnlockOutlined />}
                onClick={() => handleChangeStatus('active')}
              >
                激活账号
              </Button>
            )}
            <Button
              icon={<LockOutlined />}
              onClick={handleResetPassword}
            >
              重置密码
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/employees/${id}/edit`)}
            >
              编辑
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleDelete}
            >
              停用
            </Button>
          </Space>
        }
      >
        <Descriptions title="基本信息" bordered column={2}>
          <Descriptions.Item label="工号">{employee.employeeNo}</Descriptions.Item>
          <Descriptions.Item label="姓名">{employee.name}</Descriptions.Item>
          <Descriptions.Item label="性别">{getGenderText(employee.gender)}</Descriptions.Item>
          <Descriptions.Item label="出生日期">{formatDate(employee.birthDate)}</Descriptions.Item>
          <Descriptions.Item label="手机号">{employee.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="邮箱">{employee.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="地址" span={2}>{employee.address || '-'}</Descriptions.Item>
        </Descriptions>

        <Descriptions title="账号信息" bordered column={2} style={{ marginTop: 24 }}>
          <Descriptions.Item label="用户名">{employee.username}</Descriptions.Item>
          <Descriptions.Item label="状态">{getStatusBadge(employee.status)}</Descriptions.Item>
          <Descriptions.Item label="最后登录时间">{formatDateTime(employee.lastLoginAt)}</Descriptions.Item>
          <Descriptions.Item label="最后登录IP">{employee.lastLoginIp || '-'}</Descriptions.Item>
        </Descriptions>

        <Descriptions title="职位信息" bordered column={2} style={{ marginTop: 24 }}>
          <Descriptions.Item label="部门">
            {employee.department?.name || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="职位">{employee.position || '-'}</Descriptions.Item>
          <Descriptions.Item label="角色">
            {employee.role?.name ? <Tag color="blue">{employee.role.name}</Tag> : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="入职日期">{formatDate(employee.hireDate)}</Descriptions.Item>
          <Descriptions.Item label="离职日期">{formatDate(employee.resignDate)}</Descriptions.Item>
        </Descriptions>

        <Descriptions title="教育背景" bordered column={2} style={{ marginTop: 24 }}>
          <Descriptions.Item label="学历">{getEducationText(employee.education)}</Descriptions.Item>
          <Descriptions.Item label="专业">{employee.major || '-'}</Descriptions.Item>
          <Descriptions.Item label="毕业院校" span={2}>{employee.graduateSchool || '-'}</Descriptions.Item>
        </Descriptions>

        <Descriptions title="紧急联系人" bordered column={2} style={{ marginTop: 24 }}>
          <Descriptions.Item label="联系人姓名">{employee.emergencyContact || '-'}</Descriptions.Item>
          <Descriptions.Item label="联系电话">{employee.emergencyPhone || '-'}</Descriptions.Item>
        </Descriptions>

        {(employee.workExperience || employee.remark) && (
          <Descriptions title="其他信息" bordered column={1} style={{ marginTop: 24 }}>
            {employee.workExperience && (
              <Descriptions.Item label="工作经历">
                <div style={{ whiteSpace: 'pre-wrap' }}>{employee.workExperience}</div>
              </Descriptions.Item>
            )}
            {employee.remark && (
              <Descriptions.Item label="备注">
                <div style={{ whiteSpace: 'pre-wrap' }}>{employee.remark}</div>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}

        <Descriptions title="系统信息" bordered column={2} style={{ marginTop: 24 }}>
          <Descriptions.Item label="创建时间">{formatDateTime(employee.created_at)}</Descriptions.Item>
          <Descriptions.Item label="更新时间">{formatDateTime(employee.updated_at)}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default EmployeeDetail;








