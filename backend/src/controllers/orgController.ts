import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { Org } from '../models';

/**
 * 获取组织（分公司）列表。
 * - 超级管理员可以查看所有组织。
 * - 其他角色仅能查看自身所属组织及其下属组织。
 */
export const getOrgs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { include_inactive } = req.query;

    const where: any = {};

    if (!include_inactive || include_inactive === 'false') {
      where.is_active = true;
    }

    if (req.user && !req.user.roles.includes('SUPER_ADMIN')) {
      const orgId = req.user.org_id;
      where[Op.or] = [{ id: orgId }, { parent_id: orgId }];
    }

    const orgs = await Org.findAll({
      where,
      order: [
        ['parent_id', 'ASC'],
        ['id', 'ASC']
      ]
    });

    res.json({
      data: orgs
    });
  } catch (error) {
    next(error);
  }
};
