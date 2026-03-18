export interface VerificationRequest {
  id: string;
  providerProfileId: string;
  status: 'pending' | 'approved' | 'rejected';
  tradeLicenseUrl: string | null;
  documentUrls: string[];
  notes: string | null;
  adminNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  providerProfile: {
    id: string;
    tenant: {
      id: string;
      name: string;
      slug: string;
    };
  };
}

export interface ReviewVerificationInput {
  status: 'approved' | 'rejected';
  adminNotes?: string;
}
