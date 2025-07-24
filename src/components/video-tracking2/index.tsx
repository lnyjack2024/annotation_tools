import React from 'react';
import { observer } from 'mobx-react';
import { message, notification } from 'antd';
import { isEqual } from 'lodash';
import AutoSaver from '../common/AutoSaver';
import LayoutWrapper from '../common/layout/LayoutWrapper';
import AppWrapper from '../common/shapes/wrapper/AppWrapper';
import CamerasContainer from './components/cameras/CamerasContainer';
import Toolbar from './components/toolbar/Toolbar';
import Sidebar from './components/sidebar/Sidebar';
import FrameControl from './components/frames/FrameControl';
import AttributesPanel from './components/attributes/AttributesPanel';
import AttributesModal from './components/attributes/AttributesModal';
import PointAttributesModal from './components/attributes/PointAttributesModal';
import FrameAttributesModal from './components/attributes/FrameAttributesModal';
import ReviewModal from './components/review/ReviewModal';
import ReviewComment from './components/review/ReviewComment';
import store from './store/RootStore';
import bindKeyboardEvents from './keyboard-events';
import i18n from './locales';
import { getToolTypeFromFrameData } from './utils';
import { Payload, ReviewResult } from './types';
import { TOOLBAR_HEIGHT, SIDEBAR_WIDTH, ATTR_PANEL_WIDTH } from './constants';
import { methods } from './payload';
import './index.scss';

interface VideoTrackingProps extends Payload {
  renderComplete: () => Promise<void>;
}

export class VideoTracking extends React.Component<VideoTrackingProps> {
  /**
   * auto saver reference
   */
  saverRef = React.createRef<AutoSaver>();

  /**
   * frame control height (default is 48 + 56 = 104)
   */
  frameControlHeight = 104;

  /**
   * keyboard events
   */
  removeKeyboardEvents = () => {};

  constructor(props: VideoTrackingProps) {
    super(props);

    // setup i18n
    i18n.setLocale(this.props.locale);
    // set props
    store.jobProxy = this.props.jobProxy;
  }

  async componentDidMount() {
    this.removeKeyboardEvents = bindKeyboardEvents(this);
    // init store
    try {
      await store.init(this.props);
    } catch (e) {
      notification.error({ message: (e as Error).message, duration: null });
      return;
    }
    // render completed
    this.props.renderComplete();
  }

  componentWillUnmount() {
    this.removeKeyboardEvents();
  }

  /**
   * save annotation data
   */
  saveResult = async () => {
    this.saverRef.current?.disableLeaveCheck();
    return store.saveResult(true);
  };

  /**
   * save review data
   */
  saveReviews = () => {
    this.saverRef.current?.disableLeaveCheck();
    return store.saveReviews(true);
  };

  /**
   * save data
   * @param isAutoSave
   */
  save = async (isAutoSave = false) => {
    if (!store.initialized || store.isPreview) { // not initialized, or is preview mode
      return;
    }

    const promises = [];
    if (store.annotatable) {
      promises.push(store.saveResult());
    }
    if (store.reviewable) {
      promises.push(store.saveReviews());
    }
    if (promises.length > 0) {
      try {
        await Promise.all(promises);
        message.success(i18n.translate(isAutoSave ? 'SAVE_AUTO_SUCCESS' : 'SAVE_SUCCESS'));
        // update tempSaved flag
        this.saverRef.current?.setTempSaved(true);
      } catch (e) {
        if (!isAutoSave) {
          message.error(i18n.translate('SAVE_FAIL'));
        } else {
          throw e;
        }
      }
    }
  };

  /**
   * is annotation modified
   */
  isModified = () => {
    const removeUndefinedKeys: any = (v: any) => {
      if (Array.isArray(v)) {
        return v.map((i) => removeUndefinedKeys(i));
      }
      if (typeof v === 'object' && v !== null) {
        const keys = Object.keys(v);
        keys.forEach((key) => {
          if (v[key] === undefined) {
            delete v[key];
          } else {
            v[key] = removeUndefinedKeys(v[key]);
          }
        });
      }
      return v;
    };

    const { instances, frames } = store.initialData || {};
    const currInstances = removeUndefinedKeys(store.instance.instancesJSON());
    const currFrames = removeUndefinedKeys(store.frame.framesJSON());
    return !isEqual(currInstances, instances)
      || !isEqual(currFrames, frames);
  };

