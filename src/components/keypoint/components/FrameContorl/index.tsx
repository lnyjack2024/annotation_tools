import React from 'react';
import cx from 'classnames';
import { isEqual } from 'lodash';
import FrameActions from './FrameActions';
import FramesRenderer, { FrameItem, EventAction } from '../../../../libs/FramesRenderer';
import { Up, SortAsc } from '../../../common/icons';
import formatMessage from '../../locales';
import rootStore from '../../store/RootStore';
import { getRGBAColor, getInstanceFrames } from '../../utils';
import { InstanceAct, CategoryInstancesMap, ReviewResult, Image } from '../../types';
import { InstancesReviewsMap } from '../../index';
import 'antd/es/slider/style/index.css';
import './index.scss';

interface FrameControlProps {
  frames: Image[];
  frameLoading: boolean;
  currentFrame: number;
  categoryInstancesMap: CategoryInstancesMap;
  instances: {[id: string] :InstanceAct};
  selectedInstance: InstanceAct | undefined;
  selectedInstanceGroup: string;
  instancesReviewsMap: InstancesReviewsMap;
  selectGroup: (instanceId: string, name: string) => void;
  setFrame: (frame: number) => void;
  onHeightChange: (height: number) => void;
}

interface FrameControlState {
  framesCollapsed: boolean;
  framesHeight: number;
  visibleFramesIndex: number;
  visibleFramesIndexArr: number[];
}

const frameLabelHeight = 20;
const frameLabelColor = '#343846';
const frameLabelSelectedColor = '#292C38';
const actionsContainerHeight = 48;

export default class FrameControl extends React.Component<FrameControlProps, FrameControlState> {
  framesRenderer: FramesRenderer | null = null;

  framesContainer = React.createRef<HTMLDivElement>();

  itemsContainer = React.createRef<HTMLDivElement>();

  state = {
    framesCollapsed: true,
    framesHeight: 64,
    visibleFramesIndex: 0,
    visibleFramesIndexArr: [],
  };

  get isEmpty() {
    const { categoryInstancesMap } = this.props;
    return Object.values(categoryInstancesMap).every((categoryInstances) => Object.keys(categoryInstances).length === 0);
  }

  get allInstanceIds() {
    const { categoryInstancesMap, instances } = this.props;
    const categories = Object.keys(categoryInstancesMap);
    return Object.values(categoryInstancesMap)
      .flatMap((categoryInstances) => Object.keys(categoryInstances))
      .sort((a, b) => {
        const instanceA = instances[a];
        const instanceB = instances[b];
        const instanceAFirstFrame = Number(Object.keys(instanceA?.children[0]?.frames)[0] || 0);
        const instanceBFirstFrame = Number(Object.keys(instanceB?.children[0]?.frames)[0] || 0);
        if (instanceAFirstFrame > instanceBFirstFrame) {
          return 1;
        }
        if (instanceAFirstFrame < instanceBFirstFrame) {
          return -1;
        }
        const instanceACategoryIndex = categories.indexOf(instanceA?.category || '');
        const instanceBCategoryIndex = categories.indexOf(instanceB?.category || '');
        if (instanceACategoryIndex > instanceBCategoryIndex) {
          return 1;
        }
        if (instanceACategoryIndex < instanceBCategoryIndex) {
          return -1;
        }
        return (instanceA?.number || 0) > (instanceB?.number || 0) ? 1 : -1;
      });
  }

  componentDidMount() {
    if (this.framesContainer.current) {
      this.framesRenderer = new FramesRenderer(this.framesContainer.current, this.props.frames.length);
      this.framesRenderer.on(EventAction.HEIGHT_CHANGE, this.updateHeight);
      this.framesRenderer.on(EventAction.VISIBLE_FRAMES_UPDATE, this.updateVisibleFrames);
      this.framesRenderer.on(EventAction.CURRENT_FRAME_CHANGE, this.changeFrame);
      this.framesRenderer.on(EventAction.ITEMS_OFFSET_CHANGE, this.updateItemsScroll);
      this.framesRenderer.items = this.getItems();
      this.framesRenderer.invalidFrames = this.props.frames.filter((v) => v.valid === false).map((v) => v.index);
    }
  }

