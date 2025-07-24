import type { Reducer } from "redux";
import { DEFAULT_PAGE_SIZE } from "@/utils/constants";
import { DataState } from "@/pages/project/data-center/components/DataList";
import { WorkflowDataRecord } from "@/types/v3";
import { history, Subscription } from "@umijs/max";

import { pathToRegexp } from "path-to-regexp";
import {
  getProjectDataList,
  getProjectDataStatistics,
  releaseData,
} from "@/services/project";
import { HttpStatus } from "@/types/http";
import { Effect } from "@umijs/max";
import { ConnectState } from "@/models/connect";
import { StatisticData } from "@/pages/project/data-center/components/DataStatistics";
import { AuditSheetStatus } from "@/types/dataAudit";
import { turnBackByFlow } from "@/services/turn-back";

export const MAX_EXECUTE_DATA = 100;

type Process = {
  type: "release" | "turnback";
  progress: number;
  successNum: number;
  failureNum: number;
  allNum: number;
};

export type BigDataProcess = Record<string, Process>;

const defaultFilter = {
  pageSize: DEFAULT_PAGE_SIZE,
  pageIndex: 0,
};

export type FilterParam = {
  pageSize: number;
  pageIndex: number;
  recordIds?: string;
  batchNumList?: string[];
  dataType?: string;
  flowJob?: string[][];
  flowIdList?: string[];
  jobIdList?: string[];
  state?: DataState[];
  auditState?: AuditSheetStatus[];
};

type Sort = {
  sortField: string;
  sortOrder: string;
};

export type DataCenterModalVisible = {
  releaseModalVisible: boolean;
  deleteModalVisible: boolean;
  dataMgmtVisible: boolean;
  assignModalVisible: boolean;
  processDataId: number;
  turnBackNewModalVisible: boolean;
  progressModalVisible: boolean;
};

export type DataCenterModelState = {
  projectId: string;
  filter: FilterParam;
  sorter: Sort;
  total: number;
  data: WorkflowDataRecord[];
  selectedData: WorkflowDataRecord[];
  modalVisible: DataCenterModalVisible;
  bigDataProgress: Record<string, any>;
  statistics: StatisticData;
};

const defaultVisible: DataCenterModalVisible = {
  releaseModalVisible: false,
  deleteModalVisible: false,
  dataMgmtVisible: false,
  assignModalVisible: false,
  processDataId: null,
  turnBackNewModalVisible: false,
  progressModalVisible: false,
};

export type DataCenterType = {
  namespace: string;
  state: DataCenterModelState;
  subscriptions: {
    setup: Subscription;
  };
  effects: {
    getList: Effect;
    getStatistics: Effect;
    bigDataAction: Effect;
  };
  reducers: {
    updateProject: Reducer;
    updateFilters: Reducer;
    updateSelectedData: Reducer;
    updateSorter: Reducer;
    updateData: Reducer;
    updateStatistics: Reducer;
    updateVisible: Reducer;
    updateBigDataProgress: Reducer;
    clearProgress: Reducer;
  };
};

