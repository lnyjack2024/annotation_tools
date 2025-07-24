import React, { useState, useEffect } from 'react';
import cx from 'classnames';
import { Empty } from 'antd';
import Sidebar from './Sidebar';
import { CategoryItem, CategoryPathShape, Point, LandmarkEditType, ShapeInfo } from '../types';
import { OntologyChild } from '../store/OntologyStore';
import { InstanceReviewsMap, PointReviewResult } from '../store/ReviewsStore';
import RectangleFillIcon from '../../common/icons/RectangleFill';
import KeypointsIcon from '../../common/icons/Keypoints';
import DownArrow from '../../common/icons/DownArrow';
import formatMessage from '../locales';
import './Board.scss';

interface Props {
  categories: CategoryItem[];
  categoryPathShapes: {[categoryKey: string]: CategoryPathShape};
  points: {
    [index: number]: Point;
  };
  selectedShapeStatus: ShapeInfo | undefined;
  ontologyGroup?: OntologyChild;
  annotated: number | null;
  total: number | null;
  drawMode: boolean;
  frameControlHeight: number;
  readonly: boolean;
  instanceReviewsMap?: InstanceReviewsMap;
  setSelectedShape: (point: number) => void;
}

const Board = ({
  categories = [],
  categoryPathShapes = {},
  points = {},
  selectedShapeStatus,
  ontologyGroup,
  annotated,
  total,
  drawMode,
  frameControlHeight,
  readonly,
  instanceReviewsMap,
  setSelectedShape,
}: Props) => {
  const [sampleUnfold, setSampleUnfold] = useState(false);
  const [reference, setReference] = useState<string|undefined>('');
  const [isPoint, setIsPoint] = useState<boolean>(false);
  useEffect(() => {
    if (ontologyGroup && selectedShapeStatus) {
      if (selectedShapeStatus.shapeType === LandmarkEditType.RECTANGLE) {
        setReference(ontologyGroup.reference || '');
      } else if (selectedShapeStatus.shapeType === LandmarkEditType.KEYPOINT) {
        const { id } = selectedShapeStatus;
        const pointCategory = categories.find((v) => (id as number) >= v.range[0] && (id as number) <= v.range[1]);
        setReference(pointCategory?.reference || '');
      }
      setIsPoint(ontologyGroup.type === LandmarkEditType.KEYPOINT);
    }
  }, [ontologyGroup, selectedShapeStatus, categories]);

  return (
    <div className="board-container">
      <div className={cx('sample', { unfold: sampleUnfold })}>
        <div className="sample-label" onClick={() => { setSampleUnfold(!sampleUnfold); }}>
          <span>Sample</span>
          <span className={cx('sample-label-arrow', { unfold: sampleUnfold })}>
            <DownArrow />
          </span>
        </div>
        <div
          className="reference-box"
          style={{
            height: sampleUnfold ? `calc(30vh - ${frameControlHeight / 3}px)` : 0
          }}
        >
          {reference ? <img src={reference} className="reference" alt="" /> : <Empty style={{ marginTop: '100px' }} description="" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
          <p className="hint">
            {
              isPoint && selectedShapeStatus?.id !== undefined ?
                `${formatMessage('IS_DRAWING_POINT')}:  ${selectedShapeStatus?.id}` :
                ''
            }
          </p>
        </div>
      </div>
      <div className="mark">
        <div className="group-label">
          <div className="left">
            <span className={cx('group-icon', { active: drawMode })}>
              {isPoint ? <KeypointsIcon /> : <RectangleFillIcon /> }
            </span>
            <span>{ontologyGroup?.name}</span>
          </div>
          <div className="right">
            {annotated}
            /
            {total}
          </div>
        </div>
        {isPoint && selectedShapeStatus && (
          <div
            className="group-mark"
            style={{
              height: `calc(60vh - ${frameControlHeight}px)`
            }}
          >
            <Sidebar
              categories={categories}
              selectedShapeStatus={selectedShapeStatus}
              categoryPathShapes={categoryPathShapes}
              points={points}
              selectedPoint={selectedShapeStatus.id as number}
              readonly={readonly}
              groupReviewsMap={instanceReviewsMap?.[selectedShapeStatus.instanceId]?.[selectedShapeStatus.groupName] as PointReviewResult | undefined}
              setSelectedPoint={setSelectedShape}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Board;
