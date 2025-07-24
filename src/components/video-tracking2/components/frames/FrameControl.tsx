import React from 'react';
import { makeObservable, observable, action, reaction, IReactionDisposer } from 'mobx';
import { observer } from 'mobx-react';
import { Slider } from 'antd';
import hexToRgba from 'hex-to-rgba';
import FrameActions from './FrameActions';
import ItemLabel from './ItemLabel';
import FramesRenderer, { FrameItem, EventAction } from '../../../../libs/FramesRenderer';
import { Minus, Plus } from '../../../common/icons';
import Instance from '../../model/Instance';
import InstanceItem from '../../model/InstanceItem';
import store from '../../store/RootStore';
import { ReviewResult } from '../../types';
import './FrameControl.scss';

const itemKeySeparator = '|S|';
const defaultFrameColor = '#5C5F6B';
const actionsContainerHeight = 40;
function getRGBAColor(category: string, alpha = 0.2) {
  const { displayColor } = store.ontology.getCategory(category) || {};
  if (displayColor) {
    return hexToRgba(displayColor, alpha);
  }
  return defaultFrameColor;
}
function getFrameColor(instanceItem: InstanceItem, camera: string) {
  const frameColor: { [frameIndex: number]: string } = {};
  const cameraData = instanceItem.cameras[camera];
  if (cameraData) {
    Object.values(cameraData.frames).forEach(({ frameIndex }) => {
      const result = store.review.getReviewForInstanceItem(instanceItem, camera, frameIndex);
      if (result) {
        if (result === ReviewResult.REJECT) {
          frameColor[frameIndex] = '#9C4434';
        } else if (!store.isRework) {
          if (result === ReviewResult.APPROVE) {
            frameColor[frameIndex] = '#3E6F45';
          } else if (result === ReviewResult.SUSPEND) {
            frameColor[frameIndex] = '#A28900';
          }
        }
      }
    });
  }
  return frameColor;
};

enum FramesMode {
  DEFAULT = 'default',
}

class FrameControl extends React.Component {
  reactionDisposers: IReactionDisposer[] = [];

  framesRenderer: FramesRenderer | null = null;

  framesContainer = React.createRef<HTMLDivElement>();

  itemsContainer = React.createRef<HTMLDivElement>();

  framesMode = FramesMode.DEFAULT;

  framesHeight = 64;

  visibleFramesIndex = 0;

  visibleFramesIndexArr: number[] = [];

  itemKeys: string[] = [];

  constructor(props: any) {
    super(props);

    makeObservable(this, {
      framesMode: observable,
      visibleFramesIndex: observable,
      visibleFramesIndexArr: observable,
      itemKeys: observable,
      getItems: action,
      updateVisibleFrames: action,
      updateFrameCountIndex: action,
    });

    // when current frame changes
    this.reactionDisposers.push(reaction(
      () => store.frame.currentFrame,
      () => {
        if (this.framesRenderer) {
          this.framesRenderer.currentFrame = store.frame.currentFrame;
        }
      },
    ));

    // when instance changes, or data changes
    this.reactionDisposers.push(reaction(
      () => [
        store.instance.selectedInstanceItems,
        store.instance.selectedInstances,
        store.undo.pointer,
        store.undo.lastStoreId,
        store.config.reviewMode,
      ],
      (
        [items, instances, pointer, storeId, reviewMode],
        [prevItems, prevInstances, prevPointer, prevStoreId, prevReviewMode]
      ) => {
        const selectedChanged = (items as InstanceItem[]).length !== (prevItems as InstanceItem[]).length
          || (items as InstanceItem[]).some((i) => (prevItems as InstanceItem[]).indexOf(i) < 0)
          || (instances as Instance[]).length !== (prevInstances as Instance[]).length
          || (instances as Instance[]).some((i) => (prevInstances as Instance[]).indexOf(i) < 0);
        if (this.framesRenderer && (
          selectedChanged ||
          pointer !== prevPointer ||
          storeId !== prevStoreId ||
          reviewMode !== prevReviewMode
        )) {
          this.framesRenderer.items = this.getItems();
        }
      },
    ));
  }

  componentDidMount() {
    if (this.framesContainer.current) {
      this.framesRenderer = new FramesRenderer(this.framesContainer.current, store.frame.frameCount);
      this.framesRenderer.on(EventAction.VISIBLE_FRAMES_UPDATE, this.updateVisibleFrames);
      this.framesRenderer.on(EventAction.CURRENT_FRAME_CHANGE, this.updateCurrentFrame);
      this.framesRenderer.items = this.getItems();
    }
  }

  componentWillUnmount() {
    if (this.framesRenderer) {
      this.framesRenderer.removeEventListeners();
      this.framesRenderer.off(EventAction.VISIBLE_FRAMES_UPDATE, this.updateVisibleFrames);
      this.framesRenderer.off(EventAction.CURRENT_FRAME_CHANGE, this.updateCurrentFrame);
    }
    this.reactionDisposers.forEach((disposer) => disposer());
  }

