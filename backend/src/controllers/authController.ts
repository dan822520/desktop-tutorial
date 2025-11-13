import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, Role, Org, Department } from '../models';
import { jwtConfig } from '../config/jwt';
import { AppError } from '../middleware/errorHandler';

// 用户登录
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new AppError('用户名和密码不能为空', 400);
    }

    // 查询用户
    const user = await User.findOne({
      where: { username },
      include: [
        {
          model: Role,
          as: 'roles',
          attributes: ['id', 'code', 'name'],
          through: { attributes: [] }
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
        }
      ]
    });

    if (!user) {
      throw new AppError('用户名或密码错误', 401);
    }

    if (!user.is_active) {
      throw new AppError('账号已被停用', 403);
    }

    // 验证密码
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new AppError('用户名或密码错误', 401);
    }

    // 生成JWT token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        org_id: user.org_id
      },
      jwtConfig.secret,
      jwtConfig.signOptions
    );

    // 更新最后登录时间
    await user.update({ last_login_at: new Date() });

    res.json({
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          real_name: user.real_name,
          phone: user.phone,
          email: user.email,
          org: user.get('org'),
          department: user.get('department'),
          roles: user.get('roles')
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 获取当前用户信息
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError('未认证', 401);
    }

    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [
        {
          model: Role,
          as: 'roles',
          attributes: ['id', 'code', 'name'],
          through: { attributes: [] }
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
        }
      ]
    });

    if (!user) {
      throw new AppError('用户不存在', 404);
    }

    res.json({
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// 用户登出（可选，主要用于记录日志）
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // JWT是无状态的，登出主要在客户端删除token
    // 这里可以记录登出日志
    res.json({
      message: '登出成功'
    });
  } catch (error) {
    next(error);
  }
};
