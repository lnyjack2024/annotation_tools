import { makeAutoObservable } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import CameraData from './CameraData';
import Instance from './Instance';
import { CameraData as ICameraData, InstanceItem as IInstanceItem, FrameData as IFrameData, CategoryItem } from '../types';
import { ShapeData, ShapeType } from '../../common/shapes/types';

interface InstanceItemOptions {
  id?: string;
  instance: Instance;
  categoryItemRef: CategoryItem;
  number: number;
  cameras?: ICameraData[];
}

interface ChangedState {
  prevState?: IInstanceItem;
  currState?: IInstanceItem;
}

/**
 * instance item
 * @class
 */
export default class InstanceItem {
  /**
   * instance item id
   * @member
   */
  id: string;

  /**
   * instance which belongs to
   * @member
   */
  instance: Instance;

  /**
   * category item reference
   * @member
   */
  categoryItemRef: CategoryItem;

  /**
   * instance item number
   * @member
   */
  number: number;

  /**
   * instance item camera data
   * @member
   */
  cameras: { [camera: string]: CameraData } = {};

  /**
   * is instance item selected
   * @member
   */
  selected = false;

  /**
   * instance item name
   * @getter
   */
  get name() {
    return this.categoryItemRef.name;
  }

  /**
   * instance item label
   * @getter
   */
  get label() {
    if (this.instance.isSingle) {
      return this.instance.label;
    }
    return `${this.instance.label}-${this.itemLabel}`;
  }

  /**
   * instance item label only
   * @getter
   */
  get itemLabel() {
    let label = this.categoryItemRef.displayName;
    if (this.instance.isSingle) {
      label = this.instance.categoryRef.displayName;
    }
    if (this.isSingle) {
      return label;
    }
    return `${label}${this.number}`;
  }

  /**
   * instance item frame status (merged status)
   * @getter
   */
  get frameStatus() {
    // simple merge
    return Object.values(this.cameras)
      .map((c) => c.frameStatus)
      .reduce((acc, curr) => ({ ...acc, ...curr }), {});
  }

  /**
   * instance item existed camera names
   * @getter
   */
  get existedCameras() {
    return Object.keys(this.cameras).filter((cameraName) => !this.cameras[cameraName].isEmpty);
  }

  /**
   * is instance item empty
   * @getter
   */
  get isEmpty() {
    return Object.values(this.cameras).every((camera) => camera.isEmpty);
  }

  /**
   * is instance item only contains one shape
   * @getter
   */
  get isSingle() {
    return this.categoryItemRef.count === 1;
  }

  constructor({ id, instance, categoryItemRef, number, cameras = [] }: InstanceItemOptions) {
    makeAutoObservable(this, {
      id: false,
      instance: false,
      categoryItemRef: false,
      isEmpty: false,
      isSingle: false,
    }, {
      autoBind: true,
    });

    this.id = id || uuidv4();
    this.instance = instance;
    this.categoryItemRef = categoryItemRef;
    this.number = number;
    cameras.forEach((camera) => this.createCameraFromData(camera));
  }

  /**
   * create camera from structured camera data
   * @param cameraData
   */
  createCameraFromData(cameraData: ICameraData) {
    const camera = new CameraData({
      camera: cameraData.camera,
      frames: cameraData.frames,
      instanceItem: this,
      getNextShapeOrder: this.instance.getNextShapeOrder,
    });
    this.cameras[camera.camera] = camera;
  }

  /**
   * set selected
   * @param selected
   */
  setSelected(selected: boolean) {
    this.selected = selected;
  }

  /**
   * get camera
   * @param camera
   */
  getCamera(camera: string) {
    if (!this.cameras[camera]) {
      // create camera if not exist
      this.createCameraFromData({ camera, frames: [] });
    }
    return this.cameras[camera];
  }

  /**
   * set attributes in frame
   * @param camera
   * @param frames
   * @param attributes
   */
  setAttributes(camera: string, frames: number[], attributes: { attributes?: any }) {
    const cameraData = this.getCamera(camera);
    const { prevState, currState } = cameraData.setAttributes(frames, attributes);
    return this.formatChangedState(
      prevState ? [prevState] : [],
      currState ? [currState] : [],
    );
  }

