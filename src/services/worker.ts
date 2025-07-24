import request from '@/utils/request';

export function getWorkerLifecycle(jobId: string) {
  return request(`/job/worker/lifecycle?jobId=${jobId}`);
}

export type InternalWorkerFilter = {
  uniqueName?: string;
  email?: string;
  status?: string;
  tags?: string[];
  pageSize: number;
  pageIndex: number;
};

export function addInternalWorkers({
  jobId,
  userIds,
}: {
  jobId: string;
  userIds: string[];
}) {
  return request.post('/job/workers-add-internal', {
    params: {
      jobId,
    },
    data: { userIds },
  });
}

export function getInternalWorkers(
  data: InternalWorkerFilter & { projectId: string },
) {
  return request.post('/job/internal-worker-candidates', {
    data,
  });
}

export function getInternalTags(params: { jobId: string }) {
  return request.get('/job/tags', {
    params,
  });
}
