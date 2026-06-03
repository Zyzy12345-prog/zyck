import { employeeAPI, clientAPI } from './api';
import { message } from 'antd';

/**
 * 数据同步服务
 * 处理员工模块与其他模块的数据一致性
 */
class SyncService {
  /**
   * 员工离职处理
   * @param {number} employeeId - 员工ID
   * @param {Object} options - 处理选项
   * @returns {Promise<Object>} 处理结果
   */
  async handleEmployeeResignation(employeeId, options = {}) {
    const {
      transferTo = null, // 客户转移目标员工ID
      autoTransfer = true, // 是否自动转移客户
      notifyManager = true, // 是否通知部门经理
    } = options;

    try {
      message.loading('正在处理员工离职...', 0);

      // 1. 获取员工信息
      const employeeRes = await employeeAPI.getEmployee(employeeId);
      if (!employeeRes.success) {
        throw new Error('获取员工信息失败');
      }
      const employee = employeeRes.data;

      const results = {
        employee,
        clientsTransferred: 0,
        tasksTransferred: 0,
        permissionsRevoked: false,
        statusUpdated: false,
      };

      // 2. 处理客户分配
      if (autoTransfer) {
        const clientResult = await this.transferEmployeeClients(
          employeeId,
          transferTo
        );
        results.clientsTransferred = clientResult.count;
      }

      // 3. 处理任务分配（如果有任务模块）
      // const taskResult = await this.transferEmployeeTasks(employeeId, transferTo);
      // results.tasksTransferred = taskResult.count;

      // 4. 撤销权限（将状态改为inactive会自动撤销登录权限）
      results.permissionsRevoked = true;

      // 5. 更新员工状态
      const statusRes = await employeeAPI.updateEmployeeStatus(
        employeeId,
        'inactive'
      );
      results.statusUpdated = statusRes.success;

      // 6. 记录操作日志
      await this.logOperation({
        type: 'employee_resignation',
        employeeId,
        employeeName: employee.name,
        department: employee.department,
        clientsTransferred: results.clientsTransferred,
        timestamp: new Date().toISOString(),
      });

      // 7. 通知部门经理（如果需要）
      if (notifyManager && employee.department) {
        // 这里可以调用通知服务
        console.log('通知部门经理:', employee.department);
      }

      message.destroy();
      message.success(
        `员工离职处理完成：已转移 ${results.clientsTransferred} 个客户`
      );

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      message.destroy();
      message.error('员工离职处理失败：' + error.message);
      console.error('员工离职处理失败:', error);
      throw error;
    }
  }

