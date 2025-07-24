import request from '@/utils/request';
import type {
  Project,
  AllotDataParam,
  DataListParam,
  ProjectFlowParam,
  ProjectAuditFilter,
  ProjectDataPoolUploadParams,
  ProjectDataConditions,
  BatchSearchCommonParams,
  ProjectDataPoolBatchHistoryResult,
  ProjectDataPoolDataLocationResult,
  GetOriginalDataParams,
  GetOriginalDataResult,
  OriginalFileParams,
  DataUploadListParams,
} from '@/types/project';
import { ProjectAccessLevel } from '@/types/project';
import { HttpStatus } from '@/types/http';
import type { BaseResp } from '@/types/common';
import type { DataType } from '@/types/dataset';
import type { RequestConfig } from '@@/plugin-request/request';
import type { WorkflowDataRecord } from '@/types/v3';
import type { CheckedDataGroup } from '@/hooks/useDataCheck';
import type { DataCheckTarget } from '@/types/v3';
import {
  DataOriState,
  DataState,
} from '@/pages/project/data-center/components/DataList';
import {
  StatisticsTimeGranularity,
  WorkloadFilterParam,
} from '@/pages/project/models/analysis';
import { EDITOR_IMG_UPLOAD_API } from '@/utils';
import _ from 'lodash';

export async function getProjects(query: {
  search?: string;
  projectDisplayId?: string;
}) {
  return request.get<BaseResp<Project[]>>('/project/list', {
    params: {
      ...query,
    },
  });
}

export async function getProject(projectId: string) {
  return request.get<BaseResp<Project>>('/project', {
    params: {
      projectId,
    },
  });
}

export async function createProject(project: Project) {
  return request.put<BaseResp<Project>>('/project', {
    data: project,
  });
}

export async function deleteProject(projectId: string): Promise<any> {
  return request.delete('/project/', {
    params: {
      projectId,
    },
  });
}

export async function getProjectUsers(projectId: string): Promise<any> {
  return request.get('/project/users/list', {
    params: {
      projectId,
    },
  });
}

export async function getAllPMs() {
  return request.get('/user/all-pm');
}

export async function deleteProjectUser(
  projectId: string,
  userUniqueName: string | string[],
): Promise<any> {
  return request.delete('/project/users', {
    params: {
      projectId,
      userNameList: [].concat(userUniqueName),
    },
  });
}

export async function addProjectUser(
  projectId: string,
  userUniqueName: string | string[],
  status: ProjectAccessLevel,
): Promise<any> {
  const names = [].concat(userUniqueName);
  const projectUsers = names.map(name => ({
    projectId,
    status,
    userUniqueName,
  }));

  return request.put('/project/users', {
    data: projectUsers,
    params: {
      projectId,
    },
  });
}

export async function getProjectAccess(projectId: string): Promise<any> {
  return request('/project/user-status', {
    params: {
      projectId,
    },
  });
}

/* ---------------------- Tenant Admin -------------------------- */
export async function getTenantProjectAdmins(query: {
  pageIndex: number;
  pageSize: number;
  search?: string;
  projectDisplayId?: string;
}): Promise<any> {
  return request('/project/admin/list', {
    params: {
      ...query,
    },
  });
}

export async function setProjectAdmin(
  userId: string,
  userUniqueName: string,
  projectId: string,
): Promise<any> {
  return request('/project/admin', {
    method: 'PUT',
    data: {
      projectId,
      userId,
      userUniqueName,
      status: ProjectAccessLevel.ADMIN,
    },
  });
}

export async function getTenantProjects(query: {
  search?: string;
  projectDisplayId?: string;
  customerCode?: string;
  pageIndex?: number;
  pageSize?: number;
}): Promise<any> {
  return request.get('/project/tenant-admin/list', {
    params: {
      ...query,
    },
  });
}

export async function recoverProject(projectId: string) {
  return request.post('/project/recover', {
    params: {
      projectId,
    },
  });
}

