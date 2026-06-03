import React, { useState, useEffect } from 'react';
import { Card, Row, Col, DatePicker, Select, Spin, message, Empty, Button, Space } from 'antd';
import { PhoneOutlined, CheckCircleOutlined, UserOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { analyticsAPI } from '../../services/api';
import { exportMultiSheetExcel } from '../../utils/exportUtils';
import dayjs from 'dayjs';
import './Analytics.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

const FollowUpAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }
      if (selectedUser) {
        params.userId = selectedUser;
      }

      const response = await analyticsAPI.getFollowUpAnalytics(params);
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      message.error('获取跟进分析数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 导出数据
  const handleExport = () => {
    if (!data) {
      message.warning('暂无数据可导出');
      return;
    }

    const typeNames = {
      'phone': '电话',
      'visit': '拜访',
      'email': '邮件',
      'wechat': '微信',
      'meeting': '会议',
      'other': '其他'
    };

    const resultNames = {
      'success': '成功',
      'failed': '失败',
      'pending': '待定',
      'follow_up': '需再跟进'
    };

    const sheets = [
      {
        name: '跟进趋势',
        data: data.followUpTrend,
        columns: [
          { key: 'date', label: '日期', formatter: (v) => dayjs(v).format('YYYY-MM-DD') },
          { key: 'count', label: '跟进次数' }
        ]
      },
      {
        name: '跟进方式分布',
        data: data.typeDistribution,
        columns: [
          { key: 'followType', label: '跟进方式', formatter: (v) => typeNames[v] || v || '未知' },
          { key: 'count', label: '次数' }
        ]
      },
      {
        name: '跟进结果分布',
        data: data.resultDistribution,
        columns: [
          { key: 'result', label: '跟进结果', formatter: (v) => resultNames[v] || v || '未知' },
          { key: 'count', label: '次数' }
        ]
      },
      {
        name: '员工跟进排行',
        data: data.userRanking,
        columns: [
          { key: 'user.username', label: '员工姓名' },
          { key: 'count', label: '跟进次数' }
        ]
      }
    ];

    exportMultiSheetExcel(sheets, `跟进分析_${dayjs().format('YYYY-MM-DD')}`);
  };

  // 跟进方式分布饼图
  const getTypeDistributionOption = () => {
    if (!data?.typeDistribution || data.typeDistribution.length === 0) return null;

    const typeNames = {
      'phone': '电话',
      'visit': '拜访',
      'email': '邮件',
      'wechat': '微信',
      'meeting': '会议',
      'other': '其他'
    };

    return {
      title: {
        text: '跟进方式分布',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'center'
      },
      series: [{
        type: 'pie',
        radius: '60%',
        data: data.typeDistribution.map(item => ({
          value: parseInt(item.count),
          name: typeNames[item.followType] || item.followType || '未知'
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  };

  // 跟进结果分布柱状图
  const getResultDistributionOption = () => {
    if (!data?.resultDistribution || data.resultDistribution.length === 0) return null;

    const resultNames = {
      'success': '成功',
      'failed': '失败',
      'pending': '待定',
      'follow_up': '需再跟进'
    };

    const colors = {
      'success': '#52c41a',
      'failed': '#ff4d4f',
      'pending': '#faad14',
      'follow_up': '#1890ff'
    };

    return {
      title: {
        text: '跟进结果分布',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.resultDistribution.map(item => 
          resultNames[item.result] || item.result || '未知'
        )
      },
      yAxis: {
        type: 'value',
        name: '次数'
      },
      series: [{
        type: 'bar',
        data: data.resultDistribution.map(item => ({
          value: parseInt(item.count),
          itemStyle: { color: colors[item.result] || '#1890ff' }
        })),
        label: {
          show: true,
          position: 'top'
        }
      }]
    };
  };

  // 员工跟进排行
  const getUserRankingOption = () => {
    if (!data?.userRanking || data.userRanking.length === 0) return null;

    return {
      title: {
        text: '员工跟进排行（Top 10）',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: '跟进次数'
      },
      yAxis: {
        type: 'category',
        data: data.userRanking.map(item => item['user.username'] || '未分配')
      },
      series: [{
        type: 'bar',
        data: data.userRanking.map(item => parseInt(item.count)),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#1890ff' },
              { offset: 1, color: '#52c41a' }
            ]
          },
          borderRadius: [0, 4, 4, 0]
        },
        label: {
          show: true,
          position: 'right'
        }
      }]
    };
  };

  // 跟进趋势图
  const getFollowUpTrendOption = () => {
    if (!data?.followUpTrend || data.followUpTrend.length === 0) return null;

    return {
      title: {
        text: '跟进趋势（最近30天）',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.followUpTrend.map(item => dayjs(item.date).format('MM-DD')),
        axisLabel: { rotate: 45 }
      },
      yAxis: {
        type: 'value',
        name: '跟进次数'
      },
      series: [{
        type: 'line',
        data: data.followUpTrend.map(item => parseInt(item.count)),
        smooth: true,
        itemStyle: { color: '#1890ff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
            ]
          }
        }
      }]
    };
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!data) {
    return <Empty description="暂无数据" />;
  }

  const typeOption = getTypeDistributionOption();
  const resultOption = getResultDistributionOption();
  const rankingOption = getUserRankingOption();
  const trendOption = getFollowUpTrendOption();

  // 计算统计数据
  const totalFollowUps = data.typeDistribution.reduce((sum, item) => sum + parseInt(item.count), 0);
  const successCount = data.resultDistribution.find(item => item.result === 'success')?.count || 0;
  const successRate = totalFollowUps > 0 ? ((successCount / totalFollowUps) * 100).toFixed(2) : 0;

  return (
    <div className="analytics-container">
      <h2>跟进效率分析</h2>

      {/* 筛选器 */}
      <Card className="filter-card">
        <Row gutter={16} align="middle">
          <Col span={10}>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
              placeholder={['开始日期', '结束日期']}
            />
          </Col>
          <Col span={10}>
            <Select
              placeholder="选择员工"
              allowClear
              style={{ width: '100%' }}
              value={selectedUser}
              onChange={setSelectedUser}
            >
            </Select>
          </Col>
          <Col span={4}>
            <Space>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchData}
              >
                刷新
              </Button>
              <Button 
                type="primary" 
                icon={<DownloadOutlined />}
                onClick={handleExport}
              >
                导出
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <PhoneOutlined style={{ fontSize: 32, color: '#1890ff' }} />
              <div style={{ marginTop: 8, fontSize: 14, color: '#8c8c8c' }}>总跟进次数</div>
              <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4 }}>{totalFollowUps}</div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a' }} />
              <div style={{ marginTop: 8, fontSize: 14, color: '#8c8c8c' }}>成功次数</div>
              <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4 }}>{successCount}</div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <UserOutlined style={{ fontSize: 32, color: '#faad14' }} />
              <div style={{ marginTop: 8, fontSize: 14, color: '#8c8c8c' }}>成功率</div>
              <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4 }}>{successRate}%</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card>
            {trendOption ? (
              <ReactECharts option={trendOption} style={{ height: 400 }} />
            ) : (
              <Empty description="暂无趋势数据" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card>
            {typeOption ? (
              <ReactECharts option={typeOption} style={{ height: 400 }} />
            ) : (
              <Empty description="暂无方式分布数据" />
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            {resultOption ? (
              <ReactECharts option={resultOption} style={{ height: 400 }} />
            ) : (
              <Empty description="暂无结果分布数据" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card>
            {rankingOption ? (
              <ReactECharts option={rankingOption} style={{ height: 400 }} />
            ) : (
              <Empty description="暂无排行数据" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default FollowUpAnalytics;

