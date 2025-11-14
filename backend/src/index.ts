import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

// 配置环境变量
dotenv.config();

// 导入数据库连接
import sequelize, { testConnection } from './config/database';

// 导入中间件
import { errorHandler, notFound } from './middleware/errorHandler';

// 导入路由
import authRoutes from './routes/auth';
import assetRoutes from './routes/assets';
import transferRoutes from './routes/transfers';
import repairRoutes from './routes/repairs';
import inventoryRoutes from './routes/inventory';
import testDataRoutes from './routes/testData';
import orgRoutes from './routes/orgs';
import departmentRoutes from './routes/departments';
import roleRoutes from './routes/roles';
import userRoutes from './routes/users';
import userRoleRoutes from './routes/userRoles';

// 导入模型（确保关联关系被加载）
import './models';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// 基础中间件
app.use(helmet()); // 安全headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(compression()); // 响应压缩
app.use(morgan('dev')); // 日志
app.use(express.json()); // 解析JSON
app.use(express.urlencoded({ extended: true })); // 解析URL编码

// 静态文件服务（用于二维码图片等）
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制100次请求
  message: '请求过于频繁，请稍后再试'
});
app.use('/api/', limiter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/transfers', transferRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/test-data', testDataRoutes);
app.use('/api/orgs', orgRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user-roles', userRoleRoutes);

// 404处理
app.use(notFound);

// 错误处理
app.use(errorHandler);

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    await testConnection();

    // 同步数据库（开发环境）
    if (process.env.NODE_ENV === 'development') {
      // 注意：alter: true 会尝试修改表结构而不删除数据
      // 生产环境应该使用迁移工具
      await sequelize.sync({ alter: false });
      console.log('✅ 数据库同步完成');
    }

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 服务器运行在 http://localhost:${PORT}`);
      console.log(`📝 环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API文档: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到SIGTERM信号，开始优雅关闭...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('收到SIGINT信号，开始优雅关闭...');
  await sequelize.close();
  process.exit(0);
});

// 启动
startServer();

export default app;
