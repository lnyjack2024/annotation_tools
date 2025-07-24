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
