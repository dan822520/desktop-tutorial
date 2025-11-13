import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import {
  Asset,
  AssetCategory,
  AssetRepair,
  AssetTransfer,
  Department,
  InventoryRecord,
  InventoryTask,
  Org,
  Role,
  User
} from '../models';
import { AppError } from '../middleware/errorHandler';
import {
  generateAssetId,
  generateInventoryTaskNo,
  generateRepairNo,
  generateTransferNo
} from '../utils/generator';

const TEST_ORG_CODES = ['TEST-HQ', 'TEST-MFG', 'TEST-OPS'];
const TEST_DEPARTMENT_CODES = ['TEST-IT', 'TEST-PROD', 'TEST-CS'];
const TEST_CATEGORY_CODES = ['TEST-PROD-EQP', 'TEST-OFFICE', 'TEST-QA'];
const TEST_USERNAMES = ['test-super', 'test-manager', 'test-tech', 'test-employee'];
const TEST_TASK_NAMES = ['测试总部季度盘点', '测试制造中心抽盘'];

interface SeedSummary {
  counts: {
    orgs: number;
    departments: number;
    users: number;
    assetCategories: number;
    assets: number;
    transfers: number;
    repairs: number;
    inventoryTasks: number;
    inventoryRecords: number;
  };
  credentials: Array<{ username: string; password: string; roles: string[] }>;
}

