import type { Effect, Subscription } from "@umijs/max";
import type { Reducer } from "redux";
import { history } from "@umijs/max";

import {
  acceptJobs,
  getTaskWorkload,
  getWorkerJobDetail,
  getWorkerPublicJobs,
  rejectJobs,
  workerApplyPublicJob,
  workerValidatePin,
} from "@/services/task";
import { HttpStatus } from "@/types/http";
import type { JobWorkerWorkload } from "@/types/job";
import { JobStatusFilter } from "@/types/job";
import type { WorkerJob } from "@/types/task";
import { JobActionTypes, WorkerJobStatus } from "@/types/task";
import { mapStatusToErrorMessage } from "@/utils/utils";
import { message } from "antd";
import { formatMessage } from "@umijs/max";
import { pathToRegexp } from "path-to-regexp";
import { getWorkerLifecycle } from "@/services/worker";
import type { WorkerLifecycle } from "@/types/worker";
import type { WorkerJobQuery } from "@/pages/worker-job/workerJobAPI";
import {
  getAssignedJobsNum,
  getWorkerJobs,
} from "@/pages/worker-job/workerJobAPI";

export interface WorkerJobModelState {
  jobs: WorkerJob[];
  totalJobs: number;
  assignedNum: number;
  assignedJobs: WorkerJob[];
  totalAssignedJobs: number;
  workload: JobWorkerWorkload[];
  publicJobs: WorkerJob[];
  totalPublicJobs: number;
  jobDetail: WorkerJob;
  workerLifecycle: WorkerLifecycle;
  verificationItems: [];
}

export interface WorkerJobModelType {
  namespace: string;
  state: WorkerJobModelState;
  subscriptions: {
    setup: Subscription;
  };
  effects: {
    getAssignedJobsNum: Effect;
    getWorkerJobs: Effect;
    getAssignedWorkerJobs: Effect;
    updateWorkerJobs: Effect;
    getWorkload: Effect;
    getWorkerPublicJobs: Effect;
    workerApplyPublicJob: Effect;
    getWorkerJobDetail: Effect;
    pinValidate: Effect;
    getWorkerLifecycle: Effect;
  };
  reducers: {
    saveWorkerJobs: Reducer<WorkerJobModelState>;
    saveAssignedJobsNum: Reducer<WorkerJobModelState>;
    saveAssignedWorkerJobs: Reducer;
    updateConfirmedWorkerJobs: Reducer<WorkerJobModelState>;
    saveWorkload: Reducer;
    saveWorkPublicJobs: Reducer;
    saveWorkJobDetail: Reducer;
    saveWorkerLifecycle: Reducer;
    saveVerificationItems: Reducer;
  };
}

