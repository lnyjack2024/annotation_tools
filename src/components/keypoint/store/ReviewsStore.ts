import { observable, computed, makeObservable, action, toJS } from 'mobx';
import { v4 as uuidv4 } from 'uuid';
import { RootStoreType } from './RootStore';
import { Status } from './UndoStore';
import { Review, ReviewResult, ReviewData, ValidationType, MissingReview } from '../types';
import { IWarning } from '../../common/tabs-menu/Validator';
import { ToolMode, isReviewEditable, isAnnotationReadonly } from '../../../utils/tool-mode';
import formatMessage from '../locales';

export interface PointReviewResult { [id: number]: ReviewResult };
interface ShapeReviewResult { [id: string]: ReviewResult };
export interface GroupReviewsMap {
  [groupName: string]: PointReviewResult | ShapeReviewResult;
}
export interface InstanceReviewsMap {
  [instanceId: string]: GroupReviewsMap
}

export interface FrameReviewsMap {
  [frameIndex: number]: InstanceReviewsMap
}

/**
 * reviews stores
 */
class ReviewsStore {
  rootStore: RootStoreType;

  /**
   * current tool mode
   */
  toolMode: ToolMode = ToolMode.LABELING;

  /**
   * canvas draw
   */
  drawMode = true;

  /**
 * missing name
 */
  missingName = 'Missing';

  /**
   * issue types
   */
  issueTypes: string[] = [];

  /**
   * all reviews
   */
  reviews: Review[] = [];

  /**
 * all missing reviews
 */
  missingReviews: MissingReview[] = [];

  /**
   * selected review
   */
  selectedReview?: Review;

  /**
 * selected missing review
 */
  selectedMissingReview?: MissingReview;

  /**
   * is selected missing review modal visible
   */
  selectedMissingReviewModalVisible = false;

  /**
   * custom warnings
   */
  customWarnings: IWarning[] = [];

  /**
   * has custom error
   */
  hasCustomError = false;

  /**
   * blockSubmitErrors
   */
  blockSubmitErrors: IWarning[] = [];

  /**
   * errors
   */
  errors?: {
    [type: string]: string;
  };

  /**
   * qa qarnings
   */
  @computed get qaWarnings(): IWarning[] {
    return [...this.reviews, ...this.missingReviews]
      .filter((review) => review.result === ReviewResult.REJECT).map((review) => ({
        id: (review as Review).instanceId || (review as MissingReview).id,
        groupName: (review as Review).groupName,
        shapeIds: (review as Review).shapeIds,
        data: (review as MissingReview).data,
        frames: [review.frameIndex],
        message: review.type?.join(',') || '',
        comment: review.comment,
        warningType: ValidationType.QUALITY
      }));
  }

  /**
   * warnings
   */
  @computed get warnings() {
    return (this.customWarnings.length || this.qaWarnings.length) ? [...toJS(this.customWarnings), ...this.qaWarnings] : [];
  }

  /**
   * frame instance review mapping
   */
  @computed get frameReviewsMap() {
    const reviewsMap: FrameReviewsMap = {};
    this.reviews.forEach((review) => {
      const { frameIndex, instanceId, groupName, shapeIds, result } = review;
      const results: PointReviewResult | ShapeReviewResult = {};
      shapeIds.forEach((id) => {
        if (typeof id === 'string') {
          (results as ShapeReviewResult)[(id as string)] = result;
        } else {
          (results as PointReviewResult)[(id as number)] = result;
        }
      });
      if (!reviewsMap[frameIndex]) {
        reviewsMap[frameIndex] = {
          [instanceId]: {
            [groupName]: {}
          }
        };
      }
      if (!reviewsMap[frameIndex][instanceId]) {
        reviewsMap[frameIndex][instanceId] = {
          [groupName]: {}
        };
      }
      if (!reviewsMap[frameIndex][instanceId][groupName]) {
        reviewsMap[frameIndex][instanceId][groupName] = {};
      }
      reviewsMap[frameIndex][instanceId][groupName] = {
        ...reviewsMap[frameIndex][instanceId][groupName],
        ...results
      };
    });
    return reviewsMap;
  }

