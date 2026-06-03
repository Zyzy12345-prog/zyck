import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  message,
  Modal,
  Form,
  Select,
  Input,
  Popconfirm,
  Tag,
  Progress,
  Alert
} from 'antd';
import {
  ReloadOutlined,
  SwapOutlined,
  ExportOutlined,
  ImportOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { industryAPI, clientAPI } from '../../services/api';
import { IndustryCascader } from '../../components';
import './IndustryMaintenance.css';

const { Option } = Select;

/**
 * 行业数据维护页面
 * 批量更新、合并、导出导入等功能
 */
const IndustryMaintenance = () => {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [batchUpdateVisible, setBatchUpdateVisible] = useState(false);
  const [mergeVisible, setMergeVisible] = useState(false);
  const [updateForm] = Form.useForm();
  const [mergeForm] = Form.useForm();
  const [industries, setIndustries] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    loadClients();
    loadIndustries();
  }, []);

  // 加载客户数据
  const loadClients = async () => {
    setLoading(true);
    try {
      const response = await clientAPI.getClients({ limit: 10000 });
      if (response.success) {
        setClients(response.data.data);
      }
    } catch (error) {
      message.error('加载失败：' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 加载行业列表
  const loadIndustries = async () => {
    try {
      const response = await industryAPI.getIndustriesList();
      if (response.success) {
        setIndustries(response.data);
      }
    } catch (error) {
      console.error('加载行业列表失败:', error);
    }
  };

  // 批量更新行业
  const handleBatchUpdate = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要更新的客户');
      return;
    }
    updateForm.resetFields();
    setBatchUpdateVisible(true);
  };

  // 提交批量更新
  const handleBatchUpdateSubmit = async () => {
    try {
      const values = await updateForm.validateFields();
      
      setProcessing(true);
      setProgress({ current: 0, total: selectedRowKeys.length });

      const updatePromises = selectedRowKeys.map((id, index) => {
        return clientAPI.updateClient(id, {
          industryId: values.industryId,
          matchType: 'manual'
        }).then(() => {
          setProgress({ current: index + 1, total: selectedRowKeys.length });
        });
      });

      await Promise.all(updatePromises);

      message.success(`成功更新 ${selectedRowKeys.length} 个客户的行业信息`);
      setBatchUpdateVisible(false);
      setSelectedRowKeys([]);
      loadClients();
    } catch (error) {
      message.error('批量更新失败：' + (error.message || '未知错误'));
    } finally {
      setProcessing(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  // 行业合并
  const handleMerge = () => {
    mergeForm.resetFields();
    setMergeVisible(true);
  };

  // 提交行业合并
  const handleMergeSubmit = async () => {
    try {
      const values = await mergeForm.validateFields();
      
      if (values.sourceId === values.targetId) {
        message.error('源行业和目标行业不能相同');
        return;
      }

      // 查找使用源行业的所有客户
      const affectedClients = clients.filter(c => c.industryId === values.sourceId);
      
      if (affectedClients.length === 0) {
        message.warning('没有客户使用该源行业');
        return;
      }

      Modal.confirm({
        title: '确认合并',
        content: `将有 ${affectedClients.length} 个客户的行业从"${values.sourceName}"更新为"${values.targetName}"，是否继续？`,
        okText: '确定',
        cancelText: '取消',
        onOk: async () => {
          setProcessing(true);
          setProgress({ current: 0, total: affectedClients.length });

          try {
            const updatePromises = affectedClients.map((client, index) => {
              return clientAPI.updateClient(client.id, {
                industryId: values.targetId,
                matchType: 'manual'
              }).then(() => {
                setProgress({ current: index + 1, total: affectedClients.length });
              });
            });

            await Promise.all(updatePromises);

            message.success(`成功合并行业，更新了 ${affectedClients.length} 个客户`);
            setMergeVisible(false);
            loadClients();
          } catch (error) {
            message.error('合并失败：' + (error.message || '未知错误'));
          } finally {
            setProcessing(false);
            setProgress({ current: 0, total: 0 });
          }
        }
      });
    } catch (error) {
      if (!error.errorFields) {
        message.error('操作失败：' + (error.message || '未知错误'));
      }
    }
  };

  // 导出数据
  const handleExport = () => {
    try {
      const exportData = clients.map(client => ({
        id: client.id,
        companyName: client.companyName,
        industryId: client.industryId,
        industryName: client.industryName,
        matchType: client.matchType,
        originalIndustry: client.originalIndustry
      }));

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `industry_data_${new Date().getTime()}.json`;
      a.click();
      window.URL.revokeObjectURL(url);

      message.success('导出成功');
    } catch (error) {
      message.error('导出失败：' + (error.message || '未知错误'));
    }
  };

  // 导入数据
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!Array.isArray(data)) {
          message.error('文件格式错误');
          return;
        }

        Modal.confirm({
          title: '确认导入',
          content: `将导入 ${data.length} 条数据，是否继续？`,
          okText: '确定',
          cancelText: '取消',
          onOk: async () => {
            setProcessing(true);
            setProgress({ current: 0, total: data.length });

            try {
              const updatePromises = data.map((item, index) => {
                if (item.id && item.industryId) {
                  return clientAPI.updateClient(item.id, {
                    industryId: item.industryId,
                    matchType: item.matchType || 'manual'
                  }).then(() => {
                    setProgress({ current: index + 1, total: data.length });
                  });
                }
                return Promise.resolve();
              });

              await Promise.all(updatePromises);

              message.success(`成功导入 ${data.length} 条数据`);
              loadClients();
            } catch (error) {
              message.error('导入失败：' + (error.message || '未知错误'));
            } finally {
              setProcessing(false);
              setProgress({ current: 0, total: 0 });
            }
          }
        });
      } catch (error) {
        message.error('文件解析失败：' + (error.message || '未知错误'));
      }
    };
    input.click();
  };

  // 重新匹配所有数据
  const handleRematchAll = () => {
    Modal.confirm({
      title: '确认重新匹配',
      content: '将对所有客户重新进行行业匹配，这可能需要一些时间，是否继续？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        setProcessing(true);
        setProgress({ current: 0, total: clients.length });

        try {
          // 提取所有原始行业文本
          const industryTexts = clients
            .map(c => c.originalIndustry || c.industry)
            .filter(text => text && text.trim() !== '');

          if (industryTexts.length === 0) {
            message.warning('没有需要匹配的数据');
            return;
          }

          // 批量匹配
          const response = await industryAPI.batchMatchIndustries(industryTexts, 0.7);

          if (response.success) {
            const results = response.data.results;

            // 更新客户数据
            const updatePromises = clients.map((client, index) => {
              const matchResult = results[index];
              if (matchResult && matchResult.matched) {
                return clientAPI.updateClient(client.id, {
                  industryId: matchResult.matchedIndustry.id,
                  matchType: matchResult.matchType,
                  matchConfidence: matchResult.confidence
                }).then(() => {
                  setProgress({ current: index + 1, total: clients.length });
                });
              }
              return Promise.resolve();
            });

            await Promise.all(updatePromises);

            message.success(
              `重新匹配完成！成功 ${response.data.statistics.matched} 条，未匹配 ${response.data.statistics.unmatched} 条`
            );
            loadClients();
          }
        } catch (error) {
          message.error('重新匹配失败：' + (error.message || '未知错误'));
        } finally {
          setProcessing(false);
          setProgress({ current: 0, total: 0 });
        }
      }
    });
  };

  // 表格列
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '公司名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 200
    },
    {
      title: '当前行业',
      dataIndex: 'industryName',
      key: 'industryName',
      render: (text, record) => (
        text ? (
          <Space>
            <span>{text}</span>
            {record.matchType && (
              <Tag color="blue">{record.matchType}</Tag>
            )}
          </Space>
        ) : (
          <Tag color="red">未匹配</Tag>
        )
      )
    },
    {
      title: '原始行业',
      dataIndex: 'originalIndustry',
      key: 'originalIndustry',
      render: (text) => text || '-'
    }
  ];

  // 行选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys)
  };

  return (
    <div className="industry-maintenance">
      <Card
        title="行业数据维护"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadClients}>
              刷新
            </Button>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              导出
            </Button>
            <Button icon={<ImportOutlined />} onClick={handleImport}>
              导入
            </Button>
          </Space>
        }
      >
        {/* 操作按钮 */}
        <Space style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            onClick={handleBatchUpdate}
            disabled={selectedRowKeys.length === 0}
          >
            批量更新行业 ({selectedRowKeys.length})
          </Button>
          <Button icon={<SwapOutlined />} onClick={handleMerge}>
            行业合并
          </Button>
          <Button
            icon={<SyncOutlined />}
            onClick={handleRematchAll}
            danger
          >
            重新匹配所有数据
          </Button>
        </Space>

        {/* 进度提示 */}
        {processing && (
          <Alert
            message="处理中"
            description={
              <div>
                <Progress
                  percent={
                    progress.total > 0
                      ? Math.round((progress.current / progress.total) * 100)
                      : 0
                  }
                  status="active"
                />
                <div style={{ marginTop: 8 }}>
                  已处理 {progress.current} / {progress.total}
                </div>
              </div>
            }
            type="info"
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 数据表格 */}
        <Table
          columns={columns}
          dataSource={clients}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          pagination={{ pageSize: 20 }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* 批量更新模态框 */}
      <Modal
        title="批量更新行业"
        open={batchUpdateVisible}
        onCancel={() => setBatchUpdateVisible(false)}
        onOk={handleBatchUpdateSubmit}
        okText="确定"
        cancelText="取消"
      >
        <Form form={updateForm} layout="vertical">
          <Alert
            message={`将更新 ${selectedRowKeys.length} 个客户的行业信息`}
            type="info"
            style={{ marginBottom: 16 }}
          />
          
          <Form.Item
            name="industryId"
            label="目标行业"
            rules={[{ required: true, message: '请选择目标行业' }]}
          >
            <IndustryCascader placeholder="请选择行业" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 行业合并模态框 */}
      <Modal
        title="行业合并"
        open={mergeVisible}
        onCancel={() => setMergeVisible(false)}
        onOk={handleMergeSubmit}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form form={mergeForm} layout="vertical">
          <Alert
            message="将源行业的所有客户迁移到目标行业"
            type="warning"
            style={{ marginBottom: 16 }}
          />

          <Form.Item
            name="sourceId"
            label="源行业（将被替换）"
            rules={[{ required: true, message: '请选择源行业' }]}
          >
            <Select
              showSearch
              placeholder="请选择源行业"
              optionFilterProp="children"
              onChange={(value, option) => {
                mergeForm.setFieldsValue({ sourceName: option.children });
              }}
            >
              {industries.map(ind => (
                <Option key={ind.id} value={ind.id}>
                  {ind.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="sourceName" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name="targetId"
            label="目标行业（保留）"
            rules={[{ required: true, message: '请选择目标行业' }]}
          >
            <Select
              showSearch
              placeholder="请选择目标行业"
              optionFilterProp="children"
              onChange={(value, option) => {
                mergeForm.setFieldsValue({ targetName: option.children });
              }}
            >
              {industries.map(ind => (
                <Option key={ind.id} value={ind.id}>
                  {ind.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="targetName" hidden>
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IndustryMaintenance;











