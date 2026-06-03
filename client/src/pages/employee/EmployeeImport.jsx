import React, { useState } from 'react';
import {
  Modal,
  Upload,
  Button,
  Steps,
  Table,
  message,
  Alert,
  Space,
  Tag,
  Progress,
  Divider,
  Typography
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import axios from 'axios';
import './EmployeeImport.css';

const { Text } = Typography;
const { Dragger } = Upload;

const EmployeeImport = ({ visible, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [fileList, setFileList] = useState([]);
  const [parsedData, setParsedData] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const getToken = () => localStorage.getItem('token');

  // 重置状态
  const resetState = () => {
    setCurrentStep(0);
    setFileList([]);
    setParsedData([]);
    setValidationResults([]);
    setImporting(false);
    setImportResults(null);
  };

  // 关闭对话框
  const handleClose = () => {
    resetState();
    onClose();
  };

  // 下载模板
  const downloadTemplate = () => {
    const template = [
      {
        '姓名*': '张三',
        '用户名*': 'zhangsan',
        '密码': '123456',
        '邮箱': 'zhangsan@example.com',
        '手机号': '13800138001',
        '性别': '男',
        '出生日期': '1990-01-01',
        '身份证号': '110101199001011234',
        '部门': '销售部',
        '职位': '销售经理',
        '角色': 'SALES',
        '入职日期': '2024-01-01',
        '状态': '在职',
        '地址': '北京市朝阳区',
        '紧急联系人': '李四',
        '紧急联系电话': '13900139001',
        '学历': '本科',
        '专业': '市场营销',
        '毕业院校': '北京大学',
        '备注': '优秀员工'
      },
      {
        '姓名*': '李四',
        '用户名*': 'lisi',
        '密码': '',
        '邮箱': 'lisi@example.com',
        '手机号': '13800138002',
        '性别': '女',
        '出生日期': '1992-05-15',
        '身份证号': '',
        '部门': '技术部',
        '职位': '工程师',
        '角色': 'OPERATOR',
        '入职日期': '2024-02-01',
        '状态': '在职',
        '地址': '',
        '紧急联系人': '',
        '紧急联系电话': '',
        '学历': '硕士',
        '专业': '计算机科学',
        '毕业院校': '清华大学',
        '备注': ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '员工导入模板');

    // 设置列宽
    ws['!cols'] = [
      { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 25 },
      { wch: 15 }, { wch: 8 }, { wch: 12 }, { wch: 20 },
      { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 },
      { wch: 10 }, { wch: 20 }, { wch: 12 }, { wch: 15 },
      { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
    ];

    XLSX.writeFile(wb, '员工导入模板.xlsx');
    message.success('模板下载成功');
  };

  // 文件上传配置
  const uploadProps = {
    accept: '.xlsx,.xls',
    maxCount: 1,
    fileList,
    beforeUpload: (file) => {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                      file.type === 'application/vnd.ms-excel';
      if (!isExcel) {
        message.error('只能上传 Excel 文件！');
        return false;
      }

      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error('文件大小不能超过 10MB！');
        return false;
      }

      setFileList([file]);
      parseExcelFile(file);
      return false;
    },
    onRemove: () => {
      setFileList([]);
      setParsedData([]);
      setValidationResults([]);
      setCurrentStep(0);
    }
  };

  // 解析Excel文件
  const parseExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          message.error('Excel 文件为空');
          return;
        }

        // 转换数据格式
        const employees = jsonData.map((row, index) => ({
          rowIndex: index + 2, // Excel行号（从2开始，因为第1行是表头）
          name: row['姓名*'] || row['姓名'],
          username: row['用户名*'] || row['用户名'],
          password: row['密码'] || '',
          email: row['邮箱'] || '',
          phone: row['手机号'] || '',
          gender: parseGender(row['性别']),
          birthDate: row['出生日期'] || '',
          idCard: row['身份证号'] || '',
          department: row['部门'] || '',
          position: row['职位'] || '',
          role: row['角色'] || '',
          hireDate: row['入职日期'] || '',
          status: parseStatus(row['状态']),
          address: row['地址'] || '',
          emergencyContact: row['紧急联系人'] || '',
          emergencyPhone: row['紧急联系电话'] || '',
          education: parseEducation(row['学历']),
          major: row['专业'] || '',
          graduateSchool: row['毕业院校'] || '',
          remark: row['备注'] || ''
        }));

        setParsedData(employees);
        validateData(employees);
        setCurrentStep(1);
        message.success(`成功解析 ${employees.length} 条员工数据`);
      } catch (error) {
        console.error('解析文件失败:', error);
        message.error('解析文件失败，请检查文件格式');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // 解析性别
  const parseGender = (value) => {
    if (!value) return undefined;
    const genderMap = {
      '男': 'male',
      '女': 'female',
      '其他': 'other',
      'male': 'male',
      'female': 'female',
      'other': 'other'
    };
    return genderMap[value];
  };

  // 解析状态
  const parseStatus = (value) => {
    if (!value) return 'active';
    const statusMap = {
      '在职': 'active',
      '离职': 'inactive',
      '停用': 'suspended',
      'active': 'active',
      'inactive': 'inactive',
      'suspended': 'suspended'
    };
    return statusMap[value] || 'active';
  };

  // 解析学历
  const parseEducation = (value) => {
    if (!value) return undefined;
    const educationMap = {
      '小学': 'primary',
      '初中': 'junior',
      '高中': 'senior',
      '大专': 'associate',
      '本科': 'bachelor',
      '硕士': 'master',
      '博士': 'doctor'
    };
    return educationMap[value] || value;
  };

  // 验证数据
  const validateData = (employees) => {
    const results = employees.map(emp => {
      const errors = [];
      const warnings = [];

      // 必填字段验证
      if (!emp.name || emp.name.trim() === '') {
        errors.push('姓名不能为空');
      } else if (emp.name.length < 2 || emp.name.length > 50) {
        errors.push('姓名长度必须在2-50个字符之间');
      }

      if (!emp.username || emp.username.trim() === '') {
        errors.push('用户名不能为空');
      } else if (emp.username.length < 3 || emp.username.length > 50) {
        errors.push('用户名长度必须在3-50个字符之间');
      }

      // 邮箱格式验证
      if (emp.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emp.email)) {
        errors.push('邮箱格式不正确');
      }

      // 手机号格式验证
      if (emp.phone && !/^1[3-9]\d{9}$/.test(emp.phone)) {
        errors.push('手机号格式不正确');
      }

      // 身份证号格式验证
      if (emp.idCard && !/^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(emp.idCard)) {
        errors.push('身份证号格式不正确');
      }

      // 警告信息
      if (!emp.password) {
        warnings.push('未设置密码，将使用默认密码：123456');
      }

      if (!emp.email) {
        warnings.push('未填写邮箱');
      }

      return {
        ...emp,
        valid: errors.length === 0,
        errors,
        warnings
      };
    });

    setValidationResults(results);
  };

  // 执行导入
  const handleImport = async () => {
    const validData = validationResults.filter(item => item.valid);

    if (validData.length === 0) {
      message.error('没有有效的数据可以导入');
      return;
    }

    setImporting(true);
    try {
      // 准备导入数据
      const employeesToImport = validData.map(item => ({
        name: item.name,
        username: item.username,
        password: item.password || '123456',
        email: item.email || undefined,
        phone: item.phone || undefined,
        gender: item.gender,
        birthDate: item.birthDate || undefined,
        idCard: item.idCard || undefined,
        position: item.position || undefined,
        hireDate: item.hireDate || undefined,
        status: item.status || 'active',
        address: item.address || undefined,
        emergencyContact: item.emergencyContact || undefined,
        emergencyPhone: item.emergencyPhone || undefined,
        education: item.education,
        major: item.major || undefined,
        graduateSchool: item.graduateSchool || undefined,
        remark: item.remark || undefined
      }));

      const response = await axios.post(
        `${API_BASE_URL}/employees/import`,
        { employees: employeesToImport },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );

      if (response.data.success) {
        setImportResults(response.data.data);
        setCurrentStep(2);
        message.success(response.data.message);
      }
    } catch (error) {
      console.error('导入失败:', error);
      message.error(error.response?.data?.message || '导入失败');
    } finally {
      setImporting(false);
    }
  };

  // 完成导入
  const handleFinish = () => {
    if (importResults && importResults.success.length > 0) {
      onSuccess();
    }
    handleClose();
  };

  // 验证结果表格列
  const validationColumns = [
    {
      title: '行号',
      dataIndex: 'rowIndex',
      width: 60,
      fixed: 'left'
    },
    {
      title: '姓名',
      dataIndex: 'name',
      width: 100,
      fixed: 'left'
    },
    {
      title: '用户名',
      dataIndex: 'username',
      width: 120
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      width: 180,
      render: (text) => text || '-'
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: '部门',
      dataIndex: 'department',
      width: 100,
      render: (text) => text || '-'
    },
    {
      title: '职位',
      dataIndex: 'position',
      width: 100,
      render: (text) => text || '-'
    },
    {
      title: '验证结果',
      key: 'validation',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.valid ? (
            <Tag icon={<CheckCircleOutlined />} color="success">验证通过</Tag>
          ) : (
            <Tag icon={<CloseCircleOutlined />} color="error">验证失败</Tag>
          )}
          {record.warnings.length > 0 && (
            <Tag icon={<WarningOutlined />} color="warning">有警告</Tag>
          )}
        </Space>
      )
    },
    {
      title: '错误/警告',
      key: 'messages',
      width: 250,
      render: (_, record) => (
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          {record.errors.map((error, index) => (
            <Text key={`error-${index}`} type="danger" style={{ fontSize: '12px' }}>
              • {error}
            </Text>
          ))}
          {record.warnings.map((warning, index) => (
            <Text key={`warning-${index}`} type="warning" style={{ fontSize: '12px' }}>
              • {warning}
            </Text>
          ))}
        </Space>
      )
    }
  ];

  // 导入结果统计
  const renderImportResults = () => {
    if (!importResults) return null;

    const { success, failed } = importResults;
    const total = success.length + failed.length;
    const successRate = total > 0 ? ((success.length / total) * 100).toFixed(1) : 0;

    return (
      <div className="import-results">
        <Alert
          message="导入完成"
          description={
            <div>
              <p>成功导入 {success.length} 条，失败 {failed.length} 条</p>
              <Progress percent={parseFloat(successRate)} status={failed.length > 0 ? 'normal' : 'success'} />
            </div>
          }
          type={failed.length > 0 ? 'warning' : 'success'}
          showIcon
          style={{ marginBottom: 16 }}
        />

        {success.length > 0 && (
          <>
            <Divider orientation="left">成功导入的员工</Divider>
            <Table
              dataSource={success}
              columns={[
                { title: '工号', dataIndex: 'employeeNo', width: 120 },
                { title: '姓名', dataIndex: 'name', width: 100 }
              ]}
              pagination={false}
              size="small"
              scroll={{ y: 200 }}
            />
          </>
        )}

        {failed.length > 0 && (
          <>
            <Divider orientation="left">导入失败的员工</Divider>
            <Table
              dataSource={failed}
              columns={[
                { 
                  title: '姓名', 
                  dataIndex: ['data', 'name'], 
                  width: 100 
                },
                { 
                  title: '用户名', 
                  dataIndex: ['data', 'username'], 
                  width: 120 
                },
                { 
                  title: '失败原因', 
                  dataIndex: 'error',
                  render: (text) => <Text type="danger">{text}</Text>
                }
              ]}
              pagination={false}
              size="small"
              scroll={{ y: 200 }}
            />
          </>
        )}
      </div>
    );
  };

  // 步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="upload-step">
            <Alert
              message="导入说明"
              description={
                <div>
                  <p>1. 下载导入模板，按照模板格式填写员工信息</p>
                  <p>2. 必填字段：姓名、用户名</p>
                  <p>3. 如果不填写密码，系统将使用默认密码：123456</p>
                  <p>4. 如果不填写工号，系统将自动生成</p>
                  <p>5. 支持 .xlsx 和 .xls 格式，文件大小不超过 10MB</p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Space style={{ marginBottom: 16 }}>
              <Button
                icon={<DownloadOutlined />}
                onClick={downloadTemplate}
              >
                下载导入模板
              </Button>
            </Space>

            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持 Excel 文件（.xlsx, .xls），文件大小不超过 10MB
              </p>
            </Dragger>
          </div>
        );

      case 1:
        const validCount = validationResults.filter(item => item.valid).length;
        const invalidCount = validationResults.length - validCount;

        return (
          <div className="validation-step">
            <Alert
              message={`数据验证完成：共 ${validationResults.length} 条，有效 ${validCount} 条，无效 ${invalidCount} 条`}
              type={invalidCount > 0 ? 'warning' : 'success'}
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Table
              dataSource={validationResults}
              columns={validationColumns}
              rowKey="rowIndex"
              pagination={{ pageSize: 10 }}
              scroll={{ x: 1200, y: 400 }}
              size="small"
              rowClassName={(record) => record.valid ? '' : 'invalid-row'}
            />
          </div>
        );

      case 2:
        return renderImportResults();

      default:
        return null;
    }
  };

  return (
    <Modal
      title="批量导入员工"
      open={visible}
      onCancel={handleClose}
      width={1000}
      footer={
        <Space>
          {currentStep === 0 && (
            <Button onClick={handleClose}>取消</Button>
          )}
          {currentStep === 1 && (
            <>
              <Button onClick={() => setCurrentStep(0)}>上一步</Button>
              <Button
                type="primary"
                onClick={handleImport}
                loading={importing}
                disabled={validationResults.filter(item => item.valid).length === 0}
              >
                开始导入 ({validationResults.filter(item => item.valid).length} 条)
              </Button>
            </>
          )}
          {currentStep === 2 && (
            <Button type="primary" onClick={handleFinish}>
              完成
            </Button>
          )}
        </Space>
      }
    >
      <Steps 
        current={currentStep} 
        style={{ marginBottom: 24 }}
        items={[
          { title: '上传文件' },
          { title: '验证数据' },
          { title: '导入结果' }
        ]}
      />

      {renderStepContent()}
    </Modal>
  );
};

export default EmployeeImport;

