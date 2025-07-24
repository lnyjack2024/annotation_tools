import React, { useState } from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import InstancePanel from './InstancePanel';
import ValidationPanel from './ValidationPanel';
import store from '../../store/RootStore';
import i18n from '../../locales';
import './Sidebar.scss';

enum Tabs {
  INSTANCE = 'instance',
  VALIDATION = 'validation',
}

const Sidebar = observer(() => {
  const [activeTab, setActiveTab] = useState(Tabs.INSTANCE);

  return (
    <div className="sidebar">
      <div className="tab-header">
        <div
          className={cx({ active: activeTab === Tabs.INSTANCE })}
          onClick={() => setActiveTab(Tabs.INSTANCE)}
        >
          {i18n.translate('SIDEBAR_INSTANCE_LABEL')}
        </div>
        <div
          className={cx({ active: activeTab === Tabs.VALIDATION })}
          onClick={() => setActiveTab(Tabs.VALIDATION)}
        >
          {i18n.translate('SIDEBAR_VALIDATION_LABEL')}
          {store.review.warningCount > 0 && (
            <div className="count-alert">{store.review.warningCount}</div>
          )}
        </div>
      </div>
      <div className="tab-content">
        {activeTab === Tabs.INSTANCE && <InstancePanel />}
        {activeTab === Tabs.VALIDATION && <ValidationPanel />}
      </div>
    </div>
  );
});

export default Sidebar;
