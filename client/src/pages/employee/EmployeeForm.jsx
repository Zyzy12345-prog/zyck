import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  message,
  Row,
  Col,
  Divider,
  Radio
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import './EmployeeForm.css';

const { Option } = Select;
const { TextArea } = Input;

const EmployeeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 选项数据
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const getToken = () => localStorage.getItem('token');

  const isEditMode = !!id;

  useEffect(() => {
    fetchOptions();
    if (isEditMode) {
      fetchEmployeeDetail();
    }
  }, [id]);

  // 获取选项数据
  const fetchOptions = async () => {
    try {
      const [deptRes, roleRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/employees/options/departments`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        }),
        axios.get(`${API_BASE_URL}/employees/options/roles`, {
          headers: { Authorization: `Bearer ${getToken()}` }
        })
      ]);

      if (deptRes.data.success) setDepartments(deptRes.data.data);
      if (roleRes.data.success) setRoles(roleRes.data.data);
    } catch (error) {
      console.error('获取选项数据失败:', error);
    }
  };

  // 获取员工详情
  const fetchEmployeeDetail = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/employees/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      if (response.data.success) {
        const employee = response.data.data;
        form.setFieldsValue({
          ...employee,
          departmentId: employee.department?.id,
          roleId: employee.role?.id,
          hireDate: employee.hireDate ? dayjs(employee.hireDate) : null,
          birthDate: employee.birthDate ? dayjs(employee.birthDate) : null,
          resignDate: employee.resignDate ? dayjs(employee.resignDate) : null
        });
      }
    } catch (error) {
      message.error(error.response?.data?.message || '获取员工信息失败');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  // 提交表单
  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      // 转换日期格式
      const data = {
        ...values,
        hireDate: values.hireDate ? values.hireDate.format('YYYY-MM-DD') : null,
        birthDate: values.birthDate ? values.birthDate.format('YYYY-MM-DD') : null,
        resignDate: values.resignDate ? values.resignDate.format('YYYY-MM-DD') : null
      };

      let response;
      if (isEditMode) {
        response = await axios.put(`${API_BASE_URL}/employees/${id}`, data, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
      } else {
        response = await axios.post(`${API_BASE_URL}/employees`, data, {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
      }

      if (response.data.success) {
        message.success(isEditMode ? '更新员工信息成功' : '创建员工成功');
        navigate('/employees');
      }
    } catch (error) {
      message.error(error.response?.data?.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="employee-form-container">
      <Card
        title={
          <Space>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/employees')}
            />
            <span>{isEditMode ? '编辑员工' : '新增员工'}</span>
          </Space>
        }
        loading={loading}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Divider orientation="left">基本信息</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="工号"
                name="employeeNo"
                rules={[{ required: !isEditMode, message: '请输入工号' }]}
                tooltip="留空将自动生成"
              >
                <Input placeholder="留空自动生成" disabled={isEditMode} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="姓名"
                name="name"
                rules={[
                  { required: true, message: '请输入姓名' },
                  { min: 2, max: 50, message: '姓名长度为2-50个字符' }
                ]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="性别"
                name="gender"
              >
                <Radio.Group>
                  <Radio value="male">男</Radio>
                  <Radio value="female">女</Radio>
                  <Radio value="other">其他</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="出生日期"
                name="birthDate"
              >
                <DatePicker style={{ width: '100%' }} placeholder="选择出生日期" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="身份证号"
                name="idCard"
                rules={[
                  {
                    pattern: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/,
                    message: '身份证号格式不正确'
                  }
                ]}
              >
                <Input placeholder="请输入身份证号" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="手机号"
                name="phone"
                rules={[
                  {
                    pattern: /^1[3-9]\d{9}$/,
                    message: '手机号格式不正确'
                  }
                ]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="邮箱"
                name="email"
                rules={[
                  { type: 'email', message: '邮箱格式不正确' }
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="地址"
                name="address"
              >
                <Input placeholder="请输入地址" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">账号信息</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="用户名"
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, max: 50, message: '用户名长度为3-50个字符' }
                ]}
              >
                <Input placeholder="请输入用户名" disabled={isEditMode} />
              </Form.Item>
            </Col>
            {!isEditMode && (
              <Col xs={24} sm={12} md={8}>
                <Form.Item
                  label="密码"
                  name="password"
                  rules={[
                    { min: 6, message: '密码至少6个字符' }
                  ]}
                  tooltip="留空将使用默认密码：123456"
                >
                  <Input.Password placeholder="留空使用默认密码" />
                </Form.Item>
              </Col>
            )}
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="状态"
                name="status"
                initialValue="active"
              >
                <Select>
                  <Option value="active">在职</Option>
                  <Option value="inactive">离职</Option>
                  <Option value="suspended">停用</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">职位信息</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="部门"
                name="departmentId"
              >
                <Select placeholder="选择部门" allowClear>
                  {departments.map(dept => (
                    <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="职位"
                name="position"
              >
                <Input placeholder="请输入职位" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="角色"
                name="roleId"
              >
                <Select placeholder="选择角色" allowClear>
                  {roles.map(role => (
                    <Option key={role.id} value={role.id}>{role.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="入职日期"
                name="hireDate"
              >
                <DatePicker style={{ width: '100%' }} placeholder="选择入职日期" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="离职日期"
                name="resignDate"
              >
                <DatePicker style={{ width: '100%' }} placeholder="选择离职日期" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">教育背景</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="学历"
                name="education"
              >
                <Select placeholder="选择学历" allowClear>
                  <Option value="primary">小学</Option>
                  <Option value="junior">初中</Option>
                  <Option value="senior">高中</Option>
                  <Option value="associate">大专</Option>
                  <Option value="bachelor">本科</Option>
                  <Option value="master">硕士</Option>
                  <Option value="doctor">博士</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="专业"
                name="major"
              >
                <Input placeholder="请输入专业" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="毕业院校"
                name="graduateSchool"
              >
                <Input placeholder="请输入毕业院校" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">紧急联系人</Divider>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="紧急联系人"
                name="emergencyContact"
              >
                <Input placeholder="请输入紧急联系人姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                label="紧急联系电话"
                name="emergencyPhone"
              >
                <Input placeholder="请输入紧急联系电话" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">其他信息</Divider>
          <Row gutter={16}>
            <Col xs={24}>
              <Form.Item
                label="工作经历"
                name="workExperience"
              >
                <TextArea rows={4} placeholder="请输入工作经历" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item
                label="备注"
                name="remark"
              >
                <TextArea rows={3} placeholder="请输入备注信息" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={submitting}
              >
                {isEditMode ? '保存修改' : '创建员工'}
              </Button>
              <Button onClick={() => navigate('/employees')}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EmployeeForm;








