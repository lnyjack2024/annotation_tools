import React, { useState } from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import './Sidebar.scss';

enum TabKey {
  ATTRIBUTE = 'attribute',
  VALIDATION = 'validation',
}

interface FragmentProps {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

interface Props {
  children: React.ReactNode[];
  panelNames: string[];
  warningCount?: number;
}

const Sidebar = observer(({ panelNames, children, warningCount }: Props) => {
  const [activeTab, setActiveTab] = useState(TabKey.ATTRIBUTE);
  return (
    <div className="sidebar">
      <div className="tab-header">
        <div
          className={cx({ active: activeTab === TabKey.ATTRIBUTE })}
          onClick={() => setActiveTab(TabKey.ATTRIBUTE)}
        >
          {panelNames[0]}
        </div>

        <div
          className={cx({ active: activeTab === TabKey.VALIDATION })}
          onClick={() => setActiveTab(TabKey.VALIDATION)}
        >
          {panelNames[1]}
          {(warningCount && warningCount > 0) ? (
            <div className="count-alert">
              {warningCount}
            </div>
          ) : ''}
        </div>
      </div>
      <div className="tab-content">
        {activeTab === TabKey.ATTRIBUTE && (
          <>
            {children?.[0]}
          </>
        )}
        {activeTab === TabKey.VALIDATION && (
          <>
            {children?.[1]}
          </>
        )}
      </div>
    </div>
  );
});

export default Sidebar;

export const AttributePanel = ({ className, style, children }: FragmentProps) => (
  <div
    className={cx('llm-side-attribute-panel', className)}
    style={style}
  >
    {children}
  </div>
);
