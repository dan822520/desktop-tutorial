import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { User, Role } from '../models';

// 扩展Express Request类型
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        org_id: number;
        department_id?: number;
        roles: string[];
      };
    }
  }
}

// JWT认证中间件
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, jwtConfig.secret) as any;

    // 查询用户信息和角色
    const user = await User.findByPk(decoded.id, {
      include: [{
        model: Role,
        as: 'roles',
        attributes: ['code'],
        through: { attributes: [] }
      }]
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ error: '用户不存在或已停用' });
    }

    // 将用户信息附加到请求对象
    req.user = {
      id: user.id,
      username: user.username,
      org_id: user.org_id,
      department_id: user.department_id || undefined,
      roles: user.get('roles') ? (user.get('roles') as any[]).map((r: any) => r.code) : []
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: '无效的令牌' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: '令牌已过期' });
    }
    next(error);
  }
};

// 角色权限检查中间件
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' });
    }

    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ error: '权限不足' });
    }

    next();
  };
};

// 组织数据隔离中间件（确保用户只能访问自己组织的数据）
export const orgFilter = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: '未认证' });
  }

  // 超级管理员可以访问所有数据
  if (req.user.roles.includes('SUPER_ADMIN')) {
    return next();
  }

  // 其他用户只能访问自己组织的数据
  // 在控制器中需要使用 req.user.org_id 进行过滤
  next();
};
