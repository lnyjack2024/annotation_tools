import React, { useState, useEffect } from 'react';
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu';
import { PlusCircleOutlined } from '@ant-design/icons';
import cx from 'classnames';
import { InstanceAct, LandmarkEditType, DELETETYPE, Frame } from '../types';
import RectangleFillIcon from '../../common/icons/RectangleFill';
import KeypointsIcon from '../../common/icons/Keypoints';
import DownArrow from '../../common/icons/DownArrow';
import { InstancesReviewsMap } from '../index';
import rootStore from '../store/RootStore';
import { OntologyChild, OntologyItem } from '../store/OntologyStore';
import formatMessage from '../locales';
import { DotFill, PlusCircleStroke } from '../../common/icons';
import './SideMenus.scss';
import Canvas from './Canvas';
import { observer } from 'mobx-react';

enum MENUTYPE {
  DELETE = 'delete'
}

export interface SideMenusProps {
  canvas: Canvas | null;
  readonly: boolean;
  loading: boolean;
  currentFrame: number;
  instances: InstanceAct[];
  instancesFrames: {
    [id: string]: {
      [frameIndex: number]: boolean;
    }
  },
  selectedInstance?: InstanceAct;
  selectedOntologyGroup: string;
  instancesReviewsMap: InstancesReviewsMap;
  addInstance: (ontologyName: string) => void;
  selectGroup: (groupId: string, name: string) => void;
  addInstanceInFrame: (instanceId: string, groupName?: string) => void;
  removeInstanceFrames: (type: DELETETYPE, instance: InstanceAct, name?: string) => void;
}

type OntologyProps = {
  ontology: OntologyItem;
  ontologyInstances: InstanceAct[];
  canAdd: boolean;
};

type InstanceProps = {
  currentFrame: number;
  ontologyInstances: InstanceAct[];
  ontology: OntologyItem;
  isUnfold: boolean;
  selectedOntologyGroup: string;
};

interface DelInstance {
  instance: InstanceAct,
  name?: string
}