  componentDidUpdate(prevProps: FrameControlProps) {
    if (prevProps.currentFrame !== this.props.currentFrame) {
      // current frame changes
      if (this.framesRenderer) {
        this.framesRenderer.currentFrame = this.props.currentFrame;
      }
    }
    if (!isEqual(prevProps.instances, this.props.instances) || !isEqual(prevProps.instancesReviewsMap, this.props.instancesReviewsMap)) {
      // selected instance frame status changes
      if (this.framesRenderer) {
        this.framesRenderer.items = this.getItems();
      }
    } else if (prevProps.selectedInstance?.id !== this.props.selectedInstance?.id) {
      // selected instance changes, or instances changes
      if (this.framesRenderer) {
        this.framesRenderer.items = this.getItems();
      }
    }

    if (!isEqual(prevProps.frames, this.props.frames) && this.framesRenderer) {
      this.framesRenderer.invalidFrames = this.props.frames.filter((v) => v.valid === false).map((v) => v.index);
    }
  }

  componentWillUnmount() {
    if (this.framesRenderer) {
      this.framesRenderer.removeEventListeners();
      this.framesRenderer.off(EventAction.HEIGHT_CHANGE, this.updateHeight);
      this.framesRenderer.off(EventAction.VISIBLE_FRAMES_UPDATE, this.updateVisibleFrames);
      this.framesRenderer.off(EventAction.CURRENT_FRAME_CHANGE, this.changeFrame);
      this.framesRenderer.off(EventAction.ITEMS_OFFSET_CHANGE, this.updateItemsScroll);
    }
  }

  changeFrame = (frameIndex: number, instanceIndex?: number) => {
    this.props.setFrame(frameIndex);
    if (instanceIndex !== undefined && instanceIndex > -1 && !this.state.framesCollapsed) {
      const selectedInstence = this.props.instances[this.allInstanceIds[instanceIndex]];
      this.props.selectGroup(selectedInstence.id, selectedInstence.children[0].name);
    }
  };

  getItems(): { [id: string]: FrameItem } {
    const { selectedInstance, instancesReviewsMap, instances } = this.props;
    const frameColor: { [frameIndex: number]: string } = {};
    if (selectedInstance) {
      const instanceReviewsMap = instancesReviewsMap[selectedInstance.id];
      if (instanceReviewsMap) {
        Object.keys(instanceReviewsMap).forEach((f) => {
          const frameIndex = Number(f);
          const reviewResult = instanceReviewsMap[frameIndex]?.result;
          if (reviewResult === ReviewResult.APPROVE) {
            frameColor[frameIndex] = '#3E6F45';
          } else if (reviewResult === ReviewResult.REJECT) {
            frameColor[frameIndex] = '#9C4434';
          } else if (reviewResult === ReviewResult.SUSPEND) {
            frameColor[frameIndex] = '#A28900';
          }
        });
      }
    }

    if (this.state.framesCollapsed) {
      const frameStatus = getInstanceFrames(selectedInstance);
      if (selectedInstance) {
        return {
          [selectedInstance.id]: {
            frameStatus,
            frameColor,
            color: getRGBAColor(selectedInstance.displayColor),
            showCards: true,
            selected: true,
          },
        };
      }
      return {
        global: {
          frameStatus,
          color: '#5C5F6B',
          showCards: true,
          selected: true,
        },
      };
    }

    const items: { [id: string]: FrameItem } = {};
    this.allInstanceIds.forEach((instanceId) => {
      const instance = instances[instanceId];
      items[instanceId] = {
        frameStatus: {},
        color: getRGBAColor(instance?.displayColor),
      };
    });
    Object.values(instances).forEach((instance) => {
      if (instance) {
        items[instance.id].frameStatus = getInstanceFrames(instance);
      }
    });
    if (selectedInstance) {
      items[selectedInstance.id].frameColor = frameColor;
      items[selectedInstance.id].showCards = true;
      items[selectedInstance.id].selected = true;
    }
    return items;
  }

  updateHeight = (height: number) => {
    this.setState({ framesHeight: height });
    this.props.onHeightChange(height + actionsContainerHeight);
  };

  updateVisibleFrames = (currentIndex: number, indexArr?: number[]) => {
    this.setState((stat) => ({
      ...stat,
      visibleFramesIndex: currentIndex,
      ...indexArr && { visibleFramesIndexArr: indexArr },
    }));
  };

  updateItemsScroll = (top: number) => {
    if (this.itemsContainer.current) {
      this.itemsContainer.current.scroll({ top });
    }
  };

  onItemsScroll: React.UIEventHandler<HTMLDivElement> = (e) => {
    if (this.framesRenderer) {
      this.framesRenderer.itemsOffset = (e.target as HTMLDivElement).scrollTop;
    }
  };

  toggleCollapse = () => {
    if (!this.isEmpty) {
      this.setState((stat) => ({
        framesCollapsed: !stat.framesCollapsed,
      }), () => {
        // update renderer
        if (this.framesRenderer) {
          this.framesRenderer.scrollable = !this.state.framesCollapsed;
          this.framesRenderer.items = this.getItems();
        }
      });
    }
  };

