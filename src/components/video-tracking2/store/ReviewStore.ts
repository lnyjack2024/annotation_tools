import { makeAutoObservable } from 'mobx';
import { Container, Point } from 'pixi.js';
import RootStore from './RootStore';
import ReviewItem from '../model/ReviewItem';
import Instance from '../model/Instance';
import InstanceItem from '../model/InstanceItem';
import { Payload, Review, ReviewMode, ReviewResult } from '../types';
import { TOOLBAR_HEIGHT, SIDEBAR_WIDTH } from '../constants';
import { getToolTypeFromFrameData } from '../utils';
import { ToolMode } from '../../../utils/tool-mode';
import Anchor, { EventAction } from '../../common/shapes/anchors/Anchor';
import Cursor from '../../common/Cursor';
import ApproveIcon from '../images/approve.png';
import RejectIcon from '../images/reject.png';
import SuspendIcon from '../images/suspend.png';
import ApproveSelectedIcon from '../images/approve_selected.png';
import RejectSelectedIcon from '../images/reject_selected.png';
import SuspendSelectedIcon from '../images/suspend_selected.png';

function getIconByReviewResultType(type: ReviewResult) {
  switch (type) {
    case ReviewResult.APPROVE:
      return { icon: ApproveIcon, selectedIcon: ApproveSelectedIcon };
    case ReviewResult.REJECT:
      return { icon: RejectIcon, selectedIcon: RejectSelectedIcon };
    case ReviewResult.SUSPEND:
      return { icon: SuspendIcon, selectedIcon: SuspendSelectedIcon };
    default:
  }
  return {};
}

function getReviewResultSummary(reviews: ReviewItem[]) {
  const allResults = new Set(reviews.map((r) => r.result));
  if (allResults.has(ReviewResult.REJECT)) {
    return ReviewResult.REJECT;
  }
  if (allResults.has(ReviewResult.SUSPEND)) {
    return ReviewResult.SUSPEND;
  }
  if (allResults.has(ReviewResult.APPROVE)) {
    return ReviewResult.APPROVE;
  }
  return undefined;
}

/**
 * store for reviews
 * @class
 */
export default class ReviewsStore {
  /**
   * root store
   */
  rootStore: typeof RootStore;

  /**
   * issue types
   */
  issueTypes: string[] = [];

  /**
   * all reviews
   */
  reviews: { [frameIndex: number]: ReviewItem[] } = {};

  /**
   * layer for reviews
   */
  reviewLayer?: Container;

  /**
   * review layer offset (according to document body)
   */
  reviewLayerOffset = { x: SIDEBAR_WIDTH, y: TOOLBAR_HEIGHT * 2 };

  /**
   * review anchors
   */
  anchors: {
    [reviewId: string]: {
      anchor: Anchor;
      camera: string;
    };
  } = {};

  /**
   * selected review id
   */
  selectedReviewId = '';

  /**
   * selected anchor
   */
  selectedAnchor: Anchor | null = null;

  /**
   * selected review result type (default is approve)
   */
  selectedReviewResultType: ReviewResult = ReviewResult.APPROVE;

  /**
   * is adding review anchor
   */
  addMode = false;

  /**
   * current editing review instance
   */
  editingReview: ReviewItem | null = null;

  /**
   * current hovered review instance
   */
  hoveredReview: ReviewItem | null = null;

  /**
   * hovered anchor
   */
  hoveredAnchor: Anchor | null = null;

  /**
   * store id preserved before review edit
   */
  reviewStoreId = '';

  /**
   * review result types based on tool mode
   * @getter
   */
  get reviewResultTypes() {
    return this.rootStore.jobProxy!.toolMode === ToolMode.AUDIT ? [
      ReviewResult.APPROVE,
      ReviewResult.REJECT,
      ReviewResult.SUSPEND,
    ] : [
      ReviewResult.APPROVE,
      ReviewResult.REJECT,
    ];
  }

  /**
   * all reviews
   * @getter
   */
  get allReviews() {
    return Object.values(this.reviews).flatMap((frameReviews) => frameReviews);
  }

  /**
   * warnings count
   * @getter
   */
  get warningCount() {
    const reviews = this.rootStore.review.allReviews.filter((r) => r.result === ReviewResult.REJECT);
    return reviews.length;
  }

  constructor(rootStore: typeof RootStore) {
    makeAutoObservable(this, {
      rootStore: false,
      reviewLayer: false,
      reviewLayerOffset: false,
      anchors: false,
      selectedReviewId: false,
      selectedAnchor: false,
      reviewStoreId: false,
    }, {
      autoBind: true,
    });

    this.rootStore = rootStore;
  }

