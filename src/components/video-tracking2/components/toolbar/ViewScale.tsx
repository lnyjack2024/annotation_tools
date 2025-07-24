import React, { useState, useEffect } from 'react';
import { reaction } from 'mobx';
import { observer } from 'mobx-react';
import cx from 'classnames';
import { Tooltip } from 'antd';
import { MinusCircleFilled, PlusCircleFilled, Aim } from '../../../common/icons';
import store from '../../store/RootStore';
import i18n from '../../locales';

interface ViewScaleProps {
  onViewReset: () => void;
  setViewScale: (scale: number) => void;
}

const ViewScale = observer(({ onViewReset, setViewScale }: ViewScaleProps) => {
  const [scale, setScale] = useState('');

  useEffect(() => {
    // set initial scale
    setScale(`${store.config.viewScale.toFixed(2)}x`);
    // watch changes
    const reactionDisposer = reaction(
      () => store.config.viewScale,
      (viewScale) => {
        setScale(`${viewScale.toFixed(2)}x`);
      },
    );
    return () => {
      reactionDisposer();
    };
  }, []);

  const handleScaleChange = () => {
    const scaleValue = parseFloat(scale);
    if (!Number.isNaN(scaleValue)) {
      setViewScale(scaleValue);
    }
  };

  const { viewScale } = store.config;
  const disabled = !store.initialized;
  return (
    <>
      <div className="view-scale">
        <Tooltip placement="bottom" title={i18n.translate('TOOLBAR_TIP_ZOOM_OUT')}>
          <div
            className={cx('operation-icon', {
              'operation-icon--disabled': disabled,
            })}
            onClick={() => setViewScale(viewScale / 2)}
          >
            <MinusCircleFilled />
          </div>
        </Tooltip>
        <input
          disabled={disabled}
          value={scale}
          onChange={(e) => setScale(e.target.value)}
          onBlur={handleScaleChange}
          onKeyUp={(e) => {
            if (e.key === 'Enter') {
              handleScaleChange();
            }
          }}
        />
        <Tooltip placement="bottom" title={i18n.translate('TOOLBAR_TIP_ZOOM_IN')}>
          <div
            className={cx('operation-icon', {
              'operation-icon--disabled': disabled,
            })}
            onClick={() => setViewScale(viewScale * 2)}
          >
            <PlusCircleFilled />
          </div>
        </Tooltip>
      </div>
      <Tooltip placement="bottom" title={i18n.translate('TOOLBAR_TIP_CENTER')}>
        <div
          className={cx('operation-icon', {
            'operation-icon--disabled': disabled,
          })}
          onClick={onViewReset}
        >
          <Aim />
        </div>
      </Tooltip>
    </>
  );
});

export default ViewScale;
