export const COLLABORATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
};

export const DEAL_STATUS = {
  NEGOTIATION: 'negotiation',
  TERM_SHEET: 'term_sheet',
  FUNDED: 'funded',
  FAILED: 'failed',
  CLOSED: 'closed',
};

export const USER_TYPES = {
  ENTREPRENEUR: 'entrepreneur',
  INVESTOR: 'investor',
};

export const NOTIFICATION_TYPES = {
  MESSAGE: 'message',
  COLLABORATION_REQUEST: 'collaboration_request',
  DEAL_UPDATE: 'deal_update',
  DOCUMENT_SHARED: 'document_shared',
};

export default {
  COLLABORATION_STATUS,
  DEAL_STATUS,
  USER_TYPES,
  NOTIFICATION_TYPES,
};
