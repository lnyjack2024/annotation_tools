import { makeAutoObservable } from 'mobx';
import { isReviewEditable } from 'src/utils/tool-mode';
import RootStore from './RootStore';
import { Payload, ReviewMode } from '../types';
/**
 * store for config
 * @class
 */
export default class ConfigStore {
  /**
   * root store
   */
  rootStore;

  /**
   * readonly from payload only control text editable
   */
  contentReadyOnly = false;

  /**
   * review mode
   */
  reviewMode = ReviewMode.LABELING;

  /**
 * add mode, true means adding active
 */
  addMode = false;

  /**
   * validation config
   */
  validationConfig = { script: false };

  /**
   * submit check
   */
  submitCheck = false;

  /**
    * skip submit check for invalid data
    */
  skipCheckForInvalidData = false;

  constructor(rootStore: typeof RootStore) {
    makeAutoObservable(this, {
      rootStore: false,
    }, {
      autoBind: true,
    });

    this.rootStore = rootStore;
  }

  /**
   * init from paylod
   * @param payload
   */
  init(payload: Payload) {
    // set default review mode
    this.reviewMode = isReviewEditable(payload.jobProxy.toolMode) ? ReviewMode.REVIEW : ReviewMode.LABELING;


    // parse skip check for invalid data
    this.skipCheckForInvalidData = payload.skip_check_for_invalid_data === 'true' || payload.skip_check_for_invalid_data === true;

    // read_only
    this.contentReadyOnly = payload.read_only === 'true' || payload.read_only === true;
  }

  /**
 * set review mode
 * @param reviewMode
 */
  setReviewMode(reviewMode: ReviewMode) {
    if (this.reviewMode !== reviewMode) {
      this.setAddMode(false);
      this.reviewMode = reviewMode;
    }
  }

  /**
 * set add mode
 * @param addMode
 * @param shouldPredict
 */
  setAddMode(addMode: boolean) {
    if (this.rootStore.readonly) {
      return;
    }

    this.addMode = addMode;
  };
}
