import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import Document from '../models/Document.js';
import { User } from '../models/User.js';
import { NotFoundError, ValidationError, AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';

// Multer storage configuration
export const documentStorage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: 'nexus-documents',
    resource_type: 'auto',
    allowed_formats: [
      'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png',
    ],
  },
});

export const uploadMiddleware = multer({
  storage: documentStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png/;
    if (!allowedTypes.test(file.mimetype)) {
      cb(new ValidationError('Invalid file type'), false);
    } else {
      cb(null, true);
    }
  },
});

class DocumentService {
  async uploadDocument(uploadedBy, file, metadata) {
    const user = await User.findById(uploadedBy);
    if (!user) throw new NotFoundError('User');

    const document = new Document({
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      cloudinaryUrl: file.path,
      cloudinaryPublicId: file.filename,
      uploadedBy,
      ...metadata,
    });

    await document.save();
    await document.populate('uploadedBy');
    logger.info(`Document uploaded: ${document._id}`);
    return document;
  }

  async getUserDocuments(userId) {
    const documents = await Document.find({
      $or: [{ uploadedBy: userId }, { 'sharedWith.userId': userId }],
    })
      .populate('uploadedBy')
      .sort({ createdAt: -1 });
    return documents;
  }

  async getDocumentById(documentId, userId) {
    const document = await Document.findById(documentId).populate([
      'uploadedBy',
      'sharedWith.userId',
    ]);
    if (!document) throw new NotFoundError('Document');

    const hasAccess =
      document.uploadedBy._id.toString() === userId ||
      document.sharedWith.some((s) => s.userId._id.toString() === userId);

    if (!hasAccess) throw new AppError(403, 'Access denied to this document');
    return document;
  }

  async shareDocument(documentId, ownerId, shareData) {
    const document = await Document.findById(documentId);
    if (!document) throw new NotFoundError('Document');

    if (document.uploadedBy.toString() !== ownerId) {
      throw new AppError(403, 'Only owner can share this document');
    }

    const alreadyShared = document.sharedWith.some(
      (s) => s.userId.toString() === shareData.userId
    );
    if (alreadyShared) throw new ValidationError('Document already shared with this user');

    document.sharedWith.push({
      userId: shareData.userId,
      permission: shareData.permission,
      sharedAt: new Date(),
    });

    document.status = 'shared';
    await document.save();
    await document.populate('sharedWith.userId');
    logger.info(`Document shared: ${documentId}`);
    return document;
  }

  async addESignature(documentId, userId, signatureUrl) {
    const document = await Document.findById(documentId);
    if (!document) throw new NotFoundError('Document');

    const hasAccess =
      document.uploadedBy.toString() === userId ||
      document.sharedWith.some((s) => s.userId.toString() === userId);
    if (!hasAccess) throw new AppError(403, 'Access denied');

    document.eSignature = {
      signedBy: userId,
      signatureUrl,
      signedAt: new Date(),
    };

    document.status = 'signed';
    await document.save();
    await document.populate('eSignature.signedBy');
    logger.info(`Document signed: ${documentId}`);
    return document;
  }

  async deleteDocument(documentId, userId) {
    const document = await Document.findById(documentId);
    if (!document) throw new NotFoundError('Document');

    if (document.uploadedBy.toString() !== userId) {
      throw new AppError(403, 'Only owner can delete this document');
    }

    await cloudinary.v2.uploader.destroy(document.cloudinaryPublicId);
    await Document.findByIdAndDelete(documentId);
    logger.info(`Document deleted: ${documentId}`);
    return { message: 'Document deleted' };
  }

  async archiveDocument(documentId, userId) {
    const document = await Document.findById(documentId);
    if (!document) throw new NotFoundError('Document');

    if (document.uploadedBy.toString() !== userId) {
      throw new AppError(403, 'Only owner can archive this document');
    }

    document.status = 'archived';
    await document.save();
    logger.info(`Document archived: ${documentId}`);
    return document;
  }
}

export default new DocumentService();