import React from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import { Tooltip } from 'antd';
import Dropdown from '../../../common/dropdown/Dropdown';
import { Measurement } from '../../../common/icons';
import store from '../../store/RootStore';
import i18n from '../../locales';

const MeasurementBox = observer(() => {
  const { measurementBoxList, activeMeasurementBoxIndex, setMeasurementBoxIndex } = store.config;
  if (!measurementBoxList) {
    return null;
  }
  const measurements = measurementBoxList ? [i18n.translate('COMMON_HIDE'), ...measurementBoxList.map((box) => `${box[0]}*${box[1]}px`)] : [];
  return (
    <>
      <div
        className={cx('icon-button', {
          'icon-button--active': activeMeasurementBoxIndex >= 0,
        })}
        style={{
          backgroundColor: '#343846',
          height: 24,
          paddingLeft: 4,
          borderRadius: '2px 0 0 2px',
        }}
      >
        <Measurement />
      </div>
      <Dropdown
        arrow
        style={{
          background: '#343846',
          height: 24,
          paddingRight: 4,
          borderRadius: '0 2px 2px 0',
        }}
        menu={measurements.map((m, i) => ({ label: m, active: i - 1 === activeMeasurementBoxIndex }))}
        onClick={(_, index) => setMeasurementBoxIndex(index - 1)}
      >
        <Tooltip placement="bottom" title={i18n.translate('TOOLBAR_TIP_MEASUREMENTS')}>
          <div style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
            {measurements[activeMeasurementBoxIndex + 1]}
          </div>
        </Tooltip>
      </Dropdown>
    </>
  );
});

export default MeasurementBox;
