import React, { useState, useEffect } from 'react';
import { Card, Row, Col, DatePicker, Select, Spin, message, Statistic, Empty, Button, Space } from 'antd';
import { DollarOutlined, RiseOutlined, FallOutlined, TrophyOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { analyticsAPI } from '../../services/api';
import dayjs from 'dayjs';
import './Analytics.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

const SalesAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(6, 'month'),
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

      const response = await analyticsAPI.getSalesAnalytics(params);
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      message.error('获取销售分析数据失败');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 导出数据为CSV
  const exportToCSV = () => {
    if (!data) {
      message.warning('暂无数据可导出');
      return;
    }

    try {
      let csvContent = '\uFEFF'; // UTF-8 BOM
      
      // 销售趋势数据
      csvContent += '销售趋势\n';
      csvContent += '月份,商机数量,预期金额\n';
      data.salesTrend.forEach(item => {
        csvContent += `${dayjs(item.month).format('YYYY-MM')},${item.count},${item.totalAmount}\n`;
      });
      
      csvContent += '\n销售漏斗\n';
      csvContent += '阶段,商机数量\n';
      data.funnelData.forEach(item => {
        csvContent += `${item.name},${item.count}\n`;
      });
      
      csvContent += '\n销售人员排行\n';
      csvContent += '销售人员,商机数量,总金额\n';
      data.salesByUser.forEach(item => {
        csvContent += `${item['assignedUser.username'] || '未分配'},${item.count},${item.totalAmount}\n`;
      });

      // 创建下载链接
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `销售分析_${dayjs().format('YYYY-MM-DD')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success('数据导出成功');
    } catch (error) {
      message.error('导出失败');
      console.error(error);
    }
  };

  // 销售趋势图配置
  const getTrendChartOption = () => {
    if (!data?.salesTrend || data.salesTrend.length === 0) return null;

    return {
      title: {
        text: '销售趋势',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        formatter: (params) => {
          let result = `${params[0].axisValue}<br/>`;
          params.forEach(item => {
            result += `${item.marker} ${item.seriesName}: ${item.value.toLocaleString()}<br/>`;
          });
          return result;
        }
      },
      legend: {
        data: ['商机数量', '预期金额'],
        bottom: 10
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.salesTrend.map(item => dayjs(item.month).format('YYYY-MM')),
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: [
        {
          type: 'value',
          name: '数量',
          position: 'left'
        },
        {
          type: 'value',
          name: '金额（元）',
          position: 'right'
        }
      ],
      series: [
        {
          name: '商机数量',
          type: 'line',
          data: data.salesTrend.map(item => parseInt(item.count)),
          smooth: true,
          itemStyle: {
            color: '#1890ff'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
                { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
              ]
            }
          }
        },
        {
          name: '预期金额',
          type: 'line',
          yAxisIndex: 1,
          data: data.salesTrend.map(item => parseFloat(item.totalAmount || 0)),
          smooth: true,
          itemStyle: {
            color: '#52c41a'
          }
        }
      ],
      // 添加数据缩放
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100
        },
        {
          start: 0,
          end: 100
        }
      ]
    };
  };

  // 销售漏斗图配置
  const getFunnelChartOption = () => {
    if (!data?.funnelData || data.funnelData.length === 0) return null;

    return {
      title: {
        text: '销售漏斗',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          const percent = ((params.value / data.funnelData[0].count) * 100).toFixed(1);
          return `${params.name}<br/>数量: ${params.value}<br/>占比: ${percent}%`;
        }
      },
      series: [
        {
          type: 'funnel',
          left: '10%',
          top: 60,
          bottom: 60,
          width: '80%',
          min: 0,
          max: 100,
          minSize: '0%',
          maxSize: '100%',
          sort: 'descending',
          gap: 2,
          label: {
            show: true,
            position: 'inside',
            formatter: '{b}: {c}',
            fontSize: 14
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
              fontSize: 18,
              fontWeight: 'bold'
            },
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          data: data.funnelData.map(item => ({
            value: parseInt(item.count),
            name: item.name
          }))
        }
      ]
    };
  };

  // 成交率饼图配置
  const getWinRatePieChartOption = () => {
    if (!data) return null;

    const wonCount = Math.round(data.amountStats.totalCount * data.winRate / 100);
    const lostCount = data.amountStats.totalCount - wonCount;

    return {
      title: {
        text: '成交率分析',
        left: 'center',
        textStyle: {
          fontSize: 16,
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
        top: 'center'
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['60%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}\n{d}%'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold'
            }
          },
          data: [
            { 
              value: wonCount, 
              name: '已成交',
              itemStyle: { color: '#52c41a' }
            },
            { 
              value: lostCount, 
              name: '未成交',
              itemStyle: { color: '#ff4d4f' }
            }
          ]
        }
      ]
    };
  };

  // 销售人员排行图配置
  const getUserRankingChartOption = () => {
    if (!data?.salesByUser || data.salesByUser.length === 0) return null;

    const sortedData = [...data.salesByUser].sort((a, b) => parseFloat(b.totalAmount) - parseFloat(a.totalAmount));
    const top10 = sortedData.slice(0, 10);

    return {
      title: {
        text: '销售人员排行（Top 10）',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params) => {
          const item = params[0];
          const userData = top10[item.dataIndex];
          return `${item.name}<br/>
                  销售金额: ¥${item.value.toLocaleString()}<br/>
                  商机数量: ${userData.count}`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: '金额（元）',
        axisLabel: {
          formatter: (value) => {
            if (value >= 10000) {
              return (value / 10000).toFixed(1) + '万';
            }
            return value;
          }
        }
      },
      yAxis: {
        type: 'category',
        data: top10.map(item => item['assignedUser.username'] || '未分配'),
        axisLabel: {
          interval: 0
        }
      },
      series: [
        {
          name: '销售金额',
          type: 'bar',
          data: top10.map(item => parseFloat(item.totalAmount || 0)),
          itemStyle: {
            color: (params) => {
              const colors = ['#ff4d4f', '#ff7a45', '#ffa940', '#ffc53d', '#fadb14', 
                             '#a0d911', '#52c41a', '#13c2c2', '#1890ff', '#2f54eb'];
              return colors[params.dataIndex] || '#1890ff';
            },
            borderRadius: [0, 4, 4, 0]
          },
          label: {
            show: true,
            position: 'right',
            formatter: (params) => {
              if (params.value >= 10000) {
                return '¥' + (params.value / 10000).toFixed(1) + '万';
              }
              return '¥' + params.value.toLocaleString();
            }
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    };
  };

  // 图表点击事件处理
  const onChartClick = (params, chartType) => {
    console.log(`点击了${chartType}:`, params);
    message.info(`点击了 ${params.name}`);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!data) {
    return <Empty description="暂无数据" />;
  }

  const trendOption = getTrendChartOption();
  const funnelOption = getFunnelChartOption();
  const rankingOption = getUserRankingChartOption();
  const winRatePieOption = getWinRatePieChartOption();

  return (
    <div className="analytics-container">
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
              placeholder="选择销售人员"
              allowClear
              style={{ width: '100%' }}
              value={selectedUser}
              onChange={setSelectedUser}
            >
              {/* 这里可以添加销售人员列表 */}
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
                onClick={exportToCSV}
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
              title="总销售额"
              value={data.amountStats.totalAmount}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              styles={{ value: { color: '#3f8600' } }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均金额"
              value={data.amountStats.avgAmount}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="商机总数"
              value={data.amountStats.totalCount}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="成交率"
              value={data.winRate}
              precision={2}
              suffix="%"
              prefix={<TrophyOutlined />}
              styles={{ value: { color: data.winRate >= 50 ? '#3f8600' : '#cf1322' } }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card>
            {trendOption ? (
              <ReactECharts 
                option={trendOption} 
                style={{ height: 400 }}
                onEvents={{
                  click: (params) => onChartClick(params, '销售趋势')
                }}
              />
            ) : (
              <Empty description="暂无销售趋势数据" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card>
            {funnelOption ? (
              <ReactECharts 
                option={funnelOption} 
                style={{ height: 400 }}
                onEvents={{
                  click: (params) => onChartClick(params, '销售漏斗')
                }}
              />
            ) : (
              <Empty description="暂无漏斗数据" />
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            {winRatePieOption ? (
              <ReactECharts 
                option={winRatePieOption} 
                style={{ height: 400 }}
                onEvents={{
                  click: (params) => onChartClick(params, '成交率分析')
                }}
              />
            ) : (
              <Empty description="暂无成交率数据" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card>
            {rankingOption ? (
              <ReactECharts 
                option={rankingOption} 
                style={{ height: 400 }}
                onEvents={{
                  click: (params) => onChartClick(params, '销售人员排行')
                }}
              />
            ) : (
              <Empty description="暂无排行数据" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SalesAnalytics;

