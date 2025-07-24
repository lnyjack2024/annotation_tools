import Paper from 'paper';
import screenfull from 'screenfull';
import { v4 as uuid } from 'uuid';
import { message } from 'antd';
import Canvas, { SHAPE_TYPE } from '../components/Canvas';
import { CategoryPathShape, GroupInfo, LandmarkEditType, UpdatedShape, ReviewResult, HandleType, Group } from '../types';
import { isInput } from '../../../utils';
import formatMessage from '../locales';
import rootStore from '../store/RootStore';

export interface ToolEventExtend extends paper.ToolEvent {
  event: MouseEvent;
  mouseDown: boolean;
}

export interface ToolProps extends paper.Tool {
  mouseDown: boolean;
}

export interface MoveHandles extends Group {
  actual: paper.Point;
  opposite: paper.Point;
  type: HandleType;
  pointIndex: number;
  pathId: string;
  frameIndex: number;
}

export default class Tool extends Paper.Tool {
  editor: Canvas | undefined;

  downPoint: paper.Point | null = null;

  downCenter: paper.Point | null = null;

  mouseDown = false;

  dragging = false;

  lastClick = -1;

  movingPaths: paper.Path[] = [];

  movingShapes: paper.Item[] = [];

  dragType = '';

  movingSegments: paper.Segment[] = [];

  movingHandles: MoveHandles | undefined = undefined;

  affectedCategories: { instanceId: string, category: string, groupName: string, pointCategory: string }[] = [];

  selectPath: paper.Path | null = null;

  minArea = 3;

  constructor(editor: Canvas) {
    super();
    this.editor = editor;
  }

  isRightButton = (event: ToolEventExtend) => event.event.which === 3 || event.modifiers.space;

  isCtrlKey = (event: ToolEventExtend) => event.event.ctrlKey;

