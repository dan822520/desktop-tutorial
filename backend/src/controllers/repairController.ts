import { Request, Response, NextFunction } from 'express';
import { AssetRepair, Asset, User } from '../models';
import { AppError } from '../middleware/errorHandler';
import { generateRepairNo } from '../utils/generator';

// 获取维修工单列表
export const getRepairs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, status, asset_id } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (asset_id) where.asset_id = asset_id;

    const { count, rows } = await AssetRepair.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      include: [
        { model: Asset, as: 'asset', attributes: ['id', 'asset_id', 'name'] },
        { model: User, as: 'reporter', attributes: ['id', 'real_name', 'phone'] },
        { model: User, as: 'repairer', attributes: ['id', 'real_name', 'phone'] }
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

// 创建报修
export const createRepair = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      asset_id,
      level,
      description,
      can_continue_use
    } = req.body;

    if (!asset_id || !description) {
      throw new AppError('资产和故障描述不能为空', 400);
    }

    const asset = await Asset.findByPk(asset_id);
    if (!asset) {
      throw new AppError('资产不存在', 404);
    }

    const repair_no = generateRepairNo();

    const repair = await AssetRepair.create({
      repair_no,
      asset_id,
      report_user_id: req.user!.id,
      level: level || '一般',
      description,
      can_continue_use: can_continue_use || false,
      status: '待派单'
    });

    // 如果不能继续使用，更新资产状态
    if (!can_continue_use) {
      await asset.update({ status: '维修中' });
    }

    res.status(201).json({
      message: '报修已提交',
      data: repair
    });
  } catch (error) {
    next(error);
  }
};

// 派单
export const assignRepair = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { repair_user_id } = req.body;

    if (!repair_user_id) {
      throw new AppError('请选择维修人员', 400);
    }

    const repair = await AssetRepair.findByPk(id);
    if (!repair) {
      throw new AppError('维修工单不存在', 404);
    }

    if (repair.status !== '待派单') {
      throw new AppError('该工单已派单', 400);
    }

    await repair.update({
      assign_user_id: req.user!.id,
      repair_user_id,
      status: '待维修'
    });

    res.json({ message: '派单成功' });
  } catch (error) {
    next(error);
  }
};

// 完成维修
export const completeRepair = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { result, used_parts, cost } = req.body;

    const repair = await AssetRepair.findByPk(id, {
      include: [{ model: Asset, as: 'asset' }]
    });

    if (!repair) {
      throw new AppError('维修工单不存在', 404);
    }

    if (!['待维修', '维修中'].includes(repair.status)) {
      throw new AppError('该工单状态不允许完成', 400);
    }

    await repair.update({
      result,
      used_parts,
      cost,
      repair_finish_time: new Date(),
      status: '已完成'
    });

    // 更新资产状态
    const asset = repair.get('asset') as Asset;
    await asset.update({ status: '在用' });

    res.json({ message: '维修已完成' });
  } catch (error) {
    next(error);
  }
};
