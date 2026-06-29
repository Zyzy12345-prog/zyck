import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientAPI } from '../services/api';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  Phone,
  Mail,
  Building,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatDate, formatCurrency, getStatusBadgeClass, getStatusText } from '../utils/helpers';
import './Clients.css';

const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    industry: '',
    taxStatus: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchClients();
  }, [pagination.page, searchTerm, filters]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        ...filters,
      };
      
      const response = await clientAPI.getClients(params);
      setClients(response.data?.clients || []);
      setPagination(prev => ({
        ...prev,
        total: response.data?.pagination?.total || 0,
        totalPages: response.data?.pagination?.pages || 0,
      }));
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这个客户吗？')) return;
    
    try {
      await clientAPI.deleteClient(id);
      fetchClients();
    } catch (error) {
      console.error('Failed to delete client:', error);
      alert('删除失败：' + (error.message || '未知错误'));
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  return (
    <div className="clients-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">客户管理</h1>
          <p className="page-subtitle">管理您的客户信息</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary">
            <Upload size={18} />
            导入
          </button>
          <button className="btn btn-secondary">
            <Download size={18} />
            导出
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/clients/new')}
          >
            <Plus size={18} />
            新增客户
          </button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="filters-section card">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="搜索客户名称、联系人、电话..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        
        <div className="filter-group">
          <div className="filter-item">
            <label>行业</label>
            <select
              value={filters.industry}
              onChange={(e) => handleFilterChange('industry', e.target.value)}
              className="input"
            >
              <option value="">全部行业</option>
              <option value="制造业">制造业</option>
              <option value="服务业">服务业</option>
              <option value="零售业">零售业</option>
              <option value="科技">科技</option>
              <option value="金融">金融</option>
              <option value="其他">其他</option>
            </select>
          </div>
          
          <div className="filter-item">
            <label>财税状态</label>
            <select
              value={filters.taxStatus}
              onChange={(e) => handleFilterChange('taxStatus', e.target.value)}
              className="input"
            >
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
        </div>
      </div>

      {/* 客户列表 */}
      <div className="clients-list card">
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>加载中...</p>
          </div>
        ) : clients.length > 0 ? (
          <>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>公司名称</th>
                    <th>联系人</th>
                    <th>联系方式</th>
                    <th>行业</th>
                    <th>注册资本</th>
                    <th>财税状态</th>
                    <th>创建时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id}>
                      <td>
                        <div className="client-name">
                          <Building size={16} />
                          <strong>{client.companyName}</strong>
                        </div>
                      </td>
                      <td>{client.contactPerson || '-'}</td>
                      <td>
                        <div className="contact-info">
                          {client.phone && (
                            <div className="contact-item">
                              <Phone size={14} />
                              {client.phone}
                            </div>
                          )}
                          {client.email && (
                            <div className="contact-item">
                              <Mail size={14} />
                              {client.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{client.industry || '-'}</td>
                      <td>{client.registeredCapital ? formatCurrency(client.registeredCapital) : '-'}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(client.taxStatus)}`}>
                          {getStatusText(client.taxStatus)}
                        </span>
                      </td>
                      <td>{formatDate(client.createdAt)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon"
                            title="查看详情"
                            onClick={() => navigate(`/clients/${client.id}`)}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="btn-icon"
                            title="编辑"
                            onClick={() => navigate(`/clients/${client.id}/edit`)}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="btn-icon btn-icon-danger"
                            title="删除"
                            onClick={() => handleDelete(client.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            <div className="pagination">
              <div className="pagination-info">
                显示 {(pagination.page - 1) * pagination.limit + 1} 到{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} 条，
                共 {pagination.total} 条
              </div>
              <div className="pagination-controls">
                <button
                  className="btn btn-secondary"
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  <ChevronLeft size={16} />
                  上一页
                </button>
                <span className="pagination-current">
                  第 {pagination.page} / {pagination.totalPages} 页
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  下一页
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <Building size={64} />
            <h3>暂无客户</h3>
            <p>点击"新增客户"按钮添加您的第一个客户</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/clients/new')}
            >
              <Plus size={18} />
              新增客户
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Clients;