  onMouseDown = (event: ToolEventExtend) => {
    if (this.isRightButton(event)) {
      this.downPoint = Paper.view.projectToView(event.point);
      this.downCenter = Paper.view.center;
      return;
    }
    if (this.editor) {
      this.mouseDown = true;
      const currentClick = Date.now();
      const interval = currentClick - this.lastClick;
      this.lastClick = currentClick;
      if (interval < 300) {
        // db click
        if (this.editor.warningBtn?.item) {
          const { instanceId, groupName, shapeIds, id } = this.editor.warningBtn.item.data || {};
          if (instanceId && groupName && shapeIds !== undefined) {
            rootStore.review.setSelectedReview({ frameIndex: this.editor.props.currentFrame, instanceId, groupName, shapeIds, result: ReviewResult.REJECT });
          } else if (id) {
            const review = rootStore.review.missingReviews.find((r) => r.id === id);
            rootStore.review.setSelectedMissingReview(review, true);
          }
        }
        return;
      }
      if (rootStore.review.isEnabled && !rootStore.review.drawMode && rootStore.review.selectedMissingReview && rootStore.review.selectedMissingReview.data === undefined) {
        // create missing dot when mouse up
        return;
      }
      const { type: hitsType } = this.editor.hits || {};
      if (!this.isCtrlKey(event) && this.editor.hits && this.editor.hits.item.data.type !== SHAPE_TYPE.KEYPOINT_BOX) {
        const { instanceId: selectedInstanceId, groupName: selectedGroupName, index, id } = this.editor.hits.item.data;
        // move start
        if (this.editor.selectedPoints.length > 0 && this.editor.isShapeInSelectedShapes(selectedInstanceId, selectedGroupName, index)) {
          // multi points
          this.movingShapes = this.editor.selectedPoints;
        } else if (this.editor.selectedRectangles.length > 0 && this.editor.isShapeInSelectedShapes(selectedInstanceId, selectedGroupName, id)) {
          // multi rectangles
          this.movingShapes = this.editor.selectedRectangles;
        } else if (Object.values(HandleType).includes(hitsType as HandleType)) {
          const { currentFrame } = this.editor.props;
          const { handleIn, handleOut, index: segIndex, path: { data: { instanceId, groupName, pointCategory: category, id: pathId, points } } } = this.editor.hits.segment;
          const pointIndex = points[segIndex];
          this.movingHandles = {
            actual: hitsType === HandleType.HANDLE_IN ? handleIn : handleOut,
            opposite: hitsType === HandleType.HANDLE_IN ? handleOut : handleIn,
            type: hitsType as HandleType,
            pointIndex,
            pathId,
            instanceId,
            groupName,
            category,
            frameIndex: currentFrame
          };
        } else if (this.editor.hits.item) {
          const { type: hitItemType } = this.editor.hits.item.data;
          if (
            (
              hitItemType === SHAPE_TYPE.RECTANGLE_PATH ||
              hitItemType === SHAPE_TYPE.RECTANGLE ||
              hitItemType === SHAPE_TYPE.RECTANGLE_POINT
            ) &&
            this.editor.hits.item.parent
          ) {
            // rectangle-control
            this.movingShapes = [this.editor.hits.item.parent];
            if (hitItemType === SHAPE_TYPE.RECTANGLE_PATH) {
              switch (this.editor.hits.item.data.controlIndex) {
                case 0:
                  this.dragType = 'top';
                  break;
                case 1:
                  this.dragType = 'right';
                  break;
                case 2:
                  this.dragType = 'bottom';
                  break;
                case 3:
                  this.dragType = 'left';
                  break;
                default:
                  break;
              }
            } else if (hitItemType === SHAPE_TYPE.RECTANGLE_POINT) {
              switch (this.editor.hits.item.data.controlIndex) {
                case 0:
                  this.dragType = 'tl';
                  break;
                case 1:
                  this.dragType = 'tr';
                  break;
                case 2:
                  this.dragType = 'br';
                  break;
                case 3:
                  this.dragType = 'bl';
                  break;
                default:
                  break;
              }
            } else {
              this.dragType = 'center';
            }
          } else if (hitItemType === SHAPE_TYPE.KEYPOINT) {
            // single point
            this.movingShapes = [this.editor.hits.item];
          }
        }
        this.affectedCategories = [];
        this.movingSegments = [];
        if (this.movingShapes.length === 1) {
          const { instanceId, category, groupName, index: pointIndex, type, id: shapeId } = this.movingShapes[0].data;
          if (type === SHAPE_TYPE.KEYPOINT) {
            this.editor?.props.setSelectedShape(pointIndex, { instanceId, category, groupName, shapeType: LandmarkEditType.KEYPOINT });
          } else if (type === SHAPE_TYPE.RECTANGLE_GROUP) {
            const { bounds: { topLeft, topRight, bottomRight, bottomLeft } } = this.movingShapes[0].children[0];
            this.selectPath = new Paper.Path();
            this.selectPath.data.id = shapeId;
            this.selectPath.add(topLeft);
            this.selectPath.add(topRight);
            this.selectPath.add(bottomRight);
            this.selectPath.add(bottomLeft);
            this.selectPath.closed = true;
            this.editor?.props.setSelectedShape(shapeId, { instanceId, category, groupName, shapeType: LandmarkEditType.RECTANGLE });
          }
        }

        if (!rootStore.review.drawMode) {
          this.movingShapes = [];
          this.selectPath = null;
        }
      } else {
        // select start
        this.editor.setMultiShapesUnselected();
        const localPoint = this.editor.getPointInImage(Paper.view.projectToView(event.point));
        if (this.editor.activeTool === CategoryPathShape.CIRCLE || (this.editor.activeTool === CategoryPathShape.RECTANGLE && !this.editor.canAddShape())) {
          this.selectPath = new Paper.Path({
            segments: [localPoint],
            strokeColor: 'red',
            strokeWidth: 2,
            strokeScaling: false,
          });
        } else if (
          this.editor.activeTool === CategoryPathShape.RECTANGLE &&
          this.editor.canAddShape() &&
          this.editor.canvasContainer.current
        ) {
          const { instanceId, category, groupName } = this.editor.props.selectedShapeInfo as GroupInfo;
          const id = uuid();
          this.selectPath = new Paper.Path();
          this.selectPath.data.id = id;
          this.selectPath.add(localPoint);
          this.selectPath.add(localPoint);
          this.selectPath.add(localPoint);
          this.selectPath.add(localPoint);
          this.selectPath.closed = true;
          this.editor.addRectangle(this.selectPath, this.editor?.props.selectedShapeInfo as GroupInfo);
          const rectangleBox = this.editor.getShapeByKey(instanceId, groupName, id);
          this.editor.props.setSelectedShape(id, { instanceId, category, groupName, shapeType: LandmarkEditType.RECTANGLE });
          this.movingShapes.push(rectangleBox);
          this.dragType = 'br';
          this.dragging = true;
        }
      }
    }
  };

