const { Employee } = require('../models');

async function testStatistics() {
  try {
    console.log('正在测试员工统计功能...\n');

    // 统计总数
    const total = await Employee.count();
    console.log(`员工总数: ${total}`);

    // 统计在职员工
    const active = await Employee.count({ where: { status: 'active' } });
    console.log(`在职员工: ${active}`);

    // 统计离职员工
    const inactive = await Employee.count({ where: { status: 'inactive' } });
    console.log(`离职员工: ${inactive}`);

    // 统计停用账号
    const suspended = await Employee.count({ where: { status: 'suspended' } });
    console.log(`停用账号: ${suspended}`);

    console.log('\n统计数据验证:');
    console.log(`总数 = 在职 + 离职 + 停用: ${total} = ${active} + ${inactive} + ${suspended} = ${active + inactive + suspended}`);
    
    if (total === active + inactive + suspended) {
      console.log('✓ 统计数据一致！');
    } else {
      console.log('✗ 统计数据不一致，请检查！');
    }

    // 显示所有员工的状态
    console.log('\n当前员工列表:');
    const employees = await Employee.findAll({
      attributes: ['id', 'employeeNo', 'name', 'username', 'status'],
      order: [['id', 'ASC']]
    });

    employees.forEach(emp => {
      console.log(`  ${emp.employeeNo} - ${emp.name} (${emp.username}) - 状态: ${emp.status}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('测试失败:', error);
    process.exit(1);
  }
}

testStatistics();








