import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { assignRoles } from '../controllers/userController';

const router = Router();

router.use(authenticate);

router.post('/', authorize('SUPER_ADMIN', 'ORG_ADMIN'), assignRoles);

export default router;