  onMouseDrag = (event: ToolEventExtend) => {
    if (this.isRightButton(event)) {
      if (!this.downPoint || !this.downCenter) {
        this.downPoint = Paper.view.projectToView(event.point);
        this.downCenter = Paper.view.center;
      }

      const rotation = Math.round(Paper.view.rotation);
      const targetPoint = Paper.view.projectToView(event.point).rotate(-rotation, this.downPoint);
      const deltaPixel = targetPoint.subtract(this.downPoint);
      const candidateCenter = this.downCenter.subtract(deltaPixel.divide(Paper.view.zoom));
      Paper.view.center = candidateCenter;
      return;
    }
    if (rootStore.review.isEnabled && !rootStore.review.drawMode && this.editor?.warningBtn?.item.data?.id) {
      // move missing review
      if (this.editor) {
        const point = this.editor.getPointInImage(Paper.view.projectToView(event.point));
        this.editor.warningBtn.item.parent.position.set(point);
      }
      return;
    }
    if (this.editor?.props.isReview || this.editor?.props.readonly || this.editor?.warningBtn?.item) return;
    let resize = false;
    if (this.editor) {
      const localPoint = this.editor.getPointInImage(Paper.view.projectToView(event.point));
      const localLastPoint = this.editor.getPointInImage(Paper.view.projectToView(event.lastPoint));
      const offsetX = localPoint.x - localLastPoint.x;
      const offsetY = localPoint.y - localLastPoint.y;
      if (Math.abs(offsetX) > 0 || Math.abs(offsetY) > 0) {
        this.dragging = true;
      }

      if (this.movingShapes.length > 0) {
        // moving
        /* eslint-disable no-param-reassign */
        this.movingShapes.forEach((movingShape) => {
          const { frameIndex, instanceId, category, groupName, pointCategory: categoryName, index, type, displayColor } = movingShape.data;
          if (type === SHAPE_TYPE.RECTANGLE_GROUP && this.selectPath) {
            resize = true;
            switch (this.dragType) {
              case 'tl':
                this.selectPath.segments[0].point.x += offsetX;
                this.selectPath.segments[0].point.y += offsetY;
                this.selectPath.segments[1].point.y += offsetY;
                this.selectPath.segments[3].point.x += offsetX;
                break;
              case 'tr':
                this.selectPath.segments[1].point.x += offsetX;
                this.selectPath.segments[1].point.y += offsetY;
                this.selectPath.segments[0].point.y += offsetY;
                this.selectPath.segments[2].point.x += offsetX;
                break;
              case 'br':
                this.selectPath.segments[2].point.x += offsetX;
                this.selectPath.segments[2].point.y += offsetY;
                this.selectPath.segments[3].point.y += offsetY;
                this.selectPath.segments[1].point.x += offsetX;
                break;
              case 'bl':
                this.selectPath.segments[3].point.x += offsetX;
                this.selectPath.segments[3].point.y += offsetY;
                this.selectPath.segments[2].point.y += offsetY;
                this.selectPath.segments[0].point.x += offsetX;
                break;
              case 'top':
                this.selectPath.segments[0].point.y += offsetY;
                this.selectPath.segments[1].point.y += offsetY;
                break;
              case 'right':
                this.selectPath.segments[1].point.x += offsetX;
                this.selectPath.segments[2].point.x += offsetX;
                break;
              case 'bottom':
                this.selectPath.segments[2].point.y += offsetY;
                this.selectPath.segments[3].point.y += offsetY;
                break;
              case 'left':
                this.selectPath.segments[3].point.x += offsetX;
                this.selectPath.segments[0].point.x += offsetX;
                break;
              case 'center':
                this.selectPath.segments[0].point.x += offsetX;
                this.selectPath.segments[0].point.y += offsetY;
                this.selectPath.segments[1].point.x += offsetX;
                this.selectPath.segments[1].point.y += offsetY;
                this.selectPath.segments[2].point.x += offsetX;
                this.selectPath.segments[2].point.y += offsetY;
                this.selectPath.segments[3].point.x += offsetX;
                this.selectPath.segments[3].point.y += offsetY;
                break;
              default:
                break;
            }
            const shapeInfo: GroupInfo = {
              instanceId,
              category,
              groupName,
              shapeType: LandmarkEditType.RECTANGLE,
              displayColor,
            };
            this.editor?.addRectangle(this.selectPath, shapeInfo, false);
          } else if (type === SHAPE_TYPE.KEYPOINT) {
            const categoryKey = `${frameIndex}_${instanceId}_${groupName}_${categoryName}`;
            if (this.editor?.props.categoryPathShapes[categoryKey] === CategoryPathShape.CIRCLE) {
              const path = this.editor.getPathByCategory(instanceId, groupName, categoryName);
              if (path && path.data.isCircle) {
                const pointCategory = this.editor.props.categories.find((c) => c.name === categoryName);
                if (pointCategory) {
                  if (
                    this.affectedCategories.findIndex((affected) => affected.instanceId === instanceId && affected.groupName === groupName && affected.pointCategory === categoryName) < 0) {
                    this.affectedCategories.push({
                      instanceId,
                      category,
                      groupName,
                      pointCategory: categoryName
                    });
                  }
                  const sortedKeys = [...pointCategory.keys].sort((a, b) => a - b);
                  const pIndex1 = sortedKeys[0];
                  const pIndex2 = sortedKeys[Math.ceil(sortedKeys.length / 2)];
                  if (index !== pIndex1 && index !== pIndex2) {
                    return;
                  }
                }
              }
            }
            this.editor?.updatePath(movingShape as paper.Shape, { x: movingShape.position.x + offsetX, y: movingShape.position.y + offsetY });
            movingShape.position.x += offsetX;
            movingShape.position.y += offsetY;
          }
        });
        this.movingSegments.forEach((movingSegment) => {
          movingSegment.point.x += offsetX;
          movingSegment.point.y += offsetY;
        });
        this.affectedCategories.forEach(({ instanceId, category, groupName, pointCategory }) => {
          const container = { instanceId, category, groupName };
          this.editor?.updateCirclePath(pointCategory, true, container);
        });
        /* eslint-enable no-param-reassign */
      } else if (this.movingHandles) {
        // moving handle point
        this.movingHandles.actual.x += offsetX;
        this.movingHandles.actual.y += offsetY;
        this.movingHandles.opposite.x = -this.movingHandles.actual.x;
        this.movingHandles.opposite.y = -this.movingHandles.actual.y;
      } else if (this.selectPath) {
        // draw select path
        if (this.editor.activeTool === CategoryPathShape.CIRCLE || (this.editor.activeTool === CategoryPathShape.RECTANGLE && !this.editor.canAddShape())) {
          this.selectPath.add(localPoint);
        } else if (this.editor.activeTool === CategoryPathShape.RECTANGLE && !resize) {
          this.selectPath.segments[1].point.x += offsetX;
          this.selectPath.segments[2].point.x += offsetX;
          this.selectPath.segments[2].point.y += offsetY;
          this.selectPath.segments[3].point.y += offsetY;
          this.editor.addRectangle(this.selectPath, this.editor?.props.selectedShapeInfo as GroupInfo, false);
        }
      }
    }
  };

