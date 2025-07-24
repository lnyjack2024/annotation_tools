import React, { useState } from 'react';
import { Tabs, Badge } from 'antd';
import './TabMenu.scss';

const { TabPane } = Tabs;

interface Tab {
  title: string;
  key: string;
  count: number;
  content: JSX.Element | null;
}

interface TabMenuProps {
  tabs: Tab[]
}

const TabMenu = (props: TabMenuProps) => {
  const { tabs } = props;

  const [activeTab, setActiveTab] = useState(tabs[0] ? tabs[0].key : '');

  const onActiveTabChange = (key: string) => {
    setActiveTab(key);
  };

  return (
    <Tabs
      className="tab-container"
      activeKey={activeTab}
      onChange={onActiveTabChange}
    >
      {tabs.map((tab) => (
        <TabPane
          forceRender
          tab={(
            <Badge count={tab.count} size="small">{tab.title}</Badge>
          )}
          key={tab.key}
        >
          {tab.content}
        </TabPane>
      ))}
    </Tabs>
  );
};

export default TabMenu;
