import React from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import Dropdown from '../../../common/dropdown/Dropdown';
import ToolIcon from './ToolIcon';
import store from '../../store/RootStore';
import i18n from '../../locales';
import { CategoryItem } from '../../types';
import './CreateToolSelector.scss';

const ToolItem = observer(({ categoryItem, index, displayName }: {
  categoryItem: CategoryItem;
  index: number;
  displayName: string;
}) => {
  const { name, tools } = categoryItem;
  const selected = name === store.ontology.selectedCategoryItemName;
  const tool = selected ? store.ontology.currentToolItem! : tools[0];
  return (
    <div className="create-tool-tool-item__label">
      <span className="create-tool-tool-item__shortcut">
        {index < 10 && (
          <>{index === 9 ? 0 : index + 1}</>
        )}
      </span>
      <span className="create-tool-tool-item__icon tool-icon">
        <ToolIcon tool={tool.type} />
      </span>
      <span className="create-tool-tool-item__name">
        {displayName}
      </span>
    </div>
  );
});

const CreateToolSelector = observer(() => {
  const { selectedCategory, selectedCategoryItemName } = store.ontology;
  const { children = [] } = selectedCategory || {};
  if (store.readonly || children.length <= 0) {
    return null;
  }

  const isSingle = children.length === 1 && children[0].count === 1;
  const selectedIndex = children.findIndex((i) => i.name === selectedCategoryItemName);
  const menu = children.map((c, index) => ({
    label: c.name,
    active: c.name === selectedCategoryItemName,
    render: () => (
      <ToolItem
        categoryItem={c}
        index={index}
        displayName={isSingle ? selectedCategory.displayName : c.displayName}
      />
    ),
  }));
  return (
    <div className="create-tool">
      {i18n.translate('COMMON_CREATE')}
      <span onClick={() => store.config.setAddMode(true)}>
        <Dropdown
          className={cx('create-tool-selector', {
            active: store.config.addMode,
          })}
          arrow
          triggerArea="arrow"
          menu={menu}
          onClick={(name, index) => store.ontology.activateCategoryItem(name, children[index].tools[0])}
        >
          {menu[selectedIndex]?.render()}
        </Dropdown>
      </span>
    </div>
  );
});

export default CreateToolSelector;
