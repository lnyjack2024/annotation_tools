import request from '@/utils/request';
import type {
  Job,
  JobAction,
  JobStatus,
  UpdateWorkerSampleParam,
} from '@/types/job';
import { HttpStatus } from '@/types/http';
import type { Page, PageQueryParam } from '@/types';
import type { BaseResp } from '@/types/common';
import type { WorkerQueryParam } from '@/types';
import type {
  LabelingWorker,
  LabelWorkerListByQaParam,
  LabelWorkerListByQaResult,
} from '@/types/workflow';
import { getMashupAPIPrefix } from '@/utils';
import { AvailableTargetJobsResult } from '@/types/project';

export async function getJob(jobId: string): Promise<BaseResp<Job>> {
  return request.get('/job', {
    params: {
      jobId,
    },
  });
}

export async function getJobStatus(jobId: string): Promise<JobStatus | null> {
  return request
    .get('/job/status', {
      params: { jobId },
    })
    .then(resp => (resp.status === HttpStatus.OK ? resp.data : null))
    .catch(() => null);
}

export async function executeJobAction(
  jobId: string,
  jobAction: JobAction,
): Promise<Job> {
  return request.post(`/job/${jobAction}`, {
    params: { jobId },
  });
}

export async function updateJobBpo(
  jobId: string,
  bpoId: string,
  bpoName: string,
) {
  return request.put('/job/change-bpo', {
    params: {
      jobId,
      bpoId,
      bpoName,
    },
  });
}

/* ***************************************************************************** */

export function resetWorkers(jobId: string, workerIds: string[]): Promise<any> {
  return request.put('/job/pm/reset', {
    params: { jobId, workerIds },
  });
}

export function revokeWorkers(
  jobId: string,
  workerIds: string[],
): Promise<any> {
  return request.put('/job/pm/revoke', {
    params: { jobId, workerIds },
  });
}

/* ************************ for tenant admin ***************************************** */
export function getProjectJobs(projectId: string): Promise<any> {
  return request.get(`/job/list-all`, {
    params: {
      projectId,
    },
  });
}

export function detainWorker(workerIds: string[], labelJobId: string) {
  return request.put('/job/pm/detain', {
    params: {
      workerIds,
      jobId: labelJobId,
    },
  });
}

export function unDetainWorker(workerIds: string[], labelJobId: string) {
  return request.put('/job/pm/un-detain', {
    params: {
      workerIds,
      jobId: labelJobId,
    },
  });
}

export function getWorkersSample(
  jobId: string,
  pageIndex: number,
  pageSize: number,
  filter: Record<string, any> = {},
) {
  return request.get('/job/worker-sample/all', {
    params: {
      qaJobId: jobId,
      pageIndex,
      pageSize,
      ...filter,
    },
  });
}

export function updateWorkerSample(data: UpdateWorkerSampleParam[]) {
  return request.put(`/job/worker-sample`, {
    data,
  });
}

export function updateQaOverallSample(
  jobId: string,
  overallSampleRate: number,
) {
  return request.post(`/job/worker-sample/overall-sample-rate-settings`, {
    params: {
      jobId,
      overallSampleRate,
    },
  });
}

export function updateQaGlobalSample(
  jobId: string,
  overallSampleRate: number,
  sampleSwitch: boolean,
) {
  const params = {
    jobId,
    overallSampleRate,
    sampleSwitch,
  };
  if (!sampleSwitch) {
    delete params.overallSampleRate;
  }
  return request.post(`/job/worker-sample/global-sample-switch`, {
    params,
  });
}

export function getRecords(
  jobId: string,
  batchIds: number[],
  startDate: string,
  endDate: string,
  pageQuery: PageQueryParam,
) {
  return request.get('/project/audit-bill/pm/records', {
    params: { jobId, batchIds, startDate, endDate, ...pageQuery },
  });
}

export function getJobWorkersV3(
  params: WorkerQueryParam & { jobId: string },
): Promise<any> {
  const { jobId, pageIndex, pageSize, ...restProps } = params;

  return request.get(`/job/pm/workers`, {
    params: {
      jobId,
      pageIndex,
      pageSize,
      condition: JSON.stringify(restProps),
    },
  });
}

export function getJobV3(jobId: string): Promise<any> {
  return request.get<BaseResp<Job>>(`/job`, {
    params: {
      jobId,
    },
  });
}

export function updateJobV3(job: Job): Promise<any> {
  return request.put(`/job`, {
    data: job,
  });
}

export function activateJobFlow(jobId: string) {
  return request.get('/compensations/new-job', {
    params: {
      jobId,
    },
  });
}

export function getLabelWorkerList(
  params: WorkerQueryParam & { qaJobId: string },
): Promise<any> {
  return request.get<BaseResp<Page<LabelingWorker>>>(
    `/job/label-qa-mapping/list`,
    {
      params,
    },
  );
}

export function getLabelWorkerListByQaJob(params: LabelWorkerListByQaParam) {
  return request.get<BaseResp<LabelWorkerListByQaResult>>(
    `/job/label-qa-mapping/list-by-qa-job`,
    {
      params,
    },
  );
}

export function getJobWorkerNum(jobId: string): Promise<any> {
  return request.get(`/job/workers-total-num`, {
    params: {
      jobId,
    },
  });
}

export function getTargetJobs(qaJobId: string) {
  return request.get<BaseResp<AvailableTargetJobsResult>>(
    `/job/label-qa-mapping/available-target-jobs`,
    {
      params: {
        qaJobId,
      },
    },
  );
}

export function clearConditionCheck(qaJobId: string): Promise<any> {
  return request.get(`/job/label-qa-mapping/clear-condition-check`, {
    params: {
      qaJobId,
    },
  });
}

export function clearOrientationWorkers(qaJobId: string): Promise<any> {
  return request.delete(`/job/label-qa-mapping/clear`, {
    params: {
      qaJobId,
    },
  });
}

export function uploadWorkerBatchData({
  file,
  ...params
}: {
  file: File;
  qaJobId: string;
  targetJobId: string;
}) {
  const formData = new FormData();
  formData.append('file', file);
  return request.post('/job/label-qa-mapping/upload', {
    params,
    data: formData,
  });
}

export function upsertWorkerBatchData({
  isPublic = false,
  ...data
}: {
  qaJobId: string;
  qaTargetJobId: string;
  ruleLines: string[][];
  isPublic?: boolean;
}) {
  // platform post
  return request.put('/job/label-qa-mapping/upsert-batch-rule', {
    params: {
      isPublic,
    },
    data,
  });
}
