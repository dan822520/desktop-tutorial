import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Role extends Model {
  public id!: number;
  public name!: string;
  public code!: string;
  public description!: string | null;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Role.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '角色名称'
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '角色编码'
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '角色描述'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否启用'
    }
  },
  {
    sequelize,
    tableName: 'role',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Role;
