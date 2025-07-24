import React, { useState } from 'react';
import { observer } from 'mobx-react';
import { Collapse } from 'antd';
import { CaretRightOutlined } from '@ant-design/icons';
import cx from 'classnames';
import i18n from '../../locales';
import ValidationItem from './ValidationItem';
import { Warning, Sync } from '../../../common/icons';
import store from '../../store';
import { ValidationType } from '../../types';

const ValidationPanel = observer(() => {
  const [activeKey, setActiveKey] = useState<ValidationType | ValidationType[]>([ValidationType.SCRIPT]);
  const titles = {
    [ValidationType.SCRIPT]: i18n.translate('VALIDATION_TYPE_SCRIPT'),
  };
  const renderWarnings = (type: ValidationType) => {
    const warnings = store.validation?.warnings.filter((w) => w.type === type);
    if (!warnings || warnings.length <= 0) {
      return null;
    }
    return (
      <Collapse.Panel
        key={type}
        header={titles[type]}
        extra={(
          <div>
            <span className="result-count">
              {warnings.length}
            </span>
          </div>
        )}
      >
        {warnings.map((warning) => <ValidationItem key={warning.id} warning={warning} />)}
      </Collapse.Panel>
    );
  };
  return (
    <div className="scroller">
      <div className="sidebar-validation-header">
        <div>
          <Warning />
          <span style={{ paddingLeft: 8 }}>
            {i18n.translate('VALIDATION_TITLE', { values: { count: store.validation?.warningCount } })}
          </span>
        </div>
        <div>
          <div
            className={cx('icon-button', {
              spinning: store.validation?.checking,
            })}
            onClick={store.validation?.sync}
          >
            <Sync />
          </div>
        </div>
      </div>
      <div className="sidebar-validation-content">
        <Collapse
          activeKey={activeKey}
          onChange={(activeKeys) => setActiveKey(activeKeys as (ValidationType | ValidationType[]))}
          ghost
          expandIcon={({ isActive }) => (
            <CaretRightOutlined
              style={{
                ...isActive ? {
                  top: 11,
                  transform: 'rotate(90deg)',
                  color: 'rgba(0, 0, 0, 0.6)',
                } : {
                  color: 'rgba(0, 0, 0, 0.4)',
                },
              }}
            />
          )}
        >
          {Object.values(ValidationType).map((type) => renderWarnings(type))}
        </Collapse>
      </div>

    </div>
  );
});

export default ValidationPanel;
