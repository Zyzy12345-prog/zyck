import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查本地存储中的用户信息
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      // 验证token是否有效
      authAPI.getCurrentUser()
        .then(response => {
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        })
        .catch(() => {
          // Token无效，清除本地存储
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    const { user, token } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    
    return response;
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    const { user, token } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    
    return response;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (typeof roles === 'string') {
      return user.role === roles;
    }
    return roles.includes(user.role);
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    
    // 管理员拥有所有权限
    if (user.isAdmin || user.role === 'admin') return true;
    
    // 检查用户权限列表
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions.includes(permission);
    }
    
    // 检查角色权限
    if (user.rolePermissions && Array.isArray(user.rolePermissions)) {
      return user.rolePermissions.includes(permission);
    }
    
    return false;
  };

  const isAdmin = () => {
    return user && (user.isAdmin === true || user.role === 'admin');
  };

  const canAccessEmployeeModule = () => {
    return hasRole(['admin', 'manager']) || hasPermission('employee:read');
  };

  const canManageEmployees = () => {
    return hasRole('admin') || hasPermission('employee:manage');
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    hasRole,
    hasPermission,
    isAdmin,
    canAccessEmployeeModule,
    canManageEmployees,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};





