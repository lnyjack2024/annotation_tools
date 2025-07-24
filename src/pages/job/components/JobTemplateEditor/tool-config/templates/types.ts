import { DataType } from "@/types/dataset";

export enum TemplateType {
  // LIDAR_ANNOTATION_V2 = 'LIDAR_ANNOTATION_V2',
  LLM_CONVERSATION = "LLM_CONVERSATION",
  LLM_QUESTION_ANSWER = "LLM_QUESTION_ANSWER",
  // CUSTOM = 'CUSTOM'
}

export type ProjectTemplate = {
  attributes: string;
  ontology?: string;
  questionType: string;
} & ProjectTemplateBase;

export type ProjectTemplateParsed = {
  parsedAttributes?: any;
  ontology: any;
  questionType: string[];
} & ProjectTemplateBase;

export type ProjectTemplateBase = {
  id?: string;
  createdUser: string;
  createdTime: string;
  updatedUser: string;
  updatedTime: string;
  version: number;
  title: string;
  content: string;
  css: string;
  deleted: boolean;
  description: string;
  instruction: string;
  js: string;
  options: string;
  type: TemplateType;
  data: string; // example data for preview
  input: string;
  output: string;
  scope: string;
  runningFlowNum: number | null;
  dataType: DataType;
  projectId: string;
  isSupportedByApp: boolean;
  supportedLowestIOSVersion?: string;
  supportedLowestAndroidVersion?: string;
};

export interface ImportResult {
  success: boolean;
  error?: ImportError;
  errorInfo?: {
    path: string;
    invalidNames?: string[];
    duplicatedNames?: string[];
  }[];
}

export enum ImportError {
  INVALID = "invalid",
  TYPE_NOT_MATCH = "type-not-match",
}
