import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class AssetCategory extends Model {
  public id!: number;
  public parent_id!: number | null;
  public name!: string;
  public code!: string;
  public level!: number;
  public is_active!: boolean;
  public sort_order!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

AssetCategory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '父分类ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '分类名称'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '分类编码'
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '层级'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否启用'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序'
    }
  },
  {
    sequelize,
    tableName: 'asset_category',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default AssetCategory;
