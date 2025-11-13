import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Asset extends Model {
  public id!: number;
  public asset_id!: string;
  public name!: string;
  public category_id!: number;
  public org_id!: number;
  public department_id!: number | null;
  public user_id!: number | null;
  public location!: string | null;
  public status!: '在用' | '闲置' | '维修中' | '调拨中' | '报废';

  // 基本信息
  public brand!: string | null;
  public model!: string | null;
  public serial_no!: string | null;
  public supplier!: string | null;

  // 财务信息
  public purchase_date!: Date | null;
  public purchase_price!: number | null;
  public warranty_expire_date!: Date | null;
  public expected_life_years!: number | null;

  // 二维码信息
  public qr_code_content!: string | null;
  public qr_code_image_url!: string | null;

  // 备注
  public remark!: string | null;

  // 系统字段
  public created_by!: number | null;
  public updated_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Asset.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    asset_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '资产编号'
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '资产名称'
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '资产分类ID'
    },
    org_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '所属组织ID'
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '当前部门ID'
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '当前负责人ID'
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '具体位置'
    },
    status: {
      type: DataTypes.ENUM('在用', '闲置', '维修中', '调拨中', '报废'),
      defaultValue: '在用',
      comment: '资产状态'
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '品牌'
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '型号'
    },
    serial_no: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '出厂序列号'
    },
    supplier: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '供应商'
    },
    purchase_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '采购日期'
    },
    purchase_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      comment: '采购价格'
    },
    warranty_expire_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: '质保到期日期'
    },
    expected_life_years: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '预计使用年限'
    },
    qr_code_content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '二维码内容'
    },
    qr_code_image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '二维码图片URL'
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '创建人ID'
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '更新人ID'
    }
  },
  {
    sequelize,
    tableName: 'asset',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
);

export default Asset;
