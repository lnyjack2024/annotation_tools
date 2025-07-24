import { makeAutoObservable } from 'mobx';
import { cloneDeep } from 'lodash';
import FrameData from './FrameData';
import { getLastKeyFrames, getNextKeyFrames, getShapeFromFrames, predictShapeData } from '../utils';
import { CameraData as ICameraData, FrameData as IFrameData } from '../types';
import { ShapeData, ShapeType } from '../../common/shapes/types';
import InstanceItem from './InstanceItem';

interface ChangedState {
  prevState?: ICameraData;
  currState?: ICameraData;
}

interface CameraDataOptions extends ICameraData {
  instanceItem: InstanceItem;
  getNextShapeOrder?: (frameIndex: number, camera: string) => number;
}

/**
 * camera data
 * @class
 */
export default class CameraData {
  /**
   * camera name
   * @member
   */
  camera: string;

  instanceItem: InstanceItem;

  /**
   * shape frame data
   * @member
   */
  frames: { [frameIndex: number]: FrameData } = {};

  /**
   * get next shape order
   * @member
   */
  getNextShapeOrder?: (frameIndex: number, camera: string) => number;

  /**
   * shape frame status (keyframe or not)
   * @getter
   */
  get frameStatus() {
    const status: { [frameIndex: number]: boolean } = {};
    Object.values(this.frames).forEach(({ frameIndex, isKeyFrame }) => {
      status[frameIndex] = isKeyFrame;
    });
    return status;
  }

  /**
   * no frame
   * @getter
   */
  get isEmpty() {
    return Object.keys(this.frames).length <= 0;
  }

  constructor({ camera, frames = [], instanceItem, getNextShapeOrder }: CameraDataOptions) {
    makeAutoObservable(this, {
      camera: false,
      isEmpty: false,
      getNextShapeOrder: false,
    }, {
      autoBind: true,
    });
    this.instanceItem = instanceItem;
    this.getNextShapeOrder = getNextShapeOrder;
    this.camera = camera;
    frames.forEach((frame) => this.createFrameFromData(frame));
  }

  /**
   * create frame from structured frame data
   * @param frameData
   */
  createFrameFromData({ frameIndex, isKeyFrame, shapeType, shape, order, attributes }: IFrameData) {
    const frame = new FrameData({
      frameIndex,
      isKeyFrame,
      shapeType,
      shape,
      order,
      attributes,
    });
    this.frames[frameIndex] = frame;
  }

  /**
   * update frames from structured data
   * @param frames
   */
  updateFramesFromData(frames: IFrameData[]) {
    const prevFrames: { [frameIndex: number]: IFrameData } = {};
    const currFrames: { [frameIndex: number]: IFrameData } = {};
    frames.forEach(({ frameIndex, isKeyFrame, shapeType, shape, order, attributes }, i) => {
      if (this.frames[frameIndex] && !prevFrames[frameIndex]) {
        prevFrames[frameIndex] = this.frames[frameIndex].toJSON();
      }
      this.createFrameFromData({ frameIndex, isKeyFrame, shapeType, shape, order, attributes });

      const isRangeStart = i === 0 || (i > 0 && frames[i].frameIndex - frames[i - 1].frameIndex > 1);
      const isRangeEnd = i === frames.length - 1 || (i < frames.length - 1 && frames[i + 1].frameIndex - frames[i].frameIndex > 1);
      if (isRangeStart || isRangeEnd) {
        this.frames[frameIndex].isKeyFrame = true;
        if (isRangeStart && this.frames[frameIndex - 1]) {
          if (!prevFrames[frameIndex - 1]) {
            prevFrames[frameIndex - 1] = this.frames[frameIndex - 1].toJSON();
          }
          this.frames[frameIndex - 1].isKeyFrame = true;
          currFrames[frameIndex - 1] = this.frames[frameIndex - 1].toJSON();
        }
        if (isRangeEnd && this.frames[frameIndex + 1]) {
          if (!prevFrames[frameIndex + 1]) {
            prevFrames[frameIndex + 1] = this.frames[frameIndex + 1].toJSON();
          }
          this.frames[frameIndex + 1].isKeyFrame = true;
          currFrames[frameIndex + 1] = this.frames[frameIndex + 1].toJSON();
        }
      }

      currFrames[frameIndex] = this.frames[frameIndex].toJSON();
    });
    return this.formatChangedState(Object.values(prevFrames), Object.values(currFrames));
  }

  /**
   * set attributes in frame
   * @param frames
   * @param attributes with ocr text
   */
  setAttributes(frames: number[], { attributes }: { attributes?: any }) {
    const prevState: IFrameData[] = [];
    const currState: IFrameData[] = [];
    frames.forEach((frameIndex) => {
      if (this.frames[frameIndex]) {
        prevState.push(this.frames[frameIndex].toJSON());
        if (attributes) {
          this.frames[frameIndex].attributes = cloneDeep(attributes);
        }
        currState.push(this.frames[frameIndex].toJSON());
      }
    });
    return this.formatChangedState(prevState, currState);
  }

