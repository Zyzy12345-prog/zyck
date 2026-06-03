/**
 * 初始化员工数据
 * 创建默认管理员账号
 */

const { Employee, Role, Department } = require('../models');
const bcrypt = require('bcryptjs');

async function seedEmployees() {
  try {
    console.log('开始初始化员工数据...');

    // 检查是否已有员工
    const existingCount = await Employee.count();
    if (existingCount > 0) {
      console.log(`已存在 ${existingCount} 个员工，跳过初始化`);
      return;
    }

    // 获取管理员角色（可选）
    let adminRole = null;
    try {
      adminRole = await Role.findOne({ where: { code: 'ADMIN' } });
    } catch (error) {
      console.log('警告：无法获取角色数据，将不设置角色');
    }

    // 获取默认部门（可选）
    let defaultDept = null;
    try {
      defaultDept = await Department.findOne({ where: { code: 'ADMIN' } });
    } catch (error) {
      console.log('警告：无法获取部门数据，将不设置部门');
    }

    // 创建默认管理员
    const adminEmployee = await Employee.create({
      employeeNo: 'EMP000001',
      name: '系统管理员',
      username: 'admin',
      password: 'admin123',
      email: 'admin@example.com',
      phone: '13800138000',
      gender: 'male',
      departmentId: defaultDept?.id,
      position: '系统管理员',
      roleId: adminRole?.id,
      hireDate: new Date(),
      status: 'active',
      remark: '系统默认管理员账号'
    });

    console.log('✓ 创建管理员账号成功');
    console.log('  用户名: admin');
    console.log('  密码: admin123');
    console.log('  工号:', adminEmployee.employeeNo);

    // 创建测试员工
    const testEmployees = [
      {
        employeeNo: 'EMP000002',
        name: '张三',
        username: 'zhangsan',
        password: '123456',
        email: 'zhangsan@example.com',
        phone: '13800138001',
        gender: 'male',
        departmentId: defaultDept?.id,
        position: '销售经理',
        roleId: adminRole?.id,
        hireDate: new Date('2024-01-01'),
        status: 'active'
      },
      {
        employeeNo: 'EMP000003',
        name: '李四',
        username: 'lisi',
        password: '123456',
        email: 'lisi@example.com',
        phone: '13800138002',
        gender: 'female',
        departmentId: defaultDept?.id,
        position: '销售专员',
        roleId: adminRole?.id,
        hireDate: new Date('2024-02-01'),
        status: 'active'
      },
      {
        employeeNo: 'EMP000004',
        name: '王五',
        username: 'wangwu',
        password: '123456',
        email: 'wangwu@example.com',
        phone: '13800138003',
        gender: 'male',
        departmentId: defaultDept?.id,
        position: '客服专员',
        roleId: adminRole?.id,
        hireDate: new Date('2024-03-01'),
        status: 'active'
      }
    ];

    for (const empData of testEmployees) {
      await Employee.create(empData);
      console.log(`✓ 创建测试员工: ${empData.name} (${empData.username})`);
    }

    console.log('\n✅ 员工数据初始化完成！');
    console.log('\n默认账号信息：');
    console.log('管理员 - 用户名: admin, 密码: admin123');
    console.log('测试账号 - 用户名: zhangsan/lisi/wangwu, 密码: 123456');
    
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  seedEmployees()
    .then(() => {
      console.log('\n初始化成功完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n初始化失败:', error);
      process.exit(1);
    });
}

module.exports = { seedEmployees };

