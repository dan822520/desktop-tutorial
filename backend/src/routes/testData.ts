import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { clearTestData, getTestDataStatus, loadTestData } from '../controllers/testDataController';

const router = Router();

router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN', 'ORG_ADMIN'), getTestDataStatus);
router.post('/', authorize('SUPER_ADMIN'), loadTestData);
router.delete('/', authorize('SUPER_ADMIN'), clearTestData);

export default router;
