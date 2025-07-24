import type { TemplateType } from '@/types/template';
import type { DataType } from '@/types/dataset';
import type { DataState } from '@/pages/project/data-center/components/DataList';
import { Job } from '@/types/job';
import { ContributorType } from '@/services/project';

export type TemplateScope = 'GLOBAL' | 'PRIVATE';

export type ProjectTemplate = {
  id: string;
  createdUser: string;
  createdTime: string;
  updatedUser: string;
  updatedTime: string;
  version: number;
  title: string;
  content: string;
  css: string;
  deleted: 1 | 0;
  description: string;
  instruction: string;
  js: string;
  options: string;
  type: TemplateType;
  data: string; // example data for preview
  input: string;
  output: string;
  questionType: string;
  attributes: string;
  ontology: string;
  scope: TemplateScope;
  runningFlowNum: number | null;
  dataType: DataType;
  projectId: string;
  isSupportedByApp: boolean;
  supportedLowestIOSVersion: string;
  supportedLowestAndroidVersion: string;
};

export type Workflow = {
  id: string;
  flowName: string;
  flowDisplayId: string;
  projectId: string;
  reworkStrategy:
    | 'NOT_TURN_BACK'
    | 'TURN_BACK_TO_FIXED'
    | 'TURN_BACK_TO_POOL'
    | null;
  qaStrategy: 'ANY' | 'FIXED' | null;
  totalNum: number;
  templateId: 'string';
  templateType: TemplateType;
  activeStatus: 'ACTIVE' | 'INACTIVE';
  createdTime: string;
  // createdBy: string;
  // updatedBy: string;
  // updatedTime: string;
  status: string;
  testFlag: boolean;
  dataCollectFlag: boolean;
  version: number;
  jobs: Job[];
};

export type WorkflowDataRecord = {
  assignedTime: string | null;
  auditNum: number;
  batchNum: number;
  batchName: string;
  contributor: ContributorType;
  cycle: number | null;
  dataType: DataType;
  duration: number | null;
  flowId: string;
  flowName: string | null;
  id: string;
  jobId: string;
  jobName: string | null;
  jobType: string | null;
  poolId: number;
  recordId: number;
  source: string | null;
  state: DataState;
  timeout: number | null;
  dataOperLogId?: string;
};

export enum DataCheckTarget {
  EXPORT = 'EXPORT',
  AUDIT = 'AUDIT',
}
