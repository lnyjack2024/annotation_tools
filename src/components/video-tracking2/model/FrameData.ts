import { makeAutoObservable, toJS } from 'mobx';
import { cloneDeep } from 'lodash';
import { FrameData as IFrameData } from '../types';
import { ShapeData, ShapeType } from '../../common/shapes/types';

/**
 * frame data
 * @class
 */
export default class FrameData {
  /**
   * frame index
   * @member
   */
  frameIndex: number;

  /**
   * is key frame
   * @member
   */
  isKeyFrame: boolean;

  /**
   * shape type
   * @member
   */
  shapeType: ShapeType;

  /**
   * shape data
   * @member
   */
  shape: ShapeData;

  /**
   * shape order
   * @member
   */
  order?: number;

  /**
   * shape attributes
   * @member
   */
  attributes?: any;

  constructor({ frameIndex, isKeyFrame, shapeType, shape, order, attributes }: IFrameData) {
    makeAutoObservable(this, {
      frameIndex: false,
      shapeType: false,
      order: false,
    }, {
      autoBind: true,
    });

    this.frameIndex = frameIndex;
    this.isKeyFrame = isKeyFrame;
    this.shapeType = shapeType;
    this.shape = cloneDeep(shape);
    this.order = order;
    this.attributes = cloneDeep(attributes);
  }

  /**
   * return structured data
   */
  toJSON(): IFrameData {
    return {
      frameIndex: this.frameIndex,
      isKeyFrame: this.isKeyFrame,
      shapeType: this.shapeType,
      shape: cloneDeep(this.shape),
      order: this.order,
      attributes: cloneDeep(toJS(this.attributes)),
    };
  }
}
