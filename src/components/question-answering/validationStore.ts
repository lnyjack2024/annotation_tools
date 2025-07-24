import { makeAutoObservable } from 'mobx';
import RootStore from './store';
import { Result } from './types';

/**
 * store for validation
 * @class
 */
export default class ValidationStore {
  /**
   * root store
   */
  rootStore;

  /**
   * warning list
   */
  warnings: Result[] = [];

  /**
   * has custom error
   */
  hasCustomError = false;

  /**
   * is checking
   */
  checking = false;

  /**
   * warnings count
   * @getter
   */
  get warningCount() {
    return this.warnings.length;
  }

  /**
   * has error or blocked issue
   * @getter
   */
  get blocked() {
    if (!this.rootStore.submitCheck) {
      return false;
    }
    return this.hasCustomError || this.warnings.filter((warning) => warning.blockSubmit === true).length > 0;
  }

  constructor(rootStore: typeof RootStore) {
    makeAutoObservable(this, {
      rootStore: false,
      blocked: false,
    }, {
      autoBind: true,
    });

    this.rootStore = rootStore;
  }

  /**
   * trigger sync
   */
  async sync() {
    if (this.checking) {
      return;
    }
    await this.defaultSync();
  }

  /**
   * trigger default sync
   * @param isSubmit
   */
  async defaultSync() {
    this.checking = true;
    const [result] = await Promise.all([
      this.validate(),
      new Promise((resolve) => {
        setTimeout(resolve, 300);
      }),
    ]);
    if (result) {
      const { results, hasCustomError } = result as ({results: Result[], hasCustomError: boolean});
      this.warnings = results;
      this.hasCustomError = hasCustomError;
    }
    this.checking = false;
  }

  /**
   * do validation
   * @param isSubmit
   */
  validate() {
    const { validationConfig } = this.rootStore;
    return new Promise(async (resolve) => {
      const results: Result[] = [];
      const hasCustomError = false;

      // get result link
      let resultLink = '';
      if (validationConfig.script) {
        if (typeof this.rootStore.jobProxy?.reviewFrom === 'string') {
          resultLink = this.rootStore.jobProxy.reviewFrom;
        }
        if (this.rootStore.annotatable) {
          try {
            resultLink = await this.rootStore.saveResult() || '';
          } catch (e) {
            resultLink = '';
          }
        }
      }
      resolve({ results, hasCustomError });
    });
  }
}
