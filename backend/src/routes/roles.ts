import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getRoles } from '../controllers/roleController';

const router = Router();

router.use(authenticate);

router.get('/', getRoles);

export default router;