  /**
   * get review statistics
   */
  getStatistics = () => {
    // all shapes
    const objects = { total: 0, approved: 0, rejected: 0, suspended: 0, missed: 0, reviewed: 0 };
    // based on different shape types
    const shapes: {
      [shape: string]: { total: number; approved: number; rejected: number; suspended: number; missed: number; reviewed: number; };
    } = {};
    // based on shape categories
    const categories: {
      [category: string]: { total: number; approved: number; rejected: number; suspended: number; missed: number; reviewed: number; };
    } = {};
    // based on categories & shape types
    const categoryShapes: {
      [category: string]: {
        [shape: string]: { total: number; approved: number; rejected: number; suspended: number; missed: number; reviewed: number; };
      };
    } = {};
    // reviewed issues
    const issues: { [issue: string]: number } = {};
    store.review.issueTypes.forEach((i) => { issues[i] = 0; });
    // reviewed frames
    const reviewedFrameMap: { [frameIndex: number]: boolean } = {};

    const { instances: instancesMap } = store.instance;
    const frameReviewStatus = Array.from({ length: store.frame.frameCount }).fill(ReviewResult.APPROVE);
    store.review.allReviews.forEach(({ frameIndex, result, instanceId, instanceItemId, camera, type }) => {
      if (result === ReviewResult.REJECT) {
        frameReviewStatus[frameIndex] = ReviewResult.REJECT;
        // calc missed
        let shapeExisted = true;
        if (!instanceId || !instanceItemId) {
          shapeExisted = false;
        } else {
          const instance = instancesMap[instanceId];
          if (!instance) {
            shapeExisted = false;
          } else {
            const item = instance.items[instanceItemId];
            if (!item) {
              shapeExisted = false;
            } else {
              const cameraData = item.cameras[camera];
              if (!cameraData) {
                shapeExisted = false;
              } else {
                const frameData = cameraData.frames[frameIndex];
                if (!frameData) {
                  shapeExisted = false;
                }
              }
            }
          }
        }
        if (!shapeExisted) {
          objects.total += 1;
          objects.missed += 1;
        }
        type?.forEach((t) => {
          issues[t] += 1;
        });
      } else if (result === ReviewResult.SUSPEND && frameReviewStatus[frameIndex] !== ReviewResult.REJECT) {
        frameReviewStatus[frameIndex] = ReviewResult.SUSPEND;
      }
      reviewedFrameMap[frameIndex] = true;
    });

    let instanceCount = 0;
    let distinctInstanceCount = 0;
    const instances = Object.values(instancesMap);
    for (let i = 0; i < instances.length; i += 1) {
      const instance = instances[i];
      const items = Object.values(instance.items);
      const category = instance.categoryRef.className;
      if (!categories[category]) {
        categories[category] = { total: 0, approved: 0, rejected: 0, suspended: 0, missed: 0, reviewed: 0 };
      }
      if (!categoryShapes[category]) {
        categoryShapes[category] = {};
      }
      const instanceFrames = new Set();
      for (let j = 0; j < items.length; j += 1) {
        const item = items[j];
        const cameras = Object.values(item.cameras);
        for (let k = 0; k < cameras.length; k += 1) {
          const camera = cameras[k];
          const frames = Object.values(camera.frames);
          for (let l = 0; l < frames.length; l += 1) {
            const frame = frames[l];
            const shape = `${getToolTypeFromFrameData(frame)}`;
            if (!shapes[shape]) {
              shapes[shape] = { total: 0, approved: 0, rejected: 0, suspended: 0, missed: 0, reviewed: 0 };
            }
            if (!categoryShapes[category][shape]) {
              categoryShapes[category][shape] = { total: 0, approved: 0, rejected: 0, suspended: 0, missed: 0, reviewed: 0 };
            }
            objects.total += 1;
            shapes[shape].total += 1;
            categories[category].total += 1;
            categoryShapes[category][shape].total += 1;
            const reviewResult = store.review.getReviewForInstanceItem(item, camera.camera, frame.frameIndex);
            if (reviewResult === ReviewResult.REJECT) {
              shapes[shape].rejected += 1;
              objects.rejected += 1;
              categories[category].rejected += 1;
              categoryShapes[category][shape].rejected += 1;
            } else if (reviewResult === ReviewResult.SUSPEND) {
              shapes[shape].suspended += 1;
              objects.suspended += 1;
              categories[category].suspended += 1;
              categoryShapes[category][shape].suspended += 1;
            } else {
              shapes[shape].approved += 1;
              objects.approved += 1;
              categories[category].approved += 1;
              categoryShapes[category][shape].approved += 1;
            }
            if (reviewedFrameMap[frame.frameIndex]) {
              objects.reviewed += 1;
              shapes[shape].reviewed += 1;
              categories[category].reviewed += 1;
              categoryShapes[category][shape].reviewed += 1;
            }
            instanceFrames.add(frame.frameIndex);
          }
        }
      }
      instanceCount += instanceFrames.size;
      distinctInstanceCount += 1;
    }
    return {
      objects,
      shapes,
      frames: {
        total: frameReviewStatus.length,
        approved: frameReviewStatus.filter((i) => i === ReviewResult.APPROVE).length,
        rejected: frameReviewStatus.filter((i) => i === ReviewResult.REJECT).length,
        suspended: frameReviewStatus.filter((i) => i === ReviewResult.SUSPEND).length,
        missed: 0,
        reviewed: Object.keys(reviewedFrameMap).length,
      },
      issues,
      categories,
      categoryShapes,
      instanceCount,
      distinctInstanceCount,
    };
  };

  render() {
    const { loading, frameCount } = store.frame;
    const hasFrameControl = frameCount > 1;
    return (
      <LayoutWrapper
        className="video-tracking-app"
        loading={loading || !store.initialized}
      >
        <AutoSaver
          ref={this.saverRef}
          leaveCheck
          data={{ storePointer: store.undo.pointer, storeId: store.undo.lastStoreId }}
          save={() => this.save(true)}
        />
        <Toolbar onSave={() => this.save()} />
        <div
          className="container"
          style={{
            height: `calc(100% - ${hasFrameControl ? `${this.frameControlHeight + TOOLBAR_HEIGHT}px` : `${TOOLBAR_HEIGHT}px`})`,
          }}
        >
          <Sidebar />
          <div style={{ width: `calc(100% - ${SIDEBAR_WIDTH + ATTR_PANEL_WIDTH}px)` }}>
            <CamerasContainer app={this.props.app} />
          </div>
          <AttributesPanel />
        </div>
        {hasFrameControl && (
          <FrameControl />
        )}
        <AttributesModal />
        <PointAttributesModal />
        <FrameAttributesModal />
        <ReviewModal />
        <ReviewComment />
      </LayoutWrapper>
    );
  }
}

export default AppWrapper(observer(VideoTracking), {
  mappingMethods: Object.values(methods),
});
