import request from '@/utils/request';
import type { WorkerJobStatus } from '@/types/task';
import type { JobStatus } from '@/types/job';
import { HttpStatus } from '@/types/http';

export type WorkerJobQuery = {
  pageIndex: number;
  pageSize: number;
  sortBy?: 'CREATED_TIME' | 'CONFIRM_TIME';
  jobStatusList?: JobStatus[];
  statusList?: WorkerJobStatus[];
  jobName?: string;
};

export async function getWorkerJobs(query: WorkerJobQuery) {
  return request.get('/job/worker-jobs', {
    params: {
      ...query,
    },
  });
}

export async function getAssignedJobsNum() {
  return request.get('/job/worker-assigned-jobs-num').then(resp => {
    if (resp.status === HttpStatus.OK) {
      return resp.data;
    }
    return 0;
  });
}
