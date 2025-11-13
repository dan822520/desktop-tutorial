import { Request, Response, NextFunction } from 'express';

// 自定义错误类
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 全局错误处理中间件
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      status: err.statusCode
    });
  }

  // 处理Sequelize验证错误
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: '数据验证失败',
      details: (err as any).errors.map((e: any) => e.message)
    });
  }

  // 处理Sequelize唯一约束错误
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      error: '数据已存在',
      details: (err as any).errors.map((e: any) => e.message)
    });
  }

  // 未知错误
  console.error('未处理的错误:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误'
  });
};

// 404处理中间件
export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    error: `路由 ${req.originalUrl} 未找到`
  });
};
