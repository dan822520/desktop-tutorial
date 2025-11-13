import { Router } from 'express';
import * as transferController from '../controllers/transferController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// 获取调拨列表
router.get('/', transferController.getTransfers);

// 创建调拨申请
router.post('/', transferController.createTransfer);

// 审批调拨（需要管理员权限）
router.put(
  '/:id/approve',
  authorize('SUPER_ADMIN', 'ORG_ADMIN'),
  transferController.approveTransfer
);

export default router;
