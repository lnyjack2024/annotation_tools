import React, { useState } from 'react';
import cx from 'classnames';
import InstancePanel from './InstancePanel';
import GlobalPanel from './GlobalPanel';
import i18n from '../../locales';
import './AttributesPanel.scss';

enum Tabs {
  INSTANCE = 'instance',
  GLOBAL = 'global',
}

const AttributesPanel = () => {
  const [activeTab, setActiveTab] = useState(Tabs.GLOBAL);

  return (
    <div className="attributes-panel">
      <div className="attributes-panel__title">
        {i18n.translate('ATTRIBUTES_PANEL_TITLE')}
      </div>
      <div className="tab-header">
        <div
          className={cx({ active: activeTab === Tabs.GLOBAL })}
          onClick={() => setActiveTab(Tabs.GLOBAL)}
        >
          {i18n.translate('ATTRIBUTES_GLOBAL_TITLE')}
        </div>
        <div
          className={cx({ active: activeTab === Tabs.INSTANCE })}
          onClick={() => setActiveTab(Tabs.INSTANCE)}
        >
          {i18n.translate('ATTRIBUTES_INSTANCE_TITLE')}
        </div>
      </div>
      <div className="tab-content scroller">
        <div className={cx('', { hidden: activeTab !== Tabs.GLOBAL })}>
          <GlobalPanel />
        </div>
        <div className={cx('', { hidden: activeTab !== Tabs.INSTANCE })}>
          <InstancePanel />
        </div>
      </div>
    </div>
  );
};

export default AttributesPanel;