  /**
   * set attributes by frame
   * @param frameAttributesMap
   */
  setAttributesByFrame(frameAttributesMap: { [frameIndex: number]: { attributes?: any } }) {
    const prevState: IFrameData[] = [];
    const currState: IFrameData[] = [];
    Object.keys(frameAttributesMap).forEach((key) => {
      const frameIndex = Number(key);
      const { attributes } = frameAttributesMap[frameIndex];
      if (this.frames[frameIndex]) {
        prevState.push(this.frames[frameIndex].toJSON());
        if (attributes) {
          this.frames[frameIndex].attributes = cloneDeep(attributes);
        }
        currState.push(this.frames[frameIndex].toJSON());
      }
    });
    return this.formatChangedState(prevState, currState);
  }

  /**
   * add shape in frame
   * @param frameIndex
   * @param interpolation
   * @param shapeType
   * @param shapeData
   * @param order
   */
  addShape(frameIndex: number, interpolation: boolean, shapeType: ShapeType, shapeData: ShapeData, order?: number, attributes?: any): ChangedState {
    this.createFrameFromData({
      frameIndex,
      isKeyFrame: true,
      shapeType,
      shape: shapeData,
      order,
      attributes,
    });

    const keyFrame = this.getNearestKeyFrame(frameIndex);
    if (keyFrame >= 0) {
      this.frames[frameIndex].attributes = cloneDeep(this.frames[keyFrame].attributes);
      const { instance } = this.instanceItem;
      const keyFrameDynamicAttributes = instance.dynamicAttributes?.[this.camera]?.[keyFrame]?.attributes;
      instance.setDynamicAttributesByCamera(this.camera, [{ frameIndex, attributes: keyFrameDynamicAttributes }]);
    }

    let prevState: IFrameData[] = [];
    let currState: IFrameData[] = [this.frames[frameIndex].toJSON()];
    if (interpolation) {
      const affectedState = this.interpolate(frameIndex, true);
      prevState = [...prevState, ...affectedState.prevState];
      currState = [...currState, ...affectedState.currState];
    }
    return this.formatChangedState(prevState, currState);
  }

  /**
   * update shape in frame
   * @param frameIndex
   * @param interpolation
   * @param shapeType
   * @param shapeData
   * @param order
   * @param attributes
   */
  updateShape(frameIndex: number, interpolation: boolean, shapeType: ShapeType, shapeData: ShapeData, order?: number, attributes?: any) {
    if (this.frames[frameIndex]) {
      // update
      let prevState: IFrameData[] = [this.frames[frameIndex].toJSON()];
      this.frames[frameIndex].isKeyFrame = true;
      this.frames[frameIndex].shapeType = shapeType;
      this.frames[frameIndex].shape = shapeData;
      if (order !== undefined) {
        this.frames[frameIndex].order = order;
      }
      if (attributes) {
        this.frames[frameIndex].attributes = cloneDeep(attributes);
      }
      let currState: IFrameData[] = [this.frames[frameIndex].toJSON()];

      if (interpolation) {
        const affectedState = this.interpolate(frameIndex);
        prevState = [...prevState, ...affectedState.prevState];
        currState = [...currState, ...affectedState.currState];
      }
      return this.formatChangedState(prevState, currState);
    }

    // add
    return this.addShape(frameIndex, interpolation, shapeType, shapeData, order, attributes);
  }

  /**
   * predict shape
   * @param frameIndex
   * @param imageBounds
   * @param useNearest
   */
  predictShape(frameIndex: number, imageBounds?: { top: number; right: number; bottom: number; left: number }, useNearest = false) {
    let shapeInfo = predictShapeData(frameIndex, this.frames, imageBounds);
    if (useNearest && !shapeInfo) {
      const nearestFrame = this.getNearestKeyFrame(frameIndex);
      if (nearestFrame >= 0) {
        const { shapeType, shape } = this.frames[nearestFrame];
        shapeInfo = { shapeType, shape };
      }
    }
    return shapeInfo;
  }

