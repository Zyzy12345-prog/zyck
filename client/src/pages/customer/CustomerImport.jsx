import React, { useState } from 'react';
import { 
  Modal, 
  Steps, 
  Upload, 
  Button, 
  Table, 
  message, 
  Alert,
  Space,
  Row,
  Col,
  Progress,
  Result,
  Tooltip
} from 'antd';
import {
  InboxOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  WarningOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import { clientAPI, industryAPI } from '../../services/api';
import IndustryMatchDisplay from '../../components/IndustryMatchDisplay';
import IndustrySelector from '../../components/IndustrySelector';
import './CustomerImport.css';

const { Dragger } = Upload;

// 字段映射配置
const FIELD_MAPPING = {
  companyName: '公司名称',
  contactPerson: '联系人',
  phone: '电话',
  email: '邮箱',
  industry: '行业',
  registeredCapital: '注册资本',
  remarks: '备注'
};

const CustomerImport = ({ visible, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [fileData, setFileData] = useState(null);
  const [excelColumns, setExcelColumns] = useState([]);
  const [fieldMapping, setFieldMapping] = useState({});
  const [previewData, setPreviewData] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [editingRow, setEditingRow] = useState(null);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState(null);

  // 重置状态
  const resetState = () => {
    setCurrentStep(0);
    setFileData(null);
    setExcelColumns([]);
    setFieldMapping({});
    setPreviewData([]);
    setValidationResults([]);
    setEditingRow(null);
    setImporting(false);
    setImportProgress({ current: 0, total: 0 });
    setImportResult(null);
  };

  // 关闭模态框
  const handleClose = () => {
    resetState();
    onClose();
  };

  // 智能字段映射
  const autoMapFields = (headers) => {
    const mapping = {};
    const mappingRules = {
      companyName: ['公司名称', '客户名称', '企业名称', '公司'],
      contactPerson: ['联系人', '联系人姓名', '负责人'],
      phone: ['电话', '联系电话', '手机'],
      email: ['邮箱', '电子邮箱'],
      industry: ['行业', '所属行业'],
      registeredCapital: ['注册资本', '注册资金'],
      remarks: ['备注', '说明']
    };

    Object.keys(mappingRules).forEach(systemField => {
      const possibleNames = mappingRules[systemField];
      for (const header of headers) {
        const normalizedHeader = header.toString().trim().toLowerCase();
        for (const possibleName of possibleNames) {
          if (normalizedHeader === possibleName.toLowerCase()) {
            mapping[systemField] = header;
            break;
          }
        }
        if (mapping[systemField]) break;
      }
    });

    return mapping;
  };

  // 上传文件
  const handleFileUpload = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) {
          message.error('Excel文件数据不足');
          return;
        }

        const headers = jsonData[0];
        setExcelColumns(headers);

        const rows = jsonData.slice(1)
          .filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''))
          .map((row, index) => {
            const rowData = { key: index };
            headers.forEach((header, colIndex) => {
              rowData[header] = row[colIndex];
            });
            return rowData;
          });

        if (rows.length === 0) {
          message.error('Excel文件中没有有效数据');
          return;
        }

        setFileData(rows);
        const autoMapping = autoMapFields(headers);
        setFieldMapping(autoMapping);
        
        message.success(`文件上传成功！共 ${rows.length} 条数据`);
        setCurrentStep(1);
      } catch (error) {
        message.error('文件解析失败：' + error.message);
      }
    };

    reader.readAsArrayBuffer(file);
    return false;
  };

  // 字段映射
  const handleMappingChange = (systemField, excelColumn) => {
    setFieldMapping({
      ...fieldMapping,
      [systemField]: excelColumn
    });
  };

  // 数据验证
  const validateRow = (row, index) => {
    const errors = [];
    
    if (!row.companyName || row.companyName.toString().trim() === '') {
      errors.push({ field: 'companyName', message: '公司名称不能为空', severity: 'error' });
    }
    
    if (!row.phone || row.phone.toString().trim() === '') {
      errors.push({ field: 'phone', message: '联系电话不能为空', severity: 'error' });
    }
    
    return {
      rowIndex: index,
      rowNumber: index + 2,
      valid: errors.filter(e => e.severity === 'error').length === 0,
      errors: errors
    };
  };

  // 预览数据
  const handlePreview = async () => {
    if (!fieldMapping.companyName) {
      message.error('请至少映射"公司名称"字段');
      return;
    }

    const mappedData = fileData.map((row, index) => {
      const mappedRow = { key: index };
      Object.keys(fieldMapping).forEach(systemField => {
        const excelColumn = fieldMapping[systemField];
        mappedRow[systemField] = row[excelColumn];
      });
      return mappedRow;
    });

    // 智能匹配行业
    await matchIndustries(mappedData);

    // 验证数据
    const validations = mappedData.map((row, index) => validateRow(row, index));
    setValidationResults(validations);
    
    const errorCount = validations.filter(v => !v.valid).length;
    if (errorCount > 0) {
      message.warning(`发现 ${errorCount} 条数据存在错误`);
    } else {
      message.success('所有数据验证通过');
    }

    setPreviewData(mappedData);
    setCurrentStep(2);
  };

  // 智能匹配行业
  const matchIndustries = async (data) => {
    try {
      const industryTexts = data
        .map(item => item.industry)
        .filter(text => text && text.trim() !== '');

      if (industryTexts.length === 0) return;

      message.loading('正在智能匹配行业...', 0);
      
      const response = await industryAPI.batchMatchIndustries(industryTexts, 0.7);
      message.destroy();

      if (response.success) {
        const results = response.data.results;
        const statistics = response.data.statistics;

        let matchIndex = 0;
        data.forEach(item => {
          if (item.industry && item.industry.trim() !== '') {
            const matchResult = results[matchIndex];
            
            if (matchResult.matched) {
              item.industryId = matchResult.matchedIndustry.id;
              item.industryName = matchResult.matchedIndustry.name;
              item.matchType = matchResult.matchType;
              item.matchConfidence = matchResult.confidence;
            }
            
            item.originalIndustry = item.industry;
            matchIndex++;
          }
        });

        message.success(
          `行业匹配完成！成功 ${statistics.matched} 条，未匹配 ${statistics.unmatched} 条`
        );
      }
    } catch (error) {
      message.error('行业匹配失败：' + (error.message || '未知错误'));
    }
  };

  // 打开行业选择器
  const handleOpenSelector = (record) => {
    setEditingRow(record);
    setSelectorVisible(true);
  };

  // 选择行业
  const handleSelectIndustry = (industry) => {
    if (editingRow) {
      const newData = [...previewData];
      const index = newData.findIndex(item => item.key === editingRow.key);
      if (index > -1) {
        newData[index] = {
          ...newData[index],
          industryId: industry.id,
          industryName: industry.name,
          matchType: 'manual',
          matchConfidence: 1.0
        };
        setPreviewData(newData);
      }
    }
  };

  // 执行导入
  const handleImport = async () => {
    const hasErrors = validationResults.some(v => !v.valid);
    if (hasErrors) {
      message.error('存在验证错误，请修正后再导入');
      return;
    }

    setImporting(true);
    setCurrentStep(3);

    try {
      const results = {
        total: previewData.length,
        success: 0,
        failed: 0,
        errors: []
      };

      setImportProgress({ current: 0, total: previewData.length });

      for (let i = 0; i < previewData.length; i++) {
        try {
          const item = previewData[i];
          const clientData = { ...item };
          delete clientData.key;
          delete clientData.matchType;
          delete clientData.matchConfidence;
          delete clientData.industryName;
          
          await clientAPI.createClient(clientData);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: i + 2,
            data: previewData[i].companyName,
            error: error.message || '未知错误'
          });
        }
        
        setImportProgress({
          current: i + 1,
          total: previewData.length
        });
      }

      setImportResult(results);
      
      if (results.failed === 0) {
        message.success(`导入完成！成功导入 ${results.success} 条数据`);
      } else {
        message.warning(`导入完成！成功 ${results.success} 条，失败 ${results.failed} 条`);
      }
      
      if (results.success > 0) {
        onSuccess();
      }
    } catch (error) {
      message.error('导入失败：' + error.message);
    } finally {
      setImporting(false);
    }
  };

  // 下载模板
  const handleDownloadTemplate = () => {
    const template = [
      ['公司名称', '联系人', '电话', '邮箱', '行业', '注册资本', '备注'],
      ['示例科技有限公司', '张三', '13800138000', 'zhangsan@example.com', '科研', '1000000', '这是一个示例']
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '客户导入模板');
    XLSX.writeFile(wb, '客户导入模板.xlsx');
    message.success('模板下载成功');
  };

  // 预览表格列
  const previewColumns = [
    {
      title: '行号',
      key: 'rowNumber',
      width: 70,
      fixed: 'left',
      render: (_, record) => {
        const validation = validationResults[record.key];
        return validation ? validation.rowNumber : record.key + 2;
      }
    },
    {
      title: '状态',
      key: 'status',
      width: 80,
      fixed: 'left',
      render: (_, record) => {
        const validation = validationResults[record.key];
        if (!validation) return null;
        
        if (validation.valid) {
          return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />;
        }
        
        return (
          <Tooltip title={validation.errors.map(e => e.message).join(', ')}>
            <WarningOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />
          </Tooltip>
        );
      }
    },
    {
      title: '公司名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 200
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      width: 120,
      render: (text) => text || '-'
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 150
    },
    {
      title: '行业匹配',
      key: 'industryMatch',
      width: 300,
      render: (_, record) => (
        <IndustryMatchDisplay
          originalText={record.originalIndustry || record.industry}
          matchedIndustry={record.industryName}
          matchType={record.matchType}
          confidence={record.matchConfidence}
          onEdit={() => handleOpenSelector(record)}
          compact={true}
        />
      )
    }
  ];

  // 步骤配置
  const steps = [
    { title: '上传文件' },
    { title: '字段映射' },
    { title: '预览确认' },
    { title: '导入结果' }
  ];

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="upload-step">
            <Alert
              message="上传说明"
              description={
                <div>
                  <p>1. 支持 Excel（.xlsx、.xls）文件</p>
                  <p>2. 文件第一行必须是表头</p>
                  <p>3. 至少包含"公司名称"和"电话"列</p>
                  <p>4. 建议先下载模板，按模板格式填写数据</p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownloadTemplate}
              style={{ marginBottom: 16 }}
            >
              下载导入模板
            </Button>
            
            <Dragger
              accept=".xlsx,.xls"
              beforeUpload={handleFileUpload}
              maxCount={1}
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">支持 .xlsx、.xls 格式的文件</p>
            </Dragger>
          </div>
        );

      case 1:
        return (
          <div className="mapping-step">
            <Alert
              message="字段映射"
              description="请将 Excel 列映射到系统字段，标记 * 的为必填字段"
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
            
            <Table
              dataSource={Object.keys(FIELD_MAPPING).map(field => ({
                key: field,
                systemField: field,
                systemFieldName: FIELD_MAPPING[field],
                required: field === 'companyName' || field === 'phone',
                excelColumn: fieldMapping[field]
              }))}
              columns={[
                {
                  title: '系统字段',
                  dataIndex: 'systemFieldName',
                  key: 'systemFieldName',
                  render: (text, record) => (
                    <span>
                      {record.required && <span style={{ color: 'red' }}>* </span>}
                      {text}
                    </span>
                  )
                },
                {
                  title: 'Excel 列',
                  dataIndex: 'excelColumn',
                  key: 'excelColumn',
                  render: (value, record) => (
                    <select
                      style={{ width: '100%', padding: '4px 8px', borderRadius: 4, border: '1px solid #d9d9d9' }}
                      value={value || ''}
                      onChange={(e) => handleMappingChange(record.systemField, e.target.value || undefined)}
                    >
                      <option value="">请选择</option>
                      {excelColumns.map(col => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  )
                }
              ]}
              pagination={false}
              size="small"
            />

            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setCurrentStep(0)}>上一步</Button>
                <Button type="primary" onClick={handlePreview}>
                  下一步：预览数据
                </Button>
              </Space>
            </div>
          </div>
        );

      case 2:
        const validCount = validationResults.filter(v => v.valid).length;
        const errorCount = validationResults.filter(v => !v.valid).length;
        
        return (
          <div className="preview-step">
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Alert message="总数据量" description={previewData.length} type="info" />
              </Col>
              <Col span={8}>
                <Alert message="验证通过" description={validCount} type="success" />
              </Col>
              <Col span={8}>
                <Alert message="存在错误" description={errorCount} type="error" />
              </Col>
            </Row>

            <Table
              columns={previewColumns}
              dataSource={previewData}
              pagination={{ pageSize: 20 }}
              scroll={{ x: 1200 }}
              size="small"
            />
            
            <div style={{ marginTop: 24, textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setCurrentStep(1)}>上一步</Button>
                <Button 
                  type="primary" 
                  onClick={handleImport}
                  disabled={errorCount > 0}
                >
                  开始导入
                </Button>
              </Space>
            </div>
          </div>
        );

      case 3:
        if (importing) {
          const percent = importProgress.total > 0 
            ? Math.round((importProgress.current / importProgress.total) * 100)
            : 0;
            
          return (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Progress
                type="circle"
                percent={percent}
                status="active"
              />
              <p style={{ marginTop: 24 }}>
                正在导入数据，请稍候... ({importProgress.current}/{importProgress.total})
              </p>
            </div>
          );
        }

        if (importResult) {
          return (
            <Result
              status={importResult.failed === 0 ? 'success' : 'warning'}
              title="导入完成"
              subTitle={`共 ${importResult.total} 条数据，成功 ${importResult.success} 条，失败 ${importResult.failed} 条`}
              extra={[
                <Button type="primary" key="close" onClick={handleClose}>
                  关闭
                </Button>
              ]}
            />
          );
        }

        return null;

      default:
        return null;
    }
  };

  return (
    <>
      <Modal
        title="批量导入客户"
        open={visible}
        onCancel={handleClose}
        footer={null}
        width={1100}
        destroyOnHidden
      >
        <Steps current={currentStep} items={steps} style={{ marginBottom: 32 }} />
        <div className="step-content">
          {renderStepContent()}
        </div>
      </Modal>

      <IndustrySelector
        visible={selectorVisible}
        onClose={() => setSelectorVisible(false)}
        onSelect={handleSelectIndustry}
        currentIndustry={editingRow?.industryId ? { id: editingRow.industryId } : null}
        originalText={editingRow?.originalIndustry || editingRow?.industry}
        isAdmin={false}
      />
    </>
  );
};

export default CustomerImport;
