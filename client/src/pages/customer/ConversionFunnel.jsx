import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Select, Button, message, Spin } from 'antd';
import { FilterOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import { customerLeadAPI } from '../../services/api';
import './ConversionFunnel.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

const ConversionFunnel = () => {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);
  const [selectedUser, setSelectedUser] = useState('');

  useEffect(() => {
    fetchStatistics();
  }, [dateRange, selectedUser]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const params = {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD')
      };
      if (selectedUser) {
        params.userId = selectedUser;
      }

      const response = await customerLeadAPI.getStatistics(params);
      if (response.success) {
        setStatistics(response.data);
        renderFunnelChart(response.data);
        renderConversionTrendChart(response.data);
      }
    } catch (error) {
      message.error('获取统计数据失败');
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderFunnelChart = (data) => {
    const chartDom = document.getElementById('funnelChart');
    if (!chartDom) return;

    const myChart = echarts.init(chartDom);
    
    const funnelData = [
      { value: data.totalLeads || 0, name: '新线索' },
      { value: data.byStatus?.contacted || 0, name: '已联系' },
      { value: data.byStatus?.qualified || 0, name: '已确认' },
      { value: data.byStatus?.negotiating || 0, name: '洽谈中' },
      { value: data.convertedCount || 0, name: '已转化' }
    ];

    const option = {
      title: {
        text: '客户转化漏斗',
        left: 'center',
        top: 20,
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        data: funnelData.map(item => item.name)
      },
      series: [
        {
          name: '转化漏斗',
          type: 'funnel',
          left: '20%',
          top: 80,
          bottom: 60,
          width: '60%',
          min: 0,
          max: data.totalLeads || 100,
          minSize: '0%',
          maxSize: '100%',
          sort: 'descending',
          gap: 2,
          label: {
            show: true,
            position: 'inside',
            formatter: '{b}: {c}'
          },
          labelLine: {
            length: 10,
            lineStyle: {
              width: 1,
              type: 'solid'
            }
          },
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 1
          },
          emphasis: {
            label: {
              fontSize: 16
            }
          },
          data: funnelData
        }
      ],
      color: ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de']
    };

    myChart.setOption(option);

    // 响应式
    window.addEventListener('resize', () => {
      myChart.resize();
    });
  };

  const renderConversionTrendChart = (data) => {
    const chartDom = document.getElementById('trendChart');
    if (!chartDom) return;

    const myChart = echarts.init(chartDom);

    // 模拟趋势数据（实际应该从后端获取）
    const dates = [];
    const newLeads = [];
    const converted = [];
    
    for (let i = 6; i >= 0; i--) {
      dates.push(dayjs().subtract(i, 'days').format('MM-DD'));
      newLeads.push(Math.floor(Math.random() * 20) + 10);
      converted.push(Math.floor(Math.random() * 5) + 2);
    }

    const option = {
      title: {
        text: '转化趋势',
        left: 'center',
        top: 20,
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        }
      },
      legend: {
        data: ['新增线索', '转化客户'],
        top: 60
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 100,
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: dates
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: '新增线索',
          type: 'line',
          smooth: true,
          data: newLeads,
          itemStyle: {
            color: '#5470c6'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(84, 112, 198, 0.3)' },
              { offset: 1, color: 'rgba(84, 112, 198, 0.1)' }
            ])
          }
        },
        {
          name: '转化客户',
          type: 'line',
          smooth: true,
          data: converted,
          itemStyle: {
            color: '#91cc75'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(145, 204, 117, 0.3)' },
              { offset: 1, color: 'rgba(145, 204, 117, 0.1)' }
            ])
          }
        }
      ]
    };

    myChart.setOption(option);

    window.addEventListener('resize', () => {
      myChart.resize();
    });
  };

  const handleRefresh = () => {
    fetchStatistics();
  };

  const handleExport = () => {
    message.success('导出功能开发中...');
  };

  if (loading && !statistics) {
    return (
      <div className="conversion-funnel-loading">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="conversion-funnel-container">
      <Card className="filter-card">
        <Row gutter={16} align="middle">
          <Col>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="YYYY-MM-DD"
            />
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              刷新
            </Button>
          </Col>
          <Col>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleExport}
            >
              导出报表
            </Button>
          </Col>
        </Row>
      </Card>

      {statistics && (
        <>
          <Row gutter={16} className="statistics-row">
            <Col span={6}>
              <Card>
                <Statistic
                  title="总线索数"
                  value={statistics.totalLeads || 0}
                  prefix={<FilterOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="已转化"
                  value={statistics.convertedCount || 0}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="转化率"
                  value={statistics.conversionRate || 0}
                  suffix="%"
                  precision={2}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="进行中"
                  value={(statistics.byStatus?.contacted || 0) + 
                         (statistics.byStatus?.qualified || 0) + 
                         (statistics.byStatus?.negotiating || 0)}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16} className="charts-row">
            <Col span={12}>
              <Card className="chart-card">
                <div id="funnelChart" style={{ width: '100%', height: '500px' }}></div>
              </Card>
            </Col>
            <Col span={12}>
              <Card className="chart-card">
                <div id="trendChart" style={{ width: '100%', height: '500px' }}></div>
              </Card>
            </Col>
          </Row>

          <Row gutter={16} className="detail-row">
            <Col span={12}>
              <Card title="各阶段详情" className="detail-card">
                <div className="stage-detail">
                  <div className="stage-item">
                    <span className="stage-label">新线索:</span>
                    <span className="stage-value">{statistics.byStatus?.new || 0}</span>
                  </div>
                  <div className="stage-item">
                    <span className="stage-label">已联系:</span>
                    <span className="stage-value">{statistics.byStatus?.contacted || 0}</span>
                  </div>
                  <div className="stage-item">
                    <span className="stage-label">已确认:</span>
                    <span className="stage-value">{statistics.byStatus?.qualified || 0}</span>
                  </div>
                  <div className="stage-item">
                    <span className="stage-label">洽谈中:</span>
                    <span className="stage-value">{statistics.byStatus?.negotiating || 0}</span>
                  </div>
                  <div className="stage-item">
                    <span className="stage-label">已转化:</span>
                    <span className="stage-value success">{statistics.convertedCount || 0}</span>
                  </div>
                  <div className="stage-item">
                    <span className="stage-label">已丢失:</span>
                    <span className="stage-value lost">{statistics.byStatus?.lost || 0}</span>
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="优先级分布" className="detail-card">
                <div className="priority-detail">
                  <div className="priority-item urgent">
                    <span className="priority-label">紧急:</span>
                    <span className="priority-value">{statistics.byPriority?.urgent || 0}</span>
                  </div>
                  <div className="priority-item high">
                    <span className="priority-label">高:</span>
                    <span className="priority-value">{statistics.byPriority?.high || 0}</span>
                  </div>
                  <div className="priority-item medium">
                    <span className="priority-label">中:</span>
                    <span className="priority-value">{statistics.byPriority?.medium || 0}</span>
                  </div>
                  <div className="priority-item low">
                    <span className="priority-label">低:</span>
                    <span className="priority-value">{statistics.byPriority?.low || 0}</span>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default ConversionFunnel;