  onMouseUp = (event: ToolEventExtend) => {
    if (this.isRightButton(event)) {
      this.editor?.drag(Paper.view.center);
      this.downPoint = null;
      this.downCenter = null;
      return;
    }
    this.mouseDown = false;
    if (rootStore.review.isEnabled && !rootStore.review.drawMode && rootStore.review.selectedMissingReview && rootStore.review.selectedMissingReview.data === undefined) {
      // create missing dot when mouse up
      if (this.editor) {
        const point = this.editor.getPointInImage(Paper.view.projectToView(event.point));
        rootStore.review.finishMissingReview(point);
      }
      return;
    }
    if (this.editor?.warningBtn?.item) {
      const { data, position } = this.editor.warningBtn.item;
      if (data?.id) {
        // finish move missing review
        const review = rootStore.review.missingReviews.find((r) => r.id === data.id);
        if (review) {
          rootStore.review.updateMissingReview({
            ...review,
            data: {
              position: { x: position.x, y: position.y },
            },
          });
          rootStore.review.setSelectedMissingReview(review);
        }
      }
      return;
    }
    if (!this.isCtrlKey(event) && this.movingShapes.length > 0) {
      // move ends
      if (this.dragging && this.editor) {
        if (this.editor.activeTool === CategoryPathShape.CIRCLE) {
          const otherPoints: UpdatedShape[] = [];
          this.affectedCategories.forEach(({ instanceId, category, groupName, pointCategory }) => {
            const container = { instanceId, category, groupName };
            const updatedShapes = this.editor?.updateCirclePath(pointCategory, true, container);
            if (updatedShapes) {
              updatedShapes.forEach(({ shape, index }) => {
                if (index !== undefined && shape) {
                  otherPoints.push({
                    frameIndex: this.editor?.props.selectedShapeStatus.frameIndex || 0,
                    instanceId,
                    category,
                    groupName,
                    index,
                    shapeType: LandmarkEditType.KEYPOINT,
                    shape
                  });
                }
              });
            }
          });
          this.editor?.updatePointsPosition([...this.movingShapes.map((movingPoint) => {
            const { frameIndex, instanceId, category, groupName, index } = movingPoint.data;
            return {
              frameIndex,
              instanceId,
              category,
              groupName,
              index,
              shapeType: LandmarkEditType.KEYPOINT,
              shape: { position: { x: movingPoint.position.x, y: movingPoint.position.y } }
            };
          }), ...otherPoints]);
        } else if (this.editor.activeTool === CategoryPathShape.RECTANGLE) {
          this.editor?.updateRectanglePosition([...this.movingShapes.filter((movingRectangle) => {
            const { bounds: { width, height } } = movingRectangle.children[0];
            if (width < this.minArea || height < this.minArea) {
              this.editor?.deleteSelectedRectangle();
              message.warning(formatMessage('MIN_SIZE_ALERT'));
              return false;
            }
            return true;
          }).map((movingRectangle) => {
            const { instanceId, category, groupName, id, displayColor } = movingRectangle.data;
            const { bounds: { x, y, width, height } } = movingRectangle.children[0];
            const groupInfo = { frameIndex: this.editor?.props.selectedShapeStatus.frameIndex || 0, instanceId, category, groupName };
            const rectInfo = {
              x,
              y,
              width,
              height,
              displayColor: displayColor || '#5cdef0',
            };
            this.editor?.drawRectangle(rectInfo, groupInfo, id);
            return {
              ...groupInfo,
              id,
              shapeType: LandmarkEditType.RECTANGLE,
              shape: {
                ...rectInfo,
                id,
                visible: true, // default is visible when point added
              },
            };
          })]);
        }
      }
      if (this.selectPath) {
        this.selectPath.remove();
        this.selectPath = null;
      }
      this.movingShapes = [];
      this.movingSegments = [];
      this.affectedCategories = [];
      this.editor?.drawWarnings();
    } else if (this.movingHandles) {
      // handle move ends
      this.movingHandles = undefined;
    } else if (this.dragging && this.selectPath) {
      // select ends
      if (this.editor?.mainLayer) {
        const center = this.editor.mainLayer.localToGlobal(this.selectPath.bounds.center);
        const hits = this.editor.mainLayer.hitTestAll(center, {
          fill: true,
          segments: true,
          tolerance: this.selectPath.bounds.topLeft.getDistance(this.selectPath.bounds.bottomRight) / 2,
        });

        const selectedPoints: Set<paper.Shape> = new Set();
        const selectedRectangles: Set<paper.Group> = new Set();
        let selectedGroup: string | undefined;
        const isOneGroup = (instanceId: string, groupName: string) => {
          if (!selectedGroup) {
            selectedGroup = `${instanceId}_${groupName}`;
            return true;
          }
          return `${instanceId}_${groupName}` === selectedGroup;
        };
        hits.forEach((seg) => {
          if (this.selectPath!.contains(seg.item.bounds.center)) {
            if (seg.item.data.type === SHAPE_TYPE.KEYPOINT) {
              if (isOneGroup(seg.item.data.instanceId, seg.item.data.groupName)) {
                selectedPoints.add(seg.item as paper.Shape);
              }
            } else if (
              seg.item.data.type === SHAPE_TYPE.RECTANGLE ||
              seg.item.data.type === SHAPE_TYPE.RECTANGLE_POINT ||
              seg.item.data.type === SHAPE_TYPE.RECTANGLE_PATH
            ) {
              if (isOneGroup(seg.item.parent.data.instanceId, seg.item.parent.data.groupName)) {
                selectedRectangles.add(seg.item.parent as paper.Group);
              }
            }
          }
        });

        // selected
        if (selectedPoints.size) this.editor?.setMultiShapesSelected(Array.from(selectedPoints), CategoryPathShape.CIRCLE);
        if (selectedRectangles.size) this.editor?.setMultiShapesSelected(Array.from(selectedRectangles), CategoryPathShape.RECTANGLE);
      }
      this.selectPath.remove();
      this.selectPath = null;
    } else if (this.editor?.canAddShape() && this.editor.activeTool === CategoryPathShape.CIRCLE) {
      // add point
      const point = Paper.view.projectToView(event.point);
      // if (this.editor?.isPointInImage(point)) {
      this.editor.addKeypoint(point);
      // }
    } else if (this.editor && rootStore.review.drawMode) {
      // clear selection and move next
      this.editor.props.setNextEmptyShape();
    }
    this.dragging = false;
  };

