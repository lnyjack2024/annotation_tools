import { action, makeObservable, observable } from 'mobx';
import { ToolMode, isAnnotationReadonly, isPreview, isReviewEditable, isRework, isTemplatePreview } from 'src/utils/tool-mode';
import { AuditStatistics, Payload, ReviewItemResult, ReviewStatistics, Statistics, SummaryItem } from '../types';
import JobProxy from '../../../libs/JobProxy';
import ConfigStore from './ConfigStore';
import ValidationStore from './ValidationStore';
import OntologyStore from './OntologyStore';
import ReviewStore from './ReviewStore';

/**
 * root store
 * @class
 */
class RootStore {
  /**
   * is tool initialized
   */
  initialized = false;

  /**
   * ontology from payload
   */
  ontology: OntologyStore;

  /**
   * review from payload
   */
  review: ReviewStore;

  /**
   * config from payload
   */
  config: ConfigStore;

  /**
   * results contain label results and reviews and text
   */
  // data = new DataProxy();

  /**
   * validation
   */
  validation: ValidationStore;

  /**
   * job proxy
   */
  jobProxy?: JobProxy;

  /**
   * is tool readonly (annotate not allowed)
   */
  get readonly() {
    return isAnnotationReadonly(this.jobProxy!.toolMode);
  }

  /**
   * is tool annotate allowed
   */
  get annotatable() {
    return !isAnnotationReadonly(this.jobProxy!.toolMode);
  }

  /**
   * is tool review enabled
   */
  get reviewable() {
    return isReviewEditable(this.jobProxy!.toolMode);
  }

  /**
   * is tool in labeling mode or template preview mode
   */
  get isLabeling() {
    return this.jobProxy!.toolMode === ToolMode.LABELING || this.isTemplatePreview;
  }

  /**
   * is tool in rework mode
   */
  get isRework() {
    return isRework(this.jobProxy!.toolMode);
  }

  /**
   * is tool in preview mode
   */
  get isPreview() {
    return isPreview(this.jobProxy!.toolMode);
  }

  /**
   * is tool in template preview mode
   */
  get isTemplatePreview() {
    return isTemplatePreview(this.jobProxy!.toolMode);
  }

  constructor() {
    this.ontology = new OntologyStore(this);
    this.review = new ReviewStore(this);
    this.config = new ConfigStore(this);
    this.validation = new ValidationStore(this);

    makeObservable(this, {
      initialized: observable,
      init: action,
    });
  }

  async init(payload: Payload) {
    // init common stores
    this.ontology.init(payload);
    this.review.init(payload);
    this.config.init(payload);
    this.initialized = true;
    // this.data.text = payload.content;
  }

  /**
* get tag statistics
*/
  getTagStatistics = () => {
    const data: Statistics = {
      totalCount: 0,
      summary: [],
    };
    data.summary = [];
    this.ontology.getOntologiesStatusMap().forEach((value, key) => {
      if (key === ReviewItemResult.MISSING) {
        return;
      }
      if (value.tagCount) {
        data.totalCount += value.tagCount;
        data.summary.push({
          count: value.tagCount,
          shape: key,
          keys: value.keys
        });
      }
    });

    return {
      ...data,

    };
  };

  async saveResult(isSubmit = false) {
    return this.jobProxy?.saveResult({
      content: this.ontology.text,
      results: this.ontology.getResults(false),
      auditId: this.jobProxy.auditId,
    }, isSubmit);

  }

  getReviewStatistics(): ReviewStatistics {
    // all shapes
    const objects = { total: 0, approved: 0, rejected: 0, missed: 0, actualApproved: 0 };
    const summary: SummaryItem[] = [];
    const approvedEleMap: {
      [type: string]: number;
    } = {};
    const rejectedEleMap: {
      [type: string]: number;
    } = {};
    this.ontology.updateOntologiesStatusMap();
    this.ontology.getOntologiesStatusMap().forEach((value, key) => {
      if (key === ReviewItemResult.MISSING) {
        objects.missed = value.tagCount;
        return;
      }
      if (value.tagCount) {
        objects.total += value.tagCount;
        summary.push({
          count: value.tagCount,
          shape: key,
          keys: value.keys
        });
      }
      let hasRejected = false;

      if (value.rejectCount) {
        objects.rejected += value.rejectCount;
        rejectedEleMap[key] = value.rejectCount;
        hasRejected = true;
      }
      if (hasRejected) {
        objects.approved += (value.tagCount - value.rejectCount!);
      } else {
        objects.approved += value.tagCount;
      }
      if (value.approveCount) {
        objects.actualApproved += value.approveCount;
        approvedEleMap[key] = value.approveCount;
      }
    });

    return {
      elements: {
        approved: { ...approvedEleMap },
        rejected: { ...rejectedEleMap },
      },
      summary,
      objects,
    };
  }

  /**
 * save review result
 */
  async saveReviews(submit = false) {
    const reviews = this.review.getReviews();
    const statData = this.getReviewStatistics();
    return this.jobProxy!.saveReviews({
      reviews,
    }, submit);
  }

  /**
   * get audit statistics
   */
  getAuditStatistics = (): AuditStatistics => {
    // all shapes
    const objects = { total: 0, approved: 0, rejected: 0, missed: 0, actualApproved: 0 };
    // based on different shape types
    const shapes: {
      [shape: string]: { total: number; approved: number; rejected: number; actualApproved: number };
    } = {};
    this.ontology.updateOntologiesStatusMap();
    this.ontology.getOntologiesStatusMap().forEach((value, key) => {
      if (key === ReviewItemResult.MISSING) {
        objects.missed = value.tagCount;
        return;
      }
      if (!shapes[key]) {
        shapes[key] = { total: 0, approved: 0, rejected: 0, actualApproved: 0 };
      }
      if (value.tagCount) {
        objects.total += value.tagCount;
        shapes[key].total = value.tagCount;
      }
      let hasRejected = false;
      if (value.rejectCount) {
        objects.rejected += value.rejectCount;
        shapes[key].rejected = value.rejectCount;
        hasRejected = true;
      }
      if (hasRejected) {
        objects.approved += (value.tagCount - value.rejectCount!);
        shapes[key].approved = value.tagCount - value.rejectCount!;
      } else {
        objects.approved += value.tagCount;
        shapes[key].approved = value.tagCount;
      }
      if (value.approveCount) {
        objects.actualApproved += value.approveCount;
        shapes[key].actualApproved = value.approveCount;
      } else {
        shapes[key].actualApproved = 0;
      }
    });
    return {
      objects,
      shapes,
    };
  };
}

const rootStore = new RootStore();
export default rootStore;
