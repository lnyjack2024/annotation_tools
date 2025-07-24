import type { Effect } from "@umijs/max";
import type { Reducer } from "redux";

import { queryCurrent } from "@/services/user";
import { setAuthority, getUserRoles } from "@/utils/authority";

export interface CurrentUser {
  email: string;
  name: string;
  userId: number;
  roles: string[];
  isRequiredUpdatedPassword: boolean;
  emailAuthFlag: EmailAuthFlag | "";
}

export enum EmailAuthFlag {
  FIRST_EMAIL_AUTH = "firstEmailAuth",
  EXPIRED_EMAIL_AUTH = "expiredEmailAuth",
}
export interface UserModelState {
  currentUser?: CurrentUser;
}

export interface UserModelType {
  namespace: string;
  state: UserModelState;
  effects: {
    fetchCurrent: Effect;
  };
  reducers: {
    saveCurrentUser: Reducer<UserModelState>;
  };
}

const UserModel: UserModelType = {
  namespace: "user",
  state: {
    currentUser: {
      userId: 0,
      email: "",
      name: "",
      roles: [],
      isRequiredUpdatedPassword: false,
    },
  },
  effects: {
    *fetchCurrent({ payload: callback }, { call, put }) {
      const response = yield call(queryCurrent);
      const currentUser: CurrentUser = response.data || {};
      yield put({
        type: "saveCurrentUser",
        payload: currentUser,
      });

      yield put({
        type: "userProfile/initUserProfile",
        payload: currentUser.email,
      });

      const { roles = [] } = currentUser;

      const { convertedRoles } = yield call(getUserRoles, roles);

      setAuthority(convertedRoles);
      callback();
    },
  },

  reducers: {
    saveCurrentUser(state, action) {
      return {
        ...state,
        currentUser: action.payload || {},
      };
    },
  },
};

export default UserModel;