const model: DataCenterType = {
  namespace: "dataCenter",
  state: {
    projectId: "",
    filter: {
      ...defaultFilter,
    },
    sorter: null,
    data: [],
    total: 0,
    selectedData: [],
    modalVisible: {
      ...defaultVisible,
    },
    bigDataProgress: {},
    statistics: null,
  },
  subscriptions: {
    setup({ dispatch }): void {
      // @ts-ignore
      history.listen(({ location }): void => {
        const { pathname } = location;
        const [, projectId] =
          pathToRegexp("/projects/:projectId/:tab").exec(pathname) || [];

        if (projectId) {
          dispatch({ type: "updateProject", payload: { projectId } });
        }
      });
    },
  },
  effects: {
    *getList({ payload }, { call, put, select }) {
      const { filter, sorter } = yield select(
        (state: ConnectState) => state.dataCenter
      );
      const resp = yield call(getProjectDataList, {
        projectId: payload.projectId,
        ...filter,
        ...sorter,
        recordIds: filter?.recordIds
          ? filter?.recordIds.trim().split(/[,\s]/g)
          : [],
      });
      if (resp.status === HttpStatus.OK) {
        yield put({ type: "updateData", payload: resp.data });
      }
    },
    *getStatistics({ payload }, { call, put }) {
      const resp = yield call(getProjectDataStatistics, {
        projectId: payload.projectId,
      });
      if (resp.status === HttpStatus.OK) {
        yield put({ type: "updateStatistics", payload: resp.data });
      }
    },
    *bigDataAction({ payload }, { call, put }) {
      const { actionType, projectId, recordIds, callback, ...rest } = payload;
      const times = Math.ceil(recordIds.length / MAX_EXECUTE_DATA);
      const allNum = recordIds.length;
      let currentTime: number = 0;
      yield put({ type: "clearProgress", payload: { projectId } });
      yield put({
        type: "updateBigDataProgress",
        payload: {
          projectId,
          type: actionType,
          progress: currentTime / times,
          successNum: 0,
          failureNum: 0,
          allNum,
        },
      });
      yield put({
        type: "updateVisible",
        payload: { progressModalVisible: true },
      });
      while (recordIds.length > 0) {
        const currentIds = recordIds.splice(0, MAX_EXECUTE_DATA);
        let resp;
        switch (actionType) {
          case "release":
            resp = yield call(releaseData, {
              projectId,
              recordIds: currentIds,
              ...rest,
            });
            break;
          case "turnback":
            resp = yield call(turnBackByFlow, projectId, {
              recordList: currentIds,
              ...rest,
            });
            break;
        }
        currentTime++;
        if (currentTime === times) {
          if (callback) {
            callback();
          }
          yield put({
            type: "updateVisible",
            payload: { progressModalVisible: true },
          });
        }
        yield put({
          type: "updateBigDataProgress",
          payload: {
            projectId,
            type: actionType,
            progress: currentTime / times,
            successNum: resp?.data || 0,
            failureNum: currentIds.length - (resp.data || 0),
            allNum,
          },
        });
      }
    },
  },
  reducers: {
    updateProject(state: DataCenterModelState, { payload }) {
      return {
        ...state,
        projectId: payload.projectId,
        filter: {
          ...(state.projectId === payload.projectId
            ? state.filter
            : defaultFilter),
        },
      };
    },
    updateFilters(state: DataCenterModelState, { payload }) {
      return {
        ...state,
        filter: { ...defaultFilter, ...(payload || {}) },
      };
    },
    updateSelectedData(state: DataCenterModelState, { payload }) {
      return {
        ...state,
        selectedData: payload,
      };
    },
    updateSorter(state: DataCenterModelState, { payload }) {
      return {
        ...state,
        sorter: payload,
      };
    },
    updateData(state: DataCenterModelState, { payload }) {
      return {
        ...state,
        data: payload.results,
        total: payload.totalElements,
      };
    },
    updateStatistics(state: DataCenterModelState, { payload }) {
      return {
        ...state,
        statistics: payload,
      };
    },
    updateVisible(state: DataCenterModelState, { payload }) {
      return {
        ...state,
        modalVisible: {
          ...defaultVisible,
          ...payload,
        },
      };
    },
    updateBigDataProgress(state: DataCenterModelState, { payload }) {
      let currentProgress = state.bigDataProgress[payload.projectId] || {};
      if (currentProgress.type !== payload.type) {
        currentProgress = {
          ...payload,
        };
      } else {
        currentProgress = {
          ...currentProgress,
          allNum: payload.allNum,
          progress: payload.progress,
          successNum: +currentProgress.successNum + +payload.successNum,
          failureNum: +currentProgress.failureNum + +payload.failureNum,
        };
      }
      return {
        ...state,
        bigDataProgress: {
          ...state.bigDataProgress,
          [payload.projectId]: currentProgress,
        },
      };
    },
    clearProgress(state: DataCenterModelState, { payload }) {
      return {
        ...state,
        bigDataProgress: {
          ...state.bigDataProgress,
          [payload.projectId]: null,
        },
      };
    },
  },
};

export default model;
