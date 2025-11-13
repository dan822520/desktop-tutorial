import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Asset, AssetCategory, Org, Department, User } from '../models';
import { AppError } from '../middleware/errorHandler';
import { generateAssetId } from '../utils/generator';
import { QRCodeService } from '../utils/qrcode';

// 获取资产列表
export const getAssets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 20,
      category_id,
      org_id,
      department_id,
      status,
      keyword
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // 构建查询条件
    const where: any = {};

    // 数据权限过滤
    if (req.user && !req.user.roles.includes('SUPER_ADMIN')) {
      where.org_id = req.user.org_id;
    }

    if (category_id) where.category_id = category_id;
    if (org_id) where.org_id = org_id;
    if (department_id) where.department_id = department_id;
    if (status) where.status = status;

    // 关键字搜索
    if (keyword) {
      where[Op.or] = [
        { asset_id: { [Op.like]: `%${keyword}%` } },
        { name: { [Op.like]: `%${keyword}%` } },
        { brand: { [Op.like]: `%${keyword}%` } },
        { model: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const { count, rows } = await Asset.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      include: [
        {
          model: AssetCategory,
          as: 'category',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Org,
          as: 'org',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'real_name', 'phone']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      data: {
        list: rows,
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取单个资产详情
export const getAssetById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const asset = await Asset.findByPk(id, {
      include: [
        {
          model: AssetCategory,
          as: 'category',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Org,
          as: 'org',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'real_name', 'phone']
        }
      ]
    });

    if (!asset) {
      throw new AppError('资产不存在', 404);
    }

    // 数据权限检查
    if (req.user && !req.user.roles.includes('SUPER_ADMIN')) {
      if (asset.org_id !== req.user.org_id) {
        throw new AppError('无权访问此资产', 403);
      }
    }

    res.json({
      data: asset
    });
  } catch (error) {
    next(error);
  }
};

// 通过资产编号扫码查询
export const getAssetByScan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { asset_id } = req.params;

    const asset = await Asset.findOne({
      where: { asset_id },
      include: [
        {
          model: AssetCategory,
          as: 'category',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Org,
          as: 'org',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name', 'code']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'real_name', 'phone']
        }
      ]
    });

    if (!asset) {
      throw new AppError('资产未登记', 404);
    }

    res.json({
      data: asset
    });
  } catch (error) {
    next(error);
  }
};

// 创建资产
export const createAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      category_id,
      org_id,
      department_id,
      user_id,
      location,
      brand,
      model,
      serial_no,
      supplier,
      purchase_date,
      purchase_price,
      warranty_expire_date,
      expected_life_years,
      remark
    } = req.body;

    // 验证必填字段
    if (!name || !category_id || !org_id) {
      throw new AppError('资产名称、分类和所属组织不能为空', 400);
    }

    // 验证分类是否存在
    const category = await AssetCategory.findByPk(category_id);
    if (!category) {
      throw new AppError('资产分类不存在', 404);
    }

    // 验证组织是否存在
    const org = await Org.findByPk(org_id);
    if (!org) {
      throw new AppError('组织不存在', 404);
    }

    // 生成资产编号
    const deptCode = department_id ? (await Department.findByPk(department_id))?.code : undefined;
    const asset_id = generateAssetId(category.code, org.code, deptCode);

    // 生成二维码
    const qr_code_content = QRCodeService.generateAssetQRContent(asset_id);
    const qr_code_image_url = await QRCodeService.generateQRCodeImage(qr_code_content, asset_id);

    // 创建资产
    const asset = await Asset.create({
      asset_id,
      name,
      category_id,
      org_id,
      department_id,
      user_id,
      location,
      status: '在用',
      brand,
      model,
      serial_no,
      supplier,
      purchase_date,
      purchase_price,
      warranty_expire_date,
      expected_life_years,
      qr_code_content,
      qr_code_image_url,
      remark,
      created_by: req.user?.id
    });

    res.status(201).json({
      message: '资产创建成功',
      data: asset
    });
  } catch (error) {
    next(error);
  }
};

// 更新资产
export const updateAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const asset = await Asset.findByPk(id);

    if (!asset) {
      throw new AppError('资产不存在', 404);
    }

    // 数据权限检查
    if (req.user && !req.user.roles.includes('SUPER_ADMIN')) {
      if (asset.org_id !== req.user.org_id) {
        throw new AppError('无权修改此资产', 403);
      }
    }

    // 不允许修改某些字段
    delete updateData.id;
    delete updateData.asset_id;
    delete updateData.qr_code_content;
    delete updateData.qr_code_image_url;

    updateData.updated_by = req.user?.id;

    await asset.update(updateData);

    res.json({
      message: '资产更新成功',
      data: asset
    });
  } catch (error) {
    next(error);
  }
};

// 删除资产（逻辑删除，标记为报废）
export const deleteAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const asset = await Asset.findByPk(id);

    if (!asset) {
      throw new AppError('资产不存在', 404);
    }

    // 权限检查
    if (req.user && !req.user.roles.includes('SUPER_ADMIN')) {
      if (asset.org_id !== req.user.org_id) {
        throw new AppError('无权删除此资产', 403);
      }
    }

    // 标记为报废
    await asset.update({ status: '报废', updated_by: req.user?.id });

    res.json({
      message: '资产已标记为报废'
    });
  } catch (error) {
    next(error);
  }
};

// 批量生成二维码
export const batchGenerateQRCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 查找没有二维码的资产
    const assets = await Asset.findAll({
      where: {
        qr_code_content: null
      },
      attributes: ['id', 'asset_id']
    });

    if (assets.length === 0) {
      return res.json({
        message: '所有资产都已生成二维码',
        data: { count: 0 }
      });
    }

    // 批量生成
    const results = await QRCodeService.generateBatch(
      assets.map(a => ({ id: a.id.toString(), asset_id: a.asset_id }))
    );

    // 更新数据库
    for (const result of results) {
      await Asset.update(
        {
          qr_code_content: result.qr_code_content,
          qr_code_image_url: result.qr_code_image_url
        },
        {
          where: { id: result.id }
        }
      );
    }

    res.json({
      message: `成功为 ${results.length} 个资产生成二维码`,
      data: { count: results.length }
    });
  } catch (error) {
    next(error);
  }
};
