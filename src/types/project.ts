import type { BaseResp, PageQuery } from '@/types/common';
import type { Job } from '@/types/job';
import { AuditSheetStatus } from './dataAudit';
import { DataType, SourceFile } from './dataset';
import type { Page } from '@/types/index';

export enum ProjectActiveStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum ProjectAccessLevel {
  VIEW = 'VIEW',
  UPDATE = 'UPDATE',
  ADMIN = 'ADMIN',
}

export type Project = {
  id: string;
  projectDisplayId: string;
  name: string;
  projectOwner: string;
  description: string;
  tag: string | null;
  version: number;
  activeStatus: ProjectActiveStatus;
  createdTime: string;
};

export type ProjectUser = {
  id: string;
  projectId: string;
  userId: string;
  userUniqueName: string;
  status: ProjectAccessLevel;
  version: number;
};

export type TenantPM = {
  activeStatus: 'ACTIVE' | 'INACTIVE';
  createdTime: string;
  id: string;
  type: string;
  uniqueName: string;
  updatedTime: string;
};

export interface ProjectFlowParam extends PageQuery {
  flowDisplayId?: string;
  flowName?: string;
  flowId?: string;
  jobName?: string;
  jobId?: string;
  bpoId?: string;
  flowStatus?: FlowStatus;
  jobTeamType?: string;
  projectId: string;
  ignoreDataCollectFlowFlag?: boolean;
}

export interface DataListParam extends PageQuery {
  auditState?: string[];
  dataType?: string;
  batchNum?: string;
  flowId?: string;
  jobId?: string;
  poolId?: number;
  projectId: string;
  state?: string[];
  recordIds: string[];
  cycle?: number;
}

export interface Workflow {
  id: string;
  flowName: string;
  flowDisplayId: string;
  createdTime: string;
  activeStatus: string;
  status: FlowStatus;
  totalNum: number;
  jobs: Job[];
  testFlag: boolean;
}

export enum FlowStatus {
  RUNNING = 'RUNNING',
  FINISHED = 'FINISHED',
}

export interface AllotDataParam {
  allotList: {
    flowId: string;
    recordNum: number;
  }[];
  projectId: string;
  recordIds: number[];
}

export type ProjectAuditFilter = {
  pageIndex: number;
  pageSize: number;
  auditStatus: AuditSheetStatus | 'all';
  startDate?: string;
  endDate?: string;
  displayName?: string;
  projectDisplayId?: string;
  auditNum?: string;
};

export enum DataRecordDetailTab {
  RECORD_FLOW = 'RECORD_FLOW',
  ANNOTATION_RESULT = 'ANNOTATION_RESULT',
}

export enum DataOperationType {
  alloct = 'alloct',
  lock = 'lock',
  unlock = 'unlock',
  turnback = 'turnback',
  release_pool = 'release_pool',
  release_assigned = 'release_assigned',
  bporelease_pool = 'bporelease_pool',
  bporelease_assigned = 'bporelease_assigned',
  delete = 'delete',
  labelacquire = 'labelacquire',
  labelsubmit = 'labelsubmit',
  reworkacquire = 'reworkacquire',
  reworksubmit = 'reworksubmit',
  qaacquire = 'qaacquire',
  qasubmit = 'qasubmit',
  qamodifiedacquire = 'qamodifiedacquire',
  qamodifiedsubmit = 'qamodifiedsubmit',
  qarejected = 'qarejected',
  qamodifiedrejected = 'qamodifiedrejected',
  unsampled = 'unsampled',
  submitaudit = 'submitaudit',
  auditpassed = 'auditpassed',
  auditrejected = 'auditrejected',
  cancelaudit = 'cancelaudit',
  resubmit = 'resubmit',
  resubmitaudit = 'resubmitaudit',
}

export type ProjectFlowData = {
  flowId: string;
  flowName: string;
  jobs: Record<string, string>;
};

export interface AuditData {
  activeStatus: string;
  auditNum: number;
  auditStatus: string;
  auditorIds: any[];
  completeTime: string;
  dataRecordIds: any[];
  displayName: string;
  endDate: string;
  excludeAborted: boolean;
  forAuditor: boolean;
  granularity: string;
  id: number;
  pageIndex: number;
  pageSize: number;
  projectDisplayId: string;
  projectId: number;
  recordNum: number;
  startDate: string;
  statistics: string;
  statisticsDimension: Record<string, string>;
  submitTime: string;
  templateId: number;
  version: number;
}

