import { history } from "@umijs/max";
import { message } from "antd";
import type { Effect } from "@umijs/max";
import { getPageQuery, mapStatusToErrorMessage } from "@/utils/utils";
import { login, logout } from "@/services/user";
import { HttpStatus } from "@/types/http";
import { purgeLocalStorage } from "@/utils/storage";

export enum UserInactiveReason {
  NOT_CONFIRMED = "NOT_CONFIRMED",
  MODIFIED = "MODIFIED",
}

export interface LoginModelType {
  namespace: string;
  state: {};
  effects: {
    login: Effect;
    logout: Effect;
    redirectByURL: Effect;
  };
}

const Model: LoginModelType = {
  namespace: "login",
  state: {},
  effects: {
    *login({ payload }, { call, put }) {
      const { params, onFail, onSuccess } = payload;
      const response = yield call(login, params);
      if (response.status === HttpStatus.OK) {
        if (onSuccess) {
          yield call(onSuccess);
        }
        yield put({ type: "redirectByURL", payload: response.data });
      } else if (onFail) {
        onFail(response);
      } else {
        message.error(mapStatusToErrorMessage(response));
      }
    },
    *logout({ payload }, { call, put }) {
      const { redirect = null } = payload || {};
      const response = yield call(logout);

      if (response.status === HttpStatus.OK) {
        purgeLocalStorage();

        if (window.location.hash !== "#/user/login") {
          let url = redirect
            ? `/user/login?redirect=${redirect}`
            : "/user/login";

          yield put(history.replace(url));
        }
      }
    },
    *redirectByURL(_, { put }) {
      const urlParams = new URL(window.location.href);
      const params = getPageQuery();
      let { redirect } = params as { redirect: string };
      if (redirect) {
        redirect = atob(redirect);
        const redirectUrlParams = new URL(redirect);
        if (redirectUrlParams.origin === urlParams.origin) {
          redirect = redirect.substr(urlParams.origin.length);
          if (redirect.match(/^\/.*#/)) {
            redirect = redirect.substring(0, redirect.indexOf("#"));
          }
        } else {
          window.location.href = "/";
          return;
        }
      }
      yield put(history.replace(redirect || "/"));
    },
  },
};

export default Model;
