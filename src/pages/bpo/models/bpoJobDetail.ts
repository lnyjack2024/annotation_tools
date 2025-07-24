import type { Effect, Subscription } from "@umijs/max";
import type { Reducer } from "redux";
import { pathToRegexp } from "path-to-regexp";
import { history } from "@umijs/max";

import { HttpStatus } from "@/types/http";
import type {
  Job,
  JobExtraInfo,
  JobWorkerQuality,
  JobWorkerWorkload,
  WorkerScore,
} from "@/types/job";
import type { WorkerJob } from "@/types/task";
import type { Template } from "@/types/template";
import type { DatasetBatch } from "@/types/dataset";
import {
  downloadBpoJobWorkload,
  getBPODataList,
  getBpoJobDetail,
  getBpoJobWorkload,
  updateBpoJobTimeout,
} from "@/services/bpo";
import type { ConnectState } from "@/models/connect";
import { mapStatusToErrorMessage, SPLIT_REG } from "@/utils/utils";
import { WorkflowDataRecord } from "@/types/v3";
import { DEFAULT_PAGE_SIZE } from "@/utils/constants";
import { DataState } from "@/pages/project/data-center/components/DataList";
import { getTemplateIdByJobId } from "@/services/template-v3";
import { dateFormat } from "@/utils/time-util";
import {
  StatisticsTimeGranularity,
  WorkloadFilterParam,
} from "@/pages/project/models/analysis";

type BPODataListFilter = {
  state?: DataState[];
  recordIds?: string;
  uniqueName?: string;
  pageIndex: number;
  pageSize: number;
};

export type AnalysisState = {
  total: number;
  data: [];
  filter: WorkloadFilterParam;
};

export type JobDetailModelState = {
  jobDisplayId: string;
  job: Job;
  exportVisible: boolean;
  progress: JobExtraInfo["progressInfo"];
  workers: WorkerJob[];
  totalWorkers: number;
  workerEmails: string[];
  template: Template;
  timeGranularity: StatisticsTimeGranularity;
  workload: JobWorkerWorkload[];
  analysis: AnalysisState;
  quality: JobWorkerQuality[];
  workersScore: WorkerScore[];
  totalWorkersScore: number;
  allWorkers: WorkerJob[];
  batches: DatasetBatch[];
  selectedBatchIds: string;
  filter?: BPODataListFilter;
  sorter?: Record<string, any>;
  data?: WorkflowDataRecord[];
  selectedData?: WorkflowDataRecord[];
  total?: number;
  finished: boolean;
  visible: {
    detailVisible: boolean;
    releaseVisible: boolean;
  };
};

export type BpoJobModel = {
  namespace: string;
  state: JobDetailModelState;
  subscriptions: {
    setup: Subscription;
  };
  effects: {
    getBpoJob: Effect;
    getTemplateByJobId: Effect;
    updateJobTimeout: Effect;
    getBpoJobData: Effect;
    getWorkloadList: Effect;
    downloadWorkloadList: Effect;
  };
  reducers: {
    saveBpoJob: Reducer;
    saveBpoJobData: Reducer;
    saveTemplate: Reducer;
    updateSorter: Reducer;
    updateFilter: Reducer;
    updateSelectedData: Reducer;
    toggleFinished: Reducer;
    toggleVisible: Reducer;
    resetDataState: Reducer;
    updateWorkload: Reducer;
    updateTimeGranularity: Reducer;
    // updateExportVisible: Reducer;
  };
};

const defaultFilter: BPODataListFilter = {
  pageSize: DEFAULT_PAGE_SIZE,
  pageIndex: 0,
};

const defaultVisible = {
  detailVisible: false,
  releaseVisible: false,
};

const defaultDataState: Partial<JobDetailModelState> = {
  filter: {
    ...defaultFilter,
  },
  sorter: {},
  data: [],
  selectedData: [],
  total: 0,
};

