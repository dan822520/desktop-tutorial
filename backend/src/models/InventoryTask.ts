import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class InventoryTask extends Model {
  public id!: number;
  public task_no!: string;
  public name!: string;
  public org_id!: number;
  public creator_id!: number;
  public status!: '待执行' | '执行中' | '已完成' | '已取消';
  public scope_type!: '全盘' | '抽盘';
  public start_date!: Date | null;
  public end_date!: Date | null;
  public finish_date!: Date | null;
  public total_count!: number;
  public scanned_count!: number;
  public remark!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

InventoryTask.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    task_no: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '盘点任务编号'
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '任务名称'
    },
    org_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '组织ID'
    },
    creator_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '创建人ID'
    },
    status: {
      type: DataTypes.ENUM('待执行', '执行中', '已完成', '已取消'),
      defaultValue: '待执行',
      comment: '任务状态'
    },
    scope_type: {
      type: DataTypes.ENUM('全盘', '抽盘'),
      defaultValue: '抽盘',
      comment: '盘点类型'
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '计划开始日期'
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '计划结束日期'
    },
    finish_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '实际完成日期'
    },
    total_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '总资产数'
    },
    scanned_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '已盘点数'
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注'
    }
  },
  {
    sequelize,
    tableName: 'inventory_task',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default InventoryTask;
