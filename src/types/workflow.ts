import { ReworkRecordStatus } from './job';

export type JobProgressV3 = {
  canGetRows: number;
  haltRows: number;
  needReWorkRows: number;
  processedRows: number;
  totalRows: number;
  unCommittedRows: number;
  finishedRows: number;
};

export type JobWorkload = {
  avgEfficiency: number;
  avgRecordByWorker: number;
  avgWorkHourByWorker: number;
  nrPassRatio: number;
  totalWorkHour: number;
  totalWorkerNum: number;
  avgNumByWorker: number;
};

export type JobStatistic = {
  data: any[];
  totalPassNum?: number;
  totalRejectNum?: number;
  totalSampleNum?: number;
};

export type LabelingWorker = {
  createdBy: null | string;
  createdTime: null | string;
  id: null | string;
  labelJobId: string;
  labelWorkerId: string;
  labelWorkerStatus: 'ASSIGNED';
  labelWorkerUniqueName: string;
  qaJobId: null | string;
  qaWorkerId: null | string;
  qaWorkerStatus: null | string;
  qaWorkerUniqueName: null | string;
  updatedBy: null | string;
  updatedTime: null | string;
  version: null | string;
};

export interface LabelWorkerListByQaParam {
  isPublic: boolean;
  qaJobId: string;
  workerId: string;
}

export type LabelWorkerListByQaResult = LabelWorkerListByQaResultItem[];

export interface LabelWorkerListByQaResultItem {
  jobId: string;
  workerId: string;
  workerUniqueName: string;
  workerStatus: ReworkRecordStatus;
  targetWorkerList: LabelWorkerListByQaResultItem[];
}
