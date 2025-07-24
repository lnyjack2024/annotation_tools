import type { PageQueryParam } from '@/types';
import request from '@/utils/request';
import { JobType } from '@/types/job';

export async function acceptJobs(jobIds: string[]): Promise<void> {
  const url = '/job/worker-confirm';
  return request.put(url, {
    params: { jobIds },
  });
}

export async function rejectJobs(jobIds: string[]): Promise<void> {
  const url = '/job/worker-reject';
  return request.put(url, {
    params: { jobIds },
  });
}

export async function getTaskWorkload(
  jobId: string,
  jobType: JobType,
): Promise<any> {
  const uri =
    jobType === JobType.QA
      ? '/job/summary/workload/qa/get'
      : '/job/summary/workload/label/get';

  return request(uri, {
    params: {
      jobId,
    },
  });
}

export function getWorkerPublicJobs(params: PageQueryParam): Promise<any> {
  return request('/job/worker/public-jobs', {
    params,
  });
}

export function getWorkerJobDetail(jobId: string): Promise<any> {
  return request('/job/worker/job', {
    params: { jobId },
  });
}

export function workerApplyPublicJob(jobId: string): Promise<any> {
  return request.put('/job/worker-apply', {
    params: { jobId },
  });
}

export function workerValidatePin(jobId: string, pin: string): Promise<any> {
  return request.get('/job/pin', {
    params: { jobId, pin },
  });
}

export function getWorkerJobTaskList(query: {
  jobId: string;
  pageIndex?: number;
  pageSize?: number;
}) {
  return request.get(`/job/summary/workload/task-detail/list`, {
    params: query,
  });
}

export function lockWorkerTaskV3(projectId: string, record: number) {
  return request.post('/task/manage/hold-on-records', {
    data: {
      projectId,
      record,
    },
  });
}

export function unlockWorkerTaskV3(projectId: string, record: number) {
  return request.post('/task/manage/release-hold-on-records', {
    data: {
      projectId,
      record,
    },
  });
}
