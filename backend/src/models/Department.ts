import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Department extends Model {
  public id!: number;
  public org_id!: number;
  public name!: string;
  public code!: string;
  public parent_id!: number | null;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Department.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    org_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '所属组织ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '部门名称'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '部门编码'
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '父部门ID'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否启用'
    }
  },
  {
    sequelize,
    tableName: 'department',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Department;
