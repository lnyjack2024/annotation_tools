import { makeAutoObservable, toJS } from 'mobx';
import { isEqual } from 'lodash';
import RootStore from './RootStore';
import { Status } from './UndoStore';
import { Handle, HandleStatus, UpdatedShape } from '../types';

export interface FrameHandleMap {
  [pathId: string]: {
    [pointIndex: number]: Handle;
  };
};

export interface HandleMap {
  [frameIndex: number]: FrameHandleMap;
}

/**
 * store for handle
 * @class
 */
export default class HandleStore {
  /**
   * root store
   */
  rootStore: typeof RootStore;

  handleMap: HandleMap = {};

  updatedHandles: HandleMap = {};

  constructor(rootStore: typeof RootStore) {
    makeAutoObservable(this, {
      rootStore: false,
      handleMap: false,
    }, {
      autoBind: true,
    });

    this.rootStore = rootStore;
  }

  init(handles: Handle[]) {
    const handleMap: {
      [frameIndex: number]: {
        [pathId: string]: {
          [index: number]: Handle;
        }
      }
    } = {};
    handles.forEach((h) => {
      const { frameIndex, pathId, pointIndex } = h;
      if (!handleMap[frameIndex]) {
        handleMap[frameIndex] = {};
      }
      if (!handleMap[frameIndex][pathId]) {
        handleMap[frameIndex][pathId] = {};
      }
      handleMap[frameIndex][pathId][pointIndex] = h;
    });
    this.setHandleMap(handleMap);
  }

  setHandleMap(handleMap: HandleMap) {
    this.handleMap = handleMap;
  }

  saveHandles(handles: Handle[]) {
    if (this.rootStore.shape.updatedShapes.length !== 0) return;
    const handleMap = { ...this.handleMap };
    handles.forEach((handle) => {
      const { pathId, pointIndex: index, frameIndex } = handle;
      if (!handleMap[frameIndex]) {
        handleMap[frameIndex] = {};
      }
      if (!handleMap[frameIndex][pathId]) {
        handleMap[frameIndex][pathId] = {};
      }
      handleMap[frameIndex][pathId][index] = handle;
    });
    this.setHandleMap(handleMap);
  }

  updateHandle(handle: Handle, initialHandle: Handle) {
    const { pathId, pointIndex, frameIndex } = handle;
    const prevHandle = this.handleMap[frameIndex]?.[pathId]?.[pointIndex] || null;
    const handleMap = { ...this.handleMap };
    if (!handleMap[frameIndex]) {
      handleMap[frameIndex] = {};
    }
    if (!handleMap[frameIndex][pathId]) {
      handleMap[frameIndex][pathId] = {};
    }
    handleMap[frameIndex][pathId][pointIndex] = handle;
    this.setHandleMap(handleMap);
    this.changeHandleUndo(
      [
        { frameIndex, pathId, pointIndex, handle: prevHandle || initialHandle }
      ],
      [
        { frameIndex, pathId, pointIndex, handle }
      ],
    );
  }

  removeHandles(points: UpdatedShape[]) {
    const handleMap = { ...this.handleMap };
    const prevHandles: HandleStatus[] = [];
    const updatedHandles: HandleStatus[] = [];
    points.forEach(({ frameIndex, instanceId, groupName, pointCategory, index }) => {
      const pathId = `${frameIndex}_${instanceId}_${groupName}_${pointCategory}`;
      const handle = handleMap[frameIndex]?.[pathId]?.[index as number];
      if (handle) {
        prevHandles.push({
          frameIndex,
          pathId: handle.pathId,
          pointIndex: handle.pointIndex,
          handle: { ...handle }
        });
        updatedHandles.push({
          frameIndex,
          pathId: handle.pathId,
          pointIndex: handle.pointIndex,
          handle: null
        });
        delete handleMap[frameIndex][pathId][index as number];
        this.setHandleMap(handleMap);
        this.changeHandleUndo(prevHandles, updatedHandles, true);
      }
    });
  }

  changeHandleUndo(
    prevHandles: HandleStatus[],
    updatedHandles: HandleStatus[],
    insertPrev = false
  ) {
    const before: Status[] = [];
    const after: Status[] = [];
    before.push({ type: 'handle',
      status: [
        ...prevHandles,
      ]
    });
    after.push({ type: 'handle',
      status: [
        ...updatedHandles,
      ]
    });
    this.rootStore.undo.saveStatus(before, after, insertPrev);
  }

  changeFrame(frameIndex: number) {
    const currentFrameHandles = toJS(this.handleMap[frameIndex]);
    if (currentFrameHandles) {
      this.updatedHandles = { [frameIndex]: currentFrameHandles };
    }
  }

  setUpdatedHandles(handles: HandleStatus[]) {
    const updatedHandles: HandleMap = {};
    const handleMap = { ...this.handleMap };
    handles.forEach(({ frameIndex, pathId, pointIndex: index, handle }) => {
      if (handle) {
        if (!handleMap[frameIndex]) {
          handleMap[frameIndex] = {};
        }
        if (!handleMap[frameIndex][pathId]) {
          handleMap[frameIndex][pathId] = {};
        }
        handleMap[frameIndex][pathId][index] = handle;

        if (!updatedHandles[frameIndex]) {
          updatedHandles[frameIndex] = {};
        }
        if (!updatedHandles[frameIndex][pathId]) {
          updatedHandles[frameIndex][pathId] = handleMap[frameIndex][pathId];
        }
      } else {
        delete handleMap[frameIndex]?.[pathId]?.[index];
      }
    });
    if (!isEqual(updatedHandles, this.updatedHandles)) {
      this.setHandleMap(handleMap);
      this.updatedHandles = toJS(updatedHandles);
    }
  };

  setPathHandles(frameIndex: number, pathId: number, handles: { [pointIndex: number]: Handle }) {
    const handleMap = { ...this.handleMap };
    handleMap[frameIndex] = {
      ...handleMap[frameIndex],
      [pathId]: handles,
    };
    this.setHandleMap(handleMap);
  }

  getPathHandles(frame: number, pId: string) {
    return Object.values(this.handleMap[frame]?.[pId] || {}).sort((a, b) => a.pointIndex - b.pointIndex);
  }

  getHandles() {
    const handles: Handle[] = [];
    Object.values(toJS(this.handleMap)).forEach((frameHandles: FrameHandleMap) => {
      Object.values(frameHandles).forEach((hs) => {
        Object.values(hs).forEach((h) => {
          handles.push(h);
        });
      });
    });
    return handles;
  }
};
