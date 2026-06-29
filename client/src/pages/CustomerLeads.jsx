import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Table, Button, Input, Select, Tag, Space, Modal, Form,
  message, Statistic, Row, Col, Tooltip, Badge, Transfer, Popconfirm,
  Dropdown, Divider, Typography, Upload, Alert, Switch, InputNumber
} from 'antd';

const { Text } = Typography;
import {
  PlusOutlined, SearchOutlined, FilterOutlined,
  UserAddOutlined, CheckCircleOutlined, ClockCircleOutlined,
  PhoneOutlined, MailOutlined, TrophyOutlined, RocketOutlined,
  FileTextOutlined, BellOutlined, TagsOutlined,
  TagOutlined, DownOutlined, ExportOutlined, ImportOutlined,
  DownloadOutlined, UploadOutlined, InboxOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { customerLeadAPI, leadTagAPI, followUpReminderAPI, userAPI } from '../services/api';
import LeadFollowUp from '../components/LeadFollowUp';
import LeadTagManager from '../components/LeadTagManager';
import FollowUpReminderModal from '../components/FollowUpReminderModal';
import './CustomerLeads.css';

const CustomerLeads = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    source: '',
    tagIds: ''
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [form] = Form.useForm();
  const [followUpVisible, setFollowUpVisible] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [tagManagerVisible, setTagManagerVisible] = useState(false);
  const [reminderVisible, setReminderVisible] = useState(false);
  const [reminderCount, setReminderCount] = useState(0);

  // 标签相关状态
  const [allTags, setAllTags] = useState([]);
  const [tagAssignVisible, setTagAssignVisible] = useState(false);
  const [tagAssignLeadId, setTagAssignLeadId] = useState(null);
  const [tagAssignLeadTags, setTagAssignLeadTags] = useState([]);
  const [batchTagVisible, setBatchTagVisible] = useState(false);
  const [batchTagIds, setBatchTagIds] = useState([]);

  // 回收相关状态
  const [reclaimVisible, setReclaimVisible] = useState(false);
  const [reclaimData, setReclaimData] = useState({ reclaimable: [], warnings: [] });
  const [reclaimLoading, setReclaimLoading] = useState(false);
  const [reclaimRulesVisible, setReclaimRulesVisible] = useState(false);
  const [reclaimRules, setReclaimRules] = useState(null);

  // 评分配置状态
  const [scoringConfigVisible, setScoringConfigVisible] = useState(false);
  const [scoringConfig, setScoringConfig] = useState(null);
  const [scoringConfigLoading, setScoringConfigLoading] = useState(false);

  // 批量分配状态
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [assignUserId, setAssignUserId] = useState(null);
  const [assignUsers, setAssignUsers] = useState([]);

  useEffect(() => {
    fetchLeads();
    fetchStatistics();
    fetchReminderCount();
    fetchAllTags();
  }, [pagination.current, filters]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      };
      // 清理空值
      Object.keys(params).forEach(key => {
        if (!params[key] && params[key] !== 0) delete params[key];
      });

      const response = await customerLeadAPI.getLeads(params);
      setLeads(response.data);
      setPagination(prev => ({ ...prev, total: response.pagination.total }));
    } catch (error) {
      message.error('获取线索列表失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await customerLeadAPI.getStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('获取统计数据失败', error);
    }
  };

  const fetchReminderCount = async () => {
    try {
      const response = await followUpReminderAPI.getReminderStatistics();
      if (response.success) {
        setReminderCount(response.data.unread);
      }
    } catch (error) {
      console.error('获取提醒数量失败', error);
    }
  };

  const fetchAllTags = async () => {
    try {
      const response = await leadTagAPI.getTags({});
      if (response.success) {
        setAllTags(response.data);
      }
    } catch (error) {
      console.error('获取标签列表失败:', error);
    }
  };

  // 获取线索的标签
  const fetchLeadTags = async (leadId) => {
    try {
      const response = await leadTagAPI.getLeadTags(leadId);
      if (response.success) {
        setTagAssignLeadTags(response.data);
      }
    } catch (error) {
      console.error('获取线索标签失败:', error);
    }
  };

  // 打开标签分配弹窗
  const handleOpenTagAssign = async (leadId) => {
    setTagAssignLeadId(leadId);
    await fetchLeadTags(leadId);
    setTagAssignVisible(true);
  };

  // 添加标签到线索
  const handleAddTagToLead = async (tagId) => {
    try {
      await leadTagAPI.addTagToLead(tagAssignLeadId, tagId);
      message.success('标签添加成功');
      fetchLeadTags(tagAssignLeadId);
      fetchLeads();
    } catch (error) {
      message.error('添加标签失败');
    }
  };

  // 从线索移除标签
  const handleRemoveTagFromLead = async (tagId) => {
    try {
      await leadTagAPI.removeTagFromLead(tagAssignLeadId, tagId);
      message.success('标签移除成功');
      fetchLeadTags(tagAssignLeadId);
      fetchLeads();
    } catch (error) {
      message.error('移除标签失败');
    }
  };

  // 导入导出
  const [importVisible, setImportVisible] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await customerLeadAPI.exportLeads(filters);
      const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `线索导出_${new Date().toISOString().slice(0, 10)}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await customerLeadAPI.downloadTemplate();
      const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '线索导入模板.xlsx';
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      message.error('下载模板失败');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      message.warning('请选择要导入的文件');
      return;
    }
    try {
      setImporting(true);
      const formData = new FormData();
      formData.append('file', importFile);
      const response = await customerLeadAPI.importLeads(formData);
      if (response.success) {
        setImportResult(response.data);
        setImportFile(null);
        message.success(response.message);
        fetchLeads();
        fetchStatistics();
      }
    } catch (error) {
      message.error(error.response?.data?.message || '导入失败');
    } finally {
      setImporting(false);
    }
  };

  // 回收检查
  const handleReclaimCheck = async () => {
    try {
      setReclaimLoading(true);
      const response = await customerLeadAPI.checkReclaimable();
      if (response.success) {
        setReclaimData(response.data);
        setReclaimVisible(true);
      }
    } catch (error) {
      message.error('检查失败');
    } finally {
      setReclaimLoading(false);
    }
  };

  // 执行回收
  const handleExecuteReclaim = async (leadIds) => {
    try {
      const response = await customerLeadAPI.batchReclaimLeads(leadIds, '自动回收规则');
      if (response.success) {
        message.success(response.message);
        setReclaimVisible(false);
        fetchLeads();
        fetchStatistics();
      }
    } catch (error) {
      message.error('回收失败');
    }
  };

  // 获取回收规则
  const handleFetchReclaimRules = async () => {
    try {
      const response = await customerLeadAPI.getReclaimRules();
      if (response.success) {
        setReclaimRules(response.data);
        setReclaimRulesVisible(true);
      }
    } catch (error) {
      message.error('获取规则失败');
    }
  };

  const handleSaveReclaimRules = async () => {
    try {
      const response = await customerLeadAPI.updateReclaimRules(reclaimRules);
      if (response.success) {
        message.success('回收规则已更新');
        setReclaimRulesVisible(false);
      } else {
        message.error(response.message || '保存失败');
      }
    } catch (error) {
      message.error('保存规则失败');
    }
  };

  // 评分配置操作
  const handleFetchScoringConfig = async () => {
    try {
      setScoringConfigLoading(true);
      const response = await customerLeadAPI.getScoringConfig();
      if (response.success) {
        setScoringConfig(response.data);
        setScoringConfigVisible(true);
      }
    } catch (error) {
      message.error('获取评分配置失败');
    } finally {
      setScoringConfigLoading(false);
    }
  };

  const handleSaveScoringConfig = async () => {
    try {
      const configToSave = {};
      Object.entries(scoringConfig).forEach(([key, value]) => {
        configToSave[key] = { weight: value.weight };
        if (value.values) configToSave[key].values = value.values;
      });
      const response = await customerLeadAPI.updateScoringConfig(configToSave);
      if (response.success) {
        message.success('评分配置已更新');
        setScoringConfigVisible(false);
      } else {
        message.error(response.message || '保存失败');
      }
    } catch (error) {
      message.error('保存评分配置失败');
    }
  };

  // 批量标签操作
  const handleBatchTag = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择线索');
      return;
    }
    if (batchTagIds.length === 0) {
      message.warning('请选择要添加的标签');
      return;
    }
    try {
      await leadTagAPI.batchAddTags(selectedRowKeys, batchTagIds);
      message.success(`已为 ${selectedRowKeys.length} 条线索批量添加标签`);
      setBatchTagVisible(false);
      setBatchTagIds([]);
      setSelectedRowKeys([]);
      fetchLeads();
    } catch (error) {
      message.error('批量添加标签失败');
    }
  };

  const handleCreateLead = () => {
    setModalType('create');
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditLead = (record) => {
    setModalType('edit');
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (modalType === 'create') {
        await customerLeadAPI.createLead(values);
        message.success('线索创建成功');
      } else {
        await customerLeadAPI.updateLead(form.getFieldValue('id'), values);
        message.success('线索更新成功');
      }
      setModalVisible(false);
      form.resetFields();
      fetchLeads();
      fetchStatistics();
    } catch (error) {
      if (error.errorFields) {
        message.error('请检查表单填写');
      } else {
        message.error(modalType === 'create' ? '创建失败' : '更新失败');
      }
    }
  };

  const handleConvert = (id) => {
    Modal.confirm({
      title: '确认转化',
      content: '确定要将此线索转化为正式客户吗？',
      onOk: async () => {
        try {
          await customerLeadAPI.convertLead(id);
          message.success('线索转化成功');
          fetchLeads();
          fetchStatistics();
        } catch (error) {
          message.error('转化失败');
        }
      }
    });
  };

  const handleBatchAssign = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要分配的线索');
      return;
    }
    setAssignUserId(null);
    fetchAssignableUsers();
    setAssignModalVisible(true);
  };

  const fetchAssignableUsers = async () => {
    const extractUsers = (data) => data?.users || data || [];
    try {
      const response = await userAPI.getUsers({ role: 'sales' });
      if (response.success) {
        setAssignUsers(extractUsers(response.data));
      } else {
        const allResponse = await userAPI.getUsers();
        if (allResponse.success) setAssignUsers(extractUsers(allResponse.data));
      }
    } catch (error) {
      try {
        const response = await userAPI.getUsers();
        if (response.success) setAssignUsers(extractUsers(response.data));
      } catch (e) {
        message.error('获取用户列表失败');
      }
    }
  };

  const handleConfirmAssign = async () => {
    if (!assignUserId) {
      message.warning('请选择负责人');
      return;
    }
    try {
      const response = await customerLeadAPI.batchAssignLeads(selectedRowKeys, assignUserId);
      if (response.success) {
        message.success(response.message || `成功分配 ${selectedRowKeys.length} 条线索`);
        setAssignModalVisible(false);
        setSelectedRowKeys([]);
        fetchLeads();
      } else {
        message.error(response.message || '批量分配失败');
      }
    } catch (error) {
      message.error('批量分配失败');
    }
  };

  const handleShowFollowUp = (leadId) => {
    setSelectedLeadId(leadId);
    setFollowUpVisible(true);
  };

  const statusColors = {
    new: 'blue',
    contacted: 'cyan',
    qualified: 'green',
    negotiating: 'orange',
    converted: 'success',
    lost: 'default'
  };

  const statusLabels = {
    new: '新线索',
    contacted: '已联系',
    qualified: '已验证',
    negotiating: '洽谈中',
    converted: '已转化',
    lost: '已丢失'
  };

  const priorityColors = {
    low: 'default',
    medium: 'blue',
    high: 'orange',
    urgent: 'red'
  };

  const priorityLabels = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急'
  };

  const columns = [
    {
      title: '公司名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 200,
      fixed: 'left',
      render: (text, record) => (
        <a onClick={() => navigate(`/leads/${record.id}`)}>{text}</a>
      )
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      width: 100
    },
    {
      title: '联系方式',
      key: 'contact',
      width: 170,
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {record.phone && <span><PhoneOutlined /> {record.phone}</span>}
          {record.email && <span><MailOutlined /> {record.email}</span>}
        </Space>
      )
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 90,
      render: (source) => {
        const sourceLabels = {
          website: '官网',
          referral: '推荐',
          cold_call: '陌拜',
          exhibition: '展会',
          social_media: '社交媒体',
          partner: '合作伙伴',
          other: '其他'
        };
        return sourceLabels[source] || source;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status) => (
        <Tag color={statusColors[status]}>{statusLabels[status]}</Tag>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority) => (
        <Tag color={priorityColors[priority]}>{priorityLabels[priority]}</Tag>
      )
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 180,
      render: (tags, record) => {
        if (!tags || tags.length === 0) {
          return (
            <Button
              type="dashed"
              size="small"
              icon={<PlusOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenTagAssign(record.id);
              }}
            >
              添加标签
            </Button>
          );
        }
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            {tags.slice(0, 3).map(tag => (
              <Tooltip key={tag.id} title={`${tag.name}${tag.category ? ` (${tag.category})` : ''}`}>
                <Tag color={tag.color} style={{ margin: 0, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {tag.name}
                </Tag>
              </Tooltip>
            ))}
            {tags.length > 3 && (
              <Tooltip title={tags.slice(3).map(t => t.name).join(', ')}>
                <Tag style={{ margin: 0, cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenTagAssign(record.id);
                  }}
                >
                  +{tags.length - 3}
                </Tag>
              </Tooltip>
            )}
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              style={{ padding: 0, height: 20, fontSize: 10 }}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenTagAssign(record.id);
              }}
            />
          </div>
        );
      }
    },
    {
      title: '评分',
      dataIndex: 'score',
      key: 'score',
      width: 90,
      sorter: (a, b) => (a.score || 0) - (b.score || 0),
      render: (score) => {
        const s = score || 0;
        const level = s >= 85 ? 'S' : s >= 70 ? 'A' : s >= 55 ? 'B' : s >= 40 ? 'C' : 'D';
        const color = s >= 85 ? 'red' : s >= 70 ? 'orange' : s >= 55 ? 'blue' : s >= 40 ? 'default' : 'default';
        return (
          <Tooltip title={`${level}级线索`}>
            <Tag color={color}>{s}分</Tag>
          </Tooltip>
        );
      }
    },
    {
      title: '负责人',
      dataIndex: ['assignedUser', 'username'],
      key: 'assignedUser',
      width: 90,
      render: (username) => username || '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 110,
      render: (date) => date ? new Date(date).toLocaleDateString('zh-CN') : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => handleEditLead(record)}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<FileTextOutlined />}
            onClick={() => handleShowFollowUp(record.id)}>
            跟进
          </Button>
          {record.status !== 'converted' && (
            <Button type="link" size="small" onClick={() => handleConvert(record.id)}>
              转化
            </Button>
          )}
          <Dropdown menu={{
            items: [
              {
                key: 'tags',
                icon: <TagOutlined />,
                label: '管理标签',
                onClick: () => handleOpenTagAssign(record.id)
              },
              {
                key: 'detail',
                label: '查看详情',
                onClick: () => navigate(`/leads/${record.id}`)
              }
            ]
          }}>
            <Button type="link" size="small" icon={<DownOutlined />}>
              更多
            </Button>
          </Dropdown>
          <Popconfirm
            title="确定要删除此线索吗？"
            description="删除后数据无法恢复"
            onConfirm={async () => {
              try {
                const response = await customerLeadAPI.deleteLead(record.id);
                if (response.success) {
                  message.success('线索已删除');
                  fetchLeads();
                  fetchStatistics();
                } else {
                  message.error(response.message || '删除失败');
                }
              } catch (error) {
                message.error('删除失败');
              }
            }}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys
  };

  return (
    <div className="customer-leads-page">
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总线索数"
              value={statistics.totalLeads || 0}
              prefix={<RocketOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已转化"
              value={statistics.convertedCount || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="转化率"
              value={statistics.conversionRate || 0}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待跟进"
              value={statistics.byStatus?.new || 0}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 主内容卡片 */}
      <Card
        title="客户线索管理"
        extra={
          <Space>
            <Badge count={reminderCount} offset={[10, 0]}>
              <Button
                icon={<BellOutlined />}
                onClick={() => setReminderVisible(true)}
              >
                跟进提醒
              </Button>
            </Badge>
            <Button icon={<PlusOutlined />} type="primary" onClick={handleCreateLead}>
              新增线索
            </Button>
            <Button icon={<UserAddOutlined />} onClick={handleBatchAssign}
              disabled={selectedRowKeys.length === 0}>
              批量分配
            </Button>
            <Button icon={<TagsOutlined />}
              onClick={() => setBatchTagVisible(true)}
              disabled={selectedRowKeys.length === 0}>
              批量打标
            </Button>
            <Button onClick={() => setTagManagerVisible(true)}>
              标签管理
            </Button>
            <Badge count={reclaimData.reclaimableCount || 0} overflowCount={99}>
              <Button
                icon={<RocketOutlined />}
                loading={reclaimLoading}
                onClick={handleReclaimCheck}
              >
                回收检查
              </Button>
            </Badge>
            <Button size="small" onClick={handleFetchReclaimRules}>
              规则
            </Button>
            <Button size="small" onClick={handleFetchScoringConfig} loading={scoringConfigLoading}>
              评分配置
            </Button>
            <Button icon={<ExportOutlined />} loading={exporting} onClick={handleExport}>
              导出
            </Button>
            <Button icon={<ImportOutlined />} onClick={() => setImportVisible(true)}>
              导入
            </Button>
            <Popconfirm
              title="确定要重新计算所有线索的评分吗？"
              description="将根据最新数据重新计算每种线索的评分和等级"
              onConfirm={async () => {
                try {
                  const res = await customerLeadAPI.batchRecalculateScores();
                  if (res.success) {
                    message.success(`已重算 ${res.data.total} 条线索，更新 ${res.data.updated} 条`);
                    fetchLeads();
                  }
                } catch (err) { message.error('重算失败'); }
              }}
              okText="确定"
              cancelText="取消"
            >
              <Button icon={<TrophyOutlined />}>重算评分</Button>
            </Popconfirm>
          </Space>
        }
      >
        {/* 筛选栏 */}
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索公司名称、联系人、电话"
            prefix={<SearchOutlined />}
            style={{ width: 250 }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            allowClear
          />
          <Select
            placeholder="状态"
            style={{ width: 110 }}
            value={filters.status || undefined}
            onChange={(value) => setFilters({ ...filters, status: value || '' })}
            allowClear
          >
            <Select.Option value="new">新线索</Select.Option>
            <Select.Option value="contacted">已联系</Select.Option>
            <Select.Option value="qualified">已验证</Select.Option>
            <Select.Option value="negotiating">洽谈中</Select.Option>
            <Select.Option value="converted">已转化</Select.Option>
            <Select.Option value="lost">已丢失</Select.Option>
          </Select>
          <Select
            placeholder="优先级"
            style={{ width: 110 }}
            value={filters.priority || undefined}
            onChange={(value) => setFilters({ ...filters, priority: value || '' })}
            allowClear
          >
            <Select.Option value="low">低</Select.Option>
            <Select.Option value="medium">中</Select.Option>
            <Select.Option value="high">高</Select.Option>
            <Select.Option value="urgent">紧急</Select.Option>
          </Select>
          <Select
            placeholder="来源"
            style={{ width: 110 }}
            value={filters.source || undefined}
            onChange={(value) => setFilters({ ...filters, source: value || '' })}
            allowClear
          >
            <Select.Option value="website">官网</Select.Option>
            <Select.Option value="referral">推荐</Select.Option>
            <Select.Option value="cold_call">陌拜</Select.Option>
            <Select.Option value="exhibition">展会</Select.Option>
            <Select.Option value="social_media">社交媒体</Select.Option>
          </Select>
          <Select
            placeholder="按标签筛选"
            style={{ width: 200 }}
            mode="multiple"
            value={filters.tagIds ? filters.tagIds.split(',').map(Number).filter(Boolean) : []}
            onChange={(values) => setFilters({ ...filters, tagIds: values.length > 0 ? values.join(',') : '' })}
            allowClear
            maxTagCount={2}
          >
            {allTags.map(tag => (
              <Select.Option key={tag.id} value={tag.id}>
                <Tag color={tag.color} style={{ margin: 0 }}>{tag.name}</Tag>
              </Select.Option>
            ))}
          </Select>
        </Space>

        {/* 表格 */}
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={leads}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1600 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条线索`,
            onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize })
          }}
        />
      </Card>

      {/* 创建/编辑模态框 */}
      <Modal
        title={modalType === 'create' ? '新增线索' : '编辑线索'}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        onOk={handleSubmit}
        width={800}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" autoComplete="off">
          {modalType === 'edit' && (
            <Form.Item name="id" hidden><Input /></Form.Item>
          )}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="companyName" label="公司名称" rules={[{ required: true, message: '请输入公司名称' }]}>
                <Input placeholder="请输入公司名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contactPerson" label="联系人">
                <Input placeholder="请输入联系人" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="电话">
                <Input placeholder="请输入电话" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="邮箱">
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="source" label="来源" rules={[{ required: true, message: '请选择来源' }]}>
                <Select placeholder="请选择来源">
                  <Select.Option value="website">官网</Select.Option>
                  <Select.Option value="referral">推荐</Select.Option>
                  <Select.Option value="cold_call">陌拜</Select.Option>
                  <Select.Option value="exhibition">展会</Select.Option>
                  <Select.Option value="social_media">社交媒体</Select.Option>
                  <Select.Option value="partner">合作伙伴</Select.Option>
                  <Select.Option value="other">其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="priority" label="优先级" rules={[{ required: true, message: '请选择优先级' }]}>
                <Select placeholder="请选择优先级">
                  <Select.Option value="low">低</Select.Option>
                  <Select.Option value="medium">中</Select.Option>
                  <Select.Option value="high">高</Select.Option>
                  <Select.Option value="urgent">紧急</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="estimatedValue" label="预估价值">
                <Input placeholder="预估价值（元）" type="number" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={4} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 跟进记录模态框 */}
      <LeadFollowUp
        leadId={selectedLeadId}
        visible={followUpVisible}
        onClose={() => {
          setFollowUpVisible(false);
          setSelectedLeadId(null);
        }}
      />

      {/* 标签管理模态框 */}
      <LeadTagManager
        visible={tagManagerVisible}
        onClose={() => setTagManagerVisible(false)}
        onTagsChange={() => { fetchLeads(); fetchAllTags(); }}
      />

      {/* 单条线索标签分配弹窗 */}
      <Modal
        title={
          <Space><TagsOutlined /><span>管理线索标签</span></Space>
        }
        open={tagAssignVisible}
        onCancel={() => { setTagAssignVisible(false); setTagAssignLeadId(null); }}
        footer={[
          <Button key="close" onClick={() => { setTagAssignVisible(false); setTagAssignLeadId(null); }}>
            完成
          </Button>
        ]}
        width={600}
        destroyOnHidden
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>当前标签：</div>
          <div style={{ minHeight: 32, padding: 8, background: '#fafafa', borderRadius: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {tagAssignLeadTags.length === 0 ? (
              <span style={{ color: '#ccc' }}>暂无标签</span>
            ) : (
              tagAssignLeadTags.map(tag => (
                <Tag
                  key={tag.id}
                  color={tag.color}
                  closable
                  onClose={() => handleRemoveTagFromLead(tag.id)}
                  style={{ margin: 2 }}
                >
                  {tag.name}
                </Tag>
              ))
            )}
          </div>
        </div>
        <div>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>添加标签：</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 200, overflowY: 'auto', padding: 8, background: '#fafafa', borderRadius: 6 }}>
            {allTags
              .filter(tag => !tagAssignLeadTags.some(t => t.id === tag.id))
              .map(tag => (
                <Tooltip key={tag.id} title={tag.description || `${tag.category ? `[${tag.category}] ` : ''}点击添加此标签`}>
                  <Tag
                    color={tag.color}
                    style={{ cursor: 'pointer', margin: 2, opacity: 0.8, transition: 'opacity 0.2s' }}
                    onClick={() => handleAddTagToLead(tag.id)}
                    onMouseEnter={(e) => e.target.style.opacity = '1'}
                    onMouseLeave={(e) => e.target.style.opacity = '0.8'}
                  >
                    + {tag.name}
                  </Tag>
                </Tooltip>
              ))}
            {allTags.filter(tag => !tagAssignLeadTags.some(t => t.id === tag.id)).length === 0 && (
              <span style={{ color: '#ccc' }}>所有标签已添加</span>
            )}
          </div>
        </div>
      </Modal>

      {/* 批量标签操作弹窗 */}
      <Modal
        title={
          <Space><TagsOutlined /><span>批量添加标签</span></Space>
        }
        open={batchTagVisible}
        onOk={handleBatchTag}
        onCancel={() => { setBatchTagVisible(false); setBatchTagIds([]); }}
        okText={`为 ${selectedRowKeys.length} 条线索添加标签`}
        cancelText="取消"
        width={500}
        destroyOnHidden
      >
        <div style={{ marginBottom: 8 }}>
          已选择 <strong>{selectedRowKeys.length}</strong> 条线索
        </div>
        <Select
          placeholder="选择要添加的标签"
          mode="multiple"
          style={{ width: '100%' }}
          value={batchTagIds}
          onChange={setBatchTagIds}
        >
          {allTags.map(tag => (
            <Select.Option key={tag.id} value={tag.id}>
              <Tag color={tag.color}>{tag.name}</Tag>
            </Select.Option>
          ))}
        </Select>
      </Modal>

      {/* 回收检查弹窗 */}
      <Modal
        title={
          <Space><RocketOutlined /><span>线索回收检查</span></Space>
        }
        open={reclaimVisible}
        onCancel={() => setReclaimVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setReclaimVisible(false)}>关闭</Button>,
          <Popconfirm
            key="reclaim"
            title={`确定回收 ${reclaimData.reclaimable?.length || 0} 条回收线索？`}
            description={'回收后线索将标记为[已丢失]并释放分配'}
            onConfirm={() => handleExecuteReclaim(reclaimData.reclaimable?.map(l => l.id) || [])}
            okText="确定回收"
            cancelText="取消"
          >
            <Button type="primary" danger
              disabled={!reclaimData.reclaimable || reclaimData.reclaimable.length === 0}>
              一键回收 ({reclaimData.reclaimableCount || 0})
            </Button>
          </Popconfirm>
        ]}
        destroyOnHidden
      >
        <div style={{ marginBottom: 16 }}>
          <Text>
            共检查 <strong>{reclaimData.total || 0}</strong> 条活跃线索，
            发现 <Text type="danger" strong>{reclaimData.reclaimableCount || 0}</Text> 条可回收，
            <Text type="warning" strong>{reclaimData.warningCount || 0}</Text> 条预警
          </Text>
        </div>

        {reclaimData.reclaimable && reclaimData.reclaimable.length > 0 && (
          <>
            <Text type="danger" strong>可回收线索：</Text>
            <Table
              dataSource={reclaimData.reclaimable}
              rowKey="id"
              size="small"
              style={{ marginTop: 8 }}
              pagination={{ pageSize: 10 }}
              columns={[
                { title: '公司名称', dataIndex: 'companyName', width: 150 },
                { title: '状态', dataIndex: 'status', width: 80,
                  render: (s) => <Tag>{s === 'new' ? '新线索' : s === 'contacted' ? '已联系' :
                    s === 'qualified' ? '已验证' : s === 'negotiating' ? '洽谈中' : s}</Tag> },
                { title: '评分', dataIndex: 'score', width: 60 },
                { title: '负责人', dataIndex: 'assignedUser', width: 80 },
                { title: '回收原因', dataIndex: 'rules', width: 220,
                  render: (rules) => rules?.map((r, i) => (
                    <div key={i} style={{ fontSize: 12 }}>
                      <Tag color="red">{r.label}</Tag>
                      <span style={{ color: '#999' }}>{r.reason}</span>
                    </div>
                  )) },
                { title: '超期天数', key: 'days', width: 80,
                  render: (_, r) => <Tag color="red">{Math.max(...(r.rules?.map(ru => ru.daysExceeded) || [0]))}天</Tag> }
              ]}
            />
          </>
        )}

        {reclaimData.warnings && reclaimData.warnings.length > 0 && (
          <>
            <Divider />
            <Text type="warning" strong>预警线索（低评分/停滞）：</Text>
            <Table
              dataSource={reclaimData.warnings}
              rowKey="id"
              size="small"
              style={{ marginTop: 8 }}
              pagination={{ pageSize: 5 }}
              columns={[
                { title: '公司名称', dataIndex: 'companyName', width: 150 },
                { title: '状态', dataIndex: 'status', width: 80,
                  render: (s) => <Tag>{s}</Tag> },
                { title: '评分', dataIndex: 'score', width: 60,
                  render: (s) => <Tag color="warning">{s}分</Tag> },
                { title: '负责人', dataIndex: 'assignedUser', width: 80 },
                { title: '预警原因', dataIndex: 'rules', width: 200,
                  render: (rules) => rules?.map((r, i) => (
                    <div key={i} style={{ fontSize: 12 }}><Tag color="orange">{r.label}</Tag></div>
                  )) }
              ]}
            />
          </>
        )}
      </Modal>

      {/* 回收规则弹窗（可编辑） */}
      <Modal
        title="回收规则配置"
        open={reclaimRulesVisible}
        onCancel={() => setReclaimRulesVisible(false)}
        width={800}
        onOk={handleSaveReclaimRules}
        okText="保存配置"
        cancelText="取消"
        destroyOnHidden
      >
        {reclaimRules && (
          <Table
            dataSource={Object.entries(reclaimRules).map(([key, rule]) => ({ key, ...rule }))}
            rowKey="key"
            pagination={false}
            columns={[
              { title: '规则名称', dataIndex: 'label', width: 160 },
              { title: '说明', dataIndex: 'description', ellipsis: true, width: 200 },
              { title: '适用状态', dataIndex: 'statusCheck', width: 120,
                render: (s) => s?.map(st => <Tag key={st} style={{ marginBottom: 2 }}>{st}</Tag>) },
              { title: '阈值', key: 'threshold', width: 120,
                render: (_, r) => {
                  if (r.maxScore !== null && r.maxScore !== undefined) {
                    return (
                      <Input
                        type="number"
                        size="small"
                        value={r.maxScore}
                        style={{ width: 70 }}
                        suffix="分"
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setReclaimRules(prev => ({
                            ...prev,
                            [r.key]: { ...prev[r.key], maxScore: val }
                          }));
                        }}
                      />
                    );
                  }
                  if (r.thresholdDays !== null && r.thresholdDays !== undefined) {
                    return (
                      <Input
                        type="number"
                        size="small"
                        value={r.thresholdDays}
                        style={{ width: 70 }}
                        suffix="天"
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          setReclaimRules(prev => ({
                            ...prev,
                            [r.key]: { ...prev[r.key], thresholdDays: val }
                          }));
                        }}
                      />
                    );
                  }
                  return '-';
                }
              },
              { title: '动作', dataIndex: 'action', width: 70,
                render: (a) => <Tag color={a === 'reclaim' ? 'red' : 'orange'}>{a === 'reclaim' ? '回收' : '预警'}</Tag> },
              { title: '启用', dataIndex: 'enabled', width: 70,
                render: (e, r) => (
                  <Switch
                    checked={e}
                    size="small"
                    onChange={(checked) => {
                      setReclaimRules(prev => ({
                        ...prev,
                        [r.key]: { ...prev[r.key], enabled: checked }
                      }));
                    }}
                  />
                )
              }
            ]}
          />
        )}
      </Modal>

      {/* 评分配置弹窗 */}
      <Modal
        title="评分配置管理"
        open={scoringConfigVisible}
        onCancel={() => setScoringConfigVisible(false)}
        onOk={handleSaveScoringConfig}
        width={650}
        okText="保存配置"
        cancelText="取消"
        destroyOnHidden
      >
        {scoringConfig && (
          <>
            <Table
              dataSource={Object.entries(scoringConfig).map(([key, config]) => ({ key, ...config }))}
              rowKey="key"
              pagination={false}
              columns={[
                { title: '评分因素', dataIndex: 'label', width: 110 },
                { title: '权重 (%)', key: 'weight', width: 150,
                  render: (_, r) => (
                    <InputNumber
                      min={0}
                      max={100}
                      step={5}
                      value={Math.round(r.weight * 100)}
                      style={{ width: 110 }}
                      formatter={v => `${v}%`}
                      parser={v => parseInt(v?.replace('%', '')) || 0}
                      onChange={(val) => {
                        setScoringConfig(prev => ({
                          ...prev,
                          [r.key]: { ...prev[r.key], weight: (val || 0) / 100 }
                        }));
                      }}
                    />
                  )
                },
                { title: '计算方式', key: 'type', width: 90,
                  render: (_, r) => r.dynamic
                    ? <Tag color="blue">动态</Tag>
                    : <Tag color="green">映射</Tag>
                },
                { title: '映射值', dataIndex: 'values', width: 260,
                  render: (values) => {
                    if (!values) return <span style={{ color: '#999' }}>自动计算</span>;
                    return (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {Object.entries(values).map(([k, v]) => (
                          <Tag key={k} style={{ marginBottom: 2, fontSize: 11 }}>
                            {k}: {v}
                          </Tag>
                        ))}
                      </div>
                    );
                  }
                }
              ]}
            />
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <Space>
                <Text>各因素权重合计：</Text>
                <Text strong style={{ fontSize: 16, color: Object.values(scoringConfig).reduce((s, c) => s + Math.round(c.weight * 100), 0) === 100 ? '#52c41a' : '#f5222d' }}>
                  {Object.values(scoringConfig).reduce((s, c) => s + Math.round(c.weight * 100), 0)}%
                </Text>
                {Object.values(scoringConfig).reduce((s, c) => s + Math.round(c.weight * 100), 0) !== 100 && (
                  <Tag color="red">总权重应为 100%</Tag>
                )}
              </Space>
            </div>
          </>
        )}
        <div style={{ marginTop: 12, padding: 10, background: '#f6f8fa', borderRadius: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <strong>说明：</strong>评分 = Σ(各因素得分 × 权重)。权重合计应为 100%。保存后需点击"重算评分"来更新已有线索评分。
          </Text>
        </div>
      </Modal>

      {/* 导入弹窗 */}
      <Modal
        title={<Space><ImportOutlined /><span>批量导入线索</span></Space>}
        open={importVisible}
        onCancel={() => { setImportVisible(false); setImportFile(null); setImportResult(null); }}
        width={700}
        footer={[
          <Button key="template" icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
            下载模板
          </Button>,
          <Button key="cancel" onClick={() => { setImportVisible(false); setImportFile(null); setImportResult(null); }}>
            取消
          </Button>,
          <Button key="import" type="primary" icon={<UploadOutlined />}
            loading={importing} onClick={handleImport} disabled={!importFile}>
            开始导入
          </Button>
        ]}
        destroyOnHidden
      >
        {!importResult ? (
          <>
            <Alert
              message="导入说明"
              description={
                <div>
                  <p>1. 下载标准模板，按格式填写线索数据</p>
                  <p>2. 支持 .xlsx / .xls / .csv 格式，文件大小不超过 10MB</p>
                  <p>3. 公司名称为必填项，系统会自动检测重复线索</p>
                  <p>4. 导入后自动计算评分</p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Upload.Dragger
              beforeUpload={(file) => {
                setImportFile(file);
                return false;
              }}
              onRemove={() => setImportFile(null)}
              fileList={importFile ? [importFile] : []}
              accept=".xlsx,.xls,.csv"
              maxCount={1}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">支持 .xlsx、.xls、.csv 格式</p>
            </Upload.Dragger>
          </>
        ) : (
          <div>
            <Alert
              message="导入完成"
              description={`共 ${importResult.total} 条，成功 ${importResult.created} 条，跳过 ${importResult.skipped} 条`}
              type={importResult.errors.length > 0 ? 'warning' : 'success'}
              showIcon
              style={{ marginBottom: 16 }}
            />
            {importResult.errors.length > 0 && (
              <Table
                dataSource={importResult.errors}
                rowKey="row"
                size="small"
                pagination={{ pageSize: 10 }}
                columns={[
                  { title: '行号', dataIndex: 'row', width: 60 },
                  { title: '错误信息', dataIndex: 'message' }
                ]}
              />
            )}
          </div>
        )}
      </Modal>

      {/* 批量分配模态框 */}
      <Modal
        title="批量分配线索"
        open={assignModalVisible}
        onOk={handleConfirmAssign}
        onCancel={() => setAssignModalVisible(false)}
        okText="确认分配"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          已选择 <strong>{selectedRowKeys.length}</strong> 条线索进行分配
        </div>
        <Form.Item label="选择负责人" required>
          <Select
            placeholder="请选择负责人"
            style={{ width: '100%' }}
            value={assignUserId}
            onChange={setAssignUserId}
            showSearch
            optionFilterProp="label"
          >
            {assignUsers.map(u => (
              <Select.Option key={u.id} value={u.id} label={u.username}>
                {u.username} {u.email ? `(${u.email})` : ''}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
      </Modal>

      {/* 跟进提醒模态框 */}
      <FollowUpReminderModal
        visible={reminderVisible}
        onClose={() => {
          setReminderVisible(false);
          fetchReminderCount();
        }}
      />
    </div>
  );
};

export default CustomerLeads;
