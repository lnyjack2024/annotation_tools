<<<<<<< HEAD
import type { Model, Subscription } from "@umijs/max";
import type { WorkerJobStatus } from "@/types/task";

export * from "./common";
export * from "./http";
export * from "./job";
export * from "./v3";
export * from "./worker";
export * from "./workflow";
export * from "./user";
export * from "./task";
export * from "./dataset";
export interface ConnectModel<T> extends Model {
  state: T;
  subscriptions?: {
    setup: Subscription;
  };
}

export interface Page<T> {
  results: T[];
  totalElements: number;
  pageSize: number;
  currentPage: number;
  totalPages: number;
}

export interface PageQueryParam {
  pageIndex: number;
  pageSize: number;
}

export interface WorkerQueryParam {
  pageIndex: number;
  pageSize: number;
  statusList: WorkerJobStatus[];
  orientationQa?: string;
  uniqueName?: string;
}

export interface Status {
  status: number;
  message: string;
  data?: any;
}

export interface RouteData {
  pathname?: string;
  query?: any;
  search?: string;
  state?: any;
  hash?: any;
}
=======
export enum AnnotationType {

  VIDEO_TRACK_V2 = 'video-track-v2',
  LONG_AUDIO = 'long-audio',
  KEYPOINT = 'keypoint',
  EDITABLE_TEXT = 'editable-text',
  ADVERTISEMENT = 'advertisement',

  QUESTION_ANSWERING = 'question-answering',
  DIALOGUE = 'dialogue',
};

export enum RunningMode {
  STANDALONE,
  IFRAME,
};

export enum SubmitChannel {
  Label = 'label',
  Qa = 'qa',
  Audit = 'audit',
}

enum LabelSubmitChannel {
  Submit = 'S',
  Next = 'X',
}

enum QaSubmitChannel {
  Approve = 'A',
  Reject = 'R',
}

enum AuditChannel {
  Approve = 'A',
  Reject = 'R',
  Submit = 'S',
}

export const SubmitChannelPayload = {
  ...LabelSubmitChannel,
  ...QaSubmitChannel,
  ...AuditChannel,
};

export type SubmitChannelPayloadType = typeof SubmitChannelPayload;
>>>>>>> origin/master
