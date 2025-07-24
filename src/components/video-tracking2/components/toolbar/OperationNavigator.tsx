import React from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import { Tooltip } from 'antd';
import { Pointer, LayerUp, LayerDown, Merge, Subtract } from '../../../common/icons';
import CreateToolSelector from '../tools/CreateToolSelector';
import ReviewToolSelector from '../review/ReviewToolSelector';
import ViewScale from './ViewScale';
import store from '../../store/RootStore';
import i18n from '../../locales';
import { ShapeType } from '../../../common/shapes/types';
import './OperationNavigator.scss';

interface OperationNavigatorProps {
  onViewReset: () => void;
  setViewScale: (scale: number) => void;
}

const OperationNavigator = observer(({ onViewReset, setViewScale }: OperationNavigatorProps) => {
  const { addMode } = store.config;
  const { isSingleSelected } = store.instance;
  const { selectedShapes } = store.shape;
  const isSingle = isSingleSelected && selectedShapes.length === 1;
  const selectedShape = isSingle ? selectedShapes[0] : undefined;
  const isPolygon = selectedShape?.shapeType === ShapeType.POLYGON;
  return (
    <div className="operation-navigator">
      <div>
        <div
          className={cx('operation-icon pointer', {
            active: !addMode,
          })}
          onClick={() => {
            if (addMode) {
              store.config.setAddMode(false);
            }
          }}
        >
          <Pointer />
        </div>
        <div className="divider" />
        <CreateToolSelector />
        <ReviewToolSelector />
        <div className="divider" />
        {!store.readonly && !addMode && isSingle && (
          <>
            {isPolygon && (
              <>
                <Tooltip placement="bottom" title={i18n.translate('OPERATION_SHAPE_MERGE')}>
                  <div
                    className="operation-icon"
                    onClick={store.shape.merge}
                  >
                    <Merge />
                  </div>
                </Tooltip>
                <Tooltip placement="bottom" title={i18n.translate('OPERATION_SHAPE_SUBTRACT')}>
                  <div className="operation-icon" onClick={store.shape.subtractPolygon}>
                    <Subtract />
                  </div>
                </Tooltip>
              </>
            )}
            <Tooltip placement="bottom" title={i18n.translate('OPERATION_SHAPE_UP')}>
              <div className="operation-icon" onClick={() => store.moveFront()}>
                <LayerUp />
              </div>
            </Tooltip>
            <Tooltip placement="bottom" title={i18n.translate('OPERATION_SHAPE_DOWN')}>
              <div className="operation-icon" onClick={() => store.moveBack()}>
                <LayerDown />
              </div>
            </Tooltip>
          </>
        )}
      </div>
      <div>
        <ViewScale onViewReset={onViewReset} setViewScale={setViewScale} />
      </div>
    </div>
  );
});

export default OperationNavigator;
