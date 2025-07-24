import type { Effect, Reducer } from "@umijs/max";

import { cancelFileUpload, uploadOriginalZipData } from "@/services/project";
import { HttpStatus } from "@/types";
import { OriginalFileUploadStatus } from "@/types/project";

export type UploadProgressItem = {
  id: number;
  status: OriginalFileUploadStatus;
  total: number;
  loaded: number;
  abortController: null | AbortController;
};

export type UploadProgressState = Record<number, UploadProgressItem>;

export type UploadProgressType = {
  namespace: string;
  state: UploadProgressState;
  effects: {
    uploadOriginalZipData: Effect;
    cancelOriFileUpload: Effect;
  };
  reducers: {
    beforeFileUpload: Reducer<UploadProgressState>;
    updateUploadProgress: Reducer<UploadProgressState>;
    cancelUpload: Reducer<UploadProgressState>;
    uploadFailed: Reducer<UploadProgressState>;
    uploadSucceed: Reducer<UploadProgressState>;
  };
};

const model: UploadProgressType = {
  namespace: "uploadProgress",
  state: {},
  effects: {
    *uploadOriginalZipData({ payload }, { call, put }) {
      const abortController = new AbortController();
      yield put({
        type: "beforeFileUpload",
        payload: {
          id: payload.prjResourceId,
          size: payload.size,
          abortController,
        },
      });
      payload.abortController = abortController;
      try {
        const resp = yield call(uploadOriginalZipData, payload);
        if (resp.status === HttpStatus.OK) {
          yield put({ type: "uploadSucceed", payload: payload.prjResourceId });
        } else {
          throw resp;
        }
      } catch (err) {
        yield put({ type: "uploadFailed", payload: payload.prjResourceId });
      }
    },
    *cancelOriFileUpload({ payload }, { call, put }) {
      const { projectId, prjResourceId, refresh, onError } = payload;
      try {
        const resp = yield call(cancelFileUpload, {
          projectId,
          prjResourceId,
        });
        if (resp.status === HttpStatus.OK) {
          yield put({
            type: "cancelUpload",
            payload: prjResourceId,
          });
          refresh?.();
        } else {
          throw resp;
        }
      } catch (err) {
        onError();
      }
    },
  },
  reducers: {
    beforeFileUpload(state: UploadProgressState, { payload }) {
      const initUploadInfo = {
        id: payload.id,
        status: OriginalFileUploadStatus.RAW_DATA_UPLOADING,
        total: payload.size,
        loaded: 0,
        abortController: payload.abortController,
      };
      return {
        ...state,
        [payload.id]: initUploadInfo,
      };
    },
    updateUploadProgress(state: UploadProgressState, { payload }) {
      const currentFile = state[payload.id];
      if (!currentFile) {
        return state;
      }
      currentFile.loaded = payload.loaded;
      if (payload.loaded > currentFile.total) {
        currentFile.status = OriginalFileUploadStatus.RAW_DATA_UPLOADED;
      }
      return {
        ...state,
        [payload.id]: { ...currentFile },
      };
    },
    cancelUpload(state: UploadProgressState, { payload }) {
      const currentFile = state[payload];
      if (!currentFile) {
        return state;
      }
      currentFile.abortController?.abort?.();
      currentFile.abortController = null;
      currentFile.status = OriginalFileUploadStatus.CANCELLED;
      return {
        ...state,
        [payload]: { ...currentFile },
      };
    },
    uploadFailed(state: UploadProgressState, { payload }) {
      const currentFile = state[payload];
      if (!currentFile) {
        return state;
      }
      currentFile.status = OriginalFileUploadStatus.RAW_DATA_UPLOAD_FAILED;
      currentFile.abortController = null;
      return {
        ...state,
        [payload]: { ...currentFile },
      };
    },
    uploadSucceed(state: UploadProgressState, { payload }) {
      const currentFile = state[payload];
      if (!currentFile) {
        return state;
      }
      currentFile.status = OriginalFileUploadStatus.RAW_DATA_UPLOADED;
      currentFile.abortController = null;
      return {
        ...state,
        [payload]: { ...currentFile },
      };
    },
  },
};

export default model;
