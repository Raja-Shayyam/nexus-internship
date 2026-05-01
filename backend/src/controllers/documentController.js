import documentService from '../services/documentService.js';
import { sendSuccess, sendError } from '../utils/responses.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { HTTP_STATUS } from '../utils/constants.js';

export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) return sendError(res, 400, 'No file provided');

  const { documentType, description, tags, relatedMeetingId } = req.body;

  const document = await documentService.uploadDocument(req.user.id, req.file, {
    documentType,
    description,
    tags: tags ? JSON.parse(tags) : [],
    relatedMeetingId,
  });

  return sendSuccess(res, HTTP_STATUS.CREATED, 'Document uploaded', document);
});

export const getUserDocuments = asyncHandler(async (req, res) => {
  const documents = await documentService.getUserDocuments(req.user.id);
  return sendSuccess(res, HTTP_STATUS.OK, 'Documents retrieved', documents);
});

export const getDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const document = await documentService.getDocumentById(documentId, req.user.id);
  return sendSuccess(res, HTTP_STATUS.OK, 'Document retrieved', document);
});

export const shareDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const { userId, permission } = req.body;
  const document = await documentService.shareDocument(documentId, req.user.id, {
    userId,
    permission,
  });
  return sendSuccess(res, HTTP_STATUS.OK, 'Document shared', document);
});

export const addESignature = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const { signatureUrl } = req.body;

  if (!signatureUrl) return sendError(res, 400, 'Signature URL is required');

  const document = await documentService.addESignature(documentId, req.user.id, signatureUrl);
  return sendSuccess(res, HTTP_STATUS.OK, 'Signature added', document);
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const result = await documentService.deleteDocument(documentId, req.user.id);
  return sendSuccess(res, HTTP_STATUS.OK, 'Document deleted', result);
});

export const archiveDocument = asyncHandler(async (req, res) => {
  const { documentId } = req.params;
  const document = await documentService.archiveDocument(documentId, req.user.id);
  return sendSuccess(res, HTTP_STATUS.OK, 'Document archived', document);
});