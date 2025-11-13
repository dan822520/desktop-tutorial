import { Router } from 'express';
import * as assetController from '../controllers/assetController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// 所有路由都需要认证
router.use(authenticate);

// 获取资产列表
router.get('/', assetController.getAssets);

// 扫码查询资产
router.get('/scan/:asset_id', assetController.getAssetByScan);

// 获取资产详情
router.get('/:id', assetController.getAssetById);

// 创建资产（需要管理员权限）
router.post(
  '/',
  authorize('SUPER_ADMIN', 'ORG_ADMIN', 'DEPT_ADMIN'),
  assetController.createAsset
);

// 更新资产（需要管理员权限）
router.put(
  '/:id',
  authorize('SUPER_ADMIN', 'ORG_ADMIN', 'DEPT_ADMIN'),
  assetController.updateAsset
);

// 删除资产（标记为报废）
router.delete(
  '/:id',
  authorize('SUPER_ADMIN', 'ORG_ADMIN'),
  assetController.deleteAsset
);

// 批量生成二维码
router.post(
  '/qrcode/batch',
  authorize('SUPER_ADMIN', 'ORG_ADMIN'),
  assetController.batchGenerateQRCode
);

export default router;
