import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import { CaretRightFilled } from '@ant-design/icons';
import ToolIcon from './ToolIcon';
import ToolName from './ToolName';
import store from '../../store/RootStore';
import { CategoryItem } from '../../types';

interface ToolItemProps {
  categoryItem: CategoryItem;
  index: number;
  collapsed: boolean;
  displayName: string;
}

const ToolItem = observer(({ categoryItem, index, collapsed, displayName }: ToolItemProps) => {
  const menu = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const clickListener = (e: MouseEvent) => {
      if (!menu.current?.contains(e.target as HTMLElement)) {
        setVisible(false);
      }
    };
    window.addEventListener('mousedown', clickListener);
    return () => {
      window.removeEventListener('mousedown', clickListener);
    };
  }, []);

  const { name, tools } = categoryItem;
  const selected = name === store.ontology.selectedCategoryItemName;
  const tool = selected ? store.ontology.currentToolItem! : tools[0];
  return (
    <div
      className={cx('create-tool-tool-item', {
        selected,
        active: selected && store.config.addMode,
      })}
      onClick={() => store.ontology.activateCategoryItem(name, tool)}
      onContextMenu={(e) => {
        e.preventDefault();
        store.ontology.activateCategoryItem(name, tool);
        if (tools.length > 1) {
          setVisible(true);
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="create-tool-tool-item__label">
        <span className="create-tool-tool-item__shortcut">
          {index < 10 && (
            <>{index === 9 ? 0 : index + 1}</>
          )}
        </span>
        <span className="create-tool-tool-item__icon tool-icon">
          <ToolIcon tool={tool.type} />
        </span>
        {!collapsed && (
          <span className="create-tool-tool-item__name">
            {displayName}
          </span>
        )}
      </div>
      <div className="create-tool-tool-item__more">
        {tools.length > 1 && !collapsed && (
          <CaretRightFilled style={{ marginLeft: 4 }} onClick={() => setVisible(true)} />
        )}
      </div>
      {tools.length > 1 && visible && (
        <div ref={menu} className="create-tool-tool-item__menu">
          {tools.map((t) => (
            <div
              key={t.type}
              className={cx('create-tool-tool-item__menu-item', {
                selected: t === store.ontology.currentToolItem,
              })}
              onClick={(e) => {
                e.stopPropagation();
                store.ontology.selectTool(t);
                setVisible(false);
              }}
            >
              <span className="create-tool-tool-item__menu-item-icon tool-icon">
                <ToolIcon tool={t.type} />
              </span>
              <ToolName tool={t.type} />
            </div>
          ))}
        </div>
      )}
      {collapsed && !visible && hovered && (
        <div className="create-tool-tool-item__tip">{name}</div>
      )}
    </div>
  );
});

export default ToolItem;
