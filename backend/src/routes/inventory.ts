import { Router } from 'express';
import * as inventoryController from '../controllers/inventoryController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// 获取盘点任务列表
router.get('/tasks', inventoryController.getInventoryTasks);

// 创建盘点任务（需要管理员权限）
router.post(
  '/tasks',
  authorize('SUPER_ADMIN', 'ORG_ADMIN'),
  inventoryController.createInventoryTask
);

// 扫码记录盘点
router.post('/tasks/:task_id/scan', inventoryController.scanAsset);

// 完成盘点任务
router.put(
  '/tasks/:id/finish',
  authorize('SUPER_ADMIN', 'ORG_ADMIN'),
  inventoryController.finishInventoryTask
);

// 获取盘点报告
router.get('/tasks/:id/report', inventoryController.getInventoryReport);

export default router;
