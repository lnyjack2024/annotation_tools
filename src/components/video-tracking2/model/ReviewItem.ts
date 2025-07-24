import { makeAutoObservable } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import { Review, ReviewResult } from '../types';

interface ReviewOptions {
  id?: string;
  camera: string;
  frameIndex: number;
  result: ReviewResult;
  type?: string[];
  comment?: string;
  instanceId?: string;
  instanceItemId?: string;
  position: {
    x: number;
    y: number;
  };
}

/**
 * Review
 * @class
 */
export default class ReviewItem {
  /**
   * review id
   * @member
   */
  id: string;

  /**
   * related camera name
   * @member
   */
  camera: string;

  /**
   * related frame index
   * @member
   */
  frameIndex: number;

  /**
   * review result
   * @member
   */
  result: ReviewResult;

  /**
   * review item position x
   * @member
   */
  x: number;

  /**
   * review item position y
   * @member
   */
  y: number;

  /**
   * issue types for rejected / suspend
   * @member
   */
  type?: string[];

  /**
   * comment for rejected / suspend
   * @member
   */
  comment?: string;

  /**
   * related instance id
   * @member
   */
  instanceId?: string;

  /**
   * related instance item id
   * @member
   */
  instanceItemId?: string;

  constructor({ id, camera, frameIndex, result, type, comment, instanceId, instanceItemId, position }: ReviewOptions) {
    makeAutoObservable(this, {
      id: false,
      camera: false,
      frameIndex: false,
      instanceId: false,
      instanceItemId: false,
    }, {
      autoBind: true,
    });

    this.id = id || uuidv4();
    this.camera = camera;
    this.frameIndex = frameIndex;
    this.result = result;
    this.type = type;
    this.comment = comment;
    this.instanceId = instanceId;
    this.instanceItemId = instanceItemId;
    this.x = position.x;
    this.y = position.y;
  }

  /**
   * to structure data for save
   */
  toJSON(): Review {
    return {
      id: this.id,
      camera: this.camera,
      frameIndex: this.frameIndex,
      result: this.result,
      type: this.type,
      comment: this.comment,
      instanceId: this.instanceId,
      instanceItemId: this.instanceItemId,
      position: {
        x: this.x,
        y: this.y,
      },
    };
  }
}
