import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Space,
  Button,
  Spin,
  Empty,
  message
} from 'antd';
import {
  LineChartOutlined,
  BarChartOutlined,
  PieChartOutlined,
  ReloadOutlined,
  PhoneOutlined,
  UserOutlined,
  MailOutlined,
  CommentOutlined
} from '@ant-design/icons';
import { followUpReminderAPI } from '../services/api';
import * as echarts from 'echarts';
import dayjs from 'dayjs';
import './FollowUpStatistics.css';

const { RangePicker } = DatePicker;

const FollowUpStatistics = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    fetchStatistics();
  }, [dateRange]);

  useEffect(() => {
    if (statistics) {
      renderCharts();
    }
  }, [statistics]);

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD')
      };

      const response = await followUpReminderAPI.getFollowUpStatistics(params);
      
      if (response.success) {
        setStatistics(response.data);
      }
    } catch (error) {
      message.error('获取统计数据失败：' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  const renderCharts = () => {
    // 按类型统计图表
    const typeChart = echarts.init(document.getElementById('type-chart'));
    const typeData = statistics.byType.map(item => ({
      name: getFollowUpTypeName(item.followUpType),
      value: parseInt(item.count)
    }));

    typeChart.setOption({
      title: {
        text: '跟进类型分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          type: 'pie',
          radius: '50%',
          data: typeData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    });

    // 按状态统计图表
    const statusChart = echarts.init(document.getElementById('status-chart'));
    const statusData = statistics.byStatus.map(item => ({
      name: getStatusName(item.status),
      value: parseInt(item.count)
    }));

    statusChart.setOption({
      title: {
        text: '跟进状态分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: statusData
        }
      ]
    });

    // 按日期统计图表
    const dateChart = echarts.init(document.getElementById('date-chart'));
    const dates = statistics.byDate.map(item => item.date);
    const counts = statistics.byDate.map(item => parseInt(item.count));

    dateChart.setOption({
      title: {
        text: '跟进趋势（最近7天）',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          formatter: (value) => dayjs(value).format('MM-DD')
        }
      },
      yAxis: {
        type: 'value',
        name: '跟进次数'
      },
      series: [
        {
          data: counts,
          type: 'line',
          smooth: true,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
            ])
          },
          itemStyle: {
            color: '#1890ff'
          }
        }
      ]
    });

    // 响应式调整
    window.addEventListener('resize', () => {
      typeChart.resize();
      statusChart.resize();
      dateChart.resize();
    });
  };

  const getFollowUpTypeName = (type) => {
    const typeMap = {
      phone: '电话',
      visit: '拜访',
      email: '邮件',
      wechat: '微信',
      meeting: '会议',
      other: '其他'
    };
    return typeMap[type] || type;
  };

  const getStatusName = (status) => {
    const statusMap = {
      positive: '积极',
      neutral: '中性',
      negative: '消极',
      no_response: '无响应'
    };
    return statusMap[status] || status;
  };

  const getFollowUpTypeIcon = (type) => {
    const iconMap = {
      phone: <PhoneOutlined />,
      visit: <UserOutlined />,
      email: <MailOutlined />,
      wechat: <CommentOutlined />,
      meeting: <UserOutlined />,
      other: <CommentOutlined />
    };
    return iconMap[type] || <CommentOutlined />;
  };

  return (
    <div className="follow-up-statistics-container">
      <Card
        title="跟进统计分析"
        extra={
          <Space>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              format="YYYY-MM-DD"
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchStatistics}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <Spin spinning={loading}>
          {statistics ? (
            <>
              {/* 统计卡片 */}
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="总跟进次数"
                      value={statistics.totalFollowUps}
                      prefix={<LineChartOutlined />}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="平均跟进间隔"
                      value={statistics.avgInterval}
                      suffix="天"
                      prefix={<BarChartOutlined />}
                      valueStyle={{ color: '#52c41a' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="跟进类型"
                      value={statistics.byType.length}
                      prefix={<PieChartOutlined />}
                      valueStyle={{ color: '#faad14' }}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="跟进状态"
                      value={statistics.byStatus.length}
                      prefix={<PieChartOutlined />}
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </Card>
                </Col>
              </Row>

              {/* 图表区域 */}
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={24}>
                  <Card>
                    <div id="date-chart" style={{ height: 300 }}></div>
                  </Card>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Card>
                    <div id="type-chart" style={{ height: 400 }}></div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card>
                    <div id="status-chart" style={{ height: 400 }}></div>
                  </Card>
                </Col>
              </Row>

              {/* 详细数据 */}
              <Row gutter={16} style={{ marginTop: 24 }}>
                <Col span={12}>
                  <Card title="跟进类型详情">
                    <div className="detail-list">
                      {statistics.byType.map(item => (
                        <div key={item.followUpType} className="detail-item">
                          <Space>
                            {getFollowUpTypeIcon(item.followUpType)}
                            <span>{getFollowUpTypeName(item.followUpType)}</span>
                          </Space>
                          <span className="detail-value">{item.count} 次</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="跟进状态详情">
                    <div className="detail-list">
                      {statistics.byStatus.map(item => (
                        <div key={item.status} className="detail-item">
                          <span>{getStatusName(item.status)}</span>
                          <span className="detail-value">{item.count} 次</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>
              </Row>
            </>
          ) : (
            <Empty description="暂无数据" />
          )}
        </Spin>
      </Card>
    </div>
  );
};

export default FollowUpStatistics;

