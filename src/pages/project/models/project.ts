import { history as router } from "@umijs/max";
import type { Effect, Subscription, Reducer } from "@umijs/max";
import { message } from "antd";

import {
  createProject,
  getProjects,
  deleteProject,
  getProject,
} from "@/services/project";
import { HttpStatus } from "@/types/http";
import type { Project } from "@/types/project";
import { mapStatusToErrorMessage } from "@/utils/utils";
import type { ConnectState } from "@/models/connect";
import type { BaseResp } from "@/types/common";
import qs from "qs";

export type ProjectModelState = {
  projects: Project[];
  currentProject: Project;
};

export type ProjectModelType = {
  namespace: string;
  state: ProjectModelState;
  subscriptions: {
    setup: Subscription;
  };
  effects: {
    getProjects: Effect;
    createProject: Effect;
    deleteProject: Effect;
    updateProject: Effect;
    getProject: Effect;
  };
  reducers: {
    saveProjects: Reducer<ProjectModelState>;
    resetProjects: Reducer<ProjectModelState>;
    saveCurrentProject: Reducer<ProjectModelState>;
    removeProject: Reducer<ProjectModelState>;
  };
};

const model: ProjectModelType = {
  namespace: "project",
  state: {
    projects: [],
    currentProject: null,
  },
  subscriptions: {
    setup({ dispatch }): void {
      // @ts-ignore
      router.listen(({ location }): void => {
        const { pathname, search } = location;
        if (pathname === "/projects") {
          const query = qs.parse(search, { ignoreQueryPrefix: true });
          dispatch({ type: "getProjects", payload: query });
        }
      });
    },
  },
  effects: {
    *getProject({ payload }, { call, put, select }) {
      const { currentProject } = yield select(
        (state: ConnectState) => state.project
      );
      const { projectId } = payload;
      if (currentProject?.id === projectId) {
        return;
      }
      const resp = yield call(getProject, projectId);
      const { data: project } = resp;
      yield put({ type: "saveCurrentProject", payload: project });
    },
    *getProjects({ payload: query }, { call, put }) {
      const resp: BaseResp<Project[]> = yield call(getProjects, query);
      if (resp.status === HttpStatus.OK) {
        yield put({ type: "saveProjects", payload: resp.data });
      }
    },
    *createProject({ payload }, { call, put }) {
      const { project, onError, onSuccess } = payload;
      const resp = yield call(createProject, project);
      if (resp.status === HttpStatus.OK) {
        if (onSuccess) {
          onSuccess();
        } else {
          // @ts-ignore
          yield put(router.push("/projects"));
        }
      } else {
        onError(resp);
      }
    },
    *deleteProject({ payload: projectId }, { call, put }) {
      const resp = yield call(deleteProject, projectId);
      if (resp.status === HttpStatus.OK) {
        yield put({ type: "removeProject", payload: projectId });
      } else {
        message.error(mapStatusToErrorMessage(resp));
      }
    },
    *updateProject({ payload }, { call }) {
      const { project, onError, onSuccess } = payload;
      const resp = yield call(createProject, project);
      if (resp.status !== HttpStatus.OK) {
        onError(resp);
      } else {
        onSuccess();
      }
    },
  },
  reducers: {
    saveProjects(state: ProjectModelState, { payload: projects }) {
      return {
        ...state,
        projects,
      };
    },
    resetProjects(state: ProjectModelState) {
      return {
        ...state,
        projects: [],
      };
    },
    removeProject(state: ProjectModelState, { payload: projectId }) {
      return {
        ...state,
        projects: state.projects.filter((proj) => proj.id !== projectId),
      };
    },
    saveCurrentProject(state: ProjectModelState, { payload: project }) {
      return {
        ...state,
        currentProject: project,
      };
    },
  },
};

export default model;
