import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { AssetTransfer, Asset, User } from '../models';
import { AppError } from '../middleware/errorHandler';
import { generateTransferNo } from '../utils/generator';

// 获取调拨列表
export const getTransfers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, status, asset_id } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (asset_id) where.asset_id = asset_id;

    // 数据权限过滤
    if (req.user && !req.user.roles.includes('SUPER_ADMIN')) {
      where[Op.or] = [
        { from_org_id: req.user.org_id },
        { to_org_id: req.user.org_id }
      ];
    }

    const { count, rows } = await AssetTransfer.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'asset_id', 'name'] },
        { model: User, as: 'applicant', attributes: ['id', 'real_name'] },
        { model: User, as: 'approver', attributes: ['id', 'real_name'] }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      data: {
        list: rows,
        total: count,
        page: Number(page),
        limit: Number(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// 创建调拨申请
export const createTransfer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      asset_id,
      to_org_id,
      to_department_id,
      to_user_id,
      reason
    } = req.body;

    if (!asset_id || !to_org_id) {
      throw new AppError('资产和调入组织不能为空', 400);
    }

    const asset = await Asset.findByPk(asset_id);
    if (!asset) {
      throw new AppError('资产不存在', 404);
    }

    // 生成调拨单号
    const transfer_no = generateTransferNo();

    const transfer = await AssetTransfer.create({
      transfer_no,
      asset_id,
      from_org_id: asset.org_id,
      from_department_id: asset.department_id,
      from_user_id: asset.user_id,
      to_org_id,
      to_department_id,
      to_user_id,
      reason,
      status: '审批中',
      apply_user_id: req.user!.id
    });

    // 更新资产状态
    await asset.update({ status: '调拨中' });

    res.status(201).json({
      message: '调拨申请已提交',
      data: transfer
    });
  } catch (error) {
    next(error);
  }
};

// 审批调拨
export const approveTransfer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { approved, reject_reason } = req.body;

    const transfer = await AssetTransfer.findByPk(id, {
      include: [{ model: Asset, as: 'asset' }]
    });

    if (!transfer) {
      throw new AppError('调拨记录不存在', 404);
    }

    if (transfer.status !== '审批中') {
      throw new AppError('该调拨已处理', 400);
    }

    if (approved) {
      // 批准：更新资产信息
      const asset = transfer.get('asset') as Asset;
      await asset.update({
        org_id: transfer.to_org_id,
        department_id: transfer.to_department_id,
        user_id: transfer.to_user_id,
        status: '在用'
      });

      await transfer.update({
        status: '已通过',
        approve_user_id: req.user!.id,
        approve_time: new Date()
      });

      res.json({ message: '调拨已批准' });
    } else {
      // 驳回
      const asset = transfer.get('asset') as Asset;
      await asset.update({ status: '在用' });

      await transfer.update({
        status: '已驳回',
        approve_user_id: req.user!.id,
        approve_time: new Date(),
        reject_reason
      });

      res.json({ message: '调拨已驳回' });
    }
  } catch (error) {
    next(error);
  }
};
