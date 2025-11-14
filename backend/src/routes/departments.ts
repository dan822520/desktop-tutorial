import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getDepartments } from '../controllers/departmentController';

const router = Router();

router.use(authenticate);

router.get('/', getDepartments);

export default router;
