import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Org extends Model {
  public id!: number;
  public name!: string;
  public code!: string;
  public parent_id!: number | null;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Org.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '组织名称'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '组织编码'
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '父组织ID'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否启用'
    }
  },
  {
    sequelize,
    tableName: 'org',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Org;
