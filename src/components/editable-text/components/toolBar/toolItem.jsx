import React, { useMemo } from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import hexToRgba from 'hex-to-rgba';
import { MissingIcon } from '../../../common/icons';
import { TAG, ReviewMode } from '../../types';
import KeysTransform from './const';
import { generateConfigKeyByKeys } from '../../utils/helper';
import { isQATag } from '../../store/tag_mode';

const ToolItem = observer(({ ontologyItem, setCurrentBrush, currentBrush, ontologiesStatusMap, showReview, reviewable, isRework, reviewMode, type }) => {
  const isSelected = useMemo(() => currentBrush && generateConfigKeyByKeys(ontologyItem.keys) === generateConfigKeyByKeys(currentBrush.keys), [currentBrush, ontologyItem]);
  const statusInfo = useMemo(() => {
    const statusItem = ontologiesStatusMap?.get(generateConfigKeyByKeys(ontologyItem.keys));
    if (!statusItem) {
      return {
        tagCount: undefined,
        rejectCount: undefined
      };
    }
    if (statusItem.isCollapse) {
      return {
        tagCount: statusItem.tagCountContainChildren,
        rejectCount: statusItem.rejectCountContainChildren
      };
    }
    return {
      tagCount: statusItem.tagCount,
      rejectCount: statusItem.rejectCount
    };
  }, [ontologiesStatusMap, ontologyItem]);

  return (
    <div
      className={cx('tool-item', { selected: isSelected })}
      style={{ backgroundColor: isSelected && ontologyItem.color ? hexToRgba(ontologyItem.color, 0.3) : '#4C5366' }}
      onClick={() => {
        if ((reviewable || isRework) && isQATag(ontologyItem.type) && reviewMode !== ReviewMode.REVIEW) {
          return;
        }
        setCurrentBrush(ontologyItem);
      }}
    >
      <div className="tool-item-left">
        {KeysTransform[type] === TAG.LABEL_QA ?
          (<span className="tool-item-left-icon"><MissingIcon /></span>) :
          (<span className="tool-item-left-color" style={{ background: ontologyItem.color }} />)}
        <span className="tool-item-left-text">
          {' '}
          {ontologyItem.displayName || ontologyItem.text}
        </span>
      </div>
      {statusInfo && (
      <div className="tool-item-right">
        {
          showReview && !isQATag(ontologyItem.type) && statusInfo.rejectCount
            ? (
              <>
                <span className="tool-count-reviewed">
                  {statusInfo.rejectCount}
                </span>
                /
              </>
            )
            : null
        }

        {statusInfo.tagCount }
      </div>
      )}
    </div>
  );
});

export default ToolItem;
