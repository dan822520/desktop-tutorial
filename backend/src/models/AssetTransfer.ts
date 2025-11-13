import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class AssetTransfer extends Model {
  public id!: number;
  public transfer_no!: string;
  public asset_id!: number;
  public from_org_id!: number;
  public from_department_id!: number | null;
  public from_user_id!: number | null;
  public to_org_id!: number;
  public to_department_id!: number | null;
  public to_user_id!: number | null;
  public reason!: string | null;
  public status!: '草稿' | '审批中' | '已通过' | '已驳回' | '已取消';
  public apply_user_id!: number;
  public apply_time!: Date;
  public approve_user_id!: number | null;
  public approve_time!: Date | null;
  public reject_reason!: string | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

AssetTransfer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    transfer_no: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '调拨单号'
    },
    asset_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '资产ID'
    },
    from_org_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '调出组织ID'
    },
    from_department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '调出部门ID'
    },
    from_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '调出负责人ID'
    },
    to_org_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '调入组织ID'
    },
    to_department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '调入部门ID'
    },
    to_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '调入负责人ID'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '调拨原因'
    },
    status: {
      type: DataTypes.ENUM('草稿', '审批中', '已通过', '已驳回', '已取消'),
      defaultValue: '草稿',
      comment: '调拨状态'
    },
    apply_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '申请人ID'
    },
    apply_time: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: '申请时间'
    },
    approve_user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '审批人ID'
    },
    approve_time: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '审批时间'
    },
    reject_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '驳回原因'
    }
  },
  {
    sequelize,
    tableName: 'asset_transfer',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default AssetTransfer;