  /**
   * set attributes by frame
   * @param camera
   * @param frameAttributesMap
   */
  setAttributesByFrame(camera: string, frameAttributesMap: { [frameIndex: number]: { attributes?: any } }) {
    const cameraData = this.getCamera(camera);
    const { prevState, currState } = cameraData.setAttributesByFrame(frameAttributesMap);
    return this.formatChangedState(
      prevState ? [prevState] : [],
      currState ? [currState] : [],
    );
  }

  /**
   * add shape in frame
   * @param camera
   * @param frameIndex
   * @param interpolation
   * @param shapeType
   * @param shapeData
   * @param order
   */
  addShape(camera: string, frameIndex: number, interpolation: boolean, shapeType: ShapeType, shapeData: ShapeData, order?: number): ChangedState {
    const cameraData = this.getCamera(camera);
    const { prevState, currState } = cameraData.addShape(frameIndex, interpolation, shapeType, shapeData, order);
    return this.formatChangedState(
      prevState ? [prevState] : [],
      currState ? [currState] : [],
    );
  }

  /**
   * update shape in frame
   * @param camera
   * @param frameIndex
   * @param interpolation
   * @param shapeType
   * @param shapeData
   * @param order
   * @param attributes
   */
  updateShape(camera: string, frameIndex: number, interpolation: boolean, shapeType: ShapeType, shapeData: ShapeData, order?: number, attributes?: any) {
    const cameraData = this.getCamera(camera);
    const { prevState, currState } = cameraData.updateShape(frameIndex, interpolation, shapeType, shapeData, order, attributes);
    return this.formatChangedState(
      prevState ? [prevState] : [],
      currState ? [currState] : [],
    );
  }

  /**
   * predict shape
   * @param camera
   * @param frameIndex
   * @param imageBounds
   * @param useNearest
   */
  predictShape(camera: string, frameIndex: number, imageBounds?: { top: number; right: number; bottom: number; left: number }, useNearest?: boolean) {
    const cameraData = this.getCamera(camera);
    return cameraData.predictShape(frameIndex, imageBounds, useNearest);
  }

  /**
   * remove from frames
   * @param camera
   * @param frames
   */
  remove(camera: string, frames: number[]) {
    const cameraData = this.getCamera(camera);
    const { prevState, currState } = cameraData.remove(frames);
    if (cameraData.isEmpty) {
      // delete camera
      delete this.cameras[camera];
    }
    return this.formatChangedState(
      prevState ? [prevState] : [],
      currState ? [currState] : [],
    );
  }

  /**
   * update frames by frame data
   * @param camera
   * @param frames
   */
  updateFramesFromData(camera: string, frames: IFrameData[]) {
    const cameraData = this.getCamera(camera);
    const { prevState, currState } = cameraData.updateFramesFromData(frames);
    return this.formatChangedState(
      prevState ? [prevState] : [],
      currState ? [currState] : [],
    );
  }

  /**
   * return structured data
   */
  toJSON(): IInstanceItem {
    return {
      ...this.getBasicInfo(),
      cameras: Object.values(this.cameras)
        .filter((camera) => !camera.isEmpty)
        .map((camera) => camera.toJSON()),
    };
  }

  /**
   * return basic info data
   */
  getBasicInfo() {
    return {
      id: this.id,
      name: this.name,
      displayName: this.categoryItemRef.displayName,
      displayColor: this.categoryItemRef.displayColor,
      number: this.number,
    };
  }

  /**
   * format changed state
   * @param prevState
   * @param currState
   */
  formatChangedState(prevState: ICameraData[], currState: ICameraData[]): ChangedState {
    const basicInfo = this.getBasicInfo();
    return {
      ...prevState.length > 0 && {
        prevState: { ...basicInfo, cameras: [...prevState] },
      },
      ...currState.length > 0 && {
        currState: { ...basicInfo, cameras: [...currState] },
      },
    };
  }
}
