import React, { useState, useMemo } from 'react';
import { observer } from 'mobx-react';
import cx from 'classnames';
import { CaretLeftOutlined } from '@ant-design/icons';
import { ReviewApprove, ReviewReject, ReviewSuspend } from '../../../common/icons';
import store from '../../store/RootStore';
import i18n from '../../locales';
import { ReviewMode, ReviewResult } from '../../types';

const ReviewTool = observer(() => {
  const types = useMemo(() => store.review.reviewResultTypes.map((type, index) => {
    let icon = <ReviewApprove />;
    let name = i18n.translate('REVIEW_APPROVE');
    if (type === ReviewResult.REJECT) {
      icon = <ReviewReject />;
      name = i18n.translate('REVIEW_REJECT');
    } else if (type === ReviewResult.SUSPEND) {
      icon = <ReviewSuspend />;
      name = i18n.translate('REVIEW_SUSPEND');
    }
    return { type, hotkey: index + 1, icon, name };
  }), [store.review.reviewResultTypes]);

  const [collapsed, setCollapsed] = useState(false);
  const [hoveredType, setHoveredType] = useState<ReviewResult | ''>('');

  const collapse = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsed(!collapsed);
  };

  if (!store.reviewable || store.config.reviewMode !== ReviewMode.REVIEW) {
    return null;
  }

  const { selectedReviewResultType, addMode, activateReview } = store.review;
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
        {types.map(({ type, hotkey, icon, name }) => (
          <div
            key={type}
            className={cx('create-tool-tool-item', {
              selected: selectedReviewResultType === type,
              active: selectedReviewResultType === type && addMode,
            })}
            onClick={() => activateReview(type)}
            onMouseEnter={() => setHoveredType(type)}
            onMouseLeave={() => setHoveredType('')}
          >
            <div className="create-tool-tool-item__label">
              <span className="create-tool-tool-item__shortcut">
                {hotkey}
              </span>
              <span className="create-tool-tool-item__icon tool-icon">
                {icon}
              </span>
              {!collapsed && (
                <span className="create-tool-tool-item__name">
                  {name}
                </span>
              )}
            </div>
            {collapsed && hoveredType === type && (
              <div className="create-tool-tool-item__tip">{name}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

export default ReviewTool;
