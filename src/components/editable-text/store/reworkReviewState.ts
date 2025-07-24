import cache, { CacheKey } from '../utils-storage';

export type DoneState = true;

export type TodoState = false;

export type ReviewState = DoneState | TodoState;

export type ReviewStateData = {
  [index: string]: ReviewState;
};

export const isReviewDone = (id: string) => {
  const data = cache.get(CacheKey.REVIEW_STATE);
  if (data) {
    return data[id];
  }
  return false;
};

export const setReviewState = (id: string, state: ReviewState) => {
  const data = cache.get(CacheKey.REVIEW_STATE);
  if (data) {
    data[id] = state;
    cache.set(CacheKey.REVIEW_STATE, data);
    return;
  }

  const newData: ReviewStateData = {};
  newData[id] = state;
  cache.set(CacheKey.REVIEW_STATE, newData);
};