export async function getProjectAccessList(
  projectId: string,
  pageIndex: number = 0,
  pageSize: number = 0,
) {
  return request.get('/project/users/list/tenant-admin', {
    params: {
      projectId,
      pageIndex,
      pageSize,
    },
  });
}

export async function setProjectAccess(
  projectId: string,
  userUniqueName: string,
  status: ProjectAccessLevel,
) {
  return request.put('/project/users/tenant-admin', {
    params: {
      projectId,
    },
    data: [
      {
        projectId,
        userUniqueName,
        status,
      },
    ],
  });
}

export async function deleteProjectAccess(projectId: string, name: string) {
  return request.delete('/project/users/tenant-admin', {
    params: {
      projectId,
      userNameList: [name],
    },
  });
}

export function getOriginalData(params: GetOriginalDataParams) {
  return request
    .get<BaseResp<GetOriginalDataResult>>(
      '/project/data-pool/data/batch-list',
      {
        params,
      },
    )
    .then(resp => {
      if (resp.status !== HttpStatus.OK) {
        throw resp;
      }
      return resp;
    });
}

export function uploadCsvData({
  file,
  ...params
}: ProjectDataPoolUploadParams) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('projectId', params.projectId);
  formData.append('dataType', params.dataType);
  return request
    .post('/project/data-pool/data/upload', {
      params,
      data: formData,
    })
    .then(resp => {
      if (resp.status !== HttpStatus.OK) {
        throw resp;
      }
      return resp;
    });
}

export function uploadCsvZipData({
  file,
  ...params
}: {
  projectId: string;
  file: File;
  dataType: DataType;
  poolId?: number;
}) {
  const formData = new FormData();
  formData.append('file', file);
  return request
    .post('/project/data-pool/data/upload/zip', {
      params,
      data: formData,
    })
    .then(resp => {
      if (resp.status !== HttpStatus.OK) {
        throw resp;
      }
      return resp;
    });
}

export function uploadImgData(
  blobInfo: any,
  imageApi: string = EDITOR_IMG_UPLOAD_API,
  data: Record<string, any> = {},
) {
  const formData = new FormData();
  formData.append('file', blobInfo.blob());
  Object.keys(data).forEach(key => {
    formData.append(key, data[key]);
  });
  return request
    .post(imageApi, {
      data: formData,
    })
    .then(resp => {
      if (resp.status !== HttpStatus.OK) {
        throw resp;
      }
      return resp;
    });
}

export function getProjectDataStatistics(
  params: {
    projectId: string;
    batchNum?: number;
    poolId?: string;
  },
  config?: RequestConfig,
) {
  const url = '/project/data-pool/data/statistics';
  return request.get(url, {
    ...config,
    params,
  });
}

export function getProjectDataList(
  { flowId, jobId, batchNum, ...data }: DataListParam,
  config?: RequestConfig,
) {
  const url = '/project/data-pool/data/list';
  return request.post<
    BaseResp<{
      list: WorkflowDataRecord[];
      pageNum: number;
      pageSize: number;
      pages: number;
      total: number;
    }>
  >(url, {
    ...config,
    data,
  });
}

const BasePathDataPool = '/project/data-pool';
// 增加 batchNumName map , key 为 batchNum, value 为 batchName
export function getProjectDataConditions(
  params: { projectId: string },
  // config?: RequestConfig,
) {
  return request.get<BaseResp<ProjectDataConditions>>(
    `${BasePathDataPool}/conditions`,
    {
      // ...config,
      params,
    },
  );
}

export function putProjectDataPoolBatchName(params: BatchSearchCommonParams) {
  return request.put(`${BasePathDataPool}/batch-name`, {
    params,
  });
}
export function checkProjectDataPoolBatchName(
  params: Omit<BatchSearchCommonParams, 'batchNum'>,
) {
  return request.get<BaseResp<boolean>>(
    `${BasePathDataPool}/batch-name-check`,
    {
      params,
    },
  );
}

export function addProjectDataPoolData({
  file,
  ...params
}: ProjectDataPoolUploadParams) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('projectId', params.projectId);
  formData.append('dataType', params.dataType);
  return request.post(`${BasePathDataPool}/data/add`, {
    params,
    data: formData,
  });
}

