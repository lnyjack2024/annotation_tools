import request from '@/utils/request';
import type { BPO } from '@/types/vm';
import type { BaseResp } from '@/types/common';
import { DataState } from '@/pages/project/data-center/components/DataList';
import { DataListParam } from '@/types/project';
import {
  StatisticsTimeGranularity,
  WorkloadFilterParam,
} from '@/pages/project/models/analysis';

export async function getBpoJobs(params: {
  jobDisplayId?: string;
  jobName?: string;
  jobType?: string[];
  status?: string[];
  pageIndex: number;
  pageSize: number;
}) {
  return request.get('/job/bpo/list', {
    params,
  });
}

export function getBpoJobDetail(jobId: string) {
  return request.get('/job/bpo-job-detail', {
    params: {
      jobId,
    },
  });
}

export async function updateBpoJobTimeout(jobId: string, timeout: number) {
  return request.post('/job/bpo/timeout-settings', {
    params: {
      jobId,
      timeout,
    },
  });
}

export async function getAllBPO() {
  return request.get('/um/bpo/pm/bpo-list');
}

export async function addBpoJobWorkers(jobId: string, workerEmails: string[]) {
  return request.post('/job/bpo-workers-add', {
    params: {
      jobId,
    },
    data: workerEmails,
  });
}

export async function getBpoJobWorkers(params: {
  jobId: string;
  email?: string;
  phone?: string;
  uniqueName?: string;
  statusList?: string[];
  pageIndex: number;
  pageSize: number;
}) {
  return request.get('/job/bpo/workers', {
    params,
  });
}

export async function resetBpoJobWorkers(jobId: string, workerIds: string[]) {
  return request.put(`/job/bpo/reset`, {
    params: {
      jobId,
      workerIds,
    },
  });
}

export async function revokeBpoJobWorkers(jobId: string, workerIds: string[]) {
  return request.put(`/job/bpo/revoke`, {
    params: {
      jobId,
      workerIds,
    },
  });
}

export async function getBPODataList(data: {
  cycle: number;
  finished: boolean;
  flowId: string;
  jobId: string;
  pageIndex: number;
  pageSize: number;
  projectId: string;
  state: DataState;
}): Promise<BaseResp<BPO>> {
  return request.post(`/project/data-pool/data/bpo/list`, {
    data,
  });
}

export function getBpoJobWorkload(
  data: WorkloadFilterParam & {
    statDimension: StatisticsTimeGranularity;
    dateStart: string;
    dateEnd: string;
    projectId: string;
    flowIds: number[];
  },
) {
  return request.post(`/bpo-workload/stat/label`, {
    data,
  });
}

export function downloadBpoJobWorkload(
  data: WorkloadFilterParam & {
    statDimension: StatisticsTimeGranularity;
    dateStart: string;
    dateEnd: string;
    projectId: string;
    flowIds: number[];
  },
) {
  return request.post(`/bpo-workload/stat/label-export`, {
    data,
  });
}

export function releaseBPOData(data: {
  reAssignedWorkerId: number;
  projectId: string;
  jobId: string;
  recordIds: number[];
}) {
  return request.post('/project/data-pool/data/bpo/release', {
    data,
  });
}

export function getBPOAllFilteredIds(
  params: DataListParam & { finished: boolean },
) {
  return request.post('/project/data-pool/data/bpo/ids', {
    data: params,
  });
}

export function getBPODataPhases(params: {
  jobId: string;
  projectId: string;
  flowId: string;
  recordId: number;
}) {
  return request.get('/project/data-pool/data/bpo/phases', {
    params,
  });
}
