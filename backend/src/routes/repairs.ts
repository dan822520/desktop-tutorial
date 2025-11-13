import { Router } from 'express';
import * as repairController from '../controllers/repairController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// 获取维修工单列表
router.get('/', repairController.getRepairs);

// 创建报修
router.post('/', repairController.createRepair);

// 派单（需要管理员权限）
router.put(
  '/:id/assign',
  authorize('SUPER_ADMIN', 'ORG_ADMIN', 'DEPT_ADMIN'),
  repairController.assignRepair
);

// 完成维修（维修人员或管理员）
router.put(
  '/:id/complete',
  authorize('SUPER_ADMIN', 'ORG_ADMIN', 'DEPT_ADMIN', 'REPAIR_STAFF'),
  repairController.completeRepair
);

export default router;