  /**
   * init from paylod
   * @param payload
   * @param initialReviews
   */
  init(payload: Payload, initialReviews?: Review[]) {
    if (typeof payload.issue_types === 'string') {
      this.issueTypes = payload.issue_types.split(',').map((i) => i.trim()).filter((i) => !!i);
    }
    if (!this.rootStore.isLabeling && initialReviews && Array.isArray(initialReviews)) {
      const reviews: { [frameIndex: number]: ReviewItem[] } = {};
      initialReviews.forEach((review) => {
        const { frameIndex } = review;
        if (!reviews[frameIndex]) {
          reviews[frameIndex] = [];
        }
        const reviewItem = new ReviewItem(review);
        reviews[frameIndex].push(reviewItem);
      });
      this.reviews = reviews;
    }
  }

  /**
   * get review in current frame by instance item
   * @param instanceItem
   * @param camera
   */
  getReviewForInstanceItem(
    instanceItem?: InstanceItem | null,
    camera = this.rootStore.frame.currentCamera,
    frameIndex = this.rootStore.frame.currentFrame,
  ) {
    if (instanceItem) {
      if (this.reviews[frameIndex]) {
        const reviews = this.reviews[frameIndex].filter((r) => r.camera === camera && r.instanceItemId === instanceItem.id);
        return getReviewResultSummary(reviews);
      }
    }
    return undefined;
  }

  /**
   * get total review result for instance item
   * @param instanceItem
   * @param camera
   */
  getReviewResultForInstanceItem(
    instanceItem: InstanceItem,
    camera = this.rootStore.frame.currentCamera,
  ) {
    const reviews = this.allReviews.filter((r) => r.camera === camera && r.instanceItemId === instanceItem.id);
    return getReviewResultSummary(reviews);
  }

  /**
   * get total review result for instance
   * @param instance
   */
  getReviewResultForInstance(instance: Instance) {
    const reviews = this.allReviews.filter((r) => r.instanceId === instance.id);
    return getReviewResultSummary(reviews);
  }

  /**
   * get instances json data (for save)
   */
  reviewsJSON() {
    return Object.values(this.reviews).flatMap((reviews) => reviews.map((r) => r.toJSON()));
  }

  /**
   * get review statistics
   */
  getReviewStatistics() {
    const approvedFrameSet = new Set<number>();
    const rejectedFrameSet = new Set<number>();
    const rejectedElements = new Set<string>();
    const issueMap: {
      [type: string]: {
        count: number;
        eleSet: Set<string>;
      }
    } = {};
    const approvedEleMap: {
      [type: string]: number;
    } = {};
    const rejectedEleMap: {
      [type: string]: number;
    } = {};

    const { instances } = this.rootStore.instance;
    Object.values(this.reviews).forEach((reviews) => {
      reviews.forEach((review) => {
        const { result, type, instanceId, instanceItemId, camera, frameIndex } = review;
        if (result === ReviewResult.REJECT) {
          // reject
          let eleKey = '';
          if (instanceId && instanceItemId) {
            if (instances[instanceId]?.items[instanceItemId]?.cameras[camera]?.frames[frameIndex]) {
              // shape exists
              eleKey = `${instanceId}-${instanceItemId}-${camera}-${frameIndex}`;
            }
          }
          rejectedFrameSet.add(frameIndex);
          if (eleKey) {
            rejectedElements.add(eleKey);
          }
          type?.forEach((t) => {
            if (!issueMap[t]) {
              issueMap[t] = {
                count: 0,
                eleSet: new Set(),
              };
            }
            issueMap[t].count += 1;
            if (eleKey) {
              issueMap[t].eleSet.add(eleKey);
            }
          });
        } else {
          // approve, or suspend
          approvedFrameSet.add(frameIndex);
        }
      });
    });

    // filter out rejected frames
    new Set(approvedFrameSet).forEach((frame) => {
      if (rejectedFrameSet.has(frame)) {
        approvedFrameSet.delete(frame);
      }
    });

    const allInstances = Object.values(instances);
    for (let i = 0; i < allInstances.length; i += 1) {
      const instance = allInstances[i];
      const items = Object.values(instance.items);
      for (let j = 0; j < items.length; j += 1) {
        const item = items[j];
        const cameras = Object.values(item.cameras);
        for (let k = 0; k < cameras.length; k += 1) {
          const camera = cameras[k];
          const frames = Object.values(camera.frames);
          for (let l = 0; l < frames.length; l += 1) {
            const frame = frames[l];
            const shape = getToolTypeFromFrameData(frame);
            if (shape) {
              const { frameIndex } = frame;
              const eleKey = `${instance.id}-${item.id}-${camera.camera}-${frameIndex}`;
              if (rejectedElements.has(eleKey)) {
                // shape rejected
                if (!rejectedEleMap[shape]) {
                  rejectedEleMap[shape] = 0;
                }
                rejectedEleMap[shape] += 1;
              } else if (approvedFrameSet.has(frameIndex) || rejectedFrameSet.has(frameIndex)) {
                // shape approved
                // or not reviewed but in frames with review status
                if (!approvedEleMap[shape]) {
                  approvedEleMap[shape] = 0;
                }
                approvedEleMap[shape] += 1;
              }
            }
          }
        }
      }
    }

    return {
      issues: Object.keys(issueMap).reduce((acc, curr) => {
        const { count, eleSet } = issueMap[curr];
        acc[curr] = {
          count,
          elements: eleSet.size,
        };
        return acc;
      }, {} as {[type: string]: { count: number; elements: number }}),
      frames: {
        approved: approvedFrameSet.size,
        rejected: rejectedFrameSet.size,
      },
      elements: {
        approved: { ...approvedEleMap },
        rejected: { ...rejectedEleMap },
      },
    };
  }