  constructor(rootStore: RootStoreType) {
    makeObservable(this, {
      reviews: observable,
      missingReviews: observable,
      selectedReview: observable,
      selectedMissingReview: observable,
      selectedMissingReviewModalVisible: observable,
      errors: observable,
      customWarnings: observable,
      drawMode: observable,
      setInitialData: action,
      setSelectedReview: action,
      setReview: action,
      deleteReviewByInstance: action,
      addMissingReview: action,
      cancelUnfinishMissingReview: action,
      finishMissingReview: action,
      setSelectedMissingReview: action,
      closeMissingReviewModal: action,
      updateMissingReview: action,
      deleteMissingReview: action,
      setDrawMode: action,
    });
    this.rootStore = rootStore;
  }

  /**
   * is tool readonly (annotate not allowed)
   */
  get readonly() {
    return isAnnotationReadonly(this.toolMode);
  }

  /**
   * is review enabled
   * @returns
   */
  @computed get isEnabled() {
    return isReviewEditable(this.toolMode);
  }

  /**
   * is review editable
   * @returns
   */
  @computed get isEditable() {
    return isReviewEditable(this.toolMode) && !isAnnotationReadonly(this.toolMode);
  }

  /**
 * should show reviews
 */
  @computed get showReviews() {
    return this.toolMode !== ToolMode.LABELING;
  }

  /**
   * review result types
   */
  @computed get reviewResultTypes() {
    return this.toolMode === ToolMode.AUDIT ? [
      ReviewResult.APPROVE,
      ReviewResult.REJECT,
      ReviewResult.SUSPEND,
    ] : [
      ReviewResult.APPROVE,
      ReviewResult.REJECT,
    ];
  }

  /**
   * init tool mode
   * @param toolMode
   */
  init(toolMode: ToolMode, issueTypes = '') {
    this.toolMode = toolMode;
    this.issueTypes = issueTypes.split(',').map((i) => i.trim()).filter((i) => !!i);
    if (this.isEnabled) {
      this.drawMode = false;
    }
  }

  /**
   * set initial data
   * @param reviews
   */
  setInitialData(reviews: any) {
    if (reviews) {
      this.reviews = [];
      Object.values({ ...reviews })
        .filter((v: any) => v && v.result !== undefined && ((!this.isEnabled && v.result === ReviewResult.REJECT) || this.isEnabled))
        .forEach(({ instanceId, frameIndex, groupName, shapeIds, id, number, data, result, type, comment }: any) => {
          if (
            frameIndex !== undefined &&
            result !== undefined
          ) {
            if (
              instanceId !== undefined &&
              groupName !== undefined &&
              Array.isArray(shapeIds) &&
              shapeIds.length > 0
            ) {
              this.reviews.push({ instanceId, groupName, shapeIds, frameIndex, result, type, comment });
            } else if (data?.position) {
              this.missingReviews.push({ id, number, frameIndex, data, result, type, comment });
            }
          }
        });
    }
  }

  /**
   * select review
   * @param instanceId
   */
  setSelectedReview(review?: Review) {
    if (review) {
      const { frameIndex, instanceId, groupName, shapeIds, result } = review;
      const oldReview = this.getReview(frameIndex, instanceId, groupName, shapeIds);
      if (this.isEnabled) {
        this.selectedReview = oldReview ? { ...oldReview, result } : review;
      } else if (oldReview) {
        this.selectedReview = oldReview;
      }
    } else {
      this.selectedReview = undefined;
    }
  }

  /**
   * get reviews for save
   * @returns
   */
  getReviewsForSave() {
    return this.reviews.map((review) => ({ ...review }));
  }

  /**
   * get review result
   * @param frameIndex
   * @param instanceId
   * @returns
   */
  getReview(frameIndex: number, instanceId: string, groupName: string, shapeIds: (string | number)[]) {
    return this.reviews.find((review) => review.frameIndex === frameIndex && review.instanceId === instanceId && review.groupName === groupName && JSON.stringify(review.shapeIds) === JSON.stringify(shapeIds));
  }

