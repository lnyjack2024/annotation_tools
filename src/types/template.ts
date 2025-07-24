import type { DataType } from "@/types/dataset";

export enum EditorMode {
  CODE = "code",
  GRAPH = "graph",
}

export type Template = {
  attributes: string;
  id: string;
  version: number;
  title: string;
  description: string;
  content: string;
  instruction: string;
  css: string;
  js: string;
  options: string;
  type: TemplateType;
  jobId?: string;
  tdlId?: string;
  data: string;
  input: string;
  output: string;
  createdTime: string;
  questionType: string;
  updatedTime: string;
};

export enum TemplateType {
  LIDAR = "LIDAR_ANNOTATION",
  LIDAR_SSE = "LIDAR_SEMANTIC_SEGMENTATION",
  TRANSCRIPTION = "TRANSCRIPTION",
  TEXT = "TEXT_ANNOTATION",
  LLM_CONVERSATION = "LLM_CONVERSATION",
  LLM_QUESTION_ANSWER = "LLM_QUESTION_ANSWER",
  CUSTOM = "CUSTOM",
  LANDMARK = "LANDMARK_ANNOTATION",
  ADVERTISEMENT = "ADVERTISEMENT",
  GENERAL_IMAGE = "GENERAL_IMAGE_ANNOTATION",
}

export interface TemplateInfo {
  type: TemplateType;
  title: string;
  content: string;
  instruction: string;
  css: string;
  js: string;
  attributes: string;
  titleError?: string;
  contentError?: string;
}

export type TemplateInfoV2 = {
  id?: string;
  type: TemplateType;
  title: string;
  titleError?: string;
  content: string;
  contentError?: string;
  instruction: string;
  css: string;
  js: string;
  dataType: DataType;
  ontology: string;
  ontologyError?: string;
  attributes: string;
  attributesError?: string;
  isSupportedByApp: boolean;
  supportedLowestIOSVersion: string;
  supportedLowestAndroidVersion: string;
  version: number;
};

export enum TemplateAttributeType {
  FORM = "EASY_FORM",
  CHECKBOX = "CHECKBOX",
  INPUT = "INPUT",
  SWITCH = "SWITCH",
  RADIO = "RADIO",
  LIDAR_SIZES = "LIDAR_SIZES",
  AUDIO_STYLE = "AUDIO_STYLE",
}

export interface TemplateAttribute {
  name: string;
  label: Record<string, string>;
  type: TemplateAttributeType;
  options?: {
    name: string;
    label: Record<string, string>;
  }[];
  placeholder?: Record<string, string>;
  defaultValue?: string;
  tips?: Record<string, string>;
  regex?: RegExp;
  configName?: string | string[];
  validator?: (value: string) => boolean;
}
