import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Department } from '../models';

/**
 * 获取部门列表。
 * - 默认仅返回启用的部门。
 * - 支持按组织或关键字过滤。
 * - 非超级管理员仅能查看本组织的部门。
 */
export const getDepartments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { org_id, keyword, include_inactive } = req.query;

    const where: any = {};

    if (!include_inactive || include_inactive === 'false') {
      where.is_active = true;
    }

    if (org_id) {
      where.org_id = Number(org_id);
    }

    if (req.user && !req.user.roles.includes('SUPER_ADMIN')) {
      where.org_id = req.user.org_id;
    }

    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { code: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const departments = await Department.findAll({
      where,
      order: [
        ['org_id', 'ASC'],
        ['name', 'ASC']
      ]
    });

    res.json({
      data: departments
    });
  } catch (error) {
    next(error);
  }
};
