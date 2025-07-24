import ToolStorage, { CacheType } from '../../utils/tool-storage';

export enum CacheKey {
  // global
  REVIEW_ALERT_HIDE = 'ner-review-alert',
  // job
  REVIEW_STATE = 'ner-review-state',

};

export function getCacheTypeByKey(key: string) {
  switch (key) {
    case CacheKey.REVIEW_STATE:
      return CacheType.BY_JOB;
    default:
      return CacheType.GLOBAL;
  }
}

export default new ToolStorage({
  toolName: 'ner',
  getCacheTypeByKey,
});