export const getTestDataStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgs = await Org.findAll({ where: { code: TEST_ORG_CODES } });
    const orgIds = orgs.map(org => org.id);

    const departmentsPromise = orgIds.length
      ? Department.count({ where: { org_id: { [Op.in]: orgIds }, code: TEST_DEPARTMENT_CODES } })
      : Promise.resolve(0);

    const categories = await AssetCategory.findAll({ where: { code: TEST_CATEGORY_CODES } });
    const categoryIds = categories.map(category => category.id);

    const assetsPromise = categoryIds.length
      ? Asset.count({ where: { category_id: { [Op.in]: categoryIds } } })
      : Promise.resolve(0);

    const assets = categoryIds.length
      ? await Asset.findAll({ where: { category_id: { [Op.in]: categoryIds } }, attributes: ['id'] })
      : [];
    const assetIds = assets.map(asset => asset.id);

    const transfersPromise = assetIds.length
      ? AssetTransfer.count({ where: { asset_id: { [Op.in]: assetIds } } })
      : Promise.resolve(0);

    const repairsPromise = assetIds.length
      ? AssetRepair.count({ where: { asset_id: { [Op.in]: assetIds } } })
      : Promise.resolve(0);

    const tasks = orgIds.length
      ? await InventoryTask.findAll({
          where: {
            org_id: { [Op.in]: orgIds },
            name: { [Op.in]: TEST_TASK_NAMES }
          },
          attributes: ['id']
        })
      : [];
    const taskIds = tasks.map(task => task.id);

    const recordsPromise = taskIds.length
      ? InventoryRecord.count({ where: { task_id: { [Op.in]: taskIds } } })
      : Promise.resolve(0);

    const [departments, assetsCount, transfers, repairs, records] = await Promise.all([
      departmentsPromise,
      assetsPromise,
      transfersPromise,
      repairsPromise,
      recordsPromise
    ]);

    const users = await User.count({ where: { username: { [Op.in]: TEST_USERNAMES } } });
    const inventoryTasks = tasks.length;

    res.json({
      data: {
        installed:
          orgs.length > 0 ||
          departments > 0 ||
          users > 0 ||
          categories.length > 0 ||
          assetsCount > 0 ||
          transfers > 0 ||
          repairs > 0 ||
          inventoryTasks > 0 ||
          records > 0,
        summary: {
          orgs: orgs.length,
          departments,
          users,
          assetCategories: categories.length,
          assets: assetsCount,
          transfers,
          repairs,
          inventoryTasks,
          inventoryRecords: records
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const loadTestData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await sequelize.transaction(async transaction => {
      const existingOrg = await Org.findOne({ where: { code: TEST_ORG_CODES[0] }, transaction });
      if (existingOrg) {
        throw new AppError('测试数据已存在，请先卸载后再填充', 409);
      }

      const [superAdminRole, orgAdminRole, repairRole, employeeRole] = await Promise.all([
        Role.findOne({ where: { code: 'SUPER_ADMIN' }, transaction }),
        Role.findOne({ where: { code: 'ORG_ADMIN' }, transaction }),
        Role.findOne({ where: { code: 'REPAIR_STAFF' }, transaction }),
        Role.findOne({ where: { code: 'EMPLOYEE' }, transaction })
      ]);

      if (!superAdminRole || !orgAdminRole || !repairRole || !employeeRole) {
        throw new AppError('角色数据缺失，请先执行数据库初始化脚本', 400);
      }

      const orgHeadquarters = await Org.create(
        {
          name: '测试总部',
          code: TEST_ORG_CODES[0],
          parent_id: null,
          is_active: true
        },
        { transaction }
      );

      const orgManufacture = await Org.create(
        {
          name: '测试制造中心',
          code: TEST_ORG_CODES[1],
          parent_id: orgHeadquarters.id,
          is_active: true
        },
        { transaction }
      );

      const orgOperations = await Org.create(
        {
          name: '测试运营中心',
          code: TEST_ORG_CODES[2],
          parent_id: orgHeadquarters.id,
          is_active: true
        },
        { transaction }
      );

      const deptIT = await Department.create(
        {
          org_id: orgHeadquarters.id,
          name: '测试信息技术部',
          code: TEST_DEPARTMENT_CODES[0],
          is_active: true
        },
        { transaction }
      );

      const deptProduction = await Department.create(
        {
          org_id: orgManufacture.id,
          name: '测试生产一部',
          code: TEST_DEPARTMENT_CODES[1],
          is_active: true
        },
        { transaction }
      );

      const deptService = await Department.create(
        {
          org_id: orgOperations.id,
          name: '测试客服中心',
          code: TEST_DEPARTMENT_CODES[2],
          is_active: true
        },
        { transaction }
      );

      const testSuperPassword = 'Test1234!';
      const testManagerPassword = 'Test1234!';
      const testTechPassword = 'Test1234!';
      const testEmployeePassword = 'Test1234!';

      const [superHash, managerHash, techHash, employeeHash] = await Promise.all([
        bcrypt.hash(testSuperPassword, 10),
        bcrypt.hash(testManagerPassword, 10),
        bcrypt.hash(testTechPassword, 10),
        bcrypt.hash(testEmployeePassword, 10)
      ]);

      const testSuper = await User.create(
        {
          username: TEST_USERNAMES[0],
          real_name: '测试超级管理员',
          phone: '13900010001',
          email: 'test-super@example.com',
          password_hash: superHash,
          org_id: orgHeadquarters.id,
          department_id: deptIT.id,
          is_active: true
        },
        { transaction }
      );

      const testManager = await User.create(
        {
          username: TEST_USERNAMES[1],
          real_name: '测试制造管理员',
          phone: '13900010002',
          email: 'test-manager@example.com',
          password_hash: managerHash,
          org_id: orgManufacture.id,
          department_id: deptProduction.id,
          is_active: true
        },
        { transaction }
      );

      const testTechnician = await User.create(
        {
          username: TEST_USERNAMES[2],
          real_name: '测试维修工程师',
          phone: '13900010003',
          email: 'test-tech@example.com',
          password_hash: techHash,
          org_id: orgManufacture.id,
          department_id: deptProduction.id,
          is_active: true
        },
        { transaction }
      );

      const testEmployee = await User.create(
        {
          username: TEST_USERNAMES[3],
          real_name: '测试客服专员',
          phone: '13900010004',
          email: 'test-employee@example.com',
          password_hash: employeeHash,
          org_id: orgOperations.id,
          department_id: deptService.id,
          is_active: true
        },
        { transaction }
      );

      const assignRoles = (user: User, roles: Role | Role[]) =>
        (user as any).setRoles(Array.isArray(roles) ? roles : [roles], { transaction });

      await Promise.all([
        assignRoles(testSuper, superAdminRole),
        assignRoles(testManager, orgAdminRole),
        assignRoles(testTechnician, [repairRole, employeeRole]),
        assignRoles(testEmployee, employeeRole)
      ]);

      const [categoryProd, categoryOffice, categoryQA] = await Promise.all([
        AssetCategory.create(
          {
            name: '测试-生产设备',
            code: TEST_CATEGORY_CODES[0],
            level: 1,
            parent_id: null,
            is_active: true,
            sort_order: 10
          },
          { transaction }
        ),
        AssetCategory.create(
          {
            name: '测试-办公设备',
            code: TEST_CATEGORY_CODES[1],
            level: 1,
            parent_id: null,
            is_active: true,
            sort_order: 20
          },
          { transaction }
        ),
        AssetCategory.create(
          {
            name: '测试-检测工具',
            code: TEST_CATEGORY_CODES[2],
            level: 1,
            parent_id: null,
            is_active: true,
            sort_order: 30
          },
          { transaction }
        )
      ]);

      const assets = await Promise.all([
        Asset.create(
          {
            asset_id: generateAssetId(categoryProd.code, orgManufacture.code, deptProduction.code, 101),
            name: '测试数控机床 V8',
            category_id: categoryProd.id,
            org_id: orgManufacture.id,
            department_id: deptProduction.id,
            user_id: testManager.id,
            location: '制造中心·A车间',
            status: '在用',
            brand: 'CNC Tech',
            model: 'V8-Pro',
            serial_no: 'SN-CNC-001',
            supplier: '精密智造',
            purchase_date: new Date('2022-03-01'),
            purchase_price: 480000,
            warranty_expire_date: new Date('2025-03-01'),
            expected_life_years: 10,
            qr_code_content: '测试数控机床 V8',
            remark: '示例生产设备，适合调拨与盘点流程演示'
          },
          { transaction }
        ),
        Asset.create(
          {
            asset_id: generateAssetId(categoryProd.code, orgManufacture.code, deptProduction.code, 102),
            name: '测试自动化机械臂',
            category_id: categoryProd.id,
            org_id: orgManufacture.id,
            department_id: deptProduction.id,
            user_id: testTechnician.id,
            location: '制造中心·实验区',
            status: '维修中',
            brand: 'RoboticsX',
            model: 'RX-2',
            serial_no: 'SN-ROB-002',
            supplier: '智能装备有限公司',
            purchase_date: new Date('2021-11-15'),
            purchase_price: 260000,
            warranty_expire_date: new Date('2024-11-15'),
            expected_life_years: 8,
            qr_code_content: '测试自动化机械臂',
            remark: '故障模拟中，用于维修流程演示'
          },
          { transaction }
        ),
        Asset.create(
          {
            asset_id: generateAssetId(categoryOffice.code, orgHeadquarters.code, deptIT.code, 103),
            name: '测试运维笔记本',
            category_id: categoryOffice.id,
            org_id: orgHeadquarters.id,
            department_id: deptIT.id,
            user_id: testSuper.id,
            location: '总部·信息中心',
            status: '闲置',
            brand: 'ThinkMaster',
            model: 'Pro 14',
            serial_no: 'SN-LAP-003',
            supplier: '测试IT采购',
            purchase_date: new Date('2023-05-10'),
            purchase_price: 9800,
            warranty_expire_date: new Date('2026-05-10'),
            expected_life_years: 5,
            qr_code_content: '测试运维笔记本',
            remark: '备用设备，可用于扫码和调拨流程测试'
          },
          { transaction }
        ),
        Asset.create(
          {
            asset_id: generateAssetId(categoryQA.code, orgOperations.code, deptService.code, 104),
            name: '测试客服扫码枪',
            category_id: categoryQA.id,
            org_id: orgOperations.id,
            department_id: deptService.id,
            user_id: testEmployee.id,
            location: '运营中心·客服区',
            status: '调拨中',
            brand: 'ScanPoint',
            model: 'SP-1',
            serial_no: 'SN-SCAN-004',
            supplier: '智能识别科技',
            purchase_date: new Date('2020-09-05'),
            purchase_price: 2300,
            warranty_expire_date: new Date('2023-09-05'),
            expected_life_years: 4,
            qr_code_content: '测试客服扫码枪',
            remark: '跨组织调拨审批演示数据'
          },
          { transaction }
        ),
        Asset.create(
          {
            asset_id: generateAssetId(categoryOffice.code, orgOperations.code, deptService.code, 105),
            name: '测试备用打印机',
            category_id: categoryOffice.id,
            org_id: orgOperations.id,
            department_id: deptService.id,
            user_id: null,
            location: '运营中心·仓库',
            status: '报废',
            brand: 'PrintAll',
            model: 'PA-500',
            serial_no: 'SN-PRT-005',
            supplier: '办公设备服务商',
            purchase_date: new Date('2017-02-20'),
            purchase_price: 3500,
            warranty_expire_date: new Date('2020-02-20'),
            expected_life_years: 5,
            qr_code_content: '测试备用打印机',
            remark: '已报废的资产，便于状态筛选演示'
          },
          { transaction }
        )
      ]);

      const [machineAsset, robotAsset, laptopAsset, scannerAsset, printerAsset] = assets;

      const transfers = await Promise.all([
        AssetTransfer.create(
          {
            transfer_no: generateTransferNo(),
            asset_id: machineAsset.id,
            from_org_id: orgManufacture.id,
            from_department_id: deptProduction.id,
            from_user_id: testManager.id,
            to_org_id: orgHeadquarters.id,
            to_department_id: deptIT.id,
            to_user_id: testSuper.id,
            reason: '共享制造资源，调入总部展示中心',
            status: '已通过',
            apply_user_id: testManager.id,
            apply_time: new Date(),
            approve_user_id: testSuper.id,
            approve_time: new Date()
          },
          { transaction }
        ),
        AssetTransfer.create(
          {
            transfer_no: generateTransferNo(),
            asset_id: scannerAsset.id,
            from_org_id: orgOperations.id,
            from_department_id: deptService.id,
            from_user_id: testEmployee.id,
            to_org_id: orgHeadquarters.id,
            to_department_id: deptIT.id,
            to_user_id: testSuper.id,
            reason: '总部客服体验中心调拨需求',
            status: '审批中',
            apply_user_id: testEmployee.id,
            apply_time: new Date(),
            approve_user_id: null,
            approve_time: null,
            reject_reason: null
          },
          { transaction }
        )
      ]);

      const repairs = await Promise.all([
        AssetRepair.create(
          {
            repair_no: generateRepairNo(),
            asset_id: robotAsset.id,
            report_user_id: testManager.id,
            report_time: new Date(),
            level: '严重',
            description: '示例：关节轴失灵，需要更换伺服电机',
            can_continue_use: false,
            assign_user_id: testSuper.id,
            repair_user_id: testTechnician.id,
            repair_start_time: new Date(Date.now() - 1000 * 60 * 60 * 24),
            repair_finish_time: null,
            result: null,
            used_parts: null,
            cost: null,
            status: '维修中'
          },
          { transaction }
        ),
        AssetRepair.create(
          {
            repair_no: generateRepairNo(),
            asset_id: printerAsset.id,
            report_user_id: testEmployee.id,
            report_time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15),
            level: '一般',
            description: '示例：打印头故障，已完成更换',
            can_continue_use: false,
            assign_user_id: testManager.id,
            repair_user_id: testTechnician.id,
            repair_start_time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
            repair_finish_time: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12),
            result: '已更换核心部件，建议淘汰',
            used_parts: '打印头组件, 走纸组件',
            cost: 1200,
            status: '已完成'
          },
          { transaction }
        )
      ]);

      const taskCompleted = await InventoryTask.create(
        {
          task_no: generateInventoryTaskNo(),
          name: TEST_TASK_NAMES[0],
          org_id: orgHeadquarters.id,
          creator_id: testSuper.id,
          status: '已完成',
          scope_type: '抽盘',
          start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          end_date: new Date(),
          finish_date: new Date(),
          total_count: 2,
          scanned_count: 2,
          remark: '演示总部资产盘点报告'
        },
        { transaction }
      );

      const taskOngoing = await InventoryTask.create(
        {
          task_no: generateInventoryTaskNo(),
          name: TEST_TASK_NAMES[1],
          org_id: orgManufacture.id,
          creator_id: testManager.id,
          status: '执行中',
          scope_type: '全盘',
          start_date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
          end_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4),
          finish_date: null,
          total_count: 3,
          scanned_count: 1,
          remark: '演示制造中心实时盘点进度'
        },
        { transaction }
      );

      const inventoryRecords = await Promise.all([
        InventoryRecord.create(
          {
            task_id: taskCompleted.id,
            asset_id: laptopAsset.id,
            scan_user_id: testSuper.id,
            result_status: '正常',
            actual_location: '总部信息中心机柜1',
            remark: '状态正常'
          },
          { transaction }
        ),
        InventoryRecord.create(
          {
            task_id: taskCompleted.id,
            asset_id: printerAsset.id,
            scan_user_id: testEmployee.id,
            result_status: '状态异常',
            actual_location: '运营中心仓库',
            remark: '设备已停用，建议报废'
          },
          { transaction }
        ),
        InventoryRecord.create(
          {
            task_id: taskOngoing.id,
            asset_id: machineAsset.id,
            scan_user_id: testTechnician.id,
            result_status: '正常',
            actual_location: '制造中心·A车间',
            remark: '已确认标签完好'
          },
          { transaction }
        )
      ]);

      const counts: SeedSummary['counts'] = {
        orgs: 3,
        departments: 3,
        users: 4,
        assetCategories: 3,
        assets: assets.length,
        transfers: transfers.length,
        repairs: repairs.length,
        inventoryTasks: 2,
        inventoryRecords: inventoryRecords.length
      };

      const credentials: SeedSummary['credentials'] = [
        { username: TEST_USERNAMES[0], password: testSuperPassword, roles: ['SUPER_ADMIN'] },
        { username: TEST_USERNAMES[1], password: testManagerPassword, roles: ['ORG_ADMIN'] },
        { username: TEST_USERNAMES[2], password: testTechPassword, roles: ['REPAIR_STAFF', 'EMPLOYEE'] },
        { username: TEST_USERNAMES[3], password: testEmployeePassword, roles: ['EMPLOYEE'] }
      ];

      return { counts, credentials };
    });

    res.status(201).json({
      message: '测试数据填充完成',
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

export const clearTestData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const removalResult = await sequelize.transaction(async transaction => {
      const orgs = await Org.findAll({ where: { code: TEST_ORG_CODES }, transaction });
      const orgIds = orgs.map(org => org.id);

      if (orgs.length === 0) {
        return {
          removed: {
            orgs: 0,
            departments: 0,
            users: 0,
            assetCategories: 0,
            assets: 0,
            transfers: 0,
            repairs: 0,
            inventoryTasks: 0,
            inventoryRecords: 0
          }
        };
      }

      const departments = await Department.findAll({
        where: { org_id: { [Op.in]: orgIds }, code: TEST_DEPARTMENT_CODES },
        transaction
      });
      const departmentIds = departments.map(dept => dept.id);

      const users = await User.findAll({ where: { username: { [Op.in]: TEST_USERNAMES } }, transaction });
      const userIds = users.map(user => user.id);

      await Promise.all(users.map(user => (user as any).setRoles([], { transaction })));

      const categories = await AssetCategory.findAll({ where: { code: TEST_CATEGORY_CODES }, transaction });
      const categoryIds = categories.map(category => category.id);

      const assets = categoryIds.length
        ? await Asset.findAll({ where: { category_id: { [Op.in]: categoryIds } }, transaction })
        : [];
      const assetIds = assets.map(asset => asset.id);

      const transfersRemoved = assetIds.length
        ? await AssetTransfer.destroy({ where: { asset_id: { [Op.in]: assetIds } }, transaction })
        : 0;

      const repairsRemoved = assetIds.length
        ? await AssetRepair.destroy({ where: { asset_id: { [Op.in]: assetIds } }, transaction })
        : 0;

      const tasks = await InventoryTask.findAll({
        where: {
          org_id: { [Op.in]: orgIds },
          name: { [Op.in]: TEST_TASK_NAMES }
        },
        transaction
      });
      const taskIds = tasks.map(task => task.id);

      const recordsRemoved = taskIds.length
        ? await InventoryRecord.destroy({ where: { task_id: { [Op.in]: taskIds } }, transaction })
        : 0;

      const tasksRemoved = taskIds.length
        ? await InventoryTask.destroy({ where: { id: { [Op.in]: taskIds } }, transaction })
        : 0;

      const assetsRemoved = assetIds.length
        ? await Asset.destroy({ where: { id: { [Op.in]: assetIds } }, transaction })
        : 0;

      const categoriesRemoved = categoryIds.length
        ? await AssetCategory.destroy({ where: { id: { [Op.in]: categoryIds } }, transaction })
        : 0;

      const usersRemoved = userIds.length
        ? await User.destroy({ where: { id: { [Op.in]: userIds } }, transaction })
        : 0;

      const departmentsRemoved = departmentIds.length
        ? await Department.destroy({ where: { id: { [Op.in]: departmentIds } }, transaction })
        : 0;

      const orgsRemoved = orgIds.length
        ? await Org.destroy({ where: { id: { [Op.in]: orgIds } }, transaction })
        : 0;

      return {
        removed: {
          orgs: orgsRemoved,
          departments: departmentsRemoved,
          users: usersRemoved,
          assetCategories: categoriesRemoved,
          assets: assetsRemoved,
          transfers: transfersRemoved,
          repairs: repairsRemoved,
          inventoryTasks: tasksRemoved,
          inventoryRecords: recordsRemoved
        }
      };
    });

    res.json({
      message: '测试数据已卸载',
      data: removalResult
    });
  } catch (error) {
    next(error);
  }
};
