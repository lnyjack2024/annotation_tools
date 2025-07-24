import { makeAutoObservable, toJS } from 'mobx';
import { isEqual } from 'lodash';
import RootStore from './RootStore';
import { UpdatedShape } from '../types';

/**
 * store for config
 * @class
 */
export default class ShapeStore {
  /**
   * root store
   */
  rootStore: typeof RootStore;

  updatedShapes: UpdatedShape[] = [];

  selectedShapes: number[] | string[] = [];

  constructor(rootStore: typeof RootStore) {
    makeAutoObservable(this, {
      rootStore: false,
    }, {
      autoBind: true,
    });

    this.rootStore = rootStore;
  }

  setUpdatedShapes(shapes: UpdatedShape[]) {
    if (!isEqual(shapes, this.updatedShapes)) {
      this.updatedShapes = shapes;
    }
  }

  setMultiSelectedShape(shapes: number[] | string[]) {
    this.selectedShapes = shapes;
  }
}
