import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { callAPI, clientAPI, userAPI } from '../services/api';
import {
  Users,
  Phone,
  TrendingUp,
  Clock,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    totalCalls: 0,
    totalUsers: 0,
    avgCallDuration: 0,
  });
  const [callStats, setCallStats] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 获取统计数据
      const [clientsRes, callsRes, statsRes] = await Promise.all([
        clientAPI.getClients({ limit: 1 }),
        callAPI.getCalls({ limit: 10 }),
        callAPI.getStatistics(),
      ]);

      setStats({
        totalClients: clientsRes.pagination?.total || 0,
        totalCalls: callsRes.pagination?.total || 0,
        totalUsers: 0,
        avgCallDuration: statsRes.data?.averageDuration || 0,
      });

      setCallStats(statsRes.data);
      setRecentCalls(callsRes.data || []);

      // 如果是管理员或经理，获取用户数量
      if (user.role === 'admin' || user.role === 'manager') {
        const usersRes = await userAPI.getUsers({ limit: 1 });
        setStats(prev => ({
          ...prev,
          totalUsers: usersRes.pagination?.total || 0,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: '客户总数',
      value: stats.totalClients,
      icon: Users,
      color: 'var(--accent-primary)',
      change: '+12%',
      trend: 'up',
    },
    {
      title: '外呼记录',
      value: stats.totalCalls,
      icon: Phone,
      color: 'var(--accent-secondary)',
      change: '+8%',
      trend: 'up',
    },
    {
      title: '平均通话时长',
      value: `${Math.floor(stats.avgCallDuration / 60)}分钟`,
      icon: Clock,
      color: 'var(--success)',
      change: '-3%',
      trend: 'down',
    },
    {
      title: '员工总数',
      value: stats.totalUsers,
      icon: TrendingUp,
      color: 'var(--warning)',
      change: '+5%',
      trend: 'up',
      hidden: user.role !== 'admin' && user.role !== 'manager',
    },
  ];

  // 模拟图表数据
  const callTrendData = [
    { date: '1月', calls: 65 },
    { date: '2月', calls: 78 },
    { date: '3月', calls: 90 },
    { date: '4月', calls: 81 },
    { date: '5月', calls: 95 },
    { date: '6月', calls: 112 },
  ];

  const callTypeData = [
    { name: '呼出', value: 65, color: 'var(--accent-primary)' },
    { name: '呼入', value: 35, color: 'var(--accent-secondary)' },
  ];

  const callResultData = [
    { result: '已接听', count: 85 },
    { result: '未接听', count: 25 },
    { result: '忙线', count: 15 },
    { result: '失败', count: 10 },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">仪表板</h1>
          <p className="page-subtitle">欢迎回来，{user.username}！</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="stats-grid">
        {statCards.filter(card => !card.hidden).map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="stat-card" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="stat-card-header">
                <div className="stat-icon" style={{ background: card.color }}>
                  <Icon size={24} />
                </div>
                <div className={`stat-change ${card.trend}`}>
                  {card.trend === 'up' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                  {card.change}
                </div>
              </div>
              <div className="stat-content">
                <h3 className="stat-title">{card.title}</h3>
                <p className="stat-value">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 图表区域 */}
      <div className="charts-grid">
        {/* 外呼趋势 */}
        <div className="chart-card">
          <h3 className="chart-title">外呼趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={callTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="date" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
              <Line
                type="monotone"
                dataKey="calls"
                stroke="var(--accent-primary)"
                strokeWidth={3}
                dot={{ fill: 'var(--accent-primary)', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 呼叫类型分布 */}
        <div className="chart-card">
          <h3 className="chart-title">呼叫类型分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={callTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {callTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 呼叫结果统计 */}
        <div className="chart-card chart-card-wide">
          <h3 className="chart-title">呼叫结果统计</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={callResultData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="result" stroke="var(--text-secondary)" />
              <YAxis stroke="var(--text-secondary)" />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                }}
              />
              <Bar dataKey="count" fill="var(--accent-secondary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 最近外呼记录 */}
      <div className="recent-calls-card">
        <h3 className="chart-title">最近外呼记录</h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>客户</th>
                <th>类型</th>
                <th>时长</th>
                <th>结果</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              {recentCalls.length > 0 ? (
                recentCalls.map((call) => (
                  <tr key={call.id}>
                    <td>{call.Client?.companyName || '-'}</td>
                    <td>
                      <span className={`badge badge-${call.direction === 'outbound' ? 'info' : 'success'}`}>
                        {call.direction === 'outbound' ? '呼出' : '呼入'}
                      </span>
                    </td>
                    <td>{Math.floor((call.duration || 0) / 60)}分{(call.duration || 0) % 60}秒</td>
                    <td>
                      <span className={`badge badge-${
                        call.status === 'answered' ? 'success' :
                        call.status === 'no_answer' ? 'warning' : 'error'
                      }`}>
                        {call.status === 'answered' ? '已接听' :
                         call.status === 'no_answer' ? '未接听' :
                         call.status === 'busy' ? '忙线' : 
                         call.status === 'completed' ? '已完成' : '失败'}
                      </span>
                    </td>
                    <td>{new Date(call.callTime).toLocaleString('zh-CN')}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    暂无外呼记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;





