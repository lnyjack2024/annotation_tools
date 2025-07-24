import React, { useCallback } from 'react';
import { observer } from 'mobx-react';
import hexToRgba from 'hex-to-rgba';
import { CaretDownOutlined } from '@ant-design/icons';
import SidebarInstance from './SidebarInstance';
import store from '../../store/RootStore';
import { Category } from '../../types';

interface SidebarCategoryProps {
  category: Category;
  collapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
}

const SidebarCategory = observer(({ category, collapsed, onCollapseChange }: SidebarCategoryProps) => {
  const selectCategory = useCallback(() => {
    store.ontology.selectCategory(category.className);
  }, []);

  const collapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCollapseChange(!collapsed);
  };

  const { className, displayName, displayColor } = category;
  const isSelected = store.ontology.selectedCategoryName === className;
  const instances = store.instance.categoryInstancesMap[className];
  const isEmpty = !instances || instances.length <= 0;
  return (
    <div className="sidebar-category">
      <div
        className="sidebar-category-title"
        style={{
          backgroundColor: isSelected ? hexToRgba(displayColor || '#FFFFFF', 0.2) : '#3D424D',
        }}
        onClick={selectCategory}
      >
        <span>
          <div
            className="sidebar-category-title__dot"
            style={{ backgroundColor: displayColor }}
          />
          <div style={{ flex: 1 }}>
            {displayName}
          </div>
        </span>
        <span>
          {!isEmpty && (
            <span className="sidebar-category-title__count">
              {instances.length}
            </span>
          )}
          <span className="sidebar-category-action">
            <CaretDownOutlined
              className="sidebar-category-icon"
              style={{
                transform: collapsed ? 'rotate(-90deg)' : '',
                transition: 'transform 0.2s',
              }}
              onClick={collapse}
            />
          </span>
        </span>
      </div>
      {!collapsed && !isEmpty && (
        <div
          className="sidebar-category-content"
        >
          {instances.map((instance) => (
            <SidebarInstance key={instance.id} instance={instance} />
          ))}
        </div>
      )}
    </div>
  );
});

export default SidebarCategory;