  /**
   * set layer for review anchors
   * @param layer
   */
  setReviewLayer(layer: Container) {
    this.reviewLayer = layer;
  }

  /**
   * set layer offset
   * @param x
   * @param y
   */
  setReviewLayerOffset(x: number, y: number) {
    this.reviewLayerOffset.x = x;
    this.reviewLayerOffset.y = y;
  }

  /**
   * setup anchors in current frame & current camera
   */
  setupReviewAnchors() {
    this.clearAnchors();
    const { cameraViews, currentFrame } = this.rootStore.frame;
    (this.reviews[currentFrame] || []).forEach((review) => {
      const { id, camera, result, x, y } = review;
      if (!this.rootStore.isRework || result === ReviewResult.REJECT) {
        // only show reject anchors when rework
        const cameraView = cameraViews[camera];
        if (cameraView && cameraView.reviewLayer) {
          const anchor = this.createReviewAnchor(result, x, y, cameraView.reviewLayer, cameraView.viewScale);
          if (anchor) {
            this.anchors[id] = {
              anchor,
              camera,
            };
          }
        }
      }
    });
  }

  /**
   * create anchor instance
   * @param type
   * @param x
   * @param y
   * @param container
   * @param viewScale
   */
  createReviewAnchor(type: ReviewResult, x: number, y: number, container = this.reviewLayer, viewScale = this.rootStore.config.viewScale) {
    if (container) {
      const { icon, selectedIcon } = getIconByReviewResultType(type);
      if (icon && selectedIcon) {
        const anchor = new Anchor({
          container,
          scale: viewScale,
          x,
          y,
          img: icon,
          selectedImg: selectedIcon,
        });
        this.addAnchorListeners(anchor);
        return anchor;
      }
    }
    return null;
  }

  /**
   * get review instance by anchor instance
   * @param anchor
   */
  getReviewByAnchor(anchor: Anchor) {
    const reviewId = Object.keys(this.anchors).find((id) => this.anchors[id].anchor === anchor);
    if (reviewId) {
      return this.reviews[this.rootStore.frame.currentFrame].find((r) => r.id === reviewId);
    }
    return undefined;
  }

  /**
   * add listeners for anchor
   * @param anchor
   */
  addAnchorListeners(anchor: Anchor) {
    anchor.on(EventAction.SELECTED, (a) => {
      if (this.addMode) {
        return;
      }
      const review = this.getReviewByAnchor(a);
      if (review) {
        this.selectReview(review, a);

        // select related instance
        let instance;
        let instanceItem;
        if (review.instanceId) {
          instance = this.rootStore.instance.getInstanceById(review.instanceId);
          if (instance && review.instanceItemId) {
            instanceItem = instance.items[review.instanceItemId];
          }
        }
        if (instanceItem) {
          this.rootStore.instance.selectInstanceItem(instanceItem);
        } else if (instance) {
          this.rootStore.instance.selectInstance(instance);
        }

        // open modal in review mode
        if (this.rootStore.config.reviewMode === ReviewMode.REVIEW) {
          this.reviewStoreId = this.rootStore.undo.preserve({ reviews: [review.toJSON()] });
          this.setEditingReview(review);
          this.rootStore.config.setReviewModalVisible(true);
        }
      }
    });
    anchor.on(EventAction.POINTER_OVER, (a) => {
      if (this.rootStore.config.reviewMode === ReviewMode.LABELING) { // only show comment in labeling mode
        const review = this.getReviewByAnchor(a);
        if (review) {
          this.setHoveredReview(review, a);
        }
      }
    });
    anchor.on(EventAction.POINTER_OUT, () => {
      this.setHoveredReview(null, null);
    });
  }

