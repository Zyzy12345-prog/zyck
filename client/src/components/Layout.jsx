import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Phone,
  UserCircle,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Settings,
  Bell,
} from 'lucide-react';
import { followUpReminderAPI } from '../services/api';
import FollowUpReminderModal from './FollowUpReminderModal';
import './Layout.css';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [reminderCount, setReminderCount] = useState(0);
  const [reminderVisible, setReminderVisible] = useState(false);

  useEffect(() => {
    fetchReminderCount();
    const interval = setInterval(fetchReminderCount, 60000); // 每分钟刷新
    return () => clearInterval(interval);
  }, []);

  const fetchReminderCount = async () => {
    try {
      const response = await followUpReminderAPI.getReminderStatistics();
      if (response.success) {
        setReminderCount(response.data?.unread || 0);
      }
    } catch (error) {
      // 静默失败
    }
  };
  const [customerMenuOpen, setCustomerMenuOpen] = useState(false);
  const [employeeMenuOpen, setEmployeeMenuOpen] = useState(false);
  const [callMenuOpen, setCallMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    {
      path: '/',
      icon: LayoutDashboard,
      label: '仪表板',
      roles: ['admin', 'manager', 'sales', 'operator'],
    },
    {
      label: '客户管理',
      icon: Users,
      roles: ['admin', 'manager', 'sales'],
      key: 'customer',
      submenu: [
        { path: '/customers', label: '客户列表' },
        { path: '/leads', label: '客户线索', badge: 'NEW' },
        { path: '/customer-pool', label: '客户公海池', badge: 'NEW' },
        { path: '/conversion-funnel', label: '转化漏斗', badge: 'NEW' },
        { path: '/sales-funnel', label: '销售漏斗' },
        { path: '/client-grading', label: '客户分级' },
        { path: '/tag-management', label: '客户标签' },
        { path: '/lead-tags', label: '线索标签', badge: 'NEW' },
        { path: '/follow-up-statistics', label: '跟进统计' },
      ],
    },
    {
      label: '员工管理',
      icon: UserCircle,
      roles: ['admin', 'manager'],
      key: 'employee',
      submenu: [
        { path: '/employees', label: '员工列表' },
        { path: '/analytics/sales', label: '销售分析' },
        { path: '/analytics/customers', label: '客户分析' },
        { path: '/analytics/follow-ups', label: '跟进分析' },
      ],
    },
    {
      label: '外呼模块',
      icon: Phone,
      roles: ['admin', 'manager', 'sales', 'operator'],
      key: 'call',
      submenu: [
        { path: '/calls', label: '外呼记录' },
        { path: '/call-tasks', label: '外呼任务', badge: 'NEW' },
        { path: '/analytics/calls', label: '外呼分析' },
      ],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  return (
    <div className="layout">
      {/* 侧边栏 */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon-small">
              <LayoutDashboard size={24} />
            </div>
            {sidebarOpen && <span className="logo-text">财税CRM</span>}
          </div>
        </div>

        <nav className="sidebar-nav">
          {filteredMenuItems.map((item, index) => {
            const Icon = item.icon;
            
            // 如果有子菜单
            if (item.submenu) {
              const isSubmenuActive = item.submenu.some(sub => location.pathname === sub.path);
              let isOpen = false;
              let setMenuOpen = null;
              
              // 根据 key 确定使用哪个状态
              if (item.key === 'customer') {
                isOpen = customerMenuOpen || isSubmenuActive;
                setMenuOpen = setCustomerMenuOpen;
              } else if (item.key === 'employee') {
                isOpen = employeeMenuOpen || isSubmenuActive;
                setMenuOpen = setEmployeeMenuOpen;
              } else if (item.key === 'call') {
                isOpen = callMenuOpen || isSubmenuActive;
                setMenuOpen = setCallMenuOpen;
              }
              
              return (
                <div key={index}>
                  <div
                    className={`nav-item ${isSubmenuActive ? 'active' : ''}`}
                    onClick={() => setMenuOpen && setMenuOpen(!isOpen)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Icon size={20} />
                    {sidebarOpen && (
                      <>
                        <span className="nav-label">
                          {item.label}
                        </span>
                        <ChevronDown 
                          size={16} 
                          style={{ 
                            marginLeft: 'auto',
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                          }} 
                        />
                      </>
                    )}
                  </div>
                  {sidebarOpen && isOpen && (
                    <div className="submenu">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`submenu-item ${location.pathname === subItem.path ? 'active' : ''}`}
                        >
                          {subItem.label}
                          {subItem.badge && <span className="submenu-badge">{subItem.badge}</span>}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            
            // 普通菜单项
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                title={!sidebarOpen ? item.label : ''}
              >
                <Icon size={20} />
                {sidebarOpen && (
                  <span className="nav-label">
                    {item.label}
                    {item.badge && <span className="nav-badge">{item.badge}</span>}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button
            className="nav-item"
            onClick={handleLogout}
            title={!sidebarOpen ? '退出登录' : ''}
          >
            <LogOut size={20} />
            {sidebarOpen && <span>退出登录</span>}
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <div className="main-content">
        {/* 顶部导航栏 */}
        <header className="topbar">
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="topbar-right">
            <button
              className="notification-bell"
              onClick={() => setReminderVisible(true)}
              title="跟进提醒"
            >
              <Bell size={20} />
              {reminderCount > 0 && (
                <span className="notification-badge">{reminderCount > 99 ? '99+' : reminderCount}</span>
              )}
            </button>
            <div className="user-menu">
              <button
                className="user-menu-trigger"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="user-avatar">
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <span className="user-name">{user?.username}</span>
                  <span className="user-role">
                    {user?.role === 'admin' && '管理员'}
                    {user?.role === 'manager' && '经理'}
                    {user?.role === 'sales' && '销售'}
                    {user?.role === 'operator' && '操作员'}
                  </span>
                </div>
                <ChevronDown size={16} />
              </button>

              {userMenuOpen && (
                <div className="user-menu-dropdown">
                  <div className="user-menu-header">
                    <div className="user-avatar-large">
                      {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="user-name-large">{user?.username}</div>
                      <div className="user-email">{user?.email}</div>
                    </div>
                  </div>
                  <div className="user-menu-divider"></div>
                  <button className="user-menu-item" onClick={() => { setUserMenuOpen(false); navigate('/settings'); }}>
                    <Settings size={16} />
                    账户设置
                  </button>
                  <button className="user-menu-item" onClick={handleLogout}>
                    <LogOut size={16} />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      {/* 遮罩层（移动端） */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* 跟进提醒弹窗 */}
      <FollowUpReminderModal
        visible={reminderVisible}
        onClose={() => {
          setReminderVisible(false);
          fetchReminderCount();
        }}
      />
    </div>
  );
};

export default Layout;