const model: BpoJobModel = {
  namespace: "bpoJob",
  state: {
    jobDisplayId: "",
    job: null,
    exportVisible: false,
    progress: null,
    workers: [],
    totalWorkers: null,
    workerEmails: [],
    template: null,
    timeGranularity: StatisticsTimeGranularity.Day,
    workload: [],
    analysis: {
      total: 0,
      data: [],
      filter: { ...defaultFilter },
    },
    quality: [],
    workersScore: [],
    totalWorkersScore: null,
    allWorkers: [],
    batches: [],
    selectedBatchIds: "",
    finished: false,
    visible: {
      ...defaultVisible,
    },
    ...defaultDataState,
  },
  subscriptions: {
    setup({ dispatch }): void {
      // @ts-ignore
      history.listen(({ location }): void => {
        const { pathname } = location;
        const parsedLocation = pathToRegexp("/bpo-job/:jobId/:tab").exec(
          pathname
        );
        if (parsedLocation) {
          const jobId = parsedLocation[1];
          dispatch({ type: "getBpoJob", payload: { jobId } });
        }
      });
    },
  },
  effects: {
    *getBpoJob({ payload }, { call, put, select }) {
      const { jobId, needToUpdate = false } = payload;
      const currentJob: Job = yield select(
        (state: ConnectState) => state.bpoJob.job
      );
      if (!currentJob || currentJob.id !== jobId || needToUpdate) {
        const resp = yield call(getBpoJobDetail, jobId);
        if (resp.status === HttpStatus.OK) {
          yield put({ type: "saveBpoJob", payload: resp.data });
        }
      }
    },
    *getTemplateByJobId({ payload }, { call, put }) {
      const { jobId } = payload;
      const resp = yield call(getTemplateIdByJobId, jobId);
      yield put({ type: "saveTemplate", payload: resp.data });
    },
    *updateJobTimeout({ payload }, { call, put }) {
      const { jobId, timeout, onSuccess, onError } = payload;
      const resp = yield call(updateBpoJobTimeout, jobId, timeout);
      if (resp.status === HttpStatus.OK) {
        yield put({
          type: "getBpoJob",
          payload: { jobId, needToUpdate: true },
        });
        onSuccess();
      } else {
        onError(mapStatusToErrorMessage(resp));
      }
    },
    *getBpoJobData(_, { call, put, select }) {
      const { job, filter, sorter, finished } = yield select(
        (state: ConnectState) => state.bpoJob
      );
      const { id: jobId, projectId, qaCycleOrder, flowId } = job;
      const resp = yield call(getBPODataList, {
        jobId,
        projectId,
        cycle: qaCycleOrder || 0,
        flowId,
        finished,
        ...filter,
        ...sorter,
        recordIds: filter?.recordIds
          ? filter?.recordIds.trim().split(/[,\s]/g)
          : [],
      });
      if (resp.status === HttpStatus.OK) {
        yield put({ type: "saveBpoJobData", payload: resp.data });
      }
    },
    *getWorkloadList({ payload }, { call, put, select }) {
      const { timeGranularity, analysis, job } = yield select(
        (state: ConnectState) => state.bpoJob
      );
      const { filter } = analysis;
      const { projectId, flowId } = job || {};
      const { date, nickName, ...restFilter } = filter;
      const resp = yield call(getBpoJobWorkload, {
        projectId,
        flowIds: [flowId],
        ...restFilter,
        nickNames: nickName ? nickName.trim().split(SPLIT_REG) : null,
        statDimension: timeGranularity,
        dateStart: date?.[0] ? dateFormat(date?.[0], "YYYY-MM-DD") : null,
        dateEnd: date?.[1] ? dateFormat(date?.[1], "YYYY-MM-DD") : null,
      });
      if (resp.status === HttpStatus.OK) {
        yield put({
          type: "updateWorkload",
          payload: {
            total: resp.data.totalElements,
            data: resp.data.results,
          },
        });
      }
    },
    *downloadWorkloadList({ callback }, { call, put, select }) {
      const { timeGranularity, workload, job } = yield select(
        (state: ConnectState) => state.bpoJob
      );
      const { filter } = workload;
      const { projectId, flowId } = job || {};
      const { pageSize, pageIndex, nickName, date, ...restFilter } = filter;
      const resp = yield call(downloadBpoJobWorkload, {
        projectId,
        flowIds: [flowId],
        ...restFilter,
        nickNames: nickName ? nickName.trim().split(SPLIT_REG) : null,
        statDimension: timeGranularity,
        dateStart: date?.[0] ? dateFormat(date?.[0], "YYYY-MM-DD") : null,
        dateEnd: date?.[1] ? dateFormat(date?.[1], "YYYY-MM-DD") : null,
      });
      callback(resp);
      // yield put({
      //   type: 'updateExportVisible',
      //   payload: false,
      // });
    },
  },
  reducers: {
    saveBpoJob(state, { payload }) {
      return {
        ...state,
        job: payload,
      };
    },
    saveBpoJobData(state, { payload }) {
      return {
        ...state,
        data: payload.results,
        total: payload.totalElements,
      };
    },
    saveTemplate(state: JobDetailModelState, { payload: template }) {
      return { ...state, template };
    },
    updateSorter(state: JobDetailModelState, { payload }) {
      return {
        ...state,
        sorter: payload,
      };
    },
    updateFilter(state: JobDetailModelState, { payload }) {
      return {
        ...state,
        filter: {
          pageSize: state.filter.pageSize,
          pageIndex: state.filter.pageIndex,
          ...payload,
        },
      };
    },
    updateSelectedData(state: JobDetailModelState, { payload }) {
      return {
        ...state,
        selectedData: payload,
      };
    },
    toggleFinished(state: JobDetailModelState, { payload }) {
      return {
        ...state,
        finished: payload,
      };
    },
    toggleVisible(state: JobDetailModelState, { payload }) {
      return {
        ...state,
        visible: {
          ...defaultVisible,
          ...payload,
        },
      };
    },
    resetDataState(state: JobDetailModelState) {
      return {
        ...state,
        ...defaultDataState,
      };
    },
    updateWorkload(state: JobDetailModelState, { payload }) {
      return {
        ...state,
        analysis: {
          ...state.analysis,
          ...payload,
        },
      };
    },
    updateTimeGranularity(state: JobDetailModelState, { payload }) {
      return {
        ...state,
        timeGranularity: payload,
      };
    },
    // updateExportVisible(state: AnalysisModelState, { payload }) {
    //   return {
    //     ...state,
    //     exportVisible: payload,
    //   };
    // },
  },
};

export default model;
