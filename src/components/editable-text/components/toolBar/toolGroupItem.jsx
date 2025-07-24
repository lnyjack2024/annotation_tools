import React, { useMemo } from 'react';
import cx from 'classnames';
import { PlusSquareOutlined, MinusSquareOutlined } from '@ant-design/icons';
import { observer } from 'mobx-react';
import { generateConfigKeyByKeys } from '../../utils/helper';
import ToolItem from './toolItem';

const ToolGroupItem = observer(({ ontologyItem, ontologiesStatusMap, updateOntologiesCollapseStatus, customClassName = '', isChild = false, deep = 1, needBorderLeft = false, isLast = false, ...restProps }) => {
  const isLeaf = useMemo(() => !(ontologyItem.children && ontologyItem.children.length > 0), [ontologyItem]);
  const isCollapsed = useMemo(() => {
    const configKey = generateConfigKeyByKeys(ontologyItem.keys);
    return ontologiesStatusMap.get(configKey)?.isCollapse ?? true;
  },
  [ontologiesStatusMap, ontologyItem]);

  return (
    <div className={cx('tool-group-item', customClassName)}>
      <div className="tool-item-wrapper">
        {isChild && (
          <div className={cx('connecting-line', { isLast })}>
            <span className="connecting-line-l" />
          </div>
        )}
        <div className="tool-item-content" style={{ marginLeft: isChild ? 6 : 0 }}>
          {!isLeaf && (
            <div className="indent">
              {isCollapsed ? (
                <div
                  onClick={() => {
                    updateOntologiesCollapseStatus(ontologyItem.keys, false);
                  }}
                >
                  <PlusSquareOutlined />
                </div>
              ) : (
                <div
                  className={cx('indent-expand-icon', { isChild })}
                  onClick={() => {
                    updateOntologiesCollapseStatus(ontologyItem.keys, true);
                  }}
                >
                  <MinusSquareOutlined />
                </div>
              )}
            </div>
          )}

          {isChild && isLeaf && (
          <div className="indent">
            <div className="line" />
          </div>
          )}
          <ToolItem ontologyItem={ontologyItem} ontologiesStatusMap={ontologiesStatusMap} {...restProps} />
        </div>
      </div>
      { !isCollapsed && ontologyItem.children && ontologyItem.children.length > 0 && (
        <div className={cx('tool-item-wrapper-children', { 'need-border-left': needBorderLeft })} style={{ paddingLeft: 6 * Math.min(2, deep) }}>
          {
            ontologyItem.children.map((ontologyChild, index) => (
              <ToolGroupItem
                isChild
                isLast={index + 1 === ontologyItem.children.length}
                customClassName="tool-group-item-child"
                deep={deep + 1}
                needBorderLeft={index < ontologyItem.children.length - 1}
                ontologyItem={ontologyChild}
                key={generateConfigKeyByKeys(ontologyChild.keys)}
                ontologiesStatusMap={ontologiesStatusMap}
                updateOntologiesCollapseStatus={updateOntologiesCollapseStatus}
                {...restProps}
              />
            ))
          }
        </div>
      )}
    </div>
  );
});
export default ToolGroupItem;
