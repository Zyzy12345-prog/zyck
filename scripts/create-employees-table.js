/**
 * 员工表迁移脚本
 * 创建 employees 表
 */

const { sequelize } = require('../models');

async function createEmployeesTable() {
  try {
    console.log('开始创建员工表...');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        employee_no VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(50) NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        avatar VARCHAR(255),
        gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
        birth_date DATE,
        id_card VARCHAR(18),
        department_id INTEGER REFERENCES departments(id),
        position VARCHAR(100),
        role_id INTEGER REFERENCES roles(id),
        hire_date DATE,
        resign_date DATE,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
        address VARCHAR(255),
        emergency_contact VARCHAR(50),
        emergency_phone VARCHAR(20),
        education VARCHAR(20) CHECK (education IN ('primary', 'junior', 'senior', 'associate', 'bachelor', 'master', 'doctor')),
        major VARCHAR(100),
        graduate_school VARCHAR(100),
        work_experience TEXT,
        skills JSONB DEFAULT '[]',
        remark TEXT,
        last_login_at TIMESTAMP,
        last_login_ip VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✓ 员工表创建成功');

    // 创建索引（分开执行）
    console.log('创建索引...');
    
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_employees_employee_no ON employees(employee_no)',
      'CREATE INDEX IF NOT EXISTS idx_employees_username ON employees(username)',
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_email_unique ON employees(email) WHERE email IS NOT NULL',
      'CREATE INDEX IF NOT EXISTS idx_employees_phone ON employees(phone)',
      'CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id)',
      'CREATE INDEX IF NOT EXISTS idx_employees_role_id ON employees(role_id)',
      'CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status)'
    ];
    
    for (const indexSql of indexes) {
      await sequelize.query(indexSql);
    }

    console.log('✓ 索引创建成功');

    // 创建触发器：自动更新 updated_at
    console.log('创建触发器...');
    
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION update_employees_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS trigger_update_employees_updated_at ON employees;
      
      CREATE TRIGGER trigger_update_employees_updated_at
      BEFORE UPDATE ON employees
      FOR EACH ROW
      EXECUTE FUNCTION update_employees_updated_at();
    `);

    console.log('✓ 触发器创建成功');

    console.log('\n✅ 员工表迁移完成！');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createEmployeesTable()
    .then(() => {
      console.log('\n迁移成功完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n迁移失败:', error);
      process.exit(1);
    });
}

module.exports = { createEmployeesTable };

