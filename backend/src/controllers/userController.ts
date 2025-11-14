import { Request, Response, NextFunction } from 'express';
import { Op, FindOptions } from 'sequelize';
import { AppError } from '../middleware/errorHandler';
import { User, Org, Department, Role } from '../models';

const userIncludeOptions = (): Omit<FindOptions, 'where'> => ({
  attributes: { exclude: ['password_hash'] },
  include: [
    { model: Org, as: 'org', attributes: ['id', 'name', 'code'] },
    { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
    { model: Role, as: 'roles', attributes: ['id', 'code', 'name'], through: { attributes: [] } }
  ]
});

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { org_id, department_id, keyword, include_inactive } = req.query;

    const where: any = {};

    if (!include_inactive || include_inactive === 'false') {
      where.is_active = true;
    }

    if (req.user && !req.user.roles.includes('SUPER_ADMIN')) {
      where.org_id = req.user.org_id;
    } else if (org_id) {
      where.org_id = Number(org_id);
    }

    if (department_id) {
      where.department_id = Number(department_id);
    }

    if (keyword) {
      where[Op.or] = [
        { username: { [Op.like]: `%${keyword}%` } },
        { real_name: { [Op.like]: `%${keyword}%` } },
        { phone: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const users = await User.findAll({
      ...userIncludeOptions(),
      where,
      order: [['created_at', 'DESC']]
    });

    res.json({ data: users });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      username,
      real_name,
      phone,
      email,
      password,
      org_id,
      department_id,
      is_active = true,
      role_codes
    } = req.body;

    if (!username || !real_name || !password || !org_id) {
      throw new AppError('用户名、姓名、密码和组织不能为空', 400);
    }

    if (typeof password !== 'string' || password.length < 6) {
      throw new AppError('密码长度至少6位', 400);
    }

    if (req.user && !req.user.roles.includes('SUPER_ADMIN') && req.user.org_id !== Number(org_id)) {
      throw new AppError('无权在其他组织创建用户', 403);
    }

    const existing = await User.findOne({ where: { username } });
    if (existing) {
      throw new AppError('用户名已存在', 409);
    }

    if (department_id) {
      const department = await Department.findByPk(Number(department_id));
      if (!department) {
        throw new AppError('部门不存在', 404);
      }
      if (department.org_id !== Number(org_id)) {
        throw new AppError('部门不属于指定的组织', 400);
      }
    }

    const user = User.build({
      username,
      real_name,
      phone,
      email,
      org_id: Number(org_id),
      department_id: department_id ? Number(department_id) : null,
      is_active: Boolean(is_active)
    });

    await user.setPassword(password);
    await user.save();

    if (Array.isArray(role_codes) && role_codes.length > 0) {
      await assignRolesInternal(req.user, user, role_codes);
    }

    const created = await User.findByPk(user.id, userIncludeOptions());

    res.status(201).json({
      message: '用户创建成功',
      data: created
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      real_name,
      phone,
      email,
      password,
      department_id,
      is_active,
      role_codes
    } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    if (req.user && !req.user.roles.includes('SUPER_ADMIN') && req.user.org_id !== user.org_id) {
      throw new AppError('无权修改其他组织的用户', 403);
    }

    if (department_id !== undefined) {
      if (department_id === null) {
        user.department_id = null;
      } else {
        const department = await Department.findByPk(Number(department_id));
        if (!department) {
          throw new AppError('部门不存在', 404);
        }
        if (department.org_id !== user.org_id) {
          throw new AppError('部门不属于当前用户所在组织', 400);
        }
        user.department_id = Number(department_id);
      }
    }

    if (real_name !== undefined) user.real_name = real_name;
    if (phone !== undefined) user.phone = phone;
    if (email !== undefined) user.email = email;
    if (is_active !== undefined) user.is_active = Boolean(is_active);

    if (password) {
      if (typeof password !== 'string' || password.length < 6) {
        throw new AppError('密码长度至少6位', 400);
      }
      await user.setPassword(password);
    }

    await user.save();

    if (Array.isArray(role_codes)) {
      await assignRolesInternal(req.user, user, role_codes);
    }

    const updated = await User.findByPk(user.id, userIncludeOptions());

    res.json({
      message: '用户信息已更新',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

export const assignRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id, role_codes } = req.body as { user_id?: number; role_codes?: string[] };

    if (!user_id || !Array.isArray(role_codes)) {
      throw new AppError('请提供用户ID和角色编码列表', 400);
    }

    const user = await User.findByPk(user_id);
    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    if (req.user && !req.user.roles.includes('SUPER_ADMIN') && req.user.org_id !== user.org_id) {
      throw new AppError('无权修改其他组织的用户角色', 403);
    }

    await assignRolesInternal(req.user, user, role_codes);

    const updated = await User.findByPk(user.id, userIncludeOptions());

    res.json({
      message: '角色已更新',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

async function assignRolesInternal(
  operator: Request['user'] | undefined,
  user: User,
  roleCodes: string[]
) {
  if (!Array.isArray(roleCodes)) {
    return;
  }

  if (roleCodes.includes('SUPER_ADMIN') && (!operator || !operator.roles.includes('SUPER_ADMIN'))) {
    throw new AppError('仅超级管理员可以分配超级管理员角色', 403);
  }

  const roles = await Role.findAll({ where: { code: { [Op.in]: roleCodes } } });

  if (roles.length !== roleCodes.length) {
    throw new AppError('存在无效的角色编码', 400);
  }

  await (user as any).setRoles(roles);
}
