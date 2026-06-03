import { useState, useEffect } from 'react';
import { callAPI, clientAPI } from '../services/api';
import { X, Phone, Clock, Calendar, FileText, User, Building, Star, Tag, TrendingUp } from 'lucide-react';
import './CallForm.css';

const CallForm = ({ call, onSuccess, onCancel }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    clientId: '',
    phoneNumber: '',
    callType: 'outbound',
    direction: 'outbound',
    callTime: new Date().toISOString().slice(0, 16),
    durationMinutes: 0,
    durationSeconds: 0,
    status: 'completed',
    summary: '',
    notes: '',
    tags: [],
    satisfaction: '',
    followUpAction: '',
    followUpDate: '',
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (call) {
      const minutes = Math.floor(call.duration / 60);
      const seconds = call.duration % 60;
      
      setFormData({
        clientId: call.clientId || '',
        phoneNumber: call.phoneNumber || '',
        callType: call.callType || 'outbound',
        direction: call.direction || 'outbound',
        callTime: call.callTime ? new Date(call.callTime).toISOString().slice(0, 16) : '',
        durationMinutes: minutes,
        durationSeconds: seconds,
        status: call.status || 'completed',
        summary: call.summary || '',
        notes: call.notes || '',
        tags: call.tags || [],
        satisfaction: call.satisfaction || '',
        followUpAction: call.followUpAction || '',
        followUpDate: call.followUpDate ? new Date(call.followUpDate).toISOString().slice(0, 10) : '',
      });
    }
  }, [call]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await clientAPI.getClients({ limit: 1000 });
      setClients(response.data || []);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const handleClientChange = (e) => {
    const clientId = e.target.value;
    setFormData(prev => ({ ...prev, clientId }));
    
    if (clientId) {
      const selectedClient = clients.find(c => c.id === parseInt(clientId));
      if (selectedClient && selectedClient.phone) {
        setFormData(prev => ({ ...prev, phoneNumber: selectedClient.phone }));
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({ ...prev, [name]: numValue }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const validateForm = () => {
    if (!formData.clientId) {
      setError('请选择客户');
      return false;
    }
    if (!formData.phoneNumber) {
      setError('请输入电话号码');
      return false;
    }
    if (!formData.callTime) {
      setError('请选择呼叫时间');
      return false;
    }
    if (!formData.status) {
      setError('请选择呼叫状态');
      return false;
    }
    if (formData.durationMinutes < 0 || formData.durationSeconds < 0 || formData.durationSeconds >= 60) {
      setError('请输入有效的通话时长');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const totalDuration = formData.durationMinutes * 60 + formData.durationSeconds;
      
      const submitData = {
        clientId: parseInt(formData.clientId),
        phoneNumber: formData.phoneNumber,
        callType: formData.callType,
        direction: formData.direction,
        callTime: new Date(formData.callTime).toISOString(),
        duration: totalDuration,
        status: formData.status,
        summary: formData.summary,
        notes: formData.notes,
        tags: formData.tags,
        satisfaction: formData.satisfaction ? parseInt(formData.satisfaction) : null,
        followUpAction: formData.followUpAction || null,
        followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : null,
      };

      if (call) {
        await callAPI.updateCall(call.id, submitData);
      } else {
        await callAPI.createCall(submitData);
      }

      onSuccess();
    } catch (err) {
      setError(err.message || '操作失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="call-form-container" onClick={(e) => e.stopPropagation()}>
      <div className="call-form-header">
        <h2>{call ? '编辑外呼记录' : '新增外呼记录'}</h2>
        <button type="button" className="close-btn" onClick={onCancel}>
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="call-form">
        {error && (
          <div className="form-error">
            <span>{error}</span>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="clientId" className="form-label">
            <Building size={16} />
            选择客户 <span className="required">*</span>
          </label>
          <select
            id="clientId"
            name="clientId"
            value={formData.clientId}
            onChange={handleClientChange}
            className="input"
            required
          >
            <option value="">请选择客户</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.companyName} {client.contactPerson && `- ${client.contactPerson}`}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="phoneNumber" className="form-label">
            <Phone size={16} />
            电话号码 <span className="required">*</span>
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            className="input"
            placeholder="请输入电话号码"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="callType" className="form-label">
              <Phone size={16} />
              呼叫类型 <span className="required">*</span>
            </label>
            <select
              id="callType"
              name="callType"
              value={formData.callType}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="manual">手动外呼</option>
              <option value="auto">自动外呼</option>
              <option value="callback">回拨</option>
              <option value="outbound">呼出</option>
              <option value="inbound">呼入</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="direction" className="form-label">
              呼叫方向
            </label>
            <select
              id="direction"
              name="direction"
              value={formData.direction}
              onChange={handleChange}
              className="input"
            >
              <option value="outbound">呼出</option>
              <option value="inbound">呼入</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="callTime" className="form-label">
            <Calendar size={16} />
            呼叫时间 <span className="required">*</span>
          </label>
          <input
            type="datetime-local"
            id="callTime"
            name="callTime"
            value={formData.callTime}
            onChange={handleChange}
            className="input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <Clock size={16} />
            通话时长
          </label>
          <div className="duration-input-group">
            <div className="duration-input">
              <input
                type="number"
                name="durationMinutes"
                value={formData.durationMinutes}
                onChange={handleNumberChange}
                min="0"
                className="input"
                placeholder="0"
              />
              <span className="duration-unit">分钟</span>
            </div>
            <span className="duration-separator">:</span>
            <div className="duration-input">
              <input
                type="number"
                name="durationSeconds"
                value={formData.durationSeconds}
                onChange={handleNumberChange}
                min="0"
                max="59"
                className="input"
                placeholder="0"
              />
              <span className="duration-unit">秒</span>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="status" className="form-label">
            <User size={16} />
            呼叫状态 <span className="required">*</span>
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="input"
            required
          >
            <option value="initiated">已发起</option>
            <option value="ringing">振铃中</option>
            <option value="answered">已接听</option>
            <option value="completed">已完成</option>
            <option value="no_answer">未接听</option>
            <option value="busy">忙线</option>
            <option value="failed">失败</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="summary" className="form-label">
            <FileText size={16} />
            通话摘要
          </label>
          <textarea
            id="summary"
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            className="input textarea"
            rows="3"
            placeholder="请输入通话摘要..."
          />
        </div>

        <div className="form-group">
          <label htmlFor="notes" className="form-label">
            <FileText size={16} />
            备注信息
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="input textarea"
            rows="2"
            placeholder="请输入备注信息..."
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <Tag size={16} />
            标签分类
          </label>
          <div className="tag-input-container">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="input"
              placeholder="输入标签后按回车添加"
            />
            <button type="button" onClick={handleAddTag} className="btn btn-secondary btn-sm">
              添加
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="tags-display">
              {formData.tags.map((tag, index) => (
                <span key={index} className="tag-item">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)} className="tag-remove">
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="satisfaction" className="form-label">
            <Star size={16} />
            满意度评分
          </label>
          <select
            id="satisfaction"
            name="satisfaction"
            value={formData.satisfaction}
            onChange={handleChange}
            className="input"
          >
            <option value="">请选择</option>
            <option value="1">⭐ 1分 - 非常不满意</option>
            <option value="2">⭐⭐ 2分 - 不满意</option>
            <option value="3">⭐⭐⭐ 3分 - 一般</option>
            <option value="4">⭐⭐⭐⭐ 4分 - 满意</option>
            <option value="5">⭐⭐⭐⭐⭐ 5分 - 非常满意</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="followUpAction" className="form-label">
            <TrendingUp size={16} />
            后续行动计划
          </label>
          <input
            type="text"
            id="followUpAction"
            name="followUpAction"
            value={formData.followUpAction}
            onChange={handleChange}
            className="input"
            placeholder="例如：下周发送产品资料"
          />
        </div>

        <div className="form-group">
          <label htmlFor="followUpDate" className="form-label">
            <Calendar size={16} />
            下次跟进时间
          </label>
          <input
            type="date"
            id="followUpDate"
            name="followUpDate"
            value={formData.followUpDate}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
          >
            取消
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner-small"></div>
                {call ? '保存中...' : '创建中...'}
              </>
            ) : (
              call ? '保存' : '创建'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CallForm;