export type ProjectDataConditions = {
  auditData: AuditData[];
  batchNums: number[];
  batchNumName: Record<string, string>;
  flowDatas: ProjectFlowData[];
};
export type BatchSearchCommonParams = {
  projectId: string;
  batchNum: number;
  batchName: string;
};
export type ProjectDataPoolBatchHistoryResult =
  ProjectDataPoolBatchHistoryResultItem[];
export interface ProjectDataPoolBatchHistoryResultItem {
  fileName: string;
  operator: string;
  rangeNote: string;
  uploadTime: string;
}
export type ProjectDataPoolDataLocationResult =
  ProjectDataPoolDataLocationResultItem[];
export interface ProjectDataPoolDataLocationResultItem {
  count: number;
  flowId: number;
  flowName: string;
}

export type ProjectDataPoolUploadParams = {
  projectId: string;
  file: File;
  dataType: DataType;
  batchName: string;
  batchNum?: number;
};

export type AvailableTargetJobsResult = AvailableTargetJobsResultItem[];

export type AvailableTargetJobsResultItem = {
  isConfiguredRule: boolean;
  isViewer: boolean;
  jobId: string;
  jobName: string;
};

export interface GetOriginalDataParams extends Partial<PageQuery> {
  projectId?: string;
  poolId?: string;
}

export type GetOriginalDataResult = {
  results: SourceFile[];
  totalElements: number;
};

export enum OriginalFileUploadStatus {
  RAW_DATA_UPLOADING = 'RAW_DATA_UPLOADING',
  RAW_DATA_UPLOAD_FAILED = 'RAW_DATA_UPLOAD_FAILED',
  RAW_DATA_UPLOADED = 'RAW_DATA_UPLOADED',
  URL_DATA_GENERATING = 'URL_DATA_GENERATING',
  URL_DATA_GENERATE_FAILED = 'URL_DATA_GENERATE_FAILED',
  URL_DATA_GENERATED = 'URL_DATA_GENERATED',
  URL_DATA_UPLOADING = 'URL_DATA_UPLOADING',
  URL_DATA_UPLOAD_FAILED = 'URL_DATA_UPLOAD_FAILED',
  URL_DATA_UPLOADED = 'URL_DATA_UPLOADED',
  PARSE_RAW_DATAING = 'PARSE_RAW_DATAING',
  PARSE_RAW_DATA_FAILED = 'PARSE_RAW_DATA_FAILED',
  PARSE_RAW_DATAED = 'PARSE_RAW_DATAED',
  PUBLISHING = 'PUBLISHING',
  PUBLISH_FAILED = 'PUBLISH_FAILED',
  PUBLISHED = 'PUBLISHED',
  CANCEL_PENDING = 'CANCEL_PENDING',
  CANCELLING = 'CANCELLING',
  CANCEL_FAILED = 'CANCEL_FAILED',
  CANCELLED = 'CANCELLED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  OSS_UPLOAD_FAILED = 'OSS_UPLOAD_FAILED',
}

export type OriginalFileParams = {
  projectId: string;
  recordDataType: DataType;
  batchName?: string;
  batchNum?: string;
  fileName: string;
  fileLength: number;
};

export enum RawDataErrorType {
  INVALID_RAW_DATA_TYPE = 'INVALID_RAW_DATA_TYPE',
  IO_EXCEPTION = 'IO_EXCEPTION',
  EMPTY_FOLDER = 'EMPTY_FOLDER',
  TOO_MANY_LEVELS = 'TOO_MANY_LEVELS',
  FILE_EXT_ERROR = 'FILE_EXT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export type RawDataErrorHolder = {
  errorType: RawDataErrorType;
  errorNode: string;
};

export type OriginalListItem = {
  batchNum: number;
  batchName: string;
  context: {
    rawDataErrorHolders: RawDataErrorHolder[];
  };
  createdBy: number;
  createdTime: string;
  dataType: DataType;
  id: string;
  oriName: string | null;
  oriSize: string | null;
  preStatus: string | null;
  projectId: string;
  projectDisplayId: string;
  projectName: string;
  status: OriginalFileUploadStatus;
  updatedBy: number;
  updatedTime: string;
};

export interface DataUploadListParams extends Partial<PageQuery> {}

export type DataUploadListResult = Page<OriginalListItem>;
