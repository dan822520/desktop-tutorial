import Org from './Org';
import Department from './Department';
import Role from './Role';
import User from './User';
import AssetCategory from './AssetCategory';
import Asset from './Asset';
import AssetTransfer from './AssetTransfer';
import AssetRepair from './AssetRepair';
import InventoryTask from './InventoryTask';
import InventoryRecord from './InventoryRecord';

// 设置模型关联关系

// Org 关联
Org.hasMany(Department, { foreignKey: 'org_id', as: 'departments' });
Org.hasMany(User, { foreignKey: 'org_id', as: 'users' });
Org.hasMany(Asset, { foreignKey: 'org_id', as: 'assets' });

// Department 关联
Department.belongsTo(Org, { foreignKey: 'org_id', as: 'org' });
Department.hasMany(User, { foreignKey: 'department_id', as: 'users' });
Department.hasMany(Asset, { foreignKey: 'department_id', as: 'assets' });

// User 关联
User.belongsTo(Org, { foreignKey: 'org_id', as: 'org' });
User.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
User.belongsToMany(Role, { through: 'user_role', foreignKey: 'user_id', otherKey: 'role_id', as: 'roles' });

// Role 关联
Role.belongsToMany(User, { through: 'user_role', foreignKey: 'role_id', otherKey: 'user_id', as: 'users' });

// Asset 关联
Asset.belongsTo(AssetCategory, { foreignKey: 'category_id', as: 'category' });
Asset.belongsTo(Org, { foreignKey: 'org_id', as: 'org' });
Asset.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
Asset.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Asset.hasMany(AssetTransfer, { foreignKey: 'asset_id', as: 'transfers' });
Asset.hasMany(AssetRepair, { foreignKey: 'asset_id', as: 'repairs' });

// AssetCategory 关联
AssetCategory.hasMany(Asset, { foreignKey: 'category_id', as: 'assets' });

// AssetTransfer 关联
AssetTransfer.belongsTo(Asset, { foreignKey: 'asset_id', as: 'asset' });
AssetTransfer.belongsTo(User, { foreignKey: 'apply_user_id', as: 'applicant' });
AssetTransfer.belongsTo(User, { foreignKey: 'approve_user_id', as: 'approver' });

// AssetRepair 关联
AssetRepair.belongsTo(Asset, { foreignKey: 'asset_id', as: 'asset' });
AssetRepair.belongsTo(User, { foreignKey: 'report_user_id', as: 'reporter' });
AssetRepair.belongsTo(User, { foreignKey: 'repair_user_id', as: 'repairer' });

// InventoryTask 关联
InventoryTask.belongsTo(Org, { foreignKey: 'org_id', as: 'org' });
InventoryTask.belongsTo(User, { foreignKey: 'creator_id', as: 'creator' });
InventoryTask.hasMany(InventoryRecord, { foreignKey: 'task_id', as: 'records' });

// InventoryRecord 关联
InventoryRecord.belongsTo(InventoryTask, { foreignKey: 'task_id', as: 'task' });
InventoryRecord.belongsTo(Asset, { foreignKey: 'asset_id', as: 'asset' });
InventoryRecord.belongsTo(User, { foreignKey: 'scan_user_id', as: 'scanner' });

export {
  Org,
  Department,
  Role,
  User,
  AssetCategory,
  Asset,
  AssetTransfer,
  AssetRepair,
  InventoryTask,
  InventoryRecord
};
