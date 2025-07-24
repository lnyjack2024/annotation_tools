import { JobType } from '@/types/job';

export enum GroupType {
  Personal = 'personal',
  Team = 'team',
}

export type WorkloadFilterParam = {
  pageSize: number;
  pageIndex: number;
  // group?: string;
  team?: string;
  name?: string;
  email?: string;
  flowId?: string;
  jobId?: string;
  date?: string;
};

export enum StatisticsTimeGranularity {
  Day = 'day',
  Week = 'week',
  Month = 'month',
  Total = 'all',
}

export enum StatisticsType {
  Workload = 'workload',
  Progress = 'progress',
}

export type WorkloadState = {
  total: number;
  data: [];
  filter: WorkloadFilterParam;
  jobType: JobType;
  group: GroupType;
};
