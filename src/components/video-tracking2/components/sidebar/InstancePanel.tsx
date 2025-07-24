import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import { DownOutlined } from '@ant-design/icons';
import SidebarCategory from './SidebarCategory';
import store from '../../store/RootStore';
import i18n from '../../locales';

const InstancePanel = observer(() => {
  const scroller = useRef<HTMLDivElement>(null);
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  useEffect(() => {
    setActiveCategories([store.ontology.selectedCategoryName]);
  }, [store.ontology.selectedCategoryName]);

  const toggleCollapse = () => {
    if (activeCategories.length > 0) {
      // collapse all
      setActiveCategories([]);
    } else {
      const { categories } = store.ontology;
      const firstCategory = categories[0];
      if (firstCategory) {
        setActiveCategories([firstCategory.className]);
        if (categories.length > 1) {
          // delay to set state to update layout
          categories.slice(1).forEach((c) => {
            setTimeout(() => {
              setActiveCategories((cs) => [...cs, c.className]);
            }, 0);
          });
        }
      }
    }
  };

  const allCollapsed = activeCategories.length === 0;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      <div className="collapse-all" onClick={toggleCollapse}>
        <span style={{ fontSize: 12, paddingRight: 4 }}>
          {i18n.translate(allCollapsed ? 'SIDEBAR_EXPAND_ALL' : 'SIDEBAR_COLLAPSE_ALL')}
        </span>
        <DownOutlined
          style={{
            transform: allCollapsed ? 'rotate(-90deg)' : '',
            transition: 'transform 0.2s',
          }}
        />
      </div>
      <div ref={scroller} className="scroller" style={{ flex: 1 }}>
        {store.ontology.categories.map((category) => (
          <SidebarCategory
            key={category.className}
            category={category}
            collapsed={!activeCategories.includes(category.className)}
            onCollapseChange={(collapsed) => {
              const { className } = category;
              setActiveCategories((currActiveCategories) => {
                if (collapsed) {
                  const newActiveCategories = [...currActiveCategories];
                  const index = newActiveCategories.indexOf(className);
                  if (index >= 0) {
                    newActiveCategories.splice(index, 1);
                  }
                  return newActiveCategories;
                }
                return [...currActiveCategories, className];
              });
            }}
          />
        ))}
      </div>
    </div>
  );
});

export default InstancePanel;
