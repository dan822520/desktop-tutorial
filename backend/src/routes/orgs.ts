import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getOrgs } from '../controllers/orgController';

const router = Router();

router.use(authenticate);

router.get('/', getOrgs);

export default router;
