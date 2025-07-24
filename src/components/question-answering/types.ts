import JobProxy from '../../libs/JobProxy';
import { Content, LLMModel, Rank } from '../common/llm/types';

export interface Payload {
  jobProxy: JobProxy;
  locale?: string;
  tool_mode?: string;
  issue_types?: string;
  // config
  subjects?: string;
  attributes_config?: string;
  item_attributes_config?: string;
  ranking?: string | boolean;
  ranking_type?: string;
  ranking_options?: string;
  sortable?: string | boolean;
  editable?: string | boolean;
  addible?: string | boolean;
  add_model?: string;
  // data
  review_from?: string;
  // simple input
  question?: string;
}

export enum Operator {
  EQUAL = 'equal_to',
  GREATER = 'greater_than',
  LESS = 'less_than',
}

export interface Answer {
  id: string;
  original: boolean; // is provided by original data
  value: Content;
  originalValue?: Content;
  rank?: Rank;
  attributes?: any;
  model?: LLMModel; // model used to generate
  sourceModelId?: string;
}

export enum ReviewMode {
  LABELING = 'labeling',
  REVIEW = 'review',
}
export interface Result {
  id: string;
  message: string;
  info: {
    title: string
  };
  blockSubmit?: boolean;
  type: string;
}

export enum ValidationType {
  SCRIPT = 'script',
}
