import type { Effect, Reducer } from "@umijs/max";

import { getProjectDataList } from "@/services/project";
import { getFlowWorkload, getFlowProgress } from "@/services/workflow";
import type { WorkflowDataRecord } from "@/types/v3";
import { HttpStatus } from "@/types/http";

export interface FlowStatistic {
  totalWorkHour?: number;
  totalWorkerNum?: number;
  totalRecords?: number;
  finishedRecords?: number;
}

export type FlowDetailModelState = {
  dataList: WorkflowDataRecord[];
  flowStatistic: FlowStatistic;
  current: number;
  total: number;
};

export type FlowDetailModelType = {
  namespace: string;
  state: FlowDetailModelState;
  effects: {
    getFlowDataList: Effect;
    getFlowStatistic: Effect;
  };
  reducers: {
    saveFlowDataList: Reducer<
      FlowDetailModelState,
      {
        type: "saveFlowDataList";
        payload: {
          pageNum: number;
          total: number;
          list: WorkflowDataRecord[];
        };
      }
    >;
    saveFlowStatistic: Reducer;
  };
};

const model: FlowDetailModelType = {
  namespace: "flowDetail",
  state: {
    dataList: [],
    flowStatistic: {},
    current: 0,
    total: 0,
  },
  effects: {
    *getFlowDataList({ payload }, { call, put }) {
      const resp = yield call(getProjectDataList, { ...payload });
      if (resp.status === HttpStatus.OK) {
        yield put({
          type: "saveFlowDataList",
          payload: resp.data,
        });
      }
    },
    *getFlowStatistic({ payload }, { call, put }) {
      const workload = yield call(getFlowWorkload, payload.flowId);
      const progress = yield call(getFlowProgress, payload.flowId);
      if (
        workload.status === HttpStatus.OK &&
        progress.status === HttpStatus.OK
      ) {
        const data = { ...workload.data, ...progress.data };
        yield put({
          type: "saveFlowStatistic",
          payload: data,
        });
      }
    },
  },
  reducers: {
    saveFlowDataList(state, { payload }) {
      const { pageNum, total, list } = payload;
      return {
        ...state,
        dataList: list,
        current: pageNum,
        total,
      };
    },
    saveFlowStatistic(state, { payload }) {
      return {
        ...state,
        flowStatistic: payload,
      };
    },
  },
};

export default model;