  /**
   * interpolation
   * @param frameIndex
   * @param shouldInsert
   */
  interpolate(frameIndex: number, shouldInsert = false) {
    const prevState: IFrameData[] = [];
    const currState: IFrameData[] = [];

    const { shapeType } = this.frames[frameIndex];
    const [lastKeyFrame] = getLastKeyFrames(1, frameIndex, this.frames);
    const [nextKeyFrame] = getNextKeyFrames(1, frameIndex, this.frames);
    const updateFrameData = (frame: number, shape: ShapeData, insert: boolean, frameData?: FrameData) => {
      if (this.frames[frame]) {
        prevState.push(this.frames[frame].toJSON());
        this.frames[frame].isKeyFrame = false;
        this.frames[frame].shape = shape;
        this.frames[frame].shapeType = shapeType;
        currState.push(this.frames[frame].toJSON());
      } else if (insert) {
        this.createFrameFromData({
          frameIndex: frame,
          isKeyFrame: false,
          shapeType,
          shape,
          ...this.getNextShapeOrder && { order: this.getNextShapeOrder(frame, this.camera) },
          ...(frameData && frameData.attributes && { attributes: frameData.attributes }),
        });
        currState.push(this.frames[frame].toJSON());
      }
    };

    const updateInstanceDynamicAttributes = (frameStart: number, frameEnd: number, insert: boolean, keyFrameDynamicAttributes?: any) => {
      if (insert) {
        const updateArr = [];
        for (let index = frameStart; index < frameEnd; index += 1) {
          updateArr.push({
            frameIndex: index,
            attributes: keyFrameDynamicAttributes
          });
        }
        const { instance } = this.instanceItem;
        instance.setDynamicAttributesByCamera(this.camera, updateArr);
      }
    };
    const { instance } = this.instanceItem;
    if (lastKeyFrame !== undefined && this.frames[lastKeyFrame].shapeType === shapeType) {
      for (let i = lastKeyFrame + 1; i < frameIndex; i += 1) {
        const { shape } = getShapeFromFrames(this.frames, lastKeyFrame, frameIndex, lastKeyFrame, i);
        updateFrameData(i, shape, shouldInsert, this.frames[lastKeyFrame]);
      }
      const keyFrameDynamicAttributes = instance.dynamicAttributes?.[this.camera]?.[lastKeyFrame]?.attributes;
      if (instance.categoryRef.labelConfigDynamic && keyFrameDynamicAttributes) {
        updateInstanceDynamicAttributes(lastKeyFrame + 1, frameIndex, shouldInsert, keyFrameDynamicAttributes);
      }
    }
    if (nextKeyFrame !== undefined && this.frames[nextKeyFrame].shapeType === shapeType) {
      for (let i = frameIndex + 1; i < nextKeyFrame; i += 1) {
        const { shape } = getShapeFromFrames(this.frames, frameIndex, nextKeyFrame, frameIndex, i);
        updateFrameData(i, shape, false);
      }
    }

    return { prevState, currState };
  }

  /**
   * remove from frames
   * @param frames
   */
  remove(frames: number[]) {
    const prevFrames: { [frameIndex: number]: IFrameData } = {};
    const currFrames: { [frameIndex: number]: IFrameData } = {};
    for (let i = 0; i < frames.length; i += 1) {
      const deleteFrame = frames[i];
      const prevFrame = deleteFrame - 1;
      const nextFrame = deleteFrame + 1;

      // delete
      if (this.frames[deleteFrame] && !prevFrames[deleteFrame]) {
        prevFrames[deleteFrame] = this.frames[deleteFrame].toJSON();
      }
      delete this.frames[deleteFrame];
      delete currFrames[deleteFrame];

      const { instance } = this.instanceItem;
      instance.deleteDynamicAttributesByCamera(this.camera, frames, this.instanceItem.id);

      // set prev & next frame to key frame
      if (this.frames[prevFrame]) {
        if (!prevFrames[prevFrame]) {
          prevFrames[prevFrame] = this.frames[prevFrame].toJSON();
        }
        this.frames[prevFrame].isKeyFrame = true;
        currFrames[prevFrame] = this.frames[prevFrame].toJSON();
      }
      if (this.frames[nextFrame]) {
        if (!prevFrames[nextFrame]) {
          prevFrames[nextFrame] = this.frames[nextFrame].toJSON();
        }
        this.frames[nextFrame].isKeyFrame = true;
        currFrames[nextFrame] = this.frames[nextFrame].toJSON();
      }
    }
    return this.formatChangedState(Object.values(prevFrames), Object.values(currFrames));
  }

  /**
   * get nearest key frame index
   * @param frameIndex
   */
  getNearestKeyFrame(frameIndex: number) {
    const [lastKeyFrame] = getLastKeyFrames(1, frameIndex, this.frames);
    if (lastKeyFrame !== undefined) {
      return lastKeyFrame;
    }
    const [nextKeyFrame] = getNextKeyFrames(1, frameIndex, this.frames);
    if (nextKeyFrame !== undefined) {
      return nextKeyFrame;
    }
    return -1;
  }

  /**
   * return structured data
   */
  toJSON(): ICameraData {
    return {
      camera: this.camera,
      frames: Object.values(this.frames).map((frame) => frame.toJSON()),
    };
  }

  /**
   * format changed state
   * @param prevState
   * @param currState
   */
  formatChangedState(prevState: IFrameData[], currState: IFrameData[]): ChangedState {
    return {
      ...prevState.length > 0 && {
        prevState: { camera: this.camera, frames: [...prevState] },
      },
      ...currState.length > 0 && {
        currState: { camera: this.camera, frames: [...currState] },
      },
    };
  }
}
