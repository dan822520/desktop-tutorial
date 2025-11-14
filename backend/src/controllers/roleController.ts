import { Request, Response, NextFunction } from 'express';
import { Role } from '../models';

export const getRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await Role.findAll({
      where: { is_active: true },
      order: [['id', 'ASC']],
      attributes: ['id', 'code', 'name', 'description']
    });

    res.json({ data: roles });
  } catch (error) {
    next(error);
  }
};
