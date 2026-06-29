import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { callAPI, clientAPI, userAPI } from '../services/api';
import {
  Users, Phone, TrendingUp, Clock,
  ArrowUp, ArrowDown,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import './Dashboard.css';

const CHART_COLORS = ['#1677ff', '#52c41a', '#fa8c16', '#722ed1', '#ff4d4f', '#13c2c2'];
const STATUS_COLORS = { connected: '#52c41a', no_answer: '#faad14', busy: '#ff4d4f', rejected: '#ff4d4f', failed: '#999', pending: '#1677ff' };

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalClients: 0, totalCalls: 0, totalUsers: 0, avgCallDuration: 0, connectionRate: 0 });
  const [callStats, setCallStats] = useState(null);
  const [recentCalls, setRecentCalls] = useState([]);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [clientsRes, callsRes, statsRes] = await Promise.all([
        clientAPI.getClients({ limit: 1 }),
        callAPI.getCalls({ limit: 10 }),
        callAPI.getStatistics(),
      ]);
      const cd = statsRes.data || {};
      setStats({
        totalClients: clientsRes.pagination?.total || 0,
        totalCalls: callsRes.pagination?.total || 0,
        totalUsers: 0,
        avgCallDuration: cd.averageDuration || 0,
        connectionRate: cd.connectionRate || 0,
      });
      setCallStats(cd);
      setRecentCalls(callsRes.data || []);
      if (user.role === 'admin' || user.role === 'manager') {
        const usersRes = await userAPI.getUsers({ limit: 1 });
        setStats(prev => ({ ...prev, totalUsers: usersRes.pagination?.total || 0 }));
      }
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const callTrendData = callStats?.dailyStats?.map(d => ({ date: d.date?.slice(5) || d.date, calls: d.count || d.total || 0 })) || [];
  const callTypeData = callStats?.byType?.map((t, i) => ({
    name: { outbound: '呼出', inbound: '呼入', callback: '回拨' }[t.callType] || t.callType,
    value: parseInt(t.count) || 0,
    color: CHART_COLORS[i % CHART_COLORS.length],
  })) || [];
  const callResultData = callStats?.byStatus?.map(s => ({
    result: { connected: '已接听', no_answer: '未接听', busy: '忙线', rejected: '拒接', failed: '失败', pending: '待处理' }[s.callStatus] || s.callStatus,
    count: parseInt(s.count) || 0,
    color: STATUS_COLORS[s.callStatus] || '#999',
  })) || [];

  const statCards = [
    { title: '客户总数', value: stats.totalClients, icon: Users, palette: 'blue', change: '总客户数', trend: 'up' },
    { title: '外呼记录', value: stats.totalCalls, icon: Phone, palette: 'green', change: '总记录', trend: 'up' },
    { title: '平均通话', value: `${Math.floor(stats.avgCallDuration / 60)}分${stats.avgCallDuration % 60}秒`, icon: Clock, palette: 'orange', change: '时长', trend: 'up' },
    { title: '员工总数', value: stats.totalUsers, icon: TrendingUp, palette: 'purple', change: '在职', trend: 'up', hidden: user.role !== 'admin' && user.role !== 'manager' },
  ];

  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' });

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading-container">
          <div className="loading-skeleton">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-card" />)}
          </div>
          <p>正在加载数据…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard fade-in">
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">工作台</h1>
          <p className="page-subtitle">
            欢迎回来，<strong>{user?.username}</strong> · {today}
          </p>
        </div>
      </div>

      <div className="stats-grid stagger-list">
        {statCards.filter(c => !c.hidden).map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="stat-card" style={{ animationDelay: `${i * 0.06}s` }}>
              <div className="stat-card-header">
                <div className={`stat-icon stat-icon--${card.palette}`}><Icon size={20} /></div>
                <div className={`stat-change ${card.trend}`}>
                  {card.trend === 'up' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                  {card.change}
                </div>
              </div>
              <div className="stat-title">{card.title}</div>
              <div className="stat-value">{card.value}</div>
            </div>
          );
        })}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">外呼趋势</div>
          {callTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={callTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#999" fontSize={12} />
                <YAxis stroke="#999" fontSize={12} />
                <Tooltip contentStyle={{ border: '1px solid #f0f0f0', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
                <Line type="monotone" dataKey="calls" stroke="#1677ff" strokeWidth={2} dot={{ r: 3, fill: '#1677ff' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="empty-state">暂无数据</div>}
        </div>

        <div className="chart-card">
          <div className="chart-title">呼叫类型</div>
          {callTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={callTypeData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {callTypeData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ border: '1px solid #f0f0f0', borderRadius: 6 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state">暂无数据</div>}
        </div>

        <div className="chart-card chart-card-wide">
          <div className="chart-title">呼叫结果统计</div>
          {callResultData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={callResultData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="result" stroke="#999" fontSize={12} />
                <YAxis stroke="#999" fontSize={12} />
                <Tooltip contentStyle={{ border: '1px solid #f0f0f0', borderRadius: 6 }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {callResultData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state">暂无数据</div>}
        </div>
      </div>

      <div className="recent-calls-card">
        <div className="chart-title">最近外呼记录</div>
        <table className="data-table">
          <thead>
            <tr><th>客户</th><th>类型</th><th>时长</th><th>结果</th><th>时间</th></tr>
          </thead>
          <tbody>
            {recentCalls.length > 0 ? recentCalls.map(call => (
              <tr key={call.id}>
                <td>{call.Client?.companyName || '-'}</td>
                <td><span className={`badge badge-${call.direction === 'outbound' ? 'info' : 'success'}`}>{call.direction === 'outbound' ? '呼出' : '呼入'}</span></td>
                <td>{Math.floor((call.duration || 0) / 60)}分{(call.duration || 0) % 60}秒</td>
                <td>
                  <span className={`badge badge-${call.status === 'answered' ? 'success' : call.status === 'no_answer' ? 'warning' : 'error'}`}>
                    {{ answered: '已接听', no_answer: '未接听', busy: '忙线', completed: '已完成' }[call.status] || '失败'}
                  </span>
                </td>
                <td>{new Date(call.callTime).toLocaleString('zh-CN')}</td>
              </tr>
            )) : <tr><td colSpan={5}><div className="empty-state">暂无外呼记录</div></td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