  handleQa = (result: ReviewResult) => {
    if (this.editor?.props.selectedShapeStatus) {
      const { instanceId, groupName, frameIndex, id } = this.editor.props.selectedShapeStatus;
      let shapeIds = [];
      if (id !== undefined) {
        shapeIds = [id];
      } else if (this.editor?.selectedPoints.length > 0) {
        shapeIds = this.editor?.selectedPoints.map((point) => point.data.index);
      } else if (this.editor?.selectedRectangles.length > 0) {
        shapeIds = this.editor?.selectedRectangles.map((shape) => shape.data.id);
      }
      if (shapeIds.length) {
        shapeIds.sort((a, b) => a - b);
        if (result !== ReviewResult.REJECT && !rootStore.review.selectedReview) {
          rootStore.review.setReview(
            { result },
            {
              frameIndex,
              instanceId,
              groupName,
              shapeIds,
              result
            }
          );
        } else {
          rootStore.review.setSelectedReview({
            frameIndex,
            instanceId,
            groupName,
            shapeIds,
            result
          });
        }
        if ((result === ReviewResult.SUSPEND || result === ReviewResult.APPROVE) && !rootStore.review.selectedReview) {
          message.success(formatMessage(`QC_SET_${result.toLocaleUpperCase()}`));
        }
      }
    }
  };

