import type { Workflow } from '@/types/v3';
import request from '@/utils/request';
import type { BaseResp } from '@/types/common';
import type { Page } from '@/types';
import type { Job } from '@/types/job';
import { JobType } from '@/types/job';

export async function getFlowJobs(flowId: string, projectId: string) {
  return request.get<BaseResp<Page<Workflow & { jobs: Job[] }>>>('/flow/list', {
    params: {
      flowId,
      projectId,
    },
  });
}

export async function updateFlow(flow: Workflow) {
  return request.put('/flow', {
    data: flow,
  });
}

export async function deleteFlow(flowId: string) {
  return request.delete('/flow', {
    params: { flowId },
  });
}

export async function createFlowJob(flowJob: Job) {
  return request.post('/job/create', {
    data: flowJob,
  });
}

export async function deleteFlowJob(jobId: string) {
  return request.delete('/job', {
    params: {
      jobId,
    },
  });
}

export function getFlowWorkload(flowId: string) {
  return request.get('/job/workload/flow-workload', {
    params: { flowId },
  });
}

export function getFlowProgress(flowId: string) {
  return request.get('/flow/progress', {
    params: { flowId },
  });
}

export function getFlowJobProgress(
  jobId: string,
  jobType: JobType,
  role: 'pm' | 'bpo' = 'pm',
) {
  const prefix = role === 'bpo' ? '/bpo' : '';
  const url =
    jobType === JobType.LABEL
      ? `/job${prefix}/progress`
      : `/job${prefix}/progress-qa-job`;
  return request.get(url, {
    params: { jobId },
  });
}

export function getFlowJobWorkload(
  jobId: string,
  jobType: JobType,
  role: 'pm' | 'bpo' = 'pm',
) {
  const prefix = role === 'bpo' ? '/bpo' : '';
  const url =
    jobType === JobType.LABEL
      ? `/job/workload${prefix}/label-workload`
      : `/job/workload${prefix}/qa-workload`;
  return request.get(url, {
    params: { jobId },
  });
}

export function getFlowJobHistogram(params: {
  jobId: string;
  histogramType: string;
  jobType: JobType;
  dateStart?: string;
  dateTo?: string;
  role: 'pm' | 'bpo';
}) {
  const { jobType, role, ...resp } = params;
  const prefix = role === 'bpo' ? '/bpo' : '';
  const url =
    jobType === JobType.LABEL
      ? `/job/workload${prefix}/label-histogram`
      : `/job/workload${prefix}/qa-histogram`;
  return request.get(url, {
    params: resp,
  });
}

export function getLabelWorkloadDetails(params: {
  jobId: string;
  workerName?: string;
  pageIndex: number;
  pageSize: number;
  startDate?: string;
  endDate?: string;
  role?: 'pm' | 'bpo';
}) {
  const url =
    params.role === 'bpo'
      ? '/job/workload/bpo/label-details'
      : '/job/workload/label-details';
  return request.get(url, {
    params,
  });
}

export function getQaWorkloadDetails(params: {
  jobId: string;
  workerName?: string;
  pageIndex: number;
  pageSize: number;
  startDate?: string;
  endDate?: string;
  role?: 'pm' | 'bpo';
}) {
  const url =
    params.role === 'bpo'
      ? '/job/workload/bpo/qa-details'
      : '/job/workload/qa-details';
  return request.get(url, {
    params,
  });
}
