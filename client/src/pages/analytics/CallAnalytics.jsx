import React, { useState, useEffect } from 'react';
import { Card, Row, Col, DatePicker, Select, Spin, message, Empty, Statistic, Button, Space } from 'antd';
import { PhoneOutlined, ClockCircleOutlined, CheckCircleOutlined, PercentageOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { analyticsAPI } from '../../services/api';
import { exportMultiSheetExcel } from '../../utils/exportUtils';
import dayjs from 'dayjs';
import './Analytics.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

const CallAnalytics = () => {
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

      const response = await analyticsAPI.getCallAnalytics(params);
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      message.error('获取外呼分析数据失败');
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

    const statusNames = {
      'initiated': '已发起',
      'ringing': '振铃中',
      'answered': '已接听',
      'completed': '已完成',
      'no_answer': '未接听',
      'busy': '忙线',
      'failed': '失败'
    };

    const sheets = [
      {
        name: '外呼趋势',
        data: data.callTrend,
        columns: [
          { key: 'date', label: '日期', formatter: (v) => dayjs(v).format('YYYY-MM-DD') },
          { key: 'count', label: '外呼次数' }
        ]
      },
      {
        name: '外呼结果分布',
        data: data.statusDistribution,
        columns: [
          { key: 'status', label: '外呼结果', formatter: (v) => statusNames[v] || v || '未知' },
          { key: 'count', label: '次数' }
        ]
      }
    ];

    exportMultiSheetExcel(sheets, `外呼分析_${dayjs().format('YYYY-MM-DD')}`);
  };

  // 外呼量趋势图
  const getCallTrendOption = () => {
    if (!data?.callTrend || data.callTrend.length === 0) return null;

    return {
      title: {
        text: '外呼量趋势（最近30天）',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          return `${params[0].axisValue}<br/>外呼次数: ${params[0].value}`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.callTrend.map(item => dayjs(item.date).format('MM-DD')),
        axisLabel: { rotate: 45 }
      },
      yAxis: {
        type: 'value',
        name: '外呼次数'
      },
      series: [{
        type: 'line',
        data: data.callTrend.map(item => parseInt(item.count)),
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
        },
        markLine: {
          data: [{ type: 'average', name: '平均值' }]
        }
      }]
    };
  };

  // 外呼结果分布饼图
  const getStatusDistributionOption = () => {
    if (!data?.statusDistribution || data.statusDistribution.length === 0) return null;

    const statusNames = {
      'initiated': '已发起',
      'ringing': '振铃中',
      'answered': '已接听',
      'completed': '已完成',
      'no_answer': '未接听',
      'busy': '忙线',
      'failed': '失败'
    };

    const colors = {
      'answered': '#52c41a',
      'completed': '#1890ff',
      'no_answer': '#faad14',
      'busy': '#ff7a45',
      'failed': '#ff4d4f'
    };

    return {
      title: {
        text: '外呼结果分布',
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
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        data: data.statusDistribution.map(item => ({
          value: parseInt(item.count),
          name: statusNames[item.status] || item.status || '未知',
          itemStyle: { color: colors[item.status] || '#1890ff' }
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          formatter: '{b}\n{d}%'
        }
      }]
    };
  };

  // 通话时长分布柱状图
  const getDurationChartOption = () => {
    if (!data?.durationStats) return null;

    const { avgDuration, maxDuration, totalDuration } = data.durationStats;

    return {
      title: {
        text: '通话时长统计',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          const minutes = Math.floor(params[0].value / 60);
          const seconds = params[0].value % 60;
          return `${params[0].name}<br/>时长: ${minutes}分${seconds}秒`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['平均时长', '最长时长', '总时长']
      },
      yAxis: {
        type: 'value',
        name: '时长（秒）',
        axisLabel: {
          formatter: (value) => {
            const minutes = Math.floor(value / 60);
            return `${minutes}分`;
          }
        }
      },
      series: [{
        type: 'bar',
        data: [
          { value: avgDuration, itemStyle: { color: '#1890ff' } },
          { value: maxDuration, itemStyle: { color: '#52c41a' } },
          { value: totalDuration, itemStyle: { color: '#faad14' } }
        ],
        label: {
          show: true,
          position: 'top',
          formatter: (params) => {
            const minutes = Math.floor(params.value / 60);
            const seconds = params.value % 60;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
          }
        }
      }]
    };
  };

  // 接通率仪表盘
  const getAnswerRateGaugeOption = () => {
    if (!data) return null;

    return {
      title: {
        text: '接通率',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold' }
      },
      series: [{
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 100,
        splitNumber: 10,
        axisLine: {
          lineStyle: {
            width: 6,
            color: [
              [0.3, '#ff4d4f'],
              [0.7, '#faad14'],
              [1, '#52c41a']
            ]
          }
        },
        pointer: {
          itemStyle: {
            color: '#1890ff'
          }
        },
        axisTick: {
          distance: -30,
          length: 8,
          lineStyle: {
            color: '#fff',
            width: 2
          }
        },
        splitLine: {
          distance: -30,
          length: 30,
          lineStyle: {
            color: '#fff',
            width: 4
          }
        },
        axisLabel: {
          color: '#666',
          distance: 40,
          fontSize: 12,
          formatter: '{value}%'
        },
        detail: {
          valueAnimation: true,
          formatter: '{value}%',
          color: '#1890ff',
          fontSize: 30,
          offsetCenter: [0, '70%']
        },
        data: [{
          value: parseFloat(data.answerRate),
          name: '接通率'
        }]
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

  const trendOption = getCallTrendOption();
  const statusOption = getStatusDistributionOption();
  const durationOption = getDurationChartOption();
  const gaugeOption = getAnswerRateGaugeOption();

  // 格式化时长
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="analytics-container">
      <h2>外呼数据分析</h2>

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
        <Col span={6}>
          <Card>
            <Statistic
              title="总外呼次数"
              value={data.totalCalls}
              prefix={<PhoneOutlined />}
              styles={{ value: { color: '#1890ff' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="接通次数"
              value={data.answeredCalls}
              prefix={<CheckCircleOutlined />}
              styles={{ value: { color: '#52c41a' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="接通率"
              value={data.answerRate}
              precision={2}
              suffix="%"
              prefix={<PercentageOutlined />}
              styles={{ value: { color: data.answerRate >= 50 ? '#52c41a' : '#ff4d4f' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均通话时长"
              value={formatDuration(data.durationStats.avgDuration)}
              prefix={<ClockCircleOutlined />}
              styles={{ value: { color: '#faad14' } }}
            />
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
            {statusOption ? (
              <ReactECharts option={statusOption} style={{ height: 400 }} />
            ) : (
              <Empty description="暂无结果分布数据" />
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            {gaugeOption ? (
              <ReactECharts option={gaugeOption} style={{ height: 400 }} />
            ) : (
              <Empty description="暂无接通率数据" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card>
            {durationOption ? (
              <ReactECharts option={durationOption} style={{ height: 400 }} />
            ) : (
              <Empty description="暂无时长统计数据" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CallAnalytics;