  onKeyDown = ({ event }: { event: KeyboardEvent }) => {
    if (isInput()) return;
    const key = event.key.toLowerCase();
    if (this.editor?.props.isReview && key !== 'v') return;
    // Judgment modifier keyboard
    if (event.altKey || event.shiftKey) {
      return;
    }

    if (rootStore.review.drawMode) {
      this.drawOnKeyDown(event, key);
    } else if (rootStore.review.isEnabled) {
      this.QaOnKeyDown(event, key);
    }

    switch (key) {
      case ' ':
        event.preventDefault();
        if (rootStore.review.isEnabled) {
          this.editor?.props.handleChangeDrawMode(!rootStore.review.drawMode);
        }
        break;
      case 'f':
        event.preventDefault();
        if (screenfull.isEnabled) {
          screenfull.toggle();
        }
        break;
      // case 'g':
      //   event.preventDefault();
      //   if (this.editor && this.editor.gridLayer) {
      //     this.editor.gridLayer.visible = !rootStore.setting.isGridVisible;
      //   }
      //   rootStore.setting.setGridVisible(!rootStore.setting.isGridVisible);
      //   break;
      case 's':
        event.preventDefault();
        this.editor?.props.onSave();
        break;
      case 'z':
        event.preventDefault();
        if (event.ctrlKey) this.editor?.props.handleUndo();
        break;
      case 'y':
        event.preventDefault();
        if (event.ctrlKey) this.editor?.props.handleRedo();
        break;
      case 'v':
        if (!rootStore.review.selectedReview) {
          event.preventDefault();
          if (event.ctrlKey) {
            this.editor?.props.setReview();
          }
        }
        break;
      default:
    }
  };

