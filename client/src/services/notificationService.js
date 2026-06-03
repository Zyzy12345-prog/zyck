import { message, notification } from 'antd';

/**
 * 通知服务
 * 处理系统通知、邮件、短信等
 */
class NotificationService {
  /**
   * 员工创建通知
   * @param {Object} employee - 员工信息
   * @param {string} initialPassword - 初始密码
   */
  async notifyEmployeeCreated(employee, initialPassword) {
    try {
      // 显示系统通知
      notification.success({
        message: '员工创建成功',
        description: (
          <div>
            <p>
              员工 <strong>{employee.name}</strong> 已创建成功
            </p>
            <p>
              初始密码：<strong style={{ color: '#1890ff' }}>{initialPassword}</strong>
            </p>
            <p style={{ color: '#999', fontSize: '12px' }}>
              请妥善保管并告知员工
            </p>
          </div>
        ),
        duration: 10,
      });

      // TODO: 发送邮件通知
      if (employee.email) {
        await this.sendEmail({
          to: employee.email,
          subject: '欢迎加入公司',
          template: 'employee_welcome',
          data: {
            name: employee.name,
            username: employee.username,
            password: initialPassword,
            loginUrl: window.location.origin + '/login',
          },
        });
      }

      // TODO: 发送短信通知
      if (employee.phone) {
        await this.sendSMS({
          to: employee.phone,
          message: `欢迎加入公司！您的登录账号是：${employee.username}，初始密码已发送至邮箱。`,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('发送员工创建通知失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 密码重置通知
   * @param {Object} employee - 员工信息
   * @param {string} newPassword - 新密码
   */
  async notifyPasswordReset(employee, newPassword) {
    try {
      // 显示系统通知
      notification.info({
        message: '密码已重置',
        description: (
          <div>
            <p>
              员工 <strong>{employee.name}</strong> 的密码已重置
            </p>
            <p>
              新密码：<strong style={{ color: '#1890ff' }}>{newPassword}</strong>
            </p>
            <p style={{ color: '#999', fontSize: '12px' }}>
              请告知员工并建议首次登录后修改密码
            </p>
          </div>
        ),
        duration: 10,
      });

      // TODO: 发送邮件通知
      if (employee.email) {
        await this.sendEmail({
          to: employee.email,
          subject: '密码已重置',
          template: 'password_reset',
          data: {
            name: employee.name,
            password: newPassword,
            loginUrl: window.location.origin + '/login',
          },
        });
      }

      // TODO: 发送短信通知
      if (employee.phone) {
        await this.sendSMS({
          to: employee.phone,
          message: `您的登录密码已重置，新密码：${newPassword}，请及时登录修改。`,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('发送密码重置通知失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 员工离职通知
   * @param {Object} employee - 员工信息
   * @param {Object} manager - 部门经理信息
   */
  async notifyEmployeeResignation(employee, manager = null) {
    try {
      // 显示系统通知
      notification.warning({
        message: '员工离职',
        description: (
          <div>
            <p>
              员工 <strong>{employee.name}</strong> 已办理离职
            </p>
            <p>部门：{employee.department}</p>
            <p>离职日期：{new Date().toLocaleDateString('zh-CN')}</p>
          </div>
        ),
        duration: 8,
      });

      // TODO: 通知部门经理
      if (manager && manager.email) {
        await this.sendEmail({
          to: manager.email,
          subject: '员工离职通知',
          template: 'employee_resignation',
          data: {
            managerName: manager.name,
            employeeName: employee.name,
            department: employee.department,
            position: employee.position,
            resignDate: new Date().toLocaleDateString('zh-CN'),
          },
        });
      }

      return { success: true };
    } catch (error) {
      console.error('发送员工离职通知失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 员工状态变更通知
   * @param {Object} employee - 员工信息
   * @param {string} oldStatus - 原状态
   * @param {string} newStatus - 新状态
   */
  async notifyStatusChange(employee, oldStatus, newStatus) {
    try {
      const statusText = {
        active: '激活',
        inactive: '离职',
        suspended: '停用',
        resigned: '已离职',
      };

      notification.info({
        message: '员工状态变更',
        description: (
          <div>
            <p>
              员工 <strong>{employee.name}</strong> 的状态已变更
            </p>
            <p>
              {statusText[oldStatus]} → {statusText[newStatus]}
            </p>
          </div>
        ),
        duration: 5,
      });

      return { success: true };
    } catch (error) {
      console.error('发送状态变更通知失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 批量导入完成通知
   * @param {Object} result - 导入结果
   */
  async notifyImportComplete(result) {
    try {
      const { success, failed, total } = result;

      if (failed.length === 0) {
        notification.success({
          message: '批量导入成功',
          description: `成功导入 ${success.length} 个员工`,
          duration: 5,
        });
      } else {
        notification.warning({
          message: '批量导入完成',
          description: (
            <div>
              <p>成功：{success.length} 个</p>
              <p>失败：{failed.length} 个</p>
              <p>总计：{total} 个</p>
            </div>
          ),
          duration: 8,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('发送导入完成通知失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 客户转移通知
   * @param {Object} data - 转移数据
   */
  async notifyClientTransfer(data) {
    try {
      const { fromEmployee, toEmployee, clientCount } = data;

      notification.info({
        message: '客户已转移',
        description: (
          <div>
            <p>
              {clientCount} 个客户已从 <strong>{fromEmployee.name}</strong> 转移至{' '}
              <strong>{toEmployee.name}</strong>
            </p>
          </div>
        ),
        duration: 5,
      });

      // TODO: 通知新负责人
      if (toEmployee.email) {
        await this.sendEmail({
          to: toEmployee.email,
          subject: '客户分配通知',
          template: 'client_transfer',
          data: {
            employeeName: toEmployee.name,
            clientCount,
            fromEmployee: fromEmployee.name,
          },
        });
      }

      return { success: true };
    } catch (error) {
      console.error('发送客户转移通知失败:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 发送邮件（模拟）
   * @param {Object} options - 邮件选项
   */
  async sendEmail(options) {
    try {
      const { to, subject, template, data } = options;

      // TODO: 调用后端邮件发送API
      console.log('发送邮件:', {
        to,
        subject,
        template,
        data,
      });

      // 模拟发送延迟
      await new Promise((resolve) => setTimeout(resolve, 500));

      return { success: true };
    } catch (error) {
      console.error('发送邮件失败:', error);
      throw error;
    }
  }

  /**
   * 发送短信（模拟）
   * @param {Object} options - 短信选项
   */
  async sendSMS(options) {
    try {
      const { to, message } = options;

      // TODO: 调用后端短信发送API
      console.log('发送短信:', {
        to,
        message,
      });

      // 模拟发送延迟
      await new Promise((resolve) => setTimeout(resolve, 500));

      return { success: true };
    } catch (error) {
      console.error('发送短信失败:', error);
      throw error;
    }
  }

  /**
   * 显示成功消息
   * @param {string} content - 消息内容
   */
  success(content) {
    message.success(content);
  }

  /**
   * 显示错误消息
   * @param {string} content - 消息内容
   */
  error(content) {
    message.error(content);
  }

  /**
   * 显示警告消息
   * @param {string} content - 消息内容
   */
  warning(content) {
    message.warning(content);
  }

  /**
   * 显示信息消息
   * @param {string} content - 消息内容
   */
  info(content) {
    message.info(content);
  }

  /**
   * 显示加载消息
   * @param {string} content - 消息内容
   * @param {number} duration - 持续时间（0表示不自动关闭）
   */
  loading(content, duration = 0) {
    return message.loading(content, duration);
  }
}

export default new NotificationService();










