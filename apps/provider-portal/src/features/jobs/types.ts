export interface JobPosting {
  id: string;
  title: string;
  description: string | null;
  type: 'full-time' | 'part-time' | 'freelance';
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  city: string | null;
  country: string | null;
  isActive: boolean;
  expiresAt: string | null;
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication {
  id: string;
  jobPostingId: string;
  applicantName: string;
  phone: string | null;
  email: string | null;
  message: string | null;
  resumeUrl: string | null;
  createdAt: string;
}
