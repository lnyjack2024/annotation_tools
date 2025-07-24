import React, { useState } from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import { CaretLeftOutlined } from '@ant-design/icons';
import ToolItem from './ToolItem';
import store from '../../store/RootStore';
import i18n from '../../locales';
import './CreateTool.scss';

const CreateTool = observer(() => {
  const [collapsed, setCollapsed] = useState(false);

  const collapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsed(!collapsed);
  };

  const { selectedCategory } = store.ontology;
  const { children = [] } = selectedCategory || {};
  if (store.readonly || children.length <= 0) {
    return null;
  }
  const isSingle = children.length === 1 && children[0].count === 1;
  return (
    <div
      className="create-tool panel"
      style={{
        minWidth: collapsed ? 44 : 108,
      }}
    >
      <div
        className={cx('create-tool-title', {
          collapsed,
        })}
      >
        {!collapsed && (
          <span>
            {i18n.translate('COMMON_CREATE')}
          </span>
        )}
        <CaretLeftOutlined
          className="create-tool-title__icon"
          style={{
            transform: collapsed ? 'rotate(180deg)' : '',
          }}
          onClick={collapse}
        />
      </div>
      <div className="create-tool-tools">
        {children.map((c, index) => (
          <ToolItem
            key={c.name}
            categoryItem={c}
            index={index}
            collapsed={collapsed}
            displayName={isSingle ? selectedCategory.displayName : c.name}
          />
        ))}
      </div>
    </div>
  );
});

export default CreateTool;
