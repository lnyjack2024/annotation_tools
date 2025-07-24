import type { Effect } from "@umijs/max";
import type { Reducer } from "redux";

import { getBpoDetail, getBPOList, getGlobalTags } from "@/services/vm";
import type { ConnectModel } from "@/types";
import type { BPO, GlobalTag } from "@/types/vm";

export interface BpoManagementModelState {
  bpoList: BPO[];
  bpoCount: number;
  globalTags: GlobalTag[];
  bpoDetail: BPO;
}

interface BpoManagementModel extends ConnectModel<BpoManagementModelState> {
  effects: {
    getBPOList: Effect;
    getGlobalTags: Effect;
    getBPODetail: Effect;
  };
  reducers: {
    saveBPOList: Reducer;
    saveGlobalTags: Reducer;
    saveBPODetail: Reducer;
  };
}

const model: BpoManagementModel = {
  namespace: "bpoManagement",
  state: {
    bpoList: [],
    bpoCount: null,
    globalTags: [],
    bpoDetail: null,
  },
  effects: {
    *getBPOList({ payload }, { call, put }) {
      const resp = yield call(getBPOList, payload);
      yield put({ type: "saveBPOList", payload: resp.data });
    },
    *getGlobalTags(_, { call, put }) {
      const resp = yield call(getGlobalTags);
      yield put({ type: "saveGlobalTags", payload: resp.data });
    },
    *getBPODetail({ payload }, { call, put }) {
      const resp = yield call(getBpoDetail, payload);
      yield put({ type: "saveBPODetail", payload: resp.data });
    },
  },
  reducers: {
    saveBPOList(state, { payload }) {
      const { results = [], totalElements = 0 } = payload || {};
      return {
        ...state,
        bpoList: results,
        bpoCount: totalElements,
      };
    },
    saveGlobalTags(state, { payload }) {
      return {
        ...state,
        globalTags: payload,
      };
    },
    saveBPODetail(state, { payload }) {
      return {
        ...state,
        bpoDetail: payload,
      };
    },
  },
};

export default model;