  getItems() {
    const items: { [id: string]: FrameItem } = {};

    const { selectedInstances, selectedInstanceItems } = store.instance;
    const { currentCamera } = store.frame;

    if (selectedInstances.length > 0) {
      const selectedInstanceItem = selectedInstanceItems[0];
      const selectedInstance = selectedInstanceItem ? selectedInstanceItem.instance : selectedInstances[0];
      if (!selectedInstanceItem) {
        // only instance selected
        items[selectedInstance.id] = {
          frameStatus: selectedInstance.frameStatus,
          color: getRGBAColor(selectedInstance.category),
        };
      } else {
        // instance item in current frame selected
        const key = [selectedInstance.id, selectedInstanceItem.id, currentCamera].join(itemKeySeparator);
        items[key] = {
          frameStatus: selectedInstanceItem.cameras[currentCamera]?.frameStatus,
          frameColor: getFrameColor(selectedInstanceItem, currentCamera),
          color: hexToRgba(selectedInstanceItem.categoryItemRef.displayColor || defaultFrameColor, 0.2),
          showCards: true,
          selected: true,
        };
      }
    } else if (this.framesMode === FramesMode.DEFAULT) {
      const frameStatus = Object.values(store.instance.instances)
        .map((i) => i.frameStatus)
        .reduce((acc, curr) => ({ ...acc, ...curr }), {});
      items.global = {
        frameStatus,
        color: defaultFrameColor,
        selected: true,
      };
    }

    this.itemKeys = Object.keys(items);
    return items;
  }

  updateVisibleFrames = (currentIndex: number, indexArr?: number[]) => {
    this.visibleFramesIndex = currentIndex;
    if (indexArr) {
      this.visibleFramesIndexArr = indexArr;
    }
  };

  updateCurrentFrame = (frameIndex: number, itemIndex: number) => {
    const itemKey = this.itemKeys[itemIndex];
    if (itemKey) {
      const [instanceId, instanceItemId] = itemKey.split(itemKeySeparator);
      const instance = store.instance.getInstanceById(instanceId);
      if (instance) {
        const item = instance.items[instanceItemId];
        if (item) {
          store.instance.selectInstanceItem(item);
        } else {
          const isSingle = instance.isSingle && store.frame.isSingleCamera;
          if (!isSingle) {
            store.instance.selectInstanceItem(null);
          }
          store.instance.selectInstance(instance);
        }
      }
    }
    store.frame.setFrame(frameIndex);
  };

  updateFrameCountIndex = (v: number) => {
    this.visibleFramesIndex = Math.min(
      Math.max(v, this.visibleFramesIndexArr[0]),
      this.visibleFramesIndexArr[this.visibleFramesIndexArr.length - 1],
    );
    if (this.framesRenderer) {
      this.framesRenderer.currentRangeIndex = this.visibleFramesIndex;
    }
  };

  render() {
    const { selectedInstances, selectedInstanceItems } = store.instance;
    const selectedInstanceItem = selectedInstanceItems.length > 0 ? selectedInstanceItems[0] : null;
    let selectedInstance: Instance | null = null;
    if (selectedInstanceItem) {
      selectedInstance = selectedInstanceItem.instance;
    } else if (selectedInstances.length > 0) {
      selectedInstance = selectedInstances[0];
    }
    return (
      <div
        className="frame-control"
        style={{
          height: this.framesHeight + actionsContainerHeight,
        }}
      >
        <div className="frame-actions">
          <div>
            {selectedInstance && (
              <div className="label">
                <div
                  className="label-dot"
                  style={{ backgroundColor: selectedInstance.categoryRef.displayColor }}
                />
                {selectedInstance.label}
              </div>
            )}
          </div>
          <FrameActions />
          <div />
        </div>
        <div className="frames">
          <div className="frame-items-container">
            <div className="frame-scaler">
              <div
                className="frame-action-icon"
                onClick={() => this.updateFrameCountIndex(this.visibleFramesIndex - 1)}
              >
                <Minus />
              </div>
              <div style={{ flex: 1 }}>
                <Slider
                  tooltipVisible={false}
                  step={1}
                  min={this.visibleFramesIndexArr[0]}
                  max={this.visibleFramesIndexArr[this.visibleFramesIndexArr.length - 1]}
                  value={this.visibleFramesIndex}
                  onChange={this.updateFrameCountIndex}
                />
              </div>
              <div
                className="frame-action-icon"
                onClick={() => this.updateFrameCountIndex(this.visibleFramesIndex + 1)}
              >
                <Plus />
              </div>
            </div>
            <div
              ref={this.itemsContainer}
              className="frame-items"
              style={{ height: this.framesHeight - 44 }}
            >
              {this.itemKeys.map((itemKey) => (
                <ItemLabel
                  key={itemKey}
                  itemKey={itemKey}
                  separator={itemKeySeparator}
                />
              ))}
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

export default observer(FrameControl);
