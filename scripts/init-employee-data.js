const { Department, Employee, Role, EmployeeRole } = require('../models');
const bcrypt = require('bcryptjs');

/**
 * 初始化员工管理模块数据
 * 包括：部门、角色、初始管理员账户
 */
async function initEmployeeData() {
  console.log('🚀 开始初始化员工管理模块数据...\n');

  try {
    // 1. 初始化系统角色
    console.log('📋 初始化系统角色...');
    const roleCount = await Role.initSystemRoles();
    console.log(`✅ 成功初始化 ${roleCount} 个系统角色\n`);

    // 2. 创建初始部门
    console.log('🏢 创建初始部门...');
    const departments = [
      {
        name: '总经办',
        code: 'CEO_OFFICE',
        level: 1,
        sortOrder: 1,
        description: '公司最高管理层',
        status: 'active'
      },
      {
        name: '技术部',
        code: 'TECH_DEPT',
        level: 1,
        sortOrder: 2,
        description: '技术研发部门',
        status: 'active'
      },
      {
        name: '销售部',
        code: 'SALES_DEPT',
        level: 1,
        sortOrder: 3,
        description: '销售业务部门',
        status: 'active'
      },
      {
        name: '市场部',
        code: 'MARKET_DEPT',
        level: 1,
        sortOrder: 4,
        description: '市场营销部门',
        status: 'active'
      },
      {
        name: '财务部',
        code: 'FINANCE_DEPT',
        level: 1,
        sortOrder: 5,
        description: '财务管理部门',
        status: 'active'
      },
      {
        name: '人力资源部',
        code: 'HR_DEPT',
        level: 1,
        sortOrder: 6,
        description: '人力资源管理',
        status: 'active'
      }
    ];

    for (const deptData of departments) {
      const [dept, created] = await Department.findOrCreate({
        where: { code: deptData.code },
        defaults: deptData
      });
      
      if (created) {
        console.log(`  ✓ 创建部门: ${dept.name} (${dept.code})`);
      } else {
        console.log(`  - 部门已存在: ${dept.name} (${dept.code})`);
      }
    }
    console.log('');

    // 3. 创建初始管理员账户
    console.log('👤 创建初始管理员账户...');
    
    const adminRole = await Role.findOne({ where: { code: 'SUPER_ADMIN' } });
    const ceoDept = await Department.findOne({ where: { code: 'CEO_OFFICE' } });

    const adminData = {
      employeeNo: 'ADMIN001',
      name: '系统管理员',
      username: 'admin',
      password: 'admin123456', // 将被自动加密
      email: 'admin@example.com',
      phone: '13800138000',
      departmentId: ceoDept ? ceoDept.id : null,
      position: '系统管理员',
      level: 'P10',
      hireDate: new Date(),
      status: 'active',
      isAdmin: true
    };

    const [admin, adminCreated] = await Employee.findOrCreate({
      where: { username: 'admin' },
      defaults: adminData
    });

    if (adminCreated) {
      console.log(`  ✓ 创建管理员: ${admin.name} (${admin.username})`);
      console.log(`    工号: ${admin.employeeNo}`);
      console.log(`    密码: admin123456`);
      
      // 分配超级管理员角色
      if (adminRole) {
        await EmployeeRole.create({
          employeeId: admin.id,
          roleId: adminRole.id,
          assignedAt: new Date()
        });
        console.log(`    角色: ${adminRole.name}`);
      }
    } else {
      console.log(`  - 管理员已存在: ${admin.name} (${admin.username})`);
    }
    console.log('');

    // 4. 创建测试员工账户
    console.log('👥 创建测试员工账户...');
    
    const managerRole = await Role.findOne({ where: { code: 'MANAGER' } });
    const salesRole = await Role.findOne({ where: { code: 'SALES' } });
    const salesDept = await Department.findOne({ where: { code: 'SALES_DEPT' } });

    const testEmployees = [
      {
        employeeNo: 'EMP001',
        name: '张经理',
        username: 'zhangmanager',
        password: 'password123',
        email: 'zhang@example.com',
        phone: '13800138001',
        departmentId: salesDept ? salesDept.id : null,
        position: '销售经理',
        level: 'P7',
        hireDate: new Date(),
        status: 'active',
        roleCode: 'MANAGER'
      },
      {
        employeeNo: 'EMP002',
        name: '李销售',
        username: 'lisales',
        password: 'password123',
        email: 'li@example.com',
        phone: '13800138002',
        departmentId: salesDept ? salesDept.id : null,
        position: '销售专员',
        level: 'P5',
        hireDate: new Date(),
        status: 'active',
        roleCode: 'SALES'
      }
    ];

    for (const empData of testEmployees) {
      const roleCode = empData.roleCode;
      delete empData.roleCode;

      const [emp, empCreated] = await Employee.findOrCreate({
        where: { username: empData.username },
        defaults: empData
      });

      if (empCreated) {
        console.log(`  ✓ 创建员工: ${emp.name} (${emp.username})`);
        
        // 分配角色
        const role = await Role.findOne({ where: { code: roleCode } });
        if (role) {
          await EmployeeRole.create({
            employeeId: emp.id,
            roleId: role.id,
            assignedBy: admin.id,
            assignedAt: new Date()
          });
          console.log(`    角色: ${role.name}`);
        }
      } else {
        console.log(`  - 员工已存在: ${emp.name} (${emp.username})`);
      }
    }
    console.log('');

    // 5. 统计信息
    console.log('📊 数据统计:');
    const deptCount = await Department.count({ where: { status: 'active' } });
    const roleCount2 = await Role.count({ where: { status: 'active' } });
    const empCount = await Employee.count({ where: { status: 'active' } });
    
    console.log(`  部门数量: ${deptCount}`);
    console.log(`  角色数量: ${roleCount2}`);
    console.log(`  员工数量: ${empCount}`);
    console.log('');

    console.log('✅ 员工管理模块数据初始化完成！\n');
    console.log('🔐 默认管理员账户:');
    console.log('   用户名: admin');
    console.log('   密码: admin123456');
    console.log('');
    console.log('🔐 测试账户:');
    console.log('   经理账户: zhangmanager / password123');
    console.log('   销售账户: lisales / password123');
    console.log('');

  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    console.error(error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initEmployeeData()
    .then(() => {
      console.log('✨ 初始化成功！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 初始化失败:', error);
      process.exit(1);
    });
}

module.exports = initEmployeeData;