  /**
   * set editing review
   * @param review
   */
  setEditingReview(review: ReviewItem | null) {
    this.editingReview = review;
  }

  /**
   * set hovered review
   * @param review
   */
  setHoveredReview(review: ReviewItem | null, anchor: Anchor | null) {
    this.hoveredReview = review;
    this.hoveredAnchor = anchor;
  }

  /**
   * select review
   * @param review
   * @param anchor
   */
  selectReview(review: ReviewItem, anchor: Anchor) {
    if (this.selectedAnchor && this.selectedAnchor !== anchor) {
      this.selectedAnchor.selected = false;
    }
    this.selectedReviewId = review.id;
    this.selectedAnchor = anchor;
    this.selectedAnchor.selected = true;
  }

  /**
   * unselect review
   */
  unselectReview() {
    if (this.selectedAnchor) {
      this.selectedAnchor.selected = false;
    }
    this.selectedReviewId = '';
    this.selectedAnchor = null;
  }

  /**
   * clear all anchors
   */
  clearAnchors() {
    Object.values(this.anchors).forEach(({ anchor }) => {
      anchor.destroy();
    });
    this.anchors = {};
    this.selectedReviewId = '';
    this.selectedAnchor = null;
    this.setEditingReview(null);
    this.setHoveredReview(null, null);
    this.reviewStoreId = '';
  }

  /**
   * get anchors for camera
   * @param camera
   */
  getAnchorsForCamera(camera = this.rootStore.frame.currentCamera) {
    return Object.values(this.anchors).filter((i) => i.camera === camera);
  }

  /**
   * update anchors' scale
   * @param scale
   */
  updateAnchorsScale(scale: number) {
    this.getAnchorsForCamera().forEach(({ anchor }) => {
      anchor.setScale(scale);
    });
  }

  /**
   * update anchors' interactive
   * @param interactive
   */
  updateAnchorsInteractive(interactive: boolean) {
    Object.values(this.anchors).forEach(({ anchor }) => {
      anchor.interactive = interactive;
    });
  };

  /**
   * activate review tool
   * @param type
   */
  activateReview(type: ReviewResult) {
    this.selectedReviewResultType = type;
    this.setAddMode(true);
  }

  /**
   * activate review tool by hotkey
   * @param hotkey
   */
  activateReviewByHotkey(hotkey: number) {
    if (hotkey === 1) {
      // approve
      this.activateReview(ReviewResult.APPROVE);
    } else if (hotkey === 2) {
      // reject
      this.activateReview(ReviewResult.REJECT);
    } else if (hotkey === 3) {
      // suspend
      this.activateReview(ReviewResult.SUSPEND);
    }
  }

  /**
   * set review add mode
   * @param addMode
   */
  setAddMode(addMode: boolean) {
    this.addMode = addMode;
    this.rootStore.config.cursor = addMode ? Cursor.POINTER : Cursor.DEFAULT;
    this.updateAnchorsInteractive(!addMode);
  }

  /**
   * add review when click canvas
   * @param point
   * @param layer
   * @param viewScale
   */
  addReview(point: Point, layer = this.reviewLayer, viewScale = this.rootStore.config.viewScale) {
    if (this.addMode) {
      let instanceId;
      let instanceItemId;
      const { isSingleSelected, selectedInstances, selectedInstanceItems } = this.rootStore.instance;
      if (isSingleSelected) {
        // link to the shape
        instanceItemId = selectedInstanceItems[0].id;
        instanceId = selectedInstances[0].id;
      }
      const anchor = this.createReviewAnchor(this.selectedReviewResultType, point.x, point.y, layer, viewScale);
      if (anchor) {
        const { currentCamera, currentFrame } = this.rootStore.frame;
        const review = new ReviewItem({
          camera: currentCamera,
          frameIndex: currentFrame,
          result: this.selectedReviewResultType,
          instanceId,
          instanceItemId,
          position: { x: point.x, y: point.y },
        });
        this.anchors[review.id] = {
          anchor,
          camera: currentCamera,
        };
        this.selectReview(review, anchor);
        this.setAddMode(false);
        if (review.result === ReviewResult.REJECT) {
          // open modal
          this.reviewStoreId = this.rootStore.undo.preserve();
          this.setEditingReview(review);
          this.rootStore.config.setReviewModalVisible(true);
        } else {
          // save directly
          this.insertReview(review);
          this.unselectReview();
        }
        return anchor;
      }
    }
    return null;
  }

