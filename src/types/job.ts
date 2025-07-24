import type { TemplateType } from '@/types/template';
import type { Granularity } from './jobAudit';

export enum JobStatus {
  DRAFT = 'DRAFT',
  READY = 'READY',
  LAUNCH = 'LAUNCH',
  STARTING_ERROR = 'STARTING_ERROR',
  RUNNING = 'RUNNING',
  PAUSE = 'PAUSE',
  FINISHED = 'FINISHED',
  STOPPED = 'STOPPED',
  ERROR = 'ERROR',
  TEMP_CLOSE = 'TEMP_CLOSE',
}

export enum JobType {
  LABEL = 'LABELING',
  QA = 'QA',
}

export enum JobTenantType {
  COMPANY = 'COMPANY',
  PRIVATE = 'PRIVATE',
}

export const JobStatusFilter = {
  all: [
    JobStatus.DRAFT,
    JobStatus.READY,
    JobStatus.LAUNCH,
    JobStatus.STARTING_ERROR,
    JobStatus.RUNNING,
    JobStatus.PAUSE,
    JobStatus.FINISHED,
    JobStatus.STOPPED,
    JobStatus.ERROR,
  ],
  limitedActive: [JobStatus.LAUNCH, JobStatus.RUNNING],
  active: [JobStatus.LAUNCH, JobStatus.RUNNING, JobStatus.PAUSE],
  finished: [JobStatus.FINISHED],
  stopped: [JobStatus.STOPPED],
};

export type Job = {
  activeStatus: string;
  byWorkerFile: string;
  contactEmail: string;
  contactQRCode: string;
  createdTime: string;
  description: string;
  endpoint: string;
  flowId: string;
  globalSampleRate: string | number;
  globalSampleSwitchOn: boolean;
  id: string;
  jobDisplayId: string;
  jobName: string;
  jobStatus: JobStatus;
  jobType: JobType;
  templateType: TemplateType;
  labelingJobId: string;
  onPremiseJob: boolean;
  overallSampleRate: number;
  preconditionJobId: string;
  projectId: string;
  qaCycleOrder: number;
  qaGroupId: string;
  qaModifiable: boolean;
  rate: number;
  recordNum: number;
  showWorkerName: boolean;
  sourceFile: string;
  sourceTopic: string;
  tag: string;
  targetTopic: string;
  testFlag: boolean;
  timeout: number;
  token: string;
  totalNum: number;
  updatedTime: string;
  version: number;
  visible: boolean;
  workerNum: number;
  workerSampleContent: string;
  workerSampleFile: string;
  bpoFlag: boolean;
  bpoId: string;
  bpoName: string;
  strictTiming: boolean;
  qaRatio: number | null;
  labelingRatio: number | null;
  webhook?: string;
  skills?: string;
  progressInfo?: string;
  backTo?: number;
};

export enum JobAction {
  INIT_JOB = 'init-job',
  START_JOB = 'start-job',
  LAUNCH_JOB = 'launch-job',
  PAUSE_JOB = 'pause-job',
  RESUME_JOB = 'resume-job',
  STOP_JOB = 'stop-job',
  TEMP_CLOSE = 'reopen-job',
}

export interface JobExtraInfo {
  annotationType: string;
  progressInfo: {
    ratio: number;
    processedNum: number;
    totalNum: number;
  };
}

export enum JobReportStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  PROCESSING = 'PROCESSING',
  CANCELLED = 'CANCELLED',
  POST_SCRIPT_READY = 'POST_SCRIPT_READY',
  NONE = 'NONE',
}

export type JobWorkerWorkload = {
  count: number;
  seconds: number;
  email: string;
  name: string;
  workerId: string;
  jobId: string;
};

export type QAWorkload = {
  jobId: number;
  workerId: number;
  qaCount: number;
  qaPassCount: number;
  qaRejectCount: number;
  qaRecordCount: number;
  timeBySeconds: number;
  accuracy: null;
};

export type LabelWorkload = {
  jobId: number;
  workerId: number;
  labelCount: number;
  reworkCountByOther: number;
  reworkCountToOther: number;
  timeBySeconds: number;
  elements: null;
  accuracy: null;
};

export type JobWorkerQuality = {
  email: string;
  name: string;
  qaFailureCount: number;
  qaPassCount: number;
  qaTotalCount: number;
  qaPassRate: number;
  workerId: string;
  workJobId: string;
  qaJobId: string;
  documentId?: string;
};

export interface WorkerScore {
  autoScore: number;
  createTime: string;
  id: string;
  jobId: string;
  jobName: string;
  lastModifiedTime: string;
  updatedTime: string;
  manualComment: string;
  manualJudgeEmail: string;
  manualJudgeId: string;
  manualScore: number;
  projectId: string;
  publicFlag: boolean;
  workerEmail: string;
  uniqueName: string;
  workerId: string;
  workerName: string;
}

export type UpdateWorkerSampleParam = {
  qaJobId: string;
  sampleRate: number;
  workerEmail: string;
  workerId: string;
};

export interface WorkloadDetail {
  jobId: string;
  labelCountPerHour: number;
  labellingNumber: number;
  labellingSeconds: number;
  otherReworkNumber: number;
  otherReworkSeconds: number;
  qaPassRate: number;
  qaPassedNumber: number;
  qaSampledNumber: number;
  reworkNumber: number;
  reworkOtherNumber: number;
  reworkOtherSeconds: number;
  reworkSeconds: number;
  secondsPerLabelNumber: number;
  workerId: string;
  workerName: string;
  workerEmail: string;
  uniqueName: string;
}

export const BPOFilterStatus = {
  LAUNCH: [JobStatus.LAUNCH],
  RUNNING: [JobStatus.RUNNING],
  PAUSE: [JobStatus.PAUSE],
  FINISHED: [JobStatus.FINISHED],
  STOPPED: [JobStatus.STOPPED],
  ERROR: [JobStatus.STARTING_ERROR],
};

export interface JobAuditStatisticsResult
  extends Omit<JobAuditStatisticsResultItem, 'elementType'> {
  id: string;
  version: number;
  auditNum: number;
  templateId: string;
  granularity: Granularity;
  elementAuditData: JobAuditStatisticsResultItem[];
}

export interface JobAuditStatisticsResultItem {
  elementType: string;
  totalNum: number;
  processedNum: number;
  acceptedNum: number;
  rejectedNum: number;
  missedNum: number;
  processedRate: number;
  passRate: number;
}

export enum ReworkRecordStatus {
  FAILED = 'FAILED',
  ASSIGNED = 'ASSIGNED',
  COMPLETED = 'COMPLETED',
}

export type JobWorkersV3Result = JobWorkersV3ResultItem[];

export interface JobWorkersV3ResultItem {
  id: string;
  jobId: string;
  workerId: string;
  workerEmail: string;
  workerPhone: any;
  uniqueName: string;
  flowId: string;
  jobTenantId: string;
  jobDisplayId: string;
  jobName: string;
  jobType: string;
  rate: number;
  paymentType: string;
  status: string;
  contactQRCode: any;
  contactEmail: string;
  version: number;
  bpoId: any;
  labelQAMappingNum?: number;
  targetQAMappingJobId: string;
  assignTime: string;
  confirmTime?: string;
  lastEmailTime: any;
}
