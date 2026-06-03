import React, { useState, useEffect } from 'react';
import { Card, Row, Col, DatePicker, Spin, message, Empty, Button, Space } from 'antd';
import { UserOutlined, TeamOutlined, RiseOutlined, DownloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { analyticsAPI } from '../../services/api';
import { exportMultiSheetExcel } from '../../utils/exportUtils';
import dayjs from 'dayjs';
import './Analytics.css';

const { RangePicker } = DatePicker;

const CustomerAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(6, 'month'),
    dayjs()
  ]);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      const response = await analyticsAPI.getCustomerAnalytics(params);
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      message.error('获取客户分析数据失败');
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

    const levelNames = {
      'A': 'A级客户（重点）',
      'B': 'B级客户（重要）',
      'C': 'C级客户（普通）',
      'D': 'D级客户（潜在）'
    };

    const sourceNames = {
      'website': '官网',
      'referral': '转介绍',
      'exhibition': '展会',
      'cold_call': '电话营销',
      'social_media': '社交媒体',
      'advertisement': '广告',
      'partner': '合作伙伴',
      'other': '其他'
    };

    const sheets = [
      {
        name: '客户等级分布',
        data: data.levelDistribution,
        columns: [
          { key: 'customerLevel', label: '客户等级', formatter: (v) => levelNames[v] || v || '未分级' },
          { key: 'count', label: '客户数量' }
        ]
      },
      {
        name: '客户来源分布',
        data: data.sourceDistribution,
        columns: [
          { key: 'customerSource', label: '客户来源', formatter: (v) => sourceNames[v] || v || '未知' },
          { key: 'count', label: '客户数量' }
        ]
      },
      {
        name: '客户增长趋势',
        data: data.growthTrend,
        columns: [
          { key: 'month', label: '月份', formatter: (v) => dayjs(v).format('YYYY-MM') },
          { key: 'count', label: '新增客户数' }
        ]
      }
    ];

    exportMultiSheetExcel(sheets, `客户分析_${dayjs().format('YYYY-MM-DD')}`);
  };

  // 客户等级分布饼图
  const getLevelPieChartOption = () => {
    if (!data?.levelDistribution || data.levelDistribution.length === 0) return null;

    const levelNames = {
      'A': 'A级客户（重点）',
      'B': 'B级客户（重要）',
      'C': 'C级客户（普通）',
      'D': 'D级客户（潜在）'
    };

    const colors = {
      'A': '#ff4d4f',
      'B': '#ff7a45',
      'C': '#ffa940',
      'D': '#52c41a'
    };

    return {
      title: {
        text: '客户等级分布',
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
        data: data.levelDistribution.map(item => ({
          value: parseInt(item.count),
          name: levelNames[item.customerLevel] || item.customerLevel || '未分级',
          itemStyle: { color: colors[item.customerLevel] || '#1890ff' }
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

  // 客户来源分布柱状图
  const getSourceBarChartOption = () => {
    if (!data?.sourceDistribution || data.sourceDistribution.length === 0) return null;

    const sourceNames = {
      'website': '官网',
      'referral': '转介绍',
      'exhibition': '展会',
      'cold_call': '电话营销',
      'social_media': '社交媒体',
      'advertisement': '广告',
      'partner': '合作伙伴',
      'other': '其他'
    };

    return {
      title: {
        text: '客户来源分布',
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
        data: data.sourceDistribution.map(item => 
          sourceNames[item.customerSource] || item.customerSource || '未知'
        ),
        axisLabel: {
          rotate: 30,
          interval: 0
        }
      },
      yAxis: {
        type: 'value',
        name: '客户数量'
      },
      series: [{
        type: 'bar',
        data: data.sourceDistribution.map(item => parseInt(item.count)),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#1890ff' },
              { offset: 1, color: '#52c41a' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        label: {
          show: true,
          position: 'top'
        }
      }]
    };
  };

  // 客户增长趋势图
  const getGrowthTrendChartOption = () => {
    if (!data?.growthTrend || data.growthTrend.length === 0) return null;

    return {
      title: {
        text: '客户增长趋势',
        left: 'center',
        textStyle: { fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          return `${params[0].axisValue}<br/>新增客户: ${params[0].value}`;
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
        data: data.growthTrend.map(item => dayjs(item.month).format('YYYY-MM')),
        axisLabel: { rotate: 45 }
      },
      yAxis: {
        type: 'value',
        name: '新增客户数'
      },
      series: [{
        type: 'line',
        data: data.growthTrend.map(item => parseInt(item.count)),
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
      }],
      dataZoom: [{
        type: 'inside',
        start: 0,
        end: 100
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

  const levelOption = getLevelPieChartOption();
  const sourceOption = getSourceBarChartOption();
  const growthOption = getGrowthTrendChartOption();

  // 计算统计数据
  const totalCustomers = data.levelDistribution.reduce((sum, item) => sum + parseInt(item.count), 0);
  const topSource = data.sourceDistribution.length > 0 
    ? data.sourceDistribution.reduce((max, item) => 
        parseInt(item.count) > parseInt(max.count) ? item : max
      ) 
    : null;

  return (
    <div className="analytics-container">
      <h2>客户分析</h2>

      {/* 筛选器 */}
      <Card className="filter-card">
        <Row gutter={16} align="middle">
          <Col span={20}>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
              placeholder={['开始日期', '结束日期']}
            />
          </Col>
          <Col span={4}>
            <Space>
              <Button 
                icon={<RiseOutlined />} 
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
              <UserOutlined style={{ fontSize: 32, color: '#1890ff' }} />
              <div style={{ marginTop: 8, fontSize: 14, color: '#8c8c8c' }}>客户总数</div>
              <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4 }}>{totalCustomers}</div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <TeamOutlined style={{ fontSize: 32, color: '#52c41a' }} />
              <div style={{ marginTop: 8, fontSize: 14, color: '#8c8c8c' }}>主要来源</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginTop: 4 }}>
                {topSource?.customerSource || '-'}
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <RiseOutlined style={{ fontSize: 32, color: '#faad14' }} />
              <div style={{ marginTop: 8, fontSize: 14, color: '#8c8c8c' }}>本月新增</div>
              <div style={{ fontSize: 24, fontWeight: 600, marginTop: 4 }}>
                {data.growthTrend.length > 0 ? data.growthTrend[data.growthTrend.length - 1].count : 0}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card>
            {growthOption ? (
              <ReactECharts option={growthOption} style={{ height: 400 }} />
            ) : (
              <Empty description="暂无增长趋势数据" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card>
            {levelOption ? (
              <ReactECharts option={levelOption} style={{ height: 400 }} />
            ) : (
              <Empty description="暂无等级分布数据" />
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            {sourceOption ? (
              <ReactECharts option={sourceOption} style={{ height: 400 }} />
            ) : (
              <Empty description="暂无来源分布数据" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default CustomerAnalytics;

