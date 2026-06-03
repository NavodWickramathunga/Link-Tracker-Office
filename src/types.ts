export type CampaignSource = 'Meta' | 'Google' | 'SMS' | 'Email' | 'TikTok' | 'Other';

export type BusinessUnit = 'Marketing' | 'Sales' | 'Product' | 'Retail' | 'Finance' | 'Customer Support' | 'HR';

export interface LinkRequest {
  id: string;
  campaignName: string;
  targetUrl: string;
  source: CampaignSource;
  businessUnit: BusinessUnit;
  medium: string;
  campaignTerm?: string;
  campaignContent?: string;
  specialRequirements?: string;
  status: 'Pending' | 'Completed' | 'Rejected';
  requestedBy: string;
  requestedEmail: string;
  requestedAt: string;
  resolvedAt?: string;
  createdLink?: string;
  createdLongLink?: string;
  createdShortLink?: string;
  replyMessage?: string;
  launchDate?: string;
  expiryDate?: string;
  urgency?: 'Standard' | 'Urgent' | 'Critical';
  requesterPhone?: string;
}

export interface UserNotification {
  id: string;
  requestId: string;
  campaignName: string;
  recipientEmail: string;
  type: 'info' | 'completed' | 'rejected' | 'reply' | 'reminder' | 'admin_action';
  message: string;
  isRead: boolean;
  createdAt: string;
}