  renderItemLabels() {
    const { instances, selectedInstance, selectGroup } = this.props;
    const { framesCollapsed } = this.state;
    if (framesCollapsed) {
      const ontologyItem = rootStore.ontology.getOntologyInfo(selectedInstance?.category || '');
      let isReject = false;
      let isPending = false;
      let isApproved = false;
      if (selectedInstance) {
        const allFrameReviews = Object.values(this.props.instancesReviewsMap[selectedInstance.id] || {});
        if (allFrameReviews.length > 0) {
          isReject = allFrameReviews.some((i) => i.result === ReviewResult.REJECT);
          if (!isReject) {
            isPending = allFrameReviews.some((i) => i.result === ReviewResult.SUSPEND);
          }
          if (!isPending) {
            isApproved = allFrameReviews.length === this.props.frames.length && allFrameReviews.every((i) => i.result === ReviewResult.APPROVE);
          }
        }
      }
      return (
        <div
          className="frame-item-label"
          style={{
            height: frameLabelHeight,
            background: framesCollapsed ? frameLabelSelectedColor : frameLabelColor,
          }}
        >
          {selectedInstance ? (
            <>
              <div>
                <div
                  className="frame-item-label-dot"
                  style={{ backgroundColor: getRGBAColor(ontologyItem?.display_color, 1) }}
                />
                { ontologyItem?.display_name || ontologyItem?.class_name }
                { selectedInstance.number }
              </div>
              {(isApproved || isReject || isPending) && (
                <div
                  className={cx('frame-item-label-review', {
                    approved: isApproved,
                    rejected: isReject,
                    pending: isPending,
                  })}
                />
              )}
            </>
          ) : formatMessage('PROGRESS_GLOBAL_LABEL')}
        </div>
      );
    }

    return (
      <>
        {this.allInstanceIds.map((instanceId) => {
          const instance = instances[instanceId];
          const selected = selectedInstance && selectedInstance.id === instanceId;
          const ontologyItem = rootStore.ontology.getOntologyInfo(instance?.category || '');
          const allFrameReviews = Object.values(this.props.instancesReviewsMap[instanceId] || {});
          const isReject = allFrameReviews.some((i) => i.result === ReviewResult.REJECT);
          let isPending = false;
          let isApproved = false;
          if (allFrameReviews.length > 0) {
            if (!isReject) {
              isPending = allFrameReviews.some((i) => i.result === ReviewResult.SUSPEND);
            }
            if (!isPending) {
              isApproved = allFrameReviews.every((i) => i.result === ReviewResult.APPROVE);
            }
          }

          return instance ? (
            <div
              key={instanceId}
              className="frame-item-label"
              style={{
                height: frameLabelHeight,
                background: selected ? frameLabelSelectedColor : frameLabelColor,
              }}
              onClick={() => selectGroup(instanceId, instance.children[0].name)}
            >
              <div>
                <div
                  className="frame-item-label-dot"
                  style={{ backgroundColor: getRGBAColor(instance.displayColor, 1) }}
                />
                { ontologyItem?.display_name || ontologyItem?.class_name }
                { instance?.number }
              </div>
              {(isApproved || isReject || isPending) && (
                <div
                  className={cx('frame-item-label-review', {
                    approved: isApproved,
                    rejected: isReject,
                    pending: isPending,
                  })}
                />
              )}
            </div>
          ) : null;
        })}
      </>
    );
  }

  render() {
    const { frames, frameLoading, currentFrame } = this.props;
    const { framesCollapsed, framesHeight } = this.state;
    return (
      <div
        className="frame-control"
        style={{
          height: framesHeight + actionsContainerHeight,
          transition: 'height 0.15s',
        }}
      >
        <div className="frame-actions">
          <div className="frame-items-sort">
            <span><SortAsc /></span>
            {formatMessage('PROGRESS_SORT_LABEL')}
          </div>
          <FrameActions
            currentFrameValid={frames[currentFrame]?.valid !== false}
            frameCount={frames.length}
            frameLoading={frameLoading}
            currentFrame={currentFrame}
            setFrame={this.changeFrame}
          />
          <div
            className={cx('frame-collapse', {
              disabled: this.isEmpty,
              transform: !framesCollapsed,
            })}
            onClick={this.toggleCollapse}
          >
            <Up />
          </div>
        </div>
        <div className="frames">
          <div className="frame-items-container">
            <div
              ref={this.itemsContainer}
              className="frame-items"
              style={{ height: framesHeight - 44 }}
              onScroll={this.onItemsScroll}
            >
              {this.renderItemLabels()}
            </div>
          </div>
          <div className="frame-steps">
            <div ref={this.framesContainer} />
          </div>
        </div>
      </div>
    );
  }
}
