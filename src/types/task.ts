import type { JobType } from './job';
import { JobStatus } from './job';

export interface WorkerJob {
  visible: boolean;
  id: string;
  jobId: string;
  jobType: JobType;
  jobName: string;
  jobStatus: JobStatus;
  status: WorkerJobStatus | HRWorkforceStatus;
  version: number;
  workerEmail: string;
  uniqueName?: string;
  workerId: string;
  assignTime: string;
  confirmTime: string;
  rate: number;
  contactEmail?: string;
  contactQRCode?: string;
  qualificationProcess?: string;
  sourceFile: string;
  // custom field for upload status
  uploadStatus?: 'failed' | 'new';
  backendVersion: number;
  description: string;
  jobDisplayId?: string;
  availableTasks?: number;
  unCommittedTasks: number;
  unCommittedTimeout: number;
  needReworkTasks?: number;
  accuracy?: number;
  flowId?: string;
  projectId?: string;
}

export enum TaskRecordStatus {
  UNCHECKED = 'UNCHECKED',
  APPROVED = 'APPROVED',
  MODIFIED = 'MODIFIED',
  OTHER_REWORKED = 'OTHER_REWORKED',
  REJECTED = 'REJECTED',
  MODIFY = 'MODIFY',
}

export interface WorkerJobResult {
  recordId: number;
  labelingTime: string;
  lastModifiedTime: string;
  status: TaskRecordStatus;
}

export enum WorkerJobStatus {
  ASSIGNED = 'ASSIGNED',
  CONFIRMED = 'CONFIRMED', // worker applied successfully, but job doesn't start
  READY = 'READY', // job has started, but worker is not working
  WORKING = 'WORKING',
  PAUSE = 'PAUSE',
  STOPPED = 'STOPPED',
  REJECT = 'REJECT',
  FINISHED = 'FINISHED',
  DECLINED = 'DECLINED',
  DETAINED = 'DETAINED',
  INACTIVE = 'INACTIVE',
  ALL = 'ALL',
}

export const WorkerJobStatusFilters = {
  all: [
    WorkerJobStatus.ASSIGNED,
    WorkerJobStatus.CONFIRMED,
    WorkerJobStatus.READY,
    WorkerJobStatus.WORKING,
    WorkerJobStatus.PAUSE,
    WorkerJobStatus.REJECT,
    WorkerJobStatus.FINISHED,
    WorkerJobStatus.STOPPED,
    WorkerJobStatus.DECLINED,
    WorkerJobStatus.DETAINED,
  ],
  applying: [WorkerJobStatus.ASSIGNED], // for public job, when worker status is ASSIGNED, it means he is applying
  active: [
    WorkerJobStatus.CONFIRMED,
    WorkerJobStatus.READY,
    WorkerJobStatus.WORKING,
    WorkerJobStatus.PAUSE,
    WorkerJobStatus.DETAINED,
  ],
  finished: [WorkerJobStatus.FINISHED, WorkerJobStatus.CONFIRMED],
  inactive: [WorkerJobStatus.REJECT, WorkerJobStatus.DECLINED],
};

export enum JobActionTypes {
  confirm = 'confirm',
  reject = 'reject',
}

export enum HRWorkforceStatus {
  ALL = 'ALL',
  CONFIRMED = 'CONFIRMED',
  DECLINED = 'DECLINED',
  PM_APPROVAL_PENDING = 'PM_APPROVAL_PENDING',
  WORKER_OPERATION_PENDING = 'WORKER_OPERATION_PENDING',
  APPLYING = 'APPLYING',
}
