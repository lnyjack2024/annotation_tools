import React from 'react';
import cx from 'classnames';
import { observer } from 'mobx-react';
import formatMessage from '../locales';
import { CategoryItem, CategoryPathShape, Point, ShapeInfo } from '../types';
import './Sidebar.scss';
import rootStore from '../store/RootStore';
import { PointReviewResult } from '../store/ReviewsStore';

interface Props {
  categories: CategoryItem[];
  selectedShapeStatus: ShapeInfo | undefined;
  categoryPathShapes: {[categoryKey: string]: CategoryPathShape};
  points: {
    [index: number]: Point;
  };
  selectedPoint: number;
  readonly: boolean;
  groupReviewsMap?: PointReviewResult;
  setSelectedPoint: (point: number) => void;
}

const SideBar = ({
  categories = [],
  selectedShapeStatus,
  categoryPathShapes = {},
  points = {},
  selectedPoint,
  readonly,
  groupReviewsMap,
  setSelectedPoint,
}: Props) => {
  const renderCategory = (pointCategory: CategoryItem) => {
    const { name, range = [], keys = [] } = pointCategory;
    if (range.length < 2) {
      return null;
    }
    const allPoints = Array.from({ length: range[1] - range[0] + 1 }).map((_, index) => range[0] + index);
    return (
      <div key={name} className="pointCategory">
        <div className="name">
          {name}
          {categoryPathShapes[`${selectedShapeStatus?.frameIndex}_${selectedShapeStatus?.instanceId}_${selectedShapeStatus?.groupName}_${name}`] === CategoryPathShape.CIRCLE ? `(${formatMessage('CATEGORY_CIRCLE')})` : ''}
        </div>
        <div className="points-container">
          {allPoints.map((p) => (
            <div
              key={p}
              className={cx('point-box', groupReviewsMap && groupReviewsMap[p])}
            >
              <div
                className={cx('point', {
                  'point--key': keys.includes(p),
                  'point--empty': !points[p] || !points[p].position,
                  'point--selected': p === selectedPoint || (rootStore.shape.selectedShapes as number[]).includes(p),
                  'point--invisible': points[p] && points[p].visible === false,
                  'point--disabeld': !rootStore.review.drawMode && (!points[p] || !points[p].position),
                })}
                onClick={() => {
                  if (!readonly) {
                    // Empty point cannot be clicked in non-drawing mode
                    if (!rootStore.review.drawMode && (!points[p] || !points[p].position)) return;
                    setSelectedPoint(p);
                  }
                }}
              >
                {p}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="sidebar">
      {categories.map((c) => renderCategory(c))}
    </div>
  );
};

export default observer(SideBar);
