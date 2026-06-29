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

const COLORS = ['var(--accent-primary)', 'var(--accent-secondary)', '#52c41a', '#faad14', '#f5222d', '#722ed1'];
const STATUS_COLORS = { connected: '#52c41a', no_answer: '#faad14', busy: '#f5222d', rejected: '#ff4d4f', failed: '#8c8c8c', pending: '#1890ff' };

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    totalCalls: 0,
    totalUsers: 0,
    avgCallDuration: 0,
    connectionRate: 0,
  });
  const [callStats, setCallStats] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const [clientsRes, callsRes, statsRes] = await Promise.all([
        clientAPI.getClients({ limit: 1 }),
        callAPI.getCalls({ limit: 10 }),
        callAPI.getStatistics(),
      ]);

      const callData = statsRes.data || {};

      setStats({
        totalClients: clientsRes.pagination?.total || 0,
        totalCalls: callsRes.pagination?.total || 0,
        totalUsers: 0,
        avgCallDuration: callData.averageDuration || 0,
        connectionRate: callData.connectionRate || 0,
      });

      setCallStats(callData);
      setRecentCalls(callsRes.data || []);

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

  // 从真实API数据构建图表数据
  const callTrendData = callStats?.dailyStats?.map(d => ({
    date: d.date?.slice(5) || d.date,
    calls: d.count || d.total || 0,
  })) || [];

  const callTypeData = callStats?.byType?.map(t => ({
    name: t.callType === 'outbound' ? '呼出' : t.callType === 'inbound' ? '呼入' : t.callType === 'callback' ? '回拨' : t.callType,
    value: parseInt(t.count) || 0,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  })) || [];

  const callResultData = callStats?.byStatus?.map(s => ({
    result: { connected: '已接听', no_answer: '未接听', busy: '忙线', rejected: '拒接', failed: '失败', pending: '待处理' }[s.callStatus] || s.callStatus,
    count: parseInt(s.count) || 0,
    color: STATUS_COLORS[s.callStatus] || '#8c8c8c',
  })) || [];

  const statCards = [
    {
      title: '客户总数',
      value: stats.totalClients,
      icon: Users,
      color: 'var(--accent-primary)',
      change: `${stats.connectionRate}%`,
      trend: 'up',
    },
    {
      title: '外呼记录',
      value: stats.totalCalls,
      icon: Phone,
      color: 'var(--accent-secondary)',
      change: stats.connectionRate > 50 ? '+↑' : '+→',
      trend: stats.connectionRate > 50 ? 'up' : 'down',
    },
    {
      title: '平均通话时长',
      value: `${Math.floor(stats.avgCallDuration / 60)}分${stats.avgCallDuration % 60}秒`,
      icon: Clock,
      color: 'var(--success)',
      change: `${stats.totalCalls > 0 ? '活跃' : '空闲'}`,
      trend: 'up',
    },
    {
      title: '员工总数',
      value: stats.totalUsers,
      icon: TrendingUp,
      color: 'var(--warning)',
      change: `在线`,
      trend: 'up',
      hidden: user.role !== 'admin' && user.role !== 'manager',
    },
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





