import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { createUser, getUsers, updateUser } from '../controllers/userController';

const router = Router();

router.use(authenticate);

router.get('/', authorize('SUPER_ADMIN', 'ORG_ADMIN'), getUsers);
router.post('/', authorize('SUPER_ADMIN', 'ORG_ADMIN'), createUser);
router.put('/:id', authorize('SUPER_ADMIN', 'ORG_ADMIN'), updateUser);

export default router;
