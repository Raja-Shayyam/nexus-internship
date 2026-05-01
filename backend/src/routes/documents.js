import { Router } from 'express';
import {
  uploadDocument,
  getUserDocuments,
  getDocument,
  shareDocument,
  addESignature,
  deleteDocument,
  archiveDocument,
} from '../controllers/documentController.js';
import { uploadMiddleware } from '../services/documentService.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.post('/upload', uploadMiddleware.single('file'), uploadDocument);
router.get('/', getUserDocuments);
router.get('/:documentId', getDocument);
router.patch('/:documentId/share', shareDocument);
router.patch('/:documentId/sign', addESignature);
router.patch('/:documentId/archive', archiveDocument);
router.delete('/:documentId', deleteDocument);

export default router;