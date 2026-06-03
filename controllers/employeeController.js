const employeeService = require('../services/employeeService');

/**
 * 员工控制器
 * 处理HTTP请求和响应
 */
class EmployeeController {
  /**
   * 获取员工列表
   * GET /api/employees
   */
  async getEmployees(req, res) {
    try {
      const result = await employeeService.getEmployees(req.query);
      
      res.json({
        success: true,
        message: '获取员工列表成功',
        data: result
      });
    } catch (error) {
      console.error('获取员工列表失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取员工列表失败'
      });
    }
  }

  /**
   * 获取员工统计数据
   * GET /api/employees/statistics
   */
  async getStatistics(req, res) {
    try {
      const statistics = await employeeService.getStatistics();
      
      res.json({
        success: true,
        message: '获取统计数据成功',
        data: statistics
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取统计数据失败'
      });
    }
  }

  /**
   * 获取员工详情
   * GET /api/employees/:id
   */
  async getEmployeeById(req, res) {
    try {
      const employee = await employeeService.getEmployeeById(req.params.id);
      
      res.json({
        success: true,
        message: '获取员工详情成功',
        data: employee
      });
    } catch (error) {
      console.error('获取员工详情失败:', error);
      res.status(404).json({
        success: false,
        message: error.message || '员工不存在'
      });
    }
  }

  /**
   * 创建员工
   * POST /api/employees
   */
  async createEmployee(req, res) {
    try {
      const employee = await employeeService.createEmployee(req.body);
      
      res.status(201).json({
        success: true,
        message: '创建员工成功',
        data: employee
      });
    } catch (error) {
      console.error('创建员工失败:', error);
      res.status(400).json({
        success: false,
        message: error.message || '创建员工失败'
      });
    }
  }

  /**
   * 更新员工信息
   * PUT /api/employees/:id
   */
  async updateEmployee(req, res) {
    try {
      const employee = await employeeService.updateEmployee(req.params.id, req.body);
      
      res.json({
        success: true,
        message: '更新员工信息成功',
        data: employee
      });
    } catch (error) {
      console.error('更新员工信息失败:', error);
      res.status(400).json({
        success: false,
        message: error.message || '更新员工信息失败'
      });
    }
  }

  /**
   * 删除员工（软删除）
   * DELETE /api/employees/:id
   */
  async deleteEmployee(req, res) {
    try {
      await employeeService.deleteEmployee(req.params.id);
      
      res.json({
        success: true,
        message: '员工已停用'
      });
    } catch (error) {
      console.error('删除员工失败:', error);
      res.status(400).json({
        success: false,
        message: error.message || '删除员工失败'
      });
    }
  }

  /**
   * 修改员工状态
   * PATCH /api/employees/:id/status
   */
  async updateEmployeeStatus(req, res) {
    try {
      const { status } = req.body;
      const employee = await employeeService.updateEmployeeStatus(req.params.id, status);
      
      res.json({
        success: true,
        message: '修改员工状态成功',
        data: employee
      });
    } catch (error) {
      console.error('修改员工状态失败:', error);
      res.status(400).json({
        success: false,
        message: error.message || '修改员工状态失败'
      });
    }
  }

  /**
   * 重置员工密码
   * POST /api/employees/:id/reset-password
   */
  async resetPassword(req, res) {
    try {
      const result = await employeeService.resetPassword(req.params.id);
      
      res.json({
        success: true,
        message: '密码重置成功',
        data: result
      });
    } catch (error) {
      console.error('重置密码失败:', error);
      res.status(400).json({
        success: false,
        message: error.message || '重置密码失败'
      });
    }
  }

  /**
   * 修改员工密码
   * POST /api/employees/:id/change-password
   */
  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      
      if (!oldPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: '请提供原密码和新密码'
        });
      }

      await employeeService.changePassword(req.params.id, oldPassword, newPassword);
      
      res.json({
        success: true,
        message: '密码修改成功'
      });
    } catch (error) {
      console.error('修改密码失败:', error);
      res.status(400).json({
        success: false,
        message: error.message || '修改密码失败'
      });
    }
  }

  /**
   * 批量导入员工
   * POST /api/employees/import
   */
  async importEmployees(req, res) {
    try {
      const { employees } = req.body;
      
      if (!employees || !Array.isArray(employees) || employees.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的员工数据'
        });
      }

      const results = await employeeService.importEmployees(employees);
      
      res.json({
        success: true,
        message: `导入完成：成功 ${results.success.length} 条，失败 ${results.failed.length} 条`,
        data: results
      });
    } catch (error) {
      console.error('批量导入失败:', error);
      res.status(400).json({
        success: false,
        message: error.message || '批量导入失败'
      });
    }
  }

  /**
   * 获取部门列表
   * GET /api/employees/options/departments
   */
  async getDepartments(req, res) {
    try {
      const departments = await employeeService.getDepartments();
      
      res.json({
        success: true,
        data: departments
      });
    } catch (error) {
      console.error('获取部门列表失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取部门列表失败'
      });
    }
  }

  /**
   * 获取职位列表
   * GET /api/employees/options/positions
   */
  async getPositions(req, res) {
    try {
      const positions = await employeeService.getPositions();
      
      res.json({
        success: true,
        data: positions
      });
    } catch (error) {
      console.error('获取职位列表失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取职位列表失败'
      });
    }
  }

  /**
   * 获取角色列表
   * GET /api/employees/options/roles
   */
  async getRoles(req, res) {
    try {
      const roles = await employeeService.getRoles();
      
      res.json({
        success: true,
        data: roles
      });
    } catch (error) {
      console.error('获取角色列表失败:', error);
      res.status(500).json({
        success: false,
        message: error.message || '获取角色列表失败'
      });
    }
  }
}

const employeeController = new EmployeeController();

module.exports = {
  getEmployees: employeeController.getEmployees.bind(employeeController),
  getStatistics: employeeController.getStatistics.bind(employeeController),
  getEmployeeById: employeeController.getEmployeeById.bind(employeeController),
  createEmployee: employeeController.createEmployee.bind(employeeController),
  updateEmployee: employeeController.updateEmployee.bind(employeeController),
  deleteEmployee: employeeController.deleteEmployee.bind(employeeController),
  updateEmployeeStatus: employeeController.updateEmployeeStatus.bind(employeeController),
  resetPassword: employeeController.resetPassword.bind(employeeController),
  changePassword: employeeController.changePassword.bind(employeeController),
  importEmployees: employeeController.importEmployees.bind(employeeController),
  getDepartments: employeeController.getDepartments.bind(employeeController),
  getPositions: employeeController.getPositions.bind(employeeController),
  getRoles: employeeController.getRoles.bind(employeeController)
};

