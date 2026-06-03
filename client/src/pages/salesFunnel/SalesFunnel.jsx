import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  message,
  Spin,
  Tag,
  Space,
  Statistic,
  Row,
  Col,
  Empty
} from 'antd';
import {
  PlusOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { 
  DndContext, 
  DragOverlay, 
  closestCenter,
  PointerSensor, 
  MouseSensor,
  TouchSensor,
  useSensor, 
  useSensors,
  pointerWithin,
  rectIntersection,
  getFirstCollision
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { salesFunnelAPI, clientAPI } from '../../services/api';
import OpportunityCard from '../../components/OpportunityCard';
import DroppableStage from '../../components/DroppableStage';
import './SalesFunnel.css';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const SalesFunnel = () => {
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [clients, setClients] = useState([]);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [form] = Form.useForm();

  // 优化传感器配置，确保所有阶段响应一致
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 2, // 减少到2px，更灵敏
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // 减少延迟到100ms
        tolerance: 1, // 减少容差到1px
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 2,
      },
    })
  );

  // 精准的碰撞检测算法 - 确保所有阶段同样灵敏
  const customCollisionDetection = (args) => {
    const { active, collisionRect, droppableRects, droppableContainers } = args;
    
    if (!collisionRect) {
      return [];
    }

    // 计算拖拽卡片的中心点
    const draggedCenterX = collisionRect.left + collisionRect.width / 2;
    const draggedCenterY = collisionRect.top + collisionRect.height / 2;

    // 计算每个阶段的匹配度
    const matches = [];
    
    droppableContainers.forEach((container) => {
      const { id } = container;
      const rect = droppableRects.get(id);
      
      if (rect) {
        // 检查拖拽卡片中心点是否在阶段的水平范围内
        const isInHorizontalRange = 
          draggedCenterX >= rect.left && 
          draggedCenterX <= rect.left + rect.width;
        
        // 检查拖拽卡片中心点是否在阶段的垂直范围内
        const isInVerticalRange = 
          draggedCenterY >= rect.top && 
          draggedCenterY <= rect.top + rect.height;
        
        // 如果完全在某个阶段内，最高优先级
        if (isInHorizontalRange && isInVerticalRange) {
          matches.push({
            id,
            priority: 1,
            distance: 0
          });
        } else if (isInHorizontalRange) {
          // 如果在水平范围内但不在垂直范围内，次优先级
          const verticalDistance = draggedCenterY < rect.top 
            ? rect.top - draggedCenterY 
            : draggedCenterY - (rect.top + rect.height);
          
          matches.push({
            id,
            priority: 2,
            distance: verticalDistance
          });
        } else {
          // 计算到阶段中心的距离
          const stageCenterX = rect.left + rect.width / 2;
          const stageCenterY = rect.top + rect.height / 2;
          
          const distance = Math.sqrt(
            Math.pow(draggedCenterX - stageCenterX, 2) +
            Math.pow(draggedCenterY - stageCenterY, 2)
          );
          
          matches.push({
            id,
            priority: 3,
            distance
          });
        }
      }
    });

    // 按优先级和距离排序
    if (matches.length > 0) {
      matches.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.distance - b.distance;
      });
      
      return [{ id: matches[0].id }];
    }

    return [];
  };

  useEffect(() => {
    fetchData();
    fetchClients();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stagesRes, statsRes] = await Promise.all([
        salesFunnelAPI.getOpportunitiesByStage({ status: 'active' }),
        salesFunnelAPI.getFunnelStatistics()
      ]);

      if (stagesRes.success) {
        setStages(stagesRes.data);
      }

      if (statsRes.success) {
        setStatistics(statsRes.data);
      }
    } catch (error) {
      message.error('获取数据失败：' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await clientAPI.getClients({ limit: 1000 });
      if (response.success) {
        setClients(response.data.clients);
      }
    } catch (error) {
      console.error('获取客户列表失败:', error);
    }
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    // 拖拽过程中的处理（如果需要）
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    
    console.log('=== handleDragEnd 调试信息 ===');
    console.log('active:', active);
    console.log('over:', over);
    
    if (!over) {
      console.log('没有over目标');
      setActiveId(null);
      return;
    }

    const opportunityId = active.id;
    
    // 从 over.id 中提取阶段ID（格式：'stage-2'）
    let newStageId;
    if (typeof over.id === 'string' && over.id.startsWith('stage-')) {
      newStageId = parseInt(over.id.replace('stage-', ''));
    } else if (over.data?.current?.stageId) {
      newStageId = parseInt(over.data.current.stageId);
    } else {
      console.error('无法解析阶段ID:', over.id);
      setActiveId(null);
      return;
    }

    console.log('商机ID:', opportunityId, '类型:', typeof opportunityId);
    console.log('新阶段ID:', newStageId, '类型:', typeof newStageId);

    // Find the opportunity
    let opportunity = null;
    let oldStageId = null;

    for (const stage of stages) {
      const found = stage.opportunities?.find(opp => opp.id === opportunityId);
      if (found) {
        opportunity = found;
        oldStageId = stage.id;
        break;
      }
    }

    console.log('找到的商机:', opportunity?.title);
    console.log('旧阶段ID:', oldStageId);

    setActiveId(null);

    // 如果没有找到商机或者阶段没有变化，直接返回
    if (!opportunity || oldStageId === newStageId) {
      console.log('商机未找到或阶段未变化');
      return;
    }

    // 找到目标阶段名称用于提示
    const targetStage = stages.find(s => s.id === newStageId);
    const targetStageName = targetStage ? targetStage.name : '新阶段';

    console.log('目标阶段:', targetStageName, 'ID:', newStageId);

    // 乐观更新UI
    const updatedStages = stages.map(stage => {
      if (stage.id === oldStageId) {
        return {
          ...stage,
          opportunities: stage.opportunities.filter(opp => opp.id !== opportunityId)
        };
      }
      if (stage.id === newStageId) {
        return {
          ...stage,
          opportunities: [...(stage.opportunities || []), opportunity]
        };
      }
      return stage;
    });
    setStages(updatedStages);

    try {
      console.log('发送API请求, 商机ID:', opportunityId, '新阶段ID:', newStageId);
      await salesFunnelAPI.moveOpportunityStage(opportunityId, {
        stageId: newStageId,
        notes: '拖拽移动阶段'
      });

      message.success(`已将"${opportunity.title}"移动到"${targetStageName}"`);
      // 重新获取数据以确保同步
      fetchData();
    } catch (error) {
      console.error('移动失败:', error);
      message.error('移动失败：' + (error.message || '未知错误'));
      // 失败时恢复原始数据
      fetchData();
    }
  };

  const handleCreateOpportunity = () => {
    form.resetFields();
    setCreateModalVisible(true);
  };

  const handleCreateSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      const data = {
        ...values,
        expectedCloseDate: values.expectedCloseDate ? values.expectedCloseDate.format('YYYY-MM-DD') : null
      };

      const response = await salesFunnelAPI.createOpportunity(data);
      
      if (response.success) {
        message.success('商机创建成功');
        setCreateModalVisible(false);
        form.resetFields();
        fetchData();
      }
    } catch (error) {
      if (error.errorFields) {
        message.error('请检查表单填写是否正确');
      } else {
        message.error('创建失败：' + (error.message || '未知错误'));
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY'
    }).format(amount || 0);
  };

  const activeOpportunity = activeId ? stages
    .flatMap(s => s.opportunities || [])
    .find(opp => opp.id === activeId) : null;

  return (
    <div className="sales-funnel-container">
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="商机总数"
              value={statistics?.totalOpportunities || 0}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="预期总金额"
              value={statistics?.totalAmount || 0}
              prefix={<DollarOutlined />}
              precision={2}
              suffix="元"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="加权金额"
              value={statistics?.totalWeightedAmount || 0}
              prefix={<DollarOutlined />}
              precision={2}
              suffix="元"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleCreateOpportunity}
              >
                新增商机
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchData}
              >
                刷新
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 销售漏斗看板 */}
      <Card title="销售漏斗" className="funnel-board">
        <Spin spinning={loading}>
          <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="stages-container">
              {stages.map((stage) => (
                <DroppableStage
                  key={stage.id}
                  stage={stage}
                  opportunities={stage.opportunities || []}
                  onRefresh={fetchData}
                />
              ))}
            </div>

            <DragOverlay>
              {activeOpportunity ? (
                <OpportunityCard opportunity={activeOpportunity} isDragging />
              ) : null}
            </DragOverlay>
          </DndContext>
        </Spin>
      </Card>

      {/* 创建商机模态框 */}
      <Modal
        title="新增商机"
        open={createModalVisible}
        onOk={handleCreateSubmit}
        onCancel={() => setCreateModalVisible(false)}
        width={600}
        okText="创建"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            label="客户"
            name="clientId"
            rules={[{ required: true, message: '请选择客户' }]}
          >
            <Select
              showSearch
              placeholder="选择客户"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {clients.map(client => (
                <Option key={client.id} value={client.id}>
                  {client.companyName}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="销售阶段"
            name="stageId"
            rules={[{ required: true, message: '请选择销售阶段' }]}
          >
            <Select placeholder="选择销售阶段">
              {stages.map(stage => (
                <Option key={stage.id} value={stage.id}>
                  {stage.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="商机标题"
            name="title"
            rules={[
              { required: true, message: '请输入商机标题' },
              { max: 200, message: '标题不能超过200个字符' }
            ]}
          >
            <Input placeholder="请输入商机标题" />
          </Form.Item>

          <Form.Item
            label="商机描述"
            name="description"
          >
            <TextArea
              placeholder="请输入商机描述"
              rows={4}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="预期金额（元）"
                name="expectedAmount"
                rules={[{ required: true, message: '请输入预期金额' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="请输入预期金额"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="成交概率（%）"
                name="probability"
                initialValue={50}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={100}
                  placeholder="请输入成交概率"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="预计成交日期"
            name="expectedCloseDate"
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder="选择预计成交日期"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SalesFunnel;