const SideMenus = ({
  canvas,
  readonly,
  loading,
  currentFrame,
  selectedOntologyGroup,
  instances,
  selectedInstance,
  instancesReviewsMap,
  selectGroup,
  addInstance,
  addInstanceInFrame,
  removeInstanceFrames
}: SideMenusProps) => {
  const [unfoldOntology, setUnfoldOntology] = useState<string[]>([]);
  const [delIsntace, setDelInstance] = useState<DelInstance | null>();

  useEffect(() => {
    if (selectedInstance) {
      if (unfoldOntology.length === 0) {
        setUnfoldOntology([selectedInstance.category]);
      } else {
        const newUnfoldOntology = [...unfoldOntology];
        const index = newUnfoldOntology.findIndex((v) => v === selectedInstance.category);
        if (index < 0) {
          newUnfoldOntology.push(selectedInstance.category);
          setUnfoldOntology(newUnfoldOntology);
        }
      }
    }
  }, [selectedInstance]);
  const handleUnFold = (name: string) => {
    const newUnfoldOntology = [...unfoldOntology];
    const index = newUnfoldOntology.findIndex((v) => v === name);
    if (index >= 0) {
      newUnfoldOntology.splice(index, 1);
    } else {
      newUnfoldOntology.push(name);
    }
    setUnfoldOntology(newUnfoldOntology);
  };

  const menuHandleClick = (type: DELETETYPE) => {
    if (!delIsntace) return;
    removeInstanceFrames(type, delIsntace.instance, delIsntace.name);
    setDelInstance(null);
  };

  const Instances = ({
    ontologyInstances,
    ontology,
    isUnfold
  }: InstanceProps) => (
    <div
      className="instances-container"
      style={isUnfold ? { height: 'auto' } : {}}
    >
      {ontologyInstances.map((instance: InstanceAct) => {
        let empty = true;
        for (let i = 0; i < instance.children.length; i += 1) {
          const currentframeGroup = instance.children[i].frames[currentFrame];
          if (currentframeGroup && currentframeGroup.count > 0) {
            empty = false;
            break;
          }
        }
        const instanceCanAdd = instance.notEmpty > 0 && empty && !readonly;
        return (
          <div className="instance" key={instance.id}>
            <ContextMenuTrigger
              id={MENUTYPE.DELETE}
              holdToDisplay={1000}
            >
              <div
                className={cx('instance-label', { empty: instanceCanAdd })}
                onContextMenu={(e) => {
                  if (readonly) {
                    e.preventDefault();
                  } else {
                    setDelInstance({ instance });
                  }
                }}
              >
                <span>{`${ontology.display_name || ontology.class_name} ${instance.number}${!instance.notEmpty ? '（empty）' : ''}`}</span>
                {instanceCanAdd && (
                  <span
                    className="add right"
                    onClick={() => { addInstanceInFrame(instance.id); }}
                  >
                    <PlusCircleStroke />
                  </span>
                )}
              </div>
            </ContextMenuTrigger>
            <div className="instance-group">
              {ontology.children.map((group: OntologyChild, n: number) => {
                const child = instance.children.find((g) => g.name === group.name);
                const groupIsEmpty = !child || (child.frames[currentFrame] === undefined || child.frames[currentFrame].count === 0);
                const canAdd = child && child.count > 0 && groupIsEmpty && !readonly || false;
                return (
                  <ContextMenuTrigger id={MENUTYPE.DELETE} holdToDisplay={1000} key={instance.id + group.name}>
                    <div
                      className={cx('instance-group-item', { empty: canAdd })}
                      style={selectedInstance && selectedInstance.id === instance.id && selectedOntologyGroup === group.name ? { backgroundColor: '#4A90E2' } : {}}
                      onClick={() => {
                        if ((instance.id !== selectedInstance?.id || group.name !== selectedOntologyGroup) && !loading) {
                          selectGroup(instance.id, group.name);
                        }
                      }}
                      onContextMenu={() => {
                        if (!readonly) {
                          setDelInstance({ instance, name: group.name });
                        }
                      }}
                    >
                      <div className="icon">
                        {group.type === LandmarkEditType.KEYPOINT ? <KeypointsIcon /> : <RectangleFillIcon />}
                      </div>
                      <div className="name">{group.display_name || group.name}</div>
                      {
                        canAdd ?
                          (
                            <div
                              className="add right"
                              onClick={(e) => {
                                e.preventDefault();
                                addInstanceInFrame(instance.id, group.name);
                              }}
                            >
                              <PlusCircleStroke />
                            </div>
                          ) : (
                            <div className="right">
                              <span className={cx('dot', `${instancesReviewsMap[instance.id]?.[currentFrame]?.children?.[group.name]?.result}`)} />
                              <span className="number">{(instance.children[n].frames[currentFrame] && (instance.children[n].frames[currentFrame] as Frame).count) || 0}</span>
                            </div>
                          )
                      }
                    </div>
                  </ContextMenuTrigger>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );

  const Ontology = ({
    ontology,
    ontologyInstances,
    canAdd
  }: OntologyProps) => {
    const isUnfold = unfoldOntology && unfoldOntology.findIndex((v: string) => v === ontology.class_name) >= 0;
    return (
      <div className="ontology-item" key={ontology.class_name}>
        <div className="ontology-item-label">
          <div className="label-left">
            <span className="label-color" style={{ backgroundColor: ontology.display_color }} />
            <span className="label-name">{ontology.display_name || ontology.class_name}</span>
          </div>
          <div className="label-right">
            <span className="number">{ontologyInstances.length}</span>
            <span
              className={cx('label-add', { disabled: !canAdd })}
              onClick={() => {
                if (canAdd) {
                  addInstance(ontology.class_name);
                  if (!unfoldOntology.find((v) => v === ontology.class_name)) {
                    handleUnFold(ontology.class_name);
                  }
                }
              }}
            >
              <PlusCircleOutlined className="icon" />
            </span>
            <span className={cx('label-arrow', { unfold: isUnfold })} onClick={() => { handleUnFold(ontology.class_name); }}>
              <DownArrow />
            </span>
          </div>
        </div>
        <Instances
          currentFrame={currentFrame}
          ontologyInstances={ontologyInstances}
          ontology={ontology}
          isUnfold={isUnfold}
          selectedOntologyGroup={selectedOntologyGroup}
        />
      </div>
    );
  };

  const Missings = observer(() => {
    if (!rootStore.review.showReviews) {
      return null;
    }

    const { drawMode, missingName, missingReviews, selectedMissingReview } = rootStore.review;
    const currentFrameMissingReviews = missingReviews.filter((r) => r.frameIndex === currentFrame);
    const canAdd = !drawMode && (!selectedMissingReview || selectedMissingReview.data !== undefined);
    const isUnfold = unfoldOntology.findIndex((i) => i === rootStore.review.missingName) >= 0;
    return (
      <div className="ontology-item">
        <div className="ontology-item-label">
          <div className="label-left">
            <span className="label-color" />
            <span className="label-name">Missing</span>
          </div>
          <div className="label-right">
            <span className="number">{currentFrameMissingReviews.length}</span>
            <span
              className={cx('label-add', { disabled: !canAdd })}
              onClick={() => {
                if (canAdd) {
                  rootStore.review.addMissingReview(currentFrame);
                  if (!isUnfold) {
                    handleUnFold(missingName);
                  }
                }
              }}
            >
              <PlusCircleOutlined className="icon" />
            </span>
            <span
              className={cx('label-arrow', { unfold: isUnfold })}
              onClick={() => {
                handleUnFold(missingName);
              }}
            >
              <DownArrow />
            </span>
          </div>
        </div>
        <div
          className="instances-container"
          style={{
            ...isUnfold && { height: 'auto' },
          }}
        >
          {currentFrameMissingReviews.map((r) => (
            <div className="instance missing" key={r.id}>
              <div className="instance-label">
                <span>{`Missing ${r.number}`}</span>
              </div>
              <div className="instance-group">
                <div
                  className={cx('instance-group-item missing', {
                    selected: selectedMissingReview?.id === r.id,
                  })}
                  onClick={() => {
                    rootStore.review.setSelectedMissingReview(r);
                    if (r.data?.position) {
                      canvas?.fitPoint(r.data.position);
                    }
                  }}
                >
                  <div className="icon">
                    <DotFill />
                  </div>
                  <div className="name">Dot</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  });

  return (
    <div
      className="side-menus-container"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="side-menus-box">
        <Missings />
        {rootStore.ontology.ontology.map((ontologyItem: OntologyItem) => {
          const ontologyInstances = instances.filter((instance) => instance.category === ontologyItem.class_name);
          return (
            <Ontology
              key={ontologyItem.class_name}
              ontology={ontologyItem}
              ontologyInstances={ontologyInstances}
              canAdd={ontologyInstances.filter((instance) => !instance.notEmpty).length <= 0 && !readonly}
            />
          );
        })}
      </div>
      {!readonly && (
        <ContextMenu id={MENUTYPE.DELETE}>
          {Object.keys(DELETETYPE).map((v) => (
            <MenuItem key={v} onClick={() => { menuHandleClick(v as DELETETYPE); }}>{formatMessage(`DELETE_${v}_FRAMES`)}</MenuItem>
          ))}
        </ContextMenu>
      )}
    </div>
  );
};

export default SideMenus;