const Model: WorkerJobModelType = {
  namespace: "workerJob",
  state: {
    jobs: [],
    totalJobs: 0,
    assignedJobs: [],
    assignedNum: 0,
    totalAssignedJobs: 0,
    workload: [],
    publicJobs: [],
    totalPublicJobs: 0,
    jobDetail: null,
    workerLifecycle: null,
    verificationItems: null,
  },
  subscriptions: {
    setup({ dispatch }): void {
      history.listen(({ location }): void => {
        const { pathname } = location;
        const parsedLocation = pathToRegexp(
          "/:version?/worker-job/:jobId"
        ).exec(pathname);
        if (parsedLocation) {
          const jobId = parsedLocation[2];
          dispatch({ type: "getWorkerJobDetail", payload: jobId });
          dispatch({ type: "getWorkerLifecycle", payload: jobId });
        }
      });
    },
  },
  effects: {
    *getAssignedJobsNum(_, { call, put }) {
      const num = yield call(getAssignedJobsNum);
      yield put({ type: "saveAssignedJobsNum", payload: { num } });
    },
    *getWorkerJobs({ payload }, { call, put }) {
      const { statusList, pageQuery, jobName, jobStatusList } = payload;

      const resp = yield call(getWorkerJobs, {
        jobStatusList,
        statusList,
        jobName,
        sortBy: "CONFIRM_TIME",
        ...pageQuery,
      } as WorkerJobQuery);

      if (resp.status === HttpStatus.OK) {
        yield put({
          type: "saveWorkerJobs",
          payload: {
            jobs: resp.data.results,
            totalJobs: resp.data.totalElements,
          },
        });
      }
    },
    *getAssignedWorkerJobs({ payload }, { call, put }) {
      const { jobName = "", ...pageQuery } = payload;

      const resp = yield call(getWorkerJobs, {
        jobStatusList: JobStatusFilter.limitedActive,
        statusList: [WorkerJobStatus.ASSIGNED],
        jobName,
        sortBy: "CREATED_TIME",
        ...pageQuery,
      } as WorkerJobQuery);

      if (resp.status === HttpStatus.OK) {
        yield put({
          type: "saveAssignedWorkerJobs",
          payload: {
            assignedJobs: resp.data.results,
            totalAssignedJobs: resp.data.totalElements,
          },
        });
      }
    },
    *updateWorkerJobs({ payload }, { call }) {
      const { actionType, data, onSuccess, onError } = payload;
      let resp;
      try {
        if (actionType === JobActionTypes.confirm) {
          resp = yield call(acceptJobs, data);
        } else {
          resp = yield call(rejectJobs, data);
        }
      } catch (err) {
        onError();
      }
      if (resp.status === HttpStatus.OK) {
        onSuccess();
      } else {
        onError(mapStatusToErrorMessage(resp));
      }
    },
    *getWorkload(_, { call, put }) {
      const resp = yield call(getTaskWorkload);
      yield put({ type: "saveWorkload", payload: resp.data });
    },
    *getWorkerJobDetail({ payload }, { call, put }) {
      const resp = yield call(getWorkerJobDetail, payload);
      if (resp.status === HttpStatus.JOB_NOT_FOUND) {
        message.error(formatMessage({ id: "job-not-found.error" }));
      }
      yield put({ type: "saveWorkJobDetail", payload: resp.data || null });
    },
    *getWorkerPublicJobs({ payload }, { call, put }) {
      const resp = yield call(getWorkerPublicJobs, { ...payload });
      yield put({ type: "saveWorkPublicJobs", payload: resp.data });
    },
    *workerApplyPublicJob({ payload }, { call }) {
      const { jobId, onSuccess, onFail } = payload;
      const resp = yield call(workerApplyPublicJob, jobId);
      if (resp.status === HttpStatus.OK) {
        onSuccess();
      } else {
        message.error(
          formatMessage(
            { id: "common.message.fail.operation" },
            { detail: mapStatusToErrorMessage(resp) }
          )
        );
        if (onFail) {
          onFail();
        }
      }
    },
    *pinValidate({ payload }, { call }) {
      const { jobId, pin, onSuccess, onFail } = payload;
      const resp = yield call(workerValidatePin, jobId, pin);
      if (resp.status === HttpStatus.OK && resp.data) {
        onSuccess();
      } else {
        onFail();
      }
    },
    *getWorkerLifecycle({ payload }, { call, put }) {
      const resp = yield call(getWorkerLifecycle, payload);
      yield put({ type: "saveWorkerLifecycle", payload: resp.data });
    },
  },
  reducers: {
    saveWorkerJobs(state: WorkerJobModelState, { payload }) {
      const { jobs, totalJobs } = payload;
      return {
        ...state,
        jobs,
        totalJobs,
      };
    },
    saveAssignedJobsNum(state: WorkerJobModelState, { payload }) {
      const { num } = payload;
      return {
        ...state,
        assignedNum: num,
      };
    },
    saveAssignedWorkerJobs(state: WorkerJobModelState, { payload }) {
      const { assignedJobs, totalAssignedJobs } = payload;
      return {
        ...state,
        assignedJobs,
        totalAssignedJobs,
      };
    },
    updateConfirmedWorkerJobs(state: WorkerJobModelState, { payload }) {
      const { newConfirmedTasks = [] } = payload;
      const taskIds = newConfirmedTasks.map((task: WorkerJob) => task.id);
      const { totalAssignedJobs } = state;
      return {
        ...state,
        totalAssignedJobs: totalAssignedJobs - taskIds.length,
      };
    },
    saveWorkload(state: WorkerJobModelState, { payload }) {
      return {
        ...state,
        workload: payload,
      };
    },
    saveWorkPublicJobs(state: WorkerJobModelState, { payload }) {
      const { results = [], totalElements = 0 } = payload;
      return {
        ...state,
        publicJobs: results,
        totalPublicJobs: totalElements,
      };
    },
    saveWorkJobDetail(state: WorkerJobModelState, { payload }) {
      return {
        ...state,
        jobDetail: payload,
      };
    },
    saveWorkerLifecycle(state: WorkerJobModelState, { payload }) {
      return {
        ...state,
        workerLifecycle: payload,
      };
    },
    saveVerificationItems(state: WorkerJobModelState, { payload }) {
      return {
        ...state,
        verificationItems: payload,
      };
    },
  },
};

export default Model;