  QaOnKeyDown = (event: KeyboardEvent, key: string) => {
    if (this.editor?.props.readonly) return;
    switch (key) {
      case '2':
        event.preventDefault();
        this.handleQa(ReviewResult.REJECT);
        break;
      case '1':
        event.preventDefault();
        this.handleQa(ReviewResult.APPROVE);
        break;
      case '3':
        event.preventDefault();
        this.handleQa(ReviewResult.SUSPEND);
        break;
      default:
    }
  };

  drawOnKeyDown = (event: KeyboardEvent, key: string) => {
    if (this.editor?.props.readonly) return;
    switch (key) {
      case 'delete':
      case 'backspace':
        event.preventDefault();
        this.editor?.deleteSelectedPoints();
        this.editor?.deleteSelectedRectangle();
        break;
      // case 'a':
      //   event.preventDefault();
      //   this.editor?.autoAdjust();
      //   break;
      // case 'c':
      //   event.preventDefault();
      //   this.editor?.switchSmoothMode();
      //   break;
      case 'o':
        event.preventDefault();
        this.editor?.props.editShapeForm();
        break;
      case 'p':
        event.preventDefault();
        this.editor?.props.editGroupForm();
        break;
      // case 'r':
      //   event.preventDefault();
      //   this.editor?.setCategoryAsCircle();
      //   break;
      // case 'v':
      //   event.preventDefault();
      //   this.editor?.toggleSelectedPointVisibility();
      //   break;
      default:
    }
  };
};
