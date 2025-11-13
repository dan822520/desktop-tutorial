import { Request, Response, NextFunction } from 'express';
import { InventoryTask, InventoryRecord, Asset, User, Org } from '../models';
import { AppError } from '../middleware/errorHandler';
import { generateInventoryTaskNo } from '../utils/generator';
import { Op } from 'sequelize';

// 获取盘点任务列表
export const getInventoryTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;

    // 数据权限
    if (req.user && !req.user.roles.includes('SUPER_ADMIN')) {
      where.org_id = req.user.org_id;
    }

    const { count, rows } = await InventoryTask.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      include: [
        { model: Org, as: 'org', attributes: ['id', 'name', 'code'] },
        { model: User, as: 'creator', attributes: ['id', 'real_name'] }
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

// 创建盘点任务
export const createInventoryTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      org_id,
      scope_type,
      start_date,
      end_date,
      asset_ids,
      remark
    } = req.body;

    if (!name || !org_id) {
      throw new AppError('任务名称和组织不能为空', 400);
    }

    const task_no = generateInventoryTaskNo();

    // 确定盘点资产范围
    let assets: Asset[] = [];
    if (scope_type === '全盘') {
      assets = await Asset.findAll({
        where: { org_id, status: { [Op.ne]: '报废' } },
        attributes: ['id']
      });
    } else if (asset_ids && asset_ids.length > 0) {
      assets = await Asset.findAll({
        where: { id: { [Op.in]: asset_ids } },
        attributes: ['id']
      });
    }

    const task = await InventoryTask.create({
      task_no,
      name,
      org_id,
      creator_id: req.user!.id,
      status: '待执行',
      scope_type: scope_type || '抽盘',
      start_date,
      end_date,
      total_count: assets.length,
      scanned_count: 0,
      remark
    });

    const selectedAssetIds = assets.map(asset => asset.id);

    res.status(201).json({
      message: '盘点任务创建成功',
      data: {
        task: task.get({ plain: true }),
        selected_asset_ids: selectedAssetIds
      }
    });
  } catch (error) {
    next(error);
  }
};

// 扫码记录盘点
export const scanAsset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { task_id } = req.params;
    const { asset_id, result_status, actual_location, remark } = req.body;

    const task = await InventoryTask.findByPk(task_id);
    if (!task) {
      throw new AppError('盘点任务不存在', 404);
    }

    if (task.status === '已完成' || task.status === '已取消') {
      throw new AppError('该盘点任务已结束', 400);
    }

    const asset = await Asset.findByPk(asset_id);
    if (!asset) {
      throw new AppError('资产不存在', 404);
    }

    // 检查是否已经盘点过
    const existing = await InventoryRecord.findOne({
      where: { task_id, asset_id }
    });

    if (existing) {
      throw new AppError('该资产已盘点', 400);
    }

    // 创建盘点记录
    await InventoryRecord.create({
      task_id,
      asset_id,
      scan_user_id: req.user!.id,
      result_status: result_status || '正常',
      actual_location,
      remark
    });

    // 更新任务统计
    await task.increment('scanned_count');

    // 更新任务状态
    if (task.status === '待执行') {
      await task.update({ status: '执行中' });
    }

    res.json({ message: '盘点记录已保存' });
  } catch (error) {
    next(error);
  }
};

// 完成盘点任务
export const finishInventoryTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const task = await InventoryTask.findByPk(id);
    if (!task) {
      throw new AppError('盘点任务不存在', 404);
    }

    if (task.status === '已完成') {
      throw new AppError('该任务已完成', 400);
    }

    await task.update({
      status: '已完成',
      finish_date: new Date()
    });

    res.json({ message: '盘点任务已完成' });
  } catch (error) {
    next(error);
  }
};

// 获取盘点报告
export const getInventoryReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const task = await InventoryTask.findByPk(id, {
      include: [
        {
          model: InventoryRecord,
          as: 'records',
          include: [
            { model: Asset, as: 'asset', attributes: ['id', 'asset_id', 'name', 'location'] },
            { model: User, as: 'scanner', attributes: ['id', 'real_name'] }
          ]
        }
      ]
    });

    if (!task) {
      throw new AppError('盘点任务不存在', 404);
    }

    // 统计数据
    const records = task.get('records') as InventoryRecord[];
    const stats = {
      total: task.total_count,
      scanned: task.scanned_count,
      normal: records.filter(r => r.result_status === '正常').length,
      locationMismatch: records.filter(r => r.result_status === '位置不符').length,
      notFound: records.filter(r => r.result_status === '未找到').length,
      abnormal: records.filter(r => r.result_status === '状态异常').length
    };

    res.json({
      data: {
        task,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};
