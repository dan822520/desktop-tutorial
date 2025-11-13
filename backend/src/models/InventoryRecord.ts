import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class InventoryRecord extends Model {
  public id!: number;
  public task_id!: number;
  public asset_id!: number;
  public scan_user_id!: number;
  public scan_time!: Date;
  public result_status!: '正常' | '位置不符' | '未找到' | '状态异常';
  public actual_location!: string | null;
  public remark!: string | null;
}

InventoryRecord.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    task_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '盘点任务ID'
    },
    asset_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '资产ID'
    },
    scan_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '盘点人ID'
    },
    scan_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: '盘点时间'
    },
    result_status: {
      type: DataTypes.ENUM('正常', '位置不符', '未找到', '状态异常'),
      defaultValue: '正常',
      comment: '盘点结果'
    },
    actual_location: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '实际位置'
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注'
    }
  },
  {
    sequelize,
    tableName: 'inventory_record',
    timestamps: false
  }
);

export default InventoryRecord;