export function getProjectDataPoolBatchHistory(
  params: Omit<BatchSearchCommonParams, 'batchName'>,
) {
  return request.get<BaseResp<ProjectDataPoolBatchHistoryResult>>(
    `${BasePathDataPool}/batch-history`,
    {
      params,
    },
  );
}

export function getProjectDataPoolDataLocation(
  params: Omit<BatchSearchCommonParams, 'batchName'>,
) {
  return request.get<BaseResp<ProjectDataPoolDataLocationResult>>(
    `${BasePathDataPool}/data-location`,
    {
      params,
    },
  );
}

export type DataAssignCheckResult = {
  inFlow: number[];
  auditingRecords: number[];
  dataTypeAggregation: Record<DataType, number[]>;
};

export function checkRecords(projectId: string, recordIds: number[]) {
  return request.post<BaseResp<DataAssignCheckResult>>(
    '/project/data-pool/data/ids-check',
    {
      data: {
        projectId,
        recordIds,
      },
    },
  );
}

export type ContributorType = {
  email: string;
  id: number;
  name: string;
};

export type ProjectDataDetail = {
  assignedTime: null | string;
  auditState: null | string;
  batchNum: number;
  auditNum: number | null;
  contributor: null | ContributorType;
  dataType: DataType;
  duration: null | number;
  flowId: null | string;
  flowName: null | string;
  id: string;
  jobId: null | string;
  jobName: null | string;
  jobType: null | string;
  poolId: number;
  recordId: number;
  source: Record<string, string>;
  state: DataState;
  oriState: DataOriState;
  timeout: null | number;
  dataOperLogId?: string;
  cycle: number;
};

export function getProjectDataDetail(params: {
  recordId: number;
  projectId: string;
}) {
  const url = '/project/data-pool/data';
  return request.get<BaseResp<ProjectDataDetail>>(url, {
    params,
  });
}

export function allotData(params: AllotDataParam) {
  return request.post('/project/data-pool/data/allot', {
    data: {
      ...params,
      poolId: 1,
    },
  });
}

export function releaseData(data: {
  reAssignedWorkerId: number;
  projectId: string;
  recordIds: number[];
}) {
  return request.post('/project/data-pool/data/release', {
    data,
  });
}

export function getReleaseWorker(data: {
  projectId: string;
  recordIds: number[];
  pageIndex: number;
  pageSize: number;
}) {
  return request.post('/project/data-pool/data/users-qualified-for-release', {
    data,
  });
}

export function getProjectFlowList(
  params: ProjectFlowParam & { projectId: string },
) {
  return request.get('/flow/list', {
    params,
  });
}

export function getProjectBpoList(projectId: string) {
  return request.get('/job/bpo-all', {
    params: { projectId },
  });
}

export function getAllFilteredIds(params: DataListParam) {
  return request.post('/project/data-pool/data/ids', {
    data: params,
  });
}

export function dataCheck(data: {
  projectId: string;
  recordIds: number[];
  dataTarget: DataCheckTarget;
}) {
  return request.post<BaseResp<CheckedDataGroup[]>>(
    '/project/data-pool/data/check-data-type',
    {
      data,
    },
  );
}

export function checkDataJob(data: { projectId: string; recordIds: number[] }) {
  return request.post<BaseResp<boolean>>(
    '/project/data-pool/data/check-data-job',
    {
      data,
    },
  );
}

export function deleteDataRecords(data: {
  projectId: string;
  recordIds: number[];
}) {
  return request.post<BaseResp<number>>('/project/data-pool/data/data/delete', {
    data,
  });
}

export function getProjectOnPremise(params: { projectId: string }) {
  return request.get(`/project/on-premise-settings`, {
    params,
  });
}

export function updateProjectOnPremise(params: {
  projectId: string;
  endpoint: string;
  token: string;
}) {
  return request.post(`/project/on-premise-settings`, {
    params,
  });
}

