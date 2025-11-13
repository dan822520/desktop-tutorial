import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class AssetRepair extends Model {
  public id!: number;
  public repair_no!: string;
  public asset_id!: number;
  public report_user_id!: number;
  public report_time!: Date;
  public level!: '轻微' | '一般' | '严重';
  public description!: string;
  public can_continue_use!: boolean;
  public assign_user_id!: number | null;
  public repair_user_id!: number | null;
  public repair_start_time!: Date | null;
  public repair_finish_time!: Date | null;
  public result!: string | null;
  public used_parts!: string | null;
  public cost!: number | null;
  public status!: '待派单' | '待维修' | '维修中' | '已完成' | '已关闭';
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

AssetRepair.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    repair_no: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '维修单号'
    },
    asset_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '资产ID'
    },
    report_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '报修人ID'
    },
    report_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: '报修时间'
    },
    level: {
      type: DataTypes.ENUM('轻微', '一般', '严重'),
      defaultValue: '一般',
      comment: '故障等级'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '故障描述'
    },
    can_continue_use: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '能否继续使用'
    },
    assign_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '派单人ID'
    },
    repair_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '维修人ID'
    },
    repair_start_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '维修开始时间'
    },
    repair_finish_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '维修完成时间'
    },
    result: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '处理结果描述'
    },
    used_parts: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '使用配件清单'
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '维修费用'
    },
    status: {
      type: DataTypes.ENUM('待派单', '待维修', '维修中', '已完成', '已关闭'),
      defaultValue: '待派单',
      comment: '工单状态'
    }
  },
  {
    sequelize,
    tableName: 'asset_repair',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default AssetRepair;
