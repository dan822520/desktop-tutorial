import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// 登录
router.post('/login', authController.login);

// 获取当前用户信息（需要认证）
router.get('/profile', authenticate, authController.getProfile);

// 登出
router.post('/logout', authenticate, authController.logout);

export default router;
