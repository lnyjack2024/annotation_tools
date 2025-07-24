import React, { useState } from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import ValidationPanel from '../validationPanel';
import store from '../../store/RootStore';
import localMessage from '../../locale';
import Toolbar from '../toolBar';
import './Sidebar.scss';

enum TabKey {
  INSTANCE = 'instance',
  VALIDATION ='validation',
}

interface Props {
  showReview?: boolean;
  onClick?: any;
  reviewResult?: any;
  configMap?: any;
  currentBrush?: any;
  inputEnable?: boolean;
  setCurrentBrush: any;
  items: any;
  contentReadyOnly?: boolean;
}
const Sidebar = observer((props: Props) => {
  const [activeTab, setActiveTab] = useState(TabKey.INSTANCE);
  return (
    <div className="sidebar">
      <div className="tab-header">
        <div
          className={cx({ active: activeTab === TabKey.INSTANCE })}
          onClick={() => setActiveTab(TabKey.INSTANCE)}
        >
          {localMessage('SIDEBAR_INSTANCE_LABEL')}
        </div>

        <div
          className={cx({ active: activeTab === TabKey.VALIDATION })}
          onClick={() => setActiveTab(TabKey.VALIDATION)}
        >
          {localMessage('SIDEBAR_VALIDATION_LABEL')}
          {store && store.validation && store.validation.warningCount > 0 && (
            <div className="count-alert">{store.validation.warningCount}</div>
          )}
        </div>
      </div>
      <div className="tab-content">
        {activeTab === TabKey.INSTANCE && (
          <Toolbar
            {...props}
          />
        )}
        {activeTab === TabKey.VALIDATION && <ValidationPanel />}
      </div>
    </div>
  );
});

export default Sidebar;