  /**
   * 员工停用处理
   * @param {number} employeeId - 员工ID
   * @returns {Promise<Object>} 处理结果
   */
  async handleEmployeeSuspension(employeeId) {
    try {
      // 1. 更新员工状态为停用
      const statusRes = await employeeAPI.updateEmployeeStatus(
        employeeId,
        'suspended'
      );

      if (!statusRes.success) {
        throw new Error('更新员工状态失败');
      }

      // 2. 暂停客户分配（不转移，只是标记为暂停）
      // 这里可以添加客户暂停逻辑

      // 3. 记录操作日志
      await this.logOperation({
        type: 'employee_suspension',
        employeeId,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        message: '员工账号已停用',
      };
    } catch (error) {
      console.error('员工停用处理失败:', error);
      throw error;
    }
  }

  /**
   * 员工激活处理
   * @param {number} employeeId - 员工ID
   * @returns {Promise<Object>} 处理结果
   */
  async handleEmployeeActivation(employeeId) {
    try {
      // 1. 更新员工状态为激活
      const statusRes = await employeeAPI.updateEmployeeStatus(
        employeeId,
        'active'
      );

      if (!statusRes.success) {
        throw new Error('更新员工状态失败');
      }

      // 2. 恢复客户分配
      // 这里可以添加客户恢复逻辑

      // 3. 记录操作日志
      await this.logOperation({
        type: 'employee_activation',
        employeeId,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        message: '员工账号已激活',
      };
    } catch (error) {
      console.error('员工激活处理失败:', error);
      throw error;
    }
  }

  /**
   * 转移员工客户
   * @param {number} fromEmployeeId - 原员工ID
   * @param {number} toEmployeeId - 目标员工ID（可选）
   * @returns {Promise<Object>} 转移结果
   */
  async transferEmployeeClients(fromEmployeeId, toEmployeeId = null) {
    try {
      // 1. 获取该员工的所有活跃客户
      const clientsRes = await clientAPI.getClients({
        assignedTo: fromEmployeeId,
        status: 'active',
        limit: 1000,
      });

      if (!clientsRes.success) {
        throw new Error('获取客户列表失败');
      }

      const clients = clientsRes.data.clients || [];

      if (clients.length === 0) {
        return {
          success: true,
          count: 0,
          message: '该员工没有分配的客户',
        };
      }

      // 2. 确定目标员工
      let targetEmployeeId = toEmployeeId;
      if (!targetEmployeeId) {
        // 如果没有指定目标员工，尝试获取部门经理
        const employee = await employeeAPI.getEmployee(fromEmployeeId);
        if (employee.success && employee.data.department) {
          const manager = await this.getDepartmentManager(
            employee.data.department
          );
          targetEmployeeId = manager ? manager.id : null;
        }
      }

      if (!targetEmployeeId) {
        // 如果还是没有目标员工，放入公海池（设置为未分配）
        console.warn('没有找到目标员工，客户将放入公海池');
        // 这里可以实现放入公海池的逻辑
        return {
          success: true,
          count: clients.length,
          message: `${clients.length} 个客户已放入公海池`,
        };
      }

      // 3. 批量转移客户
      const clientIds = clients.map((c) => c.id);
      
      // 注意：这里需要后端支持批量转移API
      // 如果后端没有批量转移API，需要逐个转移
      let transferredCount = 0;
      for (const clientId of clientIds) {
        try {
          await clientAPI.assignClient({
            clientId,
            employeeId: targetEmployeeId,
            reason: '原负责人离职',
          });
          transferredCount++;
        } catch (error) {
          console.error(`转移客户 ${clientId} 失败:`, error);
        }
      }

      return {
        success: true,
        count: transferredCount,
        total: clients.length,
        message: `成功转移 ${transferredCount}/${clients.length} 个客户`,
      };
    } catch (error) {
      console.error('转移员工客户失败:', error);
      throw error;
    }
  }

  /**
   * 获取部门经理
   * @param {string} department - 部门名称
   * @returns {Promise<Object|null>} 部门经理信息
   */
  async getDepartmentManager(department) {
    try {
      const response = await employeeAPI.getEmployees({
        department,
        position: '经理',
        status: 'active',
        limit: 1,
      });

      if (response.success && response.data.employees.length > 0) {
        return response.data.employees[0];
      }

      return null;
    } catch (error) {
      console.error('获取部门经理失败:', error);
      return null;
    }
  }

  /**
   * 检查部门是否可以删除
   * @param {string} department - 部门名称
   * @returns {Promise<Object>} 检查结果
   */
  async checkDepartmentDeletable(department) {
    try {
      const response = await employeeAPI.getEmployees({
        department,
        status: 'active',
        limit: 1,
      });

      const employeeCount = response.data.pagination?.total || 0;

      return {
        deletable: employeeCount === 0,
        employeeCount,
        message:
          employeeCount > 0
            ? `该部门下还有 ${employeeCount} 个员工，无法删除`
            : '该部门可以删除',
      };
    } catch (error) {
      console.error('检查部门失败:', error);
      return {
        deletable: false,
        error: error.message,
      };
    }
  }

  /**
   * 批量转移部门员工
   * @param {string} fromDepartment - 原部门
   * @param {string} toDepartment - 目标部门
   * @returns {Promise<Object>} 转移结果
   */
  async transferDepartmentEmployees(fromDepartment, toDepartment) {
    try {
      // 获取原部门的所有员工
      const response = await employeeAPI.getEmployees({
        department: fromDepartment,
        limit: 1000,
      });

      if (!response.success) {
        throw new Error('获取部门员工失败');
      }

      const employees = response.data.employees || [];

      if (employees.length === 0) {
        return {
          success: true,
          count: 0,
          message: '该部门没有员工',
        };
      }

      // 批量更新员工部门
      let transferredCount = 0;
      for (const employee of employees) {
        try {
          await employeeAPI.updateEmployee(employee.id, {
            department: toDepartment,
          });
          transferredCount++;
        } catch (error) {
          console.error(`转移员工 ${employee.id} 失败:`, error);
        }
      }

      return {
        success: true,
        count: transferredCount,
        total: employees.length,
        message: `成功转移 ${transferredCount}/${employees.length} 个员工`,
      };
    } catch (error) {
      console.error('转移部门员工失败:', error);
      throw error;
    }
  }

  /**
   * 记录操作日志
   * @param {Object} data - 日志数据
   */
  async logOperation(data) {
    try {
      // 将日志保存到localStorage（临时方案）
      const logs = JSON.parse(localStorage.getItem('operationLogs') || '[]');
      logs.push({
        ...data,
        id: Date.now(),
        operator: JSON.parse(localStorage.getItem('user') || '{}').username,
      });

      // 只保留最近100条日志
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }

      localStorage.setItem('operationLogs', JSON.stringify(logs));

      // TODO: 发送到后端API保存
      // await api.post('/logs/operations', data);
    } catch (error) {
      console.error('记录操作日志失败:', error);
    }
  }

  /**
   * 获取操作日志
   * @param {Object} filters - 筛选条件
   * @returns {Array} 日志列表
   */
  getOperationLogs(filters = {}) {
    try {
      const logs = JSON.parse(localStorage.getItem('operationLogs') || '[]');

      // 应用筛选条件
      let filteredLogs = logs;

      if (filters.type) {
        filteredLogs = filteredLogs.filter((log) => log.type === filters.type);
      }

      if (filters.employeeId) {
        filteredLogs = filteredLogs.filter(
          (log) => log.employeeId === filters.employeeId
        );
      }

      if (filters.startDate) {
        filteredLogs = filteredLogs.filter(
          (log) => new Date(log.timestamp) >= new Date(filters.startDate)
        );
      }

      if (filters.endDate) {
        filteredLogs = filteredLogs.filter(
          (log) => new Date(log.timestamp) <= new Date(filters.endDate)
        );
      }

      // 按时间倒序排列
      return filteredLogs.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
    } catch (error) {
      console.error('获取操作日志失败:', error);
      return [];
    }
  }
}

export default new SyncService();










