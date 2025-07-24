import type { Effect, Subscription } from "@umijs/max";
import type { Reducer } from "redux";
import { history } from "@umijs/max";
import {
  getProjectUsers,
  addProjectUser,
  deleteProjectUser,
  getProjectAccess,
  getAllPMs,
} from "@/services/project";
import { HttpStatus } from "@/types/http";
import type { ProjectUser, TenantPM } from "@/types/project";
import { ProjectAccessLevel } from "@/types/project";
import qs from "qs";

export type ProjectAccessModelState = {
  pms: TenantPM[];
  projectUsers: ProjectUser[];
  projectAccess: ProjectAccessLevel | null;
};

export type ProjectAccessModelType = {
  namespace: string;
  state: ProjectAccessModelState;
  subscriptions: {
    setup: Subscription;
  };
  effects: {
    initPage: Effect;
    getProjectAccess: Effect;
    getProjectUsers: Effect;
    deleteProjectUser: Effect;
    addProjectUser: Effect;
    getInternalPMs: Effect;
  };
  reducers: {
    saveProjectUsers: Reducer;
    removeProjectUser: Reducer;
    savePMs: Reducer;
    saveProjectAccess: Reducer;
  };
};

const model: ProjectAccessModelType = {
  namespace: "projectAccess",
  state: {
    projectUsers: [],
    pms: [],
    projectAccess: null,
  },
  subscriptions: {
    setup({ dispatch }): void {
      // @ts-ignore
      history.listen(({ location }) => {
        const { pathname, search } = location;
        if (pathname === "/project-access") {
          const query = qs.parse(search, { ignoreQueryPrefix: true });
          const { projectId } = query;
          dispatch({ type: "initPage", payload: projectId });
        }
      });
    },
  },
  effects: {
    *initPage({ payload: projectId }, { call, put }) {
      const resp = yield call(getProjectAccess, projectId);
      if (resp.status === HttpStatus.OK) {
        const access = resp.data;
        yield put({ type: "saveProjectAccess", payload: access });
        if (access === ProjectAccessLevel.ADMIN) {
          yield put({ type: "getProjectUsers", payload: projectId });
          yield put({ type: "getInternalPMs" });
        }
      }
    },
    *getProjectAccess({ payload: projectId }, { call, put }) {
      const resp = yield call(getProjectAccess, projectId);
      if (resp.status === HttpStatus.OK) {
        yield put({ type: "saveProjectAccess", payload: resp.data });
      }
    },
    *getProjectUsers({ payload: projectId }, { call, put }) {
      const resp = yield call(getProjectUsers, projectId);
      if (resp.status === HttpStatus.OK) {
        yield put({ type: "saveProjectUsers", payload: resp.data.results });
      }
    },
    *deleteProjectUser({ payload }, { call, put }) {
      const { projectId, userUniqueName } = payload;
      const resp = yield call(deleteProjectUser, projectId, userUniqueName);
      if (resp.status === HttpStatus.OK) {
        yield put({ type: "removeProjectUser", payload: userUniqueName });
      }
    },
    *addProjectUser({ payload }, { call, put }) {
      const { projectId, userUniqueName, status } = payload;
      const resp = yield call(
        addProjectUser,
        projectId,
        userUniqueName,
        status
      );
      if (resp.status === HttpStatus.OK) {
        yield put({ type: "getProjectUsers", payload: projectId });
      }
    },
    *getInternalPMs(_, { call, put }) {
      const resp = yield call(getAllPMs);
      if (resp.status === HttpStatus.OK) {
        yield put({ type: "savePMs", payload: resp.data });
      }
    },
  },
  reducers: {
    saveProjectUsers(state: ProjectAccessModelState, { payload }) {
      return {
        ...state,
        projectUsers: payload,
      };
    },
    removeProjectUser(
      state: ProjectAccessModelState,
      { payload: userUniqueName }
    ) {
      return {
        ...state,
        projectUsers: state.projectUsers.filter(
          (item) => item.userUniqueName !== userUniqueName
        ),
      };
    },
    savePMs(state: ProjectAccessModelState, { payload }) {
      return {
        ...state,
        pms: payload,
      };
    },
    saveProjectAccess(state: ProjectAccessModelState, { payload }) {
      return {
        ...state,
        projectAccess: payload,
      };
    },
  },
};

export default model;
