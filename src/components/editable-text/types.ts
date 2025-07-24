import JobProxy from 'src/libs/JobProxy';

export enum ReviewMode {
  LABELING = 'labeling',
  REVIEW = 'review',
}

export enum TAG {
  INSERTION = 'INSERTION',
  LABEL = 'LABEL',
  CONNECTION = 'CONNECTION',
  LABEL_QA = 'LABEL_QA',
};
export type OntologyItemType = TAG.LABEL | TAG.LABEL_QA | TAG.CONNECTION | TAG.INSERTION;

export interface OntologyItem {
  keys: string[];
  children?: OntologyItem[];
  text: string;
  color?: string;
  type: OntologyItemType;
  displayName?: string;
}
export interface Ontologies {
  labels_qa?: OntologyItem[];
  labels?: OntologyItem[];
  insertions?: OntologyItem[];
  connections?: OntologyItem[];
}
export interface OntologyItemPayLoad {
  children?: OntologyItemPayLoad[];
  text: string;
  color?: string;
  type: OntologyItemType;
  displayName?: string;
}

export interface Payload {
  locale?: string;
  issue_types?: string;
  skip_check_for_invalid_data?: string | boolean;
  jobProxy: JobProxy;
  content: string;
  read_only?: string | boolean;
  labels?: OntologyItemPayLoad[];
  insertions?: OntologyItemPayLoad[];
  connections?: OntologyItemPayLoad[];
}

export interface Result {
  id: string;
  message: string;
  info: {
    tagName: string
  };
  blockSubmit?: boolean;
  type: string;
}

export enum ValidationType {
  SCRIPT = 'script',
}

export interface LabelItem {
  end: number;
  start: number
  id: string;
  isReview: boolean;
  text: string;
  type: OntologyItemType;
  value: string;
  keys?: string[];
  dirty?: boolean;
}
export interface InsertionItem {
  at: number;
  value: string;
  id: string;
  text: string;
  isReview: boolean;
  keys?: string[];
  dirty?: boolean;
  type: OntologyItemType;
}

export interface ConnectionItem {
  fromId: string;
  toId: string;
  fromType: OntologyItemType;
  toType: OntologyItemType;
  value: string;
  id: string;
  from?: string;
  to?: string;
  isReview: boolean;
  keys?: string[];
  dirty?: boolean;
  type: OntologyItemType;
}

export interface MissingItem {
  end: number;
  start: number
  id: string;
  isReview: boolean;
  text: string;
  type: OntologyItemType;
  value: string;
  keys?: string[];
  dirty?: boolean;
}

export interface ReviewResultItem extends ReviewDataItem {
  id: string;
  key?: string[];
}

export interface ReviewResult {
  data: { [key: string]: ReviewDataItem };
  missing: MissingItem[];
}

export enum ReviewItemResult {
  REJECT = 'reject',
  PASS = 'pass',
  MISSING = 'missing',
}
export type ReviewResultType = ReviewItemResult.REJECT | ReviewItemResult.PASS | ReviewItemResult.MISSING;
export interface ReviewDataItem {
  comment: string;
  result: ReviewResultType;
  type: string[]
}

export interface OntologyResult {
  labels: LabelItem[];
  insertions: InsertionItem[];
  connections: ConnectionItem[]
}

export interface OntologyConfigMap {
  keys: string[];
  childKeys: string[];
  text: string;
  color?: string;
  type: OntologyItemType;
  displayName?: string;
  isChild: boolean;
}

export interface OntologiesStatus {
  isCollapse: boolean;
  keys: string[];
  tagCount: number;
  tagCountContainChildren?: number;
  rejectCount?: number;
  rejectCountContainChildren?: number;
  approveCount?: number;
}

export interface Statistics {
  summary: SummaryItem[];
  totalCount: number;
}

export interface SummaryItem {
  count: number;
  shape: string;
  keys: string[];
}

export interface ReviewStatistics {
  objects: AuditStatItem & { missed: number };
  summary: SummaryItem[];
  elements: {
    approved: {
      [type: string]: number;
    },
    rejected: {
      [type: string]: number;
    }
  };
}

export type AuditStatItem = {
  total: number;
  approved: number;
  actualApproved: number;
  rejected: number;
};

export type AuditStatistics = {
  objects: AuditStatItem & { missed: number };
  shapes: {
    [shape: string]: AuditStatItem;
  };
};