  /**
   * insert review
   * @param review
   */
  insertReview(review: ReviewItem) {
    const storeId = this.rootStore.undo.preserve();
    const { frameIndex } = review;
    if (!this.reviews[frameIndex]) {
      this.reviews[frameIndex] = [];
    }
    this.reviews[frameIndex].push(review);
    this.rootStore.undo.save(storeId, { reviews: [review.toJSON()] });
  }

  /**
   * update review
   * @param review
   */
  updateReview(review: ReviewItem) {
    if (this.reviewStoreId) {
      const { frameIndex } = review;
      if (!this.reviews[frameIndex]) {
        this.reviews[frameIndex] = [];
      }
      if (this.reviews[frameIndex].indexOf(review) < 0) {
        this.reviews[frameIndex].push(review);
      }
      this.rootStore.undo.save(this.reviewStoreId, { reviews: [review.toJSON()] });
      this.reviewStoreId = '';
    }
  }

  /**
   * delete review
   * @param review
   * @param anchor
   */
  deleteReview(review: ReviewItem, anchor: Anchor) {
    const { id, frameIndex } = review;
    const frameReviews = this.reviews[frameIndex] || [];
    const index = frameReviews.findIndex((r) => r.id === id);
    let existed = false;
    if (index >= 0) {
      existed = true;
      frameReviews.splice(index, 1);
    }
    anchor.destroy();
    if (this.anchors[id]) {
      delete this.anchors[id];
    }
    if (existed && this.reviewStoreId) {
      this.rootStore.undo.save(this.reviewStoreId);
      this.reviewStoreId = '';
    }
  }

  /**
   * delete reviews by reviewIds
   * @param reviewResObj
   */
  deleteReviews(reviewResObj: { [key: string]: ReviewItem }) {
    const reviewStoreId = this.rootStore.undo.preserve({ reviews: this.reviewsJSON() });
    const reviewIds = Object.keys(reviewResObj);
    for (let index = 0; index < reviewIds.length; index += 1) {
      const reviewItemId = reviewIds[index];
      const review = reviewResObj[reviewItemId];
      const { frameIndex } = review;
      const frameReviews = this.reviews[frameIndex] || [];
      const frameReviewIndex = frameReviews.findIndex((r) => r.id === reviewItemId);
      if (frameReviewIndex >= 0) {
        frameReviews.splice(frameReviewIndex, 1);
      }
      if (this.anchors[reviewItemId]) {
        const anchor = this.anchors[reviewItemId].anchor;
        anchor.destroy();
        delete this.anchors[reviewItemId];
      }
    }
    if (reviewStoreId) {
      this.rootStore.undo.save(reviewStoreId, { reviews: this.reviewsJSON() });
    }
  }

  /**
   * clear all reviews and anchors
   */
  clearReviewsAndAnchors() {
    const reviewStoreId = this.rootStore.undo.preserve({ reviews: this.reviewsJSON() });
    this.reviews = {};
    this.clearAnchors();
    if (reviewStoreId) {
      this.rootStore.undo.save(reviewStoreId, { reviews: [] });
    }
  }

  // eslint-disable-next-line class-methods-use-this
  updateReviewResult(review: ReviewItem, result: ReviewResult, anchor: Anchor) {
    if (review.result !== result) {
      review.result = result;
      if (result === ReviewResult.APPROVE) {
        review.type = [];
        review.comment = '';
      }
      // update anchor
      const { icon, selectedIcon } = getIconByReviewResultType(result);
      if (icon && selectedIcon) {
        anchor.setImage(icon, selectedIcon);
      }
    }
  }

  // eslint-disable-next-line class-methods-use-this
  updateReviewInfo(review: ReviewItem, { type, comment, x, y }: { type?: string[], comment?: string, x?: number, y?: number }) {
    if (type !== undefined) {
      review.type = [...type];
    }
    if (comment !== undefined) {
      review.comment = comment;
    }
    if (x !== undefined) {
      review.x = x;
    }
    if (y !== undefined) {
      review.y = y;
    }
  }
}
