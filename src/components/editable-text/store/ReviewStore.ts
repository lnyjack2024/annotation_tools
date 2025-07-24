import { makeAutoObservable, toJS } from 'mobx';
import { strlen, substr } from 'fbjs/lib/UnicodeUtils';
import { v4 as uuidv4 } from 'uuid';
import { findIndex } from 'lodash';
import RootStore from './RootStore';
import { MissingItem, Payload, ReviewDataItem, ReviewItemResult, ReviewResult, TAG } from '../types';
import { isLabel } from './tag_mode';
import { getConfigByKeys } from '../utils/helper';

/**
 * store for config
 * @class
 */
export default class ReviewStore {
  /**
   * root store
   */
  rootStore;

  text = '';

  reviews: ReviewResult = {
    data: {},
    missing: [],
  };

  /**
 * anchors visible
 */
  visible = true;

  get allReviews() {
    return Object.entries(this.reviews.data).map(([index, reviewInfo]) => ({
      ...reviewInfo,
      id: index
    }));
  }

  /**
 * rejected count
 * @getter
 */
  get rejectedCount() {
    const reviews = this.allReviews.filter((r) => r.result === ReviewItemResult.REJECT);
    return reviews.length;
  }

  /**
 * rejected count
 * @getter
 */
  get unPassedCount() {
    const reviews = this.allReviews.filter((r) => r.result !== ReviewItemResult.PASS);
    return reviews.length;
  }

  get passedCount() {
    const reviews = this.allReviews.filter((r) => r.result === ReviewItemResult.PASS);
    return reviews.length;
  }

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
    const { content } = payload;

    this.text = content;
  }

  parseReview(reviews: ReviewResult) {
    const length = strlen(this.text);
    const { ontologyConfigMap } = this.rootStore.ontology;

    this.reviews.data = reviews.data || {};

    if (reviews.missing) {
      this.reviews.missing = reviews.missing.filter((label) => {
        // invalid start & end
        if (typeof (label) !== 'object') return false;
        if (Number.isNaN(label.start) || label.start === null || label.start < 0 || label.start >= length) {
          return false;
        }
        if (Number.isNaN(label.end) || label.end === null || label.end < 0 || label.end >= length) {
          return false;
        }
        if (!label.keys) {
          ontologyConfigMap.forEach((value, key) => {
            const keys = value.keys;
            if (keys[keys.length - 1] === label.value) {
              label.keys = value.keys;
            }
          });
        }
        // invalid value
        if (!isLabel(getConfigByKeys(ontologyConfigMap, label.keys)?.type)) {
          return false;
        }
        // invalid & missing id
        if (!label.id) {
          label.id = uuidv4();
        }
        if (!label.type) {
          label.type = TAG.LABEL_QA;
        }
        // missing text
        if (!label.text) label.text = substr(this.text, label.start, label.end - label.start);
        return true;
      });
    }
  }

  addMissingReview(newItem: MissingItem, id: string, data: ReviewDataItem) {
    const { reviews } = this;

    const { missing } = reviews;
    missing.unshift(newItem as MissingItem);
    missing.sort((a, b) => (a.start - b.start));

    const preReview = reviews.data[id];
    reviews.data[id] = data;
    reviews.data = { ...reviews.data };
    return { review: { ...data }, preReview, id, label: newItem };
  }

  setReview(id: string, data: ReviewDataItem) {
    const { reviews } = this;
    const preReview = reviews.data[id];
    reviews.data[id] = data;
    reviews.data = { ...reviews.data };
    return { review: { ...data }, preReview, id };
  }

  getReview(id: string) {
    if (!id) {
      return null;
    }
    return this.reviews.data[id];
  }

  getReviews() {
    const { missing, data } = this.reviews;
    return {
      data: toJS(data),
      missing: missing?.map((item) => toJS(item)),
    };
  }

  deleteReview(id: string) {
    const reviewData = { ...this.reviews.data[id] };
    delete this.reviews.data[id];
    return { review: reviewData, id };
  }

  deleteReviews(ids: string[]) {
    const reviewDataList: ({ review: ReviewDataItem; id: string })[] = [];
    ids.forEach((id) => {
      const reviewData = this.deleteReview(id);
      reviewDataList.push({ ...reviewData, id });
    });
    return { reviewDataList };
  }

  deleteMissingReview(id: string) {
    const { missing, data } = this.reviews;
    const reviewData = { ...data[id] };

    const index = findIndex(missing, { id });
    const label = missing[index];
    missing.splice(index, 1);
    delete data[id];
    return { review: reviewData, id, label };
  }
}