  /**
   * set review
   * @param results
   */
  setReview(results: ReviewData, selectedReview = toJS(this.selectedReview)) {
    if (!selectedReview || !this.isEnabled) {
      this.selectedReview = undefined;
      return;
    }
    const { frameIndex, instanceId, groupName, shapeIds } = selectedReview;
    const prevReviews = toJS(this.reviews);
    const index = prevReviews.findIndex((review) => review.frameIndex === frameIndex && review.instanceId === instanceId && review.groupName === groupName && JSON.stringify(review.shapeIds) === JSON.stringify(shapeIds));
    if (index >= 0) {
      const reviewItem = this.reviews[index];
      if (reviewItem.result !== results.result || reviewItem.type !== results.type || reviewItem.comment !== results.comment) {
        reviewItem.result = results.result;
        reviewItem.type = results.type;
        reviewItem.comment = results.comment;
      }
    } else if (this.isEnabled) {
      const currentIds = [...toJS(shapeIds)];
      shapeIds.forEach((shapeId) => {
        const itemIndex = this.reviews.findIndex((review) => review.frameIndex === frameIndex && review.instanceId === instanceId && review.groupName === groupName && review.shapeIds.includes(shapeId));
        const item = this.reviews[itemIndex];
        if (item) {
          if (item.result === results.result) {
            const n = currentIds.findIndex((key) => key === shapeId);
            if (n >= 0) {
              currentIds.splice(n, 1);
            }
          } else {
            const n = item.shapeIds.findIndex((key) => key === shapeId);
            if (n >= 0) {
              item.shapeIds.splice(n, 1);
            }
          }
          if (item.shapeIds.length === 0) {
            this.reviews.splice(itemIndex, 1);
          }
        }
      });
      if (currentIds.length) {
        this.reviews.push({ instanceId, groupName, shapeIds: currentIds, frameIndex, result: results.result, type: results.type, comment: results.comment });
      }
    }
    this.selectedReview = undefined;
    if (JSON.stringify(prevReviews) !== JSON.stringify(toJS(this.reviews))) {
      this.changeUndo(prevReviews);
    }
  }

  /**
   * delete review
   * @param instanceId
   * @param frameIndex
   */
  deleteReviewByInstance = (currentReview = this.selectedReview) => {
    if (this.isEnabled && currentReview) {
      const { instanceId, frameIndex, groupName, shapeIds } = currentReview;
      const prevReviews = [...this.reviews];
      const index = this.reviews.findIndex((review) => review.frameIndex === frameIndex && review.instanceId === instanceId && review.groupName === groupName && JSON.stringify(review.shapeIds) === JSON.stringify(shapeIds));
      if (index >= 0) {
        this.reviews.splice(index, 1);
        this.changeUndo(prevReviews);
      }
      this.setSelectedReview();
    }
  };

  addMissingReview(frameIndex: number) {
    const maxNumber = Math.max(...this.missingReviews.map((r) => r.number), 0);
    const missingReview: MissingReview = {
      id: uuidv4(),
      number: maxNumber + 1,
      frameIndex,
      result: ReviewResult.REJECT,
    };
    this.missingReviews.push(missingReview);
    this.setSelectedMissingReview(missingReview);
  }

  cancelUnfinishMissingReview() {
    if (this.selectedMissingReview && this.selectedMissingReview.data === undefined) {
      // remove unfinished review
      const index = this.missingReviews.findIndex((r) => r.id === this.selectedMissingReview?.id);
      if (index >= 0) {
        this.missingReviews.splice(index, 1);
      }
    }
    this.setSelectedMissingReview();
    this.closeMissingReviewModal();
  }

  finishMissingReview(p: { x: number; y: number }) {
    const review = this.missingReviews.find((r) => r.id === this.selectedMissingReview?.id);
    if (review) {
      review.data = {
        position: { x: p.x, y: p.y },
      };
      this.setSelectedMissingReview(review, true);
    }
  }

  setSelectedMissingReview(review?: MissingReview, openReviewModal = false) {
    this.selectedMissingReview = review;
    if (review && openReviewModal) {
      this.selectedMissingReviewModalVisible = true;
    }
  }

  closeMissingReviewModal() {
    this.selectedMissingReviewModalVisible = false;
  }

  updateMissingReview(review: MissingReview) {
    const index = this.missingReviews.findIndex((r) => r.id === review.id);
    if (index >= 0) {
      this.missingReviews.splice(index, 1, review);
    }
  }

  deleteMissingReview(review: MissingReview) {
    const index = this.missingReviews.findIndex((r) => r.id === review.id);
    if (index >= 0) {
      this.missingReviews.splice(index, 1);
    }
    this.setSelectedMissingReview();
    this.closeMissingReviewModal();
  }

  changeUndo(prevReviews: Review[]) {
    const before: Status[] = [];
    const after: Status[] = [];
    before.push({
      type: 'reviews',
      status: prevReviews
    });
    after.push({
      type: 'reviews',
      status: this.reviews
    });
    this.rootStore.undo.saveStatus(before, after);
  }

  setDrawMode(mode: boolean) {
    this.cancelUnfinishMissingReview();
    this.drawMode = mode;
  }
}

export default ReviewsStore;
