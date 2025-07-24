import { observable, computed, action, makeObservable } from 'mobx';
import { RootStoreType } from './RootStore';
import { UpdatedShape, CategoryPathShapeStatus, InstanceStatus, GroupStatus, Review, HandleStatus } from '../types';

export interface StatusItem {
  before: Status[];
  after: Status[];
}

export type Status =
  { type: 'shape'; status: UpdatedShape; } |
  { type: 'pointCategory-path-shape'; status: CategoryPathShapeStatus; } |
  { type: 'instance'; status: InstanceStatus; } |
  { type: 'group'; status: GroupStatus; } |
  { type: 'reviews'; status: Review[]; } |
  { type: 'handle'; status: HandleStatus[]; };

class UndoStore {
  rootStore: RootStoreType;

  savedStatus: StatusItem[] = [];

  pointer = 0;

  actionPointer = 0;

  constructor(rootStore: RootStoreType) {
    makeObservable(this, {
      pointer: observable,
      undo: action,
      redo: action,
      saveStatus: action
    });
    this.rootStore = rootStore;
  }

  @computed get undoDisabled() {
    return this.pointer <= 0;
  }

  @computed get redoDisabled() {
    return this.pointer >= this.savedStatus.length;
  }

  undo() {
    if (this.pointer > 0) {
      this.pointer -= 1;
      this.actionPointer -= 1;
      return this.savedStatus[this.pointer];
    }
    return null;
  }

  redo() {
    if (this.pointer < this.savedStatus.length) {
      this.pointer += 1;
      this.actionPointer += 1;
      return this.savedStatus[this.pointer - 1];
    }
    return null;
  }

  saveStatus(before: Status[], after: Status[], insertPrev = false) {
    this.savedStatus = this.savedStatus.slice(0, this.pointer);
    const lenIndex = this.savedStatus.length - 1;
    if (insertPrev && lenIndex >= 0) {
      const { before: prevBefore, after: prevAfter } = this.savedStatus[lenIndex];
      this.savedStatus[lenIndex] = {
        before: [...prevBefore, ...before],
        after: [...prevAfter, ...after]
      };
    } else {
      this.savedStatus.push({ before, after });
      if (this.savedStatus.length > 30) {
        this.savedStatus.shift();
      } else {
        this.pointer += 1;
      }
    }
    this.actionPointer += 1;
  }
}

export default UndoStore;
