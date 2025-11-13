import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../src/config/database';
import { Org, Department, Role, User, AssetCategory } from '../src/models';
import bcrypt from 'bcryptjs';

async function seed() {
  try {
    console.log('开始初始化数据...');

    // 创建组织
    const org1 = await Org.create({
      name: '总部',
      code: 'HQ',
      is_active: true
    });

    const org2 = await Org.create({
      name: '上海分公司',
      code: 'SH',
      is_active: true
    });

    const org3 = await Org.create({
      name: '北京分公司',
      code: 'BJ',
      is_active: true
    });

    console.log('✅ 组织数据创建成功');

    // 创建部门
    await Department.create({
      org_id: org1.id,
      name: '生产部',
      code: 'PROD',
      is_active: true
    });

    await Department.create({
      org_id: org1.id,
      name: '质检部',
      code: 'QC',
      is_active: true
    });

    await Department.create({
      org_id: org2.id,
      name: '生产一车间',
      code: 'PROD1',
      is_active: true
    });

    console.log('✅ 部门数据创建成功');

    // 获取角色
    const superAdminRole = await Role.findOne({ where: { code: 'SUPER_ADMIN' } });
    const orgAdminRole = await Role.findOne({ where: { code: 'ORG_ADMIN' } });
    const employeeRole = await Role.findOne({ where: { code: 'EMPLOYEE' } });

    if (!superAdminRole || !orgAdminRole || !employeeRole) {
      throw new Error('角色数据不存在，请先运行数据库初始化脚本');
    }

    // 创建超级管理员
    const password_hash = await bcrypt.hash('admin123', 10);
    const adminUser = await User.create({
      username: 'admin',
      real_name: '系统管理员',
      phone: '13800138000',
      email: 'admin@example.com',
      password_hash,
      org_id: org1.id,
      is_active: true
    });

    // 分配超级管理员角色
    await adminUser.$add('roles', superAdminRole);

    console.log('✅ 超级管理员创建成功');
    console.log('   用户名: admin');
    console.log('   密码: admin123');

    // 创建测试员工
    const employeePassword = await bcrypt.hash('123456', 10);
    const employee = await User.create({
      username: 'employee001',
      real_name: '张三',
      phone: '13800138001',
      email: 'zhangsan@example.com',
      password_hash: employeePassword,
      org_id: org2.id,
      is_active: true
    });

    await employee.$add('roles', employeeRole);

    console.log('✅ 测试员工创建成功');
    console.log('   用户名: employee001');
    console.log('   密码: 123456');

    console.log('\n✅ 所有初始数据创建完成！');
  } catch (error) {
    console.error('❌ 数据初始化失败:', error);
  } finally {
    await sequelize.close();
  }
}

seed();
