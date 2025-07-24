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
      let hasCustomError = false;

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

      // if (validationConfig.script) {
      //   try {
      //     const validateResults = await this.rootStore.jobProxy?.validateContent?.(resultLink, this.rootStore.jobProxy?.flowData) || [];
      //     validateResults.forEach((result: { data: { out_str: any; }; status_code: number; }) => {
      //       const out = JSON.parse(result?.data?.out_str || '{}');
      //       if (result?.status_code === 200 && Array.isArray(out)) {
      //         out.forEach((item) => {
      //           results.push({
      //             id: item.id,
      //             message: item.message,
      //             info: { ...item.info },
      //             blockSubmit: item.blockSubmit,
      //             type: 'script'
      //           });
      //         });
      //       } else {
      //         hasCustomError = true;
      //       }
      //     });
      //   } catch (error) {
      //     console.log('script validation error', error);
      //   }
      // }
      resolve({ results, hasCustomError });
    });
  }
}