export function getPMAuditSheetsAllIds(
  data: { projectId: string } & ProjectAuditFilter,
) {
  return request.post<BaseResp<number[]>>('/project/audit-bill/pm/bill-ids', {
    data,
  });
}

export function getAuditSheetsAllIds(
  data: { projectId: string } & ProjectAuditFilter,
) {
  return request.post<BaseResp<number[]>>(
    '/project/audit-bill/auditor/bill-ids',
    {
      data,
    },
  );
}

export function downloadPMAuditSheets(auditBillIdList: number[]) {
  return request.post('/project/audit-bill/pm/bills-download', {
    params: { auditBillIdList },
  });
}

export function downloadAuditSheets(auditBillIdList: number[]) {
  return request.post('/project/audit-bill/auditor/bills-download', {
    params: {
      auditBillIdList,
    },
  });
}

export function downloadPMSingleAuditSheet(auditBillId: number) {
  return request.post('/project/audit-bill/pm/single-bill-download', {
    params: { auditBillId },
  });
}

export function downloadPMRecordStat(auditBillId: number) {
  return request.post('/project/audit-bill/pm/record-stat-download', {
    params: { auditBillId },
  });
}

export function getProjectWorkload(
  jobType: 'label' | 'qa',
  data: WorkloadFilterParam & {
    group: boolean;
    statDimension: StatisticsTimeGranularity;
    dateStart: string;
    dateEnd: string;
    projectId: string;
  },
) {
  return request.post(`/workload/stat/${jobType}`, {
    data,
  });
}

export function downloadAsyncProjectWorkload(
  jobType: 'label' | 'qa',
  data: WorkloadFilterParam & {
    group: boolean;
    statDimension: StatisticsTimeGranularity;
    dateStart: string;
    dateEnd: string;
    projectId: string;
  },
) {
  return request.post(`/workload/stat/async-${jobType}-export`, {
    data,
  });
}

export function getProjectWorkloadCondition(projectId: string) {
  return request.get('/workload/stat/assist-info', {
    params: { projectId },
  });
}

export function getAssignedRecordCount(userId: string) {
  return request.get('/project/data-pool/data/count-assigned-records', {
    params: {
      userId,
    },
  });
}

export function getDataOperationList(data: {
  recordId: string;
  projectId: string;
  pageIndex: number;
  pageSize: number;
}) {
  return request.post('/project/data-pool/data/data-operation-list', {
    data,
  });
}

export function getDataOperationDetail(params: {
  recordId: string;
  projectId: string;
  dataOperLogId: number;
}) {
  return request.get('/project/data-pool/data/data-operation-detail', {
    params,
  });
}

export function getDataLabelResult(data: {
  recordId: string;
  projectId: string;
}) {
  return request.post('/project/data-pool/data/data-label-result', {
    data,
  });
}

export function preUploadOriginaFile(params: OriginalFileParams) {
  return request
    .post('/project/raw-data/pre-upload', {
      params,
    })
    .then(resp => {
      if (resp.status !== HttpStatus.OK) {
        throw resp;
      }
      return resp;
    });
}

export function getFileUploadList(data: DataUploadListParams) {
  return request.post('/project/raw-data/queryList', {
    data,
  });
}

export function uploadOriginalZipData({
  file,
  prjResourceId,
  projectId,
  recordDataType,
  onProgress,
  abortController,
}: {
  projectId: string;
  prjResourceId: number;
  file: File;
  recordDataType: DataType;
  onProgress: (e: ProgressEvent<EventTarget>) => void;
  abortController: AbortController;
}) {
  const formData = new FormData();
  formData.append('file', file);
  return request
    .post('/project/raw-data/upload', {
      params: { projectId, recordDataType, prjResourceId },
      data: formData,
      onReqProgress: onProgress,
      signal: abortController.signal,
    })
    .then(resp => {
      if (resp.status !== HttpStatus.OK) {
        throw resp;
      }
      return resp;
    });
}

export function cancelFileUpload(params: {
  projectId: number;
  prjResourceId: number;
}) {
  return request.post('/project/raw-data/cancel', {
    params,
  });
}
