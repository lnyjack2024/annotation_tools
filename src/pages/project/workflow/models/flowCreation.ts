import type { Job } from "@/types/job";
import type { Effect, Reducer } from "@umijs/max";
import type { ProjectTemplate, Workflow } from "@/types/v3";

import {
  createFlowJob,
  deleteFlowJob,
  getFlowJobs,
  updateFlow,
} from "@/services/workflow";
import { HttpStatus } from "@/types/http";
import { message } from "antd";
import { mapStatusToErrorMessage } from "@/utils/utils";
import { JobType } from "@/types/job";
import type { JobProgressV3 } from "@/types/workflow";
import { updateJobV3 } from "@/services/job";
import { getTemplateById } from "@/services/template-v3";

export type FlowCreationModelState = {
  flow: Workflow;
  flowTemplate: ProjectTemplate;
  jobs: Job[];
  jobsWithProgress: Job[];
};

export type FlowCreationModelType = {
  namespace: string;
  state: FlowCreationModelState;
  effects: {
    getFlowJobs: Effect;
    getFlowTemplate: Effect;
    createFlowJob: Effect;
    updateFlowTurnbackConfig: Effect;
    deleteFlowJob: Effect;
    updateFlowJob: Effect;
    // refreshProgress: Effect;
  };
  reducers: {
    saveFlowJobs: Reducer;
    saveFlowTemplate: Reducer;
    resetFlowJobs: Reducer;
    updateFlow: Reducer;
    updateProgressInfo: Reducer;
    // tmpUpdateBackTo: Reducer;
    saveJob: Reducer;
  };
};

const model: FlowCreationModelType = {
  namespace: "flowCreation",
  state: {
    flow: null,
    flowTemplate: null,
    jobs: [],
    jobsWithProgress: [],
  },
  effects: {
    *getFlowJobs({ payload }, { call, put }) {
      const { flowId, projectId } = payload;
      const resp = yield call(getFlowJobs, flowId, projectId);
      if (resp.status === HttpStatus.OK) {
        const { jobs, ...flow } = resp.data.results[0];
        yield put({
          type: "saveFlowJobs",
          payload: {
            flow,
            jobs,
          },
        });
      }
    },
    *createFlowJob({ payload }, { call }) {
      const { flowJob, onFinish } = payload;
      const { ...job } = flowJob;
      const resp = yield call(createFlowJob, job);
      if (resp.status === HttpStatus.OK) {
        onFinish();
      } else {
        message.error(mapStatusToErrorMessage(resp));
      }
    },
    *deleteFlowJob({ payload: job }, { call, put }) {
      const resp = yield call(deleteFlowJob, job.id);
      if (resp.status === HttpStatus.OK) {
        yield put({
          type: "getFlowJobs",
          payload: { flowId: job.flowId, projectId: job.projectId },
        });
      } else {
        mapStatusToErrorMessage(resp);
      }
    },
    *getFlowTemplate({ payload }, { call, put }) {
      const { templateId } = payload;
      const resp = yield call(getTemplateById, templateId);

      if (resp.status === HttpStatus.OK) {
        yield put({ type: "saveFlowTemplate", payload: resp.data });
      } else {
        message.error(mapStatusToErrorMessage(resp));
      }
    },
    *updateFlowTurnbackConfig({ payload }, { call, put }) {
      const { flow, onFinish } = payload;
      const resp = yield call(updateFlow, flow);
      if (resp.status === HttpStatus.OK) {
        yield put({
          type: "updateFlow",
          payload: resp.data,
        });
        onFinish();
      } else {
        message.error(mapStatusToErrorMessage(resp));
      }
    },
    *updateFlowJob({ payload }, { call, put }) {
      const { job } = payload;
      const resp = yield call(updateJobV3, job);
      if (resp.status === HttpStatus.OK) {
        yield put({
          type: "saveJob",
          payload: resp.data,
        });
      } else {
        message.error(mapStatusToErrorMessage(resp));
      }
    },
  },
  reducers: {
    saveFlowJobs(state: FlowCreationModelState, { payload }) {
      const { jobs, flow } = payload;
      return {
        ...state,
        flow,
        jobs,
        jobsWithProgress: jobs,
      };
    },
    resetFlowJobs(state: FlowCreationModelState) {
      return {
        ...state,
        flow: null,
        jobsWithProgress: [],
        jobs: [],
      };
    },
    updateFlow(state: FlowCreationModelState, { payload }) {
      return {
        ...state,
        flow: payload,
      };
    },
    saveFlowTemplate(state: FlowCreationModelState, { payload }) {
      return {
        ...state,
        flowTemplate: payload,
      };
    },
    updateProgressInfo(state: FlowCreationModelState, { payload }) {
      const { jobId, progress } = payload;

      const { processedRows, finishedRows, totalRows } =
        progress as JobProgressV3;
      const progressInfo = `${processedRows || finishedRows || 0}/${totalRows}`;

      const jobs = state.jobsWithProgress.map((job) => {
        if (job.id === jobId) {
          return {
            ...job,
            progressInfo,
          };
        }

        return job;
      });

      return {
        ...state,
        jobsWithProgress: jobs,
      };
    },
    saveJob(state: FlowCreationModelState, { payload }) {
      const qaJob = payload;
      const updatedJobs = state.jobsWithProgress.map((job) => {
        if (job.jobType === JobType.QA && qaJob.id === job.id) {
          return qaJob;
        }

        return job;
      });

      return {
        ...state,
        jobsWithProgress: updatedJobs,
      };
    },
  },
};

export default model;
