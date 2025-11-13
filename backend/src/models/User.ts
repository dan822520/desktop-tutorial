import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

class User extends Model {
  public id!: number;
  public username!: string;
  public real_name!: string;
  public phone!: string | null;
  public email!: string | null;
  public password_hash!: string;
  public org_id!: number;
  public department_id!: number | null;
  public is_active!: boolean;
  public last_login_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // 验证密码
  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash);
  }

  // 设置密码
  public async setPassword(password: string): Promise<void> {
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(password, salt);
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '用户名'
    },
    real_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '真实姓名'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '手机号'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '邮箱'
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '密码哈希'
    },
    org_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '所属组织ID'
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '所属部门ID'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否启用'
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后登录时间'
    }
  },
  {
    sequelize,
    tableName: 'user',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default User;
