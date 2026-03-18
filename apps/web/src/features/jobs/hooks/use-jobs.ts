import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ApiResponse, ApiPagedResponse } from '@/lib/types';

export interface PublicJob {
  id: string;
  title: string;
  description: string;
  type: 'full-time' | 'part-time' | 'freelance';
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  city: string | null;
  country: string | null;
  expiresAt: string | null;
  createdAt: string;
  provider: {
    id: string;
    name: string;
    slug: string;
    city: string;
    country: string;
    coverPhoto: string | null;
    verified: boolean;
  };
}

export interface JobDetail extends PublicJob {
  provider: PublicJob['provider'] & {
    whatsapp: string;
    phone: string;
    email: string;
  };
}

export function usePublicJobs(params?: {
  country?: string;
  city?: string;
  type?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ['public-jobs', params],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      if (params?.country) queryParams.set('country', params.country);
      if (params?.city) queryParams.set('city', params.city);
      if (params?.type) queryParams.set('type', params.type);
      if (params?.search) queryParams.set('search', params.search);
      if (params?.page) queryParams.set('page', String(params.page));
      if (params?.pageSize) queryParams.set('pageSize', String(params.pageSize));
      const response = await api.get<ApiPagedResponse<PublicJob>>(`/jobs?${queryParams}`);
      return response.data;
    },
  });
}

export function useLatestJobs() {
  return useQuery({
    queryKey: ['latest-jobs'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PublicJob[]>>('/jobs/latest');
      return response.data.data;
    },
  });
}

export function useProviderJobs(providerProfileId: string | undefined) {
  return useQuery({
    queryKey: ['provider-jobs-public', providerProfileId],
    queryFn: async () => {
      const response = await api.get<ApiPagedResponse<PublicJob>>(`/jobs/provider/${providerProfileId}`);
      return response.data;
    },
    enabled: !!providerProfileId,
  });
}

export function useJobDetail(jobId: string | undefined) {
  return useQuery({
    queryKey: ['job-detail', jobId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<JobDetail>>(`/jobs/${jobId}`);
      return response.data.data;
    },
    enabled: !!jobId,
  });
}

export function useApplyToJobMutation() {
  return useMutation({
    mutationFn: async ({ jobId, ...data }: {
      jobId: string;
      applicantName: string;
      phone?: string;
      email?: string;
      message?: string;
      resumeUrl?: string;
    }) => {
      const response = await api.post<ApiResponse<unknown>>(`/jobs/${jobId}/apply`, data);
      return response.data.data;
    },
  });
}
