import type { Job } from "@/types/job";
import type { Effect, Reducer } from "@umijs/max";
import { HttpStatus } from "@/types/http";
import {
  executeJobAction,
  getJobStatus,
  getJobV3,
  getJobWorkerNum,
  getJobWorkersV3,
  updateJobBpo,
  updateJobV3,
} from "@/services/job";
import { message } from "antd";
import { mapStatusToErrorMessage } from "@/utils/utils";
import type { WorkerJob } from "@/types/task";
import { WorkerJobStatus } from "@/types/task";
import { DEFAULT_PAGE_SIZE } from "@/utils/constants";
import type { ConnectState } from "@/models/connect";

export interface WorkerListFilter {
  pageIndex: number;
  pageSize: number;
  statusList: WorkerJobStatus;
  uniqueName?: string;
  assignedFlag?: boolean;
}

export type Sort = {
  sortField: string;
  sortOrder: string;
};

export type JobDetailDrawerModelState = {
  job: Job;
  workerNum: number;
  workerList: WorkerJob[];
  total: number;
  filter: WorkerListFilter;
  sorter: Sort;
};

export type JobDetailDrawerModelType = {
  namespace: string;
  state: JobDetailDrawerModelState;
  effects: {
    getJob: Effect;
    getJobStatus: Effect;
    updateJob: Effect;
    updateJobBpo: Effect;
    executeJobAction: Effect;
    getJobWorkerNum: Effect;
    getJobWorkerList: Effect;
  };
  reducers: {
    saveJob: Reducer;
    saveJobStatus: Reducer;
    saveJobWorkerNum: Reducer;
    saveJobWorkerList: Reducer;
    saveFilter: Reducer;
    clearFilter: Reducer;
    saveSorter: Reducer;
  };
};

const model: JobDetailDrawerModelType = {
  namespace: "jobDetailDrawer",
  state: {
    job: null,
    workerNum: 0,
    workerList: [],
    total: 0,
    filter: {
      pageSize: DEFAULT_PAGE_SIZE,
      pageIndex: 0,
      statusList: WorkerJobStatus.ALL,
    },
    sorter: null,
  },
  effects: {
    *getJob({ payload }, { call, put }) {
      const { jobId } = payload;
      const resp = yield call(getJobV3, jobId);
      if (resp.status === HttpStatus.OK) {
        yield put({
          type: "saveJob",
          payload: {
            job: resp.data,
          },
        });
      } else {
        message.error(mapStatusToErrorMessage(resp));
      }
    },
    *updateJob({ payload }, { call, put }) {
      const { job, callback } = payload;
      const resp = yield call(updateJobV3, job);
      if (resp.status === HttpStatus.OK) {
        yield put({
          type: "saveJob",
          payload: {
            job: resp.data,
          },
        });
        if (callback) {
          callback();
        }
      } else {
        message.error(mapStatusToErrorMessage(resp));
      }
    },
    *updateJobBpo({ payload }, { call }) {
      const { jobId, bpoId, bpoName, callback } = payload;
      const resp = yield call(updateJobBpo, jobId, bpoId, bpoName);
      if (resp.status === HttpStatus.OK) {
        if (callback) {
          callback();
        }
      } else {
        message.error(mapStatusToErrorMessage(resp));
      }
    },
    *executeJobAction({ payload }, { call, put }) {
      const { jobId, jobAction, callback } = payload;
      const resp = yield call(executeJobAction, jobId, jobAction);
      if (resp.status === HttpStatus.OK) {
        yield put({
          type: "saveJob",
          payload: {
            job: resp.data,
          },
        });
        if (callback) {
          callback();
        }
      } else {
        message.error(mapStatusToErrorMessage(resp));
      }
    },
    *getJobStatus({ payload }, { call, put }) {
      const { jobId } = payload;
      const data = yield call(getJobStatus, jobId);
      yield put({
        type: "saveJobStatus",
        payload: {
          status: data,
        },
      });
    },
    *getJobWorkerNum({ payload }, { call, put }) {
      const { jobId } = payload;
      const resp = yield call(getJobWorkerNum, jobId);
      if (resp.status === HttpStatus.OK) {
        yield put({
          type: "saveJobWorkerNum",
          payload: {
            workerNum: resp.data,
          },
        });
      } else {
        message.error(mapStatusToErrorMessage(resp));
      }
    },
    *getJobWorkerList({ payload }, { call, put, select }) {
      const { filter, sorter = {} } = yield select(
        (state: ConnectState) => state.jobDetailDrawer
      );
      const resp = yield call(getJobWorkersV3, {
        ...payload,
        ...filter,
        ...sorter,
        statusList:
          filter.statusList === WorkerJobStatus.ALL
            ? [
                WorkerJobStatus.CONFIRMED,
                WorkerJobStatus.DETAINED,
                WorkerJobStatus.REJECT,
                WorkerJobStatus.ASSIGNED,
                WorkerJobStatus.DECLINED,
              ]
            : [filter.statusList],
      });
      if (resp.status === HttpStatus.OK) {
        yield put({
          type: "saveJobWorkerList",
          payload: {
            data: resp.data,
          },
        });
      } else {
        message.error(mapStatusToErrorMessage(resp));
      }
    },
  },
  reducers: {
    saveJob(state: JobDetailDrawerModelState, { payload }) {
      const { job } = payload;
      return {
        ...state,
        job,
      };
    },
    saveJobStatus(state: JobDetailDrawerModelState, { payload }) {
      const { status } = payload;
      return {
        ...state,
        job: {
          ...state.job,
          jobStatus: status,
        },
      };
    },
    saveJobWorkerNum(state: JobDetailDrawerModelState, { payload }) {
      const { workerNum } = payload;
      return {
        ...state,
        workerNum,
      };
    },
    saveJobWorkerList(state: JobDetailDrawerModelState, { payload }) {
      const { data } = payload;
      return {
        ...state,
        workerList: data.results,
        total: data.totalElements,
      };
    },
    saveFilter(state: JobDetailDrawerModelState, { payload }) {
      const { newFilter } = payload;
      return {
        ...state,
        filter: {
          ...state.filter,
          ...newFilter,
        },
      };
    },
    clearFilter(state: JobDetailDrawerModelState) {
      return {
        ...state,
        filter: {
          pageSize: DEFAULT_PAGE_SIZE,
          pageIndex: 0,
          statusList: WorkerJobStatus.ALL,
        },
      };
    },
    saveSorter(state: JobDetailDrawerModelState, { payload }) {
      const { newSorter } = payload;
      return {
        ...state,
        sorter: newSorter,
      };
    },
  },
};

export default model;
